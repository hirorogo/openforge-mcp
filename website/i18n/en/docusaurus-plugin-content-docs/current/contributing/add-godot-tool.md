---
sidebar_position: 4
---

# Adding a Godot Tool

## Required Files

| File | Role |
|------|------|
| `packages/godot-plugin/addons/openforge/tools/xxx_tools.gd` | GDScript implementation |
| `packages/mcp-server/src/tools/godot/xxx.ts` | Parameter definition |
| `packages/godot-plugin/addons/openforge/tool_executor.gd` | Registration |
| `packages/mcp-server/src/server.ts` | Registration (add 2 lines) |

## GDScript Implementation

```gdscript
# packages/godot-plugin/addons/openforge/tools/example_tools.gd
@tool
extends RefCounted

static func create_marker(args: Dictionary) -> Dictionary:
    var name: String = args.get("name", "Marker")
    var pos: Dictionary = args.get("position", {"x": 0, "y": 0, "z": 0})

    var marker := Marker3D.new()
    marker.name = name
    marker.position = Vector3(pos.get("x", 0), pos.get("y", 0), pos.get("z", 0))

    var root := EditorInterface.get_edited_scene_root()
    root.add_child(marker)
    marker.owner = root

    return {"name": marker.name, "position": {"x": marker.position.x, "y": marker.position.y, "z": marker.position.z}}


static func list_markers(_args: Dictionary) -> Dictionary:
    var root := EditorInterface.get_edited_scene_root()
    var markers: Array[Dictionary] = []
    _find_markers(root, markers)
    return {"markers": markers, "count": markers.size()}


static func _find_markers(node: Node, result: Array[Dictionary]) -> void:
    if node is Marker3D:
        result.append({"name": node.name, "position": {"x": node.position.x, "y": node.position.y, "z": node.position.z}})
    for child in node.get_children():
        _find_markers(child, result)
```

### Key Rules

- Add `@tool` at the top (required for running inside the editor)
- All functions must be `static`, accept `args: Dictionary`, and return `Dictionary`
- Use Godot 4.x API
- Use `EditorInterface.get_edited_scene_root()` to access the scene root
- Set `owner = root` on added nodes (so they are included when saving the scene)

## Registration in tool_executor.gd

```gdscript
# Add to _init() in packages/godot-plugin/addons/openforge/tool_executor.gd
var example_tools = preload("res://addons/openforge/tools/example_tools.gd")
_handlers["example.create_marker"] = example_tools.create_marker
_handlers["example.list_markers"] = example_tools.list_markers
```

## MCP Definition

```typescript
// packages/mcp-server/src/tools/godot/example.ts
import { ToolDefinition } from '../../registry.js';

export const exampleTools: ToolDefinition[] = [
  {
    name: 'create_marker',
    description: 'Create a Marker3D node at the specified position',
    category: 'example',
    target: 'godot',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Marker name' },
        position: {
          type: 'object',
          description: 'Position {x, y, z}',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            z: { type: 'number' },
          },
        },
      },
      required: [],
    },
  },
  {
    name: 'list_markers',
    description: 'List all Marker3D nodes in the scene',
    category: 'example',
    target: 'godot',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];
```

## Registration in server.ts

```typescript
import { exampleTools } from './tools/godot/example.js';
registry.registerTools(exampleTools);
```

## Ports and Communication

The Godot plugin starts a TCP server on `localhost:19802`. JSON-RPC format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "example.create_marker",
  "params": {"name": "SpawnPoint", "position": {"x": 0, "y": 1, "z": 0}}
}
```
