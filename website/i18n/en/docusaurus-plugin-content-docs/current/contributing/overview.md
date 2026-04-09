---
sidebar_position: 1
---

# Development Guide

This is a technical guide for adding tools and features to OpenForge MCP.

## Setting Up the Development Environment

```bash
git clone https://github.com/hirorogo/openforge-mcp.git
cd openforge-mcp
pnpm install
pnpm build
```

Run tests:

```bash
cd packages/mcp-server && npx vitest run    # TypeScript (166+ tests)
cd packages/blender-addon/tests && python -m pytest -v  # Python (75+ tests)
```

## Architecture Overview

Adding a tool requires writing code in **two places**:

```
1. MCP Server (TypeScript)  -- Tool definition (name, parameter schema)
2. Editor Plugin (C#/Py/GD) -- Tool implementation (actual logic)
```

The MCP Server receives requests from the AI and forwards them to the Editor Plugin over TCP.
The Editor Plugin calls the actual API (Unity/Blender/Godot) and returns the result.

```
AI Client -> MCP Server -> TCP (JSON-RPC) -> Editor Plugin -> Engine API
```

## File Mapping

| Implementation (Engine side) | Definition (MCP Server side) |
|------------------------------|------------------------------|
| `unity-plugin/Editor/Tools/XxxTools.cs` | `mcp-server/src/tools/unity/xxx.ts` |
| `blender-addon/tools/xxx_tools.py` | `mcp-server/src/tools/blender/xxx.ts` |
| `godot-plugin/addons/openforge/tools/xxx_tools.gd` | `mcp-server/src/tools/godot/xxx.ts` |

## Tool Definition Schema (Common)

All tool definitions follow the `ToolDefinition` type:

```typescript
// packages/mcp-server/src/registry.ts
export interface ToolDefinition {
  name: string;          // Tool name (snake_case)
  description: string;   // Description (English)
  category: string;      // Category name
  target: 'unity' | 'blender' | 'godot';
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      default?: unknown;
    }>;
    required?: string[];
  };
}
```

## Registration Flow

1. Create a tool definition file (`mcp-server/src/tools/xxx/`)
2. Import it in `mcp-server/src/server.ts` and call `registry.registerTools()`
3. Implement the handler in the engine-side plugin
4. Register it in the engine-side dispatcher

See the following pages for specific instructions for each engine.
