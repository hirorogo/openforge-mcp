---
sidebar_position: 4
---

# Godot ツールの追加

## 必要なファイル

| ファイル | 役割 |
|---------|------|
| `packages/godot-plugin/addons/openforge/tools/xxx_tools.gd` | GDScript 実装 |
| `packages/mcp-server/src/tools/godot/xxx.ts` | パラメータ定義 |
| `packages/godot-plugin/addons/openforge/tool_executor.gd` | 登録 |
| `packages/mcp-server/src/server.ts` | 登録 (2行追加) |

## GDScript 実装

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

### 重要なルール

- `@tool` を先頭に付ける (エディタ内で動作させるため)
- 全関数は `static` で、`args: Dictionary` を受け取り `Dictionary` を返す
- Godot 4.x の API を使う
- `EditorInterface.get_edited_scene_root()` でシーンのルートを取得
- 追加したノードには `owner = root` を設定する (シーン保存時に含まれるようにする)

## tool_executor.gd への登録

```gdscript
# packages/godot-plugin/addons/openforge/tool_executor.gd の _init() 内に追加
var example_tools = preload("res://addons/openforge/tools/example_tools.gd")
_handlers["example.create_marker"] = example_tools.create_marker
_handlers["example.list_markers"] = example_tools.list_markers
```

## MCP 定義

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

## server.ts への登録

```typescript
import { exampleTools } from './tools/godot/example.js';
registry.registerTools(exampleTools);
```

## ポートと通信

Godot プラグインは `localhost:19802` で TCP サーバーを起動します。JSON-RPC 形式:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "example.create_marker",
  "params": {"name": "SpawnPoint", "position": {"x": 0, "y": 1, "z": 0}}
}
```
