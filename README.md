[日本語版はこちら / Japanese version](README.ja.md)

# OpenForge MCP

Free, open-source MCP server that connects AI to Unity and Blender.
Control your creative tools with natural language.

---

## What is this?

OpenForge MCP is a [Model Context Protocol](https://modelcontextprotocol.io/) server that lets AI assistants operate Unity Editor and Blender through natural language. Ask your AI to create game objects, build scenes, edit materials, write scripts, and more.

**Key points:**

- Works with Claude Desktop, Cursor, VS Code, Claude Code CLI, Gemini CLI, LM Studio, and Ollama
- 99 tools across Unity and Blender (growing to 350+)
- Token-efficient 3-meta-tool architecture (99% context reduction)
- One-command setup
- MIT licensed, free forever

## Demo

<!-- Replace these with actual screenshots -->
| Unity | Blender |
|-------|---------|
| ![Unity demo](docs/images/unity-demo.png) | ![Blender demo](docs/images/blender-demo.png) |

| Setup Window | AI Client |
|-------------|-----------|
| ![Setup](docs/images/setup-window.png) | ![Claude Desktop](docs/images/claude-desktop.png) |

## Quick Start

### 1. Install the MCP server

```bash
npx openforge-mcp setup
```

This detects your AI client (Claude Desktop, Cursor, VS Code, etc.) and writes the configuration automatically.

### 2. Install the editor plugin

**Unity:** Import the package via Unity Package Manager or `.unitypackage`. Open `Tools > OpenForge > Setup` and click Test Connection.

**Blender:** Install `blender-addon.zip` from `Edit > Preferences > Add-ons > Install`. Enable the addon.

### 3. Start using it

Open your AI client and talk to your editor:

```
"Create a player character with a capsule collider and rigidbody"
"Set up a forest scene with directional lighting"
"Make a glass material and apply it to the Sphere object"
"Export the model as FBX"
```

## Architecture

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

The server exposes 3 meta-tools to keep token usage minimal:

| Tool | Purpose |
|------|---------|
| `list_categories` | Show available tool categories for Unity or Blender |
| `list_tools` | Show tools in a specific category with their parameters |
| `execute` | Run a tool with the given parameters |

This means the AI only loads tool details when it needs them, instead of flooding the context with hundreds of tool definitions.

## Supported Tools

### Unity (27 tools)

| Category | Tools |
|----------|-------|
| Scene | create_scene, load_scene, save_scene, get_scene_info, get_hierarchy |
| GameObject | create, find, destroy, set_transform, set_active, add_component, remove_component, get_components, set_parent, duplicate |
| Material | create, set_color, set_shader, set_texture, set_property, get_info |
| Script | create, edit, attach, get, search_code |
| Screenshot | get_viewport_screenshot |

### Blender (26 tools)

| Category | Tools |
|----------|-------|
| Object | create_mesh, transform, duplicate, delete, set_origin, join, separate |
| Mesh | extrude, bevel, subdivide, boolean, decimate, merge_by_distance, knife_cut |
| Material | create, set_color, set_metallic, set_roughness, glass, emission |
| Scene | get_info, get_objects_list, set_render_engine, set_resolution, set_frame_range |
| Screenshot | get_viewport_screenshot |

More tools are being added. See the [Roadmap](#roadmap) below.

## Tool Modes

Choose the mode that fits your setup:

| Mode | Tools | Best for |
|------|-------|----------|
| Full | All tools | Claude Desktop, Cursor with cloud models |
| Essential | 80 core tools | LM Studio, Ollama, local LLMs |
| Dynamic | 8 base + on-demand | VS Code with GitHub Copilot |

```bash
npx openforge-mcp setup --mode essential --client lmstudio
```

## HTTP API

For automation, CI/CD, or multi-agent workflows, the server also exposes a REST API:

```bash
# Execute a tool
curl -X POST http://localhost:19810/api/execute \
  -H "Content-Type: application/json" \
  -d '{"target": "unity", "tool": "create_gameobject", "params": {"name": "Cube", "primitiveType": "Cube"}}'

# List categories
curl http://localhost:19810/api/categories

# Check status
curl http://localhost:19810/api/status
```

## Project Structure

```
openforge-mcp/
  packages/
    mcp-server/       TypeScript MCP server + HTTP API
    unity-plugin/     Unity Editor plugin (C#)
    blender-addon/    Blender addon (Python)
```

## Building from Source

**Requirements:** Node.js 18+, pnpm

```bash
git clone https://github.com/your-org/openforge-mcp.git
cd openforge-mcp
pnpm install
pnpm build
```

**Run tests:**

```bash
# MCP server tests (176 tests)
cd packages/mcp-server && npx vitest run

# Blender addon tests
cd packages/blender-addon/tests && python -m pytest -v
```

## Roadmap

### v0.1.0 (current)
- [x] MCP server with 3-meta-tool architecture
- [x] Unity plugin: Scene, GameObject, Material, Script tools
- [x] Blender addon: Object, Mesh, Material, Scene tools
- [x] Visual feedback (viewport screenshots)
- [x] HTTP API for multi-agent support
- [x] Full / Essential / Dynamic modes

### v0.2.0
- [ ] 150+ tools for Unity and Blender
- [ ] Setup CLI with auto-detection
- [ ] Auto version control (save/restore via Git)
- [ ] Transaction and undo groups
- [ ] LM Studio and Ollama configuration

### v1.0.0
- [ ] 350+ tools (Animation, Physics, UI, Lighting, Camera, Terrain, VFX, Shader)
- [ ] Blender-to-Unity pipeline
- [ ] Recipe system (YAML-defined reusable workflows)
- [ ] Plugin API for community tool extensions

### Future
- [ ] AI playtest (run the game, find bugs automatically)
- [ ] AI asset generation (text-to-3D, text-to-texture integrations)
- [ ] Web dashboard for remote monitoring
- [ ] Godot Engine support

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
