"""
Shape key tools for OpenForge MCP.

Advanced shape key operations for facial expressions, lip sync,
shape key editing, and driver setup.
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


def _get_shape_key(mesh_obj: bpy.types.Object, sk_name: str):
    if mesh_obj.data.shape_keys is None:
        raise ValueError(f"'{mesh_obj.name}' has no shape keys")
    sk = mesh_obj.data.shape_keys.key_blocks.get(sk_name)
    if sk is None:
        available = [k.name for k in mesh_obj.data.shape_keys.key_blocks]
        raise ValueError(
            f"Shape key '{sk_name}' not found. Available: {available}"
        )
    return sk


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def create_shape_key(
    name: str,
    shape_key_name: str,
    from_mix: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a new shape key from the current mesh state.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Name for the new shape key.
    from_mix : bool
        Create from current shape key mix rather than basis.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    _ensure_basis(mesh_obj)

    sk = mesh_obj.shape_key_add(name=shape_key_name, from_mix=from_mix)

    return {
        "object_name": mesh_obj.name,
        "shape_key": sk.name,
        "from_mix": from_mix,
        "total_shape_keys": len(mesh_obj.data.shape_keys.key_blocks),
    }


def delete_shape_key(
    name: str,
    shape_key_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Remove a shape key from a mesh.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Shape key to delete.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    _select_only(mesh_obj)

    sk = _get_shape_key(mesh_obj, shape_key_name)
    idx = list(mesh_obj.data.shape_keys.key_blocks).index(sk)
    mesh_obj.active_shape_key_index = idx
    bpy.ops.object.shape_key_remove(all=False)

    remaining = 0
    if mesh_obj.data.shape_keys:
        remaining = len(mesh_obj.data.shape_keys.key_blocks)

    return {
        "object_name": mesh_obj.name,
        "deleted": shape_key_name,
        "remaining_shape_keys": remaining,
    }


def rename_shape_key(
    name: str,
    old_name: str,
    new_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Rename a shape key.

    Parameters
    ----------
    name : str
        Mesh object.
    old_name : str
        Current shape key name.
    new_name : str
        New name for the shape key.
    """
    mesh_obj = _get_mesh(name)
    sk = _get_shape_key(mesh_obj, old_name)
    sk.name = new_name

    return {
        "object_name": mesh_obj.name,
        "old_name": old_name,
        "new_name": sk.name,
    }


