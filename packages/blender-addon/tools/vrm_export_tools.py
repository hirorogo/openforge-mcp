"""
VRM export tools for OpenForge MCP.

Tools for exporting VRM/VRChat-optimized models, bone renaming,
hierarchy setup, validation, and batch export.
"""

from typing import Any, Dict, List, Optional
import os

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


def _get_armature(name: str) -> bpy.types.Object:
    arm = _get_object(name)
    if arm.type != "ARMATURE":
        raise ValueError(f"Object '{name}' is not an armature")
    return arm


def _ensure_object_mode() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def _select_only(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


# VRChat bone naming convention
_VRC_BONE_NAMES = {
    "hips": "Hips",
    "spine": "Spine",
    "chest": "Chest",
    "upper_chest": "Upper Chest",
    "neck": "Neck",
    "head": "Head",
    "left_eye": "Left eye",
    "right_eye": "Right eye",
    "jaw": "Jaw",
    "left_shoulder": "Left shoulder",
    "left_upper_arm": "Left arm",
    "left_lower_arm": "Left forearm",
    "left_hand": "Left hand",
    "right_shoulder": "Right shoulder",
    "right_upper_arm": "Right arm",
    "right_lower_arm": "Right forearm",
    "right_hand": "Right hand",
    "left_upper_leg": "Left leg",
    "left_lower_leg": "Left knee",
    "left_foot": "Left foot",
    "left_toe": "Left toe",
    "right_upper_leg": "Right leg",
    "right_lower_leg": "Right knee",
    "right_foot": "Right foot",
    "right_toe": "Right toe",
}

# Common source patterns mapped to standard bone names
_COMMON_BONE_PATTERNS = {
    "mixamorig:Hips": "hips",
    "mixamorig:Spine": "spine",
    "mixamorig:Spine1": "chest",
    "mixamorig:Spine2": "upper_chest",
    "mixamorig:Neck": "neck",
    "mixamorig:Head": "head",
    "mixamorig:LeftShoulder": "left_shoulder",
    "mixamorig:LeftArm": "left_upper_arm",
    "mixamorig:LeftForeArm": "left_lower_arm",
    "mixamorig:LeftHand": "left_hand",
    "mixamorig:RightShoulder": "right_shoulder",
    "mixamorig:RightArm": "right_upper_arm",
    "mixamorig:RightForeArm": "right_lower_arm",
    "mixamorig:RightHand": "right_hand",
    "mixamorig:LeftUpLeg": "left_upper_leg",
    "mixamorig:LeftLeg": "left_lower_leg",
    "mixamorig:LeftFoot": "left_foot",
    "mixamorig:LeftToeBase": "left_toe",
    "mixamorig:RightUpLeg": "right_upper_leg",
    "mixamorig:RightLeg": "right_lower_leg",
    "mixamorig:RightFoot": "right_foot",
    "mixamorig:RightToeBase": "right_toe",
    "J_Bip_C_Hips": "hips",
    "J_Bip_C_Spine": "spine",
    "J_Bip_C_Chest": "chest",
    "J_Bip_C_UpperChest": "upper_chest",
    "J_Bip_C_Neck": "neck",
    "J_Bip_C_Head": "head",
    "J_Bip_L_Shoulder": "left_shoulder",
    "J_Bip_L_UpperArm": "left_upper_arm",
    "J_Bip_L_LowerArm": "left_lower_arm",
    "J_Bip_L_Hand": "left_hand",
    "J_Bip_R_Shoulder": "right_shoulder",
    "J_Bip_R_UpperArm": "right_upper_arm",
    "J_Bip_R_LowerArm": "right_lower_arm",
    "J_Bip_R_Hand": "right_hand",
    "J_Bip_L_UpperLeg": "left_upper_leg",
    "J_Bip_L_LowerLeg": "left_lower_leg",
    "J_Bip_L_Foot": "left_foot",
    "J_Bip_R_UpperLeg": "right_upper_leg",
    "J_Bip_R_LowerLeg": "right_lower_leg",
    "J_Bip_R_Foot": "right_foot",
}


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def export_for_unity(
    filepath: str,
    armature_name: Optional[str] = None,
    apply_modifiers: bool = True,
    scale_factor: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Export FBX optimized for Unity/VRChat import.

    Parameters
    ----------
    filepath : str
        Output .fbx file path.
    armature_name : str, optional
        Armature to export. Exports all selected if omitted.
    apply_modifiers : bool
        Apply modifiers before export.
    scale_factor : float
        Export scale factor (1.0 for Unity default).
    """
    _ensure_object_mode()

    if armature_name:
        arm_obj = _get_armature(armature_name)
        bpy.ops.object.select_all(action="DESELECT")
        arm_obj.select_set(True)
        for child in arm_obj.children:
            child.select_set(True)
        bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.export_scene.fbx(
        filepath=filepath,
        use_selection=bool(armature_name),
        apply_scale_options="FBX_SCALE_ALL",
        global_scale=scale_factor,
        apply_unit_scale=True,
        bake_space_transform=False,
        object_types={"ARMATURE", "MESH"},
        use_mesh_modifiers=apply_modifiers,
        mesh_smooth_type="FACE",
        use_mesh_edges=False,
        add_leaf_bones=False,
        primary_bone_axis="Y",
        secondary_bone_axis="X",
        armature_nodetype="NULL",
        bake_anim=False,
        path_mode="COPY",
        embed_textures=True,
    )

    return {
        "filepath": filepath,
        "armature": armature_name or "(all selected)",
        "scale_factor": scale_factor,
        "apply_modifiers": apply_modifiers,
    }


def rename_bones_vrc(
    armature_name: str,
    auto_detect: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Rename bones to VRChat humanoid convention.

    Parameters
    ----------
    armature_name : str
        Armature to rename bones in.
    auto_detect : bool
        Auto-detect source format and map bones.
    """
    _ensure_object_mode()
    arm_obj = _get_armature(armature_name)

    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    renamed = {}
    for ebone in arm_obj.data.edit_bones:
        standard = _COMMON_BONE_PATTERNS.get(ebone.name)
        if standard and standard in _VRC_BONE_NAMES:
            old_name = ebone.name
            new_name = _VRC_BONE_NAMES[standard]
            ebone.name = new_name
            renamed[old_name] = new_name

    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "armature": arm_obj.name,
        "renamed_bones": renamed,
        "count": len(renamed),
    }


def setup_vrm_hierarchy(
    armature_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Setup correct VRM bone hierarchy (re-parent bones if needed).

    Parameters
    ----------
    armature_name : str
        Armature to configure.
    """
    _ensure_object_mode()
    arm_obj = _get_armature(armature_name)

    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    edit_bones = arm_obj.data.edit_bones
    hierarchy = {
        "Spine": "Hips",
        "Chest": "Spine",
        "Upper Chest": "Chest",
        "Neck": "Upper Chest",
        "Head": "Neck",
        "Left shoulder": "Upper Chest",
        "Right shoulder": "Upper Chest",
        "Left arm": "Left shoulder",
        "Right arm": "Right shoulder",
        "Left forearm": "Left arm",
        "Right forearm": "Right arm",
        "Left hand": "Left forearm",
        "Right hand": "Right forearm",
        "Left leg": "Hips",
        "Right leg": "Hips",
        "Left knee": "Left leg",
        "Right knee": "Right leg",
        "Left foot": "Left knee",
        "Right foot": "Right knee",
    }

    adjusted = {}
    for child_name, parent_name in hierarchy.items():
        child_bone = edit_bones.get(child_name)
        parent_bone = edit_bones.get(parent_name)
        if child_bone and parent_bone:
            if child_bone.parent != parent_bone:
                child_bone.parent = parent_bone
                adjusted[child_name] = parent_name

    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "armature": arm_obj.name,
        "adjusted_hierarchy": adjusted,
        "total_bones": len(arm_obj.data.bones),
    }


def validate_for_vrc(
    armature_name: str,
    performance_rank: str = "medium",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Check a model against VRChat requirements and limits.

    Parameters
    ----------
    armature_name : str
        Armature to validate.
    performance_rank : str
        Target rank: excellent, good, medium, or poor.
    """
    arm_obj = _get_armature(armature_name)

    limits = {
        "excellent": {"polygons": 7500, "materials": 1, "bones": 75, "mesh_count": 1},
        "good": {"polygons": 10000, "materials": 1, "bones": 90, "mesh_count": 1},
        "medium": {"polygons": 15000, "materials": 2, "bones": 150, "mesh_count": 2},
        "poor": {"polygons": 20000, "materials": 4, "bones": 256, "mesh_count": 4},
    }

    if performance_rank not in limits:
        raise ValueError(
            f"Unknown rank '{performance_rank}'. Use: {list(limits.keys())}"
        )

    target = limits[performance_rank]

    # Count stats
    total_polygons = 0
    total_materials = set()
    mesh_count = 0
    mesh_children = []

    for child in arm_obj.children:
        if child.type == "MESH":
            mesh_count += 1
            mesh_children.append(child.name)
            total_polygons += len(child.data.polygons)
            for slot in child.material_slots:
                if slot.material:
                    total_materials.add(slot.material.name)

    bone_count = len(arm_obj.data.bones)

    # Check required bones
    required_bones = ["Hips", "Spine", "Chest", "Neck", "Head",
                      "Left arm", "Right arm", "Left leg", "Right leg"]
    bone_names = set(b.name for b in arm_obj.data.bones)
    missing_required = [b for b in required_bones if b not in bone_names]

    # Check shape keys
    has_visemes = False
    has_blink = False
    for child_name in mesh_children:
        child = bpy.data.objects.get(child_name)
        if child and child.data.shape_keys:
            kb_names = set(k.name for k in child.data.shape_keys.key_blocks)
            if "vrc.v_aa" in kb_names or "A" in kb_names:
                has_visemes = True
            if "Blink" in kb_names or "blink" in kb_names:
                has_blink = True

    issues = []
    warnings = []

    if total_polygons > target["polygons"]:
        issues.append(
            f"Polygons ({total_polygons}) exceed {performance_rank} limit ({target['polygons']})"
        )
    if len(total_materials) > target["materials"]:
        issues.append(
            f"Materials ({len(total_materials)}) exceed {performance_rank} limit ({target['materials']})"
        )
    if bone_count > target["bones"]:
        issues.append(
            f"Bones ({bone_count}) exceed {performance_rank} limit ({target['bones']})"
        )
    if mesh_count > target["mesh_count"]:
        warnings.append(
            f"Mesh count ({mesh_count}) exceeds {performance_rank} target ({target['mesh_count']})"
        )
    if missing_required:
        issues.append(f"Missing required bones: {missing_required}")
    if not has_visemes:
        warnings.append("No viseme shape keys detected")
    if not has_blink:
        warnings.append("No blink shape key detected")

    passed = len(issues) == 0

    return {
        "armature": arm_obj.name,
        "performance_rank": performance_rank,
        "passed": passed,
        "issues": issues,
        "warnings": warnings,
        "stats": {
            "polygons": total_polygons,
            "materials": len(total_materials),
            "bones": bone_count,
            "meshes": mesh_count,
            "has_visemes": has_visemes,
            "has_blink": has_blink,
        },
        "limits": target,
    }


def batch_export_variants(
    armature_name: str,
    output_dir: str,
    variants: List[Dict[str, Any]],
    format: str = "fbx",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Export multiple avatar variants (different shape key combinations).

    Parameters
    ----------
    armature_name : str
        Armature to export.
    output_dir : str
        Directory for output files.
    variants : list[dict]
        List of variant configs, each with 'name' and optional
        'shape_keys' dict mapping shape key names to values.
    format : str
        Export format: fbx or vrm.
    """
    _ensure_object_mode()
    arm_obj = _get_armature(armature_name)

    exported = []
    for variant in variants:
        var_name = variant.get("name", f"variant_{len(exported)}")
        shape_keys = variant.get("shape_keys", {})

        # Apply shape key values
        for child in arm_obj.children:
            if child.type == "MESH" and child.data.shape_keys:
                for sk_name, sk_val in shape_keys.items():
                    kb = child.data.shape_keys.key_blocks.get(sk_name)
                    if kb:
                        kb.value = sk_val

        # Select armature and children
        bpy.ops.object.select_all(action="DESELECT")
        arm_obj.select_set(True)
        for child in arm_obj.children:
            child.select_set(True)
        bpy.context.view_layer.objects.active = arm_obj

        ext = ".fbx" if format == "fbx" else ".vrm"
        filepath = os.path.join(output_dir, f"{var_name}{ext}")

        if format == "fbx":
            bpy.ops.export_scene.fbx(
                filepath=filepath,
                use_selection=True,
                object_types={"ARMATURE", "MESH"},
                add_leaf_bones=False,
                bake_anim=False,
            )
        else:
            try:
                bpy.ops.export_scene.vrm(filepath=filepath)
            except AttributeError:
                bpy.ops.export_scene.gltf(
                    filepath=filepath, export_format="GLB"
                )

        exported.append({"name": var_name, "filepath": filepath})

    # Reset shape keys
    for child in arm_obj.children:
        if child.type == "MESH" and child.data.shape_keys:
            for kb in child.data.shape_keys.key_blocks:
                kb.value = 0.0

    return {
        "armature": arm_obj.name,
        "output_dir": output_dir,
        "exported_variants": exported,
        "count": len(exported),
    }


def organize_bone_groups(
    armature_name: str,
    groups: Optional[Dict[str, List[str]]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Organize bones into bone groups or collections.

    Parameters
    ----------
    armature_name : str
        Armature to organize.
    groups : dict[str, list[str]], optional
        Mapping of group name to bone names. Uses defaults if omitted.
    """
    _ensure_object_mode()
    arm_obj = _get_armature(armature_name)

    default_groups = {
        "Body": ["Hips", "Spine", "Chest", "Upper Chest", "Neck", "Head"],
        "Left Arm": ["Left shoulder", "Left arm", "Left forearm", "Left hand"],
        "Right Arm": ["Right shoulder", "Right arm", "Right forearm", "Right hand"],
        "Left Leg": ["Left leg", "Left knee", "Left foot", "Left toe"],
        "Right Leg": ["Right leg", "Right knee", "Right foot", "Right toe"],
        "Dynamics": [],
    }

    group_defs = groups or default_groups
    bone_names = set(b.name for b in arm_obj.data.bones)

    # Try Blender 4.0+ bone collections first, fall back to pose bone groups
    organized = {}
    try:
        # Blender 4.0+ bone collections
        for group_name, bones in group_defs.items():
            coll = arm_obj.data.collections.get(group_name)
            if coll is None:
                coll = arm_obj.data.collections.new(group_name)
            assigned = []
            for bname in bones:
                if bname in bone_names:
                    bone = arm_obj.data.bones.get(bname)
                    if bone:
                        coll.assign(bone)
                        assigned.append(bname)
            organized[group_name] = assigned
    except (AttributeError, TypeError):
        # Fallback for older Blender: use custom properties
        for group_name, bones in group_defs.items():
            assigned = []
            for bname in bones:
                if bname in bone_names:
                    bone = arm_obj.data.bones.get(bname)
                    if bone:
                        bone["bone_group"] = group_name
                        assigned.append(bname)
            organized[group_name] = assigned

    return {
        "armature": arm_obj.name,
        "organized_groups": organized,
        "total_groups": len(organized),
    }


def export_animation_only(
    filepath: str,
    armature_name: str,
    action_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Export only animation data as FBX (no mesh).

    Parameters
    ----------
    filepath : str
        Output .fbx file path.
    armature_name : str
        Armature with animation.
    action_name : str, optional
        Specific action to export. Uses active action if omitted.
    """
    _ensure_object_mode()
    arm_obj = _get_armature(armature_name)
    _select_only(arm_obj)

    # Set specific action if requested
    original_action = None
    if action_name:
        action = bpy.data.actions.get(action_name)
        if action is None:
            available = [a.name for a in bpy.data.actions]
            raise ValueError(
                f"Action '{action_name}' not found. Available: {available}"
            )
        if arm_obj.animation_data is None:
            arm_obj.animation_data_create()
        original_action = arm_obj.animation_data.action
        arm_obj.animation_data.action = action

    bpy.ops.export_scene.fbx(
        filepath=filepath,
        use_selection=True,
        object_types={"ARMATURE"},
        add_leaf_bones=False,
        bake_anim=True,
        bake_anim_use_all_actions=False,
        bake_anim_use_nla_strips=False,
        bake_anim_force_startend_keying=True,
    )

    # Restore original action
    if original_action is not None and arm_obj.animation_data:
        arm_obj.animation_data.action = original_action

    exported_action = action_name
    if not exported_action and arm_obj.animation_data and arm_obj.animation_data.action:
        exported_action = arm_obj.animation_data.action.name

    return {
        "filepath": filepath,
        "armature": arm_obj.name,
        "action": exported_action,
    }


def setup_vrm_materials(
    armature_name: str,
    shader_type: str = "MToon",
    outline_width: float = 0.002,
    shade_factor: float = 0.7,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Setup VRM-compatible materials on all meshes under an armature.

    Parameters
    ----------
    armature_name : str
        Armature whose child meshes to configure.
    shader_type : str
        MToon or Unlit.
    outline_width : float
        Outline thickness for MToon shader.
    shade_factor : float
        Shade color darkness factor (0-1).
    """
    _ensure_object_mode()
    arm_obj = _get_armature(armature_name)

    configured = []
    for child in arm_obj.children:
        if child.type != "MESH":
            continue
        for slot in child.material_slots:
            mat = slot.material
            if mat is None:
                continue

            mat["vrm_shader"] = shader_type

            if shader_type == "MToon":
                # Configure MToon properties
                mat["vrm_shade_color"] = [shade_factor, shade_factor, shade_factor, 1.0]
                mat["vrm_outline_width"] = outline_width
                mat["vrm_outline_color"] = [0.0, 0.0, 0.0, 1.0]
                mat["vrm_shade_toony"] = 0.9
                mat["vrm_receive_shadow"] = True

                # Setup node tree for MToon-like look
                mat.use_nodes = True
                tree = mat.node_tree
                bsdf = None
                for node in tree.nodes:
                    if node.type == "BSDF_PRINCIPLED":
                        bsdf = node
                        break
                if bsdf:
                    bsdf.inputs["Roughness"].default_value = 1.0
                    bsdf.inputs["Specular IOR Level"].default_value = 0.0 if hasattr(bsdf.inputs, "Specular IOR Level") else None

            elif shader_type == "Unlit":
                mat["vrm_shade_color"] = [1.0, 1.0, 1.0, 1.0]
                mat.use_nodes = True
                # Already handled by existing node setup

            configured.append({
                "mesh": child.name,
                "material": mat.name,
                "shader": shader_type,
            })

    return {
        "armature": arm_obj.name,
        "shader_type": shader_type,
        "configured_materials": configured,
        "count": len(configured),
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "export_for_unity": export_for_unity,
    "rename_bones_vrc": rename_bones_vrc,
    "setup_vrm_hierarchy": setup_vrm_hierarchy,
    "validate_for_vrc": validate_for_vrc,
    "batch_export_variants": batch_export_variants,
    "organize_bone_groups": organize_bone_groups,
    "export_animation_only": export_animation_only,
    "setup_vrm_materials": setup_vrm_materials,
}
