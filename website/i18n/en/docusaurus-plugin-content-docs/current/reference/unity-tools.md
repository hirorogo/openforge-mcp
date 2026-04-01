---
sidebar_position: 1
title: Unity Tool Reference
---

# Unity Tool Reference

A complete list of Unity tools provided by OpenForge MCP. In Dynamic mode, you can use `list_tools` and `get_tool_schema` to retrieve details for each tool.

## Scene

| Tool Name | Description | Main Parameters |
|---|---|---|
| `get_scene_info` | Get current scene information | None |
| `create_scene` | Create a new scene | `name` |
| `open_scene` | Open an existing scene | `path` |
| `save_scene` | Save the current scene | `path` (omit to overwrite) |
| `get_hierarchy` | Get the scene hierarchy | `depth` (hierarchy depth to retrieve) |

## GameObject

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_gameobject` | Create a new GameObject | `name`, `type`, `position`, `rotation`, `scale` |
| `delete_gameobject` | Delete a GameObject | `target` |
| `find_gameobject` | Find a GameObject by name | `name`, `tag` |
| `get_gameobject_info` | Get detailed object information | `target` |
| `set_transform` | Set position, rotation, and scale | `target`, `position`, `rotation`, `scale` |
| `set_parent` | Set the parent object | `target`, `parent` |
| `duplicate_gameobject` | Duplicate an object | `target`, `new_name` |
| `rename_gameobject` | Rename an object | `target`, `new_name` |
| `set_active` | Toggle an object's active state | `target`, `active` |
| `add_component` | Add a component | `target`, `component_type` |
| `remove_component` | Remove a component | `target`, `component_type` |
| `set_component_property` | Set a component property | `target`, `component_type`, `property`, `value` |

## Material

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_material` | Create a new material | `name`, `shader`, `color` |
| `set_material` | Apply a material to an object | `target`, `material` |
| `get_material_info` | Get material information | `target` |
| `set_material_property` | Set a material property | `material`, `property`, `value` |
| `set_material_texture` | Set a texture | `material`, `property`, `texture_path` |

## Script

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_script` | Create a C# script | `name`, `code`, `path` |
| `attach_script` | Attach a script to an object | `target`, `script_name` |
| `get_script_source` | Get a script's source code | `script_name` |
| `update_script` | Update a script | `name`, `code` |
| `list_scripts` | List scripts in the project | `path` (search path) |

## Screenshot

| Tool Name | Description | Main Parameters |
|---|---|---|
| `take_screenshot` | Capture a Scene View screenshot | `width`, `height` |
| `take_game_screenshot` | Capture a Game View screenshot | `width`, `height` |

## Animation

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_animation_clip` | Create an animation clip | `name`, `length` |
| `add_animation_keyframe` | Add a keyframe | `clip`, `path`, `property`, `time`, `value` |
| `set_animator_controller` | Set an Animator Controller | `target`, `controller` |
| `create_animator_state` | Create an animator state | `controller`, `state_name`, `clip` |
| `set_animation_curve` | Set an animation curve | `clip`, `path`, `property`, `keys` |
| `play_animation` | Play an animation | `target`, `clip_name` |

## Physics

| Tool Name | Description | Main Parameters |
|---|---|---|
| `add_rigidbody` | Add a Rigidbody | `target`, `mass`, `use_gravity`, `is_kinematic` |
| `add_collider` | Add a Collider | `target`, `type`, `is_trigger` |
| `set_physics_material` | Set a physics material | `target`, `friction`, `bounciness` |
| `add_joint` | Add a Joint | `target`, `type`, `connected_body` |
| `set_rigidbody_constraints` | Set Rigidbody constraints | `target`, `constraints` |
| `raycast` | Execute a raycast | `origin`, `direction`, `max_distance` |

