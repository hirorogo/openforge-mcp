---
sidebar_position: 2
---

# Adding a Unity Tool

## Required Files

| File | Role |
|------|------|
| `packages/unity-plugin/Editor/Tools/XxxTools.cs` | C# implementation |
| `packages/mcp-server/src/tools/unity/xxx.ts` | Parameter definition |
| `packages/unity-plugin/Editor/ToolExecutor.cs` | Registration (add 1 line) |
| `packages/mcp-server/src/server.ts` | Registration (add 2 lines) |

## C# Implementation

```csharp
// packages/unity-plugin/Editor/Tools/ExampleTools.cs
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;

namespace OpenForge.Editor.Tools
{
    public static class ExampleTools
    {
        public static void Register()
        {
            ToolExecutor.RegisterTool("create_wall", CreateWall);
            ToolExecutor.RegisterTool("get_bounds", GetBounds);
        }

        private static ToolResult CreateWall(Dictionary<string, string> p)
        {
            var width = float.Parse(ToolExecutor.GetParam(p, "width", "5"));
            var height = float.Parse(ToolExecutor.GetParam(p, "height", "3"));

            var wall = GameObject.CreatePrimitive(PrimitiveType.Cube);
            wall.name = ToolExecutor.GetParam(p, "name", "Wall");
            wall.transform.localScale = new Vector3(width, height, 0.2f);
            Undo.RegisterCreatedObjectUndo(wall, "Create Wall");

            return ToolResult.Success($"Created wall {wall.name}", new Dictionary<string, object>
            {
                { "name", wall.name },
                { "instanceId", wall.GetInstanceID() }
            });
        }

        private static ToolResult GetBounds(Dictionary<string, string> p)
        {
            var name = ToolExecutor.GetRequiredParam(p, "name");
            var go = GameObject.Find(name);
            if (go == null) return ToolResult.Error($"Object '{name}' not found");

            var renderer = go.GetComponent<Renderer>();
            if (renderer == null) return ToolResult.Error("No Renderer component");

            var bounds = renderer.bounds;
            return ToolResult.Success("Bounds retrieved", new Dictionary<string, object>
            {
                { "center", $"{bounds.center.x},{bounds.center.y},{bounds.center.z}" },
                { "size", $"{bounds.size.x},{bounds.size.y},{bounds.size.z}" }
            });
        }
    }
}
```

### Key Rules

- Always use `Undo.RegisterCreatedObjectUndo` / `Undo.RecordObject`
- `ToolExecutor.GetRequiredParam` is for required parameters, `GetParam` is for optional parameters (with default values)
- Return results with `ToolResult.Success` / `ToolResult.Error`
- Namespace must be `OpenForge.Editor.Tools`

## Registration in ToolExecutor

```csharp
// Add 1 line to EnsureInitialized() in packages/unity-plugin/Editor/ToolExecutor.cs
ExampleTools.Register();
```

## MCP Definition

```typescript
// packages/mcp-server/src/tools/unity/example.ts
import { ToolDefinition } from '../../registry.js';

export const exampleTools: ToolDefinition[] = [
  {
    name: 'create_wall',
    description: 'Create a wall with specified dimensions',
    category: 'example',
    target: 'unity',
    parameters: {
      type: 'object',
      properties: {
        name:   { type: 'string', description: 'Wall name' },
        width:  { type: 'number', description: 'Width in meters' },
        height: { type: 'number', description: 'Height in meters' },
      },
      required: [],
    },
  },
  {
    name: 'get_bounds',
    description: 'Get the bounding box of an object',
    category: 'example',
    target: 'unity',
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
// Add 2 lines to packages/mcp-server/src/server.ts
import { exampleTools } from './tools/unity/example.js';
// ... add to the registerTools sequence:
registry.registerTools(exampleTools);
```

## Tests

TypeScript tool definition tests:

```typescript
// packages/mcp-server/src/__tests__/example.test.ts
import { describe, it, expect } from 'vitest';
import { exampleTools } from '../tools/unity/example.js';

describe('exampleTools', () => {
  it('should have correct tool count', () => {
    expect(exampleTools).toHaveLength(2);
  });

  it('each tool should have required fields', () => {
    for (const tool of exampleTools) {
      expect(tool.name).toBeTruthy();
      expect(tool.target).toBe('unity');
      expect(tool.parameters.type).toBe('object');
    }
  });
});
```

C# tests can only be run inside the Unity Editor.
