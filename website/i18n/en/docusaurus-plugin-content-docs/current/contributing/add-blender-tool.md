---
sidebar_position: 3
---

# Adding a Blender Tool

## Required Files

| File | Role |
|------|------|
| `packages/blender-addon/tools/xxx_tools.py` | Python implementation |
| `packages/mcp-server/src/tools/blender/xxx.ts` | Parameter definition |
| `packages/blender-addon/tool_executor.py` | Registration (add 2 lines) |
| `packages/mcp-server/src/server.ts` | Registration (add 2 lines) |

## Python Implementation

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


# Tool name -> function mapping. tool_executor reads this automatically.
TOOLS = {
    "create_arch": create_arch,
    "measure_object": measure_object,
}
```

### Key Rules

- Every function must accept `**kwargs` (for future parameter additions)
- Return a `dict`. Non-dict return values are automatically wrapped in `{"value": ...}`
- Raise errors with `raise ValueError(...)`
- The `TOOLS` dict is required. This mapping is used for registration

## Registration in tool_executor.py

```python
# Add 2 lines to _build_registry() in packages/blender-addon/tool_executor.py
from .tools import example_tools
_register_module_tools(example_tools)
```

## MCP Definition

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

## Registration in server.ts

```typescript
import { exampleTools } from './tools/blender/example.js';
registry.registerTools(exampleTools);
```

## Tests

```python
# packages/blender-addon/tests/test_example_tools.py
from unittest.mock import MagicMock
import sys

# bpy mock (conftest.py sets this up automatically)
def test_tools_registered(bpy_mock):
    from tool_executor import execute
    # Verify registration in the TOOLS dict
    from tools.example_tools import TOOLS
    assert "create_arch" in TOOLS
    assert "measure_object" in TOOLS

def test_tool_count():
    from tools.example_tools import TOOLS
    assert len(TOOLS) == 2
```

Run:

```bash
cd packages/blender-addon/tests && python -m pytest test_example_tools.py -v
```

## Communication Protocol Details

JSON-RPC sent from the MCP Server to Blender:

```json
{
  "jsonrpc": "2.0",
  "id": 42,
  "method": "example.create_arch",
  "params": { "name": "Gate", "width": 3.0, "height": 4.0 }
}
```

The `method` follows the format `category.tool_name`. The `tool_executor.py` on the Blender side parses this and calls the corresponding function.
