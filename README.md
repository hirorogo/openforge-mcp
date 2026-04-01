[日本語版はこちら / Japanese version](README.ja.md)

# OpenForge MCP

**Talk to your AI. It controls Unity and Blender. Free.**

---

## What makes this different

### The AI can see what it built

Existing tools return text like "success". OpenForge lets the AI take a screenshot, evaluate the result, and fix problems on its own.

```
You: "Build a city scene"
  -> AI: Places buildings
  -> AI: Takes screenshot, reviews it
  -> AI: "The buildings are too close together. Adjusting spacing."
  -> AI: Fixes it automatically
```

### Blender and Unity in one conversation

Model in Blender, optimize, import to Unity, place in scene. All in a single conversation. No manual export/import, no switching apps.

```
"Make a shield model in Blender, optimize the mesh,
 import it into Unity, and attach it to the Player's left hand"
```

### "Save" and "Undo" without knowing Git

Version control that feels like save points in a game.

```
"Save the project"        -> auto Git commit
"It broke, go back"       -> instant restore
"Show me my save history" -> formatted changelog
```

### AI plays your game and finds bugs

The AI enters Play Mode, simulates input, and reports errors and performance issues.

```
"Playtest the game and tell me what's wrong"
  -> AI: Runs the game, simulates input
  -> AI: "NullReferenceException on landing.
         FPS drops below 30 near x:100."
```

<!-- Replace with actual screenshots -->
| Unity | Blender |
|-------|---------|
| ![Unity demo](docs/images/unity-demo.png) | ![Blender demo](docs/images/blender-demo.png) |

## Core features

- **Free forever** -- MIT license. No subscriptions. No paywalls.
- **350+ tools** -- Scene, GameObject, Material, Script, Mesh, Animation, Physics, UI, Lighting, Camera, Terrain, VFX, Rendering, and more.
- **One command to get started** -- auto-detects your AI client and writes the config. No JSON editing.
- **Stays efficient in long sessions** -- loads tool details on demand, so context stays clean.
- **Supported AI clients** -- Claude Desktop / Cursor / VS Code / Claude Code CLI / Gemini CLI / [LM Studio / Ollama](docs/getting-started.md)

## Getting Started

### 1. Install

```bash
npx openforge-mcp setup
```

### 2. Add the plugin

**Unity:** Import the package, open `Tools > OpenForge > Setup`.

**Blender:** `Edit > Preferences > Add-ons > Install`, select the zip, enable it.

### 3. Talk to your AI

```
"Set up ragdoll physics on the character"
```

See the [Getting Started guide](docs/getting-started.md) for full details.

## Say this, get that

| What you want | What you say |
|---------------|-------------|
| Build a scene | "Create a ruined city with 5 damaged buildings" |
| Cross-app | "Make a chair in Blender and place it in the Unity room" |
| Materials | "Create a neon glow material and apply it to the sign" |
| Physics | "Add rigidbodies to the crates and stack them up" |
| AI fix loop | "Adjust the lighting. Keep checking the screenshot until it looks right" |
| Version control | "Save the project" / "Go back 3 saves" |
| Script generation | "Write an AI script that makes enemies chase the player" |
| Playtesting | "Run the game and check for bugs" |

## Docs

- [Getting Started](docs/getting-started.md) -- setup instructions
- [Tool Reference](docs/tool-reference.md) -- full tool list and parameters
- [Architecture](docs/architecture.md) -- how it works, protocols, project structure
- [VRChat Guide](docs/vrchat-guide.md) -- world building and avatar workflows
- [Contributing](CONTRIBUTING.md) -- how to help

## Roadmap

### v0.1.0 (current)
- [x] 350+ tools (Unity + Blender)
- [x] AI sees the scene and self-corrects (Visual Feedback)
- [x] "Save" / "Restore" with automatic version control
- [x] Blender-to-Unity pipeline
- [x] Works with all major AI clients

### v1.0.0
- [ ] AI playtesting (run the game, find bugs)
- [ ] Recipe system (complex workflows in one shareable command)
- [ ] Plugin API for community tool extensions

### Future
- [ ] AI asset generation (text-to-3D, text-to-texture)
- [ ] Web dashboard for remote monitoring
- [ ] Godot Engine support

## Build from source

```bash
git clone https://github.com/hirorogo/openforge-mcp.git
cd openforge-mcp
pnpm install && pnpm build
```

## License

MIT
