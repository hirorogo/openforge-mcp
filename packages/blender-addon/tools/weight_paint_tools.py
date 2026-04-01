"""
Weight paint tools for OpenForge MCP.

Vertex weight operations for bone weighting, weight transfer,
group management, and manual weight editing.
"""

from typing import Any, Dict, List, Optional

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


def _get_mesh(name: str) -> bpy.types.Object:
    obj = _get_object(name)
    if obj.type != "MESH":
        raise ValueError(f"Object '{name}' is not a mesh (type: {obj.type})")
    return obj


def _ensure_object_mode() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def _select_only(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def _get_vertex_group(mesh_obj: bpy.types.Object, group_name: str):
    vg = mesh_obj.vertex_groups.get(group_name)
    if vg is None:
        available = [g.name for g in mesh_obj.vertex_groups]
        raise ValueError(
            f"Vertex group '{group_name}' not found. Available: {available}"
        )
    return vg


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def auto_weights(
    name: str,
    armature_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply automatic weights from bones to mesh.

    Parameters
    ----------
    name : str
        Mesh object.
    armature_name : str
        Armature to weight to.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    arm_obj = _get_object(armature_name)
    if arm_obj.type != "ARMATURE":
        raise ValueError(f"'{armature_name}' is not an armature")

    # Parent mesh to armature with automatic weights
    bpy.ops.object.select_all(action="DESELECT")
    mesh_obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.parent_set(type="ARMATURE_AUTO")

    groups = [g.name for g in mesh_obj.vertex_groups]

    return {
        "object_name": mesh_obj.name,
        "armature": arm_obj.name,
        "vertex_groups": groups,
        "group_count": len(groups),
    }


def transfer_weights(
    source_name: str,
    target_name: str,
    method: str = "POLYINTERP_NEAREST",
    groups: Optional[List[str]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Transfer vertex weights from source to target mesh.

    Parameters
    ----------
    source_name : str
        Source mesh with weights.
    target_name : str
        Target mesh to receive weights.
    method : str
        Transfer method: POLYINTERP_NEAREST, NEAREST, or TOPOLOGY.
    groups : list[str], optional
        Specific vertex groups to transfer. Transfers all if omitted.
    """
    _ensure_object_mode()
    source = _get_mesh(source_name)
    target = _get_mesh(target_name)

    if groups:
        # Create matching groups on target if needed
        for gname in groups:
            if gname not in source.vertex_groups:
                raise ValueError(f"Source has no group '{gname}'")
            if gname not in target.vertex_groups:
                target.vertex_groups.new(name=gname)

    _select_only(target)
    source.select_set(True)
    bpy.context.view_layer.objects.active = target

    dt_mod = target.modifiers.new(name="WeightXfer", type="DATA_TRANSFER")
    dt_mod.object = source
    dt_mod.use_vert_data = True
    dt_mod.data_types_verts = {"VGROUP_WEIGHTS"}
    dt_mod.vert_mapping = method

    if groups:
        dt_mod.layers_vgroup_select_src = "NAME"
        dt_mod.layers_vgroup_select_dst = "NAME"

    bpy.ops.object.modifier_apply(modifier=dt_mod.name)

    result_groups = [g.name for g in target.vertex_groups]

    return {
        "source": source.name,
        "target": target.name,
        "method": method,
        "transferred_groups": result_groups,
        "group_count": len(result_groups),
    }


def normalize_weights(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Normalize all vertex weights so they sum to 1.0 per vertex.

    Parameters
    ----------
    name : str
        Mesh object.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    _select_only(mesh_obj)

    bpy.ops.object.mode_set(mode="WEIGHT_PAINT")
    bpy.ops.object.vertex_group_normalize_all(lock_active=False)
    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "object_name": mesh_obj.name,
        "normalized": True,
        "group_count": len(mesh_obj.vertex_groups),
    }


def limit_weight_count(
    name: str,
    limit: int = 4,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Limit the number of weight groups per vertex.

    Parameters
    ----------
    name : str
        Mesh object.
    limit : int
        Maximum number of weight groups per vertex.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    _select_only(mesh_obj)

    bpy.ops.object.mode_set(mode="WEIGHT_PAINT")
    bpy.ops.object.vertex_group_limit_total(group_select_mode="ALL", limit=limit)
    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "object_name": mesh_obj.name,
        "limit": limit,
    }


def smooth_weights(
    name: str,
    group_name: str,
    iterations: int = 1,
    factor: float = 0.5,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Smooth vertex weights for a specific group.

    Parameters
    ----------
    name : str
        Mesh object.
    group_name : str
        Vertex group to smooth.
    iterations : int
        Smoothing iterations.
    factor : float
        Smoothing factor (0-1).
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    vg = _get_vertex_group(mesh_obj, group_name)
    vg_idx = vg.index

    # Build adjacency
    adjacency = {}
    for edge in mesh_obj.data.edges:
        v0, v1 = edge.vertices
        adjacency.setdefault(v0, []).append(v1)
        adjacency.setdefault(v1, []).append(v0)

    # Get current weights
    def get_weight(vert_idx):
        for g in mesh_obj.data.vertices[vert_idx].groups:
            if g.group == vg_idx:
                return g.weight
        return 0.0

    for _ in range(iterations):
        new_weights = {}
        for v in mesh_obj.data.vertices:
            current = get_weight(v.index)
            neighbors = adjacency.get(v.index, [])
            if neighbors:
                avg = sum(get_weight(ni) for ni in neighbors) / len(neighbors)
                new_weights[v.index] = current + (avg - current) * factor
            else:
                new_weights[v.index] = current

        for vi, w in new_weights.items():
            if w > 0.0001:
                vg.add([vi], w, "REPLACE")
            else:
                try:
                    vg.remove([vi])
                except RuntimeError:
                    pass

    return {
        "object_name": mesh_obj.name,
        "group": group_name,
        "iterations": iterations,
        "factor": factor,
    }


def mirror_weights(
    name: str,
    axis: str = "X",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Mirror vertex weights across an axis.

    Parameters
    ----------
    name : str
        Mesh object.
    axis : str
        Mirror axis: X, Y, or Z. Bones must follow .L/.R naming.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    _select_only(mesh_obj)

    bpy.ops.object.mode_set(mode="WEIGHT_PAINT")

    if axis.upper() == "X":
        bpy.ops.object.vertex_group_mirror(
            use_topology=False, mirror_weights=True
        )
    else:
        bpy.ops.object.vertex_group_mirror(
            use_topology=False, mirror_weights=True
        )

    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "object_name": mesh_obj.name,
        "axis": axis.upper(),
        "mirrored": True,
    }


def clean_zero_weights(
    name: str,
    threshold: float = 0.001,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Remove zero-weight or near-zero vertex group assignments.

    Parameters
    ----------
    name : str
        Mesh object.
    threshold : float
        Weight threshold below which assignments are removed.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    _select_only(mesh_obj)

    bpy.ops.object.mode_set(mode="WEIGHT_PAINT")
    bpy.ops.object.vertex_group_clean(group_select_mode="ALL", limit=threshold)
    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "object_name": mesh_obj.name,
        "threshold": threshold,
        "cleaned": True,
    }


def create_vertex_group(
    name: str,
    group_name: str,
    vertex_indices: Optional[List[int]] = None,
    weight: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a new vertex group, optionally adding vertices.

    Parameters
    ----------
    name : str
        Mesh object.
    group_name : str
        Name for the new group.
    vertex_indices : list[int], optional
        Vertices to add to the group.
    weight : float
        Weight to assign (0-1).
    """
    mesh_obj = _get_mesh(name)

    vg = mesh_obj.vertex_groups.get(group_name)
    if vg is None:
        vg = mesh_obj.vertex_groups.new(name=group_name)

    added = 0
    if vertex_indices:
        vg.add(vertex_indices, weight, "REPLACE")
        added = len(vertex_indices)

    return {
        "object_name": mesh_obj.name,
        "group": vg.name,
        "added_vertices": added,
        "weight": weight,
    }


def copy_vertex_group(
    name: str,
    source_group: str,
    new_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Copy a vertex group to a new group.

    Parameters
    ----------
    name : str
        Mesh object.
    source_group : str
        Vertex group to copy.
    new_name : str, optional
        Name for the copy.
    """
    mesh_obj = _get_mesh(name)
    src_vg = _get_vertex_group(mesh_obj, source_group)
    src_idx = src_vg.index

    copy_name = new_name or f"{source_group}_copy"
    new_vg = mesh_obj.vertex_groups.new(name=copy_name)

    for v in mesh_obj.data.vertices:
        for g in v.groups:
            if g.group == src_idx:
                new_vg.add([v.index], g.weight, "REPLACE")
                break

    return {
        "object_name": mesh_obj.name,
        "source": source_group,
        "copy": new_vg.name,
    }


def list_vertex_groups(
    name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """List all vertex groups with their vertex counts.

    Parameters
    ----------
    name : str
        Mesh object.
    """
    mesh_obj = _get_mesh(name)

    groups = []
    for vg in mesh_obj.vertex_groups:
        count = 0
        vg_idx = vg.index
        for v in mesh_obj.data.vertices:
            for g in v.groups:
                if g.group == vg_idx and g.weight > 0.0:
                    count += 1
                    break
        groups.append({
            "name": vg.name,
            "index": vg.index,
            "vertex_count": count,
        })

    return {
        "object_name": mesh_obj.name,
        "vertex_groups": groups,
        "total_groups": len(groups),
    }


def paint_manual(
    name: str,
    group_name: str,
    vertex_indices: List[int],
    weight: float = 1.0,
    mode: str = "REPLACE",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set specific vertex weight values manually.

    Parameters
    ----------
    name : str
        Mesh object.
    group_name : str
        Target vertex group.
    vertex_indices : list[int]
        Vertex indices to paint.
    weight : float
        Weight value (0-1).
    mode : str
        REPLACE, ADD, or SUBTRACT.
    """
    mesh_obj = _get_mesh(name)
    vg = _get_vertex_group(mesh_obj, group_name)

    vg.add(vertex_indices, weight, mode)

    return {
        "object_name": mesh_obj.name,
        "group": group_name,
        "painted_vertices": len(vertex_indices),
        "weight": weight,
        "mode": mode,
    }


def select_by_weight(
    name: str,
    group_name: str,
    min_weight: float = 0.0,
    max_weight: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Select vertices by weight threshold in a vertex group.

    Parameters
    ----------
    name : str
        Mesh object.
    group_name : str
        Vertex group to check.
    min_weight : float
        Minimum weight threshold.
    max_weight : float
        Maximum weight threshold.
    """
    mesh_obj = _get_mesh(name)
    vg = _get_vertex_group(mesh_obj, group_name)
    vg_idx = vg.index

    matching = []
    for v in mesh_obj.data.vertices:
        for g in v.groups:
            if g.group == vg_idx:
                if min_weight <= g.weight <= max_weight:
                    matching.append(v.index)
                    v.select = True
                break

    return {
        "object_name": mesh_obj.name,
        "group": group_name,
        "min_weight": min_weight,
        "max_weight": max_weight,
        "selected_count": len(matching),
        "vertex_indices": matching[:500],  # Cap output
    }


def gradient_weight(
    name: str,
    group_name: str,
    axis: str = "Z",
    min_weight: float = 0.0,
    max_weight: float = 1.0,
    reverse: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply a gradient weight along an axis to a vertex group.

    Parameters
    ----------
    name : str
        Mesh object.
    group_name : str
        Target vertex group (created if missing).
    axis : str
        Gradient axis: X, Y, or Z.
    min_weight : float
        Weight at the low end of the axis.
    max_weight : float
        Weight at the high end of the axis.
    reverse : bool
        Reverse the gradient direction.
    """
    mesh_obj = _get_mesh(name)

    vg = mesh_obj.vertex_groups.get(group_name)
    if vg is None:
        vg = mesh_obj.vertex_groups.new(name=group_name)

    axis_idx = {"X": 0, "Y": 1, "Z": 2}.get(axis.upper())
    if axis_idx is None:
        raise ValueError(f"Invalid axis '{axis}'")

    # Find min/max along axis
    verts = mesh_obj.data.vertices
    if len(verts) == 0:
        return {"object_name": mesh_obj.name, "group": group_name, "affected": 0}

    axis_min = min(v.co[axis_idx] for v in verts)
    axis_max = max(v.co[axis_idx] for v in verts)
    axis_range = axis_max - axis_min

    if axis_range < 0.00001:
        for v in verts:
            vg.add([v.index], (min_weight + max_weight) / 2.0, "REPLACE")
    else:
        for v in verts:
            factor = (v.co[axis_idx] - axis_min) / axis_range
            if reverse:
                factor = 1.0 - factor
            w = min_weight + (max_weight - min_weight) * factor
            vg.add([v.index], w, "REPLACE")

    return {
        "object_name": mesh_obj.name,
        "group": vg.name,
        "axis": axis.upper(),
        "min_weight": min_weight,
        "max_weight": max_weight,
        "affected": len(verts),
    }


def blend_between_bones(
    name: str,
    bone_a: str,
    bone_b: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Blend weights between two bone groups based on vertex position.

    Parameters
    ----------
    name : str
        Mesh object.
    bone_a : str
        First bone vertex group.
    bone_b : str
        Second bone vertex group.
    """
    mesh_obj = _get_mesh(name)
    vg_a = _get_vertex_group(mesh_obj, bone_a)
    vg_b = _get_vertex_group(mesh_obj, bone_b)

    vg_a_idx = vg_a.index
    vg_b_idx = vg_b.index

    # Find vertices that belong to either group
    blended = 0
    for v in mesh_obj.data.vertices:
        w_a = 0.0
        w_b = 0.0
        for g in v.groups:
            if g.group == vg_a_idx:
                w_a = g.weight
            elif g.group == vg_b_idx:
                w_b = g.weight

        total = w_a + w_b
        if total > 0:
            # Normalize between the two
            norm_a = w_a / total
            norm_b = w_b / total
            vg_a.add([v.index], norm_a, "REPLACE")
            vg_b.add([v.index], norm_b, "REPLACE")
            blended += 1

    return {
        "object_name": mesh_obj.name,
        "bone_a": bone_a,
        "bone_b": bone_b,
        "blended_vertices": blended,
    }


def assign_to_bone(
    name: str,
    bone_name: str,
    vertex_indices: List[int],
    weight: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Assign selected vertices to a bone at full weight.

    Parameters
    ----------
    name : str
        Mesh object.
    bone_name : str
        Bone name (vertex group name).
    vertex_indices : list[int]
        Vertices to assign.
    weight : float
        Weight to assign.
    """
    mesh_obj = _get_mesh(name)

    vg = mesh_obj.vertex_groups.get(bone_name)
    if vg is None:
        vg = mesh_obj.vertex_groups.new(name=bone_name)

    vg.add(vertex_indices, weight, "REPLACE")

    return {
        "object_name": mesh_obj.name,
        "bone": bone_name,
        "assigned_vertices": len(vertex_indices),
        "weight": weight,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "auto_weights": auto_weights,
    "transfer_weights": transfer_weights,
    "normalize_weights": normalize_weights,
    "limit_weight_count": limit_weight_count,
    "smooth_weights": smooth_weights,
    "mirror_weights": mirror_weights,
    "clean_zero_weights": clean_zero_weights,
    "create_vertex_group": create_vertex_group,
    "copy_vertex_group": copy_vertex_group,
    "list_vertex_groups": list_vertex_groups,
    "paint_manual": paint_manual,
    "select_by_weight": select_by_weight,
    "gradient_weight": gradient_weight,
    "blend_between_bones": blend_between_bones,
    "assign_to_bone": assign_to_bone,
}
