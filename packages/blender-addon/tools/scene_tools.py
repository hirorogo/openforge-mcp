"""
Scene information and configuration tools for OpenForge MCP.
"""

from typing import Any, Dict, List, Optional

import bpy


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def get_scene_info(**kwargs: Any) -> Dict[str, Any]:
    """Return general information about the current scene."""
    scene = bpy.context.scene
    return {
        "scene_name": scene.name,
        "object_count": len(scene.objects),
        "frame_start": scene.frame_start,
        "frame_end": scene.frame_end,
        "frame_current": scene.frame_current,
        "render_engine": scene.render.engine,
        "resolution_x": scene.render.resolution_x,
        "resolution_y": scene.render.resolution_y,
        "resolution_percentage": scene.render.resolution_percentage,
        "fps": scene.render.fps,
    }


def get_objects_list(
    object_type: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """List all objects in the scene with their basic properties.

    Parameters
    ----------
    object_type : str, optional
        Filter by object type (e.g. MESH, CAMERA, LIGHT, EMPTY, CURVE,
        ARMATURE).  If None, list all objects.
    """
    scene = bpy.context.scene
    objects_data: List[Dict[str, Any]] = []

    for obj in scene.objects:
        if object_type and obj.type != object_type.upper():
            continue

        obj_info: Dict[str, Any] = {
            "name": obj.name,
            "type": obj.type,
            "location": list(obj.location),
            "rotation": list(obj.rotation_euler),
            "scale": list(obj.scale),
            "visible": obj.visible_get(),
        }

        if obj.type == "MESH" and obj.data:
            obj_info["vertex_count"] = len(obj.data.vertices)
            obj_info["face_count"] = len(obj.data.polygons)
            obj_info["material_count"] = len(obj.data.materials)

        if obj.type == "LIGHT" and obj.data:
            obj_info["light_type"] = obj.data.type
            obj_info["energy"] = obj.data.energy

        if obj.type == "CAMERA" and obj.data:
            obj_info["lens"] = obj.data.lens
            obj_info["camera_type"] = obj.data.type

        objects_data.append(obj_info)

    return {
        "count": len(objects_data),
        "objects": objects_data,
    }


def set_render_engine(
    engine: str = "CYCLES",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the render engine.

    Parameters
    ----------
    engine : str
        CYCLES, BLENDER_EEVEE, BLENDER_EEVEE_NEXT, or BLENDER_WORKBENCH.
    """
    engine = engine.upper()

    # Normalise common shorthand names.
    engine_map = {
        "EEVEE": "BLENDER_EEVEE",
        "EEVEE_NEXT": "BLENDER_EEVEE_NEXT",
        "WORKBENCH": "BLENDER_WORKBENCH",
    }
    engine = engine_map.get(engine, engine)

    # Validate that the engine exists. Blender 4.x renamed EEVEE.
    valid_engines = {"CYCLES", "BLENDER_EEVEE", "BLENDER_EEVEE_NEXT", "BLENDER_WORKBENCH"}
    if engine not in valid_engines:
        # Try anyway -- Blender may have additional engines from addons.
        pass

    scene = bpy.context.scene
    previous_engine = scene.render.engine
    scene.render.engine = engine

    return {
        "previous_engine": previous_engine,
        "current_engine": scene.render.engine,
    }


def set_resolution(
    x: int = 1920,
    y: int = 1080,
    percentage: int = 100,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set render resolution.

    Parameters
    ----------
    x : int
        Horizontal resolution in pixels.
    y : int
        Vertical resolution in pixels.
    percentage : int
        Resolution scale percentage (1-100).
    """
    scene = bpy.context.scene
    scene.render.resolution_x = max(1, x)
    scene.render.resolution_y = max(1, y)
    scene.render.resolution_percentage = max(1, min(100, percentage))

    return {
        "resolution_x": scene.render.resolution_x,
        "resolution_y": scene.render.resolution_y,
        "resolution_percentage": scene.render.resolution_percentage,
    }


def set_frame_range(
    start: int = 1,
    end: int = 250,
    current: Optional[int] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the animation frame range.

    Parameters
    ----------
    start : int
        Start frame.
    end : int
        End frame.
    current : int, optional
        Set the current frame.  Defaults to the start frame if not provided.
    """
    scene = bpy.context.scene
    scene.frame_start = start
    scene.frame_end = end

    if current is not None:
        scene.frame_current = current
    else:
        scene.frame_current = start

    return {
        "frame_start": scene.frame_start,
        "frame_end": scene.frame_end,
        "frame_current": scene.frame_current,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "get_scene_info": get_scene_info,
    "get_objects_list": get_objects_list,
    "set_render_engine": set_render_engine,
    "set_resolution": set_resolution,
    "set_frame_range": set_frame_range,
}
