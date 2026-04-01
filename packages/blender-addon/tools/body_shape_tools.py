"""
Body shape tools for OpenForge MCP.

Tools for modifying body proportions, creating shape key variants,
and performing mesh-level body editing operations.
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


def _ensure_basis(mesh_obj: bpy.types.Object) -> None:
    if mesh_obj.data.shape_keys is None:
        mesh_obj.shape_key_add(name="Basis", from_mix=False)


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def adjust_proportions(
    armature_name: str,
    bone_name: str,
    scale_x: float = 1.0,
    scale_y: float = 1.0,
    scale_z: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Adjust body proportions by scaling a specific bone in pose mode.

    Parameters
    ----------
    armature_name : str
        Armature containing the bone.
    bone_name : str
        Bone to scale for proportion adjustment.
    scale_x : float
        X axis scale factor.
    scale_y : float
        Y axis scale factor (bone length direction).
    scale_z : float
        Z axis scale factor.
    """
    _ensure_object_mode()
    arm_obj = _get_object(armature_name)
    if arm_obj.type != "ARMATURE":
        raise ValueError(f"'{armature_name}' is not an armature")

    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="POSE")

    pbone = arm_obj.pose.bones.get(bone_name)
    if pbone is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        available = [b.name for b in arm_obj.pose.bones]
        raise ValueError(f"Bone '{bone_name}' not found. Available: {available}")

    pbone.scale = mathutils.Vector((scale_x, scale_y, scale_z))
    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "armature": arm_obj.name,
        "bone": bone_name,
        "scale": [scale_x, scale_y, scale_z],
    }


