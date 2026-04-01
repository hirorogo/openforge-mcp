"""
Extended modifier tools for OpenForge MCP.

These complement the modifier operations in modifier_advanced_tools.py with
additional modifier types and modifier stack management.
"""

from typing import Any, Dict, List, Optional

import bpy
import math


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


def _select_only(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def add_armature_modifier(
    name: str,
    armature_name: str,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add an Armature deform modifier to a mesh.

    Parameters
    ----------
    name : str
        Object name.
    armature_name : str
        Name of the armature object to deform with.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    arm_obj = _get_object(armature_name)
    if arm_obj.type != "ARMATURE":
        raise ValueError(f"Object '{armature_name}' is not an armature")

    mod = obj.modifiers.new(name="Armature", type="ARMATURE")
    mod.object = arm_obj

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "armature": arm_obj.name,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_boolean_modifier(
    name: str,
    target: str,
    operation: str = "DIFFERENCE",
    solver: str = "EXACT",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Boolean modifier without applying it.

    Parameters
    ----------
    name : str
        Object name.
    target : str
        Name of the boolean operand object.
    operation : str
        UNION, DIFFERENCE, or INTERSECT.
    solver : str
        EXACT or FAST.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    target_obj = _get_object(target)

    operation = operation.upper()
    if operation not in ("UNION", "DIFFERENCE", "INTERSECT"):
        raise ValueError(f"Invalid operation '{operation}'. Use UNION, DIFFERENCE, INTERSECT.")

    mod = obj.modifiers.new(name="Boolean", type="BOOLEAN")
    mod.operation = operation
    mod.object = target_obj
    mod.solver = solver.upper()

    return {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "target": target_obj.name,
        "operation": operation,
        "solver": solver.upper(),
    }


def add_displace(
    name: str,
    strength: float = 1.0,
    mid_level: float = 0.5,
    direction: str = "NORMAL",
    texture_name: Optional[str] = None,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Displacement modifier.

    Parameters
    ----------
    name : str
        Object name.
    strength : float
        Displacement strength.
    mid_level : float
        Midpoint level for the displacement (0.0 to 1.0).
    direction : str
        X, Y, Z, NORMAL, CUSTOM_NORMAL, or RGB_TO_XYZ.
    texture_name : str, optional
        Name of an existing texture to use for displacement.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    mod = obj.modifiers.new(name="Displace", type="DISPLACE")
    mod.strength = strength
    mod.mid_level = max(0.0, min(1.0, mid_level))
    mod.direction = direction.upper()

    if texture_name:
        tex = bpy.data.textures.get(texture_name)
        if tex is None:
            raise ValueError(f"Texture '{texture_name}' not found")
        mod.texture = tex

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "strength": strength,
        "direction": direction.upper(),
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_laplacian_smooth(
    name: str,
    iterations: int = 1,
    lambda_factor: float = 1.0,
    lambda_border: float = 0.01,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Laplacian Smooth modifier for shape-preserving smoothing.

    Parameters
    ----------
    name : str
        Object name.
    iterations : int
        Number of smoothing iterations.
    lambda_factor : float
        Smoothing factor.
    lambda_border : float
        Border smoothing factor.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    mod = obj.modifiers.new(name="LaplacianSmooth", type="LAPLACIANSMOOTH")
    mod.iterations = max(1, iterations)
    mod.lambda_factor = lambda_factor
    mod.lambda_border = lambda_border

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "iterations": mod.iterations,
        "lambda_factor": lambda_factor,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_screw(
    name: str,
    angle: float = 360.0,
    steps: int = 16,
    screw_offset: float = 0.0,
    axis: str = "Z",
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Screw modifier for creating spiral or lathe geometry.

    Parameters
    ----------
    name : str
        Object name.
    angle : float
        Total screw angle in degrees.
    steps : int
        Number of steps per revolution.
    screw_offset : float
        Height offset per revolution (for spiral effect).
    axis : str
        Screw axis: X, Y, or Z.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    mod = obj.modifiers.new(name="Screw", type="SCREW")
    mod.angle = math.radians(angle)
    mod.steps = max(2, steps)
    mod.render_steps = max(2, steps)
    mod.screw_offset = screw_offset
    axis_map = {"X": "X", "Y": "Y", "Z": "Z"}
    mod.axis = axis_map.get(axis.upper(), "Z")

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "angle": angle,
        "steps": steps,
        "screw_offset": screw_offset,
        "axis": axis.upper(),
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_simple_deform(
    name: str,
    deform_method: str = "TWIST",
    angle: float = 45.0,
    factor: float = 0.0,
    axis: str = "Z",
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Simple Deform modifier (twist, bend, taper, stretch).

    Parameters
    ----------
    name : str
        Object name.
    deform_method : str
        TWIST, BEND, TAPER, or STRETCH.
    angle : float
        Deformation angle in degrees (for TWIST and BEND).
    factor : float
        Deformation factor (for TAPER and STRETCH).
    axis : str
        Deformation axis: X, Y, or Z.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    mod = obj.modifiers.new(name="SimpleDeform", type="SIMPLE_DEFORM")
    mod.deform_method = deform_method.upper()
    mod.deform_axis = axis.upper()

    if deform_method.upper() in ("TWIST", "BEND"):
        mod.angle = math.radians(angle)
    else:
        mod.factor = factor

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "deform_method": deform_method.upper(),
        "axis": axis.upper(),
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_smooth_modifier(
    name: str,
    factor: float = 0.5,
    iterations: int = 1,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Smooth modifier.

    Parameters
    ----------
    name : str
        Object name.
    factor : float
        Smoothing factor (0.0 to 1.0).
    iterations : int
        Number of smoothing iterations.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    mod = obj.modifiers.new(name="Smooth", type="SMOOTH")
    mod.factor = max(0.0, min(1.0, factor))
    mod.iterations = max(1, iterations)

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "factor": mod.factor,
        "iterations": mod.iterations,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_subdivision(
    name: str,
    levels: int = 2,
    render_levels: int = 2,
    subdivision_type: str = "CATMULL_CLARK",
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Subdivision Surface modifier.

    Parameters
    ----------
    name : str
        Object name.
    levels : int
        Viewport subdivision levels (0-6).
    render_levels : int
        Render subdivision levels (0-6).
    subdivision_type : str
        CATMULL_CLARK or SIMPLE.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    mod = obj.modifiers.new(name="Subdivision", type="SUBSURF")
    mod.levels = max(0, min(6, levels))
    mod.render_levels = max(0, min(6, render_levels))
    mod.subdivision_type = subdivision_type.upper()

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "levels": mod.levels,
        "render_levels": mod.render_levels,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_triangulate(
    name: str,
    quad_method: str = "BEAUTY",
    ngon_method: str = "BEAUTY",
    min_vertices: int = 4,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Triangulate modifier.

    Parameters
    ----------
    name : str
        Object name.
    quad_method : str
        BEAUTY, FIXED, FIXED_ALTERNATE, SHORTEST_DIAGONAL, or LONGEST_DIAGONAL.
    ngon_method : str
        BEAUTY or CLIP.
    min_vertices : int
        Minimum number of vertices for a face to be triangulated.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    mod = obj.modifiers.new(name="Triangulate", type="TRIANGULATE")
    mod.quad_method = quad_method.upper()
    mod.ngon_method = ngon_method.upper()
    mod.min_vertices = max(4, min_vertices)

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "quad_method": quad_method.upper(),
        "ngon_method": ngon_method.upper(),
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_weighted_normal(
    name: str,
    weight: int = 50,
    mode: str = "FACE_AREA",
    keep_sharp: bool = True,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Weighted Normal modifier for game asset normal control.

    Parameters
    ----------
    name : str
        Object name.
    weight : int
        Normal weight (1-100).
    mode : str
        FACE_AREA, CORNER_ANGLE, or FACE_AREA_AND_ANGLE.
    keep_sharp : bool
        Preserve sharp edges.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    mod = obj.modifiers.new(name="WeightedNormal", type="WEIGHTED_NORMAL")
    mod.weight = max(1, min(100, weight))
    mod.mode = mode.upper()
    mod.keep_sharp = keep_sharp

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "weight": mod.weight,
        "mode": mode.upper(),
        "keep_sharp": keep_sharp,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_data_transfer(
    name: str,
    source_name: str,
    use_loop_data: bool = True,
    data_types_loops: Optional[List[str]] = None,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Data Transfer modifier to transfer normals or UVs from another mesh.

    Parameters
    ----------
    name : str
        Object name.
    source_name : str
        Name of the source object to transfer data from.
    use_loop_data : bool
        Transfer loop (face corner) data like normals and UVs.
    data_types_loops : list[str], optional
        Loop data types: CUSTOM_NORMAL, UV. Defaults to ['CUSTOM_NORMAL'].
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    source = _get_object(source_name)

    mod = obj.modifiers.new(name="DataTransfer", type="DATA_TRANSFER")
    mod.object = source
    mod.use_loop_data = use_loop_data

    if use_loop_data:
        types = data_types_loops or ["CUSTOM_NORMAL"]
        for dt in types:
            dt_upper = dt.upper()
            if dt_upper == "CUSTOM_NORMAL":
                mod.data_types_loops = {"CUSTOM_NORMAL"}
            elif dt_upper == "UV":
                mod.data_types_loops = {"UV"}

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "source": source.name,
        "use_loop_data": use_loop_data,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def apply_all_modifiers(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply all modifiers on an object in stack order.

    Parameters
    ----------
    name : str
        Object name.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    _select_only(obj)

    applied = []
    failed = []

    while obj.modifiers:
        mod_name = obj.modifiers[0].name
        try:
            bpy.ops.object.modifier_apply(modifier=mod_name)
            applied.append(mod_name)
        except RuntimeError as exc:
            failed.append({"name": mod_name, "error": str(exc)})
            # Remove the modifier if it cannot be applied
            obj.modifiers.remove(obj.modifiers[0])

    return {
        "object_name": obj.name,
        "applied": applied,
        "applied_count": len(applied),
        "failed": failed,
        "failed_count": len(failed),
    }


def copy_modifiers(
    source_name: str,
    target_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Copy all modifiers from one object to another.

    Parameters
    ----------
    source_name : str
        Source object name.
    target_name : str
        Target object name.
    """
    _ensure_object_mode()
    source = _get_object(source_name)
    target = _get_object(target_name)

    _select_only(target)
    source.select_set(True)
    bpy.context.view_layer.objects.active = source

    bpy.ops.object.make_links_data(type="MODIFIERS")

    # Re-select target as active
    bpy.ops.object.select_all(action="DESELECT")
    target.select_set(True)
    bpy.context.view_layer.objects.active = target

    copied = [mod.name for mod in target.modifiers]
    return {
        "source": source.name,
        "target": target.name,
        "modifiers_copied": copied,
        "count": len(copied),
    }


def list_modifiers(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """List all modifiers on an object.

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_object(name)
    modifiers = []
    for mod in obj.modifiers:
        info = {
            "name": mod.name,
            "type": mod.type,
            "show_viewport": mod.show_viewport,
            "show_render": mod.show_render,
        }
        modifiers.append(info)
    return {
        "object_name": obj.name,
        "modifier_count": len(modifiers),
        "modifiers": modifiers,
    }


def reorder_modifier(
    name: str,
    modifier_name: str,
    direction: str = "UP",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Move a modifier up or down in the modifier stack.

    Parameters
    ----------
    name : str
        Object name.
    modifier_name : str
        Name of the modifier to move.
    direction : str
        UP or DOWN.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    _select_only(obj)

    mod = obj.modifiers.get(modifier_name)
    if mod is None:
        available = [m.name for m in obj.modifiers]
        raise ValueError(
            f"Modifier '{modifier_name}' not found. Available: {available}"
        )

    direction = direction.upper()
    if direction == "UP":
        bpy.ops.object.modifier_move_up(modifier=modifier_name)
    elif direction == "DOWN":
        bpy.ops.object.modifier_move_down(modifier=modifier_name)
    else:
        raise ValueError(f"Invalid direction '{direction}'. Use UP or DOWN.")

    # Determine new position
    new_index = list(obj.modifiers).index(mod)
    return {
        "object_name": obj.name,
        "modifier_name": modifier_name,
        "direction": direction,
        "new_index": new_index,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "add_armature_modifier": add_armature_modifier,
    "add_boolean_modifier": add_boolean_modifier,
    "add_displace": add_displace,
    "add_laplacian_smooth": add_laplacian_smooth,
    "add_screw": add_screw,
    "add_simple_deform": add_simple_deform,
    "add_smooth_modifier": add_smooth_modifier,
    "add_subdivision": add_subdivision,
    "add_triangulate": add_triangulate,
    "add_weighted_normal": add_weighted_normal,
    "add_data_transfer": add_data_transfer,
    "apply_all_modifiers": apply_all_modifiers,
    "copy_modifiers": copy_modifiers,
    "list_modifiers": list_modifiers,
    "reorder_modifier": reorder_modifier,
}
