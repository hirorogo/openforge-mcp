"""
Hunyuan3D AI model generation tools for OpenForge MCP.

Integrates with the Hunyuan3D API for text-to-3D and image-to-3D generation.
Requires the HUNYUAN3D_API_KEY environment variable or a configured API endpoint.
"""

import json
import os
import tempfile
import time
import urllib.request
import urllib.error
import urllib.parse
from typing import Any, Dict, Optional

import bpy


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_API_BASE = os.environ.get(
    "HUNYUAN3D_API_BASE", "https://api.hunyuan3d.com/v1"
)
_TIMEOUT = 30
_POLL_INTERVAL = 5  # seconds between status checks
_MAX_POLL_TIME = 600  # max seconds to wait for generation


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_api_key() -> str:
    key = os.environ.get("HUNYUAN3D_API_KEY", "")
    if not key:
        raise RuntimeError(
            "HUNYUAN3D_API_KEY environment variable is not set. "
            "Please set it to your Hunyuan3D API key."
        )
    return key


def _api_post(endpoint: str, payload: Dict[str, Any]) -> Any:
    """POST request to Hunyuan3D API."""
    url = f"{_API_BASE}{endpoint}"
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {_get_api_key()}",
        "User-Agent": "OpenForge-MCP/1.0",
    }
    try:
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = ""
        try:
            body = exc.read().decode("utf-8", errors="replace")
        except Exception:
            pass
        raise RuntimeError(
            f"Hunyuan3D API error {exc.code}: {exc.reason}. {body}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(
            f"Network error contacting Hunyuan3D API: {exc.reason}"
        ) from exc


def _api_get(endpoint: str) -> Any:
    """GET request to Hunyuan3D API."""
    url = f"{_API_BASE}{endpoint}"
    headers = {
        "Authorization": f"Bearer {_get_api_key()}",
        "User-Agent": "OpenForge-MCP/1.0",
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = ""
        try:
            body = exc.read().decode("utf-8", errors="replace")
        except Exception:
            pass
        raise RuntimeError(
            f"Hunyuan3D API error {exc.code}: {exc.reason}. {body}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(
            f"Network error contacting Hunyuan3D API: {exc.reason}"
        ) from exc


def _download_file(url: str, dest_path: str) -> str:
    """Download a file to disk."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "OpenForge-MCP/1.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            with open(dest_path, "wb") as fh:
                while True:
                    chunk = resp.read(65536)
                    if not chunk:
                        break
                    fh.write(chunk)
    except (urllib.error.HTTPError, urllib.error.URLError) as exc:
        raise RuntimeError(f"Failed to download {url}: {exc}") from exc
    return dest_path


def _get_temp_dir() -> str:
    d = os.path.join(tempfile.gettempdir(), "openforge_hunyuan3d")
    os.makedirs(d, exist_ok=True)
    return d


def _wait_for_completion(task_id: str) -> Dict[str, Any]:
    """Poll the API until the generation task completes or times out."""
    start = time.time()
    while time.time() - start < _MAX_POLL_TIME:
        status_data = _api_get(f"/tasks/{task_id}")
        status = status_data.get("status", "unknown")
        if status in ("completed", "succeeded", "done"):
            return status_data
        elif status in ("failed", "error"):
            raise RuntimeError(
                f"Hunyuan3D generation failed for task {task_id}: "
                f"{status_data.get('error', 'Unknown error')}"
            )
        time.sleep(_POLL_INTERVAL)

    raise RuntimeError(
        f"Hunyuan3D generation timed out after {_MAX_POLL_TIME}s for task {task_id}"
    )


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def generate_hunyuan3d(
    prompt: str,
    image_url: Optional[str] = None,
    output_format: str = "glb",
    quality: str = "standard",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Generate a 3D model from a text prompt (and optionally a reference image).

    Submits a generation request to the Hunyuan3D API and waits for completion.

    Parameters
    ----------
    prompt : str
        Text description of the 3D model to generate.
    image_url : str, optional
        URL of a reference image for image-to-3D generation.
    output_format : str
        Output format: glb, obj, or fbx.
    quality : str
        Generation quality: draft, standard, or high.
    """
    payload: Dict[str, Any] = {
        "prompt": prompt,
        "output_format": output_format,
        "quality": quality,
    }
    if image_url:
        payload["image_url"] = image_url

    response = _api_post("/generate", payload)
    task_id = response.get("task_id", "")

    if not task_id:
        raise RuntimeError(
            f"Hunyuan3D API did not return a task_id. Response: {response}"
        )

    # Poll for completion
    result_data = _wait_for_completion(task_id)

    # Download the generated model
    model_url = result_data.get("output", {}).get("model_url", "")
    if not model_url:
        model_url = result_data.get("model_url", "")

    file_path = ""
    if model_url:
        ext = f".{output_format}"
        file_path = os.path.join(_get_temp_dir(), f"{task_id}{ext}")
        _download_file(model_url, file_path)

    return {
        "task_id": task_id,
        "status": "completed",
        "prompt": prompt,
        "output_format": output_format,
        "file_path": file_path,
        "model_url": model_url,
    }


def import_hunyuan3d(
    prompt: str,
    image_url: Optional[str] = None,
    output_format: str = "glb",
    quality: str = "standard",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Generate a 3D model with Hunyuan3D and import it into the Blender scene.

    Parameters
    ----------
    prompt : str
        Text description of the 3D model.
    image_url : str, optional
        Reference image URL for image-to-3D.
    output_format : str
        Output format: glb, obj, or fbx.
    quality : str
        Generation quality: draft, standard, or high.
    """
    gen_result = generate_hunyuan3d(
        prompt=prompt,
        image_url=image_url,
        output_format=output_format,
        quality=quality,
    )

    file_path = gen_result.get("file_path", "")
    if not file_path or not os.path.isfile(file_path):
        raise RuntimeError(
            "Generation succeeded but no model file was downloaded. "
            f"Task ID: {gen_result.get('task_id')}"
        )

    before = set(o.name for o in bpy.data.objects)

    fl = file_path.lower()
    if fl.endswith((".glb", ".gltf")):
        bpy.ops.import_scene.gltf(filepath=file_path)
    elif fl.endswith(".fbx"):
        bpy.ops.import_scene.fbx(filepath=file_path)
    elif fl.endswith(".obj"):
        bpy.ops.wm.obj_import(filepath=file_path)
    else:
        raise RuntimeError(f"Unsupported model format: {file_path}")

    after = set(o.name for o in bpy.data.objects)
    new_objects = list(after - before)

    return {
        "task_id": gen_result["task_id"],
        "prompt": prompt,
        "file_path": file_path,
        "imported_objects": new_objects,
    }


def get_hunyuan3d_status(
    task_id: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Check the status of a Hunyuan3D generation task.

    Parameters
    ----------
    task_id : str
        The task ID returned by generate_hunyuan3d.
    """
    data = _api_get(f"/tasks/{task_id}")

    status = data.get("status", "unknown")
    progress = data.get("progress", 0)
    model_url = data.get("output", {}).get("model_url", "")
    if not model_url:
        model_url = data.get("model_url", "")
    error = data.get("error", "")

    return {
        "task_id": task_id,
        "status": status,
        "progress": progress,
        "model_url": model_url,
        "error": error,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "generate_hunyuan3d": generate_hunyuan3d,
    "import_hunyuan3d": import_hunyuan3d,
    "get_hunyuan3d_status": get_hunyuan3d_status,
}
