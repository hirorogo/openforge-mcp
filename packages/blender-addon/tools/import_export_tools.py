"""
Import/Export tools for OpenForge MCP.

Tools for importing and exporting various 3D file formats.
"""

from typing import Any, Dict, Optional

import bpy


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def import_fbx(
    filepath: str,
    use_anim: bool = True,
    global_scale: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Import an FBX file.

    Parameters
    ----------
    filepath : str
        Path to the .fbx file.
    use_anim : bool
        Import animation data.
    global_scale : float
        Scale factor applied on import.
    """
    bpy.ops.import_scene.fbx(
        filepath=filepath,
        use_anim=use_anim,
        global_scale=global_scale,
    )
    imported = [o.name for o in bpy.context.selected_objects]
    return {
        "filepath": filepath,
        "imported_objects": imported,
        "count": len(imported),
    }


def export_fbx(
    filepath: str,
    use_selection: bool = False,
    global_scale: float = 1.0,
    apply_modifiers: bool = True,
    use_mesh_modifiers: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Export to FBX format.

    Parameters
    ----------
    filepath : str
        Output path for the .fbx file.
    use_selection : bool
        Export only selected objects.
    global_scale : float
        Scale factor.
    apply_modifiers : bool
        Apply modifiers before export.
    use_mesh_modifiers : bool
        Apply mesh modifiers.
    """
    bpy.ops.export_scene.fbx(
        filepath=filepath,
        use_selection=use_selection,
        global_scale=global_scale,
        use_mesh_modifiers=use_mesh_modifiers,
    )
    return {
        "filepath": filepath,
        "use_selection": use_selection,
        "exported": True,
    }


def import_obj(
    filepath: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Import an OBJ file.

    Parameters
    ----------
    filepath : str
        Path to the .obj file.
    """
    # Blender 4.x uses the new importer
    try:
        bpy.ops.wm.obj_import(filepath=filepath)
    except AttributeError:
        bpy.ops.import_scene.obj(filepath=filepath)

    imported = [o.name for o in bpy.context.selected_objects]
    return {
        "filepath": filepath,
        "imported_objects": imported,
        "count": len(imported),
    }


def export_obj(
    filepath: str,
    use_selection: bool = False,
    apply_modifiers: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Export to OBJ format.

    Parameters
    ----------
    filepath : str
        Output path for the .obj file.
    use_selection : bool
        Export only selected objects.
    apply_modifiers : bool
        Apply modifiers before export.
    """
    try:
        bpy.ops.wm.obj_export(
            filepath=filepath,
            export_selected_objects=use_selection,
            apply_modifiers=apply_modifiers,
        )
    except AttributeError:
        bpy.ops.export_scene.obj(
            filepath=filepath,
            use_selection=use_selection,
            use_mesh_modifiers=apply_modifiers,
        )
    return {
        "filepath": filepath,
        "use_selection": use_selection,
        "exported": True,
    }


def import_gltf(
    filepath: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Import a glTF/GLB file.

    Parameters
    ----------
    filepath : str
        Path to the .gltf or .glb file.
    """
    bpy.ops.import_scene.gltf(filepath=filepath)
    imported = [o.name for o in bpy.context.selected_objects]
    return {
        "filepath": filepath,
        "imported_objects": imported,
        "count": len(imported),
    }


def export_gltf(
    filepath: str,
    export_format: str = "GLB",
    use_selection: bool = False,
    export_animations: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Export to glTF/GLB format.

    Parameters
    ----------
    filepath : str
        Output path.
    export_format : str
        GLB (binary) or GLTF_SEPARATE or GLTF_EMBEDDED.
    use_selection : bool
        Export only selected objects.
    export_animations : bool
        Include animations in the export.
    """
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format=export_format.upper(),
        use_selection=use_selection,
        export_animations=export_animations,
    )
    return {
        "filepath": filepath,
        "format": export_format.upper(),
        "use_selection": use_selection,
        "exported": True,
    }


def import_stl(
    filepath: str,
    global_scale: float = 1.0,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Import an STL file.

    Parameters
    ----------
    filepath : str
        Path to the .stl file.
    global_scale : float
        Scale factor.
    """
    try:
        bpy.ops.wm.stl_import(filepath=filepath, global_scale=global_scale)
    except AttributeError:
        bpy.ops.import_mesh.stl(filepath=filepath, global_scale=global_scale)

    imported = [o.name for o in bpy.context.selected_objects]
    return {
        "filepath": filepath,
        "imported_objects": imported,
        "count": len(imported),
    }


def export_stl(
    filepath: str,
    use_selection: bool = False,
    global_scale: float = 1.0,
    ascii_format: bool = False,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Export to STL format.

    Parameters
    ----------
    filepath : str
        Output path for the .stl file.
    use_selection : bool
        Export only selected objects.
    global_scale : float
        Scale factor.
    ascii_format : bool
        Use ASCII format instead of binary.
    """
    try:
        bpy.ops.wm.stl_export(
            filepath=filepath,
            export_selected_objects=use_selection,
            global_scale=global_scale,
            ascii_format=ascii_format,
        )
    except AttributeError:
        bpy.ops.export_mesh.stl(
            filepath=filepath,
            use_selection=use_selection,
            global_scale=global_scale,
            ascii=ascii_format,
        )
    return {
        "filepath": filepath,
        "use_selection": use_selection,
        "exported": True,
    }


def import_dae(
    filepath: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Import a Collada (.dae) file.

    Parameters
    ----------
    filepath : str
        Path to the .dae file.
    """
    bpy.ops.wm.collada_import(filepath=filepath)
    imported = [o.name for o in bpy.context.selected_objects]
    return {
        "filepath": filepath,
        "imported_objects": imported,
        "count": len(imported),
    }


def export_dae(
    filepath: str,
    use_selection: bool = False,
    apply_modifiers: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Export to Collada (.dae) format.

    Parameters
    ----------
    filepath : str
        Output path for the .dae file.
    use_selection : bool
        Export only selected objects.
    apply_modifiers : bool
        Apply modifiers before export.
    """
    bpy.ops.wm.collada_export(
        filepath=filepath,
        selected=use_selection,
        apply_modifiers=apply_modifiers,
    )
    return {
        "filepath": filepath,
        "use_selection": use_selection,
        "exported": True,
    }


# ---------------------------------------------------------------------------
# Registration map
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Any] = {
    "import_fbx": import_fbx,
    "export_fbx": export_fbx,
    "import_obj": import_obj,
    "export_obj": export_obj,
    "import_gltf": import_gltf,
    "export_gltf": export_gltf,
    "import_stl": import_stl,
    "export_stl": export_stl,
    "import_dae": import_dae,
    "export_dae": export_dae,
}
