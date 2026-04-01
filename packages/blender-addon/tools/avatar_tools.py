"""
Avatar tools for OpenForge MCP.

Tools for avatar body editing, rig detection, bone management,
clothing attachment, and body proportion adjustment.
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


def _ensure_object_mode() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def _select_only(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def _get_armature(name: str) -> bpy.types.Object:
    arm = _get_object(name)
    if arm.type != "ARMATURE":
        raise ValueError(f"Object '{name}' is not an armature")
    return arm


# Common bone name mappings across rig formats
_BONE_MAPS = {
    "mixamo": {
        "hips": "mixamorig:Hips",
        "spine": "mixamorig:Spine",
        "chest": "mixamorig:Spine1",
        "upper_chest": "mixamorig:Spine2",
        "neck": "mixamorig:Neck",
        "head": "mixamorig:Head",
        "left_shoulder": "mixamorig:LeftShoulder",
        "left_upper_arm": "mixamorig:LeftArm",
        "left_lower_arm": "mixamorig:LeftForeArm",
        "left_hand": "mixamorig:LeftHand",
        "right_shoulder": "mixamorig:RightShoulder",
        "right_upper_arm": "mixamorig:RightArm",
        "right_lower_arm": "mixamorig:RightForeArm",
        "right_hand": "mixamorig:RightHand",
        "left_upper_leg": "mixamorig:LeftUpLeg",
        "left_lower_leg": "mixamorig:LeftLeg",
        "left_foot": "mixamorig:LeftFoot",
        "right_upper_leg": "mixamorig:RightUpLeg",
        "right_lower_leg": "mixamorig:RightLeg",
        "right_foot": "mixamorig:RightFoot",
    },
    "vrm": {
        "hips": "J_Bip_C_Hips",
        "spine": "J_Bip_C_Spine",
        "chest": "J_Bip_C_Chest",
        "upper_chest": "J_Bip_C_UpperChest",
        "neck": "J_Bip_C_Neck",
        "head": "J_Bip_C_Head",
        "left_shoulder": "J_Bip_L_Shoulder",
        "left_upper_arm": "J_Bip_L_UpperArm",
        "left_lower_arm": "J_Bip_L_LowerArm",
        "left_hand": "J_Bip_L_Hand",
        "right_shoulder": "J_Bip_R_Shoulder",
        "right_upper_arm": "J_Bip_R_UpperArm",
        "right_lower_arm": "J_Bip_R_LowerArm",
        "right_hand": "J_Bip_R_Hand",
        "left_upper_leg": "J_Bip_L_UpperLeg",
        "left_lower_leg": "J_Bip_L_LowerLeg",
        "left_foot": "J_Bip_L_Foot",
        "right_upper_leg": "J_Bip_R_UpperLeg",
        "right_lower_leg": "J_Bip_R_LowerLeg",
        "right_foot": "J_Bip_R_Foot",
    },
    "mmd": {
        "hips": "Center",
        "spine": "Upper Body",
        "chest": "Upper Body2",
        "neck": "Neck",
        "head": "Head",
        "left_shoulder": "Left Shoulder",
        "left_upper_arm": "Left Arm",
        "left_lower_arm": "Left Elbow",
        "left_hand": "Left Wrist",
        "right_shoulder": "Right Shoulder",
        "right_upper_arm": "Right Arm",
        "right_lower_arm": "Right Elbow",
        "right_hand": "Right Wrist",
        "left_upper_leg": "Left Leg",
        "left_lower_leg": "Left Knee",
        "left_foot": "Left Ankle",
        "right_upper_leg": "Right Leg",
        "right_lower_leg": "Right Knee",
        "right_foot": "Right Ankle",
    },
}

# Body region to bone mapping for scaling
_BODY_REGIONS = {
    "head": ["head"],
    "neck": ["neck"],
    "torso": ["spine", "chest", "upper_chest"],
    "upper_arms": ["left_upper_arm", "right_upper_arm"],
    "lower_arms": ["left_lower_arm", "right_lower_arm"],
    "hands": ["left_hand", "right_hand"],
    "upper_legs": ["left_upper_leg", "right_upper_leg"],
    "lower_legs": ["left_lower_leg", "right_lower_leg"],
    "feet": ["left_foot", "right_foot"],
}


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def detect_body_parts(
    armature_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Auto-detect avatar parts (body, hair, clothes, etc.) parented to armature.

    Parameters
    ----------
    armature_name : str
        Root armature of the avatar.
    """
    arm_obj = _get_armature(armature_name)

    categories = {
        "body": [],
        "hair": [],
        "clothing": [],
        "accessories": [],
        "eyes": [],
        "other": [],
    }

    body_keywords = ["body", "skin", "mesh", "face"]
    hair_keywords = ["hair", "bangs", "fringe", "ponytail", "twintail"]
    clothing_keywords = ["cloth", "shirt", "pants", "skirt", "dress", "jacket",
                         "shoe", "boot", "sock", "glove", "hat", "coat"]
    eye_keywords = ["eye", "iris", "pupil", "highlight"]
    accessory_keywords = ["accessory", "earring", "necklace", "ring", "glasses",
                          "ribbon", "bow", "belt", "bag"]

    for child in arm_obj.children:
        lower_name = child.name.lower()
        if any(kw in lower_name for kw in eye_keywords):
            categories["eyes"].append(child.name)
        elif any(kw in lower_name for kw in hair_keywords):
            categories["hair"].append(child.name)
        elif any(kw in lower_name for kw in clothing_keywords):
            categories["clothing"].append(child.name)
        elif any(kw in lower_name for kw in accessory_keywords):
            categories["accessories"].append(child.name)
        elif any(kw in lower_name for kw in body_keywords):
            categories["body"].append(child.name)
        else:
            categories["other"].append(child.name)

    return {
        "armature": arm_obj.name,
        "categories": categories,
        "total_children": len(arm_obj.children),
    }


