---
sidebar_position: 3
---

# VS Code (GitHub Copilot)

This page explains how to connect OpenForge MCP using VS Code and GitHub Copilot Chat.

---

## What Is VS Code + GitHub Copilot?

VS Code (Visual Studio Code) is a widely used, free code editor. By adding the GitHub Copilot Chat extension, you can chat with an AI while working inside the editor. Because it supports MCP, connecting it to OpenForge MCP lets you control 3D applications from the chat.

---

## Setup

### Method 1: Automatic Setup (Recommended)

Simply run the following command in your terminal, and the configuration file will be created automatically.

```bash
npx openforge-mcp setup --client vscode
```

If you see "Setup complete", you are done. Proceed to the "Verification" section below.

### Method 2: Manual Setup

To configure manually, follow these steps.

#### 1. Locate the Configuration File

VS Code manages MCP settings on a per-project basis. Place a `.vscode/mcp.json` file in the root of your project folder.

```
ProjectFolder/
  .vscode/
    mcp.json    <-- Create this file
```

#### 2. Create the Configuration File

If the `.vscode` folder does not exist, create it, then create `mcp.json` inside it with the following contents.

```json
{
  "servers": {
    "openforge-mcp": {
      "command": "npx",
      "args": ["openforge-mcp", "start"]
    }
  }
}
```

:::warning Important: VS Code uses "servers"
In VS Code's `mcp.json`, the key is `"servers"`. Many other AI clients use `"mcpServers"`, but VS Code uses `"servers"`. Using the wrong key will prevent the connection from working.
:::

If you already have other MCP server configurations, add to the `"servers"` block.

```json
{
  "servers": {
    "existing-server": {
      "command": "...",
      "args": ["..."]
    },
    "openforge-mcp": {
      "command": "npx",
      "args": ["openforge-mcp", "start"]
    }
  }
}
```

#### 3. Restart VS Code

Quit VS Code and relaunch it for the settings to take effect.

---

## About Dynamic Mode

When using OpenForge MCP with VS Code, **Dynamic Mode** is enabled by default.

In Dynamic Mode, only 8 basic tools are loaded initially. When additional tools are needed during conversation, they are loaded on the fly.

This design offers the following benefits:

- **Fast startup** -- The connection is quicker because not all tools are loaded upfront
- **Lower token consumption** -- Only the necessary tools are loaded, so unnecessary tool information does not consume the AI's context
- **Works within GitHub Copilot's tool limit** -- Copilot has a cap on how many tools it can handle at once, so dynamic management makes it possible to access a large number of tools

No special configuration is needed; this mode is active automatically.

---

## Verification

Follow these steps to confirm that OpenForge MCP is properly connected.

1. Launch VS Code and open the project folder that contains the configuration file
2. Press **Ctrl + Shift + I** (Mac: **Cmd + Shift + I**) to open the Copilot Chat panel
3. Select **"Agent"** mode from the dropdown menu at the top of the panel
4. Type the following:

> "Show me the OpenForge MCP tool categories"

Alternatively, you can type `@openforge` in the chat field to see if tools appear as suggestions.

If tool information is returned, the connection is working.

---

## Usage Examples

Chat naturally in the Copilot Chat Agent mode.

> "Create a Cube at position 0, 2, 0"

> "List the objects in the scene"

> "Create a new material and set the color to red"

A unique advantage of VS Code is the ability to edit code and manipulate 3D scenes in the same window. For example, you can write a C# script while simultaneously having the AI build the scene that uses it through OpenForge MCP.

---

## Troubleshooting

### Tools Do Not Appear in Copilot Chat

- Verify that the key in `.vscode/mcp.json` is `"servers"` (not `"mcpServers"`)
- Check that the JSON syntax is correct
- Make sure the Copilot Chat mode is set to "Agent". MCP tools are not available in "Edit" or "Ask" modes
- Restart VS Code

### GitHub Copilot Extension Is Not Installed

Open the VS Code extensions panel (**Ctrl + Shift + X**) and confirm that both "GitHub Copilot" and "GitHub Copilot Chat" are installed and enabled.

### Want to Use It in Other Project Folders

`.vscode/mcp.json` is a per-project setting. To use it in another project, place the same file in that project folder.

### npx Command Not Found

Node.js may not be installed. Download and install the LTS version from [nodejs.org](https://nodejs.org). After installation, restart VS Code.

### Cannot Find a Specific Tool in Dynamic Mode

In Dynamic Mode, tools are loaded dynamically based on the conversation context. If you want to use a specific tool, describe what you want to do concretely. For example, saying "I want to create a material" will automatically load the material-related tools.

---

That completes the VS Code setup. If you encounter any issues, see the [FAQ](/docs/reference/faq) as well.
