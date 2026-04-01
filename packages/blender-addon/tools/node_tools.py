"""
Node tools for OpenForge MCP.

Tools for working with shader nodes, geometry nodes, and compositor nodes.
"""

from typing import Any, Dict, List, Optional, Union

import bpy


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_material(name: str) -> bpy.types.Material:
    mat = bpy.data.materials.get(name)
    if mat is None:
        available = [m.name for m in bpy.data.materials]
        raise ValueError(
            f"Material '{name}' not found. Available: {available}"
        )
    return mat


def _ensure_node_tree(mat: bpy.types.Material) -> bpy.types.NodeTree:
    if not mat.use_nodes:
        mat.use_nodes = True
    return mat.node_tree


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def add_shader_node(
    material_name: str,
    node_type: str,
    location_x: float = 0.0,
    location_y: float = 0.0,
    label: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a shader node to a material's node tree.

    Parameters
    ----------
    material_name : str
        Name of the material.
    node_type : str
        Full Blender node type identifier (e.g. ShaderNodeMixRGB,
        ShaderNodeBsdfPrincipled, ShaderNodeTexImage).
    location_x : float
        X position in the node editor.
    location_y : float
        Y position in the node editor.
    label : str, optional
        Display label for the node.
    """
    mat = _get_material(material_name)
    tree = _ensure_node_tree(mat)
    node = tree.nodes.new(type=node_type)
    node.location = (location_x, location_y)
    if label:
        node.label = label
    return {
        "material_name": mat.name,
        "node_name": node.name,
        "node_type": node_type,
        "location": list(node.location),
    }


def connect_nodes(
    material_name: str,
    from_node: str,
    from_output: Union[str, int],
    to_node: str,
    to_input: Union[str, int],
    **kwargs: Any,
) -> Dict[str, Any]:
    """Connect two nodes in a material's node tree.

    Parameters
    ----------
    material_name : str
        Name of the material.
    from_node : str
        Name of the source node.
    from_output : str or int
        Name or index of the output socket.
    to_node : str
        Name of the destination node.
    to_input : str or int
        Name or index of the input socket.
    """
    mat = _get_material(material_name)
    tree = _ensure_node_tree(mat)

    src = tree.nodes.get(from_node)
    if src is None:
        raise ValueError(f"Node '{from_node}' not found in material '{material_name}'")
    dst = tree.nodes.get(to_node)
    if dst is None:
        raise ValueError(f"Node '{to_node}' not found in material '{material_name}'")

    if isinstance(from_output, int):
        out_socket = src.outputs[from_output]
    else:
        out_socket = src.outputs.get(from_output)
        if out_socket is None:
            raise ValueError(
                f"Output '{from_output}' not found on node '{from_node}'. "
                f"Available: {[o.name for o in src.outputs]}"
            )

    if isinstance(to_input, int):
        in_socket = dst.inputs[to_input]
    else:
        in_socket = dst.inputs.get(to_input)
        if in_socket is None:
            raise ValueError(
                f"Input '{to_input}' not found on node '{to_node}'. "
                f"Available: {[i.name for i in dst.inputs]}"
            )

    tree.links.new(out_socket, in_socket)
    return {
        "material_name": mat.name,
        "from": f"{from_node}.{from_output}",
        "to": f"{to_node}.{to_input}",
    }


def create_node_group(
    group_name: str,
    material_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a new shader node group.

    Parameters
    ----------
    group_name : str
        Name for the node group.
    material_name : str, optional
        If provided, add a Group node referencing this group to the material.
    """
    group = bpy.data.node_groups.new(name=group_name, type="ShaderNodeTree")

    # Add group input and output nodes
    group_input = group.nodes.new(type="NodeGroupInput")
    group_input.location = (-200, 0)
    group_output = group.nodes.new(type="NodeGroupOutput")
    group_output.location = (200, 0)

    result: Dict[str, Any] = {
        "group_name": group.name,
    }

    if material_name:
        mat = _get_material(material_name)
        tree = _ensure_node_tree(mat)
        group_node = tree.nodes.new(type="ShaderNodeGroup")
        group_node.node_tree = group
        result["material_name"] = mat.name
        result["group_node_name"] = group_node.name

    return result


def add_geometry_node(
    object_name: str,
    modifier_name: str = "GeometryNodes",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Geometry Nodes modifier to an object.

    Parameters
    ----------
    object_name : str
        Name of the object.
    modifier_name : str
        Name for the modifier.
    """
    obj = bpy.data.objects.get(object_name)
    if obj is None:
        raise ValueError(f"Object '{object_name}' not found")

    mod = obj.modifiers.new(name=modifier_name, type="NODES")
    if mod.node_group is None:
        # Blender creates a default node group, but if it does not, create one
        group = bpy.data.node_groups.new(name=modifier_name, type="GeometryNodeTree")
        group_input = group.nodes.new(type="NodeGroupInput")
        group_input.location = (-200, 0)
        group_output = group.nodes.new(type="NodeGroupOutput")
        group_output.location = (200, 0)
        mod.node_group = group

    return {
        "object_name": obj.name,
        "modifier_name": mod.name,
        "node_group": mod.node_group.name if mod.node_group else None,
    }


def set_node_value(
    material_name: str,
    node_name: str,
    input_name: str,
    value: Any,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set an input value on a node.

    Parameters
    ----------
    material_name : str
        Name of the material.
    node_name : str
        Name of the node.
    input_name : str
        Name of the input socket.
    value : any
        Value to set (number, color tuple, etc.).
    """
    mat = _get_material(material_name)
    tree = _ensure_node_tree(mat)

    node = tree.nodes.get(node_name)
    if node is None:
        raise ValueError(f"Node '{node_name}' not found")

    inp = node.inputs.get(input_name)
    if inp is None:
        raise ValueError(
            f"Input '{input_name}' not found on node '{node_name}'. "
            f"Available: {[i.name for i in node.inputs]}"
        )

    inp.default_value = value
    return {
        "material_name": mat.name,
        "node_name": node.name,
        "input_name": input_name,
        "value": str(value),
    }


def add_math_node(
    material_name: str,
    operation: str = "ADD",
    value1: float = 0.5,
    value2: float = 0.5,
    location_x: float = -200.0,
    location_y: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Math node to a material's node tree.

    Parameters
    ----------
    material_name : str
        Name of the material.
    operation : str
        ADD, SUBTRACT, MULTIPLY, DIVIDE, POWER, LOGARITHM, SQRT,
        ABSOLUTE, MINIMUM, MAXIMUM, LESS_THAN, GREATER_THAN, ROUND,
        FLOOR, CEIL, FRACT, MODULO, SINE, COSINE, TANGENT, etc.
    value1 : float
        First input value.
    value2 : float
        Second input value.
    location_x : float
        X position in node editor.
    location_y : float
        Y position in node editor.
    """
    mat = _get_material(material_name)
    tree = _ensure_node_tree(mat)

    node = tree.nodes.new(type="ShaderNodeMath")
    node.operation = operation.upper()
    node.location = (location_x, location_y)
    node.inputs[0].default_value = value1
    node.inputs[1].default_value = value2

    return {
        "material_name": mat.name,
        "node_name": node.name,
        "operation": operation.upper(),
    }


def add_mix_node(
    material_name: str,
    data_type: str = "RGBA",
    blend_type: str = "MIX",
    factor: float = 0.5,
    location_x: float = -200.0,
    location_y: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Mix node to a material's node tree.

    Parameters
    ----------
    material_name : str
        Name of the material.
    data_type : str
        FLOAT, VECTOR, or RGBA.
    blend_type : str
        MIX, ADD, MULTIPLY, SCREEN, OVERLAY, DARKEN, LIGHTEN, etc.
    factor : float
        Mix factor (0.0-1.0).
    location_x : float
        X position.
    location_y : float
        Y position.
    """
    mat = _get_material(material_name)
    tree = _ensure_node_tree(mat)

    # Blender 3.x uses ShaderNodeMixRGB, 4.x uses ShaderNodeMix
    try:
        node = tree.nodes.new(type="ShaderNodeMix")
        node.data_type = data_type.upper()
    except (RuntimeError, AttributeError):
        node = tree.nodes.new(type="ShaderNodeMixRGB")

    node.blend_type = blend_type.upper()
    node.location = (location_x, location_y)
    node.inputs[0].default_value = factor

    return {
        "material_name": mat.name,
        "node_name": node.name,
        "blend_type": blend_type.upper(),
    }


def add_texture_node(
    material_name: str,
    texture_type: str = "ShaderNodeTexNoise",
    location_x: float = -400.0,
    location_y: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a texture node to a material's node tree.

    Parameters
    ----------
    material_name : str
        Name of the material.
    texture_type : str
        Full node type identifier (e.g. ShaderNodeTexNoise,
        ShaderNodeTexVoronoi, ShaderNodeTexImage).
    location_x : float
        X position.
    location_y : float
        Y position.
    """
    mat = _get_material(material_name)
    tree = _ensure_node_tree(mat)
    node = tree.nodes.new(type=texture_type)
    node.location = (location_x, location_y)
    return {
        "material_name": mat.name,
        "node_name": node.name,
        "node_type": texture_type,
        "location": list(node.location),
    }


def create_compositor_setup(
    setup_type: str = "basic",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a compositor node setup.

    Parameters
    ----------
    setup_type : str
        basic (render layers + composite), bloom (adds glare),
        color_correct (adds brightness/contrast + hue/saturation).
    """
    scene = bpy.context.scene
    scene.use_nodes = True
    tree = scene.node_tree
    tree.nodes.clear()

    # Render Layers node
    rl = tree.nodes.new(type="CompositorNodeRLayers")
    rl.location = (-400, 0)

    # Composite output
    comp = tree.nodes.new(type="CompositorNodeComposite")
    comp.location = (400, 0)

    # Viewer node
    viewer = tree.nodes.new(type="CompositorNodeViewer")
    viewer.location = (400, -200)

    nodes_created = [rl.name, comp.name, viewer.name]

    if setup_type == "basic":
        tree.links.new(rl.outputs["Image"], comp.inputs["Image"])
        tree.links.new(rl.outputs["Image"], viewer.inputs["Image"])

    elif setup_type == "bloom":
        glare = tree.nodes.new(type="CompositorNodeGlare")
        glare.glare_type = "BLOOM"
        glare.threshold = 0.8
        glare.location = (0, 0)
        nodes_created.append(glare.name)
        tree.links.new(rl.outputs["Image"], glare.inputs["Image"])
        tree.links.new(glare.outputs["Image"], comp.inputs["Image"])
        tree.links.new(glare.outputs["Image"], viewer.inputs["Image"])

    elif setup_type == "color_correct":
        bc = tree.nodes.new(type="CompositorNodeBrightContrast")
        bc.location = (-100, 0)
        nodes_created.append(bc.name)

        hs = tree.nodes.new(type="CompositorNodeHueSat")
        hs.location = (150, 0)
        nodes_created.append(hs.name)

        tree.links.new(rl.outputs["Image"], bc.inputs["Image"])
        tree.links.new(bc.outputs["Image"], hs.inputs["Image"])
        tree.links.new(hs.outputs["Image"], comp.inputs["Image"])
        tree.links.new(hs.outputs["Image"], viewer.inputs["Image"])

    return {
        "setup_type": setup_type,
        "nodes_created": nodes_created,
    }


def add_color_ramp(
    material_name: str,
    location_x: float = -300.0,
    location_y: float = 0.0,
    color_stops: Optional[List[Dict[str, Any]]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a Color Ramp node to a material's node tree.

    Parameters
    ----------
    material_name : str
        Name of the material.
    location_x : float
        X position.
    location_y : float
        Y position.
    color_stops : list[dict], optional
        List of color stop definitions. Each dict has 'position' (float 0-1)
        and 'color' (RGBA list). Defaults to black-to-white.
    """
    mat = _get_material(material_name)
    tree = _ensure_node_tree(mat)

    node = tree.nodes.new(type="ShaderNodeValToRGB")
    node.location = (location_x, location_y)

    if color_stops:
        ramp = node.color_ramp
        # Remove default stops beyond the first
        while len(ramp.elements) > 1:
            ramp.elements.remove(ramp.elements[-1])

        for i, stop in enumerate(color_stops):
            pos = stop.get("position", i / max(1, len(color_stops) - 1))
            color = stop.get("color", [1.0, 1.0, 1.0, 1.0])
            if len(color) == 3:
                color = list(color) + [1.0]
            if i == 0:
                ramp.elements[0].position = pos
                ramp.elements[0].color = color
            else:
                elem = ramp.elements.new(pos)
                elem.color = color

    return {
        "material_name": mat.name,
        "node_name": node.name,
        "stop_count": len(node.color_ramp.elements),
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "add_shader_node": add_shader_node,
    "connect_nodes": connect_nodes,
    "create_node_group": create_node_group,
    "add_geometry_node": add_geometry_node,
    "set_node_value": set_node_value,
    "add_math_node": add_math_node,
    "add_mix_node": add_mix_node,
    "add_texture_node": add_texture_node,
    "create_compositor_setup": create_compositor_setup,
    "add_color_ramp": add_color_ramp,
}
