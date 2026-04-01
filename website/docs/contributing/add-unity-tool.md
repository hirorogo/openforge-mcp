---
sidebar_position: 2
---

# Unity ツールの追加

## 必要なファイル

| ファイル | 役割 |
|---------|------|
| `packages/unity-plugin/Editor/Tools/XxxTools.cs` | C# 実装 |
| `packages/mcp-server/src/tools/unity/xxx.ts` | パラメータ定義 |
| `packages/unity-plugin/Editor/ToolExecutor.cs` | 登録 (1行追加) |
| `packages/mcp-server/src/server.ts` | 登録 (2行追加) |

## C# 実装

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

### 重要なルール

- `Undo.RegisterCreatedObjectUndo` / `Undo.RecordObject` を必ず使う
- `ToolExecutor.GetRequiredParam` は必須パラメータ、`GetParam` はオプション (デフォルト値付き)
- `ToolResult.Success` / `ToolResult.Error` で結果を返す
- namespace は `OpenForge.Editor.Tools`

## ToolExecutor への登録

```csharp
// packages/unity-plugin/Editor/ToolExecutor.cs の EnsureInitialized() に1行追加
ExampleTools.Register();
```

## MCP 定義

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

## server.ts への登録

```typescript
// packages/mcp-server/src/server.ts に2行追加
import { exampleTools } from './tools/unity/example.js';
// ... registerTools の並びに追加:
registry.registerTools(exampleTools);
```

## テスト

TypeScript 側のツール定義テスト:

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

C# 側のテストは Unity Editor 内でのみ実行可能です。
