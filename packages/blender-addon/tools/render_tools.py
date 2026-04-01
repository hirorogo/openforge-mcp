"""
Render tools for OpenForge MCP.

Tools for rendering images and animations, and configuring render settings.
"""

from typing import Any, Dict, Optional

import bpy
import os


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def render_image(
    output_path: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Render the current frame to an image file.

    Parameters
    ----------
    output_path : str, optional
        File path for the output image. Uses the scene's output path if not provided.
    """
    scene = bpy.context.scene
    if output_path:
        scene.render.filepath = output_path
    bpy.ops.render.render(write_still=True)
    return {
        "output_path": scene.render.filepath,
        "resolution_x": scene.render.resolution_x,
        "resolution_y": scene.render.resolution_y,
        "engine": scene.render.engine,
    }


def render_animation(
    output_path: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Render the full animation sequence.

    Parameters
    ----------
    output_path : str, optional
        Base file path for the output. Uses scene output path if not provided.
    """
    scene = bpy.context.scene
    if output_path:
        scene.render.filepath = output_path
    bpy.ops.render.render(animation=True)
    return {
        "output_path": scene.render.filepath,
        "frame_start": scene.frame_start,
        "frame_end": scene.frame_end,
        "engine": scene.render.engine,
    }


def set_output_format(
    file_format: str = "PNG",
    color_mode: str = "RGBA",
    color_depth: str = "8",
    compression: int = 15,
    quality: int = 90,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the render output file format and related options.

    Parameters
    ----------
    file_format : str
        PNG, JPEG, BMP, TIFF, OPEN_EXR, FFMPEG, etc.
    color_mode : str
        BW, RGB, or RGBA.
    color_depth : str
        '8' or '16' for PNG/TIFF; '16' or '32' for EXR.
    compression : int
        PNG compression percentage (0-100).
    quality : int
        JPEG quality percentage (0-100).
    """
    scene = bpy.context.scene
    settings = scene.render.image_settings
    settings.file_format = file_format.upper()
    settings.color_mode = color_mode.upper()
    settings.color_depth = str(color_depth)

    if file_format.upper() == "PNG":
        settings.compression = max(0, min(100, compression))
    elif file_format.upper() == "JPEG":
        settings.quality = max(0, min(100, quality))

    return {
        "file_format": settings.file_format,
        "color_mode": settings.color_mode,
        "color_depth": settings.color_depth,
    }


def set_output_path(
    path: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the render output file path.

    Parameters
    ----------
    path : str
        Output directory or file path.
    """
    scene = bpy.context.scene
    scene.render.filepath = path
    return {
        "output_path": scene.render.filepath,
    }


def set_render_samples(
    samples: int = 128,
    denoise: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the number of render samples and denoising.

    Parameters
    ----------
    samples : int
        Number of render samples (higher = better quality, slower).
    denoise : bool
        Enable or disable denoising.
    """
    scene = bpy.context.scene

    if scene.render.engine == "CYCLES":
        scene.cycles.samples = max(1, samples)
        scene.cycles.use_denoising = denoise
    elif scene.render.engine in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        scene.eevee.taa_render_samples = max(1, samples)

    return {
        "engine": scene.render.engine,
        "samples": samples,
        "denoise": denoise,
    }


def set_transparent_background(
    transparent: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Enable or disable transparent background for renders.

    Parameters
    ----------
    transparent : bool
        Whether to render with a transparent background.
    """
    scene = bpy.context.scene
    scene.render.film_transparent = transparent
    return {
        "film_transparent": scene.render.film_transparent,
    }


def set_film_exposure(
    exposure: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the film exposure value.

    Parameters
    ----------
    exposure : float
        Exposure value. 1.0 is default, higher brightens the image.
    """
    scene = bpy.context.scene
    if scene.render.engine == "CYCLES":
        scene.cycles.film_exposure = exposure
    scene.view_settings.exposure = exposure
    return {
        "exposure": exposure,
    }


def set_color_management(
    view_transform: str = "Filmic",
    look: str = "None",
    gamma: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Configure color management settings.

    Parameters
    ----------
    view_transform : str
        Standard, Filmic, AgX, Raw, False Color, etc.
    look : str
        Look preset name (e.g. None, High Contrast, Medium Contrast).
    gamma : float
        Display gamma value.
    """
    scene = bpy.context.scene
    scene.view_settings.view_transform = view_transform
    scene.view_settings.look = look
    scene.view_settings.gamma = gamma
    return {
        "view_transform": scene.view_settings.view_transform,
        "look": scene.view_settings.look,
        "gamma": scene.view_settings.gamma,
    }


def create_compositor_node(
    node_type: str = "CompositorNodeGlare",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a compositor node to the scene's compositor node tree.

    Parameters
    ----------
    node_type : str
        Blender compositor node type identifier (e.g. CompositorNodeGlare,
        CompositorNodeBlur, CompositorNodeBrightContrast).
    """
    scene = bpy.context.scene
    scene.use_nodes = True
    tree = scene.node_tree
    node = tree.nodes.new(type=node_type)
    return {
        "node_name": node.name,
        "node_type": node_type,
        "location": list(node.location),
    }


def set_render_border(
    min_x: float = 0.0,
    min_y: float = 0.0,
    max_x: float = 1.0,
    max_y: float = 1.0,
    enabled: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set a render border to render only a portion of the frame.

    Parameters
    ----------
    min_x : float
        Left boundary (0.0-1.0).
    min_y : float
        Bottom boundary (0.0-1.0).
    max_x : float
        Right boundary (0.0-1.0).
    max_y : float
        Top boundary (0.0-1.0).
    enabled : bool
        Whether to enable the render border.
    """
    scene = bpy.context.scene
    scene.render.use_border = enabled
    scene.render.border_min_x = max(0.0, min(1.0, min_x))
    scene.render.border_min_y = max(0.0, min(1.0, min_y))
    scene.render.border_max_x = max(0.0, min(1.0, max_x))
    scene.render.border_max_y = max(0.0, min(1.0, max_y))
    return {
        "use_border": scene.render.use_border,
        "min_x": scene.render.border_min_x,
        "min_y": scene.render.border_min_y,
        "max_x": scene.render.border_max_x,
        "max_y": scene.render.border_max_y,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "render_image": render_image,
    "render_animation": render_animation,
    "set_output_format": set_output_format,
    "set_output_path": set_output_path,
    "set_render_samples": set_render_samples,
    "set_transparent_background": set_transparent_background,
    "set_film_exposure": set_film_exposure,
    "set_color_management": set_color_management,
    "create_compositor_node": create_compositor_node,
    "set_render_border": set_render_border,
}
