---
sidebar_position: 3
---

# Blender ツールの追加

## 必要なファイル

| ファイル | 役割 |
|---------|------|
| `packages/blender-addon/tools/xxx_tools.py` | Python 実装 |
| `packages/mcp-server/src/tools/blender/xxx.ts` | パラメータ定義 |
| `packages/blender-addon/tool_executor.py` | 登録 (2行追加) |
| `packages/mcp-server/src/server.ts` | 登録 (2行追加) |

## Python 実装

```python
# packages/blender-addon/tools/example_tools.py
import bpy
from typing import Any


def create_arch(
    name: str = "Arch",
    width: float = 2.0,
    height: float = 3.0,
    depth: float = 0.5,
    **kwargs: Any,
) -> dict:
    """Create an arch shape from two pillars and a top bar."""
    # Left pillar
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-width / 2, 0, height / 2))
    left = bpy.context.active_object
    left.scale = (depth, depth, height)
    left.name = f"{name}_Left"

    # Right pillar
    bpy.ops.mesh.primitive_cube_add(size=1, location=(width / 2, 0, height / 2))
    right = bpy.context.active_object
    right.scale = (depth, depth, height)
    right.name = f"{name}_Right"

    # Top bar
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, height + depth / 2))
    top = bpy.context.active_object
    top.scale = (width + depth, depth, depth)
    top.name = f"{name}_Top"

    return {
        "parts": [left.name, right.name, top.name],
        "width": width,
        "height": height,
    }


def measure_object(name: str = "", **kwargs: Any) -> dict:
    """Get the dimensions of an object."""
    obj = bpy.data.objects.get(name)
    if obj is None:
        raise ValueError(f"Object '{name}' not found")

    dims = obj.dimensions
    return {
        "name": obj.name,
        "dimensions": {"x": round(dims.x, 4), "y": round(dims.y, 4), "z": round(dims.z, 4)},
        "vertex_count": len(obj.data.vertices) if hasattr(obj.data, "vertices") else 0,
    }


# ツール名 → 関数 のマッピング。tool_executor が自動で読み取る。
TOOLS = {
    "create_arch": create_arch,
    "measure_object": measure_object,
}
```

### 重要なルール

- 各関数は `**kwargs` を受け取る (将来のパラメータ追加に対応)
- `dict` を返す。`dict` 以外を返すと自動で `{"value": ...}` にラップされる
- エラーは `raise ValueError(...)` で投げる
- `TOOLS` dict は必須。このマッピングが登録に使われる

## tool_executor.py への登録

```python
# packages/blender-addon/tool_executor.py の _build_registry() に2行追加
from .tools import example_tools
_register_module_tools(example_tools)
```

## MCP 定義

```typescript
// packages/mcp-server/src/tools/blender/example.ts
import { ToolDefinition } from '../../registry.js';

export const exampleTools: ToolDefinition[] = [
  {
    name: 'create_arch',
    description: 'Create an arch shape from pillars and a top bar',
    category: 'example',
    target: 'blender',
    parameters: {
      type: 'object',
      properties: {
        name:   { type: 'string', description: 'Base name for arch parts' },
        width:  { type: 'number', description: 'Width of the arch' },
        height: { type: 'number', description: 'Height of the arch' },
        depth:  { type: 'number', description: 'Depth/thickness of pillars' },
      },
      required: [],
    },
  },
  {
    name: 'measure_object',
    description: 'Get the dimensions and vertex count of an object',
    category: 'example',
    target: 'blender',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Object name' },
      },
      required: ['name'],
    },
  },
];
```

## server.ts への登録

```typescript
import { exampleTools } from './tools/blender/example.js';
registry.registerTools(exampleTools);
```

## テスト

```python
# packages/blender-addon/tests/test_example_tools.py
from unittest.mock import MagicMock
import sys

# bpy のモック (conftest.py が自動で設定する)
def test_tools_registered(bpy_mock):
    from tool_executor import execute
    # TOOLS dict に登録されているか確認
    from tools.example_tools import TOOLS
    assert "create_arch" in TOOLS
    assert "measure_object" in TOOLS

def test_tool_count():
    from tools.example_tools import TOOLS
    assert len(TOOLS) == 2
```

実行:

```bash
cd packages/blender-addon/tests && python -m pytest test_example_tools.py -v
```

## 通信プロトコル詳細

MCP Server が Blender に送る JSON-RPC:

```json
{
  "jsonrpc": "2.0",
  "id": 42,
  "method": "example.create_arch",
  "params": { "name": "Gate", "width": 3.0, "height": 4.0 }
}
```

`method` は `カテゴリ.ツール名` の形式。Blender 側の `tool_executor.py` がこれをパースして対応する関数を呼び出します。
