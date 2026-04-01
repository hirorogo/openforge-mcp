"""
Batch operation tools for OpenForge MCP.

Provides tools to perform operations on multiple objects at once,
including renaming, transforming, modifier management, material assignment,
exporting, parenting, creation, bone renaming, shape key copying,
and sequential operation execution.
"""

from typing import Any, Dict, List, Optional
import re
import math

import bpy
import mathutils


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


def _resolve_names(names: List[str]) -> List[bpy.types.Object]:
    """Resolve a list of object names, raising on missing objects."""
    result = []
    for n in names:
        result.append(_get_object(n))
    return result


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def batch_rename(
    names: List[str],
    pattern: str = "{name}",
    find: str = "",
    replace: str = "",
    prefix: str = "",
    suffix: str = "",
    start_number: int = 1,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Rename multiple objects using a pattern.

    Parameters
    ----------
    names : list[str]
        Object names to rename.
    pattern : str
        Pattern string. Supports {name} (original), {index} (sequential number),
        {type} (object type).
    find : str
        Substring to find in current name.
    replace : str
        Replacement for *find*.
    prefix : str
        String to prepend.
    suffix : str
        String to append.
    start_number : int
        Starting index for {index} placeholder.
    """
    _ensure_object_mode()
    objects = _resolve_names(names)
    renamed = {}

    for i, obj in enumerate(objects):
        old_name = obj.name
        new_name = pattern.format(
            name=old_name,
            index=start_number + i,
            type=obj.type.lower(),
        )
        if find:
            new_name = new_name.replace(find, replace)
        new_name = prefix + new_name + suffix
        obj.name = new_name
        if obj.data and hasattr(obj.data, "name"):
            obj.data.name = new_name
        renamed[old_name] = obj.name

    return {"renamed": renamed, "count": len(renamed)}


def batch_transform(
    names: List[str],
    location_offset: Optional[List[float]] = None,
    rotation_offset: Optional[List[float]] = None,
    scale_factor: Optional[List[float]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply a transform offset to multiple objects.

    Parameters
    ----------
    names : list[str]
        Object names to transform.
    location_offset : list[float], optional
        XYZ offset added to each object's location.
    rotation_offset : list[float], optional
        XYZ euler rotation offset in radians.
    scale_factor : list[float], optional
        XYZ scale multiplier applied to each object's scale.
    """
    _ensure_object_mode()
    objects = _resolve_names(names)
    results = []

    for obj in objects:
        if location_offset:
            obj.location += mathutils.Vector(location_offset)
        if rotation_offset:
            for axis_idx in range(3):
                obj.rotation_euler[axis_idx] += rotation_offset[axis_idx]
        if scale_factor:
            for axis_idx in range(3):
                obj.scale[axis_idx] *= scale_factor[axis_idx]
        results.append({
            "name": obj.name,
            "location": list(obj.location),
            "rotation": list(obj.rotation_euler),
            "scale": list(obj.scale),
        })

    return {"transformed": results, "count": len(results)}


def batch_add_modifier(
    names: List[str],
    modifier_type: str,
    modifier_name: str = "",
    properties: Optional[Dict[str, Any]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a modifier to multiple objects.

    Parameters
    ----------
    names : list[str]
        Object names to add modifier to.
    modifier_type : str
        Blender modifier type, e.g. SUBSURF, MIRROR, SOLIDIFY, BEVEL, ARRAY.
    modifier_name : str
        Custom name for the modifier.
    properties : dict, optional
        Key-value pairs to set on the modifier after creation.
    """
    _ensure_object_mode()
    objects = _resolve_names(names)
    added = []

    for obj in objects:
        mod = obj.modifiers.new(
            name=modifier_name or modifier_type.title(),
            type=modifier_type,
        )
        if properties:
            for key, val in properties.items():
                if hasattr(mod, key):
                    setattr(mod, key, val)
        added.append({"object": obj.name, "modifier": mod.name, "type": mod.type})

    return {"added": added, "count": len(added)}


def batch_apply_modifier(
    names: List[str],
    modifier_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply a named modifier on multiple objects.

    Parameters
    ----------
    names : list[str]
        Object names.
    modifier_name : str
        Name of the modifier to apply on each object.
    """
    _ensure_object_mode()
    objects = _resolve_names(names)
    applied = []

    for obj in objects:
        mod = obj.modifiers.get(modifier_name)
        if mod is None:
            continue
        _select_only(obj)
        bpy.ops.object.modifier_apply(modifier=modifier_name)
        applied.append(obj.name)

    return {"applied_on": applied, "modifier": modifier_name, "count": len(applied)}


def batch_remove_modifier(
    names: List[str],
    modifier_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Remove a named modifier from multiple objects.

    Parameters
    ----------
    names : list[str]
        Object names.
    modifier_name : str
        Name of the modifier to remove.
    """
    _ensure_object_mode()
    objects = _resolve_names(names)
    removed = []

    for obj in objects:
        mod = obj.modifiers.get(modifier_name)
        if mod is None:
            continue
        obj.modifiers.remove(mod)
        removed.append(obj.name)

    return {"removed_from": removed, "modifier": modifier_name, "count": len(removed)}


def batch_set_material(
    names: List[str],
    material_name: str,
    slot_index: int = 0,
    create_if_missing: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Assign a material to multiple objects.

    Parameters
    ----------
    names : list[str]
        Object names to apply material to.
    material_name : str
        Name of the material. Created if *create_if_missing* is True.
    slot_index : int
        Material slot index to assign to. 0 means the first slot.
    create_if_missing : bool
        Create the material if it does not exist.
    """
    _ensure_object_mode()
    mat = bpy.data.materials.get(material_name)
    if mat is None:
        if create_if_missing:
            mat = bpy.data.materials.new(name=material_name)
            mat.use_nodes = True
        else:
            raise ValueError(f"Material '{material_name}' not found")

    objects = _resolve_names(names)
    assigned = []

    for obj in objects:
        if not hasattr(obj.data, "materials"):
            continue
        while len(obj.material_slots) <= slot_index:
            obj.data.materials.append(None)
        obj.material_slots[slot_index].material = mat
        assigned.append(obj.name)

    return {
        "material": mat.name,
        "assigned_to": assigned,
        "count": len(assigned),
    }


def batch_export(
    names: List[str],
    output_dir: str,
    file_format: str = "FBX",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Export multiple objects to individual files.

    Parameters
    ----------
    names : list[str]
        Object names to export individually.
    output_dir : str
        Directory path for exported files.
    file_format : str
        Export format: FBX, OBJ, GLB, GLTF.
    """
    import os
    _ensure_object_mode()
    os.makedirs(output_dir, exist_ok=True)
    objects = _resolve_names(names)
    exported = []

    ext_map = {"FBX": ".fbx", "OBJ": ".obj", "GLB": ".glb", "GLTF": ".gltf"}
    ext = ext_map.get(file_format.upper(), ".fbx")

    for obj in objects:
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj

        filepath = os.path.join(output_dir, f"{obj.name}{ext}")

        if file_format.upper() == "FBX":
            bpy.ops.export_scene.fbx(
                filepath=filepath, use_selection=True, apply_scale_options="FBX_SCALE_ALL"
            )
        elif file_format.upper() == "OBJ":
            bpy.ops.wm.obj_export(filepath=filepath, export_selected_objects=True)
        elif file_format.upper() in ("GLB", "GLTF"):
            export_fmt = "GLB" if file_format.upper() == "GLB" else "GLTF_SEPARATE"
            bpy.ops.export_scene.gltf(filepath=filepath, use_selection=True, export_format=export_fmt)

        exported.append({"object": obj.name, "file": filepath})

    return {"exported": exported, "count": len(exported)}


def batch_parent(
    child_names: List[str],
    parent_name: str,
    keep_transform: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set a parent for multiple objects.

    Parameters
    ----------
    child_names : list[str]
        Names of objects to become children.
    parent_name : str
        Name of the parent object.
    keep_transform : bool
        If True, maintain world transform of children.
    """
    _ensure_object_mode()
    parent = _get_object(parent_name)
    children = _resolve_names(child_names)
    parented = []

    bpy.ops.object.select_all(action="DESELECT")
    for child in children:
        child.select_set(True)
    parent.select_set(True)
    bpy.context.view_layer.objects.active = parent

    if keep_transform:
        bpy.ops.object.parent_set(type="OBJECT", keep_transform=True)
    else:
        bpy.ops.object.parent_set(type="OBJECT", keep_transform=False)

    for child in children:
        parented.append(child.name)

    return {
        "parent": parent.name,
        "children": parented,
        "count": len(parented),
    }


def batch_create(
    mesh_type: str = "cube",
    count: int = 5,
    spacing: float = 3.0,
    axis: str = "X",
    base_name: str = "",
    size: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create multiple mesh objects arranged along an axis.

    Parameters
    ----------
    mesh_type : str
        Primitive type: cube, sphere, cylinder, plane, cone.
    count : int
        Number of objects to create.
    spacing : float
        Distance between each object along the chosen axis.
    axis : str
        Axis to arrange along: X, Y, or Z.
    base_name : str
        Base name for created objects. Defaults to mesh_type.
    size : float
        Size parameter for the primitive.
    """
    _ensure_object_mode()
    axis_map = {"X": 0, "Y": 1, "Z": 2}
    axis_idx = axis_map.get(axis.upper(), 0)
    created = []

    ops_map = {
        "cube": lambda loc: bpy.ops.mesh.primitive_cube_add(size=size, location=loc),
        "sphere": lambda loc: bpy.ops.mesh.primitive_uv_sphere_add(radius=size / 2, location=loc),
        "cylinder": lambda loc: bpy.ops.mesh.primitive_cylinder_add(radius=size / 2, depth=size, location=loc),
        "plane": lambda loc: bpy.ops.mesh.primitive_plane_add(size=size, location=loc),
        "cone": lambda loc: bpy.ops.mesh.primitive_cone_add(radius1=size / 2, depth=size, location=loc),
    }

    creator = ops_map.get(mesh_type.lower())
    if creator is None:
        raise ValueError(f"Unknown mesh_type '{mesh_type}'")

    name_base = base_name or mesh_type.title()

    for i in range(count):
        loc = [0.0, 0.0, 0.0]
        loc[axis_idx] = i * spacing
        creator(tuple(loc))
        obj = bpy.context.active_object
        obj.name = f"{name_base}_{i + 1:03d}"
        if obj.data:
            obj.data.name = obj.name
        created.append({"name": obj.name, "location": list(obj.location)})

    return {"created": created, "count": len(created)}


def batch_rename_bones(
    armature_name: str,
    find: str = "",
    replace: str = "",
    prefix: str = "",
    suffix: str = "",
    pattern: str = "",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Batch rename bones in an armature.

    Parameters
    ----------
    armature_name : str
        Name of the armature object.
    find : str
        Substring to find in bone names.
    replace : str
        Replacement string.
    prefix : str
        Prefix to add to all bone names.
    suffix : str
        Suffix to add to all bone names.
    pattern : str
        Regex pattern for find. If set, *find* is ignored and regex is used.
    """
    _ensure_object_mode()
    arm_obj = _get_object(armature_name)
    if arm_obj.type != "ARMATURE":
        raise ValueError(f"Object '{armature_name}' is not an armature")

    armature = arm_obj.data
    renamed = {}

    for bone in armature.bones:
        old_name = bone.name
        new_name = old_name
        if pattern:
            new_name = re.sub(pattern, replace, new_name)
        elif find:
            new_name = new_name.replace(find, replace)
        new_name = prefix + new_name + suffix
        if new_name != old_name:
            bone.name = new_name
            renamed[old_name] = bone.name

    return {"armature": arm_obj.name, "renamed": renamed, "count": len(renamed)}


def batch_copy_shapes(
    source_name: str,
    target_names: List[str],
    shape_names: Optional[List[str]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Copy shape keys from a source mesh to multiple target meshes.

    All targets must have the same vertex count as the source, or the transfer
    uses surface deform approach (requires matching topology).

    Parameters
    ----------
    source_name : str
        Name of the source object with shape keys.
    target_names : list[str]
        Names of target objects to receive the shape keys.
    shape_names : list[str], optional
        Specific shape key names to copy. If omitted, copies all non-basis keys.
    """
    _ensure_object_mode()
    source = _get_object(source_name)
    if source.type != "MESH":
        raise ValueError(f"Source '{source_name}' is not a mesh")
    if source.data.shape_keys is None:
        raise ValueError(f"Source '{source_name}' has no shape keys")

    targets = _resolve_names(target_names)
    src_keys = source.data.shape_keys.key_blocks
    keys_to_copy = []
    for kb in src_keys:
        if kb == src_keys[0]:
            continue
        if shape_names and kb.name not in shape_names:
            continue
        keys_to_copy.append(kb)

    results = []
    for target in targets:
        if target.type != "MESH":
            continue
        if target.data.shape_keys is None:
            target.shape_key_add(name="Basis", from_mix=False)

        copied = []
        for src_key in keys_to_copy:
            existing = target.data.shape_keys.key_blocks.get(src_key.name)
            if existing is None:
                new_key = target.shape_key_add(name=src_key.name, from_mix=False)
            else:
                new_key = existing

            src_verts = src_key.data
            tgt_verts = new_key.data
            count = min(len(src_verts), len(tgt_verts))
            for vi in range(count):
                tgt_verts[vi].co = src_verts[vi].co.copy()

            new_key.slider_min = src_key.slider_min
            new_key.slider_max = src_key.slider_max
            new_key.value = src_key.value
            copied.append(new_key.name)

        results.append({"target": target.name, "copied_keys": copied})

    return {"source": source.name, "results": results, "count": len(results)}


def execute_sequence(
    operations: List[Dict[str, Any]],
    **kwargs: Any,
) -> Dict[str, Any]:
    """Execute multiple tool operations in sequence.

    Each operation is a dict with 'tool' (tool name string) and 'params' (dict).
    Operations are executed in order. If any fails, subsequent operations are skipped.

    Parameters
    ----------
    operations : list[dict]
        List of operations. Each has keys 'tool' and 'params'.
    """
    from . import (
        object_tools, mesh_tools, material_tools, scene_tools,
        animation_tools, uv_tools, render_tools, armature_tools,
        lighting_tools, camera_tools, texture_tools,
    )

    all_tools = {}
    for mod in [
        object_tools, mesh_tools, material_tools, scene_tools,
        animation_tools, uv_tools, render_tools, armature_tools,
        lighting_tools, camera_tools, texture_tools,
    ]:
        tools_map = getattr(mod, "TOOLS", {})
        all_tools.update(tools_map)

    # Also include tools from this module
    all_tools.update(TOOLS)

    results = []
    for idx, op in enumerate(operations):
        tool_name = op.get("tool")
        params = op.get("params", {})
        if not tool_name:
            results.append({"step": idx, "error": "Missing 'tool' key"})
            break
        handler = all_tools.get(tool_name)
        if handler is None:
            results.append({
                "step": idx,
                "tool": tool_name,
                "error": f"Unknown tool '{tool_name}'",
            })
            break
        try:
            result = handler(**params)
            results.append({"step": idx, "tool": tool_name, "result": result})
        except Exception as exc:
            results.append({"step": idx, "tool": tool_name, "error": str(exc)})
            break

    return {
        "completed": len(results),
        "total": len(operations),
        "results": results,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "batch_rename": batch_rename,
    "batch_transform": batch_transform,
    "batch_add_modifier": batch_add_modifier,
    "batch_apply_modifier": batch_apply_modifier,
    "batch_remove_modifier": batch_remove_modifier,
    "batch_set_material": batch_set_material,
    "batch_export": batch_export,
    "batch_parent": batch_parent,
    "batch_create": batch_create,
    "batch_rename_bones": batch_rename_bones,
    "batch_copy_shapes": batch_copy_shapes,
    "execute_sequence": execute_sequence,
}
