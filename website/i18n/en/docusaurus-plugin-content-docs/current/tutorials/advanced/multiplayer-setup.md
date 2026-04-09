---
sidebar_position: 4
title: "Parallel Development with Multiple Agents"
description: "Use the HTTP API to run multiple AI agents simultaneously, building level geometry, scripts, and materials in parallel"
---

# Parallel Development with Multiple Agents

Using OpenForge MCP's HTTP API, multiple AI agents can operate the game engine simultaneously. This tutorial runs 3 agents via a Python script to build level geometry, gameplay scripts, and materials with lighting in parallel.

## Prerequisites

- You understand OpenForge MCP's HTTP API mode (see [HTTP API](/docs/advanced/http-api))
- Python 3.10 or later is installed
- `requests` and `concurrent.futures` are available
- Unity is running and connected to OpenForge MCP

## Architecture

```
Python Orchestrator
    |
    +-- Agent 1 (Level Geometry)   --+
    |                                |
    +-- Agent 2 (Scripts)          --+--> HTTP API --> OpenForge MCP --> Unity
    |                                |
    +-- Agent 3 (Materials/Lights) --+
```

Each agent sends HTTP requests from an independent thread. OpenForge MCP's request queue prevents conflicts.

## Step 1: Start the HTTP API Server

```bash
python -m openforge_mcp --mode http --port 8769
```

Verify it's running:

```bash
curl http://localhost:8769/tools | python -m json.tool | head -20
```

```json
{
  "tools": [
    {
      "name": "list_tools",
      "description": "Retrieve a list of available tools"
    },
    {
      "name": "create_gameobject",
      "description": "Create a new GameObject in the Unity scene"
    }
  ]
}
```

## Step 2: Basic API Calls

First, verify individual tool calls with curl.

### Object Creation

```bash
curl -X POST http://localhost:8769/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "create_gameobject",
    "parameters": {
      "name": "Floor",
      "type": "Plane",
      "position": {"x": 0, "y": 0, "z": 0},
      "scale": {"x": 10, "y": 1, "z": 10}
    }
  }'
```

Response:

```json
{
  "success": true,
  "result": {
    "name": "Floor",
    "instance_id": 12340,
    "message": "Created GameObject 'Floor'"
  }
}
```

### Script Creation

```bash
curl -X POST http://localhost:8769/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "create_script",
    "parameters": {
      "name": "PlayerController",
      "path": "Assets/Scripts/PlayerController.cs",
      "content": "using UnityEngine;\n\npublic class PlayerController : MonoBehaviour\n{\n    public float speed = 5f;\n    void Update()\n    {\n        float h = Input.GetAxis(\"Horizontal\");\n        float v = Input.GetAxis(\"Vertical\");\n        transform.Translate(new Vector3(h, 0, v) * speed * Time.deltaTime);\n    }\n}"
    }
  }'
```

## Step 3: Write the Python Orchestrator

Run 3 agents in parallel using `concurrent.futures.ThreadPoolExecutor`.

