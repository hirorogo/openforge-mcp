"""
UV mapping tools for OpenForge MCP.

Tools for UV unwrapping, seam management, and UV island manipulation.
"""

from typing import Any, Dict, List, Optional

import bpy
import math


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

def smart_uv_project(
    name: str,
    angle_limit: float = 66.0,
    island_margin: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Perform Smart UV Project on a mesh object.

    Parameters
    ----------
    name : str
        Object name.
    angle_limit : float
        Angle limit in degrees for projection.
    island_margin : float
        Margin between UV islands.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.uv.smart_project(
        angle_limit=math.radians(angle_limit),
        island_margin=island_margin,
    )
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "method": "smart_uv_project",
        "angle_limit": angle_limit,
        "island_margin": island_margin,
    }


def unwrap_uv(
    name: str,
    method: str = "ANGLE_BASED",
    margin: float = 0.001,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Unwrap the UV map of a mesh object.

    Parameters
    ----------
    name : str
        Object name.
    method : str
        ANGLE_BASED or CONFORMAL.
    margin : float
        Space between UV islands.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.uv.unwrap(method=method.upper(), margin=margin)
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "method": method.upper(),
        "margin": margin,
    }


def mark_seam(
    name: str,
    edge_indices: Optional[List[int]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Mark edges as UV seams.

    Parameters
    ----------
    name : str
        Object name.
    edge_indices : list[int], optional
        Indices of edges to mark. If None, marks currently selected edges.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj, select_all=False)

    if edge_indices is not None:
        bpy.ops.mesh.select_all(action="DESELECT")
        bpy.ops.object.mode_set(mode="OBJECT")
        for idx in edge_indices:
            if idx < len(obj.data.edges):
                obj.data.edges[idx].select = True
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_mode(type="EDGE")

    bpy.ops.mesh.mark_seam(clear=False)
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "action": "mark_seam",
        "edge_indices": edge_indices,
    }


def clear_seam(
    name: str,
    edge_indices: Optional[List[int]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Clear UV seams from edges.

    Parameters
    ----------
    name : str
        Object name.
    edge_indices : list[int], optional
        Indices of edges to clear seams from. If None, clears all selected.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj, select_all=(edge_indices is None))

    if edge_indices is not None:
        bpy.ops.mesh.select_all(action="DESELECT")
        bpy.ops.object.mode_set(mode="OBJECT")
        for idx in edge_indices:
            if idx < len(obj.data.edges):
                obj.data.edges[idx].select = True
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_mode(type="EDGE")

    bpy.ops.mesh.mark_seam(clear=True)
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "action": "clear_seam",
    }


def pack_uv_islands(
    name: str,
    margin: float = 0.001,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Pack UV islands to fit within the UV space.

    Parameters
    ----------
    name : str
        Object name.
    margin : float
        Space between packed islands.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.uv.pack_islands(margin=margin)
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "margin": margin,
    }


def scale_uv(
    name: str,
    scale_u: float = 1.0,
    scale_v: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Scale UV coordinates of a mesh.

    Parameters
    ----------
    name : str
        Object name.
    scale_u : float
        Scale factor for U axis.
    scale_v : float
        Scale factor for V axis.
    """
    obj = _get_mesh_object(name)
    if not obj.data.uv_layers:
        raise ValueError(f"Object '{name}' has no UV layers")

    uv_layer = obj.data.uv_layers.active
    for loop in uv_layer.data:
        loop.uv[0] *= scale_u
        loop.uv[1] *= scale_v

    return {
        "object_name": obj.name,
        "scale_u": scale_u,
        "scale_v": scale_v,
    }


def rotate_uv(
    name: str,
    angle: float = 90.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Rotate UV coordinates of a mesh around the UV center.

    Parameters
    ----------
    name : str
        Object name.
    angle : float
        Rotation angle in degrees.
    """
    obj = _get_mesh_object(name)
    if not obj.data.uv_layers:
        raise ValueError(f"Object '{name}' has no UV layers")

    rad = math.radians(angle)
    cos_a = math.cos(rad)
    sin_a = math.sin(rad)
    center_u, center_v = 0.5, 0.5

    uv_layer = obj.data.uv_layers.active
    for loop in uv_layer.data:
        u = loop.uv[0] - center_u
        v = loop.uv[1] - center_v
        loop.uv[0] = u * cos_a - v * sin_a + center_u
        loop.uv[1] = u * sin_a + v * cos_a + center_v

    return {
        "object_name": obj.name,
        "angle": angle,
    }


def align_uv(
    name: str,
    axis: str = "AUTO",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Align selected UV vertices to an axis.

    Parameters
    ----------
    name : str
        Object name.
    axis : str
        ALIGN_S (straighten), ALIGN_T, ALIGN_U, ALIGN_AUTO_V, or AUTO.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.uv.align(axis=axis.upper())
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "axis": axis.upper(),
    }


def project_from_view(
    name: str,
    orthographic: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Project UVs from the current 3D viewport view.

    Parameters
    ----------
    name : str
        Object name.
    orthographic : bool
        If True, use orthographic projection. Otherwise perspective.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)

    # Find a 3D viewport for the override
    area = None
    region = None
    for a in bpy.context.screen.areas:
        if a.type == "VIEW_3D":
            area = a
            for r in a.regions:
                if r.type == "WINDOW":
                    region = r
                    break
            break

    if area is not None and region is not None:
        try:
            with bpy.context.temp_override(area=area, region=region):
                bpy.ops.uv.project_from_view(
                    orthographic=orthographic,
                    scale_to_bounds=True,
                )
        except (AttributeError, TypeError):
            override = bpy.context.copy()
            override["area"] = area
            override["region"] = region
            bpy.ops.uv.project_from_view(
                override,
                orthographic=orthographic,
                scale_to_bounds=True,
            )
    else:
        bpy.ops.uv.project_from_view(
            orthographic=orthographic,
            scale_to_bounds=True,
        )

    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "orthographic": orthographic,
    }


def reset_uv(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Reset UVs to default (each face fills the entire UV space).

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.uv.reset()
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "action": "reset_uv",
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "smart_uv_project": smart_uv_project,
    "unwrap_uv": unwrap_uv,
    "mark_seam": mark_seam,
    "clear_seam": clear_seam,
    "pack_uv_islands": pack_uv_islands,
    "scale_uv": scale_uv,
    "rotate_uv": rotate_uv,
    "align_uv": align_uv,
    "project_from_view": project_from_view,
    "reset_uv": reset_uv,
}
