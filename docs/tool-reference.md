# Tool Reference

## How Tools Work

OpenForge uses a 3-meta-tool architecture. Instead of exposing hundreds of individual tools to the AI (which wastes tokens), only 3 tools are registered:

1. **list_categories** -- returns available tool categories
2. **list_tools** -- returns tools within a category, including parameter schemas
3. **execute** -- runs a specific tool

The AI discovers tools on demand: first it lists categories, then picks one, then executes a tool from that category.

## Modes

### Full Mode (default)

All tools available. Best for cloud-hosted models with large context windows.

### Essential Mode

A curated subset of ~80 core tools. 62% smaller context footprint. Best for local LLMs running on LM Studio or Ollama where context is limited.

### Dynamic Mode

8 base tools registered at startup. Additional tools loaded on demand when the AI requests them. Best for VS Code with GitHub Copilot's dynamic tool loading.

## Unity Tools

### Scene

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| create_scene | Create a new scene | name |
| load_scene | Open an existing scene | path |
| save_scene | Save the current scene | path (optional) |
| get_scene_info | Get scene metadata | -- |
| get_hierarchy | Get full scene object tree | -- |

### GameObject

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| create_gameobject | Create an object or primitive | name, primitiveType, position |
| find_gameobject | Find objects by name/tag/layer | name, tag, layer, component |
| destroy_gameobject | Delete an object | name or path |
| set_transform | Set position/rotation/scale | name, position, rotation, scale, space |
| set_active | Enable or disable an object | name, active |
| add_component | Add a component | gameObject, componentType |
| remove_component | Remove a component | gameObject, componentType |
| get_components | List all components | name |
| set_parent | Change parent object | child, parent |
| duplicate | Duplicate an object | name, newName |

### Material

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| create_material | Create a new material | name, shader |
| set_material_color | Set a color property | material, property, color |
| set_material_shader | Change the shader | material, shader |
| set_material_texture | Assign a texture | material, property, texturePath |
| set_material_property | Set any shader property | material, property, value |
| get_material_info | Get material details | material |

### Script

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| create_script | Generate a new C# script | name, namespace, template |
| edit_script | Modify an existing script | path, content or find/replace |
| attach_script | Add a script to an object | gameObject, scriptName |
| get_script | Read script contents | path |
| search_code | Search all scripts for a pattern | pattern, regex |

### Screenshot

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| get_viewport_screenshot | Capture the scene/game view | source (scene or game), width, height |

## Blender Tools

### Object

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| create_mesh | Create a primitive mesh | type (cube, sphere, etc.), location, size |
| transform_object | Set location/rotation/scale | name, location, rotation, scale |
| duplicate_object | Duplicate an object | name, linked |
| delete_object | Delete an object | name |
| set_origin | Set the object origin | name, type |
| join_objects | Merge objects into one | names |
| separate_mesh | Separate mesh parts | name, type |

### Mesh

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| extrude | Extrude selected faces | object, value |
| bevel | Bevel edges | object, width, segments |
| subdivide | Subdivide mesh | object, cuts |
| boolean_operation | Boolean modifier | object, other, operation |
| decimate | Reduce polygon count | object, ratio |
| merge_by_distance | Remove duplicate vertices | object, threshold |
| knife_cut | Cut mesh with a plane | object, plane_co, plane_no |

### Material

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| create_material | Create a Principled BSDF material | name, color |
| set_color | Set base color | material, color |
| set_metallic | Set metallic value | material, value |
| set_roughness | Set roughness value | material, value |
| create_glass_material | Create glass material | name, ior, color |
| create_emission_material | Create emissive material | name, color, strength |

### Scene

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| get_scene_info | Get scene metadata | -- |
| get_objects_list | List all objects | type_filter |
| set_render_engine | Switch render engine | engine (cycles, eevee, workbench) |
| set_resolution | Set render resolution | x, y, percentage |
| set_frame_range | Set animation frame range | start, end |

### Screenshot

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| get_viewport_screenshot | Capture the 3D viewport | width, height |
