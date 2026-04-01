---
sidebar_position: 1
---

# Claude Desktop

This page explains how to connect OpenForge MCP to Claude Desktop.

---

## What Is Claude Desktop?

Claude Desktop is a desktop AI chat application provided by Anthropic. You can ask the AI to perform various tasks simply by chatting with it. Because it supports MCP (Model Context Protocol), connecting it to OpenForge MCP lets you control 3D applications like Unity and Blender through conversation.

You can download the app from [claude.ai/download](https://claude.ai/download).

---

## How the Connection Works

Claude Desktop connects to external tools by writing MCP server information into a configuration file (JSON). When you add the OpenForge MCP information to this file, Claude Desktop automatically starts and connects to the OpenForge MCP server on launch.

---

## Setup

### Method 1: Automatic Setup (Recommended)

Simply run the following command in your terminal, and the configuration file will be created automatically.

```bash
npx openforge-mcp setup --client claude-desktop
```

If you see "Setup complete", you are done. Proceed to the "Verification" section below.

### Method 2: Manual Setup

If automatic setup does not work, or if you want to edit the configuration file yourself, follow these steps.

#### 1. Locate the Configuration File

The configuration file location varies by operating system.

| OS | Path |
|---|---|
| Mac | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%/Claude/claude_desktop_config.json` |

:::tip Hint
On Windows, you can type `%APPDATA%/Claude` into the File Explorer address bar to navigate directly to that folder.
:::

#### 2. Edit the Configuration File

Open the configuration file in a text editor and replace its contents with the following, then save.

```json
{
  "mcpServers": {
    "openforge-mcp": {
      "command": "npx",
      "args": ["openforge-mcp", "start"]
    }
  }
}
```

:::warning Note
If you already have other MCP server configurations, only add the `"openforge-mcp"` block inside `"mcpServers"`. Overwriting the entire file will erase your other settings.

Example of adding to an existing configuration:

```json
{
  "mcpServers": {
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
:::

#### 3. Restart Claude Desktop

To apply the settings, quit Claude Desktop completely and relaunch it. If it remains in the taskbar or menu bar, right-click and select "Quit" to fully exit.

---

## Verification

After launching Claude Desktop, if you see a small hammer icon beneath the chat input field, the connection to OpenForge MCP is working.

To confirm the connection, try typing the following in the chat:

> "List the Unity tool categories"

If a list of tool categories provided by OpenForge MCP is returned, the connection is properly configured.

---

## Usage Examples

Once connected, you can control 3D applications just by chatting naturally.

Here are a few examples:

> "Create a Cube at position 0, 2, 0"

> "List all objects in the scene"

> "Create a red material and apply it to the Cube"

> "Move the camera to position 0, 5, -10"

The AI will call the appropriate OpenForge MCP tools to execute these operations in Unity or Blender.

---

## Troubleshooting

### The Hammer Icon Does Not Appear

- Check that the JSON in the configuration file is valid. Missing commas or unclosed brackets are common issues
- Verify that the configuration file is saved in the correct location
- Quit Claude Desktop completely and restart it
- Run `node --version` in your terminal to confirm that Node.js is installed (v18 or later is required)

### "MCP server disconnected" Message

1. Quit Claude Desktop completely
2. Relaunch it

If the issue persists, run the following command in your terminal to check whether OpenForge MCP is working on its own:

```bash
npx openforge-mcp test
```

### The AI Is Not Using the Tools

Try asking explicitly. For example:

> "Use OpenForge MCP to add a cube to the scene"

If it still does not respond, click the hammer icon to check whether the OpenForge MCP tools appear in the list.

### Cannot Find the Configuration File

Launch Claude Desktop once, then check the configuration file location. If you have never launched the app, the configuration folder may not exist yet.

---

That completes the Claude Desktop setup. If you encounter any issues, see the [FAQ](/docs/reference/faq) as well.
