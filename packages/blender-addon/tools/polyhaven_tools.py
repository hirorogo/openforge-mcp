"""
Poly Haven integration tools for OpenForge MCP.

Provides search and download of free CC0 assets (models, HDRIs, textures)
from polyhaven.com using their public API.
"""

import json
import os
import tempfile
import urllib.request
import urllib.error
import urllib.parse
from typing import Any, Dict, List, Optional

import bpy


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_API_BASE = "https://api.polyhaven.com"
_DL_BASE = "https://dl.polyhaven.org/file/ph-assets"
_TIMEOUT = 30  # seconds


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _api_get(endpoint: str, params: Optional[Dict[str, str]] = None) -> Any:
    """Perform a GET request to the Poly Haven API and return parsed JSON."""
    url = f"{_API_BASE}{endpoint}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "OpenForge-MCP/1.0"})
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise RuntimeError(
            f"Poly Haven API error {exc.code} for {url}: {exc.reason}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(
            f"Network error contacting Poly Haven API: {exc.reason}"
        ) from exc


def _download_file(url: str, dest_path: str) -> str:
    """Download a file from *url* to *dest_path*. Returns the path."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "OpenForge-MCP/1.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
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
    """Return a persistent temp directory for Poly Haven downloads."""
    d = os.path.join(tempfile.gettempdir(), "openforge_polyhaven")
    os.makedirs(d, exist_ok=True)
    return d


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def search_polyhaven(
    query: str = "",
    asset_type: str = "all",
    categories: Optional[str] = None,
    limit: int = 20,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Search Poly Haven assets by keyword and type.

    Parameters
    ----------
    query : str
        Search keyword.
    asset_type : str
        One of: all, hdris, textures, models.
    categories : str, optional
        Comma-separated category filter.
    limit : int
        Maximum number of results to return (default 20).
    """
    params: Dict[str, str] = {}
    if asset_type != "all":
        params["type"] = asset_type
    if categories:
        params["categories"] = categories

    data = _api_get("/assets", params)

    results: List[Dict[str, Any]] = []
    query_lower = query.lower()
    for asset_id, info in data.items():
        if query_lower and query_lower not in asset_id.lower() and query_lower not in info.get("name", "").lower():
            continue
        results.append({
            "id": asset_id,
            "name": info.get("name", asset_id),
            "type": str(info.get("type", "unknown")),
            "categories": info.get("categories", []),
        })
        if len(results) >= limit:
            break

    return {
        "count": len(results),
        "assets": results,
    }


