"""
Accessory tools for OpenForge MCP.

Tools for managing accessories, hair physics, attachments, and object
placement relative to bones and surfaces.
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


def _ensure_object_mode() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def _select_only(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def _get_armature_and_bone(armature_name: str, bone_name: str):
    arm_obj = _get_object(armature_name)
    if arm_obj.type != "ARMATURE":
        raise ValueError(f"Object '{armature_name}' is not an armature")
    bone = arm_obj.data.bones.get(bone_name)
    if bone is None:
        available = [b.name for b in arm_obj.data.bones]
        raise ValueError(
            f"Bone '{bone_name}' not found. Available: {available}"
        )
    return arm_obj, bone


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def mirror_accessory(
    name: str,
    axis: str = "X",
    new_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Duplicate and mirror an object across an axis (e.g. earrings).

    Parameters
    ----------
    name : str
        Object to duplicate and mirror.
    axis : str
        Mirror axis: X, Y, or Z.
    new_name : str, optional
        Name for the mirrored copy.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    _select_only(obj)

    bpy.ops.object.duplicate(linked=False)
    mirrored = bpy.context.active_object

    axis_upper = axis.upper()
    if axis_upper == "X":
        mirrored.location.x = -mirrored.location.x
        mirrored.scale.x = -mirrored.scale.x
    elif axis_upper == "Y":
        mirrored.location.y = -mirrored.location.y
        mirrored.scale.y = -mirrored.scale.y
    elif axis_upper == "Z":
        mirrored.location.z = -mirrored.location.z
        mirrored.scale.z = -mirrored.scale.z
    else:
        raise ValueError(f"Invalid axis '{axis}'. Use X, Y, or Z.")

    if new_name:
        mirrored.name = new_name
        if mirrored.data:
            mirrored.data.name = new_name

    return {
        "original": name,
        "mirrored_object": mirrored.name,
        "axis": axis_upper,
        "location": list(mirrored.location),
    }


def attach_to_bone(
    name: str,
    armature_name: str,
    bone_name: str,
    offset: Optional[List[float]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Parent an object to a specific bone with optional offset.

    Parameters
    ----------
    name : str
        Object to attach.
    armature_name : str
        Armature containing the target bone.
    bone_name : str
        Bone to parent to.
    offset : list[float], optional
        XYZ offset from bone head.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    arm_obj, bone = _get_armature_and_bone(armature_name, bone_name)

    obj.parent = arm_obj
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name

    if offset:
        obj.location = mathutils.Vector(offset)

    return {
        "object_name": obj.name,
        "armature": arm_obj.name,
        "bone": bone_name,
        "location": list(obj.location),
    }


def position_on_bone(
    name: str,
    armature_name: str,
    bone_name: str,
    position: str = "head",
    offset: Optional[List[float]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Place an accessory at a bone's head, tail, or midpoint.

    Parameters
    ----------
    name : str
        Object to position.
    armature_name : str
        Armature containing the bone.
    bone_name : str
        Target bone.
    position : str
        head, tail, or center.
    offset : list[float], optional
        Additional XYZ offset.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    arm_obj, bone = _get_armature_and_bone(armature_name, bone_name)

    bone_matrix = arm_obj.matrix_world
    if position == "head":
        world_pos = bone_matrix @ bone.head_local
    elif position == "tail":
        world_pos = bone_matrix @ bone.tail_local
    elif position == "center":
        mid = (bone.head_local + bone.tail_local) / 2.0
        world_pos = bone_matrix @ mid
    else:
        raise ValueError(f"Invalid position '{position}'. Use head, tail, or center.")

    if offset:
        world_pos += mathutils.Vector(offset)

    obj.location = world_pos

    return {
        "object_name": obj.name,
        "bone": bone_name,
        "position": position,
        "world_location": list(world_pos),
    }


def scale_accessory(
    name: str,
    scale: Optional[List[float]] = None,
    uniform_scale: Optional[float] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Scale an accessory uniformly or non-uniformly.

    Parameters
    ----------
    name : str
        Object to scale.
    scale : list[float], optional
        Non-uniform XYZ scale factors.
    uniform_scale : float, optional
        Uniform scale factor (overrides scale if provided).
    """
    obj = _get_object(name)

    if uniform_scale is not None:
        obj.scale = mathutils.Vector((uniform_scale, uniform_scale, uniform_scale))
    elif scale is not None:
        obj.scale = mathutils.Vector(scale)
    else:
        raise ValueError("Provide either 'scale' or 'uniform_scale'.")

    return {
        "object_name": obj.name,
        "scale": list(obj.scale),
    }


