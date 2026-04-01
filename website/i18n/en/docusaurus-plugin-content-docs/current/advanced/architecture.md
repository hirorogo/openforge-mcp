---
sidebar_position: 1
title: Architecture
---

# How OpenForge MCP Works

OpenForge MCP is a bridge that connects AI clients to Unity / Blender / Godot via MCP (Model Context Protocol). This page explains the internal architecture and design philosophy.

## Overall Communication Flow

```
AI Client                  OpenForge MCP Server              Application
(Claude Desktop, etc.)    (Python / stdio or HTTP)          (Unity / Blender / Godot)
                                                        
  User instruction ------->  Receives MCP request                
                             Selects tool, parses params ----->  Plugin executes the
                                                                command via WebSocket/HTTP
                             <------ Returns result JSON           
  <------ AI responds to     
          user in natural                                   
          language                                          
```

1. The user sends a natural language instruction to the AI client
2. The AI selects an MCP tool and determines the parameters
3. The OpenForge MCP server receives the request and relays it to the appropriate application
4. The application-side plugin executes the command and returns the result
5. The server returns the result to the AI client, and the AI responds to the user

## 3 Meta-Tool Design

At the core of OpenForge MCP is the **3 meta-tool design**. A typical MCP server exposes all tools (potentially hundreds) directly to the AI. However, because the AI must include the tool list in its context for every request, token consumption increases rapidly as the tool count grows.

OpenForge MCP exposes only the following 3 meta-tools to the AI:

| Meta-Tool | Role |
|---|---|
| `list_tools` | Retrieve a list of available tool categories and tool names |
| `call_tool` | Execute a specified tool |
| `get_tool_schema` | Retrieve the parameter schema for a specific tool |

### How It Works

```
AI: "Add a cube to the Unity scene"

1. AI calls list_tools --> Gets the category list
2. AI calls get_tool_schema("create_gameobject") --> Gets the parameters
3. AI calls call_tool("create_gameobject", {name: "Cube", type: "Cube"})
4. A cube is created on the Unity side
```

With this design, the AI's context always contains only 3 tool definitions. It fetches information about specific tools only when needed, significantly reducing token consumption.

## Relationship to Tool Modes

The 3 meta-tool design is used in **Dynamic mode**. In **Full mode** and **Essential mode**, you can also choose the traditional approach of exposing tools directly. See [Tool Modes](./modes.md) for details.

## Why This Architecture?

### Token Efficiency

AI clients include all available tool definitions in their prompt. OpenForge MCP provides over 100 tools for Unity alone, and even more when Blender is included. Exposing all of them would consume a large number of tokens with every request.

With the 3 meta-tool design, only 3 tool definitions are ever exposed, keeping the baseline token consumption extremely low.

### Scalability

Adding more tools does not change the context size on the AI side. New categories and tools can be added freely without affecting performance.

### Flexibility

Because each application has an independent plugin, you can connect Unity, Blender, and Godot simultaneously or use only a specific application. With HTTP API mode, multiple AI clients can access the system concurrently.

## Plugin Architecture

A dedicated plugin is installed in each application.

| Application | Plugin Format | Communication Method |
|---|---|---|
| Unity | Editor package (C#) | WebSocket |
| Blender | Add-on (Python) | WebSocket |
| Godot | Editor plugin (GDScript) | WebSocket |

The plugins run inside the editor and provide functionality for scene manipulation, asset management, screenshot capture, and more. Communication with the MCP server uses WebSocket for real-time bidirectional data exchange.
