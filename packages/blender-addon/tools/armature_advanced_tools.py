"""
Advanced armature and rigging tools for OpenForge MCP.

These complement the basic armature operations in armature_tools.py with
professional rigging, constraint management, and batch bone operations.
"""

from typing import Any, Dict, List, Optional

import bpy
import mathutils
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

def create_simple_rig(
    armature_name: str = "HumanoidRig",
    location: Optional[List[float]] = None,
    height: float = 2.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a simple humanoid rig skeleton structure.

    Creates a basic biped armature with spine, head, arms, and legs.

    Parameters
    ----------
    armature_name : str
        Name for the armature.
    location : list[float], optional
        World location. Defaults to origin.
    height : float
        Total height of the rig in Blender units.
    """
    _ensure_object_mode()
    loc = tuple(location) if location else (0.0, 0.0, 0.0)

    arm_data = bpy.data.armatures.new(name=armature_name)
    arm_obj = bpy.data.objects.new(name=armature_name, object_data=arm_data)
    arm_obj.location = loc
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.select_set(True)

    bpy.ops.object.mode_set(mode="EDIT")

    s = height / 2.0  # scale factor

    bone_defs = [
        ("Hips", (0, 0, s * 0.5), (0, 0, s * 0.55), None, False),
        ("Spine", (0, 0, s * 0.55), (0, 0, s * 0.7), "Hips", True),
        ("Chest", (0, 0, s * 0.7), (0, 0, s * 0.85), "Spine", True),
        ("Neck", (0, 0, s * 0.85), (0, 0, s * 0.92), "Chest", True),
        ("Head", (0, 0, s * 0.92), (0, 0, s * 1.0), "Neck", True),
        ("Shoulder.L", (0, 0, s * 0.82), (s * 0.1, 0, s * 0.82), "Chest", False),
        ("UpperArm.L", (s * 0.1, 0, s * 0.82), (s * 0.3, 0, s * 0.82), "Shoulder.L", True),
        ("LowerArm.L", (s * 0.3, 0, s * 0.82), (s * 0.5, 0, s * 0.82), "UpperArm.L", True),
        ("Hand.L", (s * 0.5, 0, s * 0.82), (s * 0.56, 0, s * 0.82), "LowerArm.L", True),
        ("Shoulder.R", (0, 0, s * 0.82), (-s * 0.1, 0, s * 0.82), "Chest", False),
        ("UpperArm.R", (-s * 0.1, 0, s * 0.82), (-s * 0.3, 0, s * 0.82), "Shoulder.R", True),
        ("LowerArm.R", (-s * 0.3, 0, s * 0.82), (-s * 0.5, 0, s * 0.82), "UpperArm.R", True),
        ("Hand.R", (-s * 0.5, 0, s * 0.82), (-s * 0.56, 0, s * 0.82), "LowerArm.R", True),
        ("UpperLeg.L", (s * 0.06, 0, s * 0.5), (s * 0.06, 0, s * 0.25), "Hips", False),
        ("LowerLeg.L", (s * 0.06, 0, s * 0.25), (s * 0.06, 0, s * 0.03), "UpperLeg.L", True),
        ("Foot.L", (s * 0.06, 0, s * 0.03), (s * 0.06, -s * 0.08, 0), "LowerLeg.L", True),
        ("UpperLeg.R", (-s * 0.06, 0, s * 0.5), (-s * 0.06, 0, s * 0.25), "Hips", False),
        ("LowerLeg.R", (-s * 0.06, 0, s * 0.25), (-s * 0.06, 0, s * 0.03), "UpperLeg.R", True),
        ("Foot.R", (-s * 0.06, 0, s * 0.03), (-s * 0.06, -s * 0.08, 0), "LowerLeg.R", True),
    ]

    bone_map = {}
    bone_names = []
    for bname, head, tail, parent_name, connected in bone_defs:
        eb = arm_data.edit_bones.new(bname)
        eb.head = mathutils.Vector(head)
        eb.tail = mathutils.Vector(tail)
        if parent_name and parent_name in bone_map:
            eb.parent = bone_map[parent_name]
            eb.use_connect = connected
        bone_map[bname] = eb
        bone_names.append(bname)

    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "location": list(arm_obj.location),
        "bone_count": len(bone_names),
        "bones": bone_names,
        "height": height,
    }


def connect_bones(
    armature_name: str,
    bone_name: str,
    connected: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set whether a bone is connected to its parent.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the bone.
    connected : bool
        Whether to connect the bone to its parent.
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    eb = arm_obj.data.edit_bones.get(bone_name)
    if eb is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Bone '{bone_name}' not found in armature '{armature_name}'")
    if eb.parent is None and connected:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Bone '{bone_name}' has no parent to connect to")

    eb.use_connect = connected
    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "connected": connected,
    }


def align_bones(
    armature_name: str,
    bone_name: str,
    axis: str = "Z",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Align a bone to a primary axis.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the bone to align.
    axis : str
        Axis to align to: X, Y, Z, NEG_X, NEG_Y, or NEG_Z.
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    eb = arm_obj.data.edit_bones.get(bone_name)
    if eb is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Bone '{bone_name}' not found")

    length = eb.length
    axis_map = {
        "X": mathutils.Vector((1, 0, 0)),
        "Y": mathutils.Vector((0, 1, 0)),
        "Z": mathutils.Vector((0, 0, 1)),
        "NEG_X": mathutils.Vector((-1, 0, 0)),
        "NEG_Y": mathutils.Vector((0, -1, 0)),
        "NEG_Z": mathutils.Vector((0, 0, -1)),
    }
    direction = axis_map.get(axis.upper())
    if direction is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Invalid axis '{axis}'. Use X, Y, Z, NEG_X, NEG_Y, NEG_Z.")

    eb.tail = eb.head + direction * length
    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "axis": axis.upper(),
    }


def mirror_bones(
    armature_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Mirror all selected bones across the X axis using Blender's symmetrize.

    Creates .R counterparts for .L bones (or vice versa).

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    bone_count_before = len(arm_obj.data.edit_bones)
    bpy.ops.armature.select_all(action="SELECT")
    bpy.ops.armature.symmetrize()
    bone_count_after = len(arm_obj.data.edit_bones)

    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bones_before": bone_count_before,
        "bones_after": bone_count_after,
        "bones_added": bone_count_after - bone_count_before,
    }


def delete_bone(
    armature_name: str,
    bone_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Remove a bone from an armature.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the bone to delete.
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    eb = arm_obj.data.edit_bones.get(bone_name)
    if eb is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Bone '{bone_name}' not found in armature '{armature_name}'")

    arm_obj.data.edit_bones.remove(eb)
    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "deleted_bone": bone_name,
    }


def rename_bone(
    armature_name: str,
    old_name: str,
    new_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Rename a single bone in an armature.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    old_name : str
        Current bone name.
    new_name : str
        New bone name.
    """
    arm_obj = _get_armature_object(armature_name)
    bone = arm_obj.data.bones.get(old_name)
    if bone is None:
        available = [b.name for b in arm_obj.data.bones]
        raise ValueError(
            f"Bone '{old_name}' not found. Available: {available}"
        )
    bone.name = new_name
    return {
        "armature_name": arm_obj.name,
        "old_name": old_name,
        "new_name": bone.name,
    }


def rename_bones_batch(
    armature_name: str,
    prefix_old: str = "",
    prefix_new: str = "",
    suffix_old: str = "",
    suffix_new: str = "",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Batch rename bones by replacing prefix and/or suffix patterns.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    prefix_old : str
        Old prefix to replace (empty string matches start of all names).
    prefix_new : str
        New prefix to substitute.
    suffix_old : str
        Old suffix to replace.
    suffix_new : str
        New suffix to substitute.
    """
    arm_obj = _get_armature_object(armature_name)
    renamed = []

    for bone in arm_obj.data.bones:
        old_name = bone.name
        new_name = old_name

        if prefix_old and new_name.startswith(prefix_old):
            new_name = prefix_new + new_name[len(prefix_old):]
        elif prefix_old == "" and prefix_new:
            new_name = prefix_new + new_name

        if suffix_old and new_name.endswith(suffix_old):
            new_name = new_name[:-len(suffix_old)] + suffix_new
        elif suffix_old == "" and suffix_new:
            new_name = new_name + suffix_new

        if new_name != old_name:
            bone.name = new_name
            renamed.append({"old": old_name, "new": bone.name})

    return {
        "armature_name": arm_obj.name,
        "renamed_count": len(renamed),
        "renamed": renamed,
    }


def set_bone_display(
    armature_name: str,
    display_type: str = "OCTAHEDRAL",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the armature bone display mode.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    display_type : str
        Display type: OCTAHEDRAL, STICK, BBONE, ENVELOPE, or WIRE.
    """
    arm_obj = _get_armature_object(armature_name)
    display_type = display_type.upper()
    valid = ("OCTAHEDRAL", "STICK", "BBONE", "ENVELOPE", "WIRE")
    if display_type not in valid:
        raise ValueError(f"Invalid display type '{display_type}'. Valid: {valid}")

    arm_obj.data.display_type = display_type
    return {
        "armature_name": arm_obj.name,
        "display_type": display_type,
    }


def reparent_bone(
    armature_name: str,
    bone_name: str,
    new_parent: Optional[str] = None,
    connected: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Change the parent of a bone, or unparent it.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the bone to reparent.
    new_parent : str, optional
        Name of the new parent bone. If None, unparents the bone.
    connected : bool
        Whether to connect to the new parent.
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    eb = arm_obj.data.edit_bones.get(bone_name)
    if eb is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Bone '{bone_name}' not found")

    if new_parent is None:
        eb.parent = None
        eb.use_connect = False
    else:
        parent_eb = arm_obj.data.edit_bones.get(new_parent)
        if parent_eb is None:
            bpy.ops.object.mode_set(mode="OBJECT")
            raise ValueError(f"Parent bone '{new_parent}' not found")
        eb.parent = parent_eb
        eb.use_connect = connected

    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "new_parent": new_parent,
        "connected": connected,
    }


def switch_bone_direction(
    armature_name: str,
    bone_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Swap the head and tail positions of a bone.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the bone to flip.
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    eb = arm_obj.data.edit_bones.get(bone_name)
    if eb is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Bone '{bone_name}' not found")

    head = eb.head.copy()
    tail = eb.tail.copy()
    eb.head = tail
    eb.tail = head

    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "new_head": list(tail),
        "new_tail": list(head),
    }


def remove_constraint(
    armature_name: str,
    bone_name: str,
    constraint_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Remove a specific constraint from a pose bone.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the pose bone.
    constraint_name : str
        Name of the constraint to remove.
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="POSE")

    pbone = arm_obj.pose.bones.get(bone_name)
    if pbone is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Pose bone '{bone_name}' not found")

    constraint = pbone.constraints.get(constraint_name)
    if constraint is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        available = [c.name for c in pbone.constraints]
        raise ValueError(
            f"Constraint '{constraint_name}' not found on bone '{bone_name}'. "
            f"Available: {available}"
        )

    pbone.constraints.remove(constraint)
    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "removed_constraint": constraint_name,
    }


def list_constraints(
    armature_name: str,
    bone_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """List all constraints on a pose bone.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the pose bone.
    """
    arm_obj = _get_armature_object(armature_name)
    pbone = arm_obj.pose.bones.get(bone_name)
    if pbone is None:
        raise ValueError(f"Pose bone '{bone_name}' not found")

    constraints = []
    for c in pbone.constraints:
        info = {
            "name": c.name,
            "type": c.type,
            "enabled": not c.mute,
            "influence": c.influence,
        }
        if hasattr(c, "target") and c.target:
            info["target"] = c.target.name
        if hasattr(c, "subtarget") and c.subtarget:
            info["subtarget"] = c.subtarget
        constraints.append(info)

    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "constraint_count": len(constraints),
        "constraints": constraints,
    }


def add_copy_rotation(
    armature_name: str,
    bone_name: str,
    target_name: str,
    target_bone: Optional[str] = None,
    influence: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Copy Rotation constraint to a pose bone.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the bone to add the constraint to.
    target_name : str
        Name of the target object.
    target_bone : str, optional
        Name of the target bone (if target is an armature).
    influence : float
        Constraint influence (0.0 to 1.0).
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="POSE")

    pbone = arm_obj.pose.bones.get(bone_name)
    if pbone is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Pose bone '{bone_name}' not found")

    target_obj = _get_object(target_name)
    c = pbone.constraints.new("COPY_ROTATION")
    c.target = target_obj
    if target_bone:
        c.subtarget = target_bone
    c.influence = max(0.0, min(1.0, influence))

    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "constraint_name": c.name,
        "target": target_name,
        "target_bone": target_bone,
        "influence": c.influence,
    }


