"""
Sketchfab integration tools for OpenForge MCP.

Provides search, download, and import of 3D models from Sketchfab.
Requires a Sketchfab API token for download operations (set via
SKETCHFAB_API_TOKEN environment variable or the set_sketchfab_token tool).
"""

import json
import os
import tempfile
import zipfile
import urllib.request
import urllib.error
import urllib.parse
from typing import Any, Dict, List, Optional

import bpy


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_API_BASE = "https://api.sketchfab.com/v3"
_TIMEOUT = 30  # seconds

# In-process token storage (survives across tool calls within a session)
_token_store: Dict[str, str] = {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_token() -> str:
    """Return the Sketchfab API token from store or environment."""
    token = _token_store.get("token") or os.environ.get("SKETCHFAB_API_TOKEN", "")
    if not token:
        raise RuntimeError(
            "Sketchfab API token not set. Use the 'set_sketchfab_token' tool "
            "or set the SKETCHFAB_API_TOKEN environment variable."
        )
    return token


def _api_get(endpoint: str, params: Optional[Dict[str, str]] = None,
             auth: bool = False) -> Any:
    """GET request to the Sketchfab API."""
    url = f"{_API_BASE}{endpoint}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    headers = {"User-Agent": "OpenForge-MCP/1.0"}
    if auth:
        headers["Authorization"] = f"Token {_get_token()}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise RuntimeError(
            f"Sketchfab API error {exc.code} for {url}: {exc.reason}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(
            f"Network error contacting Sketchfab API: {exc.reason}"
        ) from exc


def _download_file(url: str, dest_path: str, headers: Optional[Dict[str, str]] = None) -> str:
    """Download a file to *dest_path*."""
    hdrs = {"User-Agent": "OpenForge-MCP/1.0"}
    if headers:
        hdrs.update(headers)
    try:
        req = urllib.request.Request(url, headers=hdrs)
        with urllib.request.urlopen(req, timeout=180) as resp:
            with open(dest_path, "wb") as fh:
                while True:
                    chunk = resp.read(65536)
                    if not chunk:
                        break
                    fh.write(chunk)
    except urllib.error.HTTPError as exc:
        raise RuntimeError(
            f"Download failed ({exc.code}) for {url}: {exc.reason}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(
            f"Network error downloading {url}: {exc.reason}"
        ) from exc
    return dest_path