def list_avatar_bones(
    armature_name: str,
    show_mapping: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """List all bones with common name mapping for the detected rig format.

    Parameters
    ----------
    armature_name : str
        Armature to inspect.
    show_mapping : bool
        Include humanoid bone mapping in results.
    """
    arm_obj = _get_armature(armature_name)
    bone_names = [b.name for b in arm_obj.data.bones]

    # Detect format
    detected_format = "unknown"
    for fmt, mapping in _BONE_MAPS.items():
        match_count = sum(1 for v in mapping.values() if v in bone_names)
        if match_count > len(mapping) * 0.5:
            detected_format = fmt
            break

    result = {
        "armature": arm_obj.name,
        "bone_count": len(bone_names),
        "bone_names": bone_names,
        "detected_format": detected_format,
    }

    if show_mapping and detected_format in _BONE_MAPS:
        mapping = _BONE_MAPS[detected_format]
        found_mapping = {}
        for standard, actual in mapping.items():
            if actual in bone_names:
                found_mapping[standard] = actual
        result["humanoid_mapping"] = found_mapping

    return result


def adjust_body_region(
    armature_name: str,
    region: str,
    scale_factor: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Scale a body region (head, torso, arms, legs, etc.) via bone scaling.

    Parameters
    ----------
    armature_name : str
        Armature to modify.
    region : str
        Body region: head, neck, torso, upper_arms, lower_arms, hands,
        upper_legs, lower_legs, feet.
    scale_factor : float
        Scale multiplier (1.0 = no change).
    """
    arm_obj = _get_armature(armature_name)

    if region not in _BODY_REGIONS:
        raise ValueError(
            f"Unknown region '{region}'. Available: {list(_BODY_REGIONS.keys())}"
        )

    # Detect rig format
    bone_names = [b.name for b in arm_obj.data.bones]
    rig_format = "unknown"
    for fmt, mapping in _BONE_MAPS.items():
        match_count = sum(1 for v in mapping.values() if v in bone_names)
        if match_count > len(mapping) * 0.5:
            rig_format = fmt
            break

    if rig_format not in _BONE_MAPS:
        raise ValueError("Could not detect rig format for bone mapping")

    mapping = _BONE_MAPS[rig_format]
    standard_bones = _BODY_REGIONS[region]
    scaled_bones = []

    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="POSE")

    for std_name in standard_bones:
        actual_name = mapping.get(std_name)
        if actual_name and actual_name in arm_obj.pose.bones:
            pbone = arm_obj.pose.bones[actual_name]
            pbone.scale = mathutils.Vector((scale_factor, scale_factor, scale_factor))
            scaled_bones.append(actual_name)

    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "armature": arm_obj.name,
        "region": region,
        "scale_factor": scale_factor,
        "scaled_bones": scaled_bones,
        "rig_format": rig_format,
    }


def set_body_proportions(
    armature_name: str,
    head_ratio: float = 7.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set head-to-body ratio (5-9 heads tall).

    Parameters
    ----------
    armature_name : str
        Armature to adjust.
    head_ratio : float
        Number of head-heights for total body height (5.0 to 9.0).
    """
    if head_ratio < 3.0 or head_ratio > 12.0:
        raise ValueError("head_ratio must be between 3.0 and 12.0")

    arm_obj = _get_armature(armature_name)
    bone_names = [b.name for b in arm_obj.data.bones]

    # Detect format
    rig_format = "unknown"
    for fmt, mapping in _BONE_MAPS.items():
        match_count = sum(1 for v in mapping.values() if v in bone_names)
        if match_count > len(mapping) * 0.5:
            rig_format = fmt
            break

    if rig_format not in _BONE_MAPS:
        raise ValueError("Could not detect rig format")

    mapping = _BONE_MAPS[rig_format]

    # Calculate proportion scales based on head ratio
    # Standard anime is ~6 heads, realistic is ~7.5 heads
    baseline = 7.0
    ratio = head_ratio / baseline

    # Head stays same size, body scales
    head_scale = 1.0 / ratio
    torso_scale = ratio * 0.95
    leg_scale = ratio * 1.05

    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="POSE")

    adjusted = {}
    head_bone_name = mapping.get("head")
    if head_bone_name and head_bone_name in arm_obj.pose.bones:
        arm_obj.pose.bones[head_bone_name].scale = mathutils.Vector(
            (head_scale, head_scale, head_scale)
        )
        adjusted["head"] = head_scale

    for region in ["spine", "chest", "upper_chest"]:
        bname = mapping.get(region)
        if bname and bname in arm_obj.pose.bones:
            arm_obj.pose.bones[bname].scale.y = torso_scale
            adjusted[region] = torso_scale

    for region in ["left_upper_leg", "right_upper_leg", "left_lower_leg", "right_lower_leg"]:
        bname = mapping.get(region)
        if bname and bname in arm_obj.pose.bones:
            arm_obj.pose.bones[bname].scale.y = leg_scale
            adjusted[region] = leg_scale

    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "armature": arm_obj.name,
        "head_ratio": head_ratio,
        "rig_format": rig_format,
        "adjusted_bones": adjusted,
    }


