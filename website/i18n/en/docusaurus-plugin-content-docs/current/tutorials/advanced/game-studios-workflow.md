---
sidebar_position: 6
title: "Team Development with Game Studios"
description: "Integrate Claude Code Game Studios with OpenForge MCP to develop games using multiple specialized AI agents"
---

# Team Development with Game Studios

Claude Code Game Studios is a project that streamlines game development with 48 specialized AI agents and 37 slash commands. When integrated with OpenForge MCP, each agent can directly operate Unity / Blender / Godot to perform level construction, art adjustments, QA testing, and more.

This tutorial covers setup, workflow execution, and customization.

## Prerequisites

- OpenForge MCP is installed and connected to a game engine
- You understand the basic Game Studios concepts (see [Game Studios Integration](/docs/advanced/game-studios))

## What Is Game Studios?

Game Studios defines each game development role as an AI agent. Each agent is assigned tool permissions corresponding to their area of expertise.

```
creative-director --- Oversees vision and quality
technical-director -- Technical decision-making
level-designer ------ Scenes, terrain, NavMesh
art-director -------- Lighting, materials, VFX
technical-artist ---- Optimization, shaders
gameplay-programmer - Physics, input, animation, scripting
ai-programmer ------- NavMesh, ML-Agents
qa-tester ----------- Playtesting, profiling
qa-lead ------------- Bug reports, quality management
3d-modeler ---------- Blender modeling
animator ------------ Animation, timeline
sound-designer ------ Audio
...
```

## Step 1: Setup

### Clone the Game Studios Repository

```bash
git clone https://github.com/Donchitos/Claude-Code-Game-Studios.git
cd Claude-Code-Game-Studios
```

### Configure Integration with OpenForge MCP

**You:**
> Integrate the Game Studios project with OpenForge.

**AI Response Example:**
```
Executed setup_game_studios.

Generated configuration files:
  .claude/settings.json
    - Added OpenForge MCP server settings
    - Configured tool permissions for 22 agent roles

Connection status:
  Unity: Connected (OpenForge MCP v0.8.0)
  Blender: Connected (OpenForge MCP v0.8.0)
  Godot: Not connected

Available agents: 22
Available workflows: 8
```

### Check an Agent's Tool Permissions

**You:**
> Show me the tools available to the level-designer.

**AI Response Example:**
```
level-designer tool permissions:

Categories: Scene, GameObject, Terrain, Lighting, NavMesh, Prefab, Weather, Camera

Key tools (42 total):
  Scene: create_scene, save_scene, load_scene
  GameObject: create_gameobject, set_transform, duplicate_gameobject, delete_gameobject, ...
  Terrain: create_terrain, set_terrain_height, paint_terrain, set_terrain_trees, ...
  Lighting: create_light, set_light_property (placement only; adjustments are handled by art-director)
  NavMesh: bake_navmesh, set_navmesh_area, create_navmesh_obstacle, ...
  Prefab: instantiate_prefab, create_prefab
  Weather: set_fog, set_skybox
  Camera: set_camera, take_screenshot
```

## Step 2: Run the "Create Level" Workflow

Predefined workflows have multiple agents work through tasks sequentially.

**You:**
> Run the create_level workflow. Create a "medieval castle courtyard". Size 50m x 50m. Cobblestone floor, fountain in the center, torches at the four corners.

**AI Response Example:**
```
Starting create_level workflow.

=== Step 1/3: level-designer ===
Tools used: create_scene, create_terrain, create_gameobject, set_transform

Running...
  - Created scene "CastleCourtyard"
  - Placed ground (50m x 50m)
  - Placed fountain base (center) -- composed of Cylinder + Torus
  - Placed 4 torch stands at corners
  - Built castle walls (perimeter) with Cubes
  - Placed gate (front entrance)
  - Placed 4 benches along the pathways
  - Baked NavMesh

level-designer complete. Object count: 28

=== Step 2/3: art-director ===
Tools used: create_material, create_light, set_skybox

Running...
  - Created M_Cobblestone (cobblestone material), applied to floor
  - Created M_CastleWall (castle wall material), applied to walls
  - Created M_Water (water material), applied to fountain
  - Set directional light (sunset color)
  - Placed 4 point lights at torch positions (warm color, with flicker script)
  - Set skybox to overcast
  - Captured screenshot

art-director complete. Materials: 5, Lights: 5

=== Step 3/3: technical-artist ===
Tools used: analyze_draw_calls, create_lod_group, optimize_textures

Running...
  - Draw call analysis: 34 (good)
  - Combined castle wall meshes (12 -> 1 draw call)
  - Applied texture compression
  - Final draw calls: 23

technical-artist complete.

=== Workflow Complete ===
Scene: CastleCourtyard
Object count: 28
Draw calls: 23
Screenshot saved.
```

