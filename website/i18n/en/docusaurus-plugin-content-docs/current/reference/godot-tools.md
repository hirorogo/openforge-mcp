---
sidebar_position: 3
title: Godot Tools Reference
---

# Godot Tools Reference

A full list of Godot tools provided by OpenForge MCP. In Dynamic mode, use `list_tools` and `get_tool_schema` to retrieve details for each tool.

## Node

| Tool name | Description | Key parameters |
|---|---|---|
| `create_node` | Create a new node | `name`, `type`, `parent` |
| `delete_node` | Delete a node | `path` |
| `get_node_info` | Get detailed information about a node | `path` |
| `set_node_property` | Set a property on a node | `path`, `property`, `value` |
| `get_node_property` | Get a property from a node | `path`, `property` |
| `find_node` | Search for a node | `name`, `type`, `recursive` |
| `rename_node` | Rename a node | `path`, `new_name` |
| `reparent_node` | Change a node's parent | `path`, `new_parent` |
| `duplicate_node` | Duplicate a node | `path`, `new_name` |
| `get_scene_tree` | Get the scene tree | `depth` |
| `create_node2d` | Create a Node2D | `name`, `parent`, `position`, `rotation`, `scale` |
| `create_node3d` | Create a Node3D | `name`, `parent`, `position`, `rotation`, `scale` |
| `create_mesh_instance` | Create a MeshInstance3D | `name`, `parent`, `mesh_type`, `position` |
| `create_camera3d` | Create a Camera3D | `name`, `parent`, `position`, `rotation`, `fov` |
| `create_light3d` | Create a Light3D | `name`, `parent`, `type`, `position`, `energy`, `color` |
| `create_sprite2d` | Create a Sprite2D | `name`, `parent`, `texture`, `position` |
| `add_child_scene` | Instantiate a PackedScene and add it as a child node | `scene_path`, `parent`, `name` |

## Resource

| Tool name | Description | Key parameters |
|---|---|---|
| `create_resource` | Create a resource | `type`, `properties`, `save_path` |
| `load_resource` | Load a resource | `path` |
| `save_resource` | Save a resource | `resource`, `path` |
| `create_material3d` | Create a StandardMaterial3D | `name`, `albedo_color`, `metallic`, `roughness` |
| `assign_material` | Assign a material to a node | `node_path`, `material`, `surface_index` |
| `create_script` | Create a GDScript | `path`, `code` |
| `attach_script` | Attach a script to a node | `node_path`, `script_path` |
| `get_script_source` | Get the source code of a script | `path` |
| `update_script` | Update a script | `path`, `code` |
| `list_project_files` | List project files | `directory`, `extension_filter` |
| `create_scene` | Create a new scene | `name`, `root_type` |
| `open_scene` | Open a scene | `path` |
| `save_scene` | Save the current scene | `path` |
| `get_project_settings` | Get project settings | `property` |
| `set_project_settings` | Change project settings | `property`, `value` |

## Screenshot

| Tool name | Description | Key parameters |
|---|---|---|
| `take_screenshot` | Take a screenshot of the editor viewport | `width`, `height` |
| `take_game_screenshot` | Take a screenshot during game execution | `width`, `height` |
