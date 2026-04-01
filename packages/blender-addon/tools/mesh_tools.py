"""
Mesh editing tools for OpenForge MCP.

These tools operate on mesh geometry and require entering Edit Mode.
"""

from typing import Any, Dict, List, Optional

import bpy


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_mesh_object(name: str) -> bpy.types.Object:
    """Return the mesh object with *name*, or raise."""
    obj = bpy.data.objects.get(name)
    if obj is None:
        available = [o.name for o in bpy.data.objects]
        raise ValueError(
            f"Object '{name}' not found. Available objects: {available}"
        )
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh (type: {obj.type})")
    return obj


def _select_only(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def _ensure_object_mode() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def _enter_edit_mode(obj: bpy.types.Object, select_all: bool = True) -> None:
    _ensure_object_mode()
    _select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    if select_all:
        bpy.ops.mesh.select_all(action="SELECT")


def _return_to_object_mode() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def extrude(
    name: str,
    value: float = 1.0,
    direction: Optional[List[float]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Extrude selected faces of a mesh along a direction.

    Parameters
    ----------
    name : str
        Object name.
    value : float
        Extrusion distance.
    direction : list[float], optional
        Normalized XYZ direction vector.  Defaults to face normals (0, 0, 1).
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)

    move_vec = tuple(direction) if direction else (0.0, 0.0, value)
    if direction:
        move_vec = tuple(d * value for d in direction)

    bpy.ops.mesh.extrude_region_move(
        TRANSFORM_OT_translate={"value": move_vec}
    )

    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "extrude_value": value,
        "direction": list(move_vec),
    }


def bevel(
    name: str,
    width: float = 0.1,
    segments: int = 1,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bevel edges of a mesh.

    Parameters
    ----------
    name : str
        Object name.
    width : float
        Bevel width / offset amount.
    segments : int
        Number of bevel segments.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)

    bpy.ops.mesh.bevel(
        offset=width,
        offset_pct=0,
        segments=segments,
        affect="EDGES",
    )

    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "width": width,
        "segments": segments,
    }


def subdivide(
    name: str,
    number_cuts: int = 1,
    smoothness: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Subdivide a mesh.

    Parameters
    ----------
    name : str
        Object name.
    number_cuts : int
        Number of subdivision cuts.
    smoothness : float
        Smoothness factor (0.0 - 1.0).
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)

    bpy.ops.mesh.subdivide(
        number_cuts=number_cuts,
        smoothness=smoothness,
    )

    _return_to_object_mode()

    vert_count = len(obj.data.vertices)
    face_count = len(obj.data.polygons)
    return {
        "object_name": obj.name,
        "number_cuts": number_cuts,
        "vertex_count": vert_count,
        "face_count": face_count,
    }


def boolean_operation(
    name: str,
    target: str,
    operation: str = "DIFFERENCE",
    apply: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply a boolean modifier.

    Parameters
    ----------
    name : str
        Object that receives the modifier.
    target : str
        Object used as the boolean operand.
    operation : str
        UNION, DIFFERENCE, or INTERSECT.
    apply : bool
        Whether to apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_mesh_object(name)
    target_obj = _get_mesh_object(target)

    operation = operation.upper()
    if operation not in ("UNION", "DIFFERENCE", "INTERSECT"):
        raise ValueError(
            f"Invalid boolean operation '{operation}'. "
            f"Must be UNION, DIFFERENCE, or INTERSECT."
        )

    mod = obj.modifiers.new(name="Boolean", type="BOOLEAN")
    mod.operation = operation
    mod.object = target_obj

    result_info: Dict[str, Any] = {
        "object_name": obj.name,
        "target": target_obj.name,
        "operation": operation,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result_info["applied"] = True

    return result_info


def decimate(
    name: str,
    ratio: float = 0.5,
    apply: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add and optionally apply a Decimate modifier.

    Parameters
    ----------
    name : str
        Object name.
    ratio : float
        Decimation ratio (0.0 - 1.0).
    apply : bool
        Whether to apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_mesh_object(name)

    ratio = max(0.0, min(1.0, ratio))

    mod = obj.modifiers.new(name="Decimate", type="DECIMATE")
    mod.ratio = ratio

    face_count_before = len(obj.data.polygons)

    result_info: Dict[str, Any] = {
        "object_name": obj.name,
        "ratio": ratio,
        "face_count_before": face_count_before,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result_info["applied"] = True
        result_info["face_count_after"] = len(obj.data.polygons)

    return result_info


def merge_by_distance(
    name: str,
    threshold: float = 0.0001,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Merge vertices by distance (remove doubles).

    Parameters
    ----------
    name : str
        Object name.
    threshold : float
        Merge distance threshold.
    """
    obj = _get_mesh_object(name)
    vert_count_before = len(obj.data.vertices)

    _enter_edit_mode(obj)
    bpy.ops.mesh.remove_doubles(threshold=threshold)
    _return_to_object_mode()

    vert_count_after = len(obj.data.vertices)
    return {
        "object_name": obj.name,
        "threshold": threshold,
        "vertices_before": vert_count_before,
        "vertices_after": vert_count_after,
        "vertices_removed": vert_count_before - vert_count_after,
    }


def knife_cut(
    name: str,
    cut_normal: Optional[List[float]] = None,
    cut_offset: float = 0.0,
    clear_inner: bool = False,
    clear_outer: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bisect (knife cut) a mesh along a plane.

    Uses ``bpy.ops.mesh.bisect`` which is the non-interactive equivalent
    of the knife tool for planar cuts.

    Parameters
    ----------
    name : str
        Object name.
    cut_normal : list[float], optional
        Plane normal direction.  Defaults to (0, 0, 1) (Z-axis cut).
    cut_offset : float
        Offset of the cut plane along the normal.
    clear_inner : bool
        Delete geometry on the inner side of the plane.
    clear_outer : bool
        Delete geometry on the outer side of the plane.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)

    normal = tuple(cut_normal) if cut_normal else (0.0, 0.0, 1.0)
    plane_co = tuple(n * cut_offset for n in normal)

    bpy.ops.mesh.bisect(
        plane_co=plane_co,
        plane_no=normal,
        clear_inner=clear_inner,
        clear_outer=clear_outer,
    )

    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "cut_normal": list(normal),
        "cut_offset": cut_offset,
        "clear_inner": clear_inner,
        "clear_outer": clear_outer,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "extrude": extrude,
    "bevel": bevel,
    "subdivide": subdivide,
    "boolean_operation": boolean_operation,
    "decimate": decimate,
    "merge_by_distance": merge_by_distance,
    "knife_cut": knife_cut,
}
