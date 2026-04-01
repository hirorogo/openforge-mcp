"""
Advanced material tools for OpenForge MCP.

These complement the basic material operations in material_tools.py with
Principled BSDF full control, material management, and texture operations.
"""

from typing import Any, Dict, List, Optional

import bpy
import os


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


def _get_material(name: str) -> bpy.types.Material:
    mat = bpy.data.materials.get(name)
    if mat is None:
        available = [m.name for m in bpy.data.materials]
        raise ValueError(
            f"Material '{name}' not found. Available: {available}"
        )
    return mat


def _get_principled_bsdf(mat: bpy.types.Material) -> bpy.types.ShaderNode:
    if not mat.use_nodes:
        mat.use_nodes = True
    for node in mat.node_tree.nodes:
        if node.type == "BSDF_PRINCIPLED":
            return node
    bsdf = mat.node_tree.nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    output_node = None
    for node in mat.node_tree.nodes:
        if node.type == "OUTPUT_MATERIAL":
            output_node = node
            break
    if output_node is None:
        output_node = mat.node_tree.nodes.new(type="ShaderNodeOutputMaterial")
        output_node.location = (300, 0)
    mat.node_tree.links.new(bsdf.outputs["BSDF"], output_node.inputs["Surface"])
    return bsdf


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

