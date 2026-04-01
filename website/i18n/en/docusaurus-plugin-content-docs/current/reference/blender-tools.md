---
sidebar_position: 2
title: Blender Tool Reference
---

# Blender Tool Reference

A complete list of Blender tools provided by OpenForge MCP. In Dynamic mode, you can use `list_tools` and `get_tool_schema` to retrieve details for each tool.

## Object

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_object` | Create a new object | `name`, `type`, `location`, `rotation`, `scale` |
| `delete_object` | Delete an object | `name` |
| `select_object` | Select an object | `name`, `extend` |
| `get_object_info` | Get detailed object information | `name` |
| `set_object_transform` | Set position, rotation, and scale | `name`, `location`, `rotation`, `scale` |
| `duplicate_object` | Duplicate an object | `name`, `linked` |
| `rename_object` | Rename an object | `name`, `new_name` |
| `set_object_visibility` | Toggle visibility | `name`, `visible` |
| `set_parent_object` | Set the parent object | `child`, `parent` |
| `join_objects` | Join multiple objects | `objects` |
| `separate_object` | Separate an object | `name`, `mode` |

## Mesh

| Tool Name | Description | Main Parameters |
|---|---|---|
| `edit_mesh` | Edit mesh in edit mode | `name`, `operation`, `params` |
| `subdivide_mesh` | Subdivide a mesh | `name`, `cuts` |
| `extrude_faces` | Extrude faces | `name`, `faces`, `offset` |
| `bevel_edges` | Bevel edges | `name`, `edges`, `width`, `segments` |
| `merge_vertices` | Merge vertices | `name`, `threshold` |
| `create_mesh_from_data` | Create a mesh from vertex and face data | `name`, `vertices`, `faces` |
| `get_mesh_stats` | Get mesh statistics | `name` |
| `apply_boolean` | Apply a boolean operation | `target`, `tool`, `operation` |
| `mirror_mesh` | Mirror a mesh | `name`, `axis` |
| `remesh` | Remesh | `name`, `mode`, `resolution` |

## Material

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_material` | Create a new material | `name`, `color`, `metallic`, `roughness` |
| `assign_material` | Assign a material to an object | `object`, `material` |
| `get_material_info` | Get material information | `name` |
| `set_material_property` | Modify a material property | `name`, `property`, `value` |
| `create_principled_bsdf` | Create a Principled BSDF material | `name`, `base_color`, `metallic`, `roughness`, `emission` |

## Scene

| Tool Name | Description | Main Parameters |
|---|---|---|
| `get_scene_info` | Get scene information | None |
| `list_objects` | List objects in the scene | `type_filter` |
| `set_scene_property` | Set a scene property | `property`, `value` |
| `create_collection` | Create a collection | `name`, `parent` |
| `move_to_collection` | Move an object to a collection | `object`, `collection` |

## Screenshot

| Tool Name | Description | Main Parameters |
|---|---|---|
| `take_screenshot` | Capture a viewport screenshot | `width`, `height` |
| `take_render_screenshot` | Capture a rendered image | `width`, `height`, `samples` |

## Animation

| Tool Name | Description | Main Parameters |
|---|---|---|
| `insert_keyframe` | Insert a keyframe | `object`, `property`, `frame`, `value` |
| `delete_keyframe` | Delete a keyframe | `object`, `property`, `frame` |
| `set_frame_range` | Set the frame range | `start`, `end` |
| `set_current_frame` | Set the current frame | `frame` |
| `create_action` | Create an action | `name`, `object` |
| `set_interpolation` | Set interpolation mode | `object`, `property`, `mode` |

## UV

| Tool Name | Description | Main Parameters |
|---|---|---|
| `unwrap_uv` | Unwrap UVs | `object`, `method` |
| `smart_uv_project` | Smart UV project | `object`, `angle_limit`, `island_margin` |
| `pack_uv_islands` | Pack UV islands | `object`, `margin` |
| `project_uv` | Project UVs | `object`, `direction` |

## Render

| Tool Name | Description | Main Parameters |
|---|---|---|
| `set_render_engine` | Set the render engine | `engine` |
| `set_render_resolution` | Set the render resolution | `width`, `height`, `percentage` |
| `set_render_samples` | Set the sample count | `samples` |
| `render_image` | Render an image | `output_path`, `file_format` |
| `render_animation` | Render an animation | `output_path`, `file_format`, `start`, `end` |
| `set_output_format` | Set the output format | `format`, `quality` |

