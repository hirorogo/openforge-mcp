"""
Texture baking tools for OpenForge MCP.

Provides tools for baking various texture maps including diffuse, normal,
ambient occlusion, emission, combined, high-to-low-poly, curvature,
and roughness. Also supports cage setup and texture set export.
"""

from typing import Any, Dict, List, Optional

import bpy
import os


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_object(name: str) -> bpy.types.Object:
    obj = bpy.data.objects.get(name)
    if obj is None:
        available = [o.name for o in bpy.data.objects]
        raise ValueError(
            f"Object '{name}' not found. Available objects: {available}"
        )
    return obj


def _select_only(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def _ensure_object_mode() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def _ensure_cycles() -> None:
    if bpy.context.scene.render.engine != "CYCLES":
        bpy.context.scene.render.engine = "CYCLES"


def _prepare_bake_image(name: str, width: int, height: int) -> bpy.types.Image:
    """Create or get a bake target image and assign it to the active material."""
    img = bpy.data.images.get(name)
    if img is not None:
        if img.size[0] != width or img.size[1] != height:
            bpy.data.images.remove(img)
            img = None
    if img is None:
        img = bpy.data.images.new(name, width=width, height=height, alpha=True)
    img.colorspace_settings.name = "sRGB"
    return img


def _assign_bake_image_to_material(obj: bpy.types.Object, img: bpy.types.Image) -> None:
    """For each material on the object, create/select an Image Texture node pointing to img."""
    for slot in obj.material_slots:
        mat = slot.material
        if mat is None:
            continue
        mat.use_nodes = True
        tree = mat.node_tree
        bake_node = None
        for node in tree.nodes:
            if node.type == "TEX_IMAGE" and node.image == img:
                bake_node = node
                break
        if bake_node is None:
            bake_node = tree.nodes.new(type="ShaderNodeTexImage")
            bake_node.name = "BakeTarget"
            bake_node.image = img
            bake_node.location = (-400, 0)
        tree.nodes.active = bake_node


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def bake_diffuse(
    name: str,
    image_name: str = "BakeDiffuse",
    width: int = 1024,
    height: int = 1024,
    samples: int = 64,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bake diffuse/albedo color map for an object.

    Parameters
    ----------
    name : str
        Object name to bake from.
    image_name : str
        Name of the bake result image.
    width, height : int
        Resolution of the bake target.
    samples : int
        Number of render samples for baking.
    """
    _ensure_object_mode()
    _ensure_cycles()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")
    _select_only(obj)

    img = _prepare_bake_image(image_name, width, height)
    _assign_bake_image_to_material(obj, img)

    bpy.context.scene.cycles.samples = samples
    bpy.context.scene.render.bake.use_pass_direct = False
    bpy.context.scene.render.bake.use_pass_indirect = False
    bpy.context.scene.render.bake.use_pass_color = True
    bpy.ops.object.bake(type="DIFFUSE")

    return {
        "object_name": obj.name,
        "image_name": img.name,
        "resolution": [width, height],
        "bake_type": "DIFFUSE",
    }


def bake_normal(
    name: str,
    image_name: str = "BakeNormal",
    width: int = 1024,
    height: int = 1024,
    samples: int = 64,
    normal_space: str = "TANGENT",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bake normal map for an object.

    Parameters
    ----------
    name : str
        Object name to bake from.
    image_name : str
        Name of the bake result image.
    width, height : int
        Resolution of the bake target.
    samples : int
        Number of render samples.
    normal_space : str
        TANGENT or OBJECT space normals.
    """
    _ensure_object_mode()
    _ensure_cycles()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")
    _select_only(obj)

    img = _prepare_bake_image(image_name, width, height)
    img.colorspace_settings.name = "Non-Color"
    _assign_bake_image_to_material(obj, img)

    bpy.context.scene.cycles.samples = samples
    bpy.context.scene.render.bake.normal_space = normal_space
    bpy.ops.object.bake(type="NORMAL")

    return {
        "object_name": obj.name,
        "image_name": img.name,
        "resolution": [width, height],
        "bake_type": "NORMAL",
        "normal_space": normal_space,
    }


def bake_ao(
    name: str,
    image_name: str = "BakeAO",
    width: int = 1024,
    height: int = 1024,
    samples: int = 128,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bake ambient occlusion map for an object.

    Parameters
    ----------
    name : str
        Object name to bake from.
    image_name : str
        Name of the bake result image.
    width, height : int
        Resolution of the bake target.
    samples : int
        Number of render samples. Higher values reduce noise.
    """
    _ensure_object_mode()
    _ensure_cycles()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")
    _select_only(obj)

    img = _prepare_bake_image(image_name, width, height)
    img.colorspace_settings.name = "Non-Color"
    _assign_bake_image_to_material(obj, img)

    bpy.context.scene.cycles.samples = samples
    bpy.ops.object.bake(type="AO")

    return {
        "object_name": obj.name,
        "image_name": img.name,
        "resolution": [width, height],
        "bake_type": "AO",
    }


def bake_emission(
    name: str,
    image_name: str = "BakeEmission",
    width: int = 1024,
    height: int = 1024,
    samples: int = 64,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bake emission map for an object.

    Parameters
    ----------
    name : str
        Object name to bake from.
    image_name : str
        Name of the bake result image.
    width, height : int
        Resolution of the bake target.
    samples : int
        Number of render samples.
    """
    _ensure_object_mode()
    _ensure_cycles()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")
    _select_only(obj)

    img = _prepare_bake_image(image_name, width, height)
    _assign_bake_image_to_material(obj, img)

    bpy.context.scene.cycles.samples = samples
    bpy.ops.object.bake(type="EMIT")

    return {
        "object_name": obj.name,
        "image_name": img.name,
        "resolution": [width, height],
        "bake_type": "EMIT",
    }


def bake_combined(
    name: str,
    image_name: str = "BakeCombined",
    width: int = 1024,
    height: int = 1024,
    samples: int = 128,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bake all render passes combined into a single image.

    Parameters
    ----------
    name : str
        Object name to bake from.
    image_name : str
        Name of the bake result image.
    width, height : int
        Resolution of the bake target.
    samples : int
        Number of render samples.
    """
    _ensure_object_mode()
    _ensure_cycles()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")
    _select_only(obj)

    img = _prepare_bake_image(image_name, width, height)
    _assign_bake_image_to_material(obj, img)

    bpy.context.scene.cycles.samples = samples
    bpy.ops.object.bake(type="COMBINED")

    return {
        "object_name": obj.name,
        "image_name": img.name,
        "resolution": [width, height],
        "bake_type": "COMBINED",
    }


def bake_from_highpoly(
    lowpoly_name: str,
    highpoly_name: str,
    bake_type: str = "NORMAL",
    image_name: str = "BakeHighToLow",
    width: int = 2048,
    height: int = 2048,
    samples: int = 128,
    ray_distance: float = 0.1,
    cage_extrusion: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bake texture data from a high-poly mesh onto a low-poly mesh.

    Parameters
    ----------
    lowpoly_name : str
        Name of the low-poly target object.
    highpoly_name : str
        Name of the high-poly source object.
    bake_type : str
        Type of bake: NORMAL, DIFFUSE, AO, COMBINED, EMIT, ROUGHNESS.
    image_name : str
        Name of the result image.
    width, height : int
        Resolution of the bake target.
    samples : int
        Render samples for baking.
    ray_distance : float
        Maximum ray distance for projection.
    cage_extrusion : float
        Extrusion distance for cage-based baking.
    """
    _ensure_object_mode()
    _ensure_cycles()

    lowpoly = _get_object(lowpoly_name)
    highpoly = _get_object(highpoly_name)
    if lowpoly.type != "MESH" or highpoly.type != "MESH":
        raise ValueError("Both objects must be meshes")

    img = _prepare_bake_image(image_name, width, height)
    if bake_type in ("NORMAL", "AO", "ROUGHNESS"):
        img.colorspace_settings.name = "Non-Color"
    _assign_bake_image_to_material(lowpoly, img)

    bpy.ops.object.select_all(action="DESELECT")
    highpoly.select_set(True)
    lowpoly.select_set(True)
    bpy.context.view_layer.objects.active = lowpoly

    bpy.context.scene.cycles.samples = samples
    bpy.context.scene.render.bake.use_selected_to_active = True
    bpy.context.scene.render.bake.max_ray_distance = ray_distance
    bpy.context.scene.render.bake.cage_extrusion = cage_extrusion

    if bake_type == "DIFFUSE":
        bpy.context.scene.render.bake.use_pass_direct = False
        bpy.context.scene.render.bake.use_pass_indirect = False
        bpy.context.scene.render.bake.use_pass_color = True

    bpy.ops.object.bake(type=bake_type)

    bpy.context.scene.render.bake.use_selected_to_active = False

    return {
        "lowpoly": lowpoly.name,
        "highpoly": highpoly.name,
        "image_name": img.name,
        "resolution": [width, height],
        "bake_type": bake_type,
    }


def setup_bake_cage(
    lowpoly_name: str,
    extrusion: float = 0.05,
    cage_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a cage mesh for baking by duplicating and inflating the low-poly mesh.

    Parameters
    ----------
    lowpoly_name : str
        Name of the low-poly object.
    extrusion : float
        Amount to inflate the cage outward along normals.
    cage_name : str, optional
        Name for the cage object. Defaults to '<lowpoly_name>_cage'.
    """
    _ensure_object_mode()
    obj = _get_object(lowpoly_name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{lowpoly_name}' is not a mesh")

    _select_only(obj)
    bpy.ops.object.duplicate(linked=False)
    cage = bpy.context.active_object

    final_name = cage_name or f"{lowpoly_name}_cage"
    cage.name = final_name
    if cage.data:
        cage.data.name = final_name

    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.transform.shrink_fatten(value=extrusion)
    bpy.ops.object.mode_set(mode="OBJECT")

    cage.display_type = "WIRE"

    return {
        "cage_name": cage.name,
        "source_object": lowpoly_name,
        "extrusion": extrusion,
    }


def export_texture_set(
    image_names: List[str],
    output_dir: str,
    file_format: str = "PNG",
    color_depth: str = "8",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Export multiple baked texture images to disk.

    Parameters
    ----------
    image_names : list[str]
        Names of images in bpy.data.images to export.
    output_dir : str
        Directory path to save files into.
    file_format : str
        Image format: PNG, TARGA, OPEN_EXR, JPEG.
    color_depth : str
        Bit depth: '8', '16', or '32'.
    """
    os.makedirs(output_dir, exist_ok=True)
    exported = []
    ext_map = {"PNG": ".png", "TARGA": ".tga", "OPEN_EXR": ".exr", "JPEG": ".jpg"}
    ext = ext_map.get(file_format, ".png")

    for img_name in image_names:
        img = bpy.data.images.get(img_name)
        if img is None:
            raise ValueError(f"Image '{img_name}' not found in bpy.data.images")
        filepath = os.path.join(output_dir, f"{img_name}{ext}")
        img.filepath_raw = filepath
        img.file_format = file_format
        if hasattr(img, "use_half_precision"):
            img.use_half_precision = color_depth == "16"
        img.save_render(filepath)
        exported.append(filepath)

    return {
        "exported_files": exported,
        "file_format": file_format,
        "output_dir": output_dir,
    }


def bake_curvature(
    name: str,
    image_name: str = "BakeCurvature",
    width: int = 1024,
    height: int = 1024,
    samples: int = 64,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bake a curvature map using a Geometry node shader setup.

    Creates a temporary material that outputs pointiness as the curvature signal,
    bakes it, then restores the original material.

    Parameters
    ----------
    name : str
        Object name to bake from.
    image_name : str
        Name of the bake result image.
    width, height : int
        Resolution of the bake target.
    samples : int
        Number of render samples.
    """
    _ensure_object_mode()
    _ensure_cycles()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")
    _select_only(obj)

    img = _prepare_bake_image(image_name, width, height)
    img.colorspace_settings.name = "Non-Color"

    original_materials = [slot.material for slot in obj.material_slots]
    had_materials = len(original_materials) > 0

    curv_mat = bpy.data.materials.new(name="__CurvatureBakeMat")
    curv_mat.use_nodes = True
    tree = curv_mat.node_tree
    for node in tree.nodes:
        tree.nodes.remove(node)

    geom_node = tree.nodes.new(type="ShaderNodeNewGeometry")
    geom_node.location = (-400, 0)

    color_ramp = tree.nodes.new(type="ShaderNodeValToRGB")
    color_ramp.location = (-200, 0)
    color_ramp.color_ramp.elements[0].position = 0.4
    color_ramp.color_ramp.elements[1].position = 0.6

    emission_node = tree.nodes.new(type="ShaderNodeEmission")
    emission_node.location = (0, 0)

    output_node = tree.nodes.new(type="ShaderNodeOutputMaterial")
    output_node.location = (200, 0)

    tex_node = tree.nodes.new(type="ShaderNodeTexImage")
    tex_node.image = img
    tex_node.location = (-400, -200)

    tree.links.new(geom_node.outputs["Pointiness"], color_ramp.inputs["Fac"])
    tree.links.new(color_ramp.outputs["Color"], emission_node.inputs["Color"])
    tree.links.new(emission_node.outputs["Emission"], output_node.inputs["Surface"])
    tree.nodes.active = tex_node

    if had_materials:
        for i in range(len(obj.material_slots)):
            obj.material_slots[i].material = curv_mat
    else:
        obj.data.materials.append(curv_mat)

    bpy.context.scene.cycles.samples = samples
    bpy.ops.object.bake(type="EMIT")

    if had_materials:
        for i, mat in enumerate(original_materials):
            obj.material_slots[i].material = mat
    else:
        obj.data.materials.pop()

    bpy.data.materials.remove(curv_mat)

    return {
        "object_name": obj.name,
        "image_name": img.name,
        "resolution": [width, height],
        "bake_type": "CURVATURE",
    }


def bake_roughness(
    name: str,
    image_name: str = "BakeRoughness",
    width: int = 1024,
    height: int = 1024,
    samples: int = 64,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Bake roughness values from Principled BSDF materials.

    Creates a temporary emission shader that reads roughness from the existing
    Principled BSDF, bakes it, then restores original materials.

    Parameters
    ----------
    name : str
        Object name to bake from.
    image_name : str
        Name of the bake result image.
    width, height : int
        Resolution of the bake target.
    samples : int
        Number of render samples.
    """
    _ensure_object_mode()
    _ensure_cycles()
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh")
    _select_only(obj)

    img = _prepare_bake_image(image_name, width, height)
    img.colorspace_settings.name = "Non-Color"

    saved_links = {}
    saved_defaults = {}

    for slot_idx, slot in enumerate(obj.material_slots):
        mat = slot.material
        if mat is None or not mat.use_nodes:
            continue
        tree = mat.node_tree
        principled = None
        for node in tree.nodes:
            if node.type == "BSDF_PRINCIPLED":
                principled = node
                break
        if principled is None:
            continue

        output_node = None
        for node in tree.nodes:
            if node.type == "OUTPUT_MATERIAL" and node.is_active_output:
                output_node = node
                break
        if output_node is None:
            continue

        saved_links[slot_idx] = []
        for link in tree.links:
            if link.to_node == output_node and link.to_socket.name == "Surface":
                saved_links[slot_idx].append(
                    (link.from_node.name, link.from_socket.name)
                )

        emit_node = tree.nodes.new(type="ShaderNodeEmission")
        emit_node.name = "__RoughBakeEmit"
        emit_node.location = (principled.location[0] + 200, principled.location[1] - 200)

        roughness_input = principled.inputs.get("Roughness")
        if roughness_input and roughness_input.links:
            from_socket = roughness_input.links[0].from_socket
            tree.links.new(from_socket, emit_node.inputs["Color"])
        else:
            val = roughness_input.default_value if roughness_input else 0.5
            saved_defaults[slot_idx] = val
            emit_node.inputs["Color"].default_value = (val, val, val, 1.0)

        for link in list(tree.links):
            if link.to_node == output_node and link.to_socket.name == "Surface":
                tree.links.remove(link)
        tree.links.new(emit_node.outputs["Emission"], output_node.inputs["Surface"])

        tex_node = tree.nodes.new(type="ShaderNodeTexImage")
        tex_node.name = "__RoughBakeTex"
        tex_node.image = img
        tex_node.location = (emit_node.location[0], emit_node.location[1] - 200)
        tree.nodes.active = tex_node

    bpy.context.scene.cycles.samples = samples
    bpy.ops.object.bake(type="EMIT")

    for slot_idx, slot in enumerate(obj.material_slots):
        mat = slot.material
        if mat is None or not mat.use_nodes:
            continue
        tree = mat.node_tree

        emit_node = tree.nodes.get("__RoughBakeEmit")
        tex_node = tree.nodes.get("__RoughBakeTex")
        if emit_node:
            tree.nodes.remove(emit_node)
        if tex_node:
            tree.nodes.remove(tex_node)

        output_node = None
        for node in tree.nodes:
            if node.type == "OUTPUT_MATERIAL" and node.is_active_output:
                output_node = node
                break

        if output_node and slot_idx in saved_links:
            for from_name, from_socket_name in saved_links[slot_idx]:
                from_node = tree.nodes.get(from_name)
                if from_node:
                    from_socket = from_node.outputs.get(from_socket_name)
                    if from_socket:
                        tree.links.new(from_socket, output_node.inputs["Surface"])

    return {
        "object_name": obj.name,
        "image_name": img.name,
        "resolution": [width, height],
        "bake_type": "ROUGHNESS",
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "bake_diffuse": bake_diffuse,
    "bake_normal": bake_normal,
    "bake_ao": bake_ao,
    "bake_emission": bake_emission,
    "bake_combined": bake_combined,
    "bake_from_highpoly": bake_from_highpoly,
    "setup_bake_cage": setup_bake_cage,
    "export_texture_set": export_texture_set,
    "bake_curvature": bake_curvature,
    "bake_roughness": bake_roughness,
}
