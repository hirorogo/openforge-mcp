"""
Advanced animation tools for OpenForge MCP.

These complement the basic animation operations in animation_tools.py with
bone-level animation, animation splitting, mirroring, and export.
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


def _get_armature_object(name: str) -> bpy.types.Object:
    obj = _get_object(name)
    if obj.type != "ARMATURE":
        raise ValueError(f"Object '{name}' is not an armature (type: {obj.type})")
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

def copy_bone_pose(
    armature_name: str,
    source_bone: str,
    target_bone: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Copy pose (location, rotation, scale) from one bone to another.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    source_bone : str
        Name of the source pose bone.
    target_bone : str
        Name of the target pose bone.
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="POSE")

    src = arm_obj.pose.bones.get(source_bone)
    tgt = arm_obj.pose.bones.get(target_bone)
    if src is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Source bone '{source_bone}' not found")
    if tgt is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Target bone '{target_bone}' not found")

    tgt.location = src.location.copy()
    tgt.rotation_quaternion = src.rotation_quaternion.copy()
    tgt.rotation_euler = src.rotation_euler.copy()
    tgt.scale = src.scale.copy()

    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "source_bone": source_bone,
        "target_bone": target_bone,
    }


def get_all_poses(
    armature_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Get all bone poses (location, rotation, scale) in an armature.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    """
    arm_obj = _get_armature_object(armature_name)
    poses = {}
    for pbone in arm_obj.pose.bones:
        poses[pbone.name] = {
            "location": list(pbone.location),
            "rotation_euler": list(pbone.rotation_euler),
            "rotation_quaternion": list(pbone.rotation_quaternion),
            "scale": list(pbone.scale),
        }
    return {
        "armature_name": arm_obj.name,
        "bone_count": len(poses),
        "poses": poses,
    }


