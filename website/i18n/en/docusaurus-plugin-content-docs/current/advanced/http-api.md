---
sidebar_position: 3
title: HTTP API
---

# HTTP API

In addition to the stdio transport, OpenForge MCP supports an HTTP transport. HTTP mode lets you call tools via a REST API and connect multiple clients simultaneously.

## Starting the Server

```bash
# Start on the default port (8080)
uvx openforge-mcp --transport http

# Specify a port
uvx openforge-mcp --transport http --port 3000

# Specify host and port
uvx openforge-mcp --transport http --host 0.0.0.0 --port 3000
```

## REST API Endpoints

### List Tools

```
GET /tools
```

Retrieves a list of all available tools.

```bash
curl http://localhost:8080/tools
```

Example response:

```json
{
  "tools": [
    {
      "name": "list_tools",
      "description": "Retrieve a list of available tools"
    },
    {
      "name": "get_tool_schema",
      "description": "Retrieve the parameter schema for a specified tool"
    },
    {
      "name": "call_tool",
      "description": "Execute a specified tool"
    }
  ]
}
```

### Get Tool Schema

```
GET /tools/:tool_name/schema
```

Retrieves the parameter schema for a specified tool.

```bash
curl http://localhost:8080/tools/create_gameobject/schema
```

Example response:

```json
{
  "name": "create_gameobject",
  "description": "Create a new GameObject in the Unity scene",
  "parameters": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Object name"
      },
      "type": {
        "type": "string",
        "enum": ["Empty", "Cube", "Sphere", "Cylinder", "Plane", "Capsule"],
        "description": "Primitive type"
      },
      "position": {
        "type": "object",
        "properties": {
          "x": {"type": "number"},
          "y": {"type": "number"},
          "z": {"type": "number"}
        }
      }
    },
    "required": ["name"]
  }
}
```

### Execute a Tool

```
POST /tools/:tool_name
```

Executes a specified tool.

```bash
curl -X POST http://localhost:8080/tools/create_gameobject \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyCube",
    "type": "Cube",
    "position": {"x": 0, "y": 1, "z": 0}
  }'
```

Example response:

```json
{
  "success": true,
  "result": {
    "id": "a1b2c3d4",
    "name": "MyCube",
    "type": "Cube",
    "position": {"x": 0, "y": 1, "z": 0}
  }
}
```

### Take a Screenshot

```
POST /tools/take_screenshot
```

```bash
curl -X POST http://localhost:8080/tools/take_screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "width": 1920,
    "height": 1080
  }' \
  -o screenshot.png
```

### Server Status

```
GET /health
```

Check the server's running status and connected applications.

```bash
curl http://localhost:8080/health
```

Example response:

```json
{
  "status": "ok",
  "connections": {
    "unity": true,
    "blender": false,
    "godot": false
  },
  "version": "0.5.0"
}
```

## Multi-Agent Configuration

In HTTP mode, multiple AI clients can connect to the same OpenForge MCP server. This enables multi-agent setups.

```
Agent A (scene design) ------\
                              +----> OpenForge MCP Server ----> Unity
Agent B (materials)   ------/          (HTTP)
```

### Configuration Example

Start a single OpenForge MCP server in HTTP mode and connect multiple clients to it.

```bash
# Start the server
uvx openforge-mcp --transport http --port 8080
```

Each agent sends requests to the same endpoint. Mutual exclusion is handled on the server side, so data conflicts from concurrent requests do not occur.

## Integration with Scripts

The HTTP API lets you call tools directly from shell scripts or Python scripts.

### Shell Script Example

```bash
#!/bin/bash
# Script to batch-place objects in a Unity scene

SERVER="http://localhost:8080"

# Place 5 cubes
for i in $(seq 0 4); do
  curl -s -X POST "$SERVER/tools/create_gameobject" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Cube_$i\",
      \"type\": \"Cube\",
      \"position\": {\"x\": $((i * 2)), \"y\": 0, \"z\": 0}
    }"
  echo ""
done
```

### Python Script Example

```python
import requests

SERVER = "http://localhost:8080"

def call_tool(tool_name: str, params: dict) -> dict:
    response = requests.post(
        f"{SERVER}/tools/{tool_name}",
        json=params
    )
    return response.json()

# Create a material and apply it to an object
call_tool("create_material", {
    "name": "RedMaterial",
    "color": {"r": 1, "g": 0, "b": 0, "a": 1}
})

call_tool("set_material", {
    "target": "MyCube",
    "material": "RedMaterial"
})
```

## CI/CD Integration

You can use the HTTP API to automate Unity builds and scene validation from CI/CD pipelines.

### GitHub Actions Example

```yaml
name: Scene Validation

on: [push]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start OpenForge MCP
        run: |
          uvx openforge-mcp --transport http --port 8080 &
          sleep 3

      - name: Validate scene objects
        run: |
          RESULT=$(curl -s http://localhost:8080/tools/get_scene_info)
          echo "$RESULT" | python -c "
          import sys, json
          data = json.load(sys.stdin)
          objects = data['result']['objects']
          assert len(objects) > 0, 'No objects in scene'
          print(f'Validation complete: {len(objects)} objects')
          "
```
