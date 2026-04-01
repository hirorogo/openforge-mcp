"""
Mesh cleanup and repair tools for OpenForge MCP.

Provides tools for removing duplicate vertices, fixing non-manifold geometry,
cleaning unused materials, joining/separating meshes, filling holes,
deleting vertices by position, and recalculating or flipping normals.
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


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def remove_doubles(
    name: str,
    threshold: float = 0.0001,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Remove duplicate vertices within a distance threshold.

    Parameters
    ----------
    name : str
        Object name.
    threshold : float
        Maximum distance between vertices to merge.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    original_verts = len(obj.data.vertices)
    _select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=threshold)
    bpy.ops.object.mode_set(mode="OBJECT")

    final_verts = len(obj.data.vertices)
    removed = original_verts - final_verts

    return {
        "object_name": obj.name,
        "original_vertices": original_verts,
        "final_vertices": final_verts,
        "removed": removed,
        "threshold": threshold,
    }


def fix_non_manifold(
    name: str,
    fill_holes: bool = True,
    remove_interior: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Attempt to fix non-manifold geometry.

    Selects non-manifold elements and applies fixes such as filling holes
    and removing interior faces.

    Parameters
    ----------
    name : str
        Object name.
    fill_holes : bool
        Fill boundary edges to close holes.
    remove_interior : bool
        Remove interior faces that cause non-manifold issues.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    _select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")

    actions = []

    if remove_interior:
        bpy.ops.mesh.select_all(action="DESELECT")
        bpy.ops.mesh.select_interior_faces()
        bpy.ops.mesh.delete(type="FACE")
        actions.append("removed_interior_faces")

    if fill_holes:
        bpy.ops.mesh.select_all(action="DESELECT")
        bpy.ops.mesh.select_non_manifold(
            extend=False, use_wire=False, use_boundary=True,
            use_multi_face=False, use_non_contiguous=False, use_verts=False,
        )
        bpy.ops.mesh.fill()
        actions.append("filled_boundary_holes")

    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.mesh.select_non_manifold()
    bm = bmesh.from_edit_mesh(obj.data)
    remaining = sum(1 for e in bm.edges if e.select)

    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "object_name": obj.name,
        "actions": actions,
        "remaining_non_manifold_edges": remaining,
    }


def clean_unused_materials(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Remove material slots that have no faces assigned to them.

    Parameters
    ----------
    name : str
        Object name.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    mesh = obj.data
    used_indices = set()
    for poly in mesh.polygons:
        used_indices.add(poly.material_index)

    original_count = len(obj.material_slots)
    removed = []

    indices_to_remove = []
    for i in range(len(obj.material_slots)):
        if i not in used_indices:
            mat = obj.material_slots[i].material
            mat_name = mat.name if mat else f"slot_{i}"
            indices_to_remove.append(i)
            removed.append(mat_name)

    _select_only(obj)
    for idx in reversed(indices_to_remove):
        obj.active_material_index = idx
        bpy.ops.object.material_slot_remove()

    return {
        "object_name": obj.name,
        "original_slot_count": original_count,
        "removed_slots": removed,
        "remaining_slots": len(obj.material_slots),
    }


def join_meshes(
    names: List[str],
    result_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Join multiple mesh objects into a single object.

    Parameters
    ----------
    names : list[str]
        Object names to join. The first becomes the active (receiving) object.
    result_name : str, optional
        Name for the resulting joined object.
    """
    if len(names) < 2:
        raise ValueError("At least two object names are required")

    _ensure_object_mode()
    bpy.ops.object.select_all(action="DESELECT")

    active = _get_object(names[0])
    active.select_set(True)
    bpy.context.view_layer.objects.active = active

    for obj_name in names[1:]:
        obj = _get_object(obj_name)
        if obj.type != "MESH":
            raise ValueError(f"Object '{obj_name}' is not a mesh")
        obj.select_set(True)

    bpy.ops.object.join()
    result = bpy.context.active_object

    if result_name:
        result.name = result_name
        if result.data:
            result.data.name = result_name

    return {
        "result_name": result.name,
        "source_objects": names,
        "vertex_count": len(result.data.vertices),
        "face_count": len(result.data.polygons),
    }


def separate_by_loose(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Separate a mesh into individual objects by disconnected (loose) parts.

    Parameters
    ----------
    name : str
        Object name.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    _select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="LOOSE")
    bpy.ops.object.mode_set(mode="OBJECT")

    resulting = [o.name for o in bpy.context.selected_objects]

    return {
        "original": name,
        "resulting_objects": resulting,
        "count": len(resulting),
    }


