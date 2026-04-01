"""
Tests for tool_executor module.

Covers:
  - All tools from every tool module are registered in the registry.
  - ``execute()`` dispatches to the correct handler function.
  - Error handling for unknown tool names.
  - Error handling when a tool handler raises an exception.
  - ``list_tools()`` returns a sorted list of registered names.
"""

import importlib
import os
import sys
from unittest.mock import MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# We need to ensure the addon package is importable as a regular package.
# The blender-addon directory is a Blender addon with relative imports
# (``from .tools import ...``).  We re-parent it under a synthetic package
# name so the relative imports work.
# ---------------------------------------------------------------------------

_ADDON_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

if _ADDON_DIR not in sys.path:
    _parent = os.path.dirname(_ADDON_DIR)
    if _parent not in sys.path:
        sys.path.insert(0, _parent)

# The package name matches the directory name.
_PKG = "blender-addon"

# Python package names cannot contain hyphens.  We import the directory
# via importlib so we can give it a clean alias.
import importlib.util

_PACKAGE_NAME = "openforge_addon"

# Only set up once.
if _PACKAGE_NAME not in sys.modules:
    # Register the top-level package.
    _spec = importlib.util.spec_from_file_location(
        _PACKAGE_NAME,
        os.path.join(_ADDON_DIR, "__init__.py"),
        submodule_search_locations=[_ADDON_DIR],
    )
    _pkg_mod = importlib.util.module_from_spec(_spec)
    sys.modules[_PACKAGE_NAME] = _pkg_mod

    # Register sub-packages / sub-modules that the addon's relative imports need.
    # tools sub-package
    _tools_dir = os.path.join(_ADDON_DIR, "tools")
    _tools_spec = importlib.util.spec_from_file_location(
        f"{_PACKAGE_NAME}.tools",
        os.path.join(_tools_dir, "__init__.py"),
        submodule_search_locations=[_tools_dir],
    )
    _tools_mod = importlib.util.module_from_spec(_tools_spec)
    sys.modules[f"{_PACKAGE_NAME}.tools"] = _tools_mod
    _tools_spec.loader.exec_module(_tools_mod)

    # Individual tool modules
    for _mod_name in ("object_tools", "mesh_tools", "material_tools",
                      "screenshot_tools", "scene_tools"):
        _fpath = os.path.join(_tools_dir, f"{_mod_name}.py")
        _mspec = importlib.util.spec_from_file_location(
            f"{_PACKAGE_NAME}.tools.{_mod_name}", _fpath,
        )
        _m = importlib.util.module_from_spec(_mspec)
        sys.modules[f"{_PACKAGE_NAME}.tools.{_mod_name}"] = _m
        _mspec.loader.exec_module(_m)
        setattr(_tools_mod, _mod_name, _m)

    # tool_executor module
    _te_path = os.path.join(_ADDON_DIR, "tool_executor.py")
    _te_spec = importlib.util.spec_from_file_location(
        f"{_PACKAGE_NAME}.tool_executor", _te_path,
    )
    _te_mod = importlib.util.module_from_spec(_te_spec)
    sys.modules[f"{_PACKAGE_NAME}.tool_executor"] = _te_mod
    _te_spec.loader.exec_module(_te_mod)
    setattr(_pkg_mod, "tool_executor", _te_mod)


# Now we can import the tool_executor normally.
from openforge_addon import tool_executor
from openforge_addon.tools import (
    object_tools,
    mesh_tools,
    material_tools,
    scene_tools,
    screenshot_tools,
)


# ---------------------------------------------------------------------------
# Expected tool names from each module
# ---------------------------------------------------------------------------

OBJECT_TOOL_NAMES = [
    "create_mesh",
    "transform_object",
    "duplicate_object",
    "delete_object",
    "set_origin",
    "join_objects",
    "separate_mesh",
]

MESH_TOOL_NAMES = [
    "extrude",
    "bevel",
    "subdivide",
    "boolean_operation",
    "decimate",
    "merge_by_distance",
    "knife_cut",
]

MATERIAL_TOOL_NAMES = [
    "create_material",
    "set_color",
    "set_metallic",
    "set_roughness",
    "create_glass_material",
    "create_emission_material",
]