def set_shape_value(
    name: str,
    shape_key_name: str,
    value: float = 0.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Set the value of a shape key (0.0 to 1.0).

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Shape key to adjust.
    value : float
        Value between 0.0 and 1.0.
    """
    mesh_obj = _get_mesh(name)
    sk = _get_shape_key(mesh_obj, shape_key_name)
    sk.value = max(0.0, min(1.0, value))

    return {
        "object_name": mesh_obj.name,
        "shape_key": sk.name,
        "value": sk.value,
    }


def edit_shape_vertices(
    name: str,
    shape_key_name: str,
    vertex_indices: List[int],
    offsets: List[List[float]],
    **kwargs: Any,
) -> Dict[str, Any]:
    """Modify specific vertex positions within a shape key.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Shape key to edit.
    vertex_indices : list[int]
        Vertex indices to modify.
    offsets : list[list[float]]
        XYZ offset for each vertex (must match vertex_indices length).
    """
    mesh_obj = _get_mesh(name)
    sk = _get_shape_key(mesh_obj, shape_key_name)

    if len(vertex_indices) != len(offsets):
        raise ValueError("vertex_indices and offsets must have the same length")

    vert_count = len(sk.data)
    modified = 0
    for vi, off in zip(vertex_indices, offsets):
        if 0 <= vi < vert_count:
            sk.data[vi].co += mathutils.Vector(off)
            modified += 1

    return {
        "object_name": mesh_obj.name,
        "shape_key": sk.name,
        "modified_vertices": modified,
    }


def mirror_shape(
    name: str,
    shape_key_name: str,
    axis: str = "X",
    new_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Mirror a shape key across an axis into a new shape key.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Source shape key.
    axis : str
        Mirror axis: X, Y, or Z.
    new_name : str, optional
        Name for mirrored shape key.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    _select_only(mesh_obj)
    sk = _get_shape_key(mesh_obj, shape_key_name)
    basis = mesh_obj.data.shape_keys.key_blocks["Basis"]

    result_name = new_name or f"{shape_key_name}_mirrored"
    new_sk = mesh_obj.shape_key_add(name=result_name, from_mix=False)

    axis_idx = {"X": 0, "Y": 1, "Z": 2}.get(axis.upper())
    if axis_idx is None:
        raise ValueError(f"Invalid axis '{axis}'. Use X, Y, or Z.")

    # For each vertex, find its mirror partner by flipping the axis coordinate
    tolerance = 0.0001
    vert_count = len(basis.data)

    # Build a spatial lookup for basis positions
    basis_positions = {}
    for i in range(vert_count):
        co = basis.data[i].co.copy()
        key = (round(co.x, 4), round(co.y, 4), round(co.z, 4))
        basis_positions[key] = i

    for i in range(vert_count):
        # Get the delta from basis for the source shape key
        delta = sk.data[i].co - basis.data[i].co

        # Find mirror vertex
        mirror_co = basis.data[i].co.copy()
        mirror_co[axis_idx] = -mirror_co[axis_idx]
        mirror_key = (round(mirror_co.x, 4), round(mirror_co.y, 4), round(mirror_co.z, 4))

        mirror_idx = basis_positions.get(mirror_key)
        if mirror_idx is not None:
            mirrored_delta = delta.copy()
            mirrored_delta[axis_idx] = -mirrored_delta[axis_idx]
            new_sk.data[mirror_idx].co = basis.data[mirror_idx].co + mirrored_delta

    return {
        "object_name": mesh_obj.name,
        "source_shape": shape_key_name,
        "mirrored_shape": new_sk.name,
        "axis": axis.upper(),
    }


def transfer_shapes(
    source_name: str,
    target_name: str,
    shape_names: Optional[List[str]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Transfer shape keys from one mesh to another.

    Parameters
    ----------
    source_name : str
        Source mesh with shape keys.
    target_name : str
        Target mesh to receive shape keys.
    shape_names : list[str], optional
        Specific shape keys to transfer. Transfers all if omitted.
    """
    _ensure_object_mode()
    source = _get_mesh(source_name)
    target = _get_mesh(target_name)

    if source.data.shape_keys is None:
        raise ValueError(f"'{source_name}' has no shape keys to transfer")

    _ensure_basis(target)

    source_blocks = source.data.shape_keys.key_blocks
    names_to_transfer = shape_names or [
        k.name for k in source_blocks if k.name != "Basis"
    ]

    transferred = []
    for sk_name in names_to_transfer:
        src_sk = source_blocks.get(sk_name)
        if src_sk is None:
            continue

        # Check if already exists on target
        existing = target.data.shape_keys.key_blocks.get(sk_name)
        if existing is None:
            new_sk = target.shape_key_add(name=sk_name, from_mix=False)
        else:
            new_sk = existing

        # Transfer vertex positions (limited by vertex count)
        src_count = len(src_sk.data)
        tgt_count = len(new_sk.data)
        copy_count = min(src_count, tgt_count)

        src_basis = source_blocks["Basis"]
        tgt_basis = target.data.shape_keys.key_blocks["Basis"]

        for i in range(copy_count):
            delta = src_sk.data[i].co - src_basis.data[i].co
            new_sk.data[i].co = tgt_basis.data[i].co + delta

        transferred.append(sk_name)

    return {
        "source": source.name,
        "target": target.name,
        "transferred_shapes": transferred,
        "count": len(transferred),
    }


def sort_shapes(
    name: str,
    reverse: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Sort shape keys alphabetically (Basis always stays first).

    Parameters
    ----------
    name : str
        Mesh object.
    reverse : bool
        Sort in reverse alphabetical order.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    _select_only(mesh_obj)

    if mesh_obj.data.shape_keys is None:
        raise ValueError(f"'{name}' has no shape keys")

    key_blocks = mesh_obj.data.shape_keys.key_blocks
    names = [k.name for k in key_blocks]

    # Keep Basis at index 0
    basis_name = names[0]
    rest = sorted(names[1:], reverse=reverse)
    sorted_order = [basis_name] + rest

    # Move shape keys to match sorted order
    for target_idx, sk_name in enumerate(sorted_order):
        current_idx = next(
            i for i, k in enumerate(key_blocks) if k.name == sk_name
        )
        while current_idx > target_idx:
            mesh_obj.active_shape_key_index = current_idx
            bpy.ops.object.shape_key_move(type="UP")
            current_idx -= 1

    final_order = [k.name for k in mesh_obj.data.shape_keys.key_blocks]

    return {
        "object_name": mesh_obj.name,
        "order": final_order,
        "count": len(final_order),
    }


def create_expression_set(
    name: str,
    standard: str = "vrm",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a standard set of facial expression shape keys.

    Parameters
    ----------
    name : str
        Face mesh object.
    standard : str
        Expression standard: vrm, arkit, or basic.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    _ensure_basis(mesh_obj)

    expression_sets = {
        "vrm": [
            "Neutral", "A", "I", "U", "E", "O",
            "Blink", "Blink_L", "Blink_R",
            "Joy", "Angry", "Sorrow", "Fun",
            "LookUp", "LookDown", "LookLeft", "LookRight",
        ],
        "arkit": [
            "eyeBlinkLeft", "eyeBlinkRight", "eyeWideLeft", "eyeWideRight",
            "eyeSquintLeft", "eyeSquintRight",
            "eyeLookUpLeft", "eyeLookUpRight", "eyeLookDownLeft", "eyeLookDownRight",
            "eyeLookInLeft", "eyeLookInRight", "eyeLookOutLeft", "eyeLookOutRight",
            "jawOpen", "jawForward", "jawLeft", "jawRight",
            "mouthClose", "mouthFunnel", "mouthPucker",
            "mouthLeft", "mouthRight", "mouthSmileLeft", "mouthSmileRight",
            "mouthFrownLeft", "mouthFrownRight",
            "mouthDimpleLeft", "mouthDimpleRight",
            "mouthStretchLeft", "mouthStretchRight",
            "mouthRollLower", "mouthRollUpper",
            "mouthShrugLower", "mouthShrugUpper",
            "mouthPressLeft", "mouthPressRight",
            "mouthLowerDownLeft", "mouthLowerDownRight",
            "mouthUpperUpLeft", "mouthUpperUpRight",
            "browDownLeft", "browDownRight",
            "browInnerUp", "browOuterUpLeft", "browOuterUpRight",
            "cheekPuff", "cheekSquintLeft", "cheekSquintRight",
            "noseSneerLeft", "noseSneerRight",
            "tongueOut",
        ],
        "basic": [
            "Happy", "Sad", "Angry", "Surprised",
            "Blink", "BlinkLeft", "BlinkRight",
            "MouthOpen", "MouthSmile",
        ],
    }

    if standard not in expression_sets:
        raise ValueError(
            f"Unknown standard '{standard}'. Use: {list(expression_sets.keys())}"
        )

    expr_list = expression_sets[standard]
    created = []
    for expr_name in expr_list:
        existing = mesh_obj.data.shape_keys.key_blocks.get(expr_name)
        if existing is None:
            sk = mesh_obj.shape_key_add(name=expr_name, from_mix=False)
            created.append(sk.name)

    return {
        "object_name": mesh_obj.name,
        "standard": standard,
        "created_expressions": created,
        "total_shape_keys": len(mesh_obj.data.shape_keys.key_blocks),
    }


def create_lip_sync_set(
    name: str,
    format: str = "viseme",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create lip sync viseme shape keys.

    Parameters
    ----------
    name : str
        Face mesh object.
    format : str
        viseme (standard 15 visemes) or vowel (A, I, U, E, O).
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    _ensure_basis(mesh_obj)

    viseme_sets = {
        "viseme": [
            "vrc.v_sil", "vrc.v_PP", "vrc.v_FF", "vrc.v_TH",
            "vrc.v_DD", "vrc.v_kk", "vrc.v_CH", "vrc.v_SS",
            "vrc.v_nn", "vrc.v_RR", "vrc.v_aa", "vrc.v_E",
            "vrc.v_ih", "vrc.v_oh", "vrc.v_ou",
        ],
        "vowel": ["A", "I", "U", "E", "O"],
    }

    if format not in viseme_sets:
        raise ValueError(f"Unknown format '{format}'. Use: {list(viseme_sets.keys())}")

    shapes = viseme_sets[format]
    created = []
    for shape_name in shapes:
        existing = mesh_obj.data.shape_keys.key_blocks.get(shape_name)
        if existing is None:
            sk = mesh_obj.shape_key_add(name=shape_name, from_mix=False)
            created.append(sk.name)

    return {
        "object_name": mesh_obj.name,
        "format": format,
        "created_visemes": created,
        "total_shape_keys": len(mesh_obj.data.shape_keys.key_blocks),
    }


def blend_two_shapes(
    name: str,
    shape_a: str,
    shape_b: str,
    weight_a: float = 0.5,
    weight_b: float = 0.5,
    result_name: str = "Blended",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Blend two shape keys into a new one.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_a : str
        First shape key.
    shape_b : str
        Second shape key.
    weight_a : float
        Weight for first shape key.
    weight_b : float
        Weight for second shape key.
    result_name : str
        Name for the blended result.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    sk_a = _get_shape_key(mesh_obj, shape_a)
    sk_b = _get_shape_key(mesh_obj, shape_b)

    # Set weights and create from mix
    for kb in mesh_obj.data.shape_keys.key_blocks:
        kb.value = 0.0

    sk_a.value = weight_a
    sk_b.value = weight_b

    new_sk = mesh_obj.shape_key_add(name=result_name, from_mix=True)

    sk_a.value = 0.0
    sk_b.value = 0.0

    return {
        "object_name": mesh_obj.name,
        "blended_shape": new_sk.name,
        "shape_a": shape_a,
        "shape_b": shape_b,
        "weight_a": weight_a,
        "weight_b": weight_b,
    }


def scale_shape_effect(
    name: str,
    shape_key_name: str,
    intensity: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Scale the intensity of a shape key's deformation.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Shape key to scale.
    intensity : float
        Scale factor for the deformation (2.0 = double effect).
    """
    mesh_obj = _get_mesh(name)
    sk = _get_shape_key(mesh_obj, shape_key_name)
    basis = mesh_obj.data.shape_keys.key_blocks["Basis"]

    for i in range(len(sk.data)):
        delta = sk.data[i].co - basis.data[i].co
        sk.data[i].co = basis.data[i].co + delta * intensity

    return {
        "object_name": mesh_obj.name,
        "shape_key": sk.name,
        "intensity": intensity,
    }


def move_shape_vertices(
    name: str,
    shape_key_name: str,
    offset: List[float],
    vertex_group: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Offset all vertices in a shape key by a uniform amount.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Shape key to modify.
    offset : list[float]
        XYZ offset to apply.
    vertex_group : str, optional
        Limit offset to vertices in this group.
    """
    mesh_obj = _get_mesh(name)
    sk = _get_shape_key(mesh_obj, shape_key_name)
    off = mathutils.Vector(offset)

    target_indices = None
    if vertex_group:
        vg = mesh_obj.vertex_groups.get(vertex_group)
        if vg is None:
            raise ValueError(f"Vertex group '{vertex_group}' not found")
        vg_idx = vg.index
        target_indices = set()
        for v in mesh_obj.data.vertices:
            for g in v.groups:
                if g.group == vg_idx and g.weight > 0:
                    target_indices.add(v.index)
                    break

    modified = 0
    for i in range(len(sk.data)):
        if target_indices is None or i in target_indices:
            sk.data[i].co += off
            modified += 1

    return {
        "object_name": mesh_obj.name,
        "shape_key": sk.name,
        "offset": offset,
        "modified_vertices": modified,
    }


def rotate_shape_region(
    name: str,
    shape_key_name: str,
    vertex_group: str,
    angle: float = 0.0,
    axis: str = "Z",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Rotate vertices within a shape key around a vertex group center.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Shape key to modify.
    vertex_group : str
        Vertex group defining the rotation region.
    angle : float
        Rotation angle in degrees.
    axis : str
        Rotation axis: X, Y, or Z.
    """
    import math

    mesh_obj = _get_mesh(name)
    sk = _get_shape_key(mesh_obj, shape_key_name)

    vg = mesh_obj.vertex_groups.get(vertex_group)
    if vg is None:
        raise ValueError(f"Vertex group '{vertex_group}' not found")

    vg_idx = vg.index
    target_verts = []
    for v in mesh_obj.data.vertices:
        for g in v.groups:
            if g.group == vg_idx and g.weight > 0:
                target_verts.append((v.index, g.weight))
                break

    if not target_verts:
        return {
            "object_name": mesh_obj.name,
            "shape_key": sk.name,
            "rotated_vertices": 0,
        }

    # Calculate center
    center = mathutils.Vector((0, 0, 0))
    for vi, w in target_verts:
        center += sk.data[vi].co
    center /= len(target_verts)

    axis_vec = {"X": mathutils.Vector((1, 0, 0)),
                "Y": mathutils.Vector((0, 1, 0)),
                "Z": mathutils.Vector((0, 0, 1))}.get(axis.upper())
    if axis_vec is None:
        raise ValueError(f"Invalid axis '{axis}'. Use X, Y, or Z.")

    rot_mat = mathutils.Matrix.Rotation(math.radians(angle), 4, axis_vec)

    for vi, weight in target_verts:
        relative = sk.data[vi].co - center
        rotated = rot_mat @ relative
        blended = relative.lerp(rotated, weight)
        sk.data[vi].co = center + blended

    return {
        "object_name": mesh_obj.name,
        "shape_key": sk.name,
        "angle": angle,
        "axis": axis.upper(),
        "rotated_vertices": len(target_verts),
    }


def copy_shape(
    name: str,
    shape_key_name: str,
    new_name: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Duplicate a shape key.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Shape key to duplicate.
    new_name : str, optional
        Name for the copy.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    src_sk = _get_shape_key(mesh_obj, shape_key_name)

    copy_name = new_name or f"{shape_key_name}_copy"
    new_sk = mesh_obj.shape_key_add(name=copy_name, from_mix=False)

    for i in range(len(src_sk.data)):
        new_sk.data[i].co = src_sk.data[i].co.copy()

    return {
        "object_name": mesh_obj.name,
        "source": shape_key_name,
        "copy": new_sk.name,
    }


def apply_to_mesh(
    name: str,
    shape_key_name: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply a shape key permanently to the mesh, removing all shape keys.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Shape key to apply as the final mesh shape.
    """
    _ensure_object_mode()
    mesh_obj = _get_mesh(name)
    _select_only(mesh_obj)
    sk = _get_shape_key(mesh_obj, shape_key_name)

    # Set target to 1.0, all others to 0.0
    for kb in mesh_obj.data.shape_keys.key_blocks:
        kb.value = 1.0 if kb.name == shape_key_name else 0.0

    # Apply all shape keys
    bpy.ops.object.shape_key_remove(all=True, apply_mix=True)

    return {
        "object_name": mesh_obj.name,
        "applied_shape": shape_key_name,
        "vertex_count": len(mesh_obj.data.vertices),
    }


def smooth_shape(
    name: str,
    shape_key_name: str,
    iterations: int = 1,
    factor: float = 0.5,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Smooth a shape key's deformation by averaging neighbor deltas.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Shape key to smooth.
    iterations : int
        Number of smoothing passes.
    factor : float
        Blend factor per iteration (0-1).
    """
    mesh_obj = _get_mesh(name)
    sk = _get_shape_key(mesh_obj, shape_key_name)
    basis = mesh_obj.data.shape_keys.key_blocks["Basis"]

    # Build adjacency
    adjacency = {}
    for edge in mesh_obj.data.edges:
        v0, v1 = edge.vertices
        adjacency.setdefault(v0, []).append(v1)
        adjacency.setdefault(v1, []).append(v0)

    vert_count = len(sk.data)
    for _ in range(iterations):
        new_deltas = [None] * vert_count
        for i in range(vert_count):
            delta = sk.data[i].co - basis.data[i].co
            neighbors = adjacency.get(i, [])
            if neighbors:
                avg_delta = mathutils.Vector((0, 0, 0))
                for ni in neighbors:
                    avg_delta += sk.data[ni].co - basis.data[ni].co
                avg_delta /= len(neighbors)
                new_deltas[i] = delta.lerp(avg_delta, factor)
            else:
                new_deltas[i] = delta

        for i in range(vert_count):
            sk.data[i].co = basis.data[i].co + new_deltas[i]

    return {
        "object_name": mesh_obj.name,
        "shape_key": sk.name,
        "iterations": iterations,
        "factor": factor,
    }


def correct_symmetry(
    name: str,
    shape_key_name: str,
    axis: str = "X",
    tolerance: float = 0.0001,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Fix asymmetric shape keys by averaging mirrored vertex deltas.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Shape key to correct.
    axis : str
        Symmetry axis: X, Y, or Z.
    tolerance : float
        Position matching tolerance for finding mirror pairs.
    """
    mesh_obj = _get_mesh(name)
    sk = _get_shape_key(mesh_obj, shape_key_name)
    basis = mesh_obj.data.shape_keys.key_blocks["Basis"]

    axis_idx = {"X": 0, "Y": 1, "Z": 2}.get(axis.upper())
    if axis_idx is None:
        raise ValueError(f"Invalid axis '{axis}'")

    vert_count = len(basis.data)

    # Build mirror pairs
    pairs = {}
    for i in range(vert_count):
        if i in pairs:
            continue
        co = basis.data[i].co.copy()
        mirror_co = co.copy()
        mirror_co[axis_idx] = -mirror_co[axis_idx]

        for j in range(i + 1, vert_count):
            if (basis.data[j].co - mirror_co).length < tolerance:
                pairs[i] = j
                pairs[j] = i
                break

    # Average the deltas of mirror pairs
    corrected = 0
    processed = set()
    for i, j in pairs.items():
        if i in processed:
            continue
        processed.add(i)
        processed.add(j)

        delta_i = sk.data[i].co - basis.data[i].co
        delta_j = sk.data[j].co - basis.data[j].co

        # Mirror delta_j for comparison
        delta_j_mirrored = delta_j.copy()
        delta_j_mirrored[axis_idx] = -delta_j_mirrored[axis_idx]

        avg = (delta_i + delta_j_mirrored) / 2.0

        sk.data[i].co = basis.data[i].co + avg
        avg_mirrored = avg.copy()
        avg_mirrored[axis_idx] = -avg_mirrored[axis_idx]
        sk.data[j].co = basis.data[j].co + avg_mirrored
        corrected += 2

    return {
        "object_name": mesh_obj.name,
        "shape_key": sk.name,
        "axis": axis.upper(),
        "corrected_vertices": corrected,
        "mirror_pairs": len(pairs) // 2,
    }


def add_driver(
    name: str,
    shape_key_name: str,
    armature_name: str,
    bone_name: str,
    transform_type: str = "ROT_X",
    influence: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add a driver to a shape key, connecting it to a bone transform.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Shape key to drive.
    armature_name : str
        Armature containing the driver bone.
    bone_name : str
        Bone whose transform drives the shape key.
    transform_type : str
        LOC_X, LOC_Y, LOC_Z, ROT_X, ROT_Y, ROT_Z, SCALE_X, SCALE_Y, SCALE_Z.
    influence : float
        Driver influence multiplier.
    """
    mesh_obj = _get_mesh(name)
    sk = _get_shape_key(mesh_obj, shape_key_name)
    arm_obj = _get_object(armature_name)

    if arm_obj.type != "ARMATURE":
        raise ValueError(f"'{armature_name}' is not an armature")
    if bone_name not in arm_obj.data.bones:
        raise ValueError(f"Bone '{bone_name}' not found in '{armature_name}'")

    # Add driver to shape key value
    driver = sk.driver_add("value").driver
    driver.type = "SCRIPTED"

    var = driver.variables.new()
    var.name = "bone_val"
    var.type = "TRANSFORMS"
    var.targets[0].id = arm_obj
    var.targets[0].bone_target = bone_name
    var.targets[0].transform_type = transform_type
    var.targets[0].transform_space = "LOCAL_SPACE"

    driver.expression = f"bone_val * {influence}"

    return {
        "object_name": mesh_obj.name,
        "shape_key": sk.name,
        "armature": arm_obj.name,
        "bone": bone_name,
        "transform_type": transform_type,
        "influence": influence,
    }


def get_vertex_positions(
    name: str,
    shape_key_name: str,
    vertex_indices: Optional[List[int]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Get vertex positions from a shape key.

    Parameters
    ----------
    name : str
        Mesh object.
    shape_key_name : str
        Shape key to read.
    vertex_indices : list[int], optional
        Specific vertex indices. Returns all if omitted (capped at 1000).
    """
    mesh_obj = _get_mesh(name)
    sk = _get_shape_key(mesh_obj, shape_key_name)
    basis = mesh_obj.data.shape_keys.key_blocks["Basis"]

    if vertex_indices is None:
        vertex_indices = list(range(min(len(sk.data), 1000)))

    positions = {}
    for vi in vertex_indices:
        if 0 <= vi < len(sk.data):
            co = sk.data[vi].co
            basis_co = basis.data[vi].co
            delta = co - basis_co
            positions[str(vi)] = {
                "position": [round(co.x, 6), round(co.y, 6), round(co.z, 6)],
                "delta": [round(delta.x, 6), round(delta.y, 6), round(delta.z, 6)],
            }

    return {
        "object_name": mesh_obj.name,
        "shape_key": sk.name,
        "vertex_count": len(positions),
        "positions": positions,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "create_shape_key": create_shape_key,
    "delete_shape_key": delete_shape_key,
    "rename_shape_key": rename_shape_key,
    "set_shape_value": set_shape_value,
    "edit_shape_vertices": edit_shape_vertices,
    "mirror_shape": mirror_shape,
    "transfer_shapes": transfer_shapes,
    "sort_shapes": sort_shapes,
    "create_expression_set": create_expression_set,
    "create_lip_sync_set": create_lip_sync_set,
    "blend_two_shapes": blend_two_shapes,
    "scale_shape_effect": scale_shape_effect,
    "move_shape_vertices": move_shape_vertices,
    "rotate_shape_region": rotate_shape_region,
    "copy_shape": copy_shape,
    "apply_to_mesh": apply_to_mesh,
    "smooth_shape": smooth_shape,
    "correct_symmetry": correct_symmetry,
    "add_driver": add_driver,
    "get_vertex_positions": get_vertex_positions,
}
