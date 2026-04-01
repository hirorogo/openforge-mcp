# Contributing to OpenForge MCP

Want to add a tool, fix a bug, or improve the docs? All contributions are welcome.
No particular level of experience required.

---

## How to contribute (first-timers welcome)

### 1. Fork the repository

Click the "Fork" button on GitHub. This creates a copy under your account.

### 2. Clone your fork

```bash
git clone https://github.com/YOUR_USERNAME/openforge-mcp.git
cd openforge-mcp
```

### 3. Create a branch

```bash
git checkout -b feature/your-feature-name
```

### 4. Make your changes

See "How to add a tool" below for step-by-step instructions.

### 5. Run tests

```bash
# TypeScript
cd packages/mcp-server && npx vitest run

# Python
cd packages/blender-addon/tests && python -m pytest -v
```

### 6. Commit and push

```bash
git add .
git commit -m "Description of your change"
git push origin feature/your-feature-name
```

### 7. Open a Pull Request

Go to your fork on GitHub. Click "Pull Request" and submit.

---

## How to add a tool

### Adding a Unity tool

You need to create/edit 3 files:

**Step 1: Implement in C#**

Add a file to `packages/unity-plugin/Editor/Tools/`:

```csharp
// Example: packages/unity-plugin/Editor/Tools/MyNewTools.cs
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;

namespace OpenForge.Editor.Tools
{
    public static class MyNewTools
    {
        public static void Register()
        {
            ToolExecutor.RegisterTool("my_new_tool", Execute);
        }

        private static ToolResult Execute(Dictionary<string, string> parameters)
        {
            var name = ToolExecutor.GetRequiredParam(parameters, "name");
            var go = new GameObject(name);
            Undo.RegisterCreatedObjectUndo(go, "Create " + name);
            return ToolResult.Success("Created " + name);
        }
    }
}
```

**Step 2: Register in ToolExecutor.cs**

Add to `EnsureInitialized()`:

```csharp
MyNewTools.Register();
```

**Step 3: Add MCP server definition**

Create `packages/mcp-server/src/tools/unity/my_new.ts`:

```typescript
import { ToolDefinition } from '../../registry.js';

export const myNewTools: ToolDefinition[] = [
  {
    name: 'my_new_tool',
    description: 'Creates something new',
    category: 'my_category',
    target: 'unity',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the thing to create' },
      },
      required: ['name'],
    },
  },
];
```

Import and register in `packages/mcp-server/src/server.ts`:

```typescript
import { myNewTools } from './tools/unity/my_new.js';
registry.registerTools(myNewTools);
```

### Adding a Blender tool

**Step 1: Implement in Python**

Add a file to `packages/blender-addon/tools/`:

```python
# Example: packages/blender-addon/tools/my_new_tools.py
import bpy
from typing import Any

def my_new_tool(name: str = "Object", **kwargs: Any) -> dict:
    """Creates something new in Blender."""
    bpy.ops.mesh.primitive_cube_add()
    obj = bpy.context.active_object
    obj.name = name
    return {"name": obj.name, "type": obj.type}

TOOLS = {
    "my_new_tool": my_new_tool,
}
```

**Step 2: Register in tool_executor.py**

```python
from .tools import my_new_tools
_register_module_tools(my_new_tools)
```

**Step 3: Add MCP server definition** (same as Unity, but with `target: 'blender'`)

### Adding a Godot tool

Add a GDScript file to `packages/godot-plugin/addons/openforge/tools/` and register it in `tool_executor.gd`.

---

## Project structure

```
openforge-mcp/
  packages/
    mcp-server/           MCP server (TypeScript)
    unity-plugin/         Unity plugin (C#)
    blender-addon/        Blender addon (Python)
    godot-plugin/         Godot plugin (GDScript)
  website/                Documentation site (Docusaurus)
```

## Code rules

- **No emojis** in code, comments, or UI text
- **No TODOs or stubs** -- write complete implementations
- **Minimal comments** -- code should be self-explanatory
- **C#:** Always use `Undo`. Namespace: `OpenForge.Editor.Tools`
- **Python:** Register in `TOOLS` dict. Use type hints.
- **TypeScript:** strict mode. Avoid `any` outside tests.

## PR checklist

- [ ] New tools have both MCP definitions (TypeScript) and implementations (C#/Python/GDScript)
- [ ] All existing tests pass
- [ ] No emojis in code
- [ ] PR description explains what changed and why

## Docs-only PRs are welcome too

You can contribute without writing code:
- Fix typos
- Improve explanations
- Add tutorials
- Improve translations

Edit markdown files in `website/docs/` and submit a PR.

## Issues

- **Bug reports:** what happened, what should happen, steps to reproduce, environment
- **Feature requests:** what you want to do and why

## Questions

Open an issue with a "question" label.
