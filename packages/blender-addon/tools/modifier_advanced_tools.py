"""
Advanced modifier tools for OpenForge MCP.

Tools for adding and configuring various Blender modifiers.
"""

from typing import Any, Dict, List, Optional

import bpy


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

def add_array_modifier(
    name: str,
    count: int = 2,
    offset_x: float = 1.0,
    offset_y: float = 0.0,
    offset_z: float = 0.0,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add an Array modifier to duplicate geometry in a pattern.

    Parameters
    ----------
    name : str
        Object name.
    count : int
        Number of array copies.
    offset_x : float
        Relative offset in X.
    offset_y : float
        Relative offset in Y.
    offset_z : float
        Relative offset in Z.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    mod = obj.modifiers.new(name="Array", type="ARRAY")
    mod.count = max(1, count)
    mod.relative_offset_displace[0] = offset_x
    mod.relative_offset_displace[1] = offset_y
    mod.relative_offset_displace[2] = offset_z

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "count": count,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_curve_modifier(
    name: str,
    curve_name: str,
    deform_axis: str = "POS_X",
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Curve modifier to deform geometry along a curve.

    Parameters
    ----------
    name : str
        Object name.
    curve_name : str
        Name of the curve object to deform along.
    deform_axis : str
        POS_X, POS_Y, POS_Z, NEG_X, NEG_Y, or NEG_Z.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    curve_obj = _get_object(curve_name)
    if curve_obj.type != "CURVE":
        raise ValueError(f"Object '{curve_name}' is not a curve (type: {curve_obj.type})")

    mod = obj.modifiers.new(name="Curve", type="CURVE")
    mod.object = curve_obj
    mod.deform_axis = deform_axis.upper()

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "curve_object": curve_obj.name,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_lattice_modifier(
    name: str,
    lattice_name: Optional[str] = None,
    resolution_u: int = 2,
    resolution_v: int = 2,
    resolution_w: int = 2,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Lattice modifier. Creates the lattice object if not provided.

    Parameters
    ----------
    name : str
        Object name.
    lattice_name : str, optional
        Name of an existing lattice object. If None, creates a new one.
    resolution_u : int
        Lattice U resolution.
    resolution_v : int
        Lattice V resolution.
    resolution_w : int
        Lattice W resolution.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    if lattice_name:
        lattice_obj = _get_object(lattice_name)
        if lattice_obj.type != "LATTICE":
            raise ValueError(f"Object '{lattice_name}' is not a lattice")
    else:
        lattice_data = bpy.data.lattices.new(name=f"{obj.name}_Lattice")
        lattice_data.points_u = max(2, resolution_u)
        lattice_data.points_v = max(2, resolution_v)
        lattice_data.points_w = max(2, resolution_w)
        lattice_obj = bpy.data.objects.new(name=f"{obj.name}_Lattice", object_data=lattice_data)
        bpy.context.collection.objects.link(lattice_obj)
        lattice_obj.location = obj.location
        lattice_obj.scale = obj.dimensions

    mod = obj.modifiers.new(name="Lattice", type="LATTICE")
    mod.object = lattice_obj

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "lattice_object": lattice_obj.name,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_shrinkwrap_modifier(
    name: str,
    target_name: str,
    wrap_method: str = "NEAREST_SURFACEPOINT",
    offset: float = 0.0,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Shrinkwrap modifier to project geometry onto a target surface.

    Parameters
    ----------
    name : str
        Object name.
    target_name : str
        Target object to shrinkwrap onto.
    wrap_method : str
        NEAREST_SURFACEPOINT, PROJECT, NEAREST_VERTEX, or TARGET_PROJECT.
    offset : float
        Offset distance from the target surface.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    target = _get_object(target_name)

    mod = obj.modifiers.new(name="Shrinkwrap", type="SHRINKWRAP")
    mod.target = target
    mod.wrap_method = wrap_method.upper()
    mod.offset = offset

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "target": target.name,
        "wrap_method": wrap_method.upper(),
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_solidify_modifier(
    name: str,
    thickness: float = 0.01,
    offset: float = -1.0,
    use_even_offset: bool = True,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Solidify modifier to give thickness to a surface.

    Parameters
    ----------
    name : str
        Object name.
    thickness : float
        Wall thickness.
    offset : float
        Offset direction (-1 to 1). -1 = inward, 1 = outward.
    use_even_offset : bool
        Maintain even thickness.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    mod = obj.modifiers.new(name="Solidify", type="SOLIDIFY")
    mod.thickness = thickness
    mod.offset = max(-1.0, min(1.0, offset))
    mod.use_even_offset = use_even_offset

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "thickness": thickness,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_wireframe_modifier(
    name: str,
    thickness: float = 0.02,
    use_replace: bool = True,
    use_even_offset: bool = True,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Wireframe modifier to create a wireframe mesh.

    Parameters
    ----------
    name : str
        Object name.
    thickness : float
        Wire thickness.
    use_replace : bool
        Replace the original surface with wireframe.
    use_even_offset : bool
        Maintain even thickness.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)

    mod = obj.modifiers.new(name="Wireframe", type="WIREFRAME")
    mod.thickness = thickness
    mod.use_replace = use_replace
    mod.use_even_offset = use_even_offset

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "thickness": thickness,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_cloth_modifier(
    name: str,
    quality: int = 5,
    mass: float = 0.3,
    air_damping: float = 1.0,
    use_pressure: bool = False,
    pressure: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Cloth simulation modifier.

    Parameters
    ----------
    name : str
        Object name.
    quality : int
        Simulation quality steps (1-80).
    mass : float
        Mass of the cloth.
    air_damping : float
        Air viscosity damping.
    use_pressure : bool
        Enable pressure simulation.
    pressure : float
        Internal pressure value.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    mod = obj.modifiers.new(name="Cloth", type="CLOTH")
    cloth = mod.settings
    cloth.quality = max(1, min(80, quality))
    cloth.mass = mass
    cloth.air_damping = air_damping
    cloth.use_pressure = use_pressure
    if use_pressure:
        cloth.uniform_pressure_force = pressure

    return {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "quality": quality,
        "mass": mass,
    }


def add_particle_system(
    name: str,
    count: int = 1000,
    particle_type: str = "EMITTER",
    lifetime: float = 50.0,
    emit_from: str = "FACE",
    render_type: str = "HALO",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Particle System to an object.

    Parameters
    ----------
    name : str
        Object name.
    count : int
        Number of particles.
    particle_type : str
        EMITTER or HAIR.
    lifetime : float
        Particle lifetime in frames.
    emit_from : str
        VERT, FACE, or VOLUME.
    render_type : str
        NONE, HALO, LINE, PATH, OBJECT, or COLLECTION.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    _select_only(obj)
    bpy.ops.object.particle_system_add()
    ps = obj.particle_systems[-1]
    settings = ps.settings

    settings.type = particle_type.upper()
    settings.count = max(1, count)
    settings.lifetime = lifetime
    settings.emit_from = emit_from.upper()
    settings.render_type = render_type.upper()

    return {
        "object_name": obj.name,
        "particle_system": ps.name,
        "count": count,
        "type": particle_type.upper(),
        "lifetime": lifetime,
    }


def add_mirror_modifier(
    name: str,
    axis_x: bool = True,
    axis_y: bool = False,
    axis_z: bool = False,
    use_clip: bool = True,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Mirror modifier for symmetric modeling.

    Parameters
    ----------
    name : str
        Object name.
    axis_x : bool
        Mirror along X axis.
    axis_y : bool
        Mirror along Y axis.
    axis_z : bool
        Mirror along Z axis.
    use_clip : bool
        Prevent vertices from crossing the mirror plane.
    apply : bool
        Apply the modifier immediately.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    mod = obj.modifiers.new(name="Mirror", type="MIRROR")
    mod.use_axis[0] = axis_x
    mod.use_axis[1] = axis_y
    mod.use_axis[2] = axis_z
    mod.use_clip = use_clip

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "axes": [axis_x, axis_y, axis_z],
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


def add_subsurf_modifier(
    name: str,
    levels: int = 2,
    render_levels: int = 2,
    subdivision_type: str = "CATMULL_CLARK",
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Subdivision Surface modifier for smooth geometry.

    Parameters
    ----------
    name : str
        Object name.
    levels : int
        Viewport subdivision levels.
    render_levels : int
        Render subdivision levels.
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


def add_bevel_modifier(
    name: str,
    width: float = 0.1,
    segments: int = 1,
    limit_method: str = "NONE",
    angle_limit: float = 30.0,
    apply: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Bevel modifier for smoothing edges.

    Parameters
    ----------
    name : str
        Object name.
    width : float
        Bevel width.
    segments : int
        Number of bevel segments.
    limit_method : str
        NONE, ANGLE, WEIGHT, or VGROUP.
    angle_limit : float
        Angle limit in degrees (when limit_method is ANGLE).
    apply : bool
        Apply the modifier immediately.
    """
    import math
    _ensure_object_mode()
    obj = _get_object(name)
    mod = obj.modifiers.new(name="Bevel", type="BEVEL")
    mod.width = width
    mod.segments = max(1, segments)
    mod.limit_method = limit_method.upper()
    if limit_method.upper() == "ANGLE":
        mod.angle_limit = math.radians(angle_limit)

    result: Dict[str, Any] = {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "width": width,
        "segments": segments,
        "applied": False,
    }

    if apply:
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        result["applied"] = True

    return result


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "add_array_modifier": add_array_modifier,
    "add_curve_modifier": add_curve_modifier,
    "add_lattice_modifier": add_lattice_modifier,
    "add_shrinkwrap_modifier": add_shrinkwrap_modifier,
    "add_solidify_modifier": add_solidify_modifier,
    "add_wireframe_modifier": add_wireframe_modifier,
    "add_cloth_modifier": add_cloth_modifier,
    "add_particle_system": add_particle_system,
    "add_mirror_modifier": add_mirror_modifier,
    "add_subsurf_modifier": add_subsurf_modifier,
    "add_bevel_modifier": add_bevel_modifier,
}