def add_copy_location(
    armature_name: str,
    bone_name: str,
    target_name: str,
    target_bone: Optional[str] = None,
    influence: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Copy Location constraint to a pose bone.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the bone to add the constraint to.
    target_name : str
        Name of the target object.
    target_bone : str, optional
        Name of the target bone (if target is an armature).
    influence : float
        Constraint influence (0.0 to 1.0).
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="POSE")

    pbone = arm_obj.pose.bones.get(bone_name)
    if pbone is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Pose bone '{bone_name}' not found")

    target_obj = _get_object(target_name)
    c = pbone.constraints.new("COPY_LOCATION")
    c.target = target_obj
    if target_bone:
        c.subtarget = target_bone
    c.influence = max(0.0, min(1.0, influence))

    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "constraint_name": c.name,
        "target": target_name,
        "target_bone": target_bone,
        "influence": c.influence,
    }


def add_copy_transforms(
    armature_name: str,
    bone_name: str,
    target_name: str,
    target_bone: Optional[str] = None,
    influence: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Copy Transforms constraint to a pose bone.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the bone to add the constraint to.
    target_name : str
        Name of the target object.
    target_bone : str, optional
        Name of the target bone (if target is an armature).
    influence : float
        Constraint influence (0.0 to 1.0).
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="POSE")

    pbone = arm_obj.pose.bones.get(bone_name)
    if pbone is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Pose bone '{bone_name}' not found")

    target_obj = _get_object(target_name)
    c = pbone.constraints.new("COPY_TRANSFORMS")
    c.target = target_obj
    if target_bone:
        c.subtarget = target_bone
    c.influence = max(0.0, min(1.0, influence))

    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "constraint_name": c.name,
        "target": target_name,
        "target_bone": target_bone,
        "influence": c.influence,
    }