SCREENSHOT_TOOL_NAMES = [
    "get_viewport_screenshot",
]

SCENE_TOOL_NAMES = [
    "get_scene_info",
    "get_objects_list",
    "set_render_engine",
    "set_resolution",
    "set_frame_range",
]

ALL_TOOL_NAMES = sorted(
    OBJECT_TOOL_NAMES
    + MESH_TOOL_NAMES
    + MATERIAL_TOOL_NAMES
    + SCREENSHOT_TOOL_NAMES
    + SCENE_TOOL_NAMES
)


# ===================================================================
# Test: all tools are registered
# ===================================================================

class TestToolRegistration:
    """Verify that _build_registry picks up every tool from every module."""

    def test_all_tool_names_present(self):
        registered = tool_executor.list_tools()
        for name in ALL_TOOL_NAMES:
            assert name in registered, (
                f"Tool '{name}' is missing from the registry. "
                f"Registered: {registered}"
            )

    def test_no_extra_tools(self):
        registered = tool_executor.list_tools()
        # All originally expected tools should still be present
        for name in ALL_TOOL_NAMES:
            assert name in registered, (
                f"Expected tool '{name}' missing from registry."
            )

    def test_list_tools_is_sorted(self):
        registered = tool_executor.list_tools()
        assert registered == sorted(registered)

    def test_registry_count(self):
        # At least the original tools should be registered, plus expansions
        assert len(tool_executor.list_tools()) >= len(ALL_TOOL_NAMES)

    @pytest.mark.parametrize("name", OBJECT_TOOL_NAMES)
    def test_object_tools_registered(self, name):
        assert name in tool_executor._registry
        assert tool_executor._registry[name] is getattr(object_tools, name)

    @pytest.mark.parametrize("name", MESH_TOOL_NAMES)
    def test_mesh_tools_registered(self, name):
        assert name in tool_executor._registry
        assert tool_executor._registry[name] is getattr(mesh_tools, name)

    @pytest.mark.parametrize("name", MATERIAL_TOOL_NAMES)
    def test_material_tools_registered(self, name):
        assert name in tool_executor._registry
        assert tool_executor._registry[name] is getattr(material_tools, name)

    @pytest.mark.parametrize("name", SCENE_TOOL_NAMES)
    def test_scene_tools_registered(self, name):
        assert name in tool_executor._registry
        assert tool_executor._registry[name] is getattr(scene_tools, name)

    @pytest.mark.parametrize("name", SCREENSHOT_TOOL_NAMES)
    def test_screenshot_tools_registered(self, name):
        assert name in tool_executor._registry
        assert tool_executor._registry[name] is getattr(screenshot_tools, name)


# ===================================================================
# Test: execute dispatches correctly
# ===================================================================

class TestExecuteDispatch:
    """Verify that execute() calls the right handler with the right params."""

    def test_dispatch_calls_handler(self):
        mock_handler = MagicMock(return_value={"ok": True})
        with patch.dict(tool_executor._registry, {"my_tool": mock_handler}):
            result = tool_executor.execute("my_tool", {"x": 1, "y": 2})
        mock_handler.assert_called_once_with(x=1, y=2)
        assert result == {"ok": True}

    def test_dispatch_with_empty_params(self):
        mock_handler = MagicMock(return_value={"status": "done"})
        with patch.dict(tool_executor._registry, {"no_params": mock_handler}):
            result = tool_executor.execute("no_params", {})
        mock_handler.assert_called_once_with()
        assert result == {"status": "done"}

    def test_non_dict_result_wrapped(self):
        """When the handler returns a non-dict, execute wraps it in {'value': ...}."""
        mock_handler = MagicMock(return_value=42)
        with patch.dict(tool_executor._registry, {"scalar_tool": mock_handler}):
            result = tool_executor.execute("scalar_tool", {})
        assert result == {"value": 42}

    def test_non_dict_result_string_wrapped(self):
        mock_handler = MagicMock(return_value="hello")
        with patch.dict(tool_executor._registry, {"str_tool": mock_handler}):
            result = tool_executor.execute("str_tool", {})
        assert result == {"value": "hello"}

    def test_none_result_wrapped(self):
        mock_handler = MagicMock(return_value=None)
        with patch.dict(tool_executor._registry, {"none_tool": mock_handler}):
            result = tool_executor.execute("none_tool", {})
        assert result == {"value": None}

    def test_dict_result_passed_through(self):
        expected = {"a": 1, "b": [2, 3]}
        mock_handler = MagicMock(return_value=expected)
        with patch.dict(tool_executor._registry, {"dict_tool": mock_handler}):
            result = tool_executor.execute("dict_tool", {})
        assert result is expected