```python
"""
multi_agent_build.py
Build a level in parallel with 3 AI agents
"""

import json
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

API_BASE = "http://localhost:8769"


def call_tool(tool_name: str, parameters: dict, agent_id: str = "") -> dict:
    """Call an OpenForge MCP tool"""
    url = f"{API_BASE}/call_tool"
    payload = {
        "tool_name": tool_name,
        "parameters": parameters,
    }
    try:
        resp = requests.post(url, json=payload, timeout=60)
        resp.raise_for_status()
        result = resp.json()
        print(f"  [{agent_id}] {tool_name}: {result.get('result', {}).get('message', 'OK')}")
        return result
    except requests.exceptions.RequestException as e:
        print(f"  [{agent_id}] {tool_name}: ERROR - {e}")
        return {"success": False, "error": str(e)}


# ============================================================
# Agent 1: Level Geometry
# ============================================================
def agent_geometry():
    """Build floor, walls, stairs, pillars, and other geometry"""
    agent = "Geometry"
    print(f"[{agent}] Start: Building level geometry")

    # Floor
    call_tool("create_gameobject", {
        "name": "Floor",
        "type": "Plane",
        "position": {"x": 0, "y": 0, "z": 0},
        "scale": {"x": 10, "y": 1, "z": 10},
    }, agent)

    # 4 walls
    walls = [
        ("Wall_North", {"x": 0, "y": 2.5, "z": 50}, {"x": 100, "y": 5, "z": 0.5}),
        ("Wall_South", {"x": 0, "y": 2.5, "z": -50}, {"x": 100, "y": 5, "z": 0.5}),
        ("Wall_East", {"x": 50, "y": 2.5, "z": 0}, {"x": 0.5, "y": 5, "z": 100}),
        ("Wall_West", {"x": -50, "y": 2.5, "z": 0}, {"x": 0.5, "y": 5, "z": 100}),
    ]
    for name, pos, scale in walls:
        call_tool("create_gameobject", {
            "name": name,
            "type": "Cube",
            "position": pos,
            "scale": scale,
        }, agent)

    # 4 pillars
    for i, (px, pz) in enumerate([(-20, -20), (-20, 20), (20, -20), (20, 20)]):
        call_tool("create_gameobject", {
            "name": f"Pillar_{i}",
            "type": "Cylinder",
            "position": {"x": px, "y": 3, "z": pz},
            "scale": {"x": 1, "y": 3, "z": 1},
        }, agent)

    # Stairs
    for step in range(10):
        call_tool("create_gameobject", {
            "name": f"Stair_{step}",
            "type": "Cube",
            "position": {"x": 30, "y": step * 0.3, "z": -20 + step * 0.5},
            "scale": {"x": 3, "y": 0.3, "z": 0.5},
        }, agent)

    print(f"[{agent}] Complete")
    return "geometry_done"


# ============================================================
# Agent 2: Gameplay Scripts
# ============================================================
def agent_scripts():
    """Create player controller and game logic"""
    agent = "Scripts"
    print(f"[{agent}] Start: Creating scripts")

    # Player controller
    player_script = """using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    public float walkSpeed = 5f;
    public float runSpeed = 10f;
    public float jumpForce = 8f;
    public float gravity = 20f;

    private CharacterController _cc;
    private Vector3 _velocity;

    void Start()
    {
        _cc = GetComponent<CharacterController>();
    }

    void Update()
    {
        float speed = Input.GetKey(KeyCode.LeftShift) ? runSpeed : walkSpeed;
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");

        Vector3 move = transform.right * h + transform.forward * v;
        _velocity.x = move.x * speed;
        _velocity.z = move.z * speed;

        if (_cc.isGrounded)
        {
            _velocity.y = 0f;
            if (Input.GetButtonDown("Jump"))
                _velocity.y = jumpForce;
        }

        _velocity.y -= gravity * Time.deltaTime;
        _cc.Move(_velocity * Time.deltaTime);
    }
}"""
    call_tool("create_script", {
        "name": "PlayerController",
        "path": "Assets/Scripts/PlayerController.cs",
        "content": player_script,
    }, agent)

    # Game manager
    game_manager_script = """using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public int score;
    public float elapsedTime;
    public bool isGameActive = true;

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    void Update()
    {
        if (isGameActive)
            elapsedTime += Time.deltaTime;
    }

    public void AddScore(int points)
    {
        score += points;
        Debug.Log($"Score: {score}");
    }
}"""
    call_tool("create_script", {
        "name": "GameManager",
        "path": "Assets/Scripts/GameManager.cs",
        "content": game_manager_script,
    }, agent)

    # Collectible
    collectible_script = """using UnityEngine;

public class Collectible : MonoBehaviour
{
    public int points = 10;
    public float rotateSpeed = 90f;

    void Update()
    {
        transform.Rotate(Vector3.up, rotateSpeed * Time.deltaTime);
    }

    void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Player"))
        {
            GameManager.Instance?.AddScore(points);
            Destroy(gameObject);
        }
    }
}"""
    call_tool("create_script", {
        "name": "Collectible",
        "path": "Assets/Scripts/Collectible.cs",
        "content": collectible_script,
    }, agent)

    print(f"[{agent}] Complete")
    return "scripts_done"


# ============================================================
# Agent 3: Materials and Lighting
# ============================================================
def agent_materials():
    """Create materials and set up lighting"""
    agent = "Materials"
    print(f"[{agent}] Start: Setting up materials and lighting")

    # Floor material
    call_tool("create_material", {
        "name": "M_Floor",
        "shader": "Universal Render Pipeline/Lit",
        "color": {"r": 0.85, "g": 0.82, "b": 0.75, "a": 1.0},
    }, agent)
    call_tool("set_material_property", {
        "material": "M_Floor",
        "properties": {"_Smoothness": 0.3, "_Metallic": 0.0},
    }, agent)

    # Wall material
    call_tool("create_material", {
        "name": "M_Wall",
        "shader": "Universal Render Pipeline/Lit",
        "color": {"r": 0.7, "g": 0.65, "b": 0.6, "a": 1.0},
    }, agent)

    # Pillar material
    call_tool("create_material", {
        "name": "M_Pillar",
        "shader": "Universal Render Pipeline/Lit",
        "color": {"r": 0.5, "g": 0.5, "b": 0.55, "a": 1.0},
    }, agent)
    call_tool("set_material_property", {
        "material": "M_Pillar",
        "properties": {"_Smoothness": 0.6, "_Metallic": 0.2},
    }, agent)

    # Apply materials
    call_tool("set_material", {"target": "Floor", "material": "M_Floor"}, agent)
    for wall in ["Wall_North", "Wall_South", "Wall_East", "Wall_West"]:
        call_tool("set_material", {"target": wall, "material": "M_Wall"}, agent)
    for i in range(4):
        call_tool("set_material", {"target": f"Pillar_{i}", "material": "M_Pillar"}, agent)

    # Directional light
    call_tool("create_light", {
        "name": "Sun",
        "type": "Directional",
        "intensity": 1.2,
        "color": {"r": 1.0, "g": 0.95, "b": 0.85},
        "rotation": {"x": 50, "y": -30, "z": 0},
    }, agent)

    # Point lights (above pillars)
    for i, (px, pz) in enumerate([(-20, -20), (-20, 20), (20, -20), (20, 20)]):
        call_tool("create_light", {
            "name": f"PillarLight_{i}",
            "type": "Point",
            "intensity": 5.0,
            "range": 15.0,
            "color": {"r": 1.0, "g": 0.85, "b": 0.6},
            "position": {"x": px, "y": 6.5, "z": pz},
        }, agent)

    print(f"[{agent}] Complete")
    return "materials_done"


# ============================================================
# Main: Orchestration
# ============================================================
def main():
    start = time.time()
    print("=== Multi-Agent Build Started ===\n")

    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {
            executor.submit(agent_geometry): "Geometry",
            executor.submit(agent_scripts): "Scripts",
            executor.submit(agent_materials): "Materials",
        }

        results = {}
        for future in as_completed(futures):
            agent_name = futures[future]
            try:
                result = future.result()
                results[agent_name] = result
            except Exception as e:
                print(f"[{agent_name}] Exception: {e}")
                results[agent_name] = f"error: {e}"

    elapsed = time.time() - start
    print(f"\n=== All Agents Complete ({elapsed:.1f}s) ===")
    print(f"Results: {json.dumps(results, ensure_ascii=False, indent=2)}")

    # --- Phase 2: Dependent follow-up tasks ---
    print("\n=== Phase 2: Integration Tasks ===")

    # Apply scripts to objects (after both geometry and scripts are done)
    if results.get("Geometry") == "geometry_done" and results.get("Scripts") == "scripts_done":
        # Create player object + attach script
        call_tool("create_gameobject", {
            "name": "Player",
            "type": "Capsule",
            "position": {"x": 0, "y": 1, "z": 0},
        }, "Integrate")
        call_tool("add_component", {
            "target": "Player",
            "component": "PlayerController",
        }, "Integrate")
        call_tool("add_component", {
            "target": "Player",
            "component": "CharacterController",
        }, "Integrate")

        # GameManager
        call_tool("create_gameobject", {
            "name": "GameManager",
            "type": "Empty",
        }, "Integrate")
        call_tool("add_component", {
            "target": "GameManager",
            "component": "GameManager",
        }, "Integrate")

    # Screenshot
    call_tool("take_screenshot", {
        "width": 1920,
        "height": 1080,
    }, "Integrate")

    print("\n=== Build Complete ===")


if __name__ == "__main__":
    main()
```