## Step 3: Run the "QA Pass" Workflow

Automatically check the quality of the constructed level.

**You:**
> Run the QA Pass workflow. Check the CastleCourtyard scene.

**AI Response Example:**
```
Starting qa_pass workflow.

=== Step 1/3: qa-tester (Playtest) ===
Tools used: enter_play_mode, simulate_input, take_screenshot

Running...
  - Entered play mode
  - Spawned player at spawn point
  - Auto-movement test: circled around the fountain
  - Collision test: wall collision detection
  - NavMesh test: reachability to all areas
  Screenshots: 8 captured

qa-tester (Playtest) complete.

=== Step 2/3: qa-tester (Bug Recording) ===
Tools used: take_screenshot, exit_play_mode

Issues found:
  [BUG-001] Severity: Medium
    NavMesh gap on the south side of the fountain. NPCs cannot traverse.
    Screenshot: qa_bug001.png

  [BUG-002] Severity: Low
    Bench #3 BoxCollider is larger than the mesh.
    Player hits an invisible wall.

  [BUG-003] Severity: Info
    Torch #2 light bleeds through the wall. Range should be adjusted.

qa-tester (Bug Recording) complete. Bugs: 3

=== Step 3/3: qa-lead (Report) ===
Tools used: take_screenshot

QA Report:
  Test items: 12
  Passed: 9
  Failed: 2
  Info: 1

  Recommended actions:
    1. Re-bake NavMesh (fix BUG-001)
    2. Adjust Bench #3 BoxCollider size (fix BUG-002)
    3. Change Torch #2 Light Range from 8 to 5 (address BUG-003)

qa-lead complete.

=== Workflow Complete ===
```

**You:**
> Fix all the bugs from the QA report.

**AI Response Example:**
```
Executing bug fixes.

[BUG-001] Fixed NavMesh gap
  - Found a gap in the ground mesh on the south side of the fountain
  - Filled the gap and re-baked NavMesh
  - Verified: NPC pathfinding succeeds for all points

[BUG-002] Adjusted BoxCollider size
  - Bench_3 BoxCollider: (2.5, 1.0, 1.0) -> (1.8, 0.8, 0.6)
  - Applied auto-fit

[BUG-003] Adjusted Light Range
  - TorchLight_2: Range 8 -> 5
  - Wall bleed-through resolved

All 3 fixes complete.
```

## Step 4: Customize Workflows

You can modify predefined workflows to create project-specific flows.

### Workflow Definition File

Workflows are defined in YAML. Here is an example of a custom "create_dungeon" workflow.

```yaml
name: create_dungeon
description: Auto-generate a dungeon
version: "1.0"

steps:
  - agent: level-designer
    tools:
      - create_scene
      - create_gameobject
      - set_transform
      - duplicate_gameobject
    prompt: |
      Build the basic dungeon structure.
      - Generate 5-8 rooms (random sizes: 5-15m)
      - Connect rooms with corridors
      - Place entrance and exit
      - Place PropSpawnPoint (Empty) in each room

  - agent: art-director
    tools:
      - create_material
      - set_material
      - set_material_property
      - create_light
      - set_light_property
    prompt: |
      Set up the dungeon visuals.
      - Create stone wall material and apply to walls
      - Cracked stone material for floors
      - Point light in each room (dim warm color)
      - Torch lights in corridors (with flicker)
      - Overall dark atmosphere

  - agent: ai-programmer
    tools:
      - bake_navmesh
      - set_navmesh_area
      - create_navmesh_obstacle
    prompt: |
      Set up NavMesh for NPCs.
      - All corridors and rooms must be connected via NavMesh
      - Place NavMesh Obstacles at door positions (for opening/closing)
      - Set NavMesh Area to "Narrow" for tight corridors

  - agent: gameplay-programmer
    tools:
      - create_script
      - add_component
      - set_component_property
    prompt: |
      Create dungeon gameplay logic.
      - DungeonManager script: room clear state management
      - DoorController script: door opens on approach
      - TrapTrigger script: trap activation logic
      - Apply scripts to PropSpawnPoints

  - agent: qa-tester
    tools:
      - enter_play_mode
      - simulate_input
      - take_screenshot
      - exit_play_mode
    prompt: |
      Playtest the dungeon.
      - Can the player reach the exit from the entrance?
      - Can all rooms be entered?
      - Do doors open and close correctly?
      - Is the lighting too dark? (verify with screenshots)

  - agent: technical-artist
    tools:
      - analyze_draw_calls
      - optimize_textures
      - create_lod_group
      - combine_meshes
    prompt: |
      Performance optimization.
      - Keep draw calls under 200
      - Combine static meshes
      - Apply texture compression
```

### Running the Workflow

