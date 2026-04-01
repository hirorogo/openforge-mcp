"""
Advanced UV tools for OpenForge MCP.

These complement the basic UV operations in uv_tools.py with
projections, UV layer management, analysis, and export.
"""

from typing import Any, Dict, List, Optional

import bpy
import bmesh
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

def cube_project(
    name: str,
    cube_size: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply cube projection UV mapping.

    Parameters
    ----------
    name : str
        Object name.
    cube_size : float
        Size of the cube projection.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.uv.cube_project(cube_size=cube_size)
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "method": "cube_project",
        "cube_size": cube_size,
    }


def cylinder_project(
    name: str,
    direction: str = "VIEW_ON_EQUATOR",
    align: str = "POLAR_ZX",
    scale_to_bounds: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply cylinder projection UV mapping.

    Parameters
    ----------
    name : str
        Object name.
    direction : str
        Projection direction: VIEW_ON_EQUATOR, VIEW_ON_POLES, or ALIGN_TO_OBJECT.
    align : str
        Alignment: POLAR_ZX or POLAR_ZY.
    scale_to_bounds : bool
        Scale UVs to fit within bounds.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.uv.cylinder_project(
        direction=direction.upper(),
        align=align.upper(),
        scale_to_bounds=scale_to_bounds,
    )
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "method": "cylinder_project",
        "direction": direction.upper(),
    }


def sphere_project(
    name: str,
    direction: str = "VIEW_ON_EQUATOR",
    align: str = "POLAR_ZX",
    scale_to_bounds: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply sphere projection UV mapping.

    Parameters
    ----------
    name : str
        Object name.
    direction : str
        Projection direction: VIEW_ON_EQUATOR, VIEW_ON_POLES, or ALIGN_TO_OBJECT.
    align : str
        Alignment: POLAR_ZX or POLAR_ZY.
    scale_to_bounds : bool
        Scale UVs to fit within bounds.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.uv.sphere_project(
        direction=direction.upper(),
        align=align.upper(),
        scale_to_bounds=scale_to_bounds,
    )
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "method": "sphere_project",
        "direction": direction.upper(),
    }


