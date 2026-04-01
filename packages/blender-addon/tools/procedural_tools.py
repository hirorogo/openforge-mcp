"""
Procedural generation tools for OpenForge MCP.

Provides tools for geometry nodes setup, surface scattering, randomized arrays,
terrain generation, vertex instancing, city block generation, curve distribution,
and random transform application.
"""

from typing import Any, Dict, List, Optional
import random
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


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def create_geometry_nodes(
    name: str,
    modifier_name: str = "GeometryNodes",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Geometry Nodes modifier to an object with a fresh node tree.

    Creates a basic node tree with Group Input and Group Output connected,
    ready for further editing.

    Parameters
    ----------
    name : str
        Object name.
    modifier_name : str
        Name for the modifier and node tree.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    mod = obj.modifiers.new(name=modifier_name, type="NODES")

    node_group = bpy.data.node_groups.new(name=modifier_name, type="GeometryNodeTree")
    mod.node_group = node_group

    input_node = node_group.nodes.new(type="NodeGroupInput")
    input_node.location = (-200, 0)
    output_node = node_group.nodes.new(type="NodeGroupOutput")
    output_node.location = (200, 0)

    node_group.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    node_group.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    node_group.links.new(input_node.outputs[0], output_node.inputs[0])

    return {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "node_group": node_group.name,
    }


def scatter_on_surface(
    surface_name: str,
    scatter_object_name: str,
    count: int = 100,
    seed: int = 0,
    scale_min: float = 0.8,
    scale_max: float = 1.2,
    align_to_normal: bool = True,
    collection_name: str = "",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Scatter instances of an object across a surface using a particle system.

    Parameters
    ----------
    surface_name : str
        Name of the surface object to scatter onto.
    scatter_object_name : str
        Name of the object to scatter.
    count : int
        Number of instances to place.
    seed : int
        Random seed for placement.
    scale_min : float
        Minimum random scale factor.
    scale_max : float
        Maximum random scale factor.
    align_to_normal : bool
        Align scattered objects to surface normals.
    collection_name : str
        If provided, scatter all objects from this collection instead of a single object.
    """
    _ensure_object_mode()
    surface = _get_object(surface_name)
    scatter_obj = _get_object(scatter_object_name)

    _select_only(surface)

    ps_mod = surface.modifiers.new(name="ScatterParticles", type="PARTICLE_SYSTEM")
    ps = surface.particle_systems[ps_mod.name]
    settings = ps.settings

    settings.type = "HAIR"
    settings.use_advanced_hair = True
    settings.count = count
    settings.hair_length = 1.0
    settings.render_type = "OBJECT"
    settings.instance_object = scatter_obj

    if collection_name:
        coll = bpy.data.collections.get(collection_name)
        if coll:
            settings.render_type = "COLLECTION"
            settings.instance_collection = coll
            settings.use_collection_pick_random = True

    settings.use_rotations = True
    settings.rotation_mode = "NOR" if align_to_normal else "NONE"
    settings.phase_factor_random = 2.0
    settings.use_rotation_instance = True

    settings.particle_size = 1.0
    settings.size_random = min(1.0, (scale_max - scale_min) / max(scale_max, 0.001))

    if hasattr(settings, "use_emit_random"):
        settings.use_emit_random = True

    return {
        "surface": surface.name,
        "scatter_object": scatter_obj.name,
        "particle_system": ps.name,
        "count": count,
        "seed": seed,
    }


def create_random_array(
    name: str,
    count: int = 10,
    spacing: float = 2.0,
    randomize_offset: float = 0.5,
    randomize_rotation: float = 0.0,
    randomize_scale: float = 0.0,
    seed: int = 0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a randomized array of duplicated objects.

    Parameters
    ----------
    name : str
        Source object name to duplicate.
    count : int
        Number of copies.
    spacing : float
        Base spacing between copies along X.
    randomize_offset : float
        Maximum random offset applied to each copy position.
    randomize_rotation : float
        Maximum random rotation in radians applied to each axis.
    randomize_scale : float
        Maximum random scale variation (0.0 = no variation).
    seed : int
        Random seed.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    rng = random.Random(seed)
    created = []

    for i in range(count):
        _select_only(obj)
        bpy.ops.object.duplicate(linked=False)
        copy = bpy.context.active_object
        copy.name = f"{name}_array_{i + 1:03d}"
        if copy.data:
            copy.data.name = copy.name

        base_x = (i + 1) * spacing
        copy.location = mathutils.Vector((
            base_x + rng.uniform(-randomize_offset, randomize_offset),
            rng.uniform(-randomize_offset, randomize_offset),
            rng.uniform(-randomize_offset, randomize_offset),
        ))

        if randomize_rotation > 0:
            copy.rotation_euler = mathutils.Euler((
                rng.uniform(-randomize_rotation, randomize_rotation),
                rng.uniform(-randomize_rotation, randomize_rotation),
                rng.uniform(-randomize_rotation, randomize_rotation),
            ))

        if randomize_scale > 0:
            s = 1.0 + rng.uniform(-randomize_scale, randomize_scale)
            copy.scale = mathutils.Vector((s, s, s))

        created.append({
            "name": copy.name,
            "location": list(copy.location),
            "rotation": list(copy.rotation_euler),
            "scale": list(copy.scale),
        })

    return {
        "source": name,
        "created": created,
        "count": len(created),
    }


def generate_terrain(
    size: float = 50.0,
    subdivisions: int = 64,
    height: float = 5.0,
    noise_scale: float = 3.0,
    seed: int = 0,
    name: str = "Terrain",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Generate a procedural terrain mesh using displacement.

    Creates a subdivided plane and applies procedural noise displacement
    using a Displace modifier with a Clouds texture.

    Parameters
    ----------
    size : float
        Side length of the terrain plane.
    subdivisions : int
        Number of subdivisions per side (higher = more detail).
    height : float
        Maximum displacement height.
    noise_scale : float
        Scale of the noise pattern.
    seed : int
        Random seed offset for noise.
    name : str
        Name for the terrain object.
    """
    _ensure_object_mode()

    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=subdivisions,
        y_subdivisions=subdivisions,
        size=size,
        location=(0, 0, 0),
    )
    terrain = bpy.context.active_object
    terrain.name = name
    if terrain.data:
        terrain.data.name = name

    tex = bpy.data.textures.new(name=f"{name}_noise", type="CLOUDS")
    tex.noise_scale = noise_scale
    tex.noise_depth = 4
    tex.noise_basis = "IMPROVED_PERLIN"
    if hasattr(tex, "noise_type"):
        tex.noise_type = "SOFT_NOISE"

    mod = terrain.modifiers.new(name="TerrainDisplace", type="DISPLACE")
    mod.texture = tex
    mod.strength = height
    mod.mid_level = 0.5
    mod.direction = "Z"
    mod.texture_coords = "LOCAL"

    if seed != 0:
        mod.texture_coords_offset = mathutils.Vector((seed * 0.1, seed * 0.07, 0))

    _select_only(terrain)
    bpy.ops.object.modifier_apply(modifier=mod.name)

    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")

    bpy.ops.object.shade_smooth()

    return {
        "object_name": terrain.name,
        "size": size,
        "subdivisions": subdivisions,
        "height": height,
        "vertex_count": len(terrain.data.vertices),
        "face_count": len(terrain.data.polygons),
    }


def instance_on_points(
    target_name: str,
    instance_name: str,
    align_to_normals: bool = False,
    scale: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Place instances of an object at each vertex of a target mesh.

    Parameters
    ----------
    target_name : str
        Name of the mesh whose vertices define placement points.
    instance_name : str
        Name of the object to instance.
    align_to_normals : bool
        Align instances to vertex normals of the target mesh.
    scale : float
        Uniform scale factor for all instances.
    """
    _ensure_object_mode()
    target = _get_object(target_name)
    instance = _get_object(instance_name)

    if target.type != "MESH":
        raise ValueError(f"Target '{target_name}' is not a mesh")

    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_target = target.evaluated_get(depsgraph)
    mesh = eval_target.to_mesh()

    placed = []
    for vert in mesh.vertices:
        world_pos = target.matrix_world @ vert.co
        _select_only(instance)
        bpy.ops.object.duplicate(linked=True)
        copy = bpy.context.active_object
        copy.location = world_pos
        copy.scale = mathutils.Vector((scale, scale, scale))

        if align_to_normals:
            normal = (target.matrix_world.to_3x3() @ vert.normal).normalized()
            up = mathutils.Vector((0, 0, 1))
            if abs(normal.dot(up)) < 0.999:
                rot_quat = up.rotation_difference(normal)
                copy.rotation_euler = rot_quat.to_euler()

        placed.append(copy.name)

    eval_target.to_mesh_clear()

    return {
        "target": target.name,
        "instance_source": instance.name,
        "placed_count": len(placed),
        "instances": placed[:20],
        "truncated": len(placed) > 20,
    }


def create_city_block(
    block_size: float = 50.0,
    building_count: int = 8,
    min_height: float = 3.0,
    max_height: float = 20.0,
    min_width: float = 3.0,
    max_width: float = 8.0,
    gap: float = 1.0,
    seed: int = 0,
    name_prefix: str = "Building",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Generate a simple city block with randomized box buildings.

    Parameters
    ----------
    block_size : float
        Side length of the city block area.
    building_count : int
        Number of buildings to create.
    min_height, max_height : float
        Height range for buildings.
    min_width, max_width : float
        Width range for buildings.
    gap : float
        Minimum gap between buildings.
    seed : int
        Random seed.
    name_prefix : str
        Prefix for building object names.
    """
    _ensure_object_mode()
    rng = random.Random(seed)
    buildings = []
    half = block_size / 2

    bpy.ops.mesh.primitive_plane_add(size=block_size, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = f"{name_prefix}_Ground"

    placed_rects = []

    for i in range(building_count):
        width = rng.uniform(min_width, max_width)
        depth = rng.uniform(min_width, max_width)
        height = rng.uniform(min_height, max_height)

        placed = False
        for attempt in range(50):
            x = rng.uniform(-half + width / 2 + gap, half - width / 2 - gap)
            y = rng.uniform(-half + depth / 2 + gap, half - depth / 2 - gap)

            overlaps = False
            for px, py, pw, pd in placed_rects:
                if (abs(x - px) < (width + pw) / 2 + gap and
                        abs(y - py) < (depth + pd) / 2 + gap):
                    overlaps = True
                    break

            if not overlaps:
                placed_rects.append((x, y, width, depth))
                bpy.ops.mesh.primitive_cube_add(
                    size=1.0,
                    location=(x, y, height / 2),
                )
                bldg = bpy.context.active_object
                bldg.scale = (width, depth, height)
                bldg.name = f"{name_prefix}_{i + 1:03d}"
                if bldg.data:
                    bldg.data.name = bldg.name

                buildings.append({
                    "name": bldg.name,
                    "location": list(bldg.location),
                    "dimensions": [width, depth, height],
                })
                placed = True
                break

        if not placed:
            x = rng.uniform(-half + width / 2, half - width / 2)
            y = rng.uniform(-half + depth / 2, half - depth / 2)
            bpy.ops.mesh.primitive_cube_add(
                size=1.0,
                location=(x, y, height / 2),
            )
            bldg = bpy.context.active_object
            bldg.scale = (width, depth, height)
            bldg.name = f"{name_prefix}_{i + 1:03d}"
            if bldg.data:
                bldg.data.name = bldg.name
            buildings.append({
                "name": bldg.name,
                "location": list(bldg.location),
                "dimensions": [width, depth, height],
            })

    return {
        "ground": ground.name,
        "buildings": buildings,
        "count": len(buildings),
        "block_size": block_size,
    }


def distribute_along_path(
    curve_name: str,
    object_name: str,
    count: int = 10,
    use_linked: bool = True,
    align_to_curve: bool = True,
    scale: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Distribute instances of an object evenly along a curve path.

    Parameters
    ----------
    curve_name : str
        Name of the curve object to distribute along.
    object_name : str
        Name of the object to instance.
    count : int
        Number of instances.
    use_linked : bool
        Create linked duplicates to save memory.
    align_to_curve : bool
        Orient instances to follow the curve tangent.
    scale : float
        Uniform scale for instances.
    """
    _ensure_object_mode()
    curve = _get_object(curve_name)
    obj = _get_object(object_name)

    if curve.type != "CURVE":
        raise ValueError(f"Object '{curve_name}' is not a curve")

    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_curve = curve.evaluated_get(depsgraph)
    mesh = eval_curve.to_mesh()

    if len(mesh.vertices) < 2:
        eval_curve.to_mesh_clear()
        raise ValueError("Curve has too few points after evaluation")

    verts = [curve.matrix_world @ v.co for v in mesh.vertices]
    eval_curve.to_mesh_clear()

    edge_lengths = []
    total_length = 0
    for i in range(len(verts) - 1):
        seg_len = (verts[i + 1] - verts[i]).length
        edge_lengths.append(seg_len)
        total_length += seg_len

    placed = []
    for idx in range(count):
        t = idx / max(count - 1, 1)
        target_dist = t * total_length

        accumulated = 0
        point = verts[0]
        tangent = (verts[1] - verts[0]).normalized() if len(verts) > 1 else mathutils.Vector((1, 0, 0))

        for i in range(len(edge_lengths)):
            seg_len = edge_lengths[i]
            if accumulated + seg_len >= target_dist:
                frac = (target_dist - accumulated) / seg_len if seg_len > 0 else 0
                point = verts[i].lerp(verts[i + 1], frac)
                tangent = (verts[i + 1] - verts[i]).normalized()
                break
            accumulated += seg_len
        else:
            point = verts[-1]
            if len(verts) > 1:
                tangent = (verts[-1] - verts[-2]).normalized()

        _select_only(obj)
        bpy.ops.object.duplicate(linked=use_linked)
        copy = bpy.context.active_object
        copy.location = point
        copy.scale = mathutils.Vector((scale, scale, scale))

        if align_to_curve:
            forward = tangent
            up = mathutils.Vector((0, 0, 1))
            if abs(forward.dot(up)) > 0.999:
                up = mathutils.Vector((0, 1, 0))
            right = forward.cross(up).normalized()
            up = right.cross(forward).normalized()
            mat = mathutils.Matrix((
                (forward.x, right.x, up.x),
                (forward.y, right.y, up.y),
                (forward.z, right.z, up.z),
            )).transposed()
            copy.rotation_euler = mat.to_euler()

        placed.append(copy.name)

    return {
        "curve": curve.name,
        "source_object": obj.name,
        "placed_count": len(placed),
        "instances": placed,
    }


def random_transform(
    names: List[str],
    location_range: float = 0.0,
    rotation_range: float = 0.0,
    scale_range: float = 0.0,
    uniform_scale: bool = True,
    seed: int = 0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply random transforms to a list of objects.

    Parameters
    ----------
    names : list[str]
        Object names.
    location_range : float
        Maximum random offset per axis.
    rotation_range : float
        Maximum random rotation in radians per axis.
    scale_range : float
        Maximum random scale variation around 1.0.
    uniform_scale : bool
        If True, same random scale is applied to all three axes.
    seed : int
        Random seed.
    """
    _ensure_object_mode()
    rng = random.Random(seed)
    results = []

    for obj_name in names:
        obj = _get_object(obj_name)

        if location_range > 0:
            obj.location += mathutils.Vector((
                rng.uniform(-location_range, location_range),
                rng.uniform(-location_range, location_range),
                rng.uniform(-location_range, location_range),
            ))

        if rotation_range > 0:
            obj.rotation_euler = mathutils.Euler((
                obj.rotation_euler.x + rng.uniform(-rotation_range, rotation_range),
                obj.rotation_euler.y + rng.uniform(-rotation_range, rotation_range),
                obj.rotation_euler.z + rng.uniform(-rotation_range, rotation_range),
            ))

        if scale_range > 0:
            if uniform_scale:
                s = 1.0 + rng.uniform(-scale_range, scale_range)
                obj.scale = mathutils.Vector((
                    obj.scale.x * s,
                    obj.scale.y * s,
                    obj.scale.z * s,
                ))
            else:
                obj.scale = mathutils.Vector((
                    obj.scale.x * (1.0 + rng.uniform(-scale_range, scale_range)),
                    obj.scale.y * (1.0 + rng.uniform(-scale_range, scale_range)),
                    obj.scale.z * (1.0 + rng.uniform(-scale_range, scale_range)),
                ))

        results.append({
            "name": obj.name,
            "location": list(obj.location),
            "rotation": list(obj.rotation_euler),
            "scale": list(obj.scale),
        })

    return {"transformed": results, "count": len(results)}


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "create_geometry_nodes": create_geometry_nodes,
    "scatter_on_surface": scatter_on_surface,
    "create_random_array": create_random_array,
    "generate_terrain": generate_terrain,
    "instance_on_points": instance_on_points,
    "create_city_block": create_city_block,
    "distribute_along_path": distribute_along_path,
    "random_transform": random_transform,
}
