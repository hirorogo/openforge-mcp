"""
Texture tools for OpenForge MCP.

Tools for creating, painting, baking, and assigning textures.
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


def _get_material(name: str) -> bpy.types.Material:
    mat = bpy.data.materials.get(name)
    if mat is None:
        available = [m.name for m in bpy.data.materials]
        raise ValueError(
            f"Material '{name}' not found. Available materials: {available}"
        )
    return mat


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

def create_image_texture(
    name: str = "Texture",
    width: int = 1024,
    height: int = 1024,
    color: Optional[List[float]] = None,
    alpha: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a new blank image texture in Blender's data.

    Parameters
    ----------
    name : str
        Name for the image.
    width : int
        Image width in pixels.
    height : int
        Image height in pixels.
    color : list[float], optional
        RGBA fill color (0-1 each). Defaults to black with full alpha.
    alpha : bool
        Whether the image has an alpha channel.
    """
    fill_color = tuple(color) if color else (0.0, 0.0, 0.0, 1.0)
    if len(fill_color) == 3:
        fill_color = fill_color + (1.0,)

    img = bpy.data.images.new(
        name=name,
        width=max(1, width),
        height=max(1, height),
        alpha=alpha,
    )
    img.generated_color = fill_color

    return {
        "image_name": img.name,
        "width": img.size[0],
        "height": img.size[1],
        "has_alpha": alpha,
    }


