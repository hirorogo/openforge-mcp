"""
Armature and rigging tools for OpenForge MCP.

Tools for creating armatures, bones, rigging, weight painting, and shape keys.
"""

from typing import Any, Dict, List, Optional

import bpy
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


def _get_armature_object(name: str) -> bpy.types.Object:
    obj = _get_object(name)
    if obj.type != "ARMATURE":
        raise ValueError(f"Object '{name}' is not an armature (type: {obj.type})")
    return obj


def _select_only(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def _ensure_object_mode() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def create_armature(
    name: str = "Armature",
    location: Optional[List[float]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a new armature object with a single root bone.

    Parameters
    ----------
    name : str
        Name for the armature.
    location : list[float], optional
        World location for the armature. Defaults to origin.
    """
    _ensure_object_mode()
    loc = tuple(location) if location else (0.0, 0.0, 0.0)
    bpy.ops.object.armature_add(location=loc)
    arm_obj = bpy.context.active_object
    arm_obj.name = name
    arm_obj.data.name = name
    return {
        "armature_name": arm_obj.name,
        "location": list(arm_obj.location),
        "bone_count": len(arm_obj.data.bones),
    }


def add_bone(
    armature_name: str,
    bone_name: str = "Bone",
    head: Optional[List[float]] = None,
    tail: Optional[List[float]] = None,
    parent_bone: Optional[str] = None,
    connected: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a bone to an existing armature.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name for the new bone.
    head : list[float], optional
        Head position in armature local space.
    tail : list[float], optional
        Tail position in armature local space.
    parent_bone : str, optional
        Name of the parent bone.
    connected : bool
        Whether the bone is connected to its parent.
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    edit_bone = arm_obj.data.edit_bones.new(bone_name)
    edit_bone.head = mathutils.Vector(head) if head else mathutils.Vector((0, 0, 0))
    edit_bone.tail = mathutils.Vector(tail) if tail else mathutils.Vector((0, 0, 1))

    if parent_bone:
        parent = arm_obj.data.edit_bones.get(parent_bone)
        if parent is None:
            available = [b.name for b in arm_obj.data.edit_bones]
            bpy.ops.object.mode_set(mode="OBJECT")
            raise ValueError(
                f"Parent bone '{parent_bone}' not found. Available: {available}"
            )
        edit_bone.parent = parent
        edit_bone.use_connect = connected

    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "head": list(edit_bone.head) if head else [0, 0, 0],
        "tail": list(edit_bone.tail) if tail else [0, 0, 1],
    }


def set_bone_parent(
    armature_name: str,
    bone_name: str,
    parent_bone: str,
    connected: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the parent of a bone.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the child bone.
    parent_bone : str
        Name of the parent bone.
    connected : bool
        Whether to connect the bone to its parent.
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    child = arm_obj.data.edit_bones.get(bone_name)
    parent = arm_obj.data.edit_bones.get(parent_bone)

    if child is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Bone '{bone_name}' not found in armature '{armature_name}'")
    if parent is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Parent bone '{parent_bone}' not found in armature '{armature_name}'")

    child.parent = parent
    child.use_connect = connected

    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "parent_bone": parent_bone,
        "connected": connected,
    }


def set_ik_constraint(
    armature_name: str,
    bone_name: str,
    target_name: Optional[str] = None,
    target_bone: Optional[str] = None,
    chain_length: int = 0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add an Inverse Kinematics constraint to a bone.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the bone to add IK to.
    target_name : str, optional
        Name of the target object. If None, uses the armature itself.
    target_bone : str, optional
        Name of the target bone within the target armature.
    chain_length : int
        Number of bones in the IK chain. 0 for automatic.
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="POSE")

    pose_bone = arm_obj.pose.bones.get(bone_name)
    if pose_bone is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Pose bone '{bone_name}' not found")

    constraint = pose_bone.constraints.new("IK")
    constraint.chain_count = chain_length

    if target_name:
        target_obj = _get_object(target_name)
        constraint.target = target_obj
        if target_bone:
            constraint.subtarget = target_bone
    else:
        constraint.target = arm_obj
        if target_bone:
            constraint.subtarget = target_bone

    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "chain_length": chain_length,
        "target": target_name or armature_name,
    }


def set_bone_roll(
    armature_name: str,
    bone_name: str,
    roll: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the roll angle of a bone.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    bone_name : str
        Name of the bone.
    roll : float
        Roll angle in radians.
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    edit_bone = arm_obj.data.edit_bones.get(bone_name)
    if edit_bone is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Bone '{bone_name}' not found")

    edit_bone.roll = roll
    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "bone_name": bone_name,
        "roll": roll,
    }


def create_bone_chain(
    armature_name: str,
    chain_name: str = "Chain",
    bone_count: int = 3,
    bone_length: float = 0.5,
    start_position: Optional[List[float]] = None,
    direction: Optional[List[float]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a chain of connected bones.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    chain_name : str
        Base name for the bones (suffixed with numbers).
    bone_count : int
        Number of bones in the chain.
    bone_length : float
        Length of each bone.
    start_position : list[float], optional
        Starting position for the chain.
    direction : list[float], optional
        Direction vector for the chain. Defaults to (0, 0, 1) (upward).
    """
    arm_obj = _get_armature_object(armature_name)
    _ensure_object_mode()
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    start = mathutils.Vector(start_position) if start_position else mathutils.Vector((0, 0, 0))
    dir_vec = mathutils.Vector(direction).normalized() if direction else mathutils.Vector((0, 0, 1))

    bone_names = []
    prev_bone = None

    for i in range(bone_count):
        bname = f"{chain_name}_{i+1:02d}"
        edit_bone = arm_obj.data.edit_bones.new(bname)
        edit_bone.head = start + dir_vec * bone_length * i
        edit_bone.tail = start + dir_vec * bone_length * (i + 1)
        if prev_bone is not None:
            edit_bone.parent = prev_bone
            edit_bone.use_connect = True
        prev_bone = edit_bone
        bone_names.append(bname)

    bpy.ops.object.mode_set(mode="OBJECT")
    return {
        "armature_name": arm_obj.name,
        "chain_name": chain_name,
        "bone_names": bone_names,
        "bone_count": bone_count,
    }


def setup_rig(
    armature_name: str,
    mesh_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Parent a mesh to an armature with automatic weights.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    mesh_name : str
        Name of the mesh object to rig.
    """
    _ensure_object_mode()
    arm_obj = _get_armature_object(armature_name)
    mesh_obj = _get_object(mesh_name)
    if mesh_obj.type != "MESH":
        raise ValueError(f"Object '{mesh_name}' is not a mesh")

    bpy.ops.object.select_all(action="DESELECT")
    mesh_obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")

    return {
        "armature_name": arm_obj.name,
        "mesh_name": mesh_obj.name,
        "parent_type": "ARMATURE_AUTO",
    }


def weight_paint_auto(
    armature_name: str,
    mesh_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Automatically generate weight paint for a mesh parented to an armature.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    mesh_name : str
        Name of the mesh object.
    """
    _ensure_object_mode()
    arm_obj = _get_armature_object(armature_name)
    mesh_obj = _get_object(mesh_name)
    if mesh_obj.type != "MESH":
        raise ValueError(f"Object '{mesh_name}' is not a mesh")

    bpy.ops.object.select_all(action="DESELECT")
    mesh_obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")

    return {
        "armature_name": arm_obj.name,
        "mesh_name": mesh_obj.name,
        "method": "automatic_weights",
    }


def assign_vertex_group(
    mesh_name: str,
    group_name: str,
    vertex_indices: Optional[List[int]] = None,
    weight: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Assign vertices to a vertex group with a given weight.

    Parameters
    ----------
    mesh_name : str
        Name of the mesh object.
    group_name : str
        Name of the vertex group (created if it does not exist).
    vertex_indices : list[int], optional
        Indices of vertices to assign. If None, assigns all vertices.
    weight : float
        Weight value (0.0-1.0).
    """
    _ensure_object_mode()
    mesh_obj = _get_object(mesh_name)
    if mesh_obj.type != "MESH":
        raise ValueError(f"Object '{mesh_name}' is not a mesh")

    vgroup = mesh_obj.vertex_groups.get(group_name)
    if vgroup is None:
        vgroup = mesh_obj.vertex_groups.new(name=group_name)

    if vertex_indices is None:
        vertex_indices = list(range(len(mesh_obj.data.vertices)))

    weight = max(0.0, min(1.0, weight))
    vgroup.add(vertex_indices, weight, "REPLACE")

    return {
        "mesh_name": mesh_obj.name,
        "group_name": vgroup.name,
        "vertex_count": len(vertex_indices),
        "weight": weight,
    }


def create_shape_key(
    name: str,
    shape_key_name: str = "Key",
    from_mix: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a new shape key on a mesh object.

    Parameters
    ----------
    name : str
        Mesh object name.
    shape_key_name : str
        Name for the new shape key.
    from_mix : bool
        Create the shape key from the current mix of existing shape keys.
    """
    _ensure_object_mode()
    mesh_obj = _get_object(name)
    if mesh_obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    # Ensure basis shape key exists
    if mesh_obj.data.shape_keys is None:
        mesh_obj.shape_key_add(name="Basis", from_mix=False)

    sk = mesh_obj.shape_key_add(name=shape_key_name, from_mix=from_mix)

    return {
        "object_name": mesh_obj.name,
        "shape_key_name": sk.name,
        "shape_key_count": len(mesh_obj.data.shape_keys.key_blocks),
    }


def set_shape_key_value(
    name: str,
    shape_key_name: str,
    value: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the value of a shape key on a mesh object.

    Parameters
    ----------
    name : str
        Mesh object name.
    shape_key_name : str
        Name of the shape key.
    value : float
        Shape key influence value (0.0-1.0).
    """
    mesh_obj = _get_object(name)
    if mesh_obj.data.shape_keys is None:
        raise ValueError(f"Object '{name}' has no shape keys")

    sk = mesh_obj.data.shape_keys.key_blocks.get(shape_key_name)
    if sk is None:
        available = [k.name for k in mesh_obj.data.shape_keys.key_blocks]
        raise ValueError(
            f"Shape key '{shape_key_name}' not found. Available: {available}"
        )

    sk.value = max(0.0, min(1.0, value))
    return {
        "object_name": mesh_obj.name,
        "shape_key_name": sk.name,
        "value": sk.value,
    }


def mirror_weights(
    mesh_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Mirror vertex group weights from one side to the other.

    Uses Blender's mirror vertex groups operator. Requires symmetric mesh
    with .L/.R naming convention.

    Parameters
    ----------
    mesh_name : str
        Name of the mesh object.
    """
    _ensure_object_mode()
    mesh_obj = _get_object(mesh_name)
    if mesh_obj.type != "MESH":
        raise ValueError(f"Object '{mesh_name}' is not a mesh")

    _select_only = lambda o: (
        bpy.ops.object.select_all(action="DESELECT"),
        o.select_set(True),
        setattr(bpy.context.view_layer.objects, "active", o),
    )
    _select_only(mesh_obj)
    bpy.ops.object.mode_set(mode="WEIGHT_PAINT")
    bpy.ops.object.vertex_group_mirror(use_topology=False)
    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "mesh_name": mesh_obj.name,
        "action": "mirror_weights",
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "create_armature": create_armature,
    "add_bone": add_bone,
    "set_bone_parent": set_bone_parent,
    "set_ik_constraint": set_ik_constraint,
    "set_bone_roll": set_bone_roll,
    "create_bone_chain": create_bone_chain,
    "setup_rig": setup_rig,
    "weight_paint_auto": weight_paint_auto,
    "assign_vertex_group": assign_vertex_group,
    "create_shape_key": create_shape_key,
    "set_shape_key_value": set_shape_key_value,
    "mirror_weights": mirror_weights,
}
