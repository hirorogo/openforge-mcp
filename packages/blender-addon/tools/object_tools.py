"""
Object operation tools for OpenForge MCP.

Every public tool function accepts keyword arguments matching the JSON params
from the MCP request and returns a result dict.
"""

from typing import Any, Dict, List, Optional

import bpy
import mathutils


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_object(name: str) -> bpy.types.Object:
    """Return the Blender object with *name*, or raise."""
    obj = bpy.data.objects.get(name)
    if obj is None:
        available = [o.name for o in bpy.data.objects]
        raise ValueError(
            f"Object '{name}' not found. Available objects: {available}"
        )
    return obj


def _select_only(obj: bpy.types.Object) -> None:
    """Deselect everything, then select and activate *obj*."""
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def _ensure_object_mode() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def create_mesh(
    mesh_type: str = "cube",
    location: Optional[List[float]] = None,
    rotation: Optional[List[float]] = None,
    scale: Optional[List[float]] = None,
    size: float = 2.0,
    name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a mesh primitive.

    Parameters
    ----------
    mesh_type : str
        One of: cube, sphere, cylinder, plane, cone, torus, monkey.
    location : list[float], optional
        XYZ world location.  Defaults to origin.
    rotation : list[float], optional
        XYZ euler rotation in radians.
    scale : list[float], optional
        XYZ scale factors.
    size : float
        Base size parameter passed to the primitive operator.
    name : str, optional
        Rename the created object.
    """
    _ensure_object_mode()

    loc = tuple(location) if location else (0.0, 0.0, 0.0)
    rot = tuple(rotation) if rotation else (0.0, 0.0, 0.0)

    mesh_type = mesh_type.lower()
    ops_map = {
        "cube": lambda: bpy.ops.mesh.primitive_cube_add(size=size, location=loc, rotation=rot),
        "sphere": lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=size / 2, location=loc, rotation=rot),
        "cylinder": lambda: bpy.ops.mesh.primitive_cylinder_add(radius=size / 2, depth=size, location=loc, rotation=rot),
        "plane": lambda: bpy.ops.mesh.primitive_plane_add(size=size, location=loc, rotation=rot),
        "cone": lambda: bpy.ops.mesh.primitive_cone_add(radius1=size / 2, depth=size, location=loc, rotation=rot),
        "torus": lambda: bpy.ops.mesh.primitive_torus_add(
            major_radius=size / 2,
            minor_radius=size / 6,
            location=loc,
            rotation=rot,
        ),
        "monkey": lambda: bpy.ops.mesh.primitive_monkey_add(size=size, location=loc, rotation=rot),
    }

    creator = ops_map.get(mesh_type)
    if creator is None:
        raise ValueError(
            f"Unknown mesh_type '{mesh_type}'. "
            f"Supported types: {list(ops_map.keys())}"
        )

    creator()

    obj = bpy.context.active_object
    if scale:
        obj.scale = mathutils.Vector(scale)

    if name:
        obj.name = name
        if obj.data:
            obj.data.name = name

    return {
        "object_name": obj.name,
        "mesh_type": mesh_type,
        "location": list(obj.location),
    }


def transform_object(
    name: str,
    location: Optional[List[float]] = None,
    rotation: Optional[List[float]] = None,
    scale: Optional[List[float]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the location, rotation, and/or scale of an object."""
    obj = _get_object(name)

    if location is not None:
        obj.location = mathutils.Vector(location)
    if rotation is not None:
        obj.rotation_euler = mathutils.Euler(rotation)
    if scale is not None:
        obj.scale = mathutils.Vector(scale)

    return {
        "object_name": obj.name,
        "location": list(obj.location),
        "rotation": list(obj.rotation_euler),
        "scale": list(obj.scale),
    }


def duplicate_object(
    name: str,
    linked: bool = False,
    new_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Duplicate an object."""
    _ensure_object_mode()
    obj = _get_object(name)
    _select_only(obj)

    if linked:
        bpy.ops.object.duplicate(linked=True)
    else:
        bpy.ops.object.duplicate(linked=False)

    new_obj = bpy.context.active_object
    if new_name:
        new_obj.name = new_name
        if new_obj.data:
            new_obj.data.name = new_name

    return {
        "original": name,
        "duplicate": new_obj.name,
        "location": list(new_obj.location),
    }


def delete_object(name: str, **kwargs: Any) -> Dict[str, Any]:
    """Delete an object by name."""
    _ensure_object_mode()
    obj = _get_object(name)
    _select_only(obj)
    bpy.ops.object.delete(use_global=False)
    return {"deleted": name}


def set_origin(
    name: str,
    origin_type: str = "ORIGIN_GEOMETRY",
    center: str = "MEDIAN",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the origin of an object.

    Parameters
    ----------
    origin_type : str
        ORIGIN_GEOMETRY, ORIGIN_CENTER_OF_MASS, ORIGIN_CENTER_OF_VOLUME,
        ORIGIN_CURSOR, GEOMETRY_ORIGIN.
    center : str
        MEDIAN or BOUNDS.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    _select_only(obj)
    bpy.ops.object.origin_set(type=origin_type, center=center)
    return {
        "object_name": obj.name,
        "origin_type": origin_type,
        "location": list(obj.location),
    }


def join_objects(names: List[str], **kwargs: Any) -> Dict[str, Any]:
    """Join multiple objects into one.

    The first name in the list becomes the active object.
    """
    if len(names) < 2:
        raise ValueError("At least two object names are required to join")

    _ensure_object_mode()
    bpy.ops.object.select_all(action="DESELECT")

    active_obj = _get_object(names[0])
    active_obj.select_set(True)
    bpy.context.view_layer.objects.active = active_obj

    for obj_name in names[1:]:
        obj = _get_object(obj_name)
        obj.select_set(True)

    bpy.ops.object.join()

    result_obj = bpy.context.active_object
    return {
        "joined_object": result_obj.name,
        "source_objects": names,
    }


def separate_mesh(
    name: str,
    separate_type: str = "SELECTED",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Separate a mesh into parts.

    Parameters
    ----------
    separate_type : str
        SELECTED, MATERIAL, or LOOSE.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh (type: {obj.type})")

    _select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")

    if separate_type == "SELECTED":
        bpy.ops.mesh.select_all(action="SELECT")

    bpy.ops.mesh.separate(type=separate_type)
    bpy.ops.object.mode_set(mode="OBJECT")

    new_objects = [o.name for o in bpy.context.selected_objects]
    return {
        "original": name,
        "separate_type": separate_type,
        "resulting_objects": new_objects,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "create_mesh": create_mesh,
    "transform_object": transform_object,
    "duplicate_object": duplicate_object,
    "delete_object": delete_object,
    "set_origin": set_origin,
    "join_objects": join_objects,
    "separate_mesh": separate_mesh,
}