def paint_texture(
    object_name: str,
    image_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Enter texture paint mode for an object.

    Parameters
    ----------
    object_name : str
        Mesh object name.
    image_name : str, optional
        Name of the image to paint on. If provided, sets it as active.
    """
    _ensure_object_mode()
    obj = _get_object(object_name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{object_name}' is not a mesh")

    _select_only(obj)

    if image_name:
        img = bpy.data.images.get(image_name)
        if img is None:
            raise ValueError(f"Image '{image_name}' not found")

    bpy.ops.object.mode_set(mode="TEXTURE_PAINT")

    return {
        "object_name": obj.name,
        "mode": "TEXTURE_PAINT",
        "image_name": image_name,
    }


def bake_texture(
    object_name: str,
    bake_type: str = "DIFFUSE",
    image_name: Optional[str] = None,
    width: int = 1024,
    height: int = 1024,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bake textures for a mesh object.

    Parameters
    ----------
    object_name : str
        Mesh object name.
    bake_type : str
        DIFFUSE, GLOSSY, TRANSMISSION, COMBINED, AO, SHADOW, NORMAL,
        UV, ROUGHNESS, EMIT, ENVIRONMENT, or POSITION.
    image_name : str, optional
        Name of the target image. Creates one if not provided.
    width : int
        Bake image width.
    height : int
        Bake image height.
    """
    _ensure_object_mode()
    obj = _get_object(object_name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{object_name}' is not a mesh")

    _select_only(obj)

    # Ensure render engine is Cycles (required for baking)
    scene = bpy.context.scene
    prev_engine = scene.render.engine
    scene.render.engine = "CYCLES"

    # Get or create target image
    if image_name:
        img = bpy.data.images.get(image_name)
        if img is None:
            img = bpy.data.images.new(name=image_name, width=width, height=height)
    else:
        img = bpy.data.images.new(
            name=f"{obj.name}_Bake",
            width=width,
            height=height,
        )

    # Ensure the image node is selected in each material
    for slot in obj.material_slots:
        mat = slot.material
        if mat is None or not mat.use_nodes:
            continue
        tree = mat.node_tree
        img_node = tree.nodes.new(type="ShaderNodeTexImage")
        img_node.image = img
        tree.nodes.active = img_node

    bpy.ops.object.bake(type=bake_type.upper())

    # Restore engine
    scene.render.engine = prev_engine

    return {
        "object_name": obj.name,
        "bake_type": bake_type.upper(),
        "image_name": img.name,
        "width": img.size[0],
        "height": img.size[1],
    }


def assign_texture(
    material_name: str,
    image_name: str,
    input_name: str = "Base Color",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Assign an image texture to a material input via a texture node.

    Parameters
    ----------
    material_name : str
        Name of the material.
    image_name : str
        Name of the image in Blender's data.
    input_name : str
        Name of the Principled BSDF input to connect to.
    """
    mat = _get_material(material_name)
    img = bpy.data.images.get(image_name)
    if img is None:
        raise ValueError(f"Image '{image_name}' not found")

    if not mat.use_nodes:
        mat.use_nodes = True

    tree = mat.node_tree

    # Find the Principled BSDF
    bsdf = None
    for node in tree.nodes:
        if node.type == "BSDF_PRINCIPLED":
            bsdf = node
            break

    if bsdf is None:
        raise ValueError(f"No Principled BSDF found in material '{material_name}'")

    target_input = bsdf.inputs.get(input_name)
    if target_input is None:
        raise ValueError(
            f"Input '{input_name}' not found on Principled BSDF. "
            f"Available: {[i.name for i in bsdf.inputs]}"
        )

    # Create image texture node
    tex_node = tree.nodes.new(type="ShaderNodeTexImage")
    tex_node.image = img
    tex_node.location = (bsdf.location.x - 300, bsdf.location.y)

    tree.links.new(tex_node.outputs["Color"], target_input)

    return {
        "material_name": mat.name,
        "image_name": img.name,
        "input_name": input_name,
    }


def create_procedural_texture(
    material_name: str,
    texture_type: str = "NOISE",
    scale: float = 5.0,
    input_name: str = "Base Color",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a procedural texture node and connect it to a material.

    Parameters
    ----------
    material_name : str
        Name of the material.
    texture_type : str
        NOISE, VORONOI, MUSGRAVE, WAVE, CHECKER, BRICK, GRADIENT, MAGIC.
    scale : float
        Texture scale parameter.
    input_name : str
        Principled BSDF input to connect to.
    """
    mat = _get_material(material_name)
    if not mat.use_nodes:
        mat.use_nodes = True
    tree = mat.node_tree

    type_map = {
        "NOISE": "ShaderNodeTexNoise",
        "VORONOI": "ShaderNodeTexVoronoi",
        "MUSGRAVE": "ShaderNodeTexMusgrave",
        "WAVE": "ShaderNodeTexWave",
        "CHECKER": "ShaderNodeTexChecker",
        "BRICK": "ShaderNodeTexBrick",
        "GRADIENT": "ShaderNodeTexGradient",
        "MAGIC": "ShaderNodeTexMagic",
    }

    node_type = type_map.get(texture_type.upper())
    if node_type is None:
        raise ValueError(
            f"Unknown texture type '{texture_type}'. "
            f"Supported: {list(type_map.keys())}"
        )

    tex_node = tree.nodes.new(type=node_type)
    tex_node.location = (-400, 0)

    # Set scale if the node has it
    scale_input = tex_node.inputs.get("Scale")
    if scale_input is not None:
        scale_input.default_value = scale

    # Find Principled BSDF and connect
    bsdf = None
    for node in tree.nodes:
        if node.type == "BSDF_PRINCIPLED":
            bsdf = node
            break

    if bsdf:
        target_input = bsdf.inputs.get(input_name)
        if target_input:
            # Use Fac output if available, else Color
            output = tex_node.outputs.get("Fac") or tex_node.outputs.get("Color") or tex_node.outputs[0]
            tree.links.new(output, target_input)

    return {
        "material_name": mat.name,
        "texture_type": texture_type.upper(),
        "scale": scale,
        "node_name": tex_node.name,
    }


def set_texture_scale(
    material_name: str,
    node_name: str,
    scale: float = 5.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the scale of a texture node.

    Parameters
    ----------
    material_name : str
        Name of the material.
    node_name : str
        Name of the texture node.
    scale : float
        New scale value.
    """
    mat = _get_material(material_name)
    if not mat.use_nodes:
        raise ValueError(f"Material '{material_name}' does not use nodes")

    node = mat.node_tree.nodes.get(node_name)
    if node is None:
        raise ValueError(f"Node '{node_name}' not found in material '{material_name}'")

    scale_input = node.inputs.get("Scale")
    if scale_input is None:
        raise ValueError(f"Node '{node_name}' has no Scale input")

    scale_input.default_value = scale
    return {
        "material_name": mat.name,
        "node_name": node.name,
        "scale": scale,
    }


def set_texture_mapping(
    material_name: str,
    mapping_type: str = "UV",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a texture coordinate and mapping node chain to a material.

    Parameters
    ----------
    material_name : str
        Name of the material.
    mapping_type : str
        UV, Object, Generated, Normal, Window, Reflection, or Camera.
    """
    mat = _get_material(material_name)
    if not mat.use_nodes:
        mat.use_nodes = True
    tree = mat.node_tree

    tex_coord = tree.nodes.new(type="ShaderNodeTexCoord")
    tex_coord.location = (-800, 0)

    mapping = tree.nodes.new(type="ShaderNodeMapping")
    mapping.location = (-600, 0)

    # Connect the appropriate output
    output_name = mapping_type.capitalize()
    if output_name == "Uv":
        output_name = "UV"
    tex_output = tex_coord.outputs.get(output_name)
    if tex_output is None:
        tex_output = tex_coord.outputs.get("Generated")

    tree.links.new(tex_output, mapping.inputs["Vector"])

    # Connect mapping to first texture node found
    for node in tree.nodes:
        if node.type.startswith("TEX_") and node != tex_coord:
            vector_input = node.inputs.get("Vector")
            if vector_input:
                tree.links.new(mapping.outputs["Vector"], vector_input)
                break

    return {
        "material_name": mat.name,
        "mapping_type": mapping_type,
        "tex_coord_node": tex_coord.name,
        "mapping_node": mapping.name,
    }


def create_normal_map(
    material_name: str,
    image_name: Optional[str] = None,
    strength: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a normal map node chain to a material.

    Parameters
    ----------
    material_name : str
        Name of the material.
    image_name : str, optional
        Name of an existing normal map image. If None, no image is assigned.
    strength : float
        Normal map strength.
    """
    mat = _get_material(material_name)
    if not mat.use_nodes:
        mat.use_nodes = True
    tree = mat.node_tree

    # Create normal map node
    normal_map = tree.nodes.new(type="ShaderNodeNormalMap")
    normal_map.location = (-200, -300)
    normal_map.inputs["Strength"].default_value = strength

    # Create image texture node if image provided
    if image_name:
        img = bpy.data.images.get(image_name)
        if img is None:
            raise ValueError(f"Image '{image_name}' not found")
        tex_node = tree.nodes.new(type="ShaderNodeTexImage")
        tex_node.image = img
        tex_node.location = (-500, -300)
        img.colorspace_settings.name = "Non-Color"
        tree.links.new(tex_node.outputs["Color"], normal_map.inputs["Color"])

    # Connect to Principled BSDF Normal input
    bsdf = None
    for node in tree.nodes:
        if node.type == "BSDF_PRINCIPLED":
            bsdf = node
            break

    if bsdf:
        tree.links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])

    return {
        "material_name": mat.name,
        "normal_map_node": normal_map.name,
        "strength": strength,
        "image_name": image_name,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "create_image_texture": create_image_texture,
    "paint_texture": paint_texture,
    "bake_texture": bake_texture,
    "assign_texture": assign_texture,
    "create_procedural_texture": create_procedural_texture,
    "set_texture_scale": set_texture_scale,
    "set_texture_mapping": set_texture_mapping,
    "create_normal_map": create_normal_map,
}
