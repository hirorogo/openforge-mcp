---
sidebar_position: 8
title: Game Studios Integration
---

# Claude Code Game Studios Integration

[Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) is a project by Donchitos that turns Claude Code into a game development studio, featuring 48 specialized AI agents and 37 slash commands (MIT License).

When integrated with OpenForge MCP, each agent can **directly control** Unity, Blender, and Godot. A level designer places terrain, an art director adjusts lighting, a QA tester runs playtests -- all within an AI conversation.

:::info License
Claude Code Game Studios is released under the MIT License by Donchitos. OpenForge MCP references the agent definitions from that project for integration purposes but is not a fork or copy.
:::

---

## How it works

OpenForge MCP provides the communication layer with game engines. Game Studios defines agent roles and workflows. The **GameStudiosBridge** connects the two.

```
Game Studios Agents
       |
  GameStudiosBridge (role-to-tool mapping)
       |
  OpenForge MCP (350+ tools)
       |
  Unity / Blender / Godot
```

Each agent is assigned only the OpenForge tool categories relevant to its role. For example, the sound designer sees only audio-related tools, while the level designer sees only scene, terrain, and NavMesh tools.

---

## Setup

### 1. Clone the Game Studios repository

```bash
git clone https://github.com/Donchitos/Claude-Code-Game-Studios.git
cd Claude-Code-Game-Studios
```

### 2. Install OpenForge MCP

```bash
npx openforge-mcp setup
```

### 3. Configure Game Studios integration

Use the MCP tools for automatic configuration:

```
"Set up the Game Studios project with OpenForge"
```

Internally, the `setup_game_studios` tool is called, which writes the OpenForge MCP server configuration and per-agent tool permissions into `.claude/settings.json`.

To configure manually, add the following to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "openforge-mcp": {
      "command": "npx",
      "args": ["-y", "openforge-mcp", "--mode", "full"]
    }
  }
}
```

### 4. Install the engine plugin

**Unity:** Import the package and run `Tools > OpenForge > Setup`

**Blender:** Go to `Edit > Preferences > Add-ons > Install`, select the zip file, and enable it

**Godot:** Install the plugin and enable it

---

## Agent-to-tool mapping

| Agent | Available tool categories |
|-------|--------------------------|
| creative-director | All categories (read-only) |
| technical-director | All categories |
| producer | Build, Playtest, Optimization |
| game-designer | Scene, GameObject, Terrain, Input, Template, Physics, NavMesh, Prefab |
| lead-programmer | All categories |
| art-director | Material, Lighting, VFX, Camera, Playtest, Weather, Timeline |
| technical-artist | Material, Optimization, VFX, Lighting, Mesh, Bake, UV, Procedural |
| level-designer | Scene, GameObject, Terrain, Lighting, NavMesh, Prefab, Weather, Camera |
| gameplay-programmer | Physics, Input, Animation, Script, Template, GameObject, Prefab, Timeline |
| ui-programmer | UI, Script, Camera |
| ai-programmer | NavMesh, ML-Agents, Script, GameObject, Physics |
| audio-director | Audio, Script |
| sound-designer | Audio |
| narrative-director | Script, UI, Animation, Timeline |
| qa-lead | Playtest, Optimization, Build |
| qa-tester | Playtest, Camera, Optimization |
| tools-programmer | Build, Optimization, Template, Script |
| vfx-artist | VFX, Material, Lighting, Camera |
| animator | Animation, Timeline, Blender Animation/Armature/ShapeKey |
| 3d-modeler | Blender Object/Mesh/Procedural/Modifier/Collection/GameAsset |
| character-artist | Blender Mesh/Armature/WeightPaint/ShapeKey/Body/Cloth/Accessory/Avatar/VRM |
| environment-artist | Terrain, Lighting, Weather, GameObject, Scene, Prefab, Blender Object/Procedural/Material |

---

## Workflows

Game Studios slash commands let you run predefined workflows where multiple agents collaborate.

### Create Level

The level designer, art director, and technical artist work together to build a level.

```yaml
steps:
  - agent: level-designer
    tools: [create_scene, create_terrain, create_gameobject, set_transform]
    prompt: "Set up the level geometry and layout"
  - agent: art-director
    tools: [create_material, create_light, set_skybox]
    prompt: "Configure lighting and materials"
  - agent: technical-artist
    tools: [analyze_draw_calls, create_lod_group, optimize_textures]
    prompt: "Optimize performance"