def apply_body_preset(
    armature_name: str,
    preset: str = "standard",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply a body type preset to the avatar.

    Parameters
    ----------
    armature_name : str
        Armature to modify.
    preset : str
        Preset name: standard, chibi, tall, athletic, petite.
    """
    presets = {
        "standard": {"head": 1.0, "torso": 1.0, "arms": 1.0, "legs": 1.0},
        "chibi": {"head": 1.5, "torso": 0.7, "arms": 0.7, "legs": 0.6},
        "tall": {"head": 0.9, "torso": 1.1, "arms": 1.1, "legs": 1.2},
        "athletic": {"head": 0.95, "torso": 1.1, "arms": 1.05, "legs": 1.1},
        "petite": {"head": 1.1, "torso": 0.85, "arms": 0.9, "legs": 0.85},
    }

    if preset not in presets:
        raise ValueError(f"Unknown preset '{preset}'. Available: {list(presets.keys())}")

    values = presets[preset]
    arm_obj = _get_armature(armature_name)
    bone_names = [b.name for b in arm_obj.data.bones]

    rig_format = "unknown"
    for fmt, mapping in _BONE_MAPS.items():
        match_count = sum(1 for v in mapping.values() if v in bone_names)
        if match_count > len(mapping) * 0.5:
            rig_format = fmt
            break

    if rig_format not in _BONE_MAPS:
        raise ValueError("Could not detect rig format")

    mapping = _BONE_MAPS[rig_format]
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="POSE")

    region_map = {
        "head": ["head"],
        "torso": ["spine", "chest", "upper_chest"],
        "arms": ["left_upper_arm", "right_upper_arm", "left_lower_arm", "right_lower_arm"],
        "legs": ["left_upper_leg", "right_upper_leg", "left_lower_leg", "right_lower_leg"],
    }

    applied = {}
    for region_key, scale_val in values.items():
        for std_name in region_map.get(region_key, []):
            actual = mapping.get(std_name)
            if actual and actual in arm_obj.pose.bones:
                pbone = arm_obj.pose.bones[actual]
                pbone.scale = mathutils.Vector((scale_val, scale_val, scale_val))
                applied[actual] = scale_val

    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "armature": arm_obj.name,
        "preset": preset,
        "applied_scales": applied,
        "rig_format": rig_format,
    }


def attach_clothing(
    clothing_name: str,
    body_name: str,
    armature_name: str,
    transfer_weights: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Parent clothing to body with armature and optionally transfer weights.

    Parameters
    ----------
    clothing_name : str
        Clothing mesh to attach.
    body_name : str
        Body mesh (weight source).
    armature_name : str
        Armature to parent to.
    transfer_weights : bool
        Transfer vertex weights from body to clothing.
    """
    _ensure_object_mode()
    cloth_obj = _get_object(clothing_name)
    body_obj = _get_object(body_name)
    arm_obj = _get_armature(armature_name)

    if cloth_obj.type != "MESH":
        raise ValueError(f"'{clothing_name}' is not a mesh")
    if body_obj.type != "MESH":
        raise ValueError(f"'{body_name}' is not a mesh")

    # Parent to armature
    cloth_obj.parent = arm_obj
    mod = cloth_obj.modifiers.get("Armature")
    if mod is None:
        mod = cloth_obj.modifiers.new(name="Armature", type="ARMATURE")
    mod.object = arm_obj

    # Transfer weights
    if transfer_weights:
        _select_only(cloth_obj)
        body_obj.select_set(True)
        bpy.context.view_layer.objects.active = cloth_obj

        dt_mod = cloth_obj.modifiers.new(name="WeightTransfer", type="DATA_TRANSFER")
        dt_mod.object = body_obj
        dt_mod.use_vert_data = True
        dt_mod.data_types_verts = {"VGROUP_WEIGHTS"}
        dt_mod.vert_mapping = "POLYINTERP_NEAREST"
        bpy.ops.object.modifier_apply(modifier=dt_mod.name)

    return {
        "clothing": cloth_obj.name,
        "body": body_obj.name,
        "armature": arm_obj.name,
        "weights_transferred": transfer_weights,
    }


def remove_clothing(
    clothing_name: str,
    delete_mesh: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Remove clothing mesh from avatar by unparenting or deleting.

    Parameters
    ----------
    clothing_name : str
        Clothing mesh to remove.
    delete_mesh : bool
        If True, delete the mesh entirely. Otherwise just unparent.
    """
    _ensure_object_mode()
    cloth_obj = _get_object(clothing_name)

    parent_name = cloth_obj.parent.name if cloth_obj.parent else None

    if delete_mesh:
        _select_only(cloth_obj)
        bpy.ops.object.delete(use_global=False)
        return {
            "clothing": clothing_name,
            "action": "deleted",
            "former_parent": parent_name,
        }
    else:
        cloth_obj.parent = None
        # Remove armature modifiers
        for mod in list(cloth_obj.modifiers):
            if mod.type == "ARMATURE":
                cloth_obj.modifiers.remove(mod)
        return {
            "clothing": cloth_obj.name,
            "action": "unparented",
            "former_parent": parent_name,
        }


def toggle_visibility(
    name: str,
    visible: Optional[bool] = None,
    category: Optional[str] = None,
    armature_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Toggle visibility of an object or all objects in a category.

    Parameters
    ----------
    name : str
        Object name (ignored if category is set).
    visible : bool, optional
        Force visibility state. Toggles if not provided.
    category : str, optional
        Toggle all objects matching this keyword (hair, clothing, etc.).
    armature_name : str, optional
        Required when using category to scope to avatar children.
    """
    _ensure_object_mode()
    toggled = []

    if category and armature_name:
        arm_obj = _get_armature(armature_name)
        for child in arm_obj.children:
            if category.lower() in child.name.lower():
                if visible is not None:
                    child.hide_viewport = not visible
                    child.hide_render = not visible
                else:
                    child.hide_viewport = not child.hide_viewport
                    child.hide_render = child.hide_viewport
                toggled.append({
                    "name": child.name,
                    "visible": not child.hide_viewport,
                })
    else:
        obj = _get_object(name)
        if visible is not None:
            obj.hide_viewport = not visible
            obj.hide_render = not visible
        else:
            obj.hide_viewport = not obj.hide_viewport
            obj.hide_render = obj.hide_viewport
        toggled.append({
            "name": obj.name,
            "visible": not obj.hide_viewport,
        })

    return {"toggled_objects": toggled}


def transfer_outfit(
    clothing_name: str,
    source_armature: str,
    target_armature: str,
    target_body: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Transfer clothing from one avatar to another.

    Parameters
    ----------
    clothing_name : str
        Clothing mesh to transfer.
    source_armature : str
        Current parent armature.
    target_armature : str
        New parent armature.
    target_body : str
        Target body mesh for weight transfer.
    """
    _ensure_object_mode()
    cloth_obj = _get_object(clothing_name)
    target_arm = _get_armature(target_armature)
    target_body_obj = _get_object(target_body)

    # Unparent from source
    cloth_obj.parent = None
    for mod in list(cloth_obj.modifiers):
        if mod.type == "ARMATURE":
            cloth_obj.modifiers.remove(mod)

    # Clear existing vertex groups
    cloth_obj.vertex_groups.clear()

    # Parent to target armature
    cloth_obj.parent = target_arm
    arm_mod = cloth_obj.modifiers.new(name="Armature", type="ARMATURE")
    arm_mod.object = target_arm

    # Transfer weights from target body
    _select_only(cloth_obj)
    target_body_obj.select_set(True)
    bpy.context.view_layer.objects.active = cloth_obj

    dt_mod = cloth_obj.modifiers.new(name="WeightTransfer", type="DATA_TRANSFER")
    dt_mod.object = target_body_obj
    dt_mod.use_vert_data = True
    dt_mod.data_types_verts = {"VGROUP_WEIGHTS"}
    dt_mod.vert_mapping = "POLYINTERP_NEAREST"
    bpy.ops.object.modifier_apply(modifier=dt_mod.name)

    return {
        "clothing": cloth_obj.name,
        "source_armature": source_armature,
        "target_armature": target_arm.name,
        "target_body": target_body_obj.name,
        "transferred": True,
    }


def bake_pose(
    armature_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bake the current pose as the new rest pose.

    Parameters
    ----------
    armature_name : str
        Armature whose current pose becomes rest.
    """
    _ensure_object_mode()
    arm_obj = _get_armature(armature_name)
    _select_only(arm_obj)

    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "armature": arm_obj.name,
        "baked": True,
        "bone_count": len(arm_obj.data.bones),
    }


def set_eye_scale(
    armature_name: str,
    scale: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Adjust eye bone scale for the avatar.

    Parameters
    ----------
    armature_name : str
        Armature containing eye bones.
    scale : float
        Scale multiplier for eyes.
    """
    arm_obj = _get_armature(armature_name)
    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="POSE")

    eye_keywords = ["eye", "Eye", "EYE"]
    scaled = []
    for pbone in arm_obj.pose.bones:
        if any(kw in pbone.name for kw in eye_keywords):
            pbone.scale = mathutils.Vector((scale, scale, scale))
            scaled.append(pbone.name)

    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "armature": arm_obj.name,
        "scale": scale,
        "scaled_bones": scaled,
    }


def create_accessory_shape(
    shape_type: str = "ring",
    size: float = 0.02,
    location: Optional[List[float]] = None,
    name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a basic accessory shape primitive.

    Parameters
    ----------
    shape_type : str
        ring, earring, stud, pendant, or bangle.
    size : float
        Base size in meters.
    location : list[float], optional
        XYZ world location.
    name : str, optional
        Name for the object.
    """
    _ensure_object_mode()
    loc = tuple(location) if location else (0, 0, 0)

    if shape_type == "ring":
        bpy.ops.mesh.primitive_torus_add(
            major_radius=size,
            minor_radius=size * 0.15,
            location=loc,
        )
    elif shape_type == "earring":
        bpy.ops.mesh.primitive_torus_add(
            major_radius=size * 0.7,
            minor_radius=size * 0.1,
            location=loc,
        )
    elif shape_type == "stud":
        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=size * 0.3,
            location=loc,
        )
    elif shape_type == "pendant":
        bpy.ops.mesh.primitive_cone_add(
            radius1=size * 0.5,
            depth=size * 0.8,
            location=loc,
        )
        bpy.context.active_object.rotation_euler.x = math.pi
    elif shape_type == "bangle":
        bpy.ops.mesh.primitive_torus_add(
            major_radius=size * 2.0,
            minor_radius=size * 0.2,
            location=loc,
        )
    else:
        raise ValueError(
            f"Unknown shape '{shape_type}'. "
            "Use: ring, earring, stud, pendant, bangle."
        )

    obj = bpy.context.active_object
    if name:
        obj.name = name
        if obj.data:
            obj.data.name = name

    return {
        "object_name": obj.name,
        "shape_type": shape_type,
        "size": size,
        "location": list(obj.location),
    }


def detect_rig_format(
    armature_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Detect rig type (Mixamo, VRM, MMD, Unity humanoid, or unknown).

    Parameters
    ----------
    armature_name : str
        Armature to analyze.
    """
    arm_obj = _get_armature(armature_name)
    bone_names = set(b.name for b in arm_obj.data.bones)

    scores = {}
    for fmt, mapping in _BONE_MAPS.items():
        match_count = sum(1 for v in mapping.values() if v in bone_names)
        scores[fmt] = match_count / len(mapping)

    # Check Unity humanoid pattern
    unity_bones = ["Hips", "Spine", "Chest", "Head", "LeftUpperArm", "RightUpperArm",
                   "LeftUpperLeg", "RightUpperLeg"]
    unity_matches = sum(1 for b in unity_bones if b in bone_names)
    scores["unity_humanoid"] = unity_matches / len(unity_bones)

    best_format = max(scores, key=scores.get)
    confidence = scores[best_format]

    if confidence < 0.3:
        best_format = "unknown"

    return {
        "armature": arm_obj.name,
        "detected_format": best_format,
        "confidence": round(confidence, 3),
        "scores": {k: round(v, 3) for k, v in scores.items()},
        "bone_count": len(bone_names),
    }


def remap_bones(
    armature_name: str,
    source_format: str,
    target_format: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Remap bone names between rig formats (e.g. Mixamo to VRM).

    Parameters
    ----------
    armature_name : str
        Armature to remap.
    source_format : str
        Source format: mixamo, vrm, mmd.
    target_format : str
        Target format: mixamo, vrm, mmd.
    """
    if source_format not in _BONE_MAPS:
        raise ValueError(f"Unknown source format '{source_format}'")
    if target_format not in _BONE_MAPS:
        raise ValueError(f"Unknown target format '{target_format}'")

    arm_obj = _get_armature(armature_name)

    source_map = _BONE_MAPS[source_format]
    target_map = _BONE_MAPS[target_format]

    # Build reverse source map: actual_name -> standard_name
    reverse_source = {v: k for k, v in source_map.items()}

    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    renamed = {}
    for ebone in arm_obj.data.edit_bones:
        standard = reverse_source.get(ebone.name)
        if standard and standard in target_map:
            old_name = ebone.name
            new_name = target_map[standard]
            ebone.name = new_name
            renamed[old_name] = new_name

    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "armature": arm_obj.name,
        "source_format": source_format,
        "target_format": target_format,
        "renamed_bones": renamed,
        "count": len(renamed),
    }


def auto_fix_bone_orientation(
    armature_name: str,
    primary_axis: str = "Y",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Fix bone orientation issues after import by recalculating bone rolls.

    Parameters
    ----------
    armature_name : str
        Armature to fix.
    primary_axis : str
        Primary bone axis: X, Y, or Z.
    """
    _ensure_object_mode()
    arm_obj = _get_armature(armature_name)
    _select_only(arm_obj)

    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.armature.select_all(action="SELECT")

    axis_map = {
        "X": "POS_X",
        "Y": "POS_Y",
        "Z": "POS_Z",
        "-X": "NEG_X",
        "-Y": "NEG_Y",
        "-Z": "NEG_Z",
    }

    axis_val = axis_map.get(primary_axis.upper(), "POS_Y")
    bpy.ops.armature.calculate_roll(type=axis_val)

    bone_count = len(arm_obj.data.edit_bones)
    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "armature": arm_obj.name,
        "primary_axis": primary_axis,
        "fixed_bones": bone_count,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "detect_body_parts": detect_body_parts,
    "list_avatar_bones": list_avatar_bones,
    "adjust_body_region": adjust_body_region,
    "set_body_proportions": set_body_proportions,
    "apply_body_preset": apply_body_preset,
    "attach_clothing": attach_clothing,
    "remove_clothing": remove_clothing,
    "toggle_visibility": toggle_visibility,
    "transfer_outfit": transfer_outfit,
    "bake_pose": bake_pose,
    "set_eye_scale": set_eye_scale,
    "create_accessory_shape": create_accessory_shape,
    "detect_rig_format": detect_rig_format,
    "remap_bones": remap_bones,
    "auto_fix_bone_orientation": auto_fix_bone_orientation,
}
