---
sidebar_position: 2
title: Tool Modes
---

# Tool Modes

OpenForge MCP provides 3 tool modes that can be selected based on the AI client and model capabilities.

## Mode Overview

| Mode | Exposed Tools | Token Consumption | Recommended For |
|---|---|---|---|
| **Full** | All tools (100+) | High | Large models, debugging |
| **Essential** | Core tools only (~20) | Medium | Balanced usage |
| **Dynamic** (default) | 3 meta-tools | Low | General use, local LLMs |

## Full Mode

Exposes all tools directly to the AI client. The AI can select and call tools straight from the list, making this the simplest mode of operation.

**Advantages:**
- Tool calls complete in a single step
- The AI knows all tools and parameters upfront

**Disadvantages:**
- Consumes a large number of tokens with every request
- Fills up the context window on local LLMs

**Recommended when:**
- API costs are not a concern
- All tools are used frequently during development

## Essential Mode

Exposes only the most commonly used core tools. This includes tools for scene manipulation, object creation, material settings, screenshots, and other everyday tasks.

**Advantages:**
- Good balance between token consumption and convenience
- Covers most use cases

**Disadvantages:**
- Advanced tools (NavMesh, VFX, Terrain, etc.) cannot be called directly

**Recommended when:**
- Doing basic scene building or modeling
- You want to keep token consumption somewhat low

## Dynamic Mode (Default)

Exposes only the 3 meta-tools (`list_tools`, `get_tool_schema`, `call_tool`). The AI fetches tool information as needed and calls tools dynamically.

**Advantages:**
- Minimal token consumption
- Context size stays the same regardless of tool count
- Runs comfortably on local LLMs

**Disadvantages:**
- Tool calls require 2-3 steps (list retrieval, schema retrieval, execution)
- The AI needs to understand how to use meta-tools

**Recommended when:**
- General use (default mode)
- Using a local LLM
- Optimizing API costs

## Switching Modes

### Via Environment Variable

```bash
# Dynamic mode (default)
export OPENFORGE_TOOL_MODE=dynamic

# Essential mode
export OPENFORGE_TOOL_MODE=essential

# Full mode
export OPENFORGE_TOOL_MODE=full
```

### Via AI Client Configuration File

For Claude Desktop's `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openforge": {
      "command": "uvx",
      "args": ["openforge-mcp"],
      "env": {
        "OPENFORGE_TOOL_MODE": "essential"
      }
    }
  }
}
```

### Via Startup Arguments

```bash
uvx openforge-mcp --tool-mode essential
```

## Usage with Local LLMs

When using a local LLM, the context window is limited, so **Dynamic mode** is strongly recommended.

### LM Studio Setup

1. Launch LM Studio and load an MCP-compatible model
2. Start the OpenForge MCP server in HTTP mode

```bash
uvx openforge-mcp --transport http --port 8080
```

3. Specify the server URL in LM Studio's MCP settings

```
http://localhost:8080
```

### Ollama Setup

1. Start an MCP-compatible model with Ollama

```bash
ollama run qwen3
```

2. Connect to OpenForge MCP via an MCP client. Ollama alone does not natively support MCP, so use an MCP-compatible client application (e.g., Open WebUI) alongside it.

3. Start OpenForge MCP in HTTP mode

```bash
uvx openforge-mcp --transport http --port 8080
```

### Tips for Local LLMs

- Use **Dynamic mode** to minimize token consumption
- With models that have small context windows, execute tool calls one at a time rather than chaining many calls at once
- The screenshot feature is particularly useful with multimodal models