def adjust_limb_length(
    armature_name: str,
    bone_name: str,
    length_factor: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Change the length of a limb bone (arm or leg segment).

    Parameters
    ----------
    armature_name : str
        Armature to edit.
    bone_name : str
        Bone whose length to adjust.
    length_factor : float
        Multiplier for bone length (1.0 = no change).
    """
    _ensure_object_mode()
    arm_obj = _get_object(armature_name)
    if arm_obj.type != "ARMATURE":
        raise ValueError(f"'{armature_name}' is not an armature")

    _select_only(arm_obj)
    bpy.ops.object.mode_set(mode="EDIT")

    ebone = arm_obj.data.edit_bones.get(bone_name)
    if ebone is None:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise ValueError(f"Bone '{bone_name}' not found in armature")

    original_length = ebone.length
    direction = (ebone.tail - ebone.head).normalized()
    new_length = original_length * length_factor
    ebone.tail = ebone.head + direction * new_length

    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "armature": arm_obj.name,
        "bone": bone_name,
        "original_length": round(original_length, 4),
        "new_length": round(new_length, 4),
        "length_factor": length_factor,
    }


def create_shape_variant(
    name: str,
    variant_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a body shape variant as a new shape key from the current state.

    Parameters
    ----------
    name : str
        Mesh object.
    variant_name : str
        Name for the new shape key variant.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    _ensure_basis(mesh_obj)

    sk = mesh_obj.shape_key_add(name=variant_name, from_mix=True)

    return {
        "object_name": mesh_obj.name,
        "shape_key": sk.name,
        "total_shape_keys": len(mesh_obj.data.shape_keys.key_blocks),
    }


def apply_shape_deform(
    name: str,
    shape_key_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Permanently apply a shape key deformation to the mesh.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Shape key to apply permanently.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)

    if mesh_obj.data.shape_keys is None:
        raise ValueError(f"'{name}' has no shape keys")

    sk = mesh_obj.data.shape_keys.key_blocks.get(shape_key_name)
    if sk is None:
        available = [k.name for k in mesh_obj.data.shape_keys.key_blocks]
        raise ValueError(
            f"Shape key '{shape_key_name}' not found. Available: {available}"
        )

    # Set the target shape key to full value, others to zero
    for kb in mesh_obj.data.shape_keys.key_blocks:
        kb.value = 1.0 if kb.name == shape_key_name else 0.0

    # Apply as basis
    _select_only(mesh_obj)
    mesh_obj.active_shape_key_index = list(
        mesh_obj.data.shape_keys.key_blocks
    ).index(sk)
    bpy.ops.object.shape_key_move(type="TOP")

    # Apply the mix to the basis
    basis = mesh_obj.data.shape_keys.key_blocks[0]
    target = mesh_obj.data.shape_keys.key_blocks.get(shape_key_name)
    if target:
        for i, v in enumerate(mesh_obj.data.vertices):
            basis.data[i].co = target.data[i].co.copy()

    # Remove the applied shape key
    mesh_obj.active_shape_key_index = list(
        mesh_obj.data.shape_keys.key_blocks
    ).index(target)
    bpy.ops.object.shape_key_remove(all=False)

    remaining = 0
    if mesh_obj.data.shape_keys:
        remaining = len(mesh_obj.data.shape_keys.key_blocks)

    return {
        "object_name": mesh_obj.name,
        "applied_shape": shape_key_name,
        "remaining_shape_keys": remaining,
    }


def modify_region_mesh(
    name: str,
    vertex_group: str,
    offset: Optional[List[float]] = None,
    scale: Optional[List[float]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Directly edit mesh vertices in a region defined by a vertex group.

    Parameters
    ----------
    name : str
        Mesh object.
    vertex_group : str
        Vertex group defining the region.
    offset : list[float], optional
        XYZ offset to apply to vertices.
    scale : list[float], optional
        XYZ scale to apply relative to group center.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)

    vg = mesh_obj.vertex_groups.get(vertex_group)
    if vg is None:
        available = [g.name for g in mesh_obj.vertex_groups]
        raise ValueError(
            f"Vertex group '{vertex_group}' not found. Available: {available}"
        )

    vg_index = vg.index
    affected_verts = []
    for v in mesh_obj.data.vertices:
        for g in v.groups:
            if g.group == vg_index and g.weight > 0.0:
                affected_verts.append((v.index, g.weight))
                break

    if not affected_verts:
        return {
            "object_name": mesh_obj.name,
            "vertex_group": vertex_group,
            "affected_vertices": 0,
        }

    # Calculate center for scaling
    center = mathutils.Vector((0, 0, 0))
    for vi, w in affected_verts:
        center += mesh_obj.data.vertices[vi].co
    center /= len(affected_verts)

    for vi, weight in affected_verts:
        vert = mesh_obj.data.vertices[vi]
        if offset:
            off = mathutils.Vector(offset) * weight
            vert.co += off
        if scale:
            sc = mathutils.Vector(scale)
            relative = vert.co - center
            vert.co = center + mathutils.Vector((
                relative.x * (1.0 + (sc.x - 1.0) * weight),
                relative.y * (1.0 + (sc.y - 1.0) * weight),
                relative.z * (1.0 + (sc.z - 1.0) * weight),
            ))

    mesh_obj.data.update()

    return {
        "object_name": mesh_obj.name,
        "vertex_group": vertex_group,
        "affected_vertices": len(affected_verts),
    }


def scale_body_part(
    name: str,
    vertex_group: str,
    scale_factor: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Scale a specific body part defined by a vertex group.

    Parameters
    ----------
    name : str
        Mesh object.
    vertex_group : str
        Vertex group defining the body part.
    scale_factor : float
        Uniform scale factor.
    """
    return modify_region_mesh(
        name=name,
        vertex_group=vertex_group,
        scale=[scale_factor, scale_factor, scale_factor],
    )


def simple_sculpt(
    name: str,
    operation: str = "smooth",
    strength: float = 0.5,
    vertex_group: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply a simple sculpt-like operation to a mesh or vertex group.

    Parameters
    ----------
    name : str
        Mesh object.
    operation : str
        smooth, inflate, or shrink.
    strength : float
        Effect strength (0-1).
    vertex_group : str, optional
        Limit effect to this vertex group.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)

    # Gather target vertices
    target_indices = set()
    if vertex_group:
        vg = mesh_obj.vertex_groups.get(vertex_group)
        if vg is None:
            raise ValueError(f"Vertex group '{vertex_group}' not found")
        vg_idx = vg.index
        for v in mesh_obj.data.vertices:
            for g in v.groups:
                if g.group == vg_idx and g.weight > 0.0:
                    target_indices.add(v.index)
                    break
    else:
        target_indices = set(range(len(mesh_obj.data.vertices)))

    verts = mesh_obj.data.vertices

    if operation == "smooth":
        # Build adjacency from edges
        adjacency = {i: [] for i in target_indices}
        for edge in mesh_obj.data.edges:
            v0, v1 = edge.vertices
            if v0 in target_indices and v1 in target_indices:
                adjacency[v0].append(v1)
                adjacency[v1].append(v0)

        new_positions = {}
        for vi in target_indices:
            neighbors = adjacency.get(vi, [])
            if neighbors:
                avg = mathutils.Vector((0, 0, 0))
                for ni in neighbors:
                    avg += verts[ni].co
                avg /= len(neighbors)
                new_positions[vi] = verts[vi].co.lerp(avg, strength)
            else:
                new_positions[vi] = verts[vi].co.copy()

        for vi, pos in new_positions.items():
            verts[vi].co = pos

    elif operation == "inflate":
        for vi in target_indices:
            v = verts[vi]
            v.co += v.normal * strength * 0.01

    elif operation == "shrink":
        for vi in target_indices:
            v = verts[vi]
            v.co -= v.normal * strength * 0.01

    else:
        raise ValueError(f"Unknown operation '{operation}'. Use: smooth, inflate, shrink.")

    mesh_obj.data.update()

    return {
        "object_name": mesh_obj.name,
        "operation": operation,
        "strength": strength,
        "affected_vertices": len(target_indices),
    }


def smooth_surface(
    name: str,
    iterations: int = 1,
    factor: float = 0.5,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Smooth the mesh surface using a smooth modifier.

    Parameters
    ----------
    name : str
        Mesh object.
    iterations : int
        Number of smoothing iterations.
    factor : float
        Smoothing factor (0-1).
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    _select_only(mesh_obj)

    mod = mesh_obj.modifiers.new(name="SurfaceSmooth", type="SMOOTH")
    mod.iterations = iterations
    mod.factor = factor

    bpy.ops.object.modifier_apply(modifier=mod.name)

    return {
        "object_name": mesh_obj.name,
        "iterations": iterations,
        "factor": factor,
        "vertex_count": len(mesh_obj.data.vertices),
    }


def make_symmetric(
    name: str,
    axis: str = "X",
    direction: str = "NEGATIVE",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Symmetrize mesh along an axis.

    Parameters
    ----------
    name : str
        Mesh object.
    axis : str
        X, Y, or Z.
    direction : str
        NEGATIVE (positive side overwrites negative) or
        POSITIVE (negative side overwrites positive).
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    _select_only(mesh_obj)

    axis_upper = axis.upper()
    dir_map = {
        ("X", "NEGATIVE"): "NEGATIVE_X",
        ("X", "POSITIVE"): "POSITIVE_X",
        ("Y", "NEGATIVE"): "NEGATIVE_Y",
        ("Y", "POSITIVE"): "POSITIVE_Y",
        ("Z", "NEGATIVE"): "NEGATIVE_Z",
        ("Z", "POSITIVE"): "POSITIVE_Z",
    }

    sym_dir = dir_map.get((axis_upper, direction.upper()))
    if sym_dir is None:
        raise ValueError(f"Invalid axis/direction combination: {axis}/{direction}")

    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.symmetrize(direction=sym_dir)
    bpy.ops.object.mode_set(mode="OBJECT")

    return {
        "object_name": mesh_obj.name,
        "axis": axis_upper,
        "direction": direction,
        "vertex_count": len(mesh_obj.data.vertices),
    }


def blend_shapes(
    name: str,
    shape_names: List[str],
    weights: Optional[List[float]] = None,
    result_name: str = "Blended",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Blend multiple shape keys into one new shape key.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_names : list[str]
        Shape key names to blend.
    weights : list[float], optional
        Weight for each shape key (defaults to equal weights).
    result_name : str
        Name for the blended result shape key.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)

    if mesh_obj.data.shape_keys is None:
        raise ValueError(f"'{name}' has no shape keys")

    key_blocks = mesh_obj.data.shape_keys.key_blocks
    if weights is None:
        weights = [1.0 / len(shape_names)] * len(shape_names)

    if len(weights) != len(shape_names):
        raise ValueError("Number of weights must match number of shape names")

    # Validate all shape keys exist
    for sn in shape_names:
        if sn not in key_blocks:
            available = [k.name for k in key_blocks]
            raise ValueError(f"Shape key '{sn}' not found. Available: {available}")

    basis = key_blocks["Basis"]
    vert_count = len(basis.data)

    # Set all shape keys to zero, then set source weights
    for kb in key_blocks:
        kb.value = 0.0

    for sn, w in zip(shape_names, weights):
        key_blocks[sn].value = w

    # Create new shape key from current mix
    new_sk = mesh_obj.shape_key_add(name=result_name, from_mix=True)

    # Reset all values
    for kb in key_blocks:
        kb.value = 0.0

    return {
        "object_name": mesh_obj.name,
        "blended_shape": new_sk.name,
        "source_shapes": shape_names,
        "weights": weights,
        "total_shape_keys": len(key_blocks),
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "adjust_proportions": adjust_proportions,
    "adjust_limb_length": adjust_limb_length,
    "create_shape_variant": create_shape_variant,
    "apply_shape_deform": apply_shape_deform,
    "modify_region_mesh": modify_region_mesh,
    "scale_body_part": scale_body_part,
    "simple_sculpt": simple_sculpt,
    "smooth_surface": smooth_surface,
    "make_symmetric": make_symmetric,
    "blend_shapes": blend_shapes,
}