def create_principled(
    name: str,
    color: Optional[List[float]] = None,
    metallic: float = 0.0,
    roughness: float = 0.5,
    specular: float = 0.5,
    ior: float = 1.45,
    transmission: float = 0.0,
    emission_color: Optional[List[float]] = None,
    emission_strength: float = 0.0,
    alpha: float = 1.0,
    normal_strength: float = 1.0,
    assign_to: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a Principled BSDF material with full control over all settings.

    Parameters
    ----------
    name : str
        Material name.
    color : list[float], optional
        RGBA base color. Defaults to (0.8, 0.8, 0.8, 1.0).
    metallic : float
        Metallic value (0-1).
    roughness : float
        Roughness value (0-1).
    specular : float
        Specular value (0-1).
    ior : float
        Index of refraction.
    transmission : float
        Transmission (glass) value (0-1).
    emission_color : list[float], optional
        Emission color RGBA. Defaults to black (no emission).
    emission_strength : float
        Emission strength.
    alpha : float
        Alpha value (0-1).
    normal_strength : float
        Normal map strength (for reference, not applied without texture).
    assign_to : str, optional
        Object name to assign the material to.
    """
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = _get_principled_bsdf(mat)

    base_color = tuple(color) if color else (0.8, 0.8, 0.8, 1.0)
    if len(base_color) == 3:
        base_color = (*base_color, 1.0)

    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Metallic"].default_value = max(0.0, min(1.0, metallic))
    bsdf.inputs["Roughness"].default_value = max(0.0, min(1.0, roughness))

    # Specular input name varies by version
    spec_name = "Specular IOR Level" if bsdf.inputs.get("Specular IOR Level") else "Specular"
    if bsdf.inputs.get(spec_name):
        bsdf.inputs[spec_name].default_value = max(0.0, min(1.0, specular))

    bsdf.inputs["IOR"].default_value = ior

    trans_name = "Transmission Weight" if bsdf.inputs.get("Transmission Weight") else "Transmission"
    if bsdf.inputs.get(trans_name):
        bsdf.inputs[trans_name].default_value = max(0.0, min(1.0, transmission))

    if emission_color:
        ec = tuple(emission_color)
        if len(ec) == 3:
            ec = (*ec, 1.0)
        emit_name = "Emission Color" if bsdf.inputs.get("Emission Color") else "Emission"
        if bsdf.inputs.get(emit_name):
            bsdf.inputs[emit_name].default_value = ec

    emit_str_name = "Emission Strength"
    if bsdf.inputs.get(emit_str_name):
        bsdf.inputs[emit_str_name].default_value = emission_strength

    bsdf.inputs["Alpha"].default_value = max(0.0, min(1.0, alpha))

    if alpha < 1.0:
        if hasattr(mat, "blend_method"):
            mat.blend_method = "HASHED"

    result: Dict[str, Any] = {
        "material_name": mat.name,
        "color": list(base_color),
        "metallic": metallic,
        "roughness": roughness,
        "specular": specular,
        "ior": ior,
        "transmission": transmission,
        "alpha": alpha,
    }

    if assign_to:
        obj = _get_object(assign_to)
        for slot in obj.material_slots:
            if slot.material == mat:
                break
        else:
            obj.data.materials.append(mat)
        result["assigned_to"] = obj.name

    return result


def list_materials(
    **kwargs: Any,
) -> Dict[str, Any]:
    """List all materials in the current scene/file.
    """
    materials = []
    for mat in bpy.data.materials:
        info: Dict[str, Any] = {
            "name": mat.name,
            "use_nodes": mat.use_nodes,
            "users": mat.users,
        }
        if mat.use_nodes:
            for node in mat.node_tree.nodes:
                if node.type == "BSDF_PRINCIPLED":
                    info["has_principled_bsdf"] = True
                    break
            else:
                info["has_principled_bsdf"] = False
        materials.append(info)
    return {
        "material_count": len(materials),
        "materials": materials,
    }


def copy_material(
    source_object: str,
    target_object: str,
    slot_index: int = 0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Copy a material from one object to another.

    Parameters
    ----------
    source_object : str
        Name of the source object.
    target_object : str
        Name of the target object.
    slot_index : int
        Material slot index on the source to copy from.
    """
    source = _get_object(source_object)
    target = _get_object(target_object)

    if not source.material_slots:
        raise ValueError(f"Source object '{source_object}' has no materials")
    if slot_index >= len(source.material_slots):
        raise ValueError(
            f"Slot index {slot_index} out of range (object has {len(source.material_slots)} slots)"
        )

    mat = source.material_slots[slot_index].material
    if mat is None:
        raise ValueError(f"Material slot {slot_index} on '{source_object}' is empty")

    # Add to target if not already present
    for slot in target.material_slots:
        if slot.material == mat:
            break
    else:
        target.data.materials.append(mat)

    return {
        "source_object": source.name,
        "target_object": target.name,
        "material_name": mat.name,
    }


def assign_to_faces(
    name: str,
    material_name: str,
    face_indices: Optional[List[int]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Assign a material to specific faces of a mesh.

    Parameters
    ----------
    name : str
        Object name.
    material_name : str
        Name of the material to assign.
    face_indices : list[int], optional
        Indices of faces to assign the material to. If None, assigns to all faces.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    mat = _get_material(material_name)

    # Ensure material is in a slot
    mat_index = None
    for i, slot in enumerate(obj.material_slots):
        if slot.material == mat:
            mat_index = i
            break

    if mat_index is None:
        obj.data.materials.append(mat)
        mat_index = len(obj.material_slots) - 1

    mesh = obj.data
    indices = face_indices if face_indices is not None else list(range(len(mesh.polygons)))

    for fi in indices:
        if fi < len(mesh.polygons):
            mesh.polygons[fi].material_index = mat_index

    return {
        "object_name": obj.name,
        "material_name": mat.name,
        "material_slot": mat_index,
        "faces_assigned": len(indices),
    }


def combine_materials(
    name: str,
    material_names: Optional[List[str]] = None,
    combined_name: str = "Combined",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Merge multiple material slots into one on an object.

    Reassigns all faces to the first material (or a specified combined material)
    and removes the extra material slots.

    Parameters
    ----------
    name : str
        Object name.
    material_names : list[str], optional
        Names of materials to combine. If None, combines all materials on the object.
    combined_name : str
        Name for the combined material. Uses first material if not creating new.
    """
    _ensure_object_mode()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")

    if not obj.material_slots:
        return {"object_name": obj.name, "error": "No materials to combine"}

    # Find target material index (keep the first one)
    target_mat = obj.material_slots[0].material
    if target_mat is None:
        return {"object_name": obj.name, "error": "First material slot is empty"}

    # Set all faces to slot 0
    for poly in obj.data.polygons:
        if material_names is None:
            poly.material_index = 0
        else:
            current_mat = obj.material_slots[poly.material_index].material
            if current_mat and current_mat.name in material_names:
                poly.material_index = 0

    # Remove extra slots
    _select_only(obj)
    removed = 0
    while len(obj.material_slots) > 1:
        obj.active_material_index = len(obj.material_slots) - 1
        bpy.ops.object.material_slot_remove()
        removed += 1

    return {
        "object_name": obj.name,
        "combined_material": target_mat.name,
        "slots_removed": removed,
        "remaining_slots": len(obj.material_slots),
    }


def create_color_variant(
    source_material: str,
    new_name: str,
    color: List[float],
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a color variant of an existing material.

    Duplicates the material and changes its base color.

    Parameters
    ----------
    source_material : str
        Name of the source material to copy.
    new_name : str
        Name for the new variant material.
    color : list[float]
        New RGBA base color.
    """
    source_mat = _get_material(source_material)
    new_mat = source_mat.copy()
    new_mat.name = new_name

    bsdf = _get_principled_bsdf(new_mat)
    rgba = tuple(color) if len(color) >= 4 else (*tuple(color), 1.0)
    bsdf.inputs["Base Color"].default_value = rgba

    return {
        "source_material": source_mat.name,
        "new_material": new_mat.name,
        "color": list(rgba),
    }


def add_texture_node(
    material_name: str,
    image_path: str,
    input_name: str = "Base Color",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a texture image node to a material and connect it to a Principled BSDF input.

    Parameters
    ----------
    material_name : str
        Name of the material.
    image_path : str
        Path to the image file.
    input_name : str
        Principled BSDF input to connect to (e.g. 'Base Color', 'Roughness',
        'Normal', 'Metallic').
    """
    mat = _get_material(material_name)
    if not mat.use_nodes:
        mat.use_nodes = True

    bsdf = _get_principled_bsdf(mat)
    tree = mat.node_tree

    # Load or find image
    img = bpy.data.images.load(image_path, check_existing=True)

    tex_node = tree.nodes.new(type="ShaderNodeTexImage")
    tex_node.image = img
    tex_node.location = (bsdf.location[0] - 400, bsdf.location[1])

    target_input = bsdf.inputs.get(input_name)
    if target_input is None:
        raise ValueError(
            f"Principled BSDF has no input '{input_name}'. "
            f"Available: {[i.name for i in bsdf.inputs]}"
        )

    if input_name == "Normal":
        normal_map = tree.nodes.new(type="ShaderNodeNormalMap")
        normal_map.location = (bsdf.location[0] - 200, bsdf.location[1] - 200)
        tree.links.new(tex_node.outputs["Color"], normal_map.inputs["Color"])
        tree.links.new(normal_map.outputs["Normal"], target_input)
        tex_node.image.colorspace_settings.name = "Non-Color"
    elif input_name in ("Roughness", "Metallic", "Alpha"):
        tree.links.new(tex_node.outputs["Color"], target_input)
        tex_node.image.colorspace_settings.name = "Non-Color"
    else:
        tree.links.new(tex_node.outputs["Color"], target_input)

    return {
        "material_name": mat.name,
        "image": img.name,
        "input_name": input_name,
        "node_name": tex_node.name,
    }


def swap_texture(
    material_name: str,
    node_name: str,
    new_image_path: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Swap the texture image in a material's Image Texture node.

    Parameters
    ----------
    material_name : str
        Name of the material.
    node_name : str
        Name of the Image Texture node.
    new_image_path : str
        Path to the new image file.
    """
    mat = _get_material(material_name)
    if not mat.use_nodes:
        raise ValueError(f"Material '{material_name}' does not use nodes")

    node = mat.node_tree.nodes.get(node_name)
    if node is None:
        available = [n.name for n in mat.node_tree.nodes]
        raise ValueError(
            f"Node '{node_name}' not found. Available: {available}"
        )
    if node.type != "TEX_IMAGE":
        raise ValueError(f"Node '{node_name}' is not an Image Texture node (type: {node.type})")

    old_image = node.image.name if node.image else None
    img = bpy.data.images.load(new_image_path, check_existing=True)
    node.image = img

    return {
        "material_name": mat.name,
        "node_name": node_name,
        "old_image": old_image,
        "new_image": img.name,
    }


def extract_textures(
    material_name: str,
    output_dir: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Extract all texture images from a material to files.

    Parameters
    ----------
    material_name : str
        Name of the material.
    output_dir : str
        Directory to save extracted images.
    """
    mat = _get_material(material_name)
    if not mat.use_nodes:
        raise ValueError(f"Material '{material_name}' does not use nodes")

    os.makedirs(output_dir, exist_ok=True)
    extracted = []

    for node in mat.node_tree.nodes:
        if node.type == "TEX_IMAGE" and node.image:
            img = node.image
            filename = f"{img.name}.png"
            filepath = os.path.join(output_dir, filename)

            # Save image
            old_path = img.filepath_raw
            img.filepath_raw = filepath
            img.file_format = "PNG"
            img.save()
            img.filepath_raw = old_path

            extracted.append({
                "node_name": node.name,
                "image_name": img.name,
                "filepath": filepath,
            })

    return {
        "material_name": mat.name,
        "output_dir": output_dir,
        "extracted_count": len(extracted),
        "textures": extracted,
    }


def resize_textures(
    material_name: str,
    width: int = 1024,
    height: int = 1024,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Resize all texture images used in a material.

    Parameters
    ----------
    material_name : str
        Name of the material.
    width : int
        Target width in pixels.
    height : int
        Target height in pixels.
    """
    mat = _get_material(material_name)
    if not mat.use_nodes:
        raise ValueError(f"Material '{material_name}' does not use nodes")

    resized = []
    for node in mat.node_tree.nodes:
        if node.type == "TEX_IMAGE" and node.image:
            img = node.image
            old_size = [img.size[0], img.size[1]]
            img.scale(width, height)
            resized.append({
                "node_name": node.name,
                "image_name": img.name,
                "old_size": old_size,
                "new_size": [width, height],
            })

    return {
        "material_name": mat.name,
        "resized_count": len(resized),
        "textures": resized,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "create_principled": create_principled,
    "list_materials": list_materials,
    "copy_material": copy_material,
    "assign_to_faces": assign_to_faces,
    "combine_materials": combine_materials,
    "create_color_variant": create_color_variant,
    "add_image_texture": add_texture_node,
    "swap_texture": swap_texture,
    "extract_textures": extract_textures,
    "resize_textures": resize_textures,
}