## Step 4: Run It

```bash
pip install requests
python multi_agent_build.py
```

Example output:

```
=== Multi-Agent Build Started ===

[Geometry] Start: Building level geometry
[Scripts] Start: Creating scripts
[Materials] Start: Setting up materials and lighting
  [Geometry] create_gameobject: Created GameObject 'Floor'
  [Scripts] create_script: Created script 'PlayerController'
  [Materials] create_material: Created material 'M_Floor'
  [Geometry] create_gameobject: Created GameObject 'Wall_North'
  [Materials] set_material_property: Properties set
  ...
[Scripts] Complete
[Materials] Complete
[Geometry] Complete

=== All Agents Complete (8.3s) ===
Results: {
  "Scripts": "scripts_done",
  "Materials": "materials_done",
  "Geometry": "geometry_done"
}

=== Phase 2: Integration Tasks ===
  [Integrate] create_gameobject: Created GameObject 'Player'
  [Integrate] add_component: Added component 'PlayerController'
  ...

=== Build Complete ===
```

## Conflict Avoidance Design

The most critical consideration with multiple agents is concurrent writes to the same object.

### Principle: Separate Responsibilities

| Agent | Operations | Objects Touched |
|-------|-----------|----------------|
| Geometry | create_gameobject, set_transform | Floor, Wall_*, Pillar_*, Stair_* |
| Scripts | create_script | Files under Assets/Scripts/ |
| Materials | create_material, create_light, set_material | M_*, Sun, PillarLight_* |