def add_child_of(
    armature_name: str,
    bone_name: str,
    target_name: str,
    target_bone: Optional[str] = None,
    influence: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Child Of constraint to a pose bone.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the bone to add the constraint to.
    target_name : str
        Name of the target object.
    target_bone : str, optional
        Name of the target bone (if target is an armature).
    influence : float
        Constraint influence (0.0 to 1.0).
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="POSE")

    pbone = arm_obj.pose.bones.get(bone_name)
    if pbone is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Pose bone '{bone_name}' not found")

    target_obj = _get_object(target_name)
    c = pbone.constraints.new("CHILD_OF")
    c.target = target_obj
    if target_bone:
        c.subtarget = target_bone
    c.influence = max(0.0, min(1.0, influence))

    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "constraint_name": c.name,
        "target": target_name,
        "target_bone": target_bone,
        "influence": c.influence,
    }


def parent_mesh_to_armature(
    armature_name: str,
    mesh_name: str,
    parent_type: str = "ARMATURE_AUTO",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Parent a mesh to an armature with specified weight method.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    mesh_name : str
        Name of the mesh object.
    parent_type : str
        Parenting method: ARMATURE_AUTO (automatic weights),
        ARMATURE_NAME (name groups), ARMATURE_ENVELOPE (envelope weights).
    """
    _ensure_object_mode()
    arm_obj = _get_armature_object(armature_name)
    mesh_obj = _get_object(mesh_name)
    if mesh_obj.type != "MESH":
        raise ValueError(f"Object '{mesh_name}' is not a mesh")

    parent_type = parent_type.upper()
    valid_types = ("ARMATURE_AUTO", "ARMATURE_NAME", "ARMATURE_ENVELOPE")
    if parent_type not in valid_types:
        raise ValueError(f"Invalid parent_type '{parent_type}'. Valid: {valid_types}")

    bpy.ops.object.select_all(action="DESELECT")
    mesh_obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.parent_set(type=parent_type)

    return {
        "armature_name": arm_obj.name,
        "mesh_name": mesh_obj.name,
        "parent_type": parent_type,
    }


def merge_armatures(
    target_armature: str,
    source_armature: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Merge two armatures by joining the source into the target.

    Parameters
    ----------
    target_armature : str
        Name of the armature to merge into (will keep this one).
    source_armature : str
        Name of the armature to merge from (will be consumed).
    """
    _ensure_object_mode()
    target_obj = _get_armature_object(target_armature)
    source_obj = _get_armature_object(source_armature)

    target_bones_before = len(target_obj.data.bones)

    bpy.ops.object.select_all(action="DESELECT")
    source_obj.select_set(True)
    target_obj.select_set(True)
    bpy.context.view_layer.objects.active = target_obj
    bpy.ops.object.join()

    target_bones_after = len(target_obj.data.bones)
    return {
        "armature_name": target_obj.name,
        "bones_before": target_bones_before,
        "bones_after": target_bones_after,
        "bones_added": target_bones_after - target_bones_before,
    }


def reset_all_poses(
    armature_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Reset all bone poses to rest position.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")
    bpy.ops.pose.transforms_clear()
    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bones_reset": len(arm_obj.pose.bones),
    }


def detect_and_fix_rolls(
    armature_name: str,
    roll_type: str = "GLOBAL_POS_Z",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Recalculate bone roll angles for all bones in an armature.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    roll_type : str
        Roll calculation method: GLOBAL_POS_X, GLOBAL_POS_Y, GLOBAL_POS_Z,
        GLOBAL_NEG_X, GLOBAL_NEG_Y, GLOBAL_NEG_Z, ACTIVE, VIEW, CURSOR.
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    bpy.ops.armature.select_all(action="SELECT")
    bpy.ops.armature.calculate_roll(type=roll_type.upper())

    bones_fixed = len(arm_obj.data.edit_bones)
    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "roll_type": roll_type.upper(),
        "bones_fixed": bones_fixed,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "create_simple_rig": create_simple_rig,
    "connect_bones": connect_bones,
    "align_bones": align_bones,
    "mirror_bones": mirror_bones,
    "delete_bone": delete_bone,
    "rename_bone": rename_bone,
    "rename_bones_batch": rename_bones_batch,
    "set_bone_display": set_bone_display,
    "reparent_bone": reparent_bone,
    "switch_bone_direction": switch_bone_direction,
    "remove_constraint": remove_constraint,
    "list_constraints": list_constraints,
    "add_copy_rotation": add_copy_rotation,
    "add_copy_location": add_copy_location,
    "add_copy_transforms": add_copy_transforms,
    "add_child_of": add_child_of,
    "parent_mesh_to_armature": parent_mesh_to_armature,
    "merge_armatures": merge_armatures,
    "reset_all_poses": reset_all_poses,
    "detect_and_fix_rolls": detect_and_fix_rolls,
}