## UI (User Interface)

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_canvas` | Create a Canvas | `name`, `render_mode` |
| `create_ui_text` | Create a Text element | `name`, `text`, `font_size`, `color` |
| `create_ui_image` | Create an Image element | `name`, `sprite`, `color` |
| `create_ui_button` | Create a Button | `name`, `text`, `on_click` |
| `create_ui_panel` | Create a Panel | `name`, `color`, `size` |
| `set_ui_rect` | Set a RectTransform | `target`, `anchors`, `position`, `size` |

## Lighting

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_light` | Create a light | `name`, `type`, `color`, `intensity`, `position`, `rotation` |
| `set_light_property` | Modify a light property | `target`, `property`, `value` |
| `set_ambient_light` | Set ambient lighting | `color`, `intensity`, `mode` |
| `set_fog` | Set fog | `enabled`, `color`, `mode`, `density` |
| `set_skybox` | Set the skybox | `material` |
| `bake_lighting` | Bake lightmaps | `quality` |

## Camera

| Tool Name | Description | Main Parameters |
|---|---|---|
| `set_camera` | Set camera position and rotation | `position`, `rotation`, `fov` |
| `get_camera_info` | Get camera information | `target` |
| `create_camera` | Create a new camera | `name`, `position`, `rotation`, `fov` |
| `set_camera_property` | Modify a camera property | `target`, `property`, `value` |

## Prefab

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_prefab` | Create a prefab from an object | `target`, `path` |
| `instantiate_prefab` | Instantiate a prefab | `path`, `position`, `rotation` |
| `apply_prefab_overrides` | Apply prefab overrides | `target` |
| `unpack_prefab` | Unpack a prefab | `target`, `mode` |

## Audio

| Tool Name | Description | Main Parameters |
|---|---|---|
| `add_audio_source` | Add an AudioSource | `target`, `clip`, `volume`, `loop` |
| `set_audio_property` | Set an audio property | `target`, `property`, `value` |
| `create_audio_mixer` | Create an Audio Mixer | `name` |
| `set_audio_mixer_param` | Set a Mixer parameter | `mixer`, `param`, `value` |

## Terrain

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_terrain` | Create a Terrain | `name`, `width`, `height`, `length` |
| `set_terrain_height` | Set terrain height | `target`, `heights`, `offset_x`, `offset_y` |
| `paint_terrain_texture` | Paint a terrain texture | `target`, `layer`, `position`, `radius`, `opacity` |
| `add_terrain_layer` | Add a Terrain Layer | `target`, `texture`, `normal_map`, `tile_size` |
| `place_terrain_trees` | Place trees on the terrain | `target`, `prefab`, `positions`, `density` |
| `set_terrain_detail` | Set grass and detail meshes | `target`, `prototype`, `density` |

## NavMesh

| Tool Name | Description | Main Parameters |
|---|---|---|
| `bake_navmesh` | Bake a NavMesh | `agent_radius`, `agent_height`, `step_height` |
| `add_navmesh_agent` | Add a NavMeshAgent | `target`, `speed`, `radius`, `height` |
| `set_navmesh_destination` | Set the agent destination | `target`, `destination` |
| `add_navmesh_obstacle` | Add a NavMesh Obstacle | `target`, `shape`, `carve` |
| `add_offmesh_link` | Add an OffMeshLink | `start`, `end`, `bidirectional` |

## VFX (Visual Effects)

| Tool Name | Description | Main Parameters |
|---|---|---|
| `create_particle_system` | Create a Particle System | `name`, `position`, `preset` |
| `set_particle_property` | Modify a particle property | `target`, `module`, `property`, `value` |
| `create_trail_renderer` | Create a Trail Renderer | `target`, `time`, `width`, `color` |
| `create_line_renderer` | Create a Line Renderer | `target`, `points`, `width`, `color` |

## Optimization

| Tool Name | Description | Main Parameters |
|---|---|---|
| `get_scene_stats` | Get scene statistics | None |
| `set_static_flags` | Set Static flags | `target`, `flags` |
| `set_lod_group` | Set a LOD Group | `target`, `lod_levels` |
| `set_occlusion_area` | Set an Occlusion Area | `position`, `size` |
| `batch_set_quality` | Batch-set texture quality | `max_size`, `compression` |

## Build

| Tool Name | Description | Main Parameters |
|---|---|---|
| `build_project` | Build the project | `target_platform`, `output_path`, `scenes` |
| `get_build_settings` | Get build settings | None |
| `set_build_settings` | Modify build settings | `platform`, `settings` |
| `switch_platform` | Switch the target platform | `platform` |