def get_bone_keyframes(
    armature_name: str,
    bone_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Get all keyframes for a specific bone in the active action.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the bone to query keyframes for.
    """
    arm_obj = _get_armature_object(armature_name)
    if arm_obj.animation_data is None or arm_obj.animation_data.action is None:
        raise ValueError(f"Armature '{armature_name}' has no active action")

    action = arm_obj.animation_data.action
    prefix = f'pose.bones["{bone_name}"].'
    keyframes: Dict[str, List[float]] = {}

    for fcurve in action.fcurves:
        if fcurve.data_path.startswith(prefix):
            channel = fcurve.data_path[len(prefix):]
            key = f"{channel}[{fcurve.array_index}]"
            keyframes[key] = [kfp.co.x for kfp in fcurve.keyframe_points]

    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "channels": len(keyframes),
        "keyframes": keyframes,
    }


def animate_location(
    name: str,
    start_frame: int = 1,
    end_frame: int = 60,
    start_location: Optional[List[float]] = None,
    end_location: Optional[List[float]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a location animation between two points.

    Parameters
    ----------
    name : str
        Object name.
    start_frame : int
        Start frame.
    end_frame : int
        End frame.
    start_location : list[float], optional
        Starting [x, y, z] location. Defaults to current location.
    end_location : list[float], optional
        Ending [x, y, z] location. Defaults to (0, 0, 0).
    """
    obj = _get_object(name)

    if obj.animation_data is None:
        obj.animation_data_create()
    if obj.animation_data.action is None:
        obj.animation_data.action = bpy.data.actions.new(name=f"{obj.name}_LocationAnim")

    start_loc = tuple(start_location) if start_location else tuple(obj.location)
    end_loc = tuple(end_location) if end_location else (0.0, 0.0, 0.0)

    obj.location = start_loc
    obj.keyframe_insert(data_path="location", frame=start_frame)

    obj.location = end_loc
    obj.keyframe_insert(data_path="location", frame=end_frame)

    return {
        "object_name": obj.name,
        "start_frame": start_frame,
        "end_frame": end_frame,
        "start_location": list(start_loc),
        "end_location": list(end_loc),
    }


def animate_rotation(
    name: str,
    start_frame: int = 1,
    end_frame: int = 60,
    start_rotation: Optional[List[float]] = None,
    end_rotation: Optional[List[float]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a rotation animation between two euler angles.

    Parameters
    ----------
    name : str
        Object name.
    start_frame : int
        Start frame.
    end_frame : int
        End frame.
    start_rotation : list[float], optional
        Starting euler [x, y, z] in degrees. Defaults to current rotation.
    end_rotation : list[float], optional
        Ending euler [x, y, z] in degrees. Defaults to (0, 0, 0).
    """
    obj = _get_object(name)

    if obj.animation_data is None:
        obj.animation_data_create()
    if obj.animation_data.action is None:
        obj.animation_data.action = bpy.data.actions.new(name=f"{obj.name}_RotationAnim")

    if start_rotation:
        start_rad = tuple(math.radians(a) for a in start_rotation)
    else:
        start_rad = tuple(obj.rotation_euler)

    if end_rotation:
        end_rad = tuple(math.radians(a) for a in end_rotation)
    else:
        end_rad = (0.0, 0.0, 0.0)

    obj.rotation_euler = start_rad
    obj.keyframe_insert(data_path="rotation_euler", frame=start_frame)

    obj.rotation_euler = end_rad
    obj.keyframe_insert(data_path="rotation_euler", frame=end_frame)

    return {
        "object_name": obj.name,
        "start_frame": start_frame,
        "end_frame": end_frame,
        "start_rotation_deg": [math.degrees(a) for a in start_rad],
        "end_rotation_deg": [math.degrees(a) for a in end_rad],
    }


def animate_scale(
    name: str,
    start_frame: int = 1,
    end_frame: int = 60,
    start_scale: Optional[List[float]] = None,
    end_scale: Optional[List[float]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a scale animation between two scale values.

    Parameters
    ----------
    name : str
        Object name.
    start_frame : int
        Start frame.
    end_frame : int
        End frame.
    start_scale : list[float], optional
        Starting [x, y, z] scale. Defaults to current scale.
    end_scale : list[float], optional
        Ending [x, y, z] scale. Defaults to (1, 1, 1).
    """
    obj = _get_object(name)

    if obj.animation_data is None:
        obj.animation_data_create()
    if obj.animation_data.action is None:
        obj.animation_data.action = bpy.data.actions.new(name=f"{obj.name}_ScaleAnim")

    s_start = tuple(start_scale) if start_scale else tuple(obj.scale)
    s_end = tuple(end_scale) if end_scale else (1.0, 1.0, 1.0)

    obj.scale = s_start
    obj.keyframe_insert(data_path="scale", frame=start_frame)

    obj.scale = s_end
    obj.keyframe_insert(data_path="scale", frame=end_frame)

    return {
        "object_name": obj.name,
        "start_frame": start_frame,
        "end_frame": end_frame,
        "start_scale": list(s_start),
        "end_scale": list(s_end),
    }


def clear_animation(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Remove all animation data from an object.

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_object(name)
    had_animation = obj.animation_data is not None
    if had_animation:
        obj.animation_data_clear()
    return {
        "object_name": obj.name,
        "had_animation": had_animation,
        "cleared": had_animation,
    }


def get_animation_info(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Get animation data information for an object.

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_object(name)
    info: Dict[str, Any] = {
        "object_name": obj.name,
        "has_animation_data": obj.animation_data is not None,
    }

    if obj.animation_data is not None:
        anim_data = obj.animation_data
        info["has_action"] = anim_data.action is not None
        if anim_data.action:
            action = anim_data.action
            info["action_name"] = action.name
            info["fcurve_count"] = len(action.fcurves)
            info["frame_range"] = list(action.frame_range)
            info["keyframe_count"] = sum(
                len(fc.keyframe_points) for fc in action.fcurves
            )
        info["nla_track_count"] = len(anim_data.nla_tracks)
        info["nla_tracks"] = [t.name for t in anim_data.nla_tracks]
    else:
        info["has_action"] = False

    return info


def split_animation(
    name: str,
    splits: Optional[List[Dict[str, Any]]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Split an animation action into multiple clip actions.

    Parameters
    ----------
    name : str
        Object name.
    splits : list[dict]
        List of dicts with keys: 'name' (str), 'start' (int), 'end' (int).
        Each defines a clip to extract from the current action.
    """
    obj = _get_object(name)
    if obj.animation_data is None or obj.animation_data.action is None:
        raise ValueError(f"Object '{name}' has no active action")

    if not splits or len(splits) == 0:
        raise ValueError("Must provide at least one split definition")

    source_action = obj.animation_data.action
    created_clips = []

    for split_def in splits:
        clip_name = split_def.get("name", "Clip")
        start = int(split_def.get("start", 1))
        end = int(split_def.get("end", 60))

        new_action = bpy.data.actions.new(name=clip_name)

        for src_fc in source_action.fcurves:
            new_fc = new_action.fcurves.new(
                data_path=src_fc.data_path,
                index=src_fc.array_index,
                action_group=src_fc.group.name if src_fc.group else "",
            )
            for kfp in src_fc.keyframe_points:
                if start <= kfp.co.x <= end:
                    new_fc.keyframe_points.insert(
                        kfp.co.x - start + 1,
                        kfp.co.y,
                    )

        created_clips.append({
            "name": new_action.name,
            "frame_range": [start, end],
        })

    return {
        "object_name": obj.name,
        "source_action": source_action.name,
        "clips_created": len(created_clips),
        "clips": created_clips,
    }


def mirror_animation(
    armature_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Mirror animation data left/right for an armature action.

    Swaps channels between bones with .L/.R suffixes and negates
    the X location and Y/Z rotation channels.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    """
    arm_obj = _get_armature_object(armature_name)
    if arm_obj.animation_data is None or arm_obj.animation_data.action is None:
        raise ValueError(f"Armature '{armature_name}' has no active action")

    action = arm_obj.animation_data.action
    mirrored_action = action.copy()
    mirrored_action.name = f"{action.name}_mirrored"

    # Collect fcurves by bone name
    bone_fcurves: Dict[str, List] = {}
    for fc in mirrored_action.fcurves:
        if 'pose.bones["' in fc.data_path:
            bname = fc.data_path.split('"')[1]
            bone_fcurves.setdefault(bname, []).append(fc)

    # Swap .L and .R fcurve data paths
    swapped = set()
    for bname, fcs in list(bone_fcurves.items()):
        if bname in swapped:
            continue
        if bname.endswith(".L"):
            mirror_name = bname[:-2] + ".R"
        elif bname.endswith(".R"):
            mirror_name = bname[:-2] + ".L"
        else:
            continue

        mirror_fcs = bone_fcurves.get(mirror_name, [])
        for fc in fcs:
            fc.data_path = fc.data_path.replace(
                f'pose.bones["{bname}"]',
                f'pose.bones["{mirror_name}"]',
            )
        for fc in mirror_fcs:
            fc.data_path = fc.data_path.replace(
                f'pose.bones["{mirror_name}"]',
                f'pose.bones["{bname}"]',
            )
        swapped.add(bname)
        swapped.add(mirror_name)

    # Negate X location and Y/Z rotation for mirroring
    for fc in mirrored_action.fcurves:
        if ".location" in fc.data_path and fc.array_index == 0:
            for kfp in fc.keyframe_points:
                kfp.co.y = -kfp.co.y
        elif ".rotation" in fc.data_path and fc.array_index in (1, 2):
            for kfp in fc.keyframe_points:
                kfp.co.y = -kfp.co.y

    arm_obj.animation_data.action = mirrored_action
    return {
        "armature_name": arm_obj.name,
        "source_action": action.name,
        "mirrored_action": mirrored_action.name,
        "bones_swapped": len(swapped),
    }


def export_animation(
    name: str,
    filepath: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Export animation only as FBX file.

    Parameters
    ----------
    name : str
        Object name (typically an armature).
    filepath : str
        Output FBX file path.
    """
    obj = _get_object(name)
    _ensure_object_mode()
    _select_only(obj)

    bpy.ops.export_scene.fbx(
        filepath=filepath,
        use_selection=True,
        bake_anim=True,
        bake_anim_use_all_actions=False,
        bake_anim_use_nla_strips=False,
        object_types={"ARMATURE"},
        add_leaf_bones=False,
    )
    return {
        "object_name": obj.name,
        "filepath": filepath,
        "format": "FBX",
    }


def add_follow_path(
    name: str,
    curve_name: str,
    use_fixed_location: bool = False,
    forward_axis: str = "FORWARD_Y",
    up_axis: str = "UP_Z",
    animate: bool = True,
    frame_start: int = 1,
    frame_end: int = 100,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Follow Path constraint for path animation.

    Parameters
    ----------
    name : str
        Object name.
    curve_name : str
        Name of the curve object to follow.
    use_fixed_location : bool
        Use fixed position along path instead of percentage.
    forward_axis : str
        Forward axis: FORWARD_X, FORWARD_Y, FORWARD_Z,
        TRACK_NEGATIVE_X, TRACK_NEGATIVE_Y, TRACK_NEGATIVE_Z.
    up_axis : str
        Up axis: UP_X, UP_Y, UP_Z.
    animate : bool
        If True, set up animation evaluation time from start to end frame.
    frame_start : int
        Start frame for path animation.
    frame_end : int
        End frame for path animation.
    """
    obj = _get_object(name)
    curve_obj = _get_object(curve_name)
    if curve_obj.type != "CURVE":
        raise ValueError(f"Object '{curve_name}' is not a curve (type: {curve_obj.type})")

    constraint = obj.constraints.new(type="FOLLOW_PATH")
    constraint.target = curve_obj
    constraint.use_fixed_location = use_fixed_location
    constraint.forward_axis = forward_axis.upper()
    constraint.up_axis = up_axis.upper()

    if animate:
        curve_obj.data.use_path = True
        curve_obj.data.path_duration = frame_end - frame_start

        if curve_obj.animation_data is None:
            curve_obj.animation_data_create()
        if curve_obj.animation_data.action is None:
            curve_obj.animation_data.action = bpy.data.actions.new(
                name=f"{curve_obj.name}_PathAnim"
            )

        curve_obj.data.eval_time = 0.0
        curve_obj.data.keyframe_insert(data_path="eval_time", frame=frame_start)
        curve_obj.data.eval_time = float(frame_end - frame_start)
        curve_obj.data.keyframe_insert(data_path="eval_time", frame=frame_end)

    return {
        "object_name": obj.name,
        "curve_name": curve_obj.name,
        "forward_axis": forward_axis.upper(),
        "up_axis": up_axis.upper(),
        "animated": animate,
        "frame_range": [frame_start, frame_end] if animate else None,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "copy_bone_pose": copy_bone_pose,
    "get_all_poses": get_all_poses,
    "get_bone_keyframes": get_bone_keyframes,
    "animate_location": animate_location,
    "animate_rotation": animate_rotation,
    "animate_scale": animate_scale,
    "clear_animation": clear_animation,
    "get_animation_info": get_animation_info,
    "split_animation": split_animation,
    "mirror_animation": mirror_animation,
    "export_animation": export_animation,
    "add_follow_path": add_follow_path,
}
