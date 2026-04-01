"""
Tool execution engine.

Receives a tool name and parameter dict, looks up the appropriate handler
from the registered tool modules, and returns a structured result dict.

All functions in this module are expected to run in Blender's main thread
(dispatched via the server's bpy.app.timers callback).
"""

import importlib
import pkgutil
import traceback
from pathlib import Path
from typing import Any, Callable, Dict

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
    tools_dir = Path(__file__).parent / "tools"

    for finder, name, ispkg in pkgutil.iter_modules([str(tools_dir)]):
        if name.startswith("_"):
            continue
        module = importlib.import_module(f".tools.{name}", package=__package__)
        _register_module_tools(module)


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
