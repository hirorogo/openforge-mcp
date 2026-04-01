"""
Animation tools for OpenForge MCP.

Keyframe, action, and NLA tools for animating objects in Blender.
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


def _ensure_action(obj: bpy.types.Object, action_name: Optional[str] = None) -> bpy.types.Action:
    """Return the object's action, creating one if needed."""
    if obj.animation_data is None:
        obj.animation_data_create()
    if obj.animation_data.action is None:
        name = action_name or f"{obj.name}Action"
        obj.animation_data.action = bpy.data.actions.new(name=name)
    return obj.animation_data.action


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def insert_keyframe(
    name: str,
    data_path: str = "location",
    frame: int = 1,
    index: int = -1,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Insert a keyframe on an object property.

    Parameters
    ----------
    name : str
        Object name.
    data_path : str
        Property path (e.g. 'location', 'rotation_euler', 'scale').
    frame : int
        Frame number to insert the keyframe at.
    index : int
        Array index (-1 for all channels).
    """
    obj = _get_object(name)
    scene = bpy.context.scene
    scene.frame_set(frame)
    obj.keyframe_insert(data_path=data_path, index=index, frame=frame)
    return {
        "object_name": obj.name,
        "data_path": data_path,
        "frame": frame,
        "index": index,
    }


def delete_keyframe(
    name: str,
    data_path: str = "location",
    frame: int = 1,
    index: int = -1,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Delete a keyframe on an object property.

    Parameters
    ----------
    name : str
        Object name.
    data_path : str
        Property path.
    frame : int
        Frame number of the keyframe to remove.
    index : int
        Array index (-1 for all channels).
    """
    obj = _get_object(name)
    obj.keyframe_delete(data_path=data_path, index=index, frame=frame)
    return {
        "object_name": obj.name,
        "data_path": data_path,
        "frame": frame,
        "deleted": True,
    }


def create_action(
    name: str,
    action_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a new action and assign it to an object.

    Parameters
    ----------
    name : str
        Object name.
    action_name : str
        Name for the new action.
    """
    obj = _get_object(name)
    if obj.animation_data is None:
        obj.animation_data_create()
    action = bpy.data.actions.new(name=action_name)
    obj.animation_data.action = action
    return {
        "object_name": obj.name,
        "action_name": action.name,
    }


def set_frame_range_anim(
    start: int = 1,
    end: int = 250,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the animation playback frame range.

    Parameters
    ----------
    start : int
        Start frame.
    end : int
        End frame.
    """
    scene = bpy.context.scene
    scene.frame_start = start
    scene.frame_end = end
    return {
        "frame_start": scene.frame_start,
        "frame_end": scene.frame_end,
    }


def set_interpolation(
    name: str,
    interpolation: str = "BEZIER",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set interpolation type for all F-Curves of an object's action.

    Parameters
    ----------
    name : str
        Object name.
    interpolation : str
        CONSTANT, LINEAR, BEZIER, SINE, QUAD, CUBIC, QUART, QUINT, EXPO,
        CIRC, BACK, BOUNCE, ELASTIC.
    """
    obj = _get_object(name)
    if obj.animation_data is None or obj.animation_data.action is None:
        raise ValueError(f"Object '{name}' has no animation action")
    action = obj.animation_data.action
    count = 0
    for fcurve in action.fcurves:
        for kfp in fcurve.keyframe_points:
            kfp.interpolation = interpolation.upper()
            count += 1
    return {
        "object_name": obj.name,
        "interpolation": interpolation.upper(),
        "keyframes_updated": count,
    }


def create_walk_cycle(
    name: str,
    stride_length: float = 1.0,
    cycle_frames: int = 24,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a simple procedural walk cycle using location keyframes.

    Parameters
    ----------
    name : str
        Object name.
    stride_length : float
        Distance per step.
    cycle_frames : int
        Number of frames for one full cycle.
    """
    obj = _get_object(name)
    _ensure_action(obj, f"{obj.name}_WalkCycle")
    half = cycle_frames // 2
    base_loc = list(obj.location)

    # Key 0: start position
    obj.location.z = base_loc[2]
    obj.location.y = base_loc[1]
    obj.keyframe_insert(data_path="location", frame=1)

    # Key 1: mid step - up and forward
    obj.location.z = base_loc[2] + stride_length * 0.15
    obj.location.y = base_loc[1] + stride_length * 0.5
    obj.keyframe_insert(data_path="location", frame=1 + half // 2)

    # Key 2: half cycle - forward, ground
    obj.location.z = base_loc[2]
    obj.location.y = base_loc[1] + stride_length
    obj.keyframe_insert(data_path="location", frame=1 + half)

    # Key 3: second half up
    obj.location.z = base_loc[2] + stride_length * 0.15
    obj.location.y = base_loc[1] + stride_length * 1.5
    obj.keyframe_insert(data_path="location", frame=1 + half + half // 2)

    # Key 4: full cycle
    obj.location.z = base_loc[2]
    obj.location.y = base_loc[1] + stride_length * 2.0
    obj.keyframe_insert(data_path="location", frame=1 + cycle_frames)

    return {
        "object_name": obj.name,
        "stride_length": stride_length,
        "cycle_frames": cycle_frames,
        "keyframes_created": 5,
    }


def create_run_cycle(
    name: str,
    stride_length: float = 2.0,
    cycle_frames: int = 16,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a simple procedural run cycle using location keyframes.

    Parameters
    ----------
    name : str
        Object name.
    stride_length : float
        Distance per step.
    cycle_frames : int
        Frames for one full run cycle.
    """
    obj = _get_object(name)
    _ensure_action(obj, f"{obj.name}_RunCycle")
    quarter = cycle_frames // 4
    base_loc = list(obj.location)

    frames_keys = [
        (1, base_loc[1], base_loc[2]),
        (1 + quarter, base_loc[1] + stride_length * 0.5, base_loc[2] + stride_length * 0.25),
        (1 + 2 * quarter, base_loc[1] + stride_length, base_loc[2]),
        (1 + 3 * quarter, base_loc[1] + stride_length * 1.5, base_loc[2] + stride_length * 0.25),
        (1 + cycle_frames, base_loc[1] + stride_length * 2.0, base_loc[2]),
    ]

    for frame, y_val, z_val in frames_keys:
        obj.location.y = y_val
        obj.location.z = z_val
        obj.keyframe_insert(data_path="location", frame=frame)

    return {
        "object_name": obj.name,
        "stride_length": stride_length,
        "cycle_frames": cycle_frames,
        "keyframes_created": len(frames_keys),
    }


def create_idle_animation(
    name: str,
    amplitude: float = 0.05,
    cycle_frames: int = 60,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a subtle idle breathing/bobbing animation.

    Parameters
    ----------
    name : str
        Object name.
    amplitude : float
        Vertical bob amount.
    cycle_frames : int
        Frames for one idle cycle.
    """
    obj = _get_object(name)
    _ensure_action(obj, f"{obj.name}_Idle")
    base_z = obj.location.z

    steps = 5
    for i in range(steps):
        frac = i / (steps - 1)
        frame = 1 + int(frac * cycle_frames)
        obj.location.z = base_z + amplitude * math.sin(frac * 2.0 * math.pi)
        obj.keyframe_insert(data_path="location", frame=frame)

    # Make the curves cyclic
    if obj.animation_data and obj.animation_data.action:
        for fcurve in obj.animation_data.action.fcurves:
            if fcurve.data_path == "location" and fcurve.array_index == 2:
                mod = fcurve.modifiers.new(type="CYCLES")
                mod.mode_before = "REPEAT"
                mod.mode_after = "REPEAT"

    return {
        "object_name": obj.name,
        "amplitude": amplitude,
        "cycle_frames": cycle_frames,
    }


def set_animation_speed(
    name: str,
    speed_factor: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Scale the timing of all keyframes on an object's action.

    Parameters
    ----------
    name : str
        Object name.
    speed_factor : float
        Speed multiplier. Values > 1 speed up, < 1 slow down.
    """
    obj = _get_object(name)
    if obj.animation_data is None or obj.animation_data.action is None:
        raise ValueError(f"Object '{name}' has no animation action")
    if speed_factor <= 0:
        raise ValueError("speed_factor must be > 0")

    action = obj.animation_data.action
    for fcurve in action.fcurves:
        for kfp in fcurve.keyframe_points:
            kfp.co.x = 1 + (kfp.co.x - 1) / speed_factor
        fcurve.update()

    return {
        "object_name": obj.name,
        "speed_factor": speed_factor,
    }


def bake_animation(
    name: str,
    frame_start: int = 1,
    frame_end: int = 250,
    step: int = 1,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bake object animation to keyframes.

    Parameters
    ----------
    name : str
        Object name.
    frame_start : int
        Start frame.
    frame_end : int
        End frame.
    step : int
        Sample every N frames.
    """
    obj = _get_object(name)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.nla.bake(
        frame_start=frame_start,
        frame_end=frame_end,
        step=step,
        only_selected=True,
        visual_keying=True,
        clear_constraints=False,
        bake_types={"OBJECT"},
    )
    return {
        "object_name": obj.name,
        "frame_start": frame_start,
        "frame_end": frame_end,
        "step": step,
    }


def create_nla_track(
    name: str,
    track_name: str = "NLATrack",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Push the current action onto a new NLA track.

    Parameters
    ----------
    name : str
        Object name.
    track_name : str
        Name for the NLA track.
    """
    obj = _get_object(name)
    if obj.animation_data is None:
        obj.animation_data_create()
    if obj.animation_data.action is None:
        raise ValueError(f"Object '{name}' has no action to push to NLA")

    action = obj.animation_data.action
    track = obj.animation_data.nla_tracks.new()
    track.name = track_name
    strip = track.strips.new(action.name, int(action.frame_range[0]), action)
    obj.animation_data.action = None

    return {
        "object_name": obj.name,
        "track_name": track.name,
        "strip_name": strip.name,
        "frame_start": int(strip.frame_start),
        "frame_end": int(strip.frame_end),
    }


def loop_animation(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add cyclic modifiers to all F-Curves of an object's action.

    Parameters
    ----------
    name : str
        Object name.
    """
    obj = _get_object(name)
    if obj.animation_data is None or obj.animation_data.action is None:
        raise ValueError(f"Object '{name}' has no animation action")

    action = obj.animation_data.action
    count = 0
    for fcurve in action.fcurves:
        has_cycles = any(m.type == "CYCLES" for m in fcurve.modifiers)
        if not has_cycles:
            mod = fcurve.modifiers.new(type="CYCLES")
            mod.mode_before = "REPEAT"
            mod.mode_after = "REPEAT"
            count += 1

    return {
        "object_name": obj.name,
        "fcurves_modified": count,
    }


def set_fps(
    fps: int = 24,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the scene frames-per-second.

    Parameters
    ----------
    fps : int
        Frames per second.
    """
    scene = bpy.context.scene
    scene.render.fps = max(1, fps)
    scene.render.fps_base = 1.0
    return {
        "fps": scene.render.fps,
    }


def retarget_animation(
    source_name: str,
    target_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Copy animation from one object to another via action duplication.

    Parameters
    ----------
    source_name : str
        Source object name (must have an action).
    target_name : str
        Target object name.
    """
    source = _get_object(source_name)
    target = _get_object(target_name)

    if source.animation_data is None or source.animation_data.action is None:
        raise ValueError(f"Source object '{source_name}' has no animation action")

    if target.animation_data is None:
        target.animation_data_create()

    new_action = source.animation_data.action.copy()
    new_action.name = f"{target.name}_{source.animation_data.action.name}"
    target.animation_data.action = new_action

    return {
        "source": source.name,
        "target": target.name,
        "action_name": new_action.name,
    }


def import_mixamo_animation(
    filepath: str,
    target_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Import a Mixamo FBX animation file and optionally assign to an armature.

    Parameters
    ----------
    filepath : str
        Path to the Mixamo FBX file.
    target_name : str, optional
        Name of the armature to retarget the animation to.
    """
    bpy.ops.import_scene.fbx(filepath=filepath, use_anim=True)
    imported = bpy.context.selected_objects
    imported_names = [o.name for o in imported]

    armatures = [o for o in imported if o.type == "ARMATURE"]

    result: Dict[str, Any] = {
        "imported_objects": imported_names,
        "armatures": [a.name for a in armatures],
        "filepath": filepath,
    }

    if target_name and armatures:
        target = _get_object(target_name)
        source_arm = armatures[0]
        if source_arm.animation_data and source_arm.animation_data.action:
            if target.animation_data is None:
                target.animation_data_create()
            target.animation_data.action = source_arm.animation_data.action
            result["retargeted_to"] = target.name

    return result


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "insert_keyframe": insert_keyframe,
    "delete_keyframe": delete_keyframe,
    "create_action": create_action,
    "set_frame_range_anim": set_frame_range_anim,
    "set_interpolation": set_interpolation,
    "create_walk_cycle": create_walk_cycle,
    "create_run_cycle": create_run_cycle,
    "create_idle_animation": create_idle_animation,
    "set_animation_speed": set_animation_speed,
    "bake_animation": bake_animation,
    "create_nla_track": create_nla_track,
    "loop_animation": loop_animation,
    "set_fps": set_fps,
    "retarget_animation": retarget_animation,
    "import_mixamo_animation": import_mixamo_animation,
}
