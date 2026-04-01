"""
Game-ready asset preparation tools for OpenForge MCP.

Provides tools for snapping to grid, creating collision shapes, decimation,
LOD generation, game optimization, origin manipulation, and game-engine export.
"""

from typing import Any, Dict, List, Optional
import math

import bpy
import bmesh
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


def _select_only(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def _ensure_object_mode() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def _get_tri_count(obj: bpy.types.Object) -> int:
    """Return the triangle count of a mesh object by evaluating its depsgraph."""
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(depsgraph)
    mesh = eval_obj.to_mesh()
    mesh.calc_loop_triangles()
    count = len(mesh.loop_triangles)
    eval_obj.to_mesh_clear()
    return count


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def snap_to_grid(
    name: str,
    grid_size: float = 1.0,
    snap_rotation: bool = False,
    rotation_step: float = 90.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Snap an object's location (and optionally rotation) to a grid.

    Parameters
    ----------
    name : str
        Object name.
    grid_size : float
        Grid cell size in Blender units.
    snap_rotation : bool
        If True, also snap rotation to increments of *rotation_step*.
    rotation_step : float
        Rotation snap increment in degrees.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    loc = obj.location
    obj.location = mathutils.Vector((
        round(loc.x / grid_size) * grid_size,
        round(loc.y / grid_size) * grid_size,
        round(loc.z / grid_size) * grid_size,
    ))

    if snap_rotation:
        step_rad = math.radians(rotation_step)
        rot = obj.rotation_euler
        obj.rotation_euler = mathutils.Euler((
            round(rot.x / step_rad) * step_rad,
            round(rot.y / step_rad) * step_rad,
            round(rot.z / step_rad) * step_rad,
        ))

    return {
        "object_name": obj.name,
        "location": list(obj.location),
        "rotation": list(obj.rotation_euler),
        "grid_size": grid_size,
    }


def create_box_collider(
    name: str,
    padding: float = 0.0,
    collider_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create an axis-aligned box collision shape around an object.

    Parameters
    ----------
    name : str
        Object to create collider for.
    padding : float
        Extra padding around the bounding box.
    collider_name : str, optional
        Name for the collider. Defaults to '<name>_box_col'.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    bbox_corners = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
    min_co = mathutils.Vector((
        min(c.x for c in bbox_corners) - padding,
        min(c.y for c in bbox_corners) - padding,
        min(c.z for c in bbox_corners) - padding,
    ))
    max_co = mathutils.Vector((
        max(c.x for c in bbox_corners) + padding,
        max(c.y for c in bbox_corners) + padding,
        max(c.z for c in bbox_corners) + padding,
    ))

    center = (min_co + max_co) / 2
    dims = max_co - min_co

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=center)
    collider = bpy.context.active_object
    collider.scale = dims
    collider.name = collider_name or f"{name}_box_col"
    if collider.data:
        collider.data.name = collider.name
    collider.display_type = "WIRE"

    return {
        "collider_name": collider.name,
        "source_object": name,
        "center": list(center),
        "dimensions": list(dims),
    }


def create_capsule_collider(
    name: str,
    axis: str = "Z",
    padding: float = 0.0,
    segments: int = 16,
    collider_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a capsule collision shape around an object.

    Parameters
    ----------
    name : str
        Object to create collider for.
    axis : str
        Primary axis: X, Y, or Z.
    padding : float
        Extra padding around the shape.
    segments : int
        Number of segments for the capsule cylinder.
    collider_name : str, optional
        Name for the collider.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    bbox_corners = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
    min_co = mathutils.Vector((
        min(c.x for c in bbox_corners),
        min(c.y for c in bbox_corners),
        min(c.z for c in bbox_corners),
    ))
    max_co = mathutils.Vector((
        max(c.x for c in bbox_corners),
        max(c.y for c in bbox_corners),
        max(c.z for c in bbox_corners),
    ))

    center = (min_co + max_co) / 2
    dims = max_co - min_co + mathutils.Vector((padding * 2,) * 3)

    axis_map = {"X": 0, "Y": 1, "Z": 2}
    axis_idx = axis_map.get(axis.upper(), 2)
    height = dims[axis_idx]
    other_dims = [dims[i] for i in range(3) if i != axis_idx]
    radius = max(other_dims) / 2

    rot = (0, 0, 0)
    if axis_idx == 0:
        rot = (0, math.radians(90), 0)
    elif axis_idx == 1:
        rot = (math.radians(90), 0, 0)

    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius,
        depth=max(0, height - radius * 2),
        vertices=segments,
        location=center,
        rotation=rot,
    )
    capsule = bpy.context.active_object

    bpy.ops.object.mode_set(mode="EDIT")
    bm = bmesh.from_edit_mesh(capsule.data)
    top_verts = [v for v in bm.verts if v.co.z > 0.001]
    bot_verts = [v for v in bm.verts if v.co.z < -0.001]

    if top_verts:
        top_center = mathutils.Vector((0, 0, max(v.co.z for v in top_verts)))
        for v in top_verts:
            direction = (v.co - top_center).normalized()
            v.co = top_center + direction * radius

    if bot_verts:
        bot_center = mathutils.Vector((0, 0, min(v.co.z for v in bot_verts)))
        for v in bot_verts:
            direction = (v.co - bot_center).normalized()
            v.co = bot_center + direction * radius

    bmesh.update_edit_mesh(capsule.data)
    bpy.ops.object.mode_set(mode="OBJECT")

    capsule.name = collider_name or f"{name}_capsule_col"
    if capsule.data:
        capsule.data.name = capsule.name
    capsule.display_type = "WIRE"

    return {
        "collider_name": capsule.name,
        "source_object": name,
        "center": list(center),
        "radius": radius,
        "height": height,
        "axis": axis.upper(),
    }


def create_convex_collider(
    name: str,
    collider_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a convex hull collision shape from an object's mesh.

    Parameters
    ----------
    name : str
        Object to create collider for.
    collider_name : str, optional
        Name for the collider.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    _select_only(obj)
    bpy.ops.object.duplicate(linked=False)
    collider = bpy.context.active_object

    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.convex_hull()
    bpy.ops.object.mode_set(mode="OBJECT")

    collider.name = collider_name or f"{name}_convex_col"
    if collider.data:
        collider.data.name = collider.name
    collider.display_type = "WIRE"

    tri_count = _get_tri_count(collider)

    return {
        "collider_name": collider.name,
        "source_object": name,
        "tri_count": tri_count,
    }


def decimate_to_target(
    name: str,
    target_tris: int = 5000,
    method: str = "COLLAPSE",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Decimate a mesh to a target triangle count.

    Parameters
    ----------
    name : str
        Object name.
    target_tris : int
        Target number of triangles.
    method : str
        Decimation method: COLLAPSE, UNSUBDIV, or DISSOLVE.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    current_tris = _get_tri_count(obj)
    if current_tris <= target_tris:
        return {
            "object_name": obj.name,
            "original_tris": current_tris,
            "final_tris": current_tris,
            "ratio": 1.0,
            "message": "Already below target",
        }

    ratio = target_tris / current_tris
    mod = obj.modifiers.new(name="DecimateToTarget", type="DECIMATE")
    mod.decimate_type = method
    if method == "COLLAPSE":
        mod.ratio = max(0.001, ratio)
    elif method == "UNSUBDIV":
        mod.iterations = max(1, int(math.log2(1.0 / ratio)))

    _select_only(obj)
    bpy.ops.object.modifier_apply(modifier=mod.name)

    final_tris = _get_tri_count(obj)

    return {
        "object_name": obj.name,
        "original_tris": current_tris,
        "final_tris": final_tris,
        "target_tris": target_tris,
        "ratio": ratio,
    }


def generate_lod_chain(
    name: str,
    lod_count: int = 4,
    reduction_factor: float = 0.5,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Generate a chain of LOD (Level of Detail) meshes from an object.

    Creates LOD0 (original) through LOD3 (or as specified) with progressively
    reduced triangle counts.

    Parameters
    ----------
    name : str
        Source object name (becomes LOD0).
    lod_count : int
        Number of LOD levels to generate (including LOD0).
    reduction_factor : float
        Multiplicative factor for each LOD level (0.5 means each LOD has half
        the tris of the previous).
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    base_tris = _get_tri_count(obj)
    lods = [{"lod_level": 0, "name": obj.name, "tri_count": base_tris}]

    for level in range(1, lod_count):
        _select_only(obj)
        bpy.ops.object.duplicate(linked=False)
        lod_obj = bpy.context.active_object
        lod_obj.name = f"{name}_LOD{level}"
        if lod_obj.data:
            lod_obj.data.name = lod_obj.name

        ratio = reduction_factor ** level
        mod = lod_obj.modifiers.new(name="LOD_Decimate", type="DECIMATE")
        mod.decimate_type = "COLLAPSE"
        mod.ratio = max(0.001, ratio)

        _select_only(lod_obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)

        lod_obj.location.x += level * (obj.dimensions.x + 1.0)

        lod_tris = _get_tri_count(lod_obj)
        lods.append({
            "lod_level": level,
            "name": lod_obj.name,
            "tri_count": lod_tris,
            "ratio": ratio,
        })

    return {
        "source": name,
        "lod_count": len(lods),
        "lods": lods,
    }


def optimize_for_game(
    name: str,
    merge_distance: float = 0.0001,
    remove_doubles: bool = True,
    apply_transforms: bool = True,
    triangulate: bool = False,
    limit_bones_per_vertex: int = 0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply common game-engine optimizations to a mesh.

    Parameters
    ----------
    name : str
        Object name.
    merge_distance : float
        Distance threshold for merging duplicate vertices.
    remove_doubles : bool
        Remove duplicate vertices.
    apply_transforms : bool
        Apply location, rotation, and scale.
    triangulate : bool
        Triangulate the mesh.
    limit_bones_per_vertex : int
        If > 0, limit vertex group influences per vertex. 0 disables.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    _select_only(obj)
    actions_taken = []

    if apply_transforms:
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        actions_taken.append("applied_transforms")

    if remove_doubles:
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.remove_doubles(threshold=merge_distance)
        bpy.ops.object.mode_set(mode="OBJECT")
        actions_taken.append("removed_doubles")

    if triangulate:
        mod = obj.modifiers.new(name="Triangulate", type="TRIANGULATE")
        mod.quad_method = "SHORTEST_DIAGONAL"
        bpy.ops.object.modifier_apply(modifier=mod.name)
        actions_taken.append("triangulated")

    if limit_bones_per_vertex > 0 and obj.vertex_groups:
        bpy.ops.object.mode_set(mode="WEIGHT_PAINT")
        bpy.ops.object.vertex_group_limit_total(
            group_select_mode="ALL", limit=limit_bones_per_vertex
        )
        bpy.ops.object.mode_set(mode="OBJECT")
        actions_taken.append(f"limited_bones_per_vertex_to_{limit_bones_per_vertex}")

    unused_slots = []
    for i, slot in enumerate(obj.material_slots):
        if slot.material is None:
            unused_slots.append(i)
    for idx in reversed(unused_slots):
        obj.active_material_index = idx
        bpy.ops.object.material_slot_remove()
    if unused_slots:
        actions_taken.append("removed_empty_material_slots")

    final_tris = _get_tri_count(obj)

    return {
        "object_name": obj.name,
        "actions": actions_taken,
        "final_tri_count": final_tris,
    }


def set_origin_bottom(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the object origin to the bottom center of its bounding box.

    Parameters
    ----------
    name : str
        Object name.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    bbox_corners = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
    min_z = min(c.z for c in bbox_corners)
    center_x = (min(c.x for c in bbox_corners) + max(c.x for c in bbox_corners)) / 2
    center_y = (min(c.y for c in bbox_corners) + max(c.y for c in bbox_corners)) / 2
    bottom_center = mathutils.Vector((center_x, center_y, min_z))

    offset = bottom_center - obj.matrix_world.translation
    obj.data.transform(mathutils.Matrix.Translation(-offset))
    obj.matrix_world.translation += offset

    return {
        "object_name": obj.name,
        "origin": list(obj.location),
    }


def set_origin_center(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the object origin to the geometric center of its mesh.

    Parameters
    ----------
    name : str
        Object name.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    _select_only(obj)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")

    return {
        "object_name": obj.name,
        "origin": list(obj.location),
    }


def export_game_ready(
    name: str,
    filepath: str,
    file_format: str = "FBX",
    apply_modifiers: bool = True,
    forward_axis: str = "-Z",
    up_axis: str = "Y",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Export an object with game-engine-friendly settings.

    Parameters
    ----------
    name : str
        Object name to export.
    filepath : str
        Output file path.
    file_format : str
        Export format: FBX, GLB, GLTF.
    apply_modifiers : bool
        Apply all modifiers before export.
    forward_axis : str
        Forward axis convention for the export.
    up_axis : str
        Up axis convention for the export.
    """
    import os
    _ensure_object_mode()
    obj = _get_object(name)
    _select_only(obj)

    os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)

    if file_format.upper() == "FBX":
        axis_forward_map = {
            "X": "X", "-X": "X_NEGATIVE",
            "Y": "Y", "-Y": "Y_NEGATIVE",
            "Z": "Z", "-Z": "Z_NEGATIVE",
        }
        axis_up_map = axis_forward_map.copy()
        bpy.ops.export_scene.fbx(
            filepath=filepath,
            use_selection=True,
            apply_scale_options="FBX_SCALE_ALL",
            use_mesh_modifiers=apply_modifiers,
            axis_forward=axis_forward_map.get(forward_axis, "Z_NEGATIVE"),
            axis_up=axis_up_map.get(up_axis, "Y"),
            mesh_smooth_type="FACE",
            add_leaf_bones=False,
            bake_anim=False,
        )
    elif file_format.upper() in ("GLB", "GLTF"):
        export_fmt = "GLB" if file_format.upper() == "GLB" else "GLTF_SEPARATE"
        bpy.ops.export_scene.gltf(
            filepath=filepath,
            use_selection=True,
            export_format=export_fmt,
            export_apply=apply_modifiers,
        )
    else:
        raise ValueError(f"Unsupported format '{file_format}'. Use FBX, GLB, or GLTF.")

    return {
        "object_name": obj.name,
        "filepath": filepath,
        "file_format": file_format,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "snap_to_grid": snap_to_grid,
    "create_box_collider": create_box_collider,
    "create_capsule_collider": create_capsule_collider,
    "create_convex_collider": create_convex_collider,
    "decimate_to_target": decimate_to_target,
    "generate_lod_chain": generate_lod_chain,
    "optimize_for_game": optimize_for_game,
    "set_origin_bottom": set_origin_bottom,
    "set_origin_center": set_origin_center,
    "export_game_ready": export_game_ready,
}