**You:**
> Run the create_dungeon workflow. Theme: "catacombs".

**AI Response Example:**
```
Starting create_dungeon workflow. Theme: Catacombs

=== Step 1/6: level-designer ===
  - Created scene "Catacomb_01"
  - Generated 6 rooms (6m-12m)
  - Connected with 8 corridors
  - Entrance: north end / Exit: deepest room at south end
  - PropSpawnPoints: 18 placed
  Object count: 94

=== Step 2/6: art-director ===
  - M_CatacombWall: dark gray stone wall with normal map
  - M_CatacombFloor: cracked stone
  - M_Bones: bone material (for PropSpawnPoints)
  - Point lights: 1-2 per room (eerie pale green)
  - Corridors: torch lights (warm, flickering)
  Materials: 4, Lights: 14

=== Step 3/6: ai-programmer ===
  - NavMesh bake complete
  - NavMesh Obstacles: 8 doors
  - Set 3 narrow corridors to "Narrow" area
  - Path test: entrance -> exit reachable

=== Step 4/6: gameplay-programmer ===
  - DungeonManager.cs created
  - DoorController.cs created (proximity trigger)
  - TrapTrigger.cs created (floor trap)
  - Scripts applied to 18 PropSpawnPoints

=== Step 5/6: qa-tester ===
  - Playtest run (30 seconds)
  - Entrance -> exit: reachable
  - All 6 rooms: accessible
  - Doors: 8/8 functioning correctly
  - Bugs: 1 (room 4 trap does not activate -- TriggerCollider isTrigger is false)
  Screenshots: 12

=== Step 6/6: technical-artist ===
  - Draw calls: 156 (target under 200: achieved)
  - Combined wall meshes per room (48 -> 6)
  - Applied texture compression

=== Workflow Complete ===
Auto-fixed 1 bug: set isTrigger = true on room 4 TrapTrigger
```

## Step 5: Add Custom Agent Definitions

You can add project-specific specialist agents.

### Agent Definition File

```yaml
# agents/vr-specialist.yaml
name: vr-specialist
description: VR experience specialist. Handles interaction design and comfort
tools:
  - category: Input
  - category: Physics
  - category: Camera
  - category: UI
  - category: Script
  - tool: take_screenshot
  - tool: enter_play_mode
  - tool: exit_play_mode

prompts:
  default: |
    Optimize VR experience quality. Priorities:
    - Hand tracking interaction design
    - Motion sickness prevention (field of view restriction, teleport locomotion)
    - UI placement (world space UI, gaze-following)
    - Performance (maintain 90+ FPS)
```

### Registering the Agent

**You:**
> Register the vr-specialist agent.

**AI Response Example:**
```
Agent "vr-specialist" registered.

Available tools: 38
  Input: 8 tools
  Physics: 12 tools
  Camera: 4 tools
  UI: 6 tools
  Script: 5 tools
  Individual: take_screenshot, enter_play_mode, exit_play_mode

To use in a workflow:
  steps:
    - agent: vr-specialist
      prompt: "Design VR interactions"
```

### Incorporating Custom Agents into Workflows

```yaml
name: create_vr_level
description: Build a VR-ready level
version: "1.0"

steps:
  - agent: level-designer
    prompt: "Build level geometry"

  - agent: art-director
    prompt: "Set up visuals"

  - agent: vr-specialist
    tools:
      - create_script
      - add_component
      - set_component_property
      - enter_play_mode
      - take_screenshot
    prompt: |
      Set up VR interactions.
      - Add XR Grab Interactable to grabbable objects
      - Define teleport areas
      - Place UI in world space (1.5m in front of the player)
      - Verify 90+ FPS in playtest

  - agent: qa-tester
    prompt: "Playtest and record bugs"
```

## Agent Roles and Tool Permissions Reference

Common agents and their permission mappings.

| Agent | Tool Categories | Primary Use |
|-------|----------------|-------------|
| level-designer | Scene, GameObject, Terrain, NavMesh, Prefab | Level layout |
| art-director | Material, Lighting, VFX, Camera | Visual quality |
| technical-artist | Material, Optimization, Mesh, Bake, UV | Shaders, optimization |
| gameplay-programmer | Physics, Input, Animation, Script | Game logic |
| ai-programmer | NavMesh, ML-Agents, Script | NPC AI |
| qa-tester | Playtest, Camera, Optimization | Test execution |
| qa-lead | Playtest, Camera | Report creation |
| 3d-modeler | Blender Object/Mesh/Procedural/Modifier | Modeling |
| animator | Animation, Timeline, Blender Animation | Animation |
| sound-designer | Audio | Sound |

Workflow design tip: Design agent responsibilities so they do not overlap. When multiple agents operate on the same object, use step ordering to prevent conflicts.
