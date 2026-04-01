"""
Shared pytest fixtures and bpy mock setup for OpenForge Blender Addon tests.

Because the addon modules import ``bpy`` and ``mathutils`` at module level,
we must inject mock versions of these modules into ``sys.modules`` *before*
any addon code is imported.  This conftest achieves that by running the mock
installation at collection time (before any test module is loaded).
"""

import sys
import types
from unittest.mock import MagicMock


def _build_bpy_mock():
    """Build a realistic-enough mock of ``bpy`` for unit testing.

    The mock provides attribute chains used by the addon code such as
    ``bpy.data.objects.get``, ``bpy.ops.mesh.*``, ``bpy.context.scene``, etc.
    Individual tests may further configure return values as needed.
    """
    bpy = MagicMock(name="bpy")

    # --- bpy.types stubs (used in type annotations) ---
    bpy.types = MagicMock(name="bpy.types")
    bpy.types.Object = MagicMock
    bpy.types.Material = MagicMock
    bpy.types.ShaderNode = MagicMock
    bpy.types.Area = MagicMock
    bpy.types.SpaceView3D = MagicMock
    bpy.types.Context = MagicMock
    bpy.types.AddonPreferences = type("AddonPreferences", (), {})

    # --- bpy.props stubs ---
    bpy.props.IntProperty = lambda **kw: None
    bpy.props.BoolProperty = lambda **kw: None
    bpy.props.StringProperty = lambda **kw: None
    bpy.props.FloatProperty = lambda **kw: None

    # --- bpy.app.timers ---
    bpy.app.timers.register = MagicMock()

    return bpy


def _build_mathutils_mock():
    """Build a minimal ``mathutils`` mock.

    ``Vector`` and ``Euler`` are replaced with thin wrappers around tuples
    so that assignment and list() conversion behave naturally.
    """
    mathutils = types.ModuleType("mathutils")

    class _Vector(tuple):
        """Tuple subclass that mimics mathutils.Vector."""
        def __new__(cls, iterable=(0.0, 0.0, 0.0)):
            return super().__new__(cls, iterable)

    class _Euler(tuple):
        """Tuple subclass that mimics mathutils.Euler."""
        def __new__(cls, iterable=(0.0, 0.0, 0.0)):
            return super().__new__(cls, iterable)

    mathutils.Vector = _Vector
    mathutils.Euler = _Euler
    return mathutils


# ---------------------------------------------------------------------------
# Install mocks into sys.modules BEFORE any addon code is imported.
# ---------------------------------------------------------------------------

_bpy_mock = _build_bpy_mock()
_mathutils_mock = _build_mathutils_mock()

sys.modules["bpy"] = _bpy_mock
sys.modules["mathutils"] = _mathutils_mock
sys.modules["bmesh"] = MagicMock(name="bmesh")
sys.modules["bpy_extras"] = MagicMock(name="bpy_extras")
sys.modules["bpy_extras.io_utils"] = MagicMock(name="bpy_extras.io_utils")
sys.modules["gpu"] = MagicMock(name="gpu")
sys.modules["gpu_extras"] = MagicMock(name="gpu_extras")
sys.modules["bl_math"] = MagicMock(name="bl_math")


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

import pytest  # noqa: E402  (must come after sys.modules patching)


@pytest.fixture()
def bpy_mock():
    """Provide the shared bpy mock, reset between tests."""
    _bpy_mock.reset_mock()

    # Re-apply structural attributes that reset_mock clears.
    _bpy_mock.types.Object = MagicMock
    _bpy_mock.types.Material = MagicMock
    _bpy_mock.types.ShaderNode = MagicMock
    _bpy_mock.types.Area = MagicMock
    _bpy_mock.types.SpaceView3D = MagicMock
    _bpy_mock.types.Context = MagicMock
    _bpy_mock.types.AddonPreferences = type("AddonPreferences", (), {})

    _bpy_mock.props.IntProperty = lambda **kw: None
    _bpy_mock.props.BoolProperty = lambda **kw: None
    _bpy_mock.props.StringProperty = lambda **kw: None
    _bpy_mock.props.FloatProperty = lambda **kw: None

    _bpy_mock.app.timers.register = MagicMock()

    return _bpy_mock
