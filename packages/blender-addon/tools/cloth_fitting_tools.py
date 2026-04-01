"""
Cloth fitting tools for OpenForge MCP.

Tools for fitting clothing to avatar bodies, detecting and fixing clipping,
transferring weights, and adjusting clothing shape.
"""

from typing import Any, Dict, List, Optional

import bpy
import mathutils


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_object(name: str) -> bpy.types.Object:
    obj = bpy.data.objects.get(name)
    if obj is None:
        available = [o.name for o in bpy.data.objects]
        raise ValueError(
            f"Object '{name}' not found. Available objects: {available}"
        )
    return obj


def _get_mesh(name: str) -> bpy.types.Object:
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh (type: {obj.type})")
    return obj


def _ensure_object_mode() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def _select_only(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def auto_fit(
    clothing_name: str,
    body_name: str,
    offset: float = 0.001,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Automatically fit clothing to a body using shrinkwrap + offset.

    Parameters
    ----------
    clothing_name : str
        Clothing mesh to fit.
    body_name : str
        Body mesh to fit onto.
    offset : float
        Distance offset from body surface (in Blender units).
    """
    _ensure_object_mode()
    cloth_obj = _get_mesh(clothing_name)
    body_obj = _get_mesh(body_name)
    _select_only(cloth_obj)

    mod = cloth_obj.modifiers.new(name="AutoFit_Shrinkwrap", type="SHRINKWRAP")
    mod.target = body_obj
    mod.wrap_method = "NEAREST_SURFACEPOINT"
    mod.wrap_mode = "OUTSIDE_SURFACE"
    mod.offset = offset

    bpy.ops.object.modifier_apply(modifier=mod.name)

    return {
        "clothing": cloth_obj.name,
        "body": body_obj.name,
        "offset": offset,
        "vertex_count": len(cloth_obj.data.vertices),
    }


def add_shrinkwrap(
    clothing_name: str,
    body_name: str,
    wrap_method: str = "NEAREST_SURFACEPOINT",
    offset: float = 0.002,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a shrinkwrap modifier for surface-following.

    Parameters
    ----------
    clothing_name : str
        Clothing mesh.
    body_name : str
        Target body mesh.
    wrap_method : str
        NEAREST_SURFACEPOINT, PROJECT, or NEAREST_VERTEX.
    offset : float
        Surface offset distance.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    cloth_obj = _get_mesh(clothing_name)
    body_obj = _get_mesh(body_name)

    mod = cloth_obj.modifiers.new(name="ClothShrinkwrap", type="SHRINKWRAP")
    mod.target = body_obj
    mod.wrap_method = wrap_method
    mod.offset = offset
    if wrap_method == "NEAREST_SURFACEPOINT":
        mod.wrap_mode = "OUTSIDE_SURFACE"

    if apply:
        _select_only(cloth_obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)

    return {
        "clothing": cloth_obj.name,
        "body": body_obj.name,
        "modifier": mod.name if not apply else "(applied)",
        "wrap_method": wrap_method,
        "offset": offset,
    }


def add_surface_bind(
    clothing_name: str,
    body_name: str,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bind clothing to body surface using surface deform modifier.

    Parameters
    ----------
    clothing_name : str
        Clothing mesh.
    body_name : str
        Body mesh to bind to.
    apply : bool
        Apply the modifier after binding.
    """
    _ensure_object_mode()
    cloth_obj = _get_mesh(clothing_name)
    body_obj = _get_mesh(body_name)
    _select_only(cloth_obj)

    mod = cloth_obj.modifiers.new(name="SurfaceBind", type="SURFACE_DEFORM")
    mod.target = body_obj

    # Bind the modifier
    bpy.ops.object.surfacedeform_bind(modifier=mod.name)

    if apply:
        bpy.ops.object.modifier_apply(modifier=mod.name)

    return {
        "clothing": cloth_obj.name,
        "body": body_obj.name,
        "modifier": mod.name if not apply else "(applied)",
        "bound": True,
    }


def add_lattice_deform(
    clothing_name: str,
    resolution: Optional[List[int]] = None,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a lattice modifier for shaping clothing.

    Parameters
    ----------
    clothing_name : str
        Clothing mesh.
    resolution : list[int], optional
        Lattice resolution [U, V, W]. Defaults to [4, 4, 4].
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    cloth_obj = _get_mesh(clothing_name)

    res = resolution or [4, 4, 4]

    # Create lattice sized to clothing bounds
    bbox = [mathutils.Vector(v) for v in cloth_obj.bound_box]
    min_co = mathutils.Vector((
        min(v.x for v in bbox),
        min(v.y for v in bbox),
        min(v.z for v in bbox),
    ))
    max_co = mathutils.Vector((
        max(v.x for v in bbox),
        max(v.y for v in bbox),
        max(v.z for v in bbox),
    ))

    center = (min_co + max_co) / 2.0
    size = max_co - min_co

    # Transform to world space
    center = cloth_obj.matrix_world @ center

    lattice_data = bpy.data.lattices.new(name=f"{cloth_obj.name}_Lattice")
    lattice_data.points_u = res[0]
    lattice_data.points_v = res[1]
    lattice_data.points_w = res[2]

    lattice_obj = bpy.data.objects.new(lattice_data.name, lattice_data)
    bpy.context.collection.objects.link(lattice_obj)
    lattice_obj.location = center
    lattice_obj.scale = size * 1.1  # slight padding

    mod = cloth_obj.modifiers.new(name="LatticeDeform", type="LATTICE")
    mod.object = lattice_obj

    if apply:
        _select_only(cloth_obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)

    return {
        "clothing": cloth_obj.name,
        "lattice": lattice_obj.name,
        "resolution": res,
        "applied": apply,
    }


def adjust_offset(
    clothing_name: str,
    body_name: str,
    offset: float = 0.002,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Adjust clothing offset from body by pushing vertices along normals.

    Parameters
    ----------
    clothing_name : str
        Clothing mesh.
    body_name : str
        Body mesh (reference).
    offset : float
        Distance to push outward (negative = inward).
    """
    _ensure_object_mode()
    cloth_obj = _get_mesh(clothing_name)
    body_obj = _get_mesh(body_name)

    # For each clothing vertex, find nearest body surface and push outward
    depsgraph = bpy.context.evaluated_depsgraph_get()
    body_eval = body_obj.evaluated_get(depsgraph)
    body_inv = body_obj.matrix_world.inverted()

    adjusted_count = 0
    for v in cloth_obj.data.vertices:
        world_co = cloth_obj.matrix_world @ v.co
        local_co = body_inv @ world_co

        result, location, normal, _ = body_eval.closest_point_on_mesh(local_co)
        if result:
            world_normal = (body_obj.matrix_world.to_3x3() @ normal).normalized()
            world_surface = body_obj.matrix_world @ location
            new_world = world_surface + world_normal * offset
            v.co = cloth_obj.matrix_world.inverted() @ new_world
            adjusted_count += 1

    cloth_obj.data.update()

    return {
        "clothing": cloth_obj.name,
        "body": body_obj.name,
        "offset": offset,
        "adjusted_vertices": adjusted_count,
    }


def detect_clipping(
    clothing_name: str,
    body_name: str,
    threshold: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Find clothing vertices that penetrate the body surface.

    Parameters
    ----------
    clothing_name : str
        Clothing mesh to check.
    body_name : str
        Body mesh to check against.
    threshold : float
        Distance threshold below which a vertex is considered clipping.
    """
    _ensure_object_mode()
    cloth_obj = _get_mesh(clothing_name)
    body_obj = _get_mesh(body_name)

    body_inv = body_obj.matrix_world.inverted()
    clipping_verts = []

    for v in cloth_obj.data.vertices:
        world_co = cloth_obj.matrix_world @ v.co
        local_co = body_inv @ world_co

        result, location, normal, _ = body_obj.closest_point_on_mesh(local_co)
        if result:
            to_vert = (local_co - location)
            dist = to_vert.dot(normal)
            if dist < threshold:
                clipping_verts.append({
                    "index": v.index,
                    "depth": round(abs(dist), 6),
                })

    return {
        "clothing": cloth_obj.name,
        "body": body_obj.name,
        "clipping_vertices": len(clipping_verts),
        "total_vertices": len(cloth_obj.data.vertices),
        "clipping_ratio": round(
            len(clipping_verts) / max(len(cloth_obj.data.vertices), 1), 4
        ),
        "worst_clipping": sorted(clipping_verts, key=lambda x: -x["depth"])[:10],
    }


def fix_clipping(
    clothing_name: str,
    body_name: str,
    push_distance: float = 0.001,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Push clipping vertices outward past the body surface.

    Parameters
    ----------
    clothing_name : str
        Clothing mesh.
    body_name : str
        Body mesh.
    push_distance : float
        Extra distance to push beyond the surface.
    """
    _ensure_object_mode()
    cloth_obj = _get_mesh(clothing_name)
    body_obj = _get_mesh(body_name)

    body_inv = body_obj.matrix_world.inverted()
    cloth_inv = cloth_obj.matrix_world.inverted()
    fixed_count = 0

    for v in cloth_obj.data.vertices:
        world_co = cloth_obj.matrix_world @ v.co
        local_co = body_inv @ world_co

        result, location, normal, _ = body_obj.closest_point_on_mesh(local_co)
        if result:
            to_vert = local_co - location
            dist = to_vert.dot(normal)
            if dist < 0:
                # Vertex is inside body, push it out
                world_surface = body_obj.matrix_world @ location
                world_normal = (body_obj.matrix_world.to_3x3() @ normal).normalized()
                new_pos = world_surface + world_normal * push_distance
                v.co = cloth_inv @ new_pos
                fixed_count += 1

    cloth_obj.data.update()

    return {
        "clothing": cloth_obj.name,
        "body": body_obj.name,
        "fixed_vertices": fixed_count,
        "push_distance": push_distance,
    }


def smooth_boundary(
    clothing_name: str,
    iterations: int = 3,
    factor: float = 0.5,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Smooth clothing mesh edges at boundary/open edges.

    Parameters
    ----------
    clothing_name : str
        Clothing mesh.
    iterations : int
        Smoothing iterations.
    factor : float
        Smoothing factor (0-1).
    """
    _ensure_object_mode()
    cloth_obj = _get_mesh(clothing_name)
    _select_only(cloth_obj)

    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.mesh.select_non_manifold(extend=False)
    bpy.ops.mesh.select_more(use_face_step=True)

    for _ in range(iterations):
        bpy.ops.mesh.vertices_smooth(factor=factor, repeat=1)

    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "clothing": cloth_obj.name,
        "iterations": iterations,
        "factor": factor,
    }


def transfer_body_weights(
    body_name: str,
    clothing_name: str,
    method: str = "POLYINTERP_NEAREST",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Copy vertex weights from body mesh to clothing.

    Parameters
    ----------
    body_name : str
        Source body mesh with weights.
    clothing_name : str
        Target clothing mesh.
    method : str
        Transfer method: POLYINTERP_NEAREST, NEAREST, or TOPOLOGY.
    """
    _ensure_object_mode()
    body_obj = _get_mesh(body_name)
    cloth_obj = _get_mesh(clothing_name)

    # Clear existing vertex groups on clothing
    cloth_obj.vertex_groups.clear()

    _select_only(cloth_obj)
    body_obj.select_set(True)
    bpy.context.view_layer.objects.active = cloth_obj

    dt_mod = cloth_obj.modifiers.new(name="BodyWeights", type="DATA_TRANSFER")
    dt_mod.object = body_obj
    dt_mod.use_vert_data = True
    dt_mod.data_types_verts = {"VGROUP_WEIGHTS"}
    dt_mod.vert_mapping = method

    bpy.ops.object.modifier_apply(modifier=dt_mod.name)

    groups = [g.name for g in cloth_obj.vertex_groups]

    return {
        "body": body_obj.name,
        "clothing": cloth_obj.name,
        "method": method,
        "transferred_groups": groups,
        "group_count": len(groups),
    }


def bind_to_mesh(
    clothing_name: str,
    body_name: str,
    precision: int = 5,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bind clothing to body using mesh deform modifier.

    Parameters
    ----------
    clothing_name : str
        Clothing mesh.
    body_name : str
        Body mesh acting as deform cage.
    precision : int
        Binding precision (1-10).
    apply : bool
        Apply after binding.
    """
    _ensure_object_mode()
    cloth_obj = _get_mesh(clothing_name)
    body_obj = _get_mesh(body_name)
    _select_only(cloth_obj)

    mod = cloth_obj.modifiers.new(name="MeshBind", type="MESH_DEFORM")
    mod.object = body_obj
    mod.precision = precision

    bpy.ops.object.meshdeform_bind(modifier=mod.name)

    if apply:
        bpy.ops.object.modifier_apply(modifier=mod.name)

    return {
        "clothing": cloth_obj.name,
        "body": body_obj.name,
        "precision": precision,
        "bound": True,
        "applied": apply,
    }


def check_intersection(
    mesh_a_name: str,
    mesh_b_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Check for mesh intersections between two objects using BVH trees.

    Parameters
    ----------
    mesh_a_name : str
        First mesh object.
    mesh_b_name : str
        Second mesh object.
    """
    _ensure_object_mode()
    mesh_a = _get_mesh(mesh_a_name)
    mesh_b = _get_mesh(mesh_b_name)

    from mathutils.bvhtree import BVHTree

    depsgraph = bpy.context.evaluated_depsgraph_get()

    mesh_a_eval = mesh_a.evaluated_get(depsgraph)
    mesh_b_eval = mesh_b.evaluated_get(depsgraph)

    bvh_a = BVHTree.FromObject(mesh_a_eval, depsgraph)
    bvh_b = BVHTree.FromObject(mesh_b_eval, depsgraph)

    overlap_pairs = bvh_a.overlap(bvh_b)

    return {
        "mesh_a": mesh_a.name,
        "mesh_b": mesh_b.name,
        "intersecting": len(overlap_pairs) > 0,
        "overlap_face_pairs": len(overlap_pairs),
    }


def proportional_resize(
    name: str,
    center_vertex_group: Optional[str] = None,
    scale_factor: float = 1.0,
    falloff: str = "SMOOTH",
    radius: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Resize mesh with proportional falloff from a center region.

    Parameters
    ----------
    name : str
        Mesh object.
    center_vertex_group : str, optional
        Vertex group at the center of the resize. Uses object origin if omitted.
    scale_factor : float
        Scale multiplier.
    falloff : str
        SMOOTH, SPHERE, ROOT, SHARP, LINEAR, CONSTANT, INVERSE_SQUARE, or RANDOM.
    radius : float
        Proportional editing radius.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)

    # Determine center point
    center = mesh_obj.location.copy()
    if center_vertex_group:
        vg = mesh_obj.vertex_groups.get(center_vertex_group)
        if vg is None:
            raise ValueError(f"Vertex group '{center_vertex_group}' not found")
        vg_idx = vg.index
        weighted_sum = mathutils.Vector((0, 0, 0))
        total_weight = 0.0
        for v in mesh_obj.data.vertices:
            for g in v.groups:
                if g.group == vg_idx and g.weight > 0:
                    weighted_sum += v.co * g.weight
                    total_weight += g.weight
                    break
        if total_weight > 0:
            center = mesh_obj.matrix_world @ (weighted_sum / total_weight)

    # Apply proportional-style scaling per vertex
    falloff_funcs = {
        "SMOOTH": lambda d: max(0.0, 1.0 - d * d * (3.0 - 2.0 * d)),
        "SPHERE": lambda d: max(0.0, (1.0 - d * d) ** 0.5),
        "ROOT": lambda d: max(0.0, (1.0 - d) ** 0.5),
        "SHARP": lambda d: max(0.0, (1.0 - d * d) ** 2),
        "LINEAR": lambda d: max(0.0, 1.0 - d),
        "CONSTANT": lambda d: 1.0 if d <= 1.0 else 0.0,
        "INVERSE_SQUARE": lambda d: max(0.0, (1.0 - d) ** 2),
        "RANDOM": lambda d: max(0.0, 1.0 - d),
    }

    func = falloff_funcs.get(falloff.upper(), falloff_funcs["SMOOTH"])
    affected = 0

    for v in mesh_obj.data.vertices:
        world_co = mesh_obj.matrix_world @ v.co
        dist = (world_co - center).length
        normalized_dist = min(dist / max(radius, 0.0001), 1.0)
        influence = func(normalized_dist)

        if influence > 0.0001:
            local_scale = 1.0 + (scale_factor - 1.0) * influence
            relative = v.co - (mesh_obj.matrix_world.inverted() @ center)
            v.co = (mesh_obj.matrix_world.inverted() @ center) + relative * local_scale
            affected += 1

    mesh_obj.data.update()

    return {
        "object_name": mesh_obj.name,
        "scale_factor": scale_factor,
        "falloff": falloff,
        "radius": radius,
        "affected_vertices": affected,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "auto_fit": auto_fit,
    "add_shrinkwrap": add_shrinkwrap,
    "add_surface_bind": add_surface_bind,
    "add_lattice_deform": add_lattice_deform,
    "adjust_offset": adjust_offset,
    "detect_clipping": detect_clipping,
    "fix_clipping": fix_clipping,
    "smooth_boundary": smooth_boundary,
    "transfer_body_weights": transfer_body_weights,
    "bind_to_mesh": bind_to_mesh,
    "check_intersection": check_intersection,
    "proportional_resize": proportional_resize,
}