```

### Performance Audit

The QA tester and tools programmer audit performance.

```yaml
steps:
  - agent: qa-tester
    tools: [start_profiler, get_profiler_data]
    prompt: "Profile the scene and collect metrics"
  - agent: tools-programmer
    tools: [analyze_draw_calls, create_lod_group, optimize_textures, combine_meshes]
    prompt: "Apply optimizations based on profiler data"
  - agent: qa-tester
    tools: [enter_play_mode, take_screenshot]
    prompt: "Playtest the scene after optimization"
  - agent: qa-lead
    tools: [get_profiler_data, take_screenshot]
    prompt: "Create a before-and-after comparison report"
```

### Art Pass

The art director and VFX artist finalize the visuals.

```yaml
steps:
  - agent: art-director
    tools: [create_material, set_material_color, set_material_property]
    prompt: "Configure and refine materials"
  - agent: art-director
    tools: [create_light, set_light_property, set_skybox]
    prompt: "Adjust lighting and atmosphere"
  - agent: vfx-artist
    tools: [create_particle_system, set_particle_property]
    prompt: "Add visual effects and particles"
  - agent: art-director
    tools: [take_screenshot]
    prompt: "Final review with screenshots"
```

### QA Pass

The QA tester plays the game and reports bugs.

```yaml
steps:
  - agent: qa-tester
    tools: [enter_play_mode, simulate_input, take_screenshot]
    prompt: "Playtest the game and capture issues"
  - agent: qa-tester
    tools: [take_screenshot, exit_play_mode]
    prompt: "Document bugs with screenshots and console output"
  - agent: qa-lead
    tools: [take_screenshot]
    prompt: "Compare screenshots and compile a bug report"
```

---

## MCP Tools

Five MCP tools are added for the integration:

| Tool name | Description |
|-----------|------------|
| `setup_game_studios` | Generate OpenForge configuration files for a Game Studios project |
| `get_agent_tools` | Get the list of OpenForge tools available to a specified agent |
| `get_studio_status` | Display connected engines and available agent roles |
| `run_studio_workflow` | Run a predefined workflow |
| `sync_game_studios` | Sync Game Studios agent definitions from local files or GitHub |

---

## Automatic agent sync

When Game Studios agents are updated, OpenForge follows suit automatically. The `sync_game_studios` tool scans agent definition files (*.md) in the `.claude/agents/` directory and automatically maps them to OpenForge tool categories based on keywords in their descriptions.

### Local sync

Reads agents directly from the project directory:

```
"Sync Game Studios agents from local"
```

Internally, this calls:

```json
{
  "source": "local",
  "projectPath": "/path/to/Claude-Code-Game-Studios"
}
```

Specifying `projectPath` when calling `setup_game_studios` also triggers a local sync automatically.

### GitHub sync

If you do not have a local clone of the repository, you can fetch agents directly from the GitHub API:

```
"Sync Game Studios agents from GitHub"
```

```json
{
  "source": "github"
}
```

GitHub sync characteristics:
- Results are cached for 1 hour to respect API rate limits
- If a 403/429 response is received, cached data continues to be used
- On network errors, the static fallback is maintained

### Local sync vs. GitHub sync

| | Local sync | GitHub sync |
|--|-----------|-----------|
| Speed | Fast (file system read) | Depends on network |
| Prerequisites | Local clone of the repository required | Internet connection only |
| Caching | None (reads the latest every time) | 1-hour cache |
| Rate limits | None | Subject to GitHub API limits |

In either case, statically defined agents (lead-programmer, art-director, etc.) are always available. Dynamically discovered agents are **added to** the static definitions (they do not replace them).

---

## Usage examples

### Create a level

```
"Run the create_level workflow and build a medieval castle level"
```

The AI automatically executes the workflow in order: level-designer, then art-director, then technical-artist.

### Check an agent's available tools

```
"What tools does the art-director have access to?"
```

### Audit performance

```
"Run the performance_audit workflow"
```

Profiler data collection, optimization, playtesting, and report generation are carried out automatically.

---

## Notes

- This is an integration, not a fork or copy of Game Studios.
- Agent role names must exactly match those defined in the Game Studios project.
- Use it while the OpenForge MCP server is running and the game engine plugin is connected.
