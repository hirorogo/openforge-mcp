# Getting Started

## Prerequisites

- Node.js 18 or later
- One of: Unity 2021.3+, Blender 3.6+
- One of: Claude Desktop, Cursor, VS Code, Claude Code CLI, LM Studio, Ollama

## Installation

### Step 1: Install the MCP server

```bash
npx openforge-mcp setup
```

The setup command will:
- Detect which AI clients are installed on your system
- Write the MCP configuration file for each detected client
- Print instructions for installing the editor plugin

If you prefer to target a specific client:

```bash
npx openforge-mcp setup --client claude-desktop
npx openforge-mcp setup --client cursor
npx openforge-mcp setup --client vscode
npx openforge-mcp setup --client lmstudio
npx openforge-mcp setup --client ollama
```

For local LLMs with limited context, use essential mode:

```bash
npx openforge-mcp setup --mode essential --client lmstudio
```

### Step 2: Install the editor plugin

#### Unity

**Option A: Unity Package Manager (recommended)**

1. Open Unity
2. Go to `Window > Package Manager`
3. Click `+` then `Add package from git URL`
4. Enter: `https://github.com/your-org/openforge-mcp.git?path=packages/unity-plugin`

**Option B: Manual install**

1. Download the latest `.unitypackage` from Releases
2. In Unity, go to `Assets > Import Package > Custom Package`
3. Select the downloaded file

After installing, open `Tools > OpenForge > Setup` to verify the connection.

#### Blender

1. Download `openforge-blender-addon.zip` from Releases
2. In Blender, go to `Edit > Preferences > Add-ons`
3. Click `Install` and select the zip file
4. Enable the "OpenForge MCP" addon

The server starts automatically. Check the N-panel in the 3D viewport for status.

### Step 3: Restart your AI client

Close and reopen Claude Desktop, Cursor, or whichever AI client you configured. The OpenForge tools should now be available.

## Verifying the Setup

Ask your AI:

```
List all Unity tool categories
```

You should see a list of categories like Scene, GameObject, Material, and Script.

Then try:

```
Create a cube at position 0, 2, 0
```

If Unity is running with the plugin installed, a cube should appear at that position.

## Configuration Files

The setup command writes to these locations:

| Client | Config file |
|--------|-------------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%/Claude/claude_desktop_config.json` (Windows) |
| Cursor | `~/.cursor/mcp.json` |
| VS Code | `.vscode/mcp.json` (project-level) |
| LM Studio | `~/.lmstudio/mcp.json` |

## Ports

| Service | Default port |
|---------|-------------|
| Unity plugin | 19800 |
| Blender addon | 19801 |
| HTTP API | 19810 |

All ports are configurable via environment variables or the setup UI.

## Next Steps

- Browse the [Tool Reference](tool-reference.md) for a full list of available tools
- Read about [Tool Modes](tool-reference.md#modes) to pick the right mode for your AI setup