def _get_temp_dir() -> str:
    d = os.path.join(tempfile.gettempdir(), "openforge_sketchfab")
    os.makedirs(d, exist_ok=True)
    return d


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def search_sketchfab(
    query: str,
    downloadable: bool = True,
    sort_by: str = "-likeCount",
    limit: int = 20,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Search for 3D models on Sketchfab.

    Parameters
    ----------
    query : str
        Search keyword.
    downloadable : bool
        If True, only return downloadable models.
    sort_by : str
        Sort order. Options: -likeCount, -viewCount, -createdAt, -publishedAt.
    limit : int
        Max results (1-24).
    """
    params: Dict[str, str] = {
        "type": "models",
        "q": query,
        "sort_by": sort_by,
        "count": str(min(limit, 24)),
    }
    if downloadable:
        params["downloadable"] = "true"

    data = _api_get("/search", params)

    results: List[Dict[str, Any]] = []
    for item in data.get("results", []):
        results.append({
            "uid": item.get("uid", ""),
            "name": item.get("name", ""),
            "description": (item.get("description") or "")[:200],
            "user": item.get("user", {}).get("displayName", ""),
            "like_count": item.get("likeCount", 0),
            "view_count": item.get("viewCount", 0),
            "is_downloadable": item.get("isDownloadable", False),
            "thumbnail_url": (
                item.get("thumbnails", {}).get("images", [{}])[0].get("url", "")
                if item.get("thumbnails", {}).get("images") else ""
            ),
        })

    return {
        "query": query,
        "count": len(results),
        "results": results,
    }


def download_sketchfab(
    uid: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Download a Sketchfab model archive.

    Parameters
    ----------
    uid : str
        The model UID from Sketchfab.
    """
    token = _get_token()
    headers = {
        "Authorization": f"Token {token}",
        "User-Agent": "OpenForge-MCP/1.0",
    }

    # Request the download URL
    download_url = f"{_API_BASE}/models/{uid}/download"
    try:
        req = urllib.request.Request(download_url, headers=headers)
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            dl_data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code == 401:
            raise RuntimeError(
                "Sketchfab authentication failed. Check your API token."
            ) from exc
        elif exc.code == 403:
            raise RuntimeError(
                "This model is not downloadable or your account lacks permission."
            ) from exc
        raise RuntimeError(
            f"Sketchfab download error {exc.code}: {exc.reason}"
        ) from exc

    # The response contains download links for various formats
    # Prefer glTF format
    gltf_info = dl_data.get("gltf", {})
    if not gltf_info:
        # Fall back to any available format
        for fmt_key in ("glb", "fbx", "obj", "usdz"):
            if fmt_key in dl_data:
                gltf_info = dl_data[fmt_key]
                break

    if not gltf_info or "url" not in gltf_info:
        raise RuntimeError(
            f"No downloadable format found for model '{uid}'. "
            f"Available formats: {list(dl_data.keys())}"
        )

    archive_url = gltf_info["url"]
    archive_path = os.path.join(_get_temp_dir(), f"{uid}.zip")
    _download_file(archive_url, archive_path)

    # Extract the archive
    extract_dir = os.path.join(_get_temp_dir(), uid)
    os.makedirs(extract_dir, exist_ok=True)
    with zipfile.ZipFile(archive_path, "r") as zf:
        zf.extractall(extract_dir)

    # Find the main model file
    model_file = None
    for root, _dirs, files in os.walk(extract_dir):
        for f in files:
            fl = f.lower()
            if fl.endswith((".glb", ".gltf", ".fbx", ".obj")):
                model_file = os.path.join(root, f)
                break
        if model_file:
            break

    return {
        "uid": uid,
        "archive_path": archive_path,
        "extract_dir": extract_dir,
        "model_file": model_file or "",
    }


def import_sketchfab(
    uid: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Download and import a Sketchfab model into the current Blender scene.

    Parameters
    ----------
    uid : str
        The model UID from Sketchfab.
    """
    dl_result = download_sketchfab(uid=uid)
    model_file = dl_result.get("model_file", "")

    if not model_file:
        raise RuntimeError(
            f"No importable model file found in the downloaded archive for '{uid}'"
        )

    before = set(o.name for o in bpy.data.objects)

    fl = model_file.lower()
    if fl.endswith((".glb", ".gltf")):
        bpy.ops.import_scene.gltf(filepath=model_file)
    elif fl.endswith(".fbx"):
        bpy.ops.import_scene.fbx(filepath=model_file)
    elif fl.endswith(".obj"):
        bpy.ops.wm.obj_import(filepath=model_file)
    else:
        raise RuntimeError(f"Unsupported model format: {model_file}")

    after = set(o.name for o in bpy.data.objects)
    new_objects = list(after - before)

    return {
        "uid": uid,
        "model_file": model_file,
        "imported_objects": new_objects,
    }


def get_sketchfab_info(
    uid: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Get detailed information about a Sketchfab model.

    Parameters
    ----------
    uid : str
        The model UID.
    """
    data = _api_get(f"/models/{uid}")
    return {
        "uid": uid,
        "name": data.get("name", ""),
        "description": (data.get("description") or "")[:500],
        "user": data.get("user", {}).get("displayName", ""),
        "like_count": data.get("likeCount", 0),
        "view_count": data.get("viewCount", 0),
        "face_count": data.get("faceCount", 0),
        "vertex_count": data.get("vertexCount", 0),
        "is_downloadable": data.get("isDownloadable", False),
        "license": data.get("license", {}).get("label", ""),
        "created_at": data.get("createdAt", ""),
        "categories": [c.get("name", "") for c in data.get("categories", [])],
        "tags": [t.get("name", "") for t in data.get("tags", [])],
    }


def list_sketchfab_collections(
    **kwargs: Any,
) -> Dict[str, Any]:
    """List the authenticated user's Sketchfab collections."""
    data = _api_get("/me/collections", auth=True)

    collections: List[Dict[str, Any]] = []
    for item in data.get("results", []):
        collections.append({
            "uid": item.get("uid", ""),
            "name": item.get("name", ""),
            "model_count": item.get("modelCount", 0),
            "created_at": item.get("createdAt", ""),
        })

    return {
        "count": len(collections),
        "collections": collections,
    }


def set_sketchfab_token(
    token: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Store a Sketchfab API token for the current session.

    Parameters
    ----------
    token : str
        Your Sketchfab API token. Obtain from https://sketchfab.com/settings/password
    """
    _token_store["token"] = token
    return {
        "status": "ok",
        "message": "Sketchfab API token stored for this session.",
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "search_sketchfab": search_sketchfab,
    "download_sketchfab": download_sketchfab,
    "import_sketchfab": import_sketchfab,
    "get_sketchfab_info": get_sketchfab_info,
    "list_sketchfab_collections": list_sketchfab_collections,
    "set_sketchfab_token": set_sketchfab_token,
}
