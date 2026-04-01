"""
Camera tools for OpenForge MCP.

Tools for creating and configuring cameras, turntable animations, and DOF.
"""

from typing import Any, Dict, List, Optional

import bpy
import math
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


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def create_camera(
    name: str = "Camera",
    location: Optional[List[float]] = None,
    rotation: Optional[List[float]] = None,
    focal_length: float = 50.0,
    set_active: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a new camera object.

    Parameters
    ----------
    name : str
        Name for the camera.
    location : list[float], optional
        World location. Defaults to (0, -10, 5).
    rotation : list[float], optional
        Euler rotation in radians.
    focal_length : float
        Lens focal length in mm.
    set_active : bool
        Set this camera as the active scene camera.
    """
    _ensure_object_mode()
    loc = tuple(location) if location else (0.0, -10.0, 5.0)
    rot = tuple(rotation) if rotation else (math.radians(63), 0.0, 0.0)

    cam_data = bpy.data.cameras.new(name=name)
    cam_data.lens = focal_length

    cam_obj = bpy.data.objects.new(name=name, object_data=cam_data)
    bpy.context.collection.objects.link(cam_obj)
    cam_obj.location = loc
    cam_obj.rotation_euler = rot

    if set_active:
        bpy.context.scene.camera = cam_obj

    return {
        "camera_name": cam_obj.name,
        "focal_length": focal_length,
        "location": list(cam_obj.location),
        "is_active": set_active,
    }


def set_camera_focal_length(
    name: str,
    focal_length: float = 50.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the focal length of a camera.

    Parameters
    ----------
    name : str
        Camera object name.
    focal_length : float
        Focal length in mm.
    """
    obj = _get_object(name)
    if obj.type != "CAMERA":
        raise ValueError(f"Object '{name}' is not a camera (type: {obj.type})")
    obj.data.lens = focal_length
    return {
        "camera_name": obj.name,
        "focal_length": obj.data.lens,
    }


def point_camera_at(
    camera_name: str,
    target: Optional[List[float]] = None,
    target_object: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Point a camera at a location or an object.

    Parameters
    ----------
    camera_name : str
        Camera object name.
    target : list[float], optional
        XYZ world position to look at.
    target_object : str, optional
        Name of object to look at. Overrides target if provided.
    """
    cam = _get_object(camera_name)
    if cam.type != "CAMERA":
        raise ValueError(f"Object '{camera_name}' is not a camera")

    if target_object:
        target_obj = _get_object(target_object)
        look_at = mathutils.Vector(target_obj.location)
    elif target:
        look_at = mathutils.Vector(target)
    else:
        look_at = mathutils.Vector((0.0, 0.0, 0.0))

    direction = look_at - cam.location
    rot_quat = direction.to_track_quat("-Z", "Y")
    cam.rotation_euler = rot_quat.to_euler()

    return {
        "camera_name": cam.name,
        "look_at": list(look_at),
        "rotation": list(cam.rotation_euler),
    }


def set_active_camera(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set a camera as the active scene camera.

    Parameters
    ----------
    name : str
        Camera object name.
    """
    obj = _get_object(name)
    if obj.type != "CAMERA":
        raise ValueError(f"Object '{name}' is not a camera (type: {obj.type})")
    bpy.context.scene.camera = obj
    return {
        "active_camera": obj.name,
    }


def create_turntable(
    camera_name: Optional[str] = None,
    target: Optional[List[float]] = None,
    radius: float = 10.0,
    height: float = 5.0,
    frames: int = 120,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a turntable camera animation orbiting around a point.

    Parameters
    ----------
    camera_name : str, optional
        Existing camera to use. Creates a new one if not provided.
    target : list[float], optional
        Center point of the orbit. Defaults to origin.
    radius : float
        Orbit radius.
    height : float
        Camera height above the target.
    frames : int
        Number of frames for one full revolution.
    """
    _ensure_object_mode()
    center = mathutils.Vector(target) if target else mathutils.Vector((0.0, 0.0, 0.0))

    if camera_name:
        cam = _get_object(camera_name)
        if cam.type != "CAMERA":
            raise ValueError(f"Object '{camera_name}' is not a camera")
    else:
        cam_data = bpy.data.cameras.new(name="TurntableCamera")
        cam_data.lens = 50.0
        cam = bpy.data.objects.new(name="TurntableCamera", object_data=cam_data)
        bpy.context.collection.objects.link(cam)
        bpy.context.scene.camera = cam

    # Create an empty at center for the camera to track
    empty = bpy.data.objects.new("TurntableTarget", None)
    bpy.context.collection.objects.link(empty)
    empty.location = center
    empty.empty_display_type = "PLAIN_AXES"
    empty.empty_display_size = 0.5

    # Parent camera to empty
    cam.parent = empty
    cam.location = (radius, 0.0, height)

    # Point camera at target
    constraint = cam.constraints.new(type="TRACK_TO")
    constraint.target = empty
    constraint.track_axis = "TRACK_NEGATIVE_Z"
    constraint.up_axis = "UP_Y"

    # Animate empty rotation
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = frames

    empty.rotation_euler = (0, 0, 0)
    empty.keyframe_insert(data_path="rotation_euler", frame=1)
    empty.rotation_euler = (0, 0, math.radians(360))
    empty.keyframe_insert(data_path="rotation_euler", frame=frames + 1)

    # Set linear interpolation for smooth rotation
    if empty.animation_data and empty.animation_data.action:
        for fcurve in empty.animation_data.action.fcurves:
            for kfp in fcurve.keyframe_points:
                kfp.interpolation = "LINEAR"

    return {
        "camera_name": cam.name,
        "empty_name": empty.name,
        "radius": radius,
        "height": height,
        "frames": frames,
        "center": list(center),
    }


def set_camera_dof(
    name: str,
    use_dof: bool = True,
    focus_distance: float = 10.0,
    fstop: float = 2.8,
    focus_object: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Configure depth of field settings for a camera.

    Parameters
    ----------
    name : str
        Camera object name.
    use_dof : bool
        Enable or disable DOF.
    focus_distance : float
        Focus distance in Blender units.
    fstop : float
        F-stop value (lower = more blur).
    focus_object : str, optional
        Object to auto-focus on.
    """
    obj = _get_object(name)
    if obj.type != "CAMERA":
        raise ValueError(f"Object '{name}' is not a camera")

    obj.data.dof.use_dof = use_dof
    obj.data.dof.focus_distance = focus_distance
    obj.data.dof.aperture_fstop = fstop

    if focus_object:
        focus_obj = _get_object(focus_object)
        obj.data.dof.focus_object = focus_obj

    return {
        "camera_name": obj.name,
        "use_dof": use_dof,
        "focus_distance": focus_distance,
        "fstop": fstop,
        "focus_object": focus_object,
    }


def track_to_constraint(
    name: str,
    target_name: str,
    track_axis: str = "TRACK_NEGATIVE_Z",
    up_axis: str = "UP_Y",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Track To constraint to a camera (or any object).

    Parameters
    ----------
    name : str
        Object name (typically a camera).
    target_name : str
        Name of the target object to track.
    track_axis : str
        Axis that points at the target.
    up_axis : str
        Axis that points upward.
    """
    obj = _get_object(name)
    target_obj = _get_object(target_name)

    constraint = obj.constraints.new(type="TRACK_TO")
    constraint.target = target_obj
    constraint.track_axis = track_axis
    constraint.up_axis = up_axis

    return {
        "object_name": obj.name,
        "target": target_obj.name,
        "track_axis": track_axis,
        "up_axis": up_axis,
    }


def set_camera_resolution(
    x: int = 1920,
    y: int = 1080,
    percentage: int = 100,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set render resolution (used by the active camera).

    Parameters
    ----------
    x : int
        Horizontal resolution in pixels.
    y : int
        Vertical resolution in pixels.
    percentage : int
        Resolution scale percentage.
    """
    scene = bpy.context.scene
    scene.render.resolution_x = max(1, x)
    scene.render.resolution_y = max(1, y)
    scene.render.resolution_percentage = max(1, min(100, percentage))
    return {
        "resolution_x": scene.render.resolution_x,
        "resolution_y": scene.render.resolution_y,
        "resolution_percentage": scene.render.resolution_percentage,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "create_camera": create_camera,
    "set_camera_focal_length": set_camera_focal_length,
    "point_camera_at": point_camera_at,
    "set_active_camera": set_active_camera,
    "create_turntable": create_turntable,
    "set_camera_dof": set_camera_dof,
    "track_to_constraint": track_to_constraint,
    "set_camera_resolution": set_camera_resolution,
}
