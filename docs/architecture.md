# Architecture

## Overview

```
AI Client (Claude Desktop, Cursor, etc.)
    |
    | MCP Protocol (stdio / SSE)
    v
OpenForge MCP Server (Node.js)
    |
    | JSON-RPC over TCP
    v
Unity Editor / Blender
```

## 3 Meta-Tool Design

Instead of exposing hundreds of individual tools to the AI (which wastes tokens), OpenForge registers only 3 tools:

| Tool | Purpose |
|------|---------|
| `list_categories` | Show available tool categories for Unity or Blender |
| `list_tools` | Show tools in a specific category with their parameters |
| `execute` | Run a tool with the given parameters |

The AI discovers tools on demand: first it lists categories, then picks one, then executes. This keeps context usage low even with hundreds of tools available.

## Components

| Component | Language | Role |
|-----------|----------|------|
| MCP Server | TypeScript (Node.js) | Communicates with AI clients via MCP SDK |
| Unity Plugin | C# | Runs a TCP server inside Unity Editor |
| Blender Addon | Python | Runs a TCP server inside Blender |

## Communication Protocol

The MCP server communicates with Unity/Blender plugins via JSON-RPC over TCP:

```json
// Request (MCP Server -> Unity/Blender)
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "execute_tool",
  "params": {
    "tool": "create_gameobject",
    "args": {
      "name": "Player",
      "position": [0, 1, 0],
      "primitiveType": "Capsule"
    }
  }
}

// Response (Unity/Blender -> MCP Server)
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true,
    "data": {
      "instanceId": 12345,
      "name": "Player",
      "path": "/Player"
    }
  }
}
```

## Ports

| Service | Default Port |
|---------|-------------|
| Unity Plugin | 19800 |
| Blender Addon | 19801 |
| HTTP API | 19810 |

All ports are configurable via environment variables or the setup UI.

## Tool Modes

| Mode | Tools | Best for |
|------|-------|----------|
| Full | All tools | Claude Desktop, Cursor with cloud models |
| Essential | ~80 core tools (62% smaller) | LM Studio, Ollama, local LLMs with limited context |
| Dynamic | 8 base + on-demand loading | VS Code with GitHub Copilot |

```bash
npx openforge-mcp setup --mode essential --client lmstudio
```

## HTTP API (Multi-Agent)

For automation, CI/CD, or multi-agent workflows, the server exposes a REST API on port 19810:

```bash
# Execute a tool
curl -X POST http://localhost:19810/api/execute \
  -H "Content-Type: application/json" \
  -d '{"target": "unity", "tool": "create_gameobject", "params": {"name": "Cube", "primitiveType": "Cube"}}'

# List categories
curl http://localhost:19810/api/categories

# List tools in a category
curl http://localhost:19810/api/tools/scene

# Check connection status
curl http://localhost:19810/api/status
```

Multiple AI agents can access Unity/Blender simultaneously. Requests are queued and executed sequentially to ensure thread safety.

## Project Structure

```
openforge-mcp/
  packages/
    mcp-server/           TypeScript MCP server + HTTP API
      src/
        index.ts          Entry point
        server.ts         MCP server (SDK integration)
        router.ts         Routes execute calls to adapters
        registry.ts       Tool registry with mode support
        http.ts           HTTP API server
        adapters/         TCP clients for Unity/Blender
        tools/            Tool definitions (schemas)
    unity-plugin/         Unity Editor plugin (C#)
      Editor/
        OpenForgeServer.cs    TCP server
        ToolExecutor.cs       Tool dispatch + undo groups
        Tools/                Tool implementations
        UI/                   Setup window
    blender-addon/        Blender addon (Python)
      server.py           TCP server
      tool_executor.py    Tool dispatch
      tools/              Tool implementations
      ui_panel.py         N-panel UI
```

## Building from Source

**Requirements:** Node.js 18+, pnpm

```bash
git clone https://github.com/hirorogo/openforge-mcp.git
cd openforge-mcp
pnpm install
pnpm build
```

**Run tests:**

```bash
# TypeScript (101 unit + 16 integration tests)
cd packages/mcp-server && npx vitest run

# Python (75 tests)
cd packages/blender-addon/tests && python -m pytest -v
```