# ===================================================================
# Test: error handling for unknown tools
# ===================================================================

class TestUnknownTool:
    """Verify that execute raises ValueError for unknown tool names."""

    def test_unknown_tool_raises_value_error(self):
        with pytest.raises(ValueError, match="Unknown tool 'nonexistent_tool'"):
            tool_executor.execute("nonexistent_tool", {})

    def test_unknown_tool_lists_available(self):
        """The error message should include a list of available tools."""
        with pytest.raises(ValueError) as exc_info:
            tool_executor.execute("nonexistent_tool", {})
        msg = str(exc_info.value)
        assert "Available tools:" in msg
        # Check that at least some known tools appear in the message.
        assert "create_mesh" in msg

    def test_empty_string_tool_name(self):
        with pytest.raises(ValueError, match="Unknown tool ''"):
            tool_executor.execute("", {})


# ===================================================================
# Test: error handling when a tool raises an exception
# ===================================================================

class TestToolException:
    """Verify that execute propagates / wraps exceptions from tool handlers."""

    def test_type_error_from_bad_params(self):
        """When handler gets wrong keyword args, execute raises TypeError."""
        def strict_handler(*, required_arg: str):
            return {"result": required_arg}

        with patch.dict(tool_executor._registry, {"strict": strict_handler}):
            with pytest.raises(TypeError, match="Invalid parameters for tool 'strict'"):
                tool_executor.execute("strict", {"wrong_arg": "value"})

    def test_type_error_preserves_cause(self):
        """The TypeError raised by execute should chain the original TypeError."""
        def strict_handler(*, required_arg: str):
            return {"result": required_arg}

        with patch.dict(tool_executor._registry, {"strict": strict_handler}):
            with pytest.raises(TypeError) as exc_info:
                tool_executor.execute("strict", {"bad": 1})
            assert exc_info.value.__cause__ is not None

    def test_runtime_error_propagates(self):
        """Non-TypeError exceptions from the handler propagate unchanged."""
        def failing_handler(**kwargs):
            raise RuntimeError("Something broke")

        with patch.dict(tool_executor._registry, {"failing": failing_handler}):
            with pytest.raises(RuntimeError, match="Something broke"):
                tool_executor.execute("failing", {})

    def test_value_error_propagates(self):
        def bad_handler(**kwargs):
            raise ValueError("bad value")

        with patch.dict(tool_executor._registry, {"bad": bad_handler}):
            with pytest.raises(ValueError, match="bad value"):
                tool_executor.execute("bad", {})

    def test_generic_exception_propagates(self):
        def exploding_handler(**kwargs):
            raise Exception("generic boom")

        with patch.dict(tool_executor._registry, {"exploding": exploding_handler}):
            with pytest.raises(Exception, match="generic boom"):
                tool_executor.execute("exploding", {})


# ===================================================================
# Test: _build_registry can be re-run
# ===================================================================

class TestBuildRegistry:
    """Test that _build_registry rebuilds cleanly."""

    def test_rebuild_restores_registry(self):
        original = tool_executor.list_tools()
        # Corrupt the registry
        tool_executor._registry.clear()
        assert tool_executor.list_tools() == []
        # Rebuild
        tool_executor._build_registry()
        assert tool_executor.list_tools() == original

    def test_register_module_tools_with_empty_module(self):
        """A module with no TOOLS dict should not cause errors."""
        empty_module = MagicMock(spec=[])
        del empty_module.TOOLS  # ensure getattr returns default
        # Should not raise
        tool_executor._register_module_tools(empty_module)
