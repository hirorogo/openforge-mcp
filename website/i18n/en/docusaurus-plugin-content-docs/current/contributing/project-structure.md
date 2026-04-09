---
sidebar_position: 5
---

# Project Structure

## Directory Tree

```
openforge-mcp/
├── packages/
│   ├── mcp-server/                    # MCP Server (TypeScript)
│   │   ├── src/
│   │   │   ├── index.ts               # CLI entry point
│   │   │   ├── server.ts              # MCP Server core (tool registration here)
│   │   │   ├── router.ts              # Execute dispatch (unity/blender/godot)
│   │   │   ├── registry.ts            # ToolDefinition type, mode management
│   │   │   ├── http.ts                # HTTP API Server (port 19810)
│   │   │   ├── version-control.ts     # Git-based save/load
│   │   │   ├── transaction.ts         # Undo group management
│   │   │   ├── pipeline.ts            # Blender <-> Unity file transfer
│   │   │   ├── recipe.ts              # YAML recipe execution engine
│   │   │   ├── playtest.ts            # AI playtest control
│   │   │   ├── copilot.ts             # GitHub Copilot Dynamic Mode
│   │   │   ├── adapters/
│   │   │   │   ├── base.ts            # TCP client base class
│   │   │   │   ├── unity.ts           # Unity adapter (port 19800)
│   │   │   │   ├── blender.ts         # Blender adapter (port 19801)
│   │   │   │   └── godot.ts           # Godot adapter (port 19802)
│   │   │   ├── tools/
│   │   │   │   ├── unity/             # Unity tool definitions (*.ts)
│   │   │   │   ├── blender/           # Blender tool definitions (*.ts)
│   │   │   │   ├── godot/             # Godot tool definitions (*.ts)
│   │   │   │   └── system/            # System tool definitions (*.ts)
│   │   │   ├── cli/
│   │   │   │   ├── index.ts           # CLI routing
│   │   │   │   ├── setup.ts           # npx openforge-mcp setup
│   │   │   │   └── vscode-config.ts   # VS Code config generation
│   │   │   └── __tests__/             # Vitest tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── unity-plugin/                  # Unity Editor Plugin (C#)
│   │   ├── Editor/
│   │   │   ├── OpenForgeServer.cs     # TCP server (port 19800)
│   │   │   ├── ToolExecutor.cs        # Tool registration, dispatch, Undo management
│   │   │   ├── Tools/                 # Tool implementations (1 category = 1 file)
│   │   │   └── UI/
│   │   │       └── SetupWindow.cs     # Setup UI
│   │   └── package.json               # UPM package definition
│   │
│   ├── blender-addon/                 # Blender Addon (Python)
│   │   ├── __init__.py                # Addon registration
│   │   ├── server.py                  # TCP server (port 19801)
│   │   ├── tool_executor.py           # Tool registration, dispatch
│   │   ├── ui_panel.py                # N-panel UI
│   │   ├── tools/                     # Tool implementations (1 category = 1 file)
│   │   └── tests/                     # pytest tests
│   │
│   └── godot-plugin/                  # Godot Plugin (GDScript)
│       └── addons/openforge/
│           ├── plugin.cfg
│           ├── plugin.gd              # EditorPlugin
│           ├── server.gd              # TCP server (port 19802)
│           ├── tool_executor.gd       # Tool dispatch
│           └── tools/                 # Tool implementations
│
├── website/                           # Docusaurus documentation site
│   ├── docs/                          # Markdown pages
│   ├── src/pages/index.tsx            # Top page
│   └── docusaurus.config.ts           # Site configuration
│
├── README.md / README.ja.md
├── CONTRIBUTING.md / CONTRIBUTING.ja.md
└── LICENSE (MIT)
```

## Communication Ports

| Service | Port | Protocol |
|---------|------|----------|
| Unity Plugin | 19800 | JSON-RPC over TCP |
| Blender Addon | 19801 | JSON-RPC over TCP (length-prefixed) |
| Godot Plugin | 19802 | JSON-RPC over TCP (newline-delimited) |
| HTTP API | 19810 | REST (GET/POST) |

## Data Flow

```
1. AI calls the "execute" tool
2. server.ts passes it to router.ts
3. router.ts selects the adapter based on target (unity/blender/godot)
4. The adapter sends a JSON-RPC request over TCP
5. The engine-side plugin receives the request
6. tool_executor looks up the handler by tool name and runs it
7. The result is returned as a JSON-RPC response
8. server.ts returns it to the AI
```

## Mode Management (registry.ts)

| Mode | Behavior |
|------|----------|
| `full` | All tools are available |
| `essential` | Only tools in the `ESSENTIAL_TOOLS` set |
| `dynamic` | `DYNAMIC_BASE_TOOLS` (8) + on-demand loading |

In the execute handler of `server.ts`, when in dynamic mode, `registry.loadToolOnDemand()` is called if a tool has not been loaded yet.

## Test Structure

| Package | Framework | How to Run |
|---------|-----------|------------|
| mcp-server | Vitest | `npx vitest run` |
| blender-addon | pytest | `cd tests && python -m pytest -v` |
| unity-plugin | Unity Editor only | Play Mode Test Runner |
| godot-plugin | Godot only | -- |

## Code Style

| Language | Rules |
|----------|-------|
| TypeScript | strict, ESM (`import/export`), `.js` extension in imports |
| C# | `OpenForge.Editor.Tools` namespace, Undo required, main thread |
| Python | `TOOLS` dict, type hints, `**kwargs` acceptance |
| GDScript | `@tool`, static functions, `Dictionary` input/output |
| All languages | No emojis, no TODOs, minimal comments |
