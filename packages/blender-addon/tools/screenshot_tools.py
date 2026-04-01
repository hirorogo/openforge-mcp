"""
Screenshot / visual feedback tools for OpenForge MCP.

Captures the 3D viewport and returns the image as a base64-encoded PNG.
"""

import base64
import os
import tempfile
from typing import Any, Dict, Optional

import bpy


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _find_3d_viewport_area() -> Optional[bpy.types.Area]:
    """Return the first 3D Viewport area in the current screen, or None."""
    screen = bpy.context.window.screen if bpy.context.window else None
    if screen is None:
        for window in bpy.context.window_manager.windows:
            screen = window.screen
            break
    if screen is None:
        return None
    for area in screen.areas:
        if area.type == "VIEW_3D":
            return area
    return None


def _find_3d_viewport_space(area: bpy.types.Area) -> Optional[bpy.types.SpaceView3D]:
    """Return the SpaceView3D from *area*."""
    for space in area.spaces:
        if space.type == "VIEW_3D":
            return space
    return None


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def get_viewport_screenshot(
    width: int = 1920,
    height: int = 1080,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Capture the 3D viewport and return it as a base64-encoded PNG.

    Parameters
    ----------
    width : int
        Output image width in pixels.
    height : int
        Output image height in pixels.
    """
    area = _find_3d_viewport_area()
    if area is None:
        raise RuntimeError("No 3D Viewport area found in the current Blender layout")

    space = _find_3d_viewport_space(area)
    if space is None:
        raise RuntimeError("No SpaceView3D found in the 3D Viewport area")

    # Use a temporary file for the render output.
    tmp_dir = tempfile.gettempdir()
    tmp_path = os.path.join(tmp_dir, "openforge_viewport_capture.png")

    # Store original render settings so we can restore them.
    scene = bpy.context.scene
    orig_res_x = scene.render.resolution_x
    orig_res_y = scene.render.resolution_y
    orig_res_pct = scene.render.resolution_percentage
    orig_file_format = scene.render.image_settings.file_format
    orig_filepath = scene.render.filepath

    try:
        scene.render.resolution_x = width
        scene.render.resolution_y = height
        scene.render.resolution_percentage = 100
        scene.render.image_settings.file_format = "PNG"
        scene.render.filepath = tmp_path

        # Override the context to target the 3D viewport area for opengl render.
        override = bpy.context.copy()
        override["area"] = area
        override["space_data"] = space
        override["region"] = None
        for region in area.regions:
            if region.type == "WINDOW":
                override["region"] = region
                break

        # Use context override for the opengl render.
        # Blender 3.x uses bpy.ops with a dict override; 4.x may use
        # context.temp_override.  We try the newer API first.
        try:
            with bpy.context.temp_override(**override):
                bpy.ops.render.opengl(write_still=True)
        except (AttributeError, TypeError):
            bpy.ops.render.opengl(override, write_still=True)

        # Read the rendered file and encode as base64.
        if not os.path.isfile(tmp_path):
            raise RuntimeError(
                "Viewport capture failed: output file was not created"
            )

        with open(tmp_path, "rb") as fh:
            png_data = fh.read()

        encoded = base64.b64encode(png_data).decode("ascii")

        return {
            "image_base64": encoded,
            "width": width,
            "height": height,
            "format": "png",
            "size_bytes": len(png_data),
        }

    finally:
        # Restore original settings.
        scene.render.resolution_x = orig_res_x
        scene.render.resolution_y = orig_res_y
        scene.render.resolution_percentage = orig_res_pct
        scene.render.image_settings.file_format = orig_file_format
        scene.render.filepath = orig_filepath

        # Clean up temp file.
        try:
            if os.path.isfile(tmp_path):
                os.remove(tmp_path)
        except OSError:
            pass


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "get_viewport_screenshot": get_viewport_screenshot,
}