def separate_by_material(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Separate a mesh into individual objects by material assignment.

    Parameters
    ----------
    name : str
        Object name.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    _select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="MATERIAL")
    bpy.ops.object.mode_set(mode="OBJECT")

    resulting = [o.name for o in bpy.context.selected_objects]

    return {
        "original": name,
        "resulting_objects": resulting,
        "count": len(resulting),
    }


def fill_boundary_holes(
    name: str,
    sides: int = 0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Fill holes (boundary edge loops) in a mesh.

    Parameters
    ----------
    name : str
        Object name.
    sides : int
        If > 0, only fill holes with this many boundary edges or fewer.
        0 means fill all holes.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    _select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")

    bpy.ops.mesh.select_mode(type="EDGE")
    bpy.ops.mesh.select_non_manifold(
        extend=False, use_wire=False, use_boundary=True,
        use_multi_face=False, use_non_contiguous=False, use_verts=False,
    )

    bm = bmesh.from_edit_mesh(obj.data)
    boundary_edges_before = sum(1 for e in bm.edges if e.select)

    if sides > 0:
        bpy.ops.mesh.select_all(action="DESELECT")
        bpy.ops.mesh.select_non_manifold(
            extend=False, use_wire=False, use_boundary=True,
            use_multi_face=False, use_non_contiguous=False, use_verts=False,
        )
        bpy.ops.mesh.fill_holes(sides=sides)
    else:
        bpy.ops.mesh.fill()

    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.mesh.select_non_manifold(
        extend=False, use_wire=False, use_boundary=True,
        use_multi_face=False, use_non_contiguous=False, use_verts=False,
    )
    bm = bmesh.from_edit_mesh(obj.data)
    boundary_edges_after = sum(1 for e in bm.edges if e.select)

    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "object_name": obj.name,
        "boundary_edges_before": boundary_edges_before,
        "boundary_edges_after": boundary_edges_after,
        "holes_filled": boundary_edges_before > boundary_edges_after,
    }


def delete_by_position(
    name: str,
    axis: str = "Z",
    threshold: float = 0.0,
    mode: str = "BELOW",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Delete vertices based on their position along an axis.

    Parameters
    ----------
    name : str
        Object name.
    axis : str
        Axis to check: X, Y, or Z.
    threshold : float
        Position threshold value.
    mode : str
        BELOW deletes vertices below threshold, ABOVE deletes above.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    axis_map = {"X": 0, "Y": 1, "Z": 2}
    axis_idx = axis_map.get(axis.upper())
    if axis_idx is None:
        raise ValueError(f"Invalid axis '{axis}'. Use X, Y, or Z.")

    original_verts = len(obj.data.vertices)

    _select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")

    for vert in obj.data.vertices:
        world_pos = obj.matrix_world @ vert.co
        val = world_pos[axis_idx]
        if mode.upper() == "BELOW" and val < threshold:
            vert.select = True
        elif mode.upper() == "ABOVE" and val > threshold:
            vert.select = True

    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")

    final_verts = len(obj.data.vertices)

    return {
        "object_name": obj.name,
        "axis": axis.upper(),
        "threshold": threshold,
        "mode": mode.upper(),
        "original_vertices": original_verts,
        "final_vertices": final_verts,
        "deleted": original_verts - final_verts,
    }


def recalculate_normals(
    name: str,
    inside: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Recalculate face normals to point consistently outward (or inward).

    Parameters
    ----------
    name : str
        Object name.
    inside : bool
        If True, normals point inward instead of outward.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    _select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=inside)
    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "object_name": obj.name,
        "inside": inside,
    }


def flip_normals(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Flip all face normals of a mesh.

    Parameters
    ----------
    name : str
        Object name.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    _select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.flip_normals()
    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "object_name": obj.name,
        "flipped": True,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "remove_doubles": remove_doubles,
    "fix_non_manifold": fix_non_manifold,
    "clean_unused_materials": clean_unused_materials,
    "join_meshes": join_meshes,
    "separate_by_loose": separate_by_loose,
    "separate_by_material": separate_by_material,
    "fill_boundary_holes": fill_boundary_holes,
    "delete_by_position": delete_by_position,
    "recalculate_normals": recalculate_normals,
    "flip_normals": flip_normals,
}
