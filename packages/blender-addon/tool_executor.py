"""
Tool execution engine.

Receives a tool name and parameter dict, looks up the appropriate handler
from the registered tool modules, and returns a structured result dict.

All functions in this module are expected to run in Blender's main thread
(dispatched via the server's bpy.app.timers callback).
"""

import traceback
from typing import Any, Callable, Dict

from .tools import (
    accessory_tools,
    animation_tools,
    animation_advanced_tools,
    armature_tools,
    armature_advanced_tools,
    avatar_tools,
    bake_tools,
    batch_tools,
    body_shape_tools,
    camera_tools,
    cloth_fitting_tools,
    collection_tools,
    game_asset_tools,
    hunyuan3d_tools,
    import_export_tools,
    inspection_tools,
    lighting_tools,
    material_tools,
    material_advanced_tools,
    mesh_repair_tools,
    mesh_tools,
    mesh_advanced_tools,
    modifier_advanced_tools,
    modifier_extended_tools,
    node_tools,
    object_tools,
    polyhaven_tools,
    procedural_tools,
    python_exec_tools,
    render_tools,
    scene_tools,
    screenshot_tools,
    sculpt_tools,
    shape_key_tools,
    sketchfab_tools,
    texture_tools,
    uv_tools,
    uv_advanced_tools,
    vrm_export_tools,
    vrm_tools,
    weight_paint_tools,
)

# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

# Mapping of "tool_name" -> handler callable.
_registry: Dict[str, Callable[..., Dict[str, Any]]] = {}


def _register_module_tools(module: Any) -> None:
    """Register every function listed in a module's ``TOOLS`` dict."""
    tools_map: Dict[str, Callable] = getattr(module, "TOOLS", {})
    for name, func in tools_map.items():
        _registry[name] = func


def _build_registry() -> None:
    _registry.clear()
    _register_module_tools(object_tools)
    _register_module_tools(mesh_tools)
    _register_module_tools(material_tools)
    _register_module_tools(screenshot_tools)
    _register_module_tools(scene_tools)
    _register_module_tools(animation_tools)
    _register_module_tools(uv_tools)
    _register_module_tools(render_tools)
    _register_module_tools(armature_tools)
    _register_module_tools(vrm_tools)
    _register_module_tools(lighting_tools)
    _register_module_tools(camera_tools)
    _register_module_tools(sculpt_tools)
    _register_module_tools(texture_tools)
    _register_module_tools(node_tools)
    _register_module_tools(import_export_tools)
    _register_module_tools(modifier_advanced_tools)
    _register_module_tools(mesh_advanced_tools)
    _register_module_tools(animation_advanced_tools)
    _register_module_tools(armature_advanced_tools)
    _register_module_tools(modifier_extended_tools)
    _register_module_tools(uv_advanced_tools)
    _register_module_tools(material_advanced_tools)
    _register_module_tools(bake_tools)
    _register_module_tools(batch_tools)
    _register_module_tools(game_asset_tools)
    _register_module_tools(inspection_tools)
    _register_module_tools(mesh_repair_tools)
    _register_module_tools(procedural_tools)
    _register_module_tools(collection_tools)
    _register_module_tools(accessory_tools)
    _register_module_tools(avatar_tools)
    _register_module_tools(body_shape_tools)
    _register_module_tools(cloth_fitting_tools)
    _register_module_tools(shape_key_tools)
    _register_module_tools(weight_paint_tools)
    _register_module_tools(vrm_export_tools)
    _register_module_tools(polyhaven_tools)
    _register_module_tools(sketchfab_tools)
    _register_module_tools(python_exec_tools)
    _register_module_tools(hunyuan3d_tools)


# Build on import so the registry is ready when the server starts.
_build_registry()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def execute(method: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a tool by *method* name with the given *params*.

    Returns a result dict on success.  Raises on failure so the caller can
    build a JSON-RPC error response with the traceback.
    """
    handler = _registry.get(method)
    if handler is None:
        available = sorted(_registry.keys())
        raise ValueError(
            f"Unknown tool '{method}'. Available tools: {', '.join(available)}"
        )

    try:
        result = handler(**params)
    except TypeError as exc:
        raise TypeError(
            f"Invalid parameters for tool '{method}': {exc}\n"
            f"{traceback.format_exc()}"
        ) from exc

    if not isinstance(result, dict):
        result = {"value": result}

    return result


def list_tools() -> list:
    """Return a list of registered tool names (useful for introspection)."""
    return sorted(_registry.keys())
