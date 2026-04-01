"""
Material tools for OpenForge MCP.

All materials are built around the Principled BSDF node which is the standard
physically-based shader in Blender.
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


def _get_or_create_material(name: str) -> bpy.types.Material:
    """Return an existing material by name, or create a new one with nodes."""
    mat = bpy.data.materials.get(name)
    if mat is not None:
        return mat
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    return mat


def _get_principled_bsdf(mat: bpy.types.Material) -> bpy.types.ShaderNode:
    """Return the Principled BSDF node from *mat*, creating one if needed."""
    if not mat.use_nodes:
        mat.use_nodes = True

    tree = mat.node_tree
    for node in tree.nodes:
        if node.type == "BSDF_PRINCIPLED":
            return node

    # No Principled BSDF found -- create one and connect to output.
    bsdf = tree.nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)

    output_node = None
    for node in tree.nodes:
        if node.type == "OUTPUT_MATERIAL":
            output_node = node
            break

    if output_node is None:
        output_node = tree.nodes.new(type="ShaderNodeOutputMaterial")
        output_node.location = (300, 0)

    tree.links.new(bsdf.outputs["BSDF"], output_node.inputs["Surface"])
    return bsdf


def _assign_material(obj: bpy.types.Object, mat: bpy.types.Material) -> None:
    """Ensure *mat* is assigned to *obj* (appended to material slots)."""
    for slot in obj.material_slots:
        if slot.material == mat:
            return
    obj.data.materials.append(mat)


def _set_principled_input(
    bsdf: bpy.types.ShaderNode,
    input_name: str,
    value: Any,
) -> None:
    """Set an input on the Principled BSDF by name."""
    inp = bsdf.inputs.get(input_name)
    if inp is None:
        raise ValueError(
            f"Principled BSDF has no input named '{input_name}'. "
            f"Available: {[i.name for i in bsdf.inputs]}"
        )
    inp.default_value = value


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def create_material(
    name: str,
    color: Optional[List[float]] = None,
    metallic: float = 0.0,
    roughness: float = 0.5,
    assign_to: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a new Principled BSDF material.

    Parameters
    ----------
    name : str
        Material name.
    color : list[float], optional
        RGBA base color (0-1 each).  Defaults to (0.8, 0.8, 0.8, 1.0).
    metallic : float
        Metallic value 0-1.
    roughness : float
        Roughness value 0-1.
    assign_to : str, optional
        If provided, assign the material to this object.
    """
    mat = _get_or_create_material(name)
    bsdf = _get_principled_bsdf(mat)

    base_color = tuple(color) if color else (0.8, 0.8, 0.8, 1.0)
    if len(base_color) == 3:
        base_color = (*base_color, 1.0)

    _set_principled_input(bsdf, "Base Color", base_color)
    _set_principled_input(bsdf, "Metallic", metallic)
    _set_principled_input(bsdf, "Roughness", roughness)

    result: Dict[str, Any] = {
        "material_name": mat.name,
        "color": list(base_color),
        "metallic": metallic,
        "roughness": roughness,
    }

    if assign_to:
        obj = _get_object(assign_to)
        _assign_material(obj, mat)
        result["assigned_to"] = obj.name

    return result


