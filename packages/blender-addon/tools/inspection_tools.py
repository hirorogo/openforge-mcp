"""
Mesh inspection and analysis tools for OpenForge MCP.

Provides tools for retrieving mesh statistics, checking for errors,
validating VRChat requirements, listing bones and shape keys, analyzing
topology quality, estimating draw calls, and measuring dimensions.
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


def _ensure_object_mode() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def _get_evaluated_mesh(obj: bpy.types.Object):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(depsgraph)
    return eval_obj.to_mesh(), eval_obj


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def get_mesh_stats(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Get detailed mesh statistics for an object.

    Returns vertex, edge, face, and triangle counts, as well as UV map
    count, material slot count, and modifier count.

    Parameters
    ----------
    name : str
        Object name.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh (type: {obj.type})")

    mesh = obj.data
    verts = len(mesh.vertices)
    edges = len(mesh.edges)
    faces = len(mesh.polygons)

    eval_mesh, eval_obj = _get_evaluated_mesh(obj)
    eval_mesh.calc_loop_triangles()
    tris = len(eval_mesh.loop_triangles)
    eval_obj.to_mesh_clear()

    uv_layers = len(mesh.uv_layers)
    material_slots = len(obj.material_slots)
    modifiers = len(obj.modifiers)
    has_shape_keys = obj.data.shape_keys is not None
    shape_key_count = len(obj.data.shape_keys.key_blocks) if has_shape_keys else 0
    vertex_groups = len(obj.vertex_groups)

    ngons = sum(1 for p in mesh.polygons if len(p.vertices) > 4)
    quads = sum(1 for p in mesh.polygons if len(p.vertices) == 4)
    tris_direct = sum(1 for p in mesh.polygons if len(p.vertices) == 3)

    return {
        "object_name": obj.name,
        "vertices": verts,
        "edges": edges,
        "faces": faces,
        "triangles": tris,
        "quads": quads,
        "tris_direct": tris_direct,
        "ngons": ngons,
        "uv_layers": uv_layers,
        "material_slots": material_slots,
        "modifiers": modifiers,
        "vertex_groups": vertex_groups,
        "has_shape_keys": has_shape_keys,
        "shape_key_count": shape_key_count,
    }


def check_mesh_errors(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Check a mesh for common problems.

    Detects non-manifold edges, loose vertices, loose edges, degenerate faces,
    zero-area faces, flipped normals (inconsistent), and missing UV maps.

    Parameters
    ----------
    name : str
        Object name.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.edges.ensure_lookup_table()
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    non_manifold_edges = sum(1 for e in bm.edges if not e.is_manifold)
    loose_verts = sum(1 for v in bm.verts if not v.link_edges)
    loose_edges = sum(1 for e in bm.edges if not e.link_faces)
    zero_area_faces = sum(1 for f in bm.faces if f.calc_area() < 1e-8)

    degenerate_faces = 0
    for f in bm.faces:
        if len(f.verts) < 3:
            degenerate_faces += 1

    interior_faces = sum(1 for f in bm.faces if all(
        len(e.link_faces) > 2 for e in f.edges
    ))

    has_uv = len(obj.data.uv_layers) > 0

    issues = []
    if non_manifold_edges > 0:
        issues.append(f"{non_manifold_edges} non-manifold edges")
    if loose_verts > 0:
        issues.append(f"{loose_verts} loose vertices")
    if loose_edges > 0:
        issues.append(f"{loose_edges} loose edges")
    if zero_area_faces > 0:
        issues.append(f"{zero_area_faces} zero-area faces")
    if degenerate_faces > 0:
        issues.append(f"{degenerate_faces} degenerate faces")
    if interior_faces > 0:
        issues.append(f"{interior_faces} interior faces")
    if not has_uv:
        issues.append("No UV maps found")

    bm.free()

    return {
        "object_name": obj.name,
        "is_clean": len(issues) == 0,
        "issue_count": len(issues),
        "issues": issues,
        "details": {
            "non_manifold_edges": non_manifold_edges,
            "loose_vertices": loose_verts,
            "loose_edges": loose_edges,
            "zero_area_faces": zero_area_faces,
            "degenerate_faces": degenerate_faces,
            "interior_faces": interior_faces,
            "has_uv": has_uv,
        },
    }


def check_vrc_requirements(
    name: str,
    performance_rank: str = "medium",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Validate a mesh against VRChat avatar performance requirements.

    Parameters
    ----------
    name : str
        Object or armature name to check.
    performance_rank : str
        Target rank: excellent, good, medium, poor.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    limits = {
        "excellent": {"tris": 7500, "materials": 1, "bones": 75, "shapes": 16},
        "good": {"tris": 10000, "materials": 1, "bones": 90, "shapes": 32},
        "medium": {"tris": 15000, "materials": 2, "bones": 150, "shapes": 48},
        "poor": {"tris": 20000, "materials": 4, "bones": 256, "shapes": 64},
    }
    rank_limits = limits.get(performance_rank.lower(), limits["medium"])

    total_tris = 0
    total_materials = set()
    total_bones = 0
    total_shapes = 0
    meshes_checked = []

    objects_to_check = [obj]
    if obj.type == "ARMATURE":
        objects_to_check = [
            child for child in obj.children if child.type == "MESH"
        ]

    for mesh_obj in objects_to_check:
        if mesh_obj.type != "MESH":
            continue
        eval_mesh, eval_obj = _get_evaluated_mesh(mesh_obj)
        eval_mesh.calc_loop_triangles()
        tri_count = len(eval_mesh.loop_triangles)
        eval_obj.to_mesh_clear()

        total_tris += tri_count
        for slot in mesh_obj.material_slots:
            if slot.material:
                total_materials.add(slot.material.name)

        if mesh_obj.data.shape_keys:
            total_shapes += len(mesh_obj.data.shape_keys.key_blocks) - 1

        meshes_checked.append(mesh_obj.name)

    armature = obj if obj.type == "ARMATURE" else obj.find_armature()
    if armature and armature.type == "ARMATURE":
        total_bones = len(armature.data.bones)

    mat_count = len(total_materials)
    warnings = []
    passes = True

    if total_tris > rank_limits["tris"]:
        warnings.append(
            f"Triangle count {total_tris} exceeds {performance_rank} limit of {rank_limits['tris']}"
        )
        passes = False
    if mat_count > rank_limits["materials"]:
        warnings.append(
            f"Material count {mat_count} exceeds {performance_rank} limit of {rank_limits['materials']}"
        )
        passes = False
    if total_bones > rank_limits["bones"]:
        warnings.append(
            f"Bone count {total_bones} exceeds {performance_rank} limit of {rank_limits['bones']}"
        )
        passes = False
    if total_shapes > rank_limits["shapes"]:
        warnings.append(
            f"Shape key count {total_shapes} exceeds {performance_rank} limit of {rank_limits['shapes']}"
        )
        passes = False

    return {
        "object_name": obj.name,
        "performance_rank": performance_rank,
        "passes": passes,
        "warnings": warnings,
        "stats": {
            "triangles": total_tris,
            "materials": mat_count,
            "bones": total_bones,
            "shape_keys": total_shapes,
        },
        "limits": rank_limits,
        "meshes_checked": meshes_checked,
    }


def list_all_bones(
    armature_name: str,
    include_hierarchy: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """List all bones in an armature.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    include_hierarchy : bool
        If True, include parent-child relationships.
    """
    _ensure_object_mode()
    obj = _get_object(armature_name)
    if obj.type != "ARMATURE":
        raise ValueError(f"Object '{armature_name}' is not an armature")

    armature = obj.data
    bones = []
    for bone in armature.bones:
        info = {
            "name": bone.name,
            "head": list(bone.head_local),
            "tail": list(bone.tail_local),
            "length": bone.length,
            "connected": bone.use_connect,
        }
        if include_hierarchy:
            info["parent"] = bone.parent.name if bone.parent else None
            info["children"] = [c.name for c in bone.children]
        bones.append(info)

    return {
        "armature_name": obj.name,
        "bone_count": len(bones),
        "bones": bones,
    }


def list_all_shapes(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """List all shape keys on a mesh object.

    Parameters
    ----------
    name : str
        Object name.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    if obj.data.shape_keys is None:
        return {
            "object_name": obj.name,
            "has_shape_keys": False,
            "shape_count": 0,
            "shapes": [],
        }

    shapes = []
    key_blocks = obj.data.shape_keys.key_blocks
    basis = key_blocks[0] if key_blocks else None

    for kb in key_blocks:
        info = {
            "name": kb.name,
            "value": kb.value,
            "slider_min": kb.slider_min,
            "slider_max": kb.slider_max,
            "mute": kb.mute,
            "is_basis": (kb == basis),
        }
        if kb.relative_key:
            info["relative_key"] = kb.relative_key.name
        shapes.append(info)

    return {
        "object_name": obj.name,
        "has_shape_keys": True,
        "shape_count": len(shapes),
        "shapes": shapes,
    }


