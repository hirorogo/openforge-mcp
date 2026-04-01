"""
Sculpt tools for OpenForge MCP.

Tools for entering sculpt mode, configuring brushes, and mesh operations.
"""

from typing import Any, Dict, Optional

import bpy


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_mesh_object(name: str) -> bpy.types.Object:
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


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def enter_sculpt_mode(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Enter sculpt mode for a mesh object.

    Parameters
    ----------
    name : str
        Mesh object name.
    """
    obj = _get_mesh_object(name)
    _ensure_object_mode()
    _select_only(obj)
    bpy.ops.object.mode_set(mode="SCULPT")
    return {
        "object_name": obj.name,
        "mode": "SCULPT",
    }


def set_sculpt_brush(
    brush_type: str = "DRAW",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the active sculpt brush type.

    Parameters
    ----------
    brush_type : str
        Brush type: DRAW, CLAY, CLAY_STRIPS, LAYER, INFLATE, BLOB,
        CREASE, SMOOTH, FLATTEN, FILL, SCRAPE, PINCH, GRAB, SNAKE_HOOK,
        THUMB, NUDGE, ROTATE, MASK.
    """
    brush_type = brush_type.upper()
    if bpy.context.active_object is None or bpy.context.active_object.mode != "SCULPT":
        raise RuntimeError("Must be in sculpt mode to set brush type")

    tool_settings = bpy.context.tool_settings
    sculpt = tool_settings.sculpt

    # Find or set the brush
    brush = None
    for b in bpy.data.brushes:
        if b.use_paint_sculpt and b.sculpt_tool == brush_type:
            brush = b
            break

    if brush is None:
        # Create a new brush with the requested type
        brush = bpy.data.brushes.new(name=brush_type, mode="SCULPT")
        brush.sculpt_tool = brush_type

    sculpt.brush = brush

    return {
        "brush_type": brush_type,
        "brush_name": brush.name,
    }


def set_brush_strength(
    strength: float = 0.5,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the strength of the current sculpt brush.

    Parameters
    ----------
    strength : float
        Brush strength (0.0-1.0).
    """
    tool_settings = bpy.context.tool_settings
    if tool_settings.sculpt and tool_settings.sculpt.brush:
        brush = tool_settings.sculpt.brush
        brush.strength = max(0.0, min(1.0, strength))
        return {
            "brush_name": brush.name,
            "strength": brush.strength,
        }
    raise RuntimeError("No active sculpt brush found")


def set_brush_radius(
    radius: int = 50,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the radius of the current sculpt brush.

    Parameters
    ----------
    radius : int
        Brush radius in pixels.
    """
    tool_settings = bpy.context.tool_settings
    if tool_settings.sculpt and tool_settings.sculpt.brush:
        brush = tool_settings.sculpt.brush
        brush.size = max(1, radius)
        return {
            "brush_name": brush.name,
            "radius": brush.size,
        }
    raise RuntimeError("No active sculpt brush found")


def enable_dynamic_topology(
    name: str,
    detail_size: float = 12.0,
    detail_mode: str = "RELATIVE_DETAIL",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Enable dynamic topology (dyntopo) for sculpting.

    Parameters
    ----------
    name : str
        Mesh object name.
    detail_size : float
        Detail level for dyntopo.
    detail_mode : str
        RELATIVE_DETAIL, CONSTANT_DETAIL, or BRUSH_DETAIL.
    """
    obj = _get_mesh_object(name)
    _ensure_object_mode()
    _select_only(obj)
    bpy.ops.object.mode_set(mode="SCULPT")

    if not bpy.context.sculpt_object.use_dynamic_topology_sculpting:
        bpy.ops.sculpt.dynamic_topology_toggle()

    tool_settings = bpy.context.tool_settings
    tool_settings.sculpt.detail_size = detail_size
    tool_settings.sculpt.detail_type_method = detail_mode.upper()

    return {
        "object_name": obj.name,
        "dynamic_topology": True,
        "detail_size": detail_size,
        "detail_mode": detail_mode.upper(),
    }


def smooth_mesh(
    name: str,
    iterations: int = 1,
    factor: float = 0.5,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Smooth a mesh using the smooth vertices operator.

    Parameters
    ----------
    name : str
        Mesh object name.
    iterations : int
        Number of smoothing passes.
    factor : float
        Smoothing factor (0.0-1.0).
    """
    obj = _get_mesh_object(name)
    _ensure_object_mode()
    _select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.vertices_smooth(factor=factor, repeat=iterations)
    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "object_name": obj.name,
        "iterations": iterations,
        "factor": factor,
    }


def remesh_voxel(
    name: str,
    voxel_size: float = 0.1,
    adaptivity: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply voxel remeshing to a mesh.

    Parameters
    ----------
    name : str
        Mesh object name.
    voxel_size : float
        Size of voxels (smaller = more detail).
    adaptivity : float
        Adaptivity for reducing face count in flat areas (0.0-1.0).
    """
    obj = _get_mesh_object(name)
    _ensure_object_mode()
    _select_only(obj)

    face_count_before = len(obj.data.polygons)
    obj.data.remesh_voxel_size = max(0.001, voxel_size)
    obj.data.remesh_voxel_adaptivity = max(0.0, min(1.0, adaptivity))
    bpy.ops.object.voxel_remesh()

    face_count_after = len(obj.data.polygons)
    return {
        "object_name": obj.name,
        "voxel_size": voxel_size,
        "face_count_before": face_count_before,
        "face_count_after": face_count_after,
    }


def apply_sculpt(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Exit sculpt mode and return to object mode, preserving sculpt changes.

    Parameters
    ----------
    name : str
        Mesh object name.
    """
    obj = _get_mesh_object(name)
    if bpy.context.active_object and bpy.context.active_object.mode == "SCULPT":
        # If dyntopo is active, it will be applied on mode switch
        bpy.ops.object.mode_set(mode="OBJECT")

    vert_count = len(obj.data.vertices)
    face_count = len(obj.data.polygons)

    return {
        "object_name": obj.name,
        "mode": "OBJECT",
        "vertex_count": vert_count,
        "face_count": face_count,
    }


def symmetrize_mesh(
    name: str,
    direction: str = "NEGATIVE_X",
    threshold: float = 0.001,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Symmetrize a mesh by mirroring one half onto the other.

    Parameters
    ----------
    name : str
        Mesh object name.
    direction : str
        Symmetry direction: NEGATIVE_X, POSITIVE_X, NEGATIVE_Y, POSITIVE_Y,
        NEGATIVE_Z, POSITIVE_Z.
    threshold : float
        Distance threshold for merging vertices.
    """
    obj = _get_mesh_object(name)
    _ensure_object_mode()
    _select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.symmetrize(direction=direction.upper(), threshold=threshold)
    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "object_name": obj.name,
        "direction": direction.upper(),
        "vertex_count": len(obj.data.vertices),
    }


def set_smooth_shading(
    name: str,
    smooth: bool = True,
    auto_smooth_angle: float = 30.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set smooth or flat shading on a mesh object.

    Parameters
    ----------
    name : str
        Mesh object name.
    smooth : bool
        True for smooth shading, False for flat.
    auto_smooth_angle : float
        Auto smooth angle in degrees (used when smooth is True).
    """
    import math as _math
    obj = _get_mesh_object(name)
    _ensure_object_mode()
    _select_only(obj)

    if smooth:
        bpy.ops.object.shade_smooth()
        obj.data.use_auto_smooth = True
        obj.data.auto_smooth_angle = _math.radians(auto_smooth_angle)
    else:
        bpy.ops.object.shade_flat()

    return {
        "object_name": obj.name,
        "smooth": smooth,
        "auto_smooth_angle": auto_smooth_angle if smooth else 0,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "enter_sculpt_mode": enter_sculpt_mode,
    "set_sculpt_brush": set_sculpt_brush,
    "set_brush_strength": set_brush_strength,
    "set_brush_radius": set_brush_radius,
    "enable_dynamic_topology": enable_dynamic_topology,
    "smooth_mesh": smooth_mesh,
    "remesh_voxel": remesh_voxel,
    "apply_sculpt": apply_sculpt,
    "symmetrize_mesh": symmetrize_mesh,
    "set_smooth_shading": set_smooth_shading,
}
