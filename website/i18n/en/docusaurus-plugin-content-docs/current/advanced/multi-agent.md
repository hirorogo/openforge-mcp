---
sidebar_position: 6
title: "Multi-Agent"
description: "How to use multiple AI agents simultaneously for parallel workflows"
---

# Multi-Agent

Using OpenForge MCP's HTTP API mode, multiple AI agents can access the same application simultaneously. This guide explains how multi-agent setups work and how to use them effectively.

## What is multi-agent?

Normally, OpenForge MCP connects one-to-one with a single AI client (stdio mode). In a multi-agent configuration, multiple AI agents can send requests at the same time through the HTTP API.

```
Agent A (scene building) ----+
                             +--> HTTP API --> OpenForge MCP --> Unity
Agent B (scripting) ---------+                               --> Blender
```

### When to use it

- Distribute the construction of a large scene across multiple agents
- Run scene building and script writing in parallel
- Integrate into automation pipelines for batch processing
- Run tests automatically from a CI/CD system

## Starting HTTP API mode

Multi-agent requires HTTP API mode. Start it with the following command:

```bash
python -m openforge_mcp --mode http --port 8769
```

Once started, the server accepts API requests at `http://localhost:8769`.

:::info Difference from stdio mode
In stdio mode, the AI client launches the MCP server as a child process in a one-to-one connection. HTTP API mode runs the server as an independent process that multiple clients can access. See [HTTP API](./http-api.md) for details.
:::

## Request queue and serialization

When multiple agents send requests at the same time, OpenForge MCP uses a request queue to process them safely.

### How it works

1. Requests from each agent are added to the queue
2. They are pulled from the queue one at a time and processed in order
3. Once processing is complete, the result is returned to the appropriate agent
4. The next request is processed

```
Timeline ----------------------------->

Agent A: [Request 1]              [Request 3]
Agent B:     [Request 2]                [Request 4]

Queue:   [Process 1][Process 2]  [Process 3][Process 4]
```

:::warning Concurrent writes
If two agents try to modify the same object simultaneously, the request processed later may overwrite the earlier change. Clearly separate the objects or areas each agent is responsible for to prevent conflicts.
:::

### Response waiting

Requests are processed asynchronously, but each request maintains the HTTP connection until completion (synchronous response). This means the response indicates the operation is done.

## Example: Parallel scene building and script writing

Here is a practical example using two agents to build a scene and write scripts at the same time.

### Overall flow

1. Agent A builds objects in the scene
2. Agent B creates C# scripts
3. Agent A applies the scripts to the built objects

### curl example

First, Agent A creates an object:

```bash
# Agent A: Create the ground
curl -X POST http://localhost:8769/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "create_gameobject",
    "parameters": {
      "name": "Ground",
      "type": "Plane",
      "position": {"x": 0, "y": 0, "z": 0},
      "scale": {"x": 10, "y": 1, "z": 10}
    }
  }'
```

At the same time, Agent B creates a script:

```bash
# Agent B: Create a player controller script
curl -X POST http://localhost:8769/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "create_script",
    "parameters": {
      "name": "PlayerController",
      "code": "using UnityEngine;\n\npublic class PlayerController : MonoBehaviour\n{\n    public float speed = 5f;\n\n    void Update()\n    {\n        float h = Input.GetAxis(\"Horizontal\");\n        float v = Input.GetAxis(\"Vertical\");\n        transform.Translate(new Vector3(h, 0, v) * speed * Time.deltaTime);\n    }\n}"
    }
  }'
```

Agent A creates the player object and applies the script:

```bash
# Agent A: Create the player
curl -X POST http://localhost:8769/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "create_gameobject",
    "parameters": {
      "name": "Player",
      "type": "Capsule",
      "position": {"x": 0, "y": 1, "z": 0}
    }
  }'

# Agent A: Apply the script
curl -X POST http://localhost:8769/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "add_component",
    "parameters": {
      "object_name": "Player",
      "component_type": "PlayerController"
    }
  }'
```

## Automation with a Python script

Running curl commands one by one is tedious, so here is a Python script for automation:

```python
import requests
import concurrent.futures
import json

API_BASE = "http://localhost:8769"


def call_tool(tool_name: str, parameters: dict) -> dict:
    """Call an OpenForge MCP tool"""
    response = requests.post(
        f"{API_BASE}/call_tool",
        json={"tool_name": tool_name, "parameters": parameters},
    )
    response.raise_for_status()
    return response.json()


def list_tools(category: str = "") -> dict:
    """Get the list of available tools"""
    response = requests.post(
        f"{API_BASE}/list_tools",
        json={"category": category},
    )
    response.raise_for_status()
    return response.json()


def agent_scene_builder():
    """Agent A: Responsible for scene building"""
    print("[A] Creating the ground...")
    call_tool("create_gameobject", {
        "name": "Ground",
        "type": "Plane",
        "position": {"x": 0, "y": 0, "z": 0},
        "scale": {"x": 10, "y": 1, "z": 10},
    })

    print("[A] Creating walls...")
    walls = [
        {"name": "Wall_North", "pos": {"x": 0, "y": 1, "z": 50}},
        {"name": "Wall_South", "pos": {"x": 0, "y": 1, "z": -50}},
        {"name": "Wall_East", "pos": {"x": 50, "y": 1, "z": 0}},
        {"name": "Wall_West", "pos": {"x": -50, "y": 1, "z": 0}},
    ]
    for wall in walls:
        call_tool("create_gameobject", {
            "name": wall["name"],
            "type": "Cube",
            "position": wall["pos"],
            "scale": {"x": 100, "y": 2, "z": 1},
        })

    print("[A] Scene building complete")


def agent_script_writer():
    """Agent B: Responsible for script writing"""
    print("[B] Creating PlayerController script...")
    call_tool("create_script", {
        "name": "PlayerController",
        "code": (
            "using UnityEngine;\n\n"
            "public class PlayerController : MonoBehaviour\n"
            "{\n"
            "    public float speed = 5f;\n\n"
            "    void Update()\n"
            "    {\n"
            '        float h = Input.GetAxis("Horizontal");\n'
            '        float v = Input.GetAxis("Vertical");\n'
            "        transform.Translate(new Vector3(h, 0, v) * speed * Time.deltaTime);\n"
            "    }\n"
            "}"
        ),
    })

    print("[B] Creating ItemCollector script...")
    call_tool("create_script", {
        "name": "ItemCollector",
        "code": (
            "using UnityEngine;\n\n"
            "public class ItemCollector : MonoBehaviour\n"
            "{\n"
            "    public int score = 0;\n\n"
            "    void OnTriggerEnter(Collider other)\n"
            "    {\n"
            '        if (other.CompareTag("Collectible"))\n'
            "        {\n"
            "            score++;\n"
            "            Destroy(other.gameObject);\n"
            "        }\n"
            "    }\n"
            "}"
        ),
    })

    print("[B] Script writing complete")


def main():
    # Run two agents in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        future_a = executor.submit(agent_scene_builder)
        future_b = executor.submit(agent_script_writer)

        # Wait for both to finish
        concurrent.futures.wait([future_a, future_b])

    # After both are done, apply scripts to objects
    print("[Integration] Creating player and applying scripts...")
    call_tool("create_gameobject", {
        "name": "Player",
        "type": "Capsule",
        "position": {"x": 0, "y": 1, "z": 0},
    })
    call_tool("add_component", {
        "object_name": "Player",
        "component_type": "Rigidbody",
    })
    call_tool("add_component", {
        "object_name": "Player",
        "component_type": "PlayerController",
    })
    call_tool("add_component", {
        "object_name": "Player",
        "component_type": "ItemCollector",
    })

    print("All tasks complete")


if __name__ == "__main__":
    main()
```

Running this script executes scene building and script writing in parallel. After both finish, the objects and scripts are integrated.

:::tip Managing dependencies
The key to parallel execution is ensuring the tasks are independent of each other. In the example above, "scene building" and "script writing" are independent tasks, so they run in parallel. "Applying scripts" depends on both, so it runs after both are complete.
:::

## Best practices

### Clearly separate areas of responsibility

Make sure agents do not operate on overlapping targets.

| Agent | Responsibility | Targets |
|---|---|---|
| A | Scene building | Creating and placing objects |
| B | Scripting | Generating C# scripts |
| C | Materials | Setting textures and materials |

### Do not forget error handling

In a multi-agent setup, one agent failing does not stop the others. Add proper error handling.

```python
def safe_call_tool(tool_name: str, parameters: dict) -> dict:
    """Tool call with error handling"""
    try:
        result = call_tool(tool_name, parameters)
        if result.get("error"):
            print(f"Tool error: {result['error']}")
            return None
        return result
    except requests.exceptions.ConnectionError:
        print("Connection error: Cannot connect to the MCP server")
        return None
    except requests.exceptions.Timeout:
        print("Timeout: Processing is taking too long")
        return None
```

### Synchronize when order matters

Not everything is suited for parallel execution. Operations with order dependencies -- such as creating an object before adding a component -- must run sequentially.

## Summary

- HTTP API mode allows simultaneous access from multiple agents
- Requests are safely serialized through a request queue
- Run independent tasks in parallel and dependent tasks sequentially
- Python scripts enable automated pipelines
- Separating areas of responsibility prevents conflicts
