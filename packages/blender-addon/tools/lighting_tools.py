"""
Lighting tools for OpenForge MCP.

Tools for creating and configuring lights, HDRI environments, and studio setups.
"""

from typing import Any, Dict, List, Optional

import bpy
import math


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ensure_object_mode() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def create_light(
    light_type: str = "POINT",
    name: str = "Light",
    location: Optional[List[float]] = None,
    energy: float = 1000.0,
    color: Optional[List[float]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a new light in the scene.

    Parameters
    ----------
    light_type : str
        POINT, SUN, SPOT, or AREA.
    name : str
        Name for the light object.
    location : list[float], optional
        World location. Defaults to origin.
    energy : float
        Light energy/power in watts.
    color : list[float], optional
        RGB color (0-1 each). Defaults to white.
    """
    _ensure_object_mode()
    loc = tuple(location) if location else (0.0, 0.0, 5.0)
    light_type = light_type.upper()

    light_data = bpy.data.lights.new(name=name, type=light_type)
    light_data.energy = energy
    if color:
        light_data.color = tuple(color[:3])

    light_obj = bpy.data.objects.new(name=name, object_data=light_data)
    bpy.context.collection.objects.link(light_obj)
    light_obj.location = loc

    return {
        "light_name": light_obj.name,
        "light_type": light_type,
        "energy": energy,
        "location": list(light_obj.location),
    }


def setup_studio_lighting(
    key_energy: float = 1000.0,
    fill_energy: float = 500.0,
    rim_energy: float = 750.0,
    distance: float = 5.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a studio lighting setup with key, fill, and rim lights.

    Parameters
    ----------
    key_energy : float
        Key light energy.
    fill_energy : float
        Fill light energy.
    rim_energy : float
        Rim/back light energy.
    distance : float
        Distance from the origin.
    """
    _ensure_object_mode()
    lights = []

    # Key light - front right, above
    key_data = bpy.data.lights.new(name="StudioKey", type="AREA")
    key_data.energy = key_energy
    key_data.size = 2.0
    key_obj = bpy.data.objects.new(name="StudioKey", object_data=key_data)
    bpy.context.collection.objects.link(key_obj)
    key_obj.location = (distance * 0.7, -distance * 0.7, distance * 0.8)
    key_obj.rotation_euler = (math.radians(60), 0, math.radians(45))
    lights.append(key_obj.name)

    # Fill light - front left, lower
    fill_data = bpy.data.lights.new(name="StudioFill", type="AREA")
    fill_data.energy = fill_energy
    fill_data.size = 3.0
    fill_obj = bpy.data.objects.new(name="StudioFill", object_data=fill_data)
    bpy.context.collection.objects.link(fill_obj)
    fill_obj.location = (-distance * 0.7, -distance * 0.5, distance * 0.4)
    fill_obj.rotation_euler = (math.radians(70), 0, math.radians(-30))
    lights.append(fill_obj.name)

    # Rim light - behind, above
    rim_data = bpy.data.lights.new(name="StudioRim", type="AREA")
    rim_data.energy = rim_energy
    rim_data.size = 1.5
    rim_obj = bpy.data.objects.new(name="StudioRim", object_data=rim_data)
    bpy.context.collection.objects.link(rim_obj)
    rim_obj.location = (0, distance, distance * 0.6)
    rim_obj.rotation_euler = (math.radians(120), 0, math.radians(180))
    lights.append(rim_obj.name)

    return {
        "lights": lights,
        "key_energy": key_energy,
        "fill_energy": fill_energy,
        "rim_energy": rim_energy,
    }


def setup_3point_lighting(
    energy: float = 1000.0,
    distance: float = 5.0,
    height: float = 3.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a classic 3-point lighting setup.

    Parameters
    ----------
    energy : float
        Base energy for the key light (fill and back are proportional).
    distance : float
        Distance from center.
    height : float
        Height of the lights above the ground plane.
    """
    _ensure_object_mode()
    lights = []

    configs = [
        ("KeyLight", energy, (distance, -distance, height), "AREA"),
        ("FillLight", energy * 0.5, (-distance, -distance * 0.5, height * 0.7), "AREA"),
        ("BackLight", energy * 0.75, (0, distance, height * 1.2), "SPOT"),
    ]

    for lname, lener, lloc, ltype in configs:
        ldata = bpy.data.lights.new(name=lname, type=ltype)
        ldata.energy = lener
        if ltype == "AREA":
            ldata.size = 2.0
        lobj = bpy.data.objects.new(name=lname, object_data=ldata)
        bpy.context.collection.objects.link(lobj)
        lobj.location = lloc
        # Point at origin
        direction = bpy.data.objects.new("_temp_target", None)
        bpy.context.collection.objects.link(direction)
        direction.location = (0, 0, 0)
        constraint = lobj.constraints.new(type="TRACK_TO")
        constraint.target = direction
        constraint.track_axis = "TRACK_NEGATIVE_Z"
        constraint.up_axis = "UP_Y"
        bpy.context.view_layer.update()
        # Apply the constraint and remove temp
        lobj.rotation_euler = lobj.matrix_world.to_euler()
        lobj.constraints.remove(constraint)
        bpy.data.objects.remove(direction)
        lights.append(lobj.name)

    return {
        "lights": lights,
        "energy": energy,
        "distance": distance,
    }


def create_hdri_environment(
    filepath: str,
    strength: float = 1.0,
    rotation: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set up an HDRI environment map for image-based lighting.

    Parameters
    ----------
    filepath : str
        Path to the HDR/EXR image file.
    strength : float
        Environment light strength multiplier.
    rotation : float
        Z-axis rotation in degrees for the environment map.
    """
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new(name="World")
        bpy.context.scene.world = world

    world.use_nodes = True
    tree = world.node_tree
    tree.nodes.clear()

    # Build node chain: Texture Coordinate -> Mapping -> Environment Texture -> Background -> Output
    tex_coord = tree.nodes.new(type="ShaderNodeTexCoord")
    tex_coord.location = (-800, 0)

    mapping = tree.nodes.new(type="ShaderNodeMapping")
    mapping.location = (-600, 0)
    mapping.inputs["Rotation"].default_value[2] = math.radians(rotation)

    env_tex = tree.nodes.new(type="ShaderNodeTexEnvironment")
    env_tex.location = (-300, 0)
    env_tex.image = bpy.data.images.load(filepath)

    background = tree.nodes.new(type="ShaderNodeBackground")
    background.location = (0, 0)
    background.inputs["Strength"].default_value = strength

    output = tree.nodes.new(type="ShaderNodeOutputWorld")
    output.location = (200, 0)

    tree.links.new(tex_coord.outputs["Generated"], mapping.inputs["Vector"])
    tree.links.new(mapping.outputs["Vector"], env_tex.inputs["Vector"])
    tree.links.new(env_tex.outputs["Color"], background.inputs["Color"])
    tree.links.new(background.outputs["Background"], output.inputs["Surface"])

    return {
        "filepath": filepath,
        "strength": strength,
        "rotation": rotation,
    }


def set_world_background(
    color: Optional[List[float]] = None,
    strength: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set a solid color world background.

    Parameters
    ----------
    color : list[float], optional
        RGB color (0-1 each). Defaults to dark gray.
    strength : float
        Background strength.
    """
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new(name="World")
        bpy.context.scene.world = world

    world.use_nodes = True
    tree = world.node_tree

    bg_node = None
    for node in tree.nodes:
        if node.type == "BACKGROUND":
            bg_node = node
            break

    if bg_node is None:
        tree.nodes.clear()
        bg_node = tree.nodes.new(type="ShaderNodeBackground")
        output = tree.nodes.new(type="ShaderNodeOutputWorld")
        output.location = (200, 0)
        tree.links.new(bg_node.outputs["Background"], output.inputs["Surface"])

    bg_color = tuple(color[:3]) + (1.0,) if color else (0.05, 0.05, 0.05, 1.0)
    bg_node.inputs["Color"].default_value = bg_color
    bg_node.inputs["Strength"].default_value = strength

    return {
        "color": list(bg_color),
        "strength": strength,
    }


def set_light_energy(
    name: str,
    energy: float,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the energy/power of a light.

    Parameters
    ----------
    name : str
        Name of the light object.
    energy : float
        Light energy in watts.
    """
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise ValueError(f"Object '{name}' not found")
    if obj.type != "LIGHT":
        raise ValueError(f"Object '{name}' is not a light (type: {obj.type})")
    obj.data.energy = energy
    return {
        "light_name": obj.name,
        "energy": obj.data.energy,
    }


def set_light_color(
    name: str,
    color: List[float],
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the color of a light.

    Parameters
    ----------
    name : str
        Name of the light object.
    color : list[float]
        RGB color (0-1 each).
    """
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise ValueError(f"Object '{name}' not found")
    if obj.type != "LIGHT":
        raise ValueError(f"Object '{name}' is not a light (type: {obj.type})")
    obj.data.color = tuple(color[:3])
    return {
        "light_name": obj.name,
        "color": list(obj.data.color),
    }


def set_light_shadow(
    name: str,
    use_shadow: bool = True,
    shadow_soft_size: float = 0.25,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Configure shadow settings for a light.

    Parameters
    ----------
    name : str
        Name of the light object.
    use_shadow : bool
        Enable or disable shadow casting.
    shadow_soft_size : float
        Shadow softness / light radius.
    """
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise ValueError(f"Object '{name}' not found")
    if obj.type != "LIGHT":
        raise ValueError(f"Object '{name}' is not a light (type: {obj.type})")
    obj.data.use_shadow = use_shadow
    obj.data.shadow_soft_size = shadow_soft_size
    return {
        "light_name": obj.name,
        "use_shadow": use_shadow,
        "shadow_soft_size": shadow_soft_size,
    }


def create_area_light(
    name: str = "AreaLight",
    location: Optional[List[float]] = None,
    energy: float = 1000.0,
    size: float = 2.0,
    shape: str = "RECTANGLE",
    size_y: float = 2.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create an area light with configurable shape and size.

    Parameters
    ----------
    name : str
        Name for the light.
    location : list[float], optional
        World location.
    energy : float
        Light energy in watts.
    size : float
        Size of the area light (X dimension).
    shape : str
        SQUARE, RECTANGLE, DISK, or ELLIPSE.
    size_y : float
        Y dimension (for RECTANGLE and ELLIPSE shapes).
    """
    _ensure_object_mode()
    loc = tuple(location) if location else (0.0, 0.0, 5.0)

    light_data = bpy.data.lights.new(name=name, type="AREA")
    light_data.energy = energy
    light_data.shape = shape.upper()
    light_data.size = size
    if shape.upper() in ("RECTANGLE", "ELLIPSE"):
        light_data.size_y = size_y

    light_obj = bpy.data.objects.new(name=name, object_data=light_data)
    bpy.context.collection.objects.link(light_obj)
    light_obj.location = loc

    return {
        "light_name": light_obj.name,
        "shape": shape.upper(),
        "size": size,
        "energy": energy,
        "location": list(light_obj.location),
    }


def set_environment_strength(
    strength: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the environment/world background strength.

    Parameters
    ----------
    strength : float
        Background light strength.
    """
    world = bpy.context.scene.world
    if world is None:
        raise ValueError("No world exists in the current scene")

    if not world.use_nodes:
        world.use_nodes = True

    for node in world.node_tree.nodes:
        if node.type == "BACKGROUND":
            node.inputs["Strength"].default_value = strength
            break

    return {
        "strength": strength,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "create_light": create_light,
    "setup_studio_lighting": setup_studio_lighting,
    "setup_3point_lighting": setup_3point_lighting,
    "create_hdri_environment": create_hdri_environment,
    "set_world_background": set_world_background,
    "set_light_energy": set_light_energy,
    "set_light_color": set_light_color,
    "set_light_shadow": set_light_shadow,
    "create_area_light": create_area_light,
    "set_environment_strength": set_environment_strength,
}
