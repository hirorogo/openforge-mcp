"""
Collection and scene organization tools for OpenForge MCP.

Provides tools for creating, managing, and organizing Blender collections,
including moving objects between collections, toggling visibility, merging
collections, and auto-organizing objects by type.
"""

from typing import Any, Dict, List, Optional

import bpy


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


def _ensure_object_mode() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def _find_collection(name: str) -> bpy.types.Collection:
    """Find a collection by name in bpy.data.collections."""
    coll = bpy.data.collections.get(name)
    if coll is None:
        available = [c.name for c in bpy.data.collections]
        raise ValueError(
            f"Collection '{name}' not found. Available: {available}"
        )
    return coll


def _get_collection_hierarchy(coll: bpy.types.Collection, depth: int = 0) -> Dict[str, Any]:
    """Build a nested dict representing the collection hierarchy."""
    return {
        "name": coll.name,
        "objects": [obj.name for obj in coll.objects],
        "object_count": len(coll.objects),
        "children": [
            _get_collection_hierarchy(child, depth + 1)
            for child in coll.children
        ],
    }


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def create_collection(
    name: str,
    parent_name: Optional[str] = None,
    color_tag: str = "NONE",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a new collection in the scene.

    Parameters
    ----------
    name : str
        Name for the new collection.
    parent_name : str, optional
        Parent collection name. If omitted, adds to the scene root collection.
    color_tag : str
        Color tag: NONE, COLOR_01 through COLOR_08.
    """
    _ensure_object_mode()

    existing = bpy.data.collections.get(name)
    if existing is not None:
        raise ValueError(f"Collection '{name}' already exists")

    new_coll = bpy.data.collections.new(name=name)
    new_coll.color_tag = color_tag

    if parent_name:
        parent = _find_collection(parent_name)
        parent.children.link(new_coll)
    else:
        bpy.context.scene.collection.children.link(new_coll)

    return {
        "collection_name": new_coll.name,
        "parent": parent_name or "Scene Collection",
        "color_tag": color_tag,
    }


def move_to_collection(
    names: List[str],
    collection_name: str,
    remove_from_others: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Move objects into a collection.

    Parameters
    ----------
    names : list[str]
        Object names to move.
    collection_name : str
        Target collection name.
    remove_from_others : bool
        If True, unlink objects from all other collections first.
    """
    _ensure_object_mode()
    target_coll = _find_collection(collection_name)
    moved = []

    for obj_name in names:
        obj = _get_object(obj_name)

        if remove_from_others:
            for coll in list(obj.users_collection):
                coll.objects.unlink(obj)

        if obj.name not in target_coll.objects:
            target_coll.objects.link(obj)

        moved.append(obj.name)

    return {
        "collection": target_coll.name,
        "moved_objects": moved,
        "count": len(moved),
    }


def list_collections(
    include_hierarchy: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """List all collections in the current scene.

    Parameters
    ----------
    include_hierarchy : bool
        If True, return nested hierarchy. Otherwise, flat list.
    """
    _ensure_object_mode()

    if include_hierarchy:
        root = bpy.context.scene.collection
        hierarchy = {
            "name": root.name,
            "objects": [obj.name for obj in root.objects],
            "object_count": len(root.objects),
            "children": [
                _get_collection_hierarchy(child) for child in root.children
            ],
        }
        total = len(bpy.data.collections)
        return {
            "total_collections": total,
            "hierarchy": hierarchy,
        }
    else:
        collections = []
        for coll in bpy.data.collections:
            collections.append({
                "name": coll.name,
                "object_count": len(coll.objects),
                "objects": [obj.name for obj in coll.objects],
                "parent": None,
            })
            for parent_coll in bpy.data.collections:
                if coll.name in [c.name for c in parent_coll.children]:
                    collections[-1]["parent"] = parent_coll.name
                    break

        return {
            "total_collections": len(collections),
            "collections": collections,
        }


def toggle_collection(
    name: str,
    visible: Optional[bool] = None,
    exclude: Optional[bool] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Show or hide a collection in the viewport.

    Parameters
    ----------
    name : str
        Collection name.
    visible : bool, optional
        Set viewport visibility. If omitted, toggles current state.
    exclude : bool, optional
        Set the exclude-from-view-layer flag.
    """
    _ensure_object_mode()
    coll = _find_collection(name)

    layer_coll = None
    def _find_layer_coll(lc, target_name):
        if lc.collection.name == target_name:
            return lc
        for child in lc.children:
            result = _find_layer_coll(child, target_name)
            if result:
                return result
        return None

    layer_coll = _find_layer_coll(
        bpy.context.view_layer.layer_collection, name
    )

    if layer_coll is None:
        raise ValueError(
            f"Collection '{name}' not found in view layer"
        )

    if exclude is not None:
        layer_coll.exclude = exclude
    if visible is not None:
        layer_coll.hide_viewport = not visible
    elif exclude is None:
        layer_coll.hide_viewport = not layer_coll.hide_viewport

    return {
        "collection_name": coll.name,
        "hide_viewport": layer_coll.hide_viewport,
        "exclude": layer_coll.exclude,
    }


def merge_collections(
    source_names: List[str],
    target_name: str,
    delete_sources: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Merge multiple collections into one target collection.

    All objects from source collections are moved to the target. Source
    collections are optionally deleted afterward.

    Parameters
    ----------
    source_names : list[str]
        Names of collections to merge from.
    target_name : str
        Name of the destination collection.
    delete_sources : bool
        If True, remove the source collections after merging.
    """
    _ensure_object_mode()
    target = _find_collection(target_name)
    total_moved = 0
    sources_deleted = []

    for src_name in source_names:
        if src_name == target_name:
            continue
        src = _find_collection(src_name)

        for obj in list(src.objects):
            if obj.name not in target.objects:
                target.objects.link(obj)
            src.objects.unlink(obj)
            total_moved += 1

        for child_coll in list(src.children):
            src.children.unlink(child_coll)
            target.children.link(child_coll)

        if delete_sources:
            bpy.data.collections.remove(src)
            sources_deleted.append(src_name)

    return {
        "target_collection": target.name,
        "objects_moved": total_moved,
        "sources_deleted": sources_deleted,
        "target_object_count": len(target.objects),
    }


def organize_by_type(
    prefix: str = "",
    types: Optional[List[str]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Auto-organize all scene objects into collections by object type.

    Creates collections named by type (e.g., "Meshes", "Armatures", "Cameras")
    and moves each object to the appropriate collection.

    Parameters
    ----------
    prefix : str
        Optional prefix for collection names (e.g., "MyProject_").
    types : list[str], optional
        Object types to organize. If omitted, organizes all types found.
        Valid types: MESH, ARMATURE, CAMERA, LIGHT, CURVE, EMPTY, etc.
    """
    _ensure_object_mode()

    type_names = {
        "MESH": "Meshes",
        "ARMATURE": "Armatures",
        "CAMERA": "Cameras",
        "LIGHT": "Lights",
        "CURVE": "Curves",
        "SURFACE": "Surfaces",
        "FONT": "Text",
        "EMPTY": "Empties",
        "LATTICE": "Lattices",
        "SPEAKER": "Speakers",
        "LIGHT_PROBE": "LightProbes",
        "GPENCIL": "GreasePencil",
        "VOLUME": "Volumes",
    }

    organized = {}
    scene_coll = bpy.context.scene.collection

    for obj in list(bpy.data.objects):
        obj_type = obj.type
        if types and obj_type not in types:
            continue

        coll_label = type_names.get(obj_type, obj_type.title())
        coll_name = f"{prefix}{coll_label}"

        if coll_name not in organized:
            existing = bpy.data.collections.get(coll_name)
            if existing is None:
                existing = bpy.data.collections.new(name=coll_name)
                scene_coll.children.link(existing)
            organized[coll_name] = {"collection": existing, "objects": []}

        target = organized[coll_name]["collection"]

        for coll in list(obj.users_collection):
            coll.objects.unlink(obj)

        target.objects.link(obj)
        organized[coll_name]["objects"].append(obj.name)

    result_collections = {}
    for coll_name, info in organized.items():
        result_collections[coll_name] = {
            "object_count": len(info["objects"]),
            "objects": info["objects"],
        }

    return {
        "collections_created": len(organized),
        "collections": result_collections,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "create_collection": create_collection,
    "move_to_collection": move_to_collection,
    "list_collections": list_collections,
    "toggle_collection": toggle_collection,
    "merge_collections": merge_collections,
    "organize_by_type": organize_by_type,
}
