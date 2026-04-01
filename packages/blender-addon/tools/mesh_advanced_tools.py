"""
Advanced mesh editing tools for OpenForge MCP.

These complement the basic mesh operations in mesh_tools.py with
professional-grade geometry manipulation.
"""

from typing import Any, Dict, List, Optional

import bpy
import math


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

def bridge_edge_loops(
    name: str,
    segments: int = 1,
    profile_shape: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bridge two selected edge loops to create connecting faces.

    Parameters
    ----------
    name : str
        Object name.
    segments : int
        Number of bridge segments.
    profile_shape : float
        Profile shape factor (0.0 to 1.0).
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj, select_all=False)
    bpy.ops.mesh.select_mode(type="EDGE")
    bpy.ops.mesh.bridge_edge_loops(
        number_cuts=max(0, segments - 1),
        profile_shape_factor=profile_shape,
    )
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "segments": segments,
        "profile_shape": profile_shape,
    }


def fill_holes(
    name: str,
    sides: int = 4,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Fill holes in a mesh by creating faces in boundary loops.

    Parameters
    ----------
    name : str
        Object name.
    sides : int
        Maximum number of sides for holes to fill.
    """
    obj = _get_mesh_object(name)
    face_count_before = len(obj.data.polygons)
    _enter_edit_mode(obj)
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.mesh.select_non_manifold(extend=False)
    bpy.ops.mesh.fill_holes(sides=sides)
    _return_to_object_mode()
    face_count_after = len(obj.data.polygons)
    return {
        "object_name": obj.name,
        "sides": sides,
        "faces_before": face_count_before,
        "faces_after": face_count_after,
        "faces_added": face_count_after - face_count_before,
    }


def flip_normals(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Flip face normals of all selected faces.

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.mesh.flip_normals()
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "action": "flip_normals",
    }


def recalculate_normals(
    name: str,
    inside: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Recalculate face normals to point outward (or inward).

    Parameters
    ----------
    name : str
        Object name.
    inside : bool
        If True, normals point inward instead of outward.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.mesh.normals_make_consistent(inside=inside)
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "inside": inside,
    }


def inset_faces(
    name: str,
    thickness: float = 0.1,
    depth: float = 0.0,
    use_individual: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Inset selected faces.

    Parameters
    ----------
    name : str
        Object name.
    thickness : float
        Inset thickness (border width).
    depth : float
        Inset depth (extrude inward/outward).
    use_individual : bool
        If True, inset each face individually.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)
    bpy.ops.mesh.inset(
        thickness=thickness,
        depth=depth,
        use_individual=use_individual,
    )
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "thickness": thickness,
        "depth": depth,
        "use_individual": use_individual,
    }


def poke_faces(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Poke faces by adding a center vertex to each selected face.

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_mesh_object(name)
    vert_count_before = len(obj.data.vertices)
    _enter_edit_mode(obj)
    bpy.ops.mesh.poke()
    _return_to_object_mode()
    vert_count_after = len(obj.data.vertices)
    return {
        "object_name": obj.name,
        "vertices_before": vert_count_before,
        "vertices_after": vert_count_after,
    }


def loop_cut(
    name: str,
    number_cuts: int = 1,
    edge_index: int = 0,
    factor: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add loop cuts to a mesh.

    Parameters
    ----------
    name : str
        Object name.
    number_cuts : int
        Number of loop cuts to add.
    edge_index : int
        Index of the edge to place the loop cut near.
    factor : float
        Offset factor for cut placement (-1.0 to 1.0).
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj, select_all=False)
    bpy.ops.mesh.loopcut_slide(
        MESH_OT_loopcut={
            "number_cuts": max(1, number_cuts),
            "smoothness": 0.0,
            "falloff": "INVERSE_SQUARE",
            "object_index": 0,
            "edge_index": edge_index,
        },
        TRANSFORM_OT_edge_slide={
            "value": max(-1.0, min(1.0, factor)),
        },
    )
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "number_cuts": number_cuts,
        "edge_index": edge_index,
        "factor": factor,
    }


def mark_sharp(
    name: str,
    edge_indices: Optional[List[int]] = None,
    clear: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Mark or clear sharp edges on a mesh.

    Parameters
    ----------
    name : str
        Object name.
    edge_indices : list[int], optional
        Indices of edges to mark. If None, marks all selected edges.
    clear : bool
        If True, clear sharp marking instead of setting it.
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

    bpy.ops.mesh.mark_sharp(clear=clear)
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "edge_indices": edge_indices,
        "clear": clear,
    }


def mark_freestyle(
    name: str,
    edge_indices: Optional[List[int]] = None,
    clear: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Mark or clear freestyle edges on a mesh.

    Parameters
    ----------
    name : str
        Object name.
    edge_indices : list[int], optional
        Indices of edges to mark. If None, marks all selected edges.
    clear : bool
        If True, clear freestyle marking instead of setting it.
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

    bpy.ops.mesh.mark_freestyle_edge(clear=clear)
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "edge_indices": edge_indices,
        "clear": clear,
    }


def set_shade_smooth(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set smooth shading on the entire object.

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_mesh_object(name)
    _ensure_object_mode()
    _select_only(obj)
    bpy.ops.object.shade_smooth()
    return {
        "object_name": obj.name,
        "shading": "smooth",
    }


def set_shade_flat(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set flat shading on the entire object.

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_mesh_object(name)
    _ensure_object_mode()
    _select_only(obj)
    bpy.ops.object.shade_flat()
    return {
        "object_name": obj.name,
        "shading": "flat",
    }


def auto_smooth(
    name: str,
    angle: float = 30.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set auto smooth angle on a mesh for automatic smooth/flat shading.

    Parameters
    ----------
    name : str
        Object name.
    angle : float
        Auto smooth angle in degrees. Faces with angles below this
        threshold will be smooth-shaded.
    """
    obj = _get_mesh_object(name)
    _ensure_object_mode()
    _select_only(obj)
    bpy.ops.object.shade_smooth()
    mesh = obj.data
    mesh.use_auto_smooth = True
    mesh.auto_smooth_angle = math.radians(max(0.0, min(180.0, angle)))
    return {
        "object_name": obj.name,
        "auto_smooth_angle": angle,
    }


def solidify(
    name: str,
    thickness: float = 0.1,
    offset: float = -1.0,
    apply: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add thickness to a mesh via Solidify modifier and optionally apply.

    Parameters
    ----------
    name : str
        Object name.
    thickness : float
        Wall thickness.
    offset : float
        Direction offset (-1 inward, 1 outward).
    apply : bool
        Whether to apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_mesh_object(name)
    mod = obj.modifiers.new(name="Solidify", type="SOLIDIFY")
    mod.thickness = thickness
    mod.offset = max(-1.0, min(1.0, offset))

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "thickness": thickness,
        "offset": offset,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def spin_mesh(
    name: str,
    angle: float = 360.0,
    steps: int = 16,
    axis: Optional[List[float]] = None,
    center: Optional[List[float]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Spin (lathe) geometry around an axis.

    Parameters
    ----------
    name : str
        Object name.
    angle : float
        Spin angle in degrees.
    steps : int
        Number of steps in the spin.
    axis : list[float], optional
        Spin axis vector. Defaults to (0, 0, 1).
    center : list[float], optional
        Center point for the spin. Defaults to (0, 0, 0).
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj)

    spin_axis = tuple(axis) if axis else (0.0, 0.0, 1.0)
    spin_center = tuple(center) if center else (0.0, 0.0, 0.0)

    bpy.ops.mesh.spin(
        steps=max(1, steps),
        angle=math.radians(angle),
        center=spin_center,
        axis=spin_axis,
    )
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "angle": angle,
        "steps": steps,
        "axis": list(spin_axis),
        "center": list(spin_center),
    }


def split_edges(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Split edges to create hard normals (custom split normals workflow).

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_mesh_object(name)
    edge_count_before = len(obj.data.edges)
    _enter_edit_mode(obj)
    bpy.ops.mesh.split()
    _return_to_object_mode()
    edge_count_after = len(obj.data.edges)
    return {
        "object_name": obj.name,
        "edges_before": edge_count_before,
        "edges_after": edge_count_after,
    }


def triangulate(
    name: str,
    quad_method: str = "BEAUTY",
    ngon_method: str = "BEAUTY",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Convert all faces to triangles.

    Parameters
    ----------
    name : str
        Object name.
    quad_method : str
        Method for splitting quads: BEAUTY, FIXED, FIXED_ALTERNATE, SHORTEST_DIAGONAL, LONGEST_DIAGONAL.
    ngon_method : str
        Method for splitting n-gons: BEAUTY, CLIP.
    """
    obj = _get_mesh_object(name)
    face_count_before = len(obj.data.polygons)
    _enter_edit_mode(obj)
    bpy.ops.mesh.quads_convert_to_tris(
        quad_method=quad_method.upper(),
        ngon_method=ngon_method.upper(),
    )
    _return_to_object_mode()
    face_count_after = len(obj.data.polygons)
    return {
        "object_name": obj.name,
        "faces_before": face_count_before,
        "faces_after": face_count_after,
    }


def convert_to_quads(
    name: str,
    face_threshold: float = 40.0,
    shape_threshold: float = 40.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Convert triangles to quads (tris-to-quads).

    Parameters
    ----------
    name : str
        Object name.
    face_threshold : float
        Maximum angle between face normals to merge (degrees).
    shape_threshold : float
        Maximum shape deviation threshold (degrees).
    """
    obj = _get_mesh_object(name)
    face_count_before = len(obj.data.polygons)
    _enter_edit_mode(obj)
    bpy.ops.mesh.tris_convert_to_quads(
        face_threshold=math.radians(face_threshold),
        shape_threshold=math.radians(shape_threshold),
    )
    _return_to_object_mode()
    face_count_after = len(obj.data.polygons)
    return {
        "object_name": obj.name,
        "faces_before": face_count_before,
        "faces_after": face_count_after,
    }


def select_non_manifold(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Select non-manifold geometry (boundary edges, wire edges, etc.).

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj, select_all=False)
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.mesh.select_non_manifold(extend=False)

    # Count selected verts
    bpy.ops.object.mode_set(mode="OBJECT")
    selected_count = sum(1 for v in obj.data.vertices if v.select)
    return {
        "object_name": obj.name,
        "non_manifold_vertices": selected_count,
    }


def select_loose(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Select loose vertices and edges (not connected to any face).

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj, select_all=False)
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.mesh.select_loose()

    bpy.ops.object.mode_set(mode="OBJECT")
    selected_verts = sum(1 for v in obj.data.vertices if v.select)
    selected_edges = sum(1 for e in obj.data.edges if e.select)
    return {
        "object_name": obj.name,
        "loose_vertices": selected_verts,
        "loose_edges": selected_edges,
    }


def proportional_edit(
    name: str,
    move: Optional[List[float]] = None,
    proportional_size: float = 1.0,
    falloff_type: str = "SMOOTH",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Transform selected vertices with proportional editing falloff.

    Parameters
    ----------
    name : str
        Object name.
    move : list[float], optional
        Translation vector [x, y, z]. Defaults to (0, 0, 1).
    proportional_size : float
        Radius of proportional influence.
    falloff_type : str
        Falloff curve: SMOOTH, SPHERE, ROOT, INVERSE_SQUARE, SHARP,
        LINEAR, CONSTANT, RANDOM.
    """
    obj = _get_mesh_object(name)
    _enter_edit_mode(obj, select_all=False)

    move_vec = tuple(move) if move else (0.0, 0.0, 1.0)

    bpy.ops.transform.translate(
        value=move_vec,
        use_proportional_edit=True,
        proportional_edit_falloff=falloff_type.upper(),
        proportional_size=proportional_size,
    )
    _return_to_object_mode()
    return {
        "object_name": obj.name,
        "move": list(move_vec),
        "proportional_size": proportional_size,
        "falloff_type": falloff_type.upper(),
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "bridge_edge_loops": bridge_edge_loops,
    "fill_holes": fill_holes,
    "flip_face_normals": flip_normals,
    "recalculate_outside_normals": recalculate_normals,
    "inset_faces": inset_faces,
    "poke_faces": poke_faces,
    "loop_cut": loop_cut,
    "mark_sharp": mark_sharp,
    "mark_freestyle": mark_freestyle,
    "set_shade_smooth": set_shade_smooth,
    "set_shade_flat": set_shade_flat,
    "auto_smooth": auto_smooth,
    "solidify": solidify,
    "spin_mesh": spin_mesh,
    "split_edges": split_edges,
    "triangulate": triangulate,
    "convert_to_quads": convert_to_quads,
    "select_non_manifold": select_non_manifold,
    "select_loose": select_loose,
    "proportional_edit": proportional_edit,
}