def create_uv_layer(
    name: str,
    layer_name: str = "UVMap",
    set_active: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a new UV layer on a mesh.

    Parameters
    ----------
    name : str
        Object name.
    layer_name : str
        Name for the new UV layer.
    set_active : bool
        If True, set the new layer as active.
    """
    obj = _get_mesh_object(name)
    uv_layer = obj.data.uv_layers.new(name=layer_name)
    if set_active:
        obj.data.uv_layers.active = uv_layer
    return {
        "object_name": obj.name,
        "layer_name": uv_layer.name,
        "total_layers": len(obj.data.uv_layers),
        "is_active": set_active,
    }


def list_uv_layers(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """List all UV layers on a mesh.

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_mesh_object(name)
    layers = []
    active_name = obj.data.uv_layers.active.name if obj.data.uv_layers.active else None
    for uv in obj.data.uv_layers:
        layers.append({
            "name": uv.name,
            "is_active": uv.name == active_name,
        })
    return {
        "object_name": obj.name,
        "layer_count": len(layers),
        "layers": layers,
        "active_layer": active_name,
    }


def delete_uv_layer(
    name: str,
    layer_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Delete a UV layer from a mesh.

    Parameters
    ----------
    name : str
        Object name.
    layer_name : str
        Name of the UV layer to delete.
    """
    obj = _get_mesh_object(name)
    uv_layer = obj.data.uv_layers.get(layer_name)
    if uv_layer is None:
        available = [uv.name for uv in obj.data.uv_layers]
        raise ValueError(
            f"UV layer '{layer_name}' not found. Available: {available}"
        )
    obj.data.uv_layers.remove(uv_layer)
    return {
        "object_name": obj.name,
        "deleted_layer": layer_name,
        "remaining_layers": len(obj.data.uv_layers),
    }


def rename_uv_layer(
    name: str,
    old_name: str,
    new_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Rename a UV layer.

    Parameters
    ----------
    name : str
        Object name.
    old_name : str
        Current UV layer name.
    new_name : str
        New UV layer name.
    """
    obj = _get_mesh_object(name)
    uv_layer = obj.data.uv_layers.get(old_name)
    if uv_layer is None:
        available = [uv.name for uv in obj.data.uv_layers]
        raise ValueError(
            f"UV layer '{old_name}' not found. Available: {available}"
        )
    uv_layer.name = new_name
    return {
        "object_name": obj.name,
        "old_name": old_name,
        "new_name": uv_layer.name,
    }


def set_active_uv(
    name: str,
    layer_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the active UV layer.

    Parameters
    ----------
    name : str
        Object name.
    layer_name : str
        Name of the UV layer to make active.
    """
    obj = _get_mesh_object(name)
    uv_layer = obj.data.uv_layers.get(layer_name)
    if uv_layer is None:
        available = [uv.name for uv in obj.data.uv_layers]
        raise ValueError(
            f"UV layer '{layer_name}' not found. Available: {available}"
        )
    obj.data.uv_layers.active = uv_layer
    return {
        "object_name": obj.name,
        "active_layer": uv_layer.name,
    }


def average_island_scale(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Average the scale of UV islands so they have uniform texel density.

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.uv.average_islands_scale()
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "action": "average_island_scale",
    }


def minimize_stretch(
    name: str,
    iterations: int = 128,
    blend: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Minimize UV stretch to reduce distortion.

    Parameters
    ----------
    name : str
        Object name.
    iterations : int
        Number of relaxation iterations.
    blend : float
        Blend factor (0.0 to 1.0).
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.uv.minimize_stretch(
        iterations=max(1, iterations),
        blend=max(0.0, min(1.0, blend)),
    )
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "iterations": iterations,
        "blend": blend,
    }


def select_overlapping(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Select overlapping UV faces.

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.uv.select_overlap()
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "action": "select_overlapping",
    }


def stitch_uvs(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Stitch selected UV edges together.

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj, select_all=False)
    bpy.ops.uv.stitch(use_limit=True, limit=0.01)
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "action": "stitch_uvs",
    }


def export_uv_layout(
    name: str,
    filepath: str,
    size_x: int = 1024,
    size_y: int = 1024,
    opacity: float = 0.25,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Export UV layout as an image file.

    Parameters
    ----------
    name : str
        Object name.
    filepath : str
        Output image file path (PNG or SVG).
    size_x : int
        Image width in pixels.
    size_y : int
        Image height in pixels.
    opacity : float
        Fill opacity (0.0 to 1.0).
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.uv.export_layout(
        filepath=filepath,
        size=(size_x, size_y),
        opacity=max(0.0, min(1.0, opacity)),
    )
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "filepath": filepath,
        "size": [size_x, size_y],
        "opacity": opacity,
    }


def analyze_distortion(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Analyze UV distortion per face and return statistics.

    Computes area ratio between 3D face area and UV face area to
    measure texel density variation across the mesh.

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_mesh_object(name)
    _ensure_object_mode()

    mesh = obj.data
    if not mesh.uv_layers.active:
        raise ValueError(f"Object '{name}' has no active UV layer")

    mesh.calc_loop_triangles()

    uv_layer = mesh.uv_layers.active.data
    face_ratios = []

    for poly in mesh.polygons:
        # Compute 3D area
        area_3d = poly.area
        if area_3d < 1e-10:
            continue

        # Compute UV area using the shoelace formula
        loop_uvs = [uv_layer[li].uv for li in poly.loop_indices]
        n = len(loop_uvs)
        area_uv = 0.0
        for i in range(n):
            j = (i + 1) % n
            area_uv += loop_uvs[i][0] * loop_uvs[j][1]
            area_uv -= loop_uvs[j][0] * loop_uvs[i][1]
        area_uv = abs(area_uv) * 0.5

        if area_uv > 1e-10:
            face_ratios.append(area_uv / area_3d)

    if not face_ratios:
        return {
            "object_name": obj.name,
            "face_count": 0,
            "error": "No valid faces for distortion analysis",
        }

    avg_ratio = sum(face_ratios) / len(face_ratios)
    min_ratio = min(face_ratios)
    max_ratio = max(face_ratios)
    variance = sum((r - avg_ratio) ** 2 for r in face_ratios) / len(face_ratios)

    return {
        "object_name": obj.name,
        "face_count": len(face_ratios),
        "average_ratio": round(avg_ratio, 6),
        "min_ratio": round(min_ratio, 6),
        "max_ratio": round(max_ratio, 6),
        "variance": round(variance, 8),
        "uniformity": round(1.0 - min(1.0, variance / max(avg_ratio, 1e-10)), 4),
    }


def get_uv_info(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Get UV information: island count, bounds, and total UV area.

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_mesh_object(name)
    _ensure_object_mode()

    mesh = obj.data
    if not mesh.uv_layers.active:
        raise ValueError(f"Object '{name}' has no active UV layer")

    uv_layer = mesh.uv_layers.active.data

    # Collect all UV coordinates
    all_uvs = [uv_layer[li].uv for poly in mesh.polygons for li in poly.loop_indices]

    if not all_uvs:
        return {
            "object_name": obj.name,
            "uv_layer": mesh.uv_layers.active.name,
            "island_count": 0,
            "bounds": {"min_u": 0, "min_v": 0, "max_u": 0, "max_v": 0},
            "total_area": 0.0,
        }

    min_u = min(uv[0] for uv in all_uvs)
    max_u = max(uv[0] for uv in all_uvs)
    min_v = min(uv[1] for uv in all_uvs)
    max_v = max(uv[1] for uv in all_uvs)

    # Estimate island count via bmesh
    _select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bm = bmesh.from_edit_mesh(mesh)
    bm.faces.ensure_lookup_table()

    uv_bm_layer = bm.loops.layers.uv.active
    island_count = 0
    if uv_bm_layer:
        visited = set()
        for face in bm.faces:
            if face.index not in visited:
                island_count += 1
                # BFS to find connected UV faces
                queue = [face]
                while queue:
                    f = queue.pop()
                    if f.index in visited:
                        continue
                    visited.add(f.index)
                    for edge in f.edges:
                        for linked_face in edge.link_faces:
                            if linked_face.index not in visited:
                                # Check if faces share UV coordinates at the shared edge
                                shared = False
                                for loop in f.loops:
                                    if loop.edge == edge:
                                        for oloop in linked_face.loops:
                                            if oloop.edge == edge:
                                                if (loop[uv_bm_layer].uv -
                                                        oloop[uv_bm_layer].uv).length < 1e-5:
                                                    shared = True
                                                    break
                                        break
                                if shared:
                                    queue.append(linked_face)

    bpy.ops.object.mode_set(mode="OBJECT")

    # Compute total UV area
    total_area = 0.0
    for poly in mesh.polygons:
        loop_uvs = [uv_layer[li].uv for li in poly.loop_indices]
        n = len(loop_uvs)
        a = 0.0
        for i in range(n):
            j = (i + 1) % n
            a += loop_uvs[i][0] * loop_uvs[j][1]
            a -= loop_uvs[j][0] * loop_uvs[i][1]
        total_area += abs(a) * 0.5

    return {
        "object_name": obj.name,
        "uv_layer": mesh.uv_layers.active.name,
        "island_count": island_count,
        "bounds": {
            "min_u": round(min_u, 6),
            "min_v": round(min_v, 6),
            "max_u": round(max_u, 6),
            "max_v": round(max_v, 6),
        },
        "total_area": round(total_area, 6),
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "cube_project": cube_project,
    "cylinder_project": cylinder_project,
    "sphere_project": sphere_project,
    "create_uv_layer": create_uv_layer,
    "list_uv_layers": list_uv_layers,
    "delete_uv_layer": delete_uv_layer,
    "rename_uv_layer": rename_uv_layer,
    "set_active_uv": set_active_uv,
    "average_island_scale": average_island_scale,
    "minimize_stretch": minimize_stretch,
    "select_overlapping": select_overlapping,
    "stitch_uvs": stitch_uvs,
    "export_uv_layout": export_uv_layout,
    "analyze_distortion": analyze_distortion,
    "get_uv_info": get_uv_info,
}