## Armature

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_armature` | Create an armature | `name`, `location` |
| `add_bone` | Add a bone | `armature`, `name`, `head`, `tail`, `parent` |
| `set_bone_transform` | Set a bone's transform | `armature`, `bone`, `head`, `tail`, `roll` |
| `set_bone_parent` | Set a bone's parent | `armature`, `bone`, `parent` |
| `add_ik_constraint` | Add an IK constraint | `armature`, `bone`, `target`, `chain_length` |
| `set_pose_bone` | Set a bone in pose mode | `armature`, `bone`, `location`, `rotation` |

## VRM

| Tool Name | Description | Main Parameters |
|---|---|---|
| `export_vrm` | Export a VRM file | `output_path`, `version` |
| `import_vrm` | Import a VRM file | `file_path` |
| `set_vrm_meta` | Set VRM metadata | `title`, `author`, `license` |
| `setup_vrm_spring_bone` | Set up spring bones | `armature`, `bones`, `stiffness`, `gravity` |
| `setup_vrm_expression` | Set up a VRM expression | `name`, `preset`, `binds` |

## Lighting

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_light` | Create a light object | `name`, `type`, `energy`, `color`, `location` |
| `set_light_property` | Modify a light property | `name`, `property`, `value` |
| `set_world_hdri` | Set an HDRI environment map | `hdri_path`, `strength` |
| `set_world_color` | Set the world background color | `color` |

## Camera

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_camera` | Create a camera | `name`, `location`, `rotation`, `focal_length` |
| `set_active_camera` | Set the active camera | `name` |
| `set_camera_property` | Modify a camera property | `name`, `property`, `value` |
| `look_at` | Point a camera at a target | `camera`, `target` |

## Sculpt

| Tool Name | Description | Main Parameters |
|---|---|---|
| `enter_sculpt_mode` | Enter sculpt mode | `object` |
| `sculpt_stroke` | Execute a sculpt stroke | `brush`, `points`, `radius`, `strength` |
| `set_sculpt_brush` | Set the sculpt brush | `brush_type`, `radius`, `strength` |
| `apply_sculpt_mask` | Apply a sculpt mask | `object`, `vertices`, `values` |

## Texture

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_image_texture` | Create an image texture | `name`, `width`, `height`, `color` |
| `load_texture` | Load a texture file | `file_path`, `name` |
| `bake_texture` | Bake a texture | `object`, `type`, `width`, `height` |
| `paint_texture` | Paint on a texture | `object`, `color`, `position`, `radius` |

## Node (Node Editor)

| Tool Name | Description | Main Parameters |
|---|---|---|
| `add_shader_node` | Add a shader node | `material`, `node_type`, `location` |
| `connect_nodes` | Connect nodes | `material`, `from_node`, `from_output`, `to_node`, `to_input` |
| `set_node_value` | Set a node value | `material`, `node`, `input`, `value` |
| `create_node_group` | Create a node group | `name`, `nodes` |
| `add_geometry_node` | Add a geometry node | `object`, `node_type` |

## Import/Export

| Tool Name | Description | Main Parameters |
|---|---|---|
| `import_model` | Import a 3D model | `file_path`, `format` |
| `export_model` | Export a 3D model | `file_path`, `format`, `selection_only` |
| `import_image` | Import an image | `file_path` |
| `export_usd` | Export in USD format | `file_path`, `selection_only` |

Supported formats: FBX, OBJ, glTF/GLB, STL, PLY, USD, ABC

## Modifier

| Tool Name | Description | Main Parameters |
|---|---|---|
| `add_modifier` | Add a modifier | `object`, `type` |
| `set_modifier_property` | Set a modifier property | `object`, `modifier`, `property`, `value` |
| `apply_modifier` | Apply a modifier | `object`, `modifier` |
| `remove_modifier` | Remove a modifier | `object`, `modifier` |

Supported modifiers: Subdivision Surface, Mirror, Array, Boolean, Solidify, Bevel, Decimate, Remesh, Shrinkwrap, Armature, Lattice, and more