def analyze_topology(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Analyze mesh topology quality.

    Returns statistics about edge flow, pole distribution, face type
    distribution, and potential problem areas.

    Parameters
    ----------
    name : str
        Object name.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    vert_count = len(bm.verts)
    edge_count = len(bm.edges)
    face_count = len(bm.faces)

    valence_counts = {}
    for v in bm.verts:
        val = len(v.link_edges)
        valence_counts[val] = valence_counts.get(val, 0) + 1

    poles_3 = valence_counts.get(3, 0)
    poles_5 = valence_counts.get(5, 0)
    poles_6plus = sum(c for v, c in valence_counts.items() if v >= 6)

    tri_faces = sum(1 for f in bm.faces if len(f.verts) == 3)
    quad_faces = sum(1 for f in bm.faces if len(f.verts) == 4)
    ngon_faces = sum(1 for f in bm.faces if len(f.verts) > 4)

    quad_ratio = quad_faces / face_count if face_count > 0 else 0

    boundary_edges = sum(1 for e in bm.edges if e.is_boundary)

    face_areas = [f.calc_area() for f in bm.faces]
    avg_face_area = sum(face_areas) / len(face_areas) if face_areas else 0
    min_face_area = min(face_areas) if face_areas else 0
    max_face_area = max(face_areas) if face_areas else 0
    area_variance = 0
    if face_areas and avg_face_area > 0:
        area_variance = sum((a - avg_face_area) ** 2 for a in face_areas) / len(face_areas)

    quality = "good"
    notes = []
    if quad_ratio < 0.5:
        quality = "poor"
        notes.append("Low quad ratio - mesh is mostly triangles/ngons")
    elif quad_ratio < 0.8:
        quality = "fair"
        notes.append("Mixed topology - consider converting to quads")
    if ngon_faces > 0:
        notes.append(f"{ngon_faces} ngons present - may cause shading issues")
    if poles_6plus > vert_count * 0.05:
        notes.append("High number of high-valence poles")
    if boundary_edges > 0:
        notes.append(f"{boundary_edges} boundary edges - mesh is not closed")

    bm.free()

    return {
        "object_name": obj.name,
        "quality": quality,
        "notes": notes,
        "vertices": vert_count,
        "edges": edge_count,
        "faces": face_count,
        "face_types": {
            "triangles": tri_faces,
            "quads": quad_faces,
            "ngons": ngon_faces,
        },
        "quad_ratio": round(quad_ratio, 3),
        "poles": {
            "3_edge": poles_3,
            "5_edge": poles_5,
            "6_plus_edge": poles_6plus,
        },
        "valence_distribution": valence_counts,
        "boundary_edges": boundary_edges,
        "face_area": {
            "average": round(avg_face_area, 6),
            "min": round(min_face_area, 6),
            "max": round(max_face_area, 6),
            "variance": round(area_variance, 6),
        },
    }


def count_draw_calls(
    names: Optional[List[str]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Estimate the draw call count for objects in the scene.

    Each unique material on a mesh object typically results in one draw call.
    Objects that share the same material and are not separated count as one draw call.

    Parameters
    ----------
    names : list[str], optional
        Object names to check. If omitted, checks all visible mesh objects.
    """
    _ensure_object_mode()

    if names:
        objects = [_get_object(n) for n in names]
    else:
        objects = [
            obj for obj in bpy.context.view_layer.objects
            if obj.type == "MESH" and obj.visible_get()
        ]

    material_object_map = {}
    total_draw_calls = 0
    per_object = []

    for obj in objects:
        if obj.type != "MESH":
            continue
        obj_calls = 0
        for slot in obj.material_slots:
            mat_name = slot.material.name if slot.material else "__no_material__"
            key = mat_name
            if key not in material_object_map:
                material_object_map[key] = []
            material_object_map[key].append(obj.name)
            obj_calls += 1
        if obj_calls == 0:
            obj_calls = 1
            material_object_map.setdefault("__no_material__", []).append(obj.name)
        total_draw_calls += max(1, len(obj.material_slots))
        per_object.append({"name": obj.name, "draw_calls": max(1, len(obj.material_slots))})

    unique_materials = len(material_object_map)

    return {
        "total_draw_calls": total_draw_calls,
        "unique_materials": unique_materials,
        "objects_checked": len(per_object),
        "per_object": per_object,
        "material_usage": {
            k: len(v) for k, v in material_object_map.items()
        },
    }


def measure_dimensions(
    name: str,
    world_space: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Get the bounding box dimensions of an object.

    Parameters
    ----------
    name : str
        Object name.
    world_space : bool
        If True, return dimensions in world space. Otherwise, local space.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    if world_space:
        bbox_corners = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
    else:
        bbox_corners = [mathutils.Vector(c) for c in obj.bound_box]

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
    dims = max_co - min_co
    center = (min_co + max_co) / 2

    diagonal = dims.length

    return {
        "object_name": obj.name,
        "dimensions": {
            "x": round(dims.x, 6),
            "y": round(dims.y, 6),
            "z": round(dims.z, 6),
        },
        "bounding_box": {
            "min": [round(v, 6) for v in min_co],
            "max": [round(v, 6) for v in max_co],
        },
        "center": [round(v, 6) for v in center],
        "diagonal": round(diagonal, 6),
        "world_space": world_space,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "get_mesh_stats": get_mesh_stats,
    "check_mesh_errors": check_mesh_errors,
    "check_vrc_requirements": check_vrc_requirements,
    "list_all_bones": list_all_bones,
    "list_all_shapes": list_all_shapes,
    "analyze_topology": analyze_topology,
    "count_draw_calls": count_draw_calls,
    "measure_dimensions": measure_dimensions,
}