When multiple agents must operate on the same object (e.g., Materials applies materials to objects created by Geometry), split the work into phases with explicit dependencies.

### Request Queue Behavior

OpenForge MCP's HTTP API has a request queue. Requests arriving simultaneously are processed sequentially. This guarantees atomicity at the individual tool call level.

However, for transactions spanning multiple tool calls (e.g., creating an object + adding a component + setting properties as a batch), other agents' requests may interleave between calls.

### Solution: Run Dependent Tasks Serially

```python
# Bad: Running dependent operations in parallel
executor.submit(create_player)      # Create Player object
executor.submit(attach_controller)  # Attach script to Player (Player may not exist yet)

# Good: Dependencies run serially, independent work runs in parallel
def create_player_with_controller():
    call_tool("create_gameobject", {"name": "Player", ...})  # Create first
    call_tool("add_component", {"target": "Player", ...})    # Then attach
```

## Advanced Example: Task Queue Orchestration

For large-scale projects, manage task dependencies explicitly.

```python
from dataclasses import dataclass, field
from typing import Callable

@dataclass
class Task:
    name: str
    agent: str
    fn: Callable
    depends_on: list[str] = field(default_factory=list)
    done: bool = False

class TaskQueue:
    def __init__(self):
        self.tasks: dict[str, Task] = {}

    def add(self, task: Task):
        self.tasks[task.name] = task

    def get_ready_tasks(self) -> list[Task]:
        """Return tasks whose dependencies are all complete"""
        ready = []
        for task in self.tasks.values():
            if task.done:
                continue
            deps_met = all(
                self.tasks[dep].done
                for dep in task.depends_on
                if dep in self.tasks
            )
            if deps_met:
                ready.append(task)
        return ready

    def run_all(self, max_workers: int = 3):
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            while not all(t.done for t in self.tasks.values()):
                ready = self.get_ready_tasks()
                if not ready:
                    time.sleep(0.1)
                    continue

                futures = {}
                for task in ready:
                    futures[executor.submit(task.fn)] = task

                for future in as_completed(futures):
                    task = futures[future]
                    try:
                        future.result()
                        task.done = True
                        print(f"[Done] {task.name}")
                    except Exception as e:
                        print(f"[Failed] {task.name}: {e}")
                        task.done = True  # Continue despite failure (adjust as needed)


# Usage example
queue = TaskQueue()
queue.add(Task("geometry", "Agent1", agent_geometry))
queue.add(Task("scripts", "Agent2", agent_scripts))
queue.add(Task("materials", "Agent3", agent_materials, depends_on=["geometry"]))
queue.add(Task("integrate", "Agent1", lambda: integrate_all(), depends_on=["geometry", "scripts", "materials"]))
queue.run_all()
```

With this structure, materials waits for geometry to complete before executing (guaranteeing that the objects to apply materials to already exist).