def download_polyhaven_model(
    asset_id: str,
    resolution: str = "1k",
    file_format: str = "gltf",
    import_to_scene: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Download and optionally import a 3D model from Poly Haven.

    Parameters
    ----------
    asset_id : str
        The Poly Haven asset identifier (e.g. 'park_bench').
    resolution : str
        Resolution tier: 1k, 2k, 4k.
    file_format : str
        File format: gltf, fbx, or blend.
    import_to_scene : bool
        If True, import the model into the current Blender scene.
    """
    files_data = _api_get(f"/files/{asset_id}")

    fmt_key = file_format.lower()
    if fmt_key == "gltf":
        fmt_key = "gltf"
    elif fmt_key == "fbx":
        fmt_key = "fbx"
    elif fmt_key == "blend":
        fmt_key = "blend"

    # Navigate the files structure to find the download URL
    model_files = files_data.get(fmt_key, {})
    res_files = model_files.get(resolution, {})

    if not res_files:
        available_res = list(model_files.keys()) if model_files else []
        available_fmt = list(files_data.keys())
        raise ValueError(
            f"Resolution '{resolution}' not found for format '{file_format}' "
            f"of asset '{asset_id}'. Available formats: {available_fmt}, "
            f"available resolutions: {available_res}"
        )

    # Get the URL from the first file entry
    file_url = None
    file_name = None
    if isinstance(res_files, dict):
        for fname, finfo in res_files.items():
            if isinstance(finfo, dict) and "url" in finfo:
                file_url = finfo["url"]
                file_name = fname
                break

    if not file_url:
        raise RuntimeError(
            f"Could not find download URL for asset '{asset_id}' "
            f"({file_format}, {resolution})"
        )

    ext_map = {"gltf": ".glb", "fbx": ".fbx", "blend": ".blend"}
    ext = ext_map.get(fmt_key, ".glb")
    if file_name and "." in file_name:
        ext = "." + file_name.rsplit(".", 1)[-1]

    dest = os.path.join(_get_temp_dir(), f"{asset_id}{ext}")
    _download_file(file_url, dest)

    result: Dict[str, Any] = {
        "asset_id": asset_id,
        "file_path": dest,
        "format": file_format,
        "resolution": resolution,
        "imported": False,
    }

    if import_to_scene:
        before = set(o.name for o in bpy.data.objects)
        if ext in (".glb", ".gltf"):
            bpy.ops.import_scene.gltf(filepath=dest)
        elif ext == ".fbx":
            bpy.ops.import_scene.fbx(filepath=dest)
        elif ext == ".blend":
            with bpy.data.libraries.load(dest, link=False) as (data_from, data_to):
                data_to.objects = data_from.objects
            for obj in data_to.objects:
                if obj is not None:
                    bpy.context.collection.objects.link(obj)
        after = set(o.name for o in bpy.data.objects)
        new_objects = list(after - before)
        result["imported"] = True
        result["imported_objects"] = new_objects

    return result


def download_polyhaven_hdri(
    asset_id: str,
    resolution: str = "1k",
    apply_to_world: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Download an HDRI from Poly Haven and optionally set as world environment.

    Parameters
    ----------
    asset_id : str
        The HDRI asset identifier (e.g. 'rosendal_plains').
    resolution : str
        Resolution: 1k, 2k, 4k, 8k.
    apply_to_world : bool
        If True, set the HDRI as the world environment texture.
    """
    files_data = _api_get(f"/files/{asset_id}")

    hdri_files = files_data.get("hdri", {})
    res_files = hdri_files.get(resolution, {})

    if not res_files:
        available_res = list(hdri_files.keys()) if hdri_files else []
        raise ValueError(
            f"Resolution '{resolution}' not found for HDRI '{asset_id}'. "
            f"Available resolutions: {available_res}"
        )

    file_url = None
    if isinstance(res_files, dict):
        for fname, finfo in res_files.items():
            if isinstance(finfo, dict) and "url" in finfo:
                file_url = finfo["url"]
                break

    if not file_url:
        raise RuntimeError(f"Could not find download URL for HDRI '{asset_id}'")

    dest = os.path.join(_get_temp_dir(), f"{asset_id}_{resolution}.hdr")
    _download_file(file_url, dest)

    result: Dict[str, Any] = {
        "asset_id": asset_id,
        "file_path": dest,
        "resolution": resolution,
        "applied_to_world": False,
    }

    if apply_to_world:
        _apply_hdri_to_world(dest)
        result["applied_to_world"] = True

    return result


def _apply_hdri_to_world(hdri_path: str) -> None:
    """Internal helper to set an HDRI as the world environment."""
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world

    world.use_nodes = True
    tree = world.node_tree
    tree.nodes.clear()

    node_bg = tree.nodes.new("ShaderNodeBackground")
    node_env = tree.nodes.new("ShaderNodeTexEnvironment")
    node_output = tree.nodes.new("ShaderNodeOutputWorld")

    node_env.image = bpy.data.images.load(hdri_path)
    node_env.location = (-300, 300)
    node_bg.location = (0, 300)
    node_output.location = (200, 300)

    tree.links.new(node_env.outputs["Color"], node_bg.inputs["Color"])
    tree.links.new(node_bg.outputs["Background"], node_output.inputs["Surface"])


def download_polyhaven_texture(
    asset_id: str,
    resolution: str = "1k",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Download a texture set from Poly Haven (diffuse, normal, roughness, etc.).

    Parameters
    ----------
    asset_id : str
        The texture asset identifier (e.g. 'brick_wall_001').
    resolution : str
        Resolution: 1k, 2k, 4k, 8k.
    """
    files_data = _api_get(f"/files/{asset_id}")

    # Texture maps are nested by map type
    tex_types = ["Diffuse", "nor_gl", "Rough", "AO", "Displacement", "arm"]
    downloaded: Dict[str, str] = {}

    for tex_type in tex_types:
        tex_data = files_data.get(tex_type, {})
        res_data = tex_data.get(resolution, {})
        if not res_data:
            continue

        file_url = None
        file_ext = "png"
        if isinstance(res_data, dict):
            for fname, finfo in res_data.items():
                if isinstance(finfo, dict) and "url" in finfo:
                    file_url = finfo["url"]
                    if "." in fname:
                        file_ext = fname.rsplit(".", 1)[-1]
                    break

        if file_url:
            dest = os.path.join(
                _get_temp_dir(),
                f"{asset_id}_{tex_type}_{resolution}.{file_ext}",
            )
            _download_file(file_url, dest)
            downloaded[tex_type] = dest

    if not downloaded:
        available = list(files_data.keys())
        raise RuntimeError(
            f"No texture maps found for '{asset_id}' at resolution '{resolution}'. "
            f"Available keys: {available}"
        )

    return {
        "asset_id": asset_id,
        "resolution": resolution,
        "downloaded_maps": downloaded,
    }


def apply_polyhaven_hdri(
    file_path: str,
    strength: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply a previously downloaded HDRI file to the world environment.

    Parameters
    ----------
    file_path : str
        Path to the .hdr or .exr file on disk.
    strength : float
        Background strength multiplier.
    """
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"HDRI file not found: {file_path}")

    _apply_hdri_to_world(file_path)

    # Adjust strength
    world = bpy.context.scene.world
    if world and world.use_nodes:
        for node in world.node_tree.nodes:
            if node.type == "BACKGROUND":
                node.inputs["Strength"].default_value = strength
                break

    return {
        "file_path": file_path,
        "strength": strength,
        "applied": True,
    }


def apply_polyhaven_texture(
    object_name: str,
    texture_maps: Dict[str, str],
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply downloaded Poly Haven texture maps to a material on an object.

    Parameters
    ----------
    object_name : str
        Name of the Blender object to apply textures to.
    texture_maps : dict
        Mapping of map type to file path, e.g.
        {"Diffuse": "/path/to/diff.png", "nor_gl": "/path/to/nor.png"}.
    """
    obj = bpy.data.objects.get(object_name)
    if obj is None:
        available = [o.name for o in bpy.data.objects]
        raise ValueError(
            f"Object '{object_name}' not found. Available: {available}"
        )

    # Ensure material
    if not obj.data.materials:
        mat = bpy.data.materials.new(name=f"{object_name}_PolyHaven")
        obj.data.materials.append(mat)
    else:
        mat = obj.data.materials[0]

    mat.use_nodes = True
    tree = mat.node_tree
    bsdf = None
    for node in tree.nodes:
        if node.type == "BSDF_PRINCIPLED":
            bsdf = node
            break
    if bsdf is None:
        bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")

    applied_maps: List[str] = []
    x_offset = -600

    for map_type, file_path in texture_maps.items():
        if not os.path.isfile(file_path):
            continue

        tex_node = tree.nodes.new("ShaderNodeTexImage")
        tex_node.image = bpy.data.images.load(file_path)
        tex_node.location = (x_offset, 300 - len(applied_maps) * 300)

        map_lower = map_type.lower()
        if "diffuse" in map_lower or "diff" in map_lower or "color" in map_lower:
            tree.links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])
        elif "nor" in map_lower or "normal" in map_lower:
            tex_node.image.colorspace_settings.name = "Non-Color"
            normal_map = tree.nodes.new("ShaderNodeNormalMap")
            normal_map.location = (x_offset + 300, 300 - len(applied_maps) * 300)
            tree.links.new(tex_node.outputs["Color"], normal_map.inputs["Color"])
            tree.links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])
        elif "rough" in map_lower:
            tex_node.image.colorspace_settings.name = "Non-Color"
            tree.links.new(tex_node.outputs["Color"], bsdf.inputs["Roughness"])
        elif "ao" in map_lower or "ambient" in map_lower:
            # AO is typically multiplied into the diffuse via a MixRGB node,
            # but for simplicity we skip auto-wiring here.
            pass
        elif "disp" in map_lower:
            tex_node.image.colorspace_settings.name = "Non-Color"
            disp_node = tree.nodes.new("ShaderNodeDisplacement")
            disp_node.location = (x_offset + 300, -600)
            tree.links.new(tex_node.outputs["Color"], disp_node.inputs["Height"])
            output_node = None
            for n in tree.nodes:
                if n.type == "OUTPUT_MATERIAL":
                    output_node = n
                    break
            if output_node:
                tree.links.new(disp_node.outputs["Displacement"], output_node.inputs["Displacement"])
        elif "arm" in map_lower:
            tex_node.image.colorspace_settings.name = "Non-Color"
            # ARM = AO + Roughness + Metallic packed texture
            sep = tree.nodes.new("ShaderNodeSeparateColor")
            sep.location = (x_offset + 300, 300 - len(applied_maps) * 300)
            tree.links.new(tex_node.outputs["Color"], sep.inputs["Color"])
            tree.links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])
            tree.links.new(sep.outputs["Blue"], bsdf.inputs["Metallic"])

        applied_maps.append(map_type)

    return {
        "object_name": object_name,
        "material_name": mat.name,
        "applied_maps": applied_maps,
    }


def list_polyhaven_categories(
    asset_type: str = "all",
    **kwargs: Any,
) -> Dict[str, Any]:
    """List available Poly Haven categories.

    Parameters
    ----------
    asset_type : str
        Filter by type: all, hdris, textures, models.
    """
    data = _api_get("/categories")

    if asset_type != "all" and isinstance(data, dict):
        type_data = data.get(asset_type, data)
        if isinstance(type_data, dict):
            categories = list(type_data.keys())
        else:
            categories = list(data.keys())
    elif isinstance(data, dict):
        categories = list(data.keys())
    else:
        categories = []

    return {
        "asset_type": asset_type,
        "categories": categories,
        "count": len(categories),
    }


def get_polyhaven_info(
    asset_id: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Get detailed information about a specific Poly Haven asset.

    Parameters
    ----------
    asset_id : str
        The asset identifier.
    """
    data = _api_get(f"/info/{asset_id}")
    return {
        "asset_id": asset_id,
        "name": data.get("name", asset_id),
        "type": str(data.get("type", "unknown")),
        "categories": data.get("categories", []),
        "tags": data.get("tags", []),
        "authors": data.get("authors", {}),
        "date_published": data.get("date_published", ""),
        "download_count": data.get("download_count", 0),
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "search_polyhaven": search_polyhaven,
    "download_polyhaven_model": download_polyhaven_model,
    "download_polyhaven_hdri": download_polyhaven_hdri,
    "download_polyhaven_texture": download_polyhaven_texture,
    "apply_polyhaven_hdri": apply_polyhaven_hdri,
    "apply_polyhaven_texture": apply_polyhaven_texture,
    "list_polyhaven_categories": list_polyhaven_categories,
    "get_polyhaven_info": get_polyhaven_info,
}