def merge_into_body(
    accessory_name: str,
    body_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Merge an accessory mesh into the main body mesh.

    Parameters
    ----------
    accessory_name : str
        Accessory object to merge.
    body_name : str
        Target body object.
    """
    _ensure_object_mode()
    acc_obj = _get_object(accessory_name)
    body_obj = _get_object(body_name)

    if acc_obj.type != "MESH":
        raise ValueError(f"'{accessory_name}' is not a mesh")
    if body_obj.type != "MESH":
        raise ValueError(f"'{body_name}' is not a mesh")

    bpy.ops.object.select_all(action="DESELECT")
    acc_obj.select_set(True)
    body_obj.select_set(True)
    bpy.context.view_layer.objects.active = body_obj
    bpy.ops.object.join()

    result = bpy.context.active_object
    return {
        "merged_object": result.name,
        "vertex_count": len(result.data.vertices),
        "face_count": len(result.data.polygons),
    }


def separate_by_material(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Split a mesh into separate objects by material slot.

    Parameters
    ----------
    name : str
        Mesh object to split.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"'{name}' is not a mesh")

    _select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="MATERIAL")
    bpy.ops.object.mode_set(mode="OBJECT")

    resulting = [o.name for o in bpy.context.selected_objects]
    return {
        "original": name,
        "resulting_objects": resulting,
        "count": len(resulting),
    }


def setup_hair_physics(
    armature_name: str,
    root_bone: str,
    chain_length: int = 5,
    stiffness: float = 0.5,
    damping: float = 0.3,
    prefix: str = "Hair",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a bone chain for hair dynamics starting from a root bone.

    Parameters
    ----------
    armature_name : str
        Armature to add hair bones to.
    root_bone : str
        Existing bone to start the hair chain from.
    chain_length : int
        Number of bones in the chain.
    stiffness : float
        Stiffness of the hair physics (0-1).
    damping : float
        Damping factor (0-1).
    prefix : str
        Naming prefix for chain bones.
    """
    _ensure_object_mode()
    arm_obj, bone = _get_armature_and_bone(armature_name, root_bone)

    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")
    edit_bones = arm_obj.data.edit_bones

    parent_ebone = edit_bones.get(root_bone)
    if parent_ebone is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Bone '{root_bone}' not found in edit mode")

    bone_length = parent_ebone.length
    direction = (parent_ebone.tail - parent_ebone.head).normalized()
    created_bones = []
    current_parent = parent_ebone

    for i in range(chain_length):
        new_bone = edit_bones.new(f"{prefix}_{i+1:02d}")
        new_bone.head = current_parent.tail.copy()
        new_bone.tail = new_bone.head + direction * bone_length * 0.8
        new_bone.parent = current_parent
        new_bone.use_connect = True
        created_bones.append(new_bone.name)
        current_parent = new_bone

    bpy.ops.object.mode_set(mode="OBJECT")

    # Store physics properties on the created bones
    for bname in created_bones:
        pbone = arm_obj.data.bones.get(bname)
        if pbone:
            pbone["hair_stiffness"] = stiffness
            pbone["hair_damping"] = damping

    return {
        "armature": arm_obj.name,
        "root_bone": root_bone,
        "created_bones": created_bones,
        "chain_length": len(created_bones),
        "stiffness": stiffness,
        "damping": damping,
    }


def setup_dynamic_chain(
    armature_name: str,
    root_bone: str,
    count: int = 4,
    naming_convention: str = "sequential",
    pull: float = 0.2,
    spring: float = 0.2,
    gravity: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Setup a physics bone chain with configurable naming convention.

    Parameters
    ----------
    armature_name : str
        Armature to configure.
    root_bone : str
        Root bone of the existing chain, or bone to extend from.
    count : int
        Number of bones in the chain.
    naming_convention : str
        sequential (Bone_01, Bone_02) or suffix (Bone_L, Bone_R).
    pull : float
        Elasticity (0-1).
    spring : float
        Bounciness (0-1).
    gravity : float
        Gravity influence (0-1).
    """
    arm_obj, _ = _get_armature_and_bone(armature_name, root_bone)

    # Walk the chain from root
    chain_bones = [root_bone]
    current = arm_obj.data.bones.get(root_bone)
    while current.children and len(chain_bones) < count:
        current = current.children[0]
        chain_bones.append(current.name)

    # Apply physics properties
    for bname in chain_bones:
        bone = arm_obj.data.bones.get(bname)
        if bone:
            bone["dynamic_pull"] = pull
            bone["dynamic_spring"] = spring
            bone["dynamic_gravity"] = gravity
            bone["dynamic_naming"] = naming_convention

    return {
        "armature": arm_obj.name,
        "root_bone": root_bone,
        "chain_bones": chain_bones,
        "naming_convention": naming_convention,
        "pull": pull,
        "spring": spring,
        "gravity": gravity,
    }


def distribute_along_curve(
    name: str,
    curve_name: str,
    count: int = 5,
    use_rotation: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Place copies of an object along a curve path at even intervals.

    Parameters
    ----------
    name : str
        Object to distribute.
    curve_name : str
        Curve object to distribute along.
    count : int
        Number of copies to place.
    use_rotation : bool
        Align copies to curve tangent.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    curve_obj = _get_object(curve_name)

    if curve_obj.type != "CURVE":
        raise ValueError(f"'{curve_name}' is not a curve object")

    placed_objects = []
    depsgraph = bpy.context.evaluated_depsgraph_get()
    curve_eval = curve_obj.evaluated_get(depsgraph)

    spline = curve_obj.data.splines[0] if curve_obj.data.splines else None
    if spline is None:
        raise ValueError(f"Curve '{curve_name}' has no splines")

    for i in range(count):
        factor = i / max(count - 1, 1)

        _select_only(obj)
        bpy.ops.object.duplicate(linked=False)
        copy = bpy.context.active_object

        # Sample the curve at this factor using the spline points
        points = spline.bezier_points if spline.type == "BEZIER" else spline.points
        if len(points) < 2:
            copy.location = curve_obj.matrix_world @ points[0].co.to_3d() if hasattr(points[0].co, "to_3d") else curve_obj.matrix_world @ mathutils.Vector(points[0].co[:3])
        else:
            total = len(points) - 1
            seg_float = factor * total
            seg_idx = min(int(seg_float), total - 1)
            seg_frac = seg_float - seg_idx

            if spline.type == "BEZIER":
                p0 = points[seg_idx].co
                p1 = points[seg_idx + 1].co
            else:
                p0 = mathutils.Vector(points[seg_idx].co[:3])
                p1 = mathutils.Vector(points[seg_idx + 1].co[:3])

            interp = p0.lerp(p1, seg_frac)
            copy.location = curve_obj.matrix_world @ interp

            if use_rotation and (p1 - p0).length > 0.0001:
                direction = (p1 - p0).normalized()
                up = mathutils.Vector((0, 0, 1))
                rot_quat = direction.to_track_quat("Y", "Z")
                copy.rotation_euler = rot_quat.to_euler()

        copy.name = f"{name}_curve_{i+1:02d}"
        placed_objects.append(copy.name)

    return {
        "source_object": name,
        "curve": curve_name,
        "placed_objects": placed_objects,
        "count": len(placed_objects),
    }


def snap_to_surface(
    name: str,
    target_name: str,
    direction: Optional[List[float]] = None,
    align_normal: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Snap an object to the nearest point on a target surface.

    Parameters
    ----------
    name : str
        Object to snap.
    target_name : str
        Target surface mesh.
    direction : list[float], optional
        Ray direction for snapping. Defaults to -Z (downward).
    align_normal : bool
        Align object Z axis to surface normal.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    target = _get_object(target_name)

    if target.type != "MESH":
        raise ValueError(f"'{target_name}' is not a mesh")

    ray_dir = mathutils.Vector(direction) if direction else mathutils.Vector((0, 0, -1))
    ray_origin = obj.location.copy()

    # Cast ray in target's local space
    inv_matrix = target.matrix_world.inverted()
    local_origin = inv_matrix @ ray_origin
    local_dir = (inv_matrix.to_3x3() @ ray_dir).normalized()

    result_hit, location, normal, _ = target.ray_cast(local_origin, local_dir)

    if not result_hit:
        # Try opposite direction
        result_hit, location, normal, _ = target.ray_cast(local_origin, -local_dir)

    if not result_hit:
        # Fallback: find closest point on mesh
        result_hit, location, normal, _ = target.closest_point_on_mesh(local_origin)

    if result_hit:
        world_loc = target.matrix_world @ location
        obj.location = world_loc

        if align_normal:
            world_normal = (target.matrix_world.to_3x3() @ normal).normalized()
            up = mathutils.Vector((0, 0, 1))
            rot_quat = up.rotation_difference(world_normal)
            obj.rotation_euler = rot_quat.to_euler()

    return {
        "object_name": obj.name,
        "target": target_name,
        "snapped": result_hit,
        "location": list(obj.location),
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "mirror_accessory": mirror_accessory,
    "attach_to_bone": attach_to_bone,
    "position_on_bone": position_on_bone,
    "scale_accessory": scale_accessory,
    "merge_into_body": merge_into_body,
    "separate_by_material": separate_by_material,
    "setup_hair_physics": setup_hair_physics,
    "setup_dynamic_chain": setup_dynamic_chain,
    "distribute_along_curve": distribute_along_curve,
    "snap_to_surface": snap_to_surface,
}