def set_color(
    material_name: str,
    color: List[float],
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the Base Color on an existing material's Principled BSDF.

    Parameters
    ----------
    material_name : str
        Name of the material.
    color : list[float]
        RGBA color values (0-1 each).
    """
    mat = bpy.data.materials.get(material_name)
    if mat is None:
        raise ValueError(f"Material '{material_name}' not found")

    bsdf = _get_principled_bsdf(mat)
    rgba = tuple(color) if len(color) >= 4 else (*tuple(color), 1.0)
    _set_principled_input(bsdf, "Base Color", rgba)

    return {
        "material_name": mat.name,
        "color": list(rgba),
    }


def set_metallic(
    material_name: str,
    value: float,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the Metallic value on an existing material."""
    mat = bpy.data.materials.get(material_name)
    if mat is None:
        raise ValueError(f"Material '{material_name}' not found")

    bsdf = _get_principled_bsdf(mat)
    value = max(0.0, min(1.0, value))
    _set_principled_input(bsdf, "Metallic", value)

    return {"material_name": mat.name, "metallic": value}


def set_roughness(
    material_name: str,
    value: float,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the Roughness value on an existing material."""
    mat = bpy.data.materials.get(material_name)
    if mat is None:
        raise ValueError(f"Material '{material_name}' not found")

    bsdf = _get_principled_bsdf(mat)
    value = max(0.0, min(1.0, value))
    _set_principled_input(bsdf, "Roughness", value)

    return {"material_name": mat.name, "roughness": value}


def create_glass_material(
    name: str,
    color: Optional[List[float]] = None,
    ior: float = 1.45,
    roughness: float = 0.0,
    assign_to: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a glass material using Principled BSDF with Transmission = 1.

    Parameters
    ----------
    name : str
        Material name.
    color : list[float], optional
        RGBA base color.
    ior : float
        Index of refraction.
    roughness : float
        Surface roughness.
    assign_to : str, optional
        Object name to assign the material to.
    """
    mat = _get_or_create_material(name)
    bsdf = _get_principled_bsdf(mat)

    base_color = tuple(color) if color else (1.0, 1.0, 1.0, 1.0)
    if len(base_color) == 3:
        base_color = (*base_color, 1.0)

    _set_principled_input(bsdf, "Base Color", base_color)
    _set_principled_input(bsdf, "Roughness", roughness)
    _set_principled_input(bsdf, "IOR", ior)

    # Transmission input name varies by Blender version.
    transmission_name = "Transmission Weight"
    if bsdf.inputs.get(transmission_name) is None:
        transmission_name = "Transmission"
    _set_principled_input(bsdf, transmission_name, 1.0)

    mat.blend_method = "HASHED" if hasattr(mat, "blend_method") else mat.blend_method

    result: Dict[str, Any] = {
        "material_name": mat.name,
        "color": list(base_color),
        "ior": ior,
        "roughness": roughness,
        "type": "glass",
    }

    if assign_to:
        obj = _get_object(assign_to)
        _assign_material(obj, mat)
        result["assigned_to"] = obj.name

    return result


def create_emission_material(
    name: str,
    color: Optional[List[float]] = None,
    strength: float = 5.0,
    assign_to: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create an emission material using Principled BSDF.

    Parameters
    ----------
    name : str
        Material name.
    color : list[float], optional
        Emission color (RGB or RGBA).
    strength : float
        Emission strength.
    assign_to : str, optional
        Object name to assign the material to.
    """
    mat = _get_or_create_material(name)
    bsdf = _get_principled_bsdf(mat)

    emit_color = tuple(color) if color else (1.0, 1.0, 1.0, 1.0)
    if len(emit_color) == 3:
        emit_color = (*emit_color, 1.0)

    _set_principled_input(bsdf, "Base Color", (0.0, 0.0, 0.0, 1.0))

    # Emission input name varies by Blender version.
    emission_color_name = "Emission Color"
    if bsdf.inputs.get(emission_color_name) is None:
        emission_color_name = "Emission"
    _set_principled_input(bsdf, emission_color_name, emit_color)

    emission_strength_name = "Emission Strength"
    if bsdf.inputs.get(emission_strength_name) is not None:
        _set_principled_input(bsdf, emission_strength_name, strength)

    result: Dict[str, Any] = {
        "material_name": mat.name,
        "emission_color": list(emit_color),
        "emission_strength": strength,
        "type": "emission",
    }

    if assign_to:
        obj = _get_object(assign_to)
        _assign_material(obj, mat)
        result["assigned_to"] = obj.name

    return result


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "create_material": create_material,
    "set_color": set_color,
    "set_metallic": set_metallic,
    "set_roughness": set_roughness,
    "create_glass_material": create_glass_material,
    "create_emission_material": create_emission_material,
}
