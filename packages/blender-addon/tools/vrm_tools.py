"""
VRM tools for OpenForge MCP.

Tools for importing, exporting, and configuring VRM models for use in
VRChat and other VRM-compatible applications.
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

def import_vrm(
    filepath: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Import a VRM file.

    Parameters
    ----------
    filepath : str
        Path to the .vrm file.
    """
    _ensure_object_mode()
    # Try the VRM addon operator first, fall back to glTF
    try:
        bpy.ops.import_scene.vrm(filepath=filepath)
    except AttributeError:
        bpy.ops.import_scene.gltf(filepath=filepath)

    imported = [o.name for o in bpy.context.selected_objects]
    return {
        "filepath": filepath,
        "imported_objects": imported,
        "count": len(imported),
    }


def export_vrm(
    filepath: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Export the scene as a VRM file.

    Parameters
    ----------
    filepath : str
        Output path for the .vrm file.
    """
    _ensure_object_mode()
    try:
        bpy.ops.export_scene.vrm(filepath=filepath)
    except AttributeError:
        bpy.ops.export_scene.gltf(filepath=filepath, export_format="GLB")

    return {
        "filepath": filepath,
        "exported": True,
    }


def setup_vrm_metadata(
    armature_name: str,
    title: str = "",
    author: str = "",
    version: str = "1.0",
    contact_info: str = "",
    allowed_user: str = "OnlyAuthor",
    commercial_usage: str = "Disallow",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set VRM metadata on an armature.

    Parameters
    ----------
    armature_name : str
        Name of the armature object holding VRM data.
    title : str
        Model title.
    author : str
        Author name.
    version : str
        Model version string.
    contact_info : str
        Contact URL or email.
    allowed_user : str
        OnlyAuthor, ExplicitlyLicensedPerson, or Everyone.
    commercial_usage : str
        Disallow or Allow.
    """
    arm_obj = _get_object(armature_name)
    if arm_obj.type != "ARMATURE":
        raise ValueError(f"Object '{armature_name}' is not an armature")

    # Store metadata as custom properties (compatible with VRM addon export)
    arm_obj["vrm_title"] = title
    arm_obj["vrm_author"] = author
    arm_obj["vrm_version"] = version
    arm_obj["vrm_contact_info"] = contact_info
    arm_obj["vrm_allowed_user"] = allowed_user
    arm_obj["vrm_commercial_usage"] = commercial_usage

    return {
        "armature_name": arm_obj.name,
        "title": title,
        "author": author,
        "version": version,
    }


def create_facial_expressions(
    mesh_name: str,
    expressions: Optional[List[str]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create shape keys for standard VRM facial expressions.

    Parameters
    ----------
    mesh_name : str
        Name of the face mesh object.
    expressions : list[str], optional
        List of expression names. Defaults to standard VRM set.
    """
    _ensure_object_mode()
    mesh_obj = _get_object(mesh_name)
    if mesh_obj.type != "MESH":
        raise ValueError(f"Object '{mesh_name}' is not a mesh")

    default_expressions = [
        "Neutral", "A", "I", "U", "E", "O",
        "Blink", "Blink_L", "Blink_R",
        "Joy", "Angry", "Sorrow", "Fun",
        "LookUp", "LookDown", "LookLeft", "LookRight",
    ]
    expr_list = expressions or default_expressions

    # Ensure basis exists
    if mesh_obj.data.shape_keys is None:
        mesh_obj.shape_key_add(name="Basis", from_mix=False)

    created = []
    for expr_name in expr_list:
        existing = mesh_obj.data.shape_keys.key_blocks.get(expr_name)
        if existing is None:
            sk = mesh_obj.shape_key_add(name=expr_name, from_mix=False)
            created.append(sk.name)

    return {
        "mesh_name": mesh_obj.name,
        "created_expressions": created,
        "total_shape_keys": len(mesh_obj.data.shape_keys.key_blocks),
    }


def setup_spring_bones(
    armature_name: str,
    bone_names: List[str],
    stiffness: float = 1.0,
    gravity_power: float = 0.0,
    drag_force: float = 0.4,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Configure spring bone physics parameters on bones.

    Parameters
    ----------
    armature_name : str
        Name of the armature.
    bone_names : list[str]
        Names of bones to configure as spring bones.
    stiffness : float
        Spring stiffness value.
    gravity_power : float
        Gravity influence strength.
    drag_force : float
        Drag force damping value.
    """
    arm_obj = _get_object(armature_name)
    if arm_obj.type != "ARMATURE":
        raise ValueError(f"Object '{armature_name}' is not an armature")

    configured = []
    for bname in bone_names:
        bone = arm_obj.data.bones.get(bname)
        if bone is None:
            continue
        bone["vrm_spring_stiffness"] = stiffness
        bone["vrm_spring_gravity"] = gravity_power
        bone["vrm_spring_drag"] = drag_force
        configured.append(bname)

    return {
        "armature_name": arm_obj.name,
        "configured_bones": configured,
        "stiffness": stiffness,
        "gravity_power": gravity_power,
        "drag_force": drag_force,
    }


def setup_physbone_chain(
    armature_name: str,
    root_bone: str,
    pull: float = 0.2,
    spring: float = 0.2,
    stiffness: float = 0.0,
    immobile: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Configure a bone chain as a PhysBone for VRChat.

    Parameters
    ----------
    armature_name : str
        Name of the armature.
    root_bone : str
        Name of the root bone of the chain.
    pull : float
        Elasticity returning to rest pose (0-1).
    spring : float
        Spring bounciness (0-1).
    stiffness : float
        Resistance to movement (0-1).
    immobile : float
        Immobile fraction of the bone (0-1).
    """
    arm_obj = _get_object(armature_name)
    if arm_obj.type != "ARMATURE":
        raise ValueError(f"Object '{armature_name}' is not an armature")

    bone = arm_obj.data.bones.get(root_bone)
    if bone is None:
        raise ValueError(f"Bone '{root_bone}' not found in armature '{armature_name}'")

    bone["physbone_pull"] = pull
    bone["physbone_spring"] = spring
    bone["physbone_stiffness"] = stiffness
    bone["physbone_immobile"] = immobile

    # Collect chain bones
    chain_bones = [root_bone]
    current = bone
    while current.children:
        current = current.children[0]
        chain_bones.append(current.name)

    return {
        "armature_name": arm_obj.name,
        "root_bone": root_bone,
        "chain_bones": chain_bones,
        "pull": pull,
        "spring": spring,
    }


def reduce_polycount(
    name: str,
    target_faces: int = 10000,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Reduce polygon count of a mesh for VRM optimization.

    Parameters
    ----------
    name : str
        Mesh object name.
    target_faces : int
        Target number of faces.
    """
    _ensure_object_mode()
    mesh_obj = _get_object(name)
    if mesh_obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    face_count_before = len(mesh_obj.data.polygons)
    if face_count_before <= target_faces:
        return {
            "object_name": mesh_obj.name,
            "face_count_before": face_count_before,
            "face_count_after": face_count_before,
            "ratio": 1.0,
            "skipped": True,
        }

    ratio = target_faces / face_count_before
    ratio = max(0.01, min(1.0, ratio))

    mod = mesh_obj.modifiers.new(name="VRM_Decimate", type="DECIMATE")
    mod.ratio = ratio

    _select_only(mesh_obj)
    bpy.ops.object.modifier_apply(modifier=mod.name)

    face_count_after = len(mesh_obj.data.polygons)
    return {
        "object_name": mesh_obj.name,
        "face_count_before": face_count_before,
        "face_count_after": face_count_after,
        "ratio": ratio,
    }


def setup_vrm_materials(
    mesh_name: str,
    shader_type: str = "MToon",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Configure materials on a mesh for VRM-compatible rendering.

    Parameters
    ----------
    mesh_name : str
        Name of the mesh object.
    shader_type : str
        MToon or Unlit.
    """
    _ensure_object_mode()
    mesh_obj = _get_object(mesh_name)
    if mesh_obj.type != "MESH":
        raise ValueError(f"Object '{mesh_name}' is not a mesh")

    configured_materials = []
    for slot in mesh_obj.material_slots:
        mat = slot.material
        if mat is None:
            continue
        mat["vrm_shader"] = shader_type
        if shader_type == "MToon":
            mat["vrm_shade_color"] = [0.5, 0.5, 0.5, 1.0]
            mat["vrm_outline_width"] = 0.002
            mat["vrm_outline_color"] = [0.0, 0.0, 0.0, 1.0]
        elif shader_type == "Unlit":
            mat["vrm_shade_color"] = [1.0, 1.0, 1.0, 1.0]
        configured_materials.append(mat.name)

    return {
        "mesh_name": mesh_obj.name,
        "shader_type": shader_type,
        "configured_materials": configured_materials,
    }


def create_blend_shapes(
    mesh_name: str,
    blend_shape_names: List[str],
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create multiple blend shapes (shape keys) on a mesh.

    Parameters
    ----------
    mesh_name : str
        Name of the mesh object.
    blend_shape_names : list[str]
        Names for the blend shapes to create.
    """
    _ensure_object_mode()
    mesh_obj = _get_object(mesh_name)
    if mesh_obj.type != "MESH":
        raise ValueError(f"Object '{mesh_name}' is not a mesh")

    if mesh_obj.data.shape_keys is None:
        mesh_obj.shape_key_add(name="Basis", from_mix=False)

    created = []
    for bs_name in blend_shape_names:
        existing = mesh_obj.data.shape_keys.key_blocks.get(bs_name)
        if existing is None:
            sk = mesh_obj.shape_key_add(name=bs_name, from_mix=False)
            created.append(sk.name)

    return {
        "mesh_name": mesh_obj.name,
        "created": created,
        "total_shape_keys": len(mesh_obj.data.shape_keys.key_blocks),
    }


def optimize_for_vrchat(
    armature_name: str,
    max_polygons: int = 32000,
    max_materials: int = 4,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Optimize a VRM model for VRChat performance.

    Checks and reports polygon count, material count, and bone count
    against VRChat recommended limits.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    max_polygons : int
        Target maximum polygon count.
    max_materials : int
        Target maximum material count.
    """
    arm_obj = _get_object(armature_name)
    if arm_obj.type != "ARMATURE":
        raise ValueError(f"Object '{armature_name}' is not an armature")

    total_polygons = 0
    total_materials = set()
    mesh_children = []

    for child in arm_obj.children:
        if child.type == "MESH":
            mesh_children.append(child.name)
            total_polygons += len(child.data.polygons)
            for slot in child.material_slots:
                if slot.material:
                    total_materials.add(slot.material.name)

    bone_count = len(arm_obj.data.bones)

    warnings = []
    if total_polygons > max_polygons:
        warnings.append(
            f"Polygon count {total_polygons} exceeds target {max_polygons}"
        )
    if len(total_materials) > max_materials:
        warnings.append(
            f"Material count {len(total_materials)} exceeds target {max_materials}"
        )
    if bone_count > 256:
        warnings.append(
            f"Bone count {bone_count} exceeds VRChat limit of 256"
        )

    # Auto-decimate meshes if over polygon limit
    if total_polygons > max_polygons:
        ratio = max_polygons / total_polygons
        for child_name in mesh_children:
            child = bpy.data.objects.get(child_name)
            if child and child.type == "MESH" and len(child.data.polygons) > 0:
                mod = child.modifiers.new(name="VRC_Optimize", type="DECIMATE")
                mod.ratio = max(0.05, ratio)
                _select_only(child)
                bpy.ops.object.modifier_apply(modifier=mod.name)

    # Recount after optimization
    final_polygons = 0
    for child_name in mesh_children:
        child = bpy.data.objects.get(child_name)
        if child and child.type == "MESH":
            final_polygons += len(child.data.polygons)

    return {
        "armature_name": arm_obj.name,
        "original_polygons": total_polygons,
        "final_polygons": final_polygons,
        "material_count": len(total_materials),
        "bone_count": bone_count,
        "mesh_children": mesh_children,
        "warnings": warnings,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "import_vrm": import_vrm,
    "export_vrm": export_vrm,
    "setup_vrm_metadata": setup_vrm_metadata,
    "create_facial_expressions": create_facial_expressions,
    "setup_spring_bones": setup_spring_bones,
    "setup_physbone_chain": setup_physbone_chain,
    "reduce_polycount": reduce_polycount,
    "setup_vrm_materials": setup_vrm_materials,
    "create_blend_shapes": create_blend_shapes,
    "optimize_for_vrchat": optimize_for_vrchat,
}
