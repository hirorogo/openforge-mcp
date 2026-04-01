"""
Arbitrary Python execution tools for OpenForge MCP.

Allows executing Python code within Blender's embedded Python environment,
providing full access to bpy and all Blender APIs.
"""

import io
import sys
import traceback
from typing import Any, Dict, Optional

import bpy


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def execute_python(
    code: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Execute arbitrary Python code in Blender's Python environment.

    The code has access to the full ``bpy`` module and Blender's Python
    environment.  stdout and stderr are captured and returned.

    Parameters
    ----------
    code : str
        Python code to execute.
    """
    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()
    old_stdout = sys.stdout
    old_stderr = sys.stderr

    result_value = None
    success = False

    try:
        sys.stdout = stdout_capture
        sys.stderr = stderr_capture

        # Use a namespace that includes bpy for convenience
        exec_globals = {"__builtins__": __builtins__, "bpy": bpy}
        exec_locals: Dict[str, Any] = {}

        exec(code, exec_globals, exec_locals)  # noqa: S102

        # If the code defined a 'result' variable, capture it
        if "result" in exec_locals:
            result_value = exec_locals["result"]

        success = True

    except Exception:
        stderr_capture.write(traceback.format_exc())

    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    return {
        "success": success,
        "stdout": stdout_capture.getvalue(),
        "stderr": stderr_capture.getvalue(),
        "result": str(result_value) if result_value is not None else None,
    }


def execute_python_file(
    file_path: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Execute a Python file in Blender's Python environment.

    Parameters
    ----------
    file_path : str
        Absolute path to a .py file.
    """
    import os

    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"Python file not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as fh:
        code = fh.read()

    return execute_python(code=code)


def get_python_info(
    **kwargs: Any,
) -> Dict[str, Any]:
    """Get information about Blender's Python environment.

    Returns the Python version, Blender version, and a list of available
    built-in and installed modules.
    """
    import pkgutil

    modules = sorted(
        set(
            mod.name for mod in pkgutil.iter_modules()
            if not mod.name.startswith("_")
        )
    )

    # Limit the module list to avoid huge responses
    if len(modules) > 200:
        modules = modules[:200]
        modules.append("... (truncated)")

    return {
        "python_version": sys.version,
        "blender_version": ".".join(str(v) for v in bpy.app.version),
        "blender_version_string": bpy.app.version_string,
        "executable": sys.executable,
        "platform": sys.platform,
        "module_count": len(modules),
        "modules": modules,
    }


def eval_expression(
    expression: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Evaluate a Python expression and return the result.

    Unlike execute_python which runs statements, this evaluates a single
    expression and returns its value directly.

    Parameters
    ----------
    expression : str
        A Python expression to evaluate (e.g. ``len(bpy.data.objects)``).
    """
    eval_globals = {"__builtins__": __builtins__, "bpy": bpy}

    try:
        result = eval(expression, eval_globals)  # noqa: S307
        return {
            "success": True,
            "result": str(result),
            "type": type(result).__name__,
        }
    except Exception:
        return {
            "success": False,
            "error": traceback.format_exc(),
            "result": None,
            "type": None,
        }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "execute_python": execute_python,
    "execute_python_file": execute_python_file,
    "get_python_info": get_python_info,
    "eval_expression": eval_expression,
}
