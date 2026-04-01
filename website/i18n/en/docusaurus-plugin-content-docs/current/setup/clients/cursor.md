---
sidebar_position: 2
---

# Cursor

This page explains how to connect OpenForge MCP to Cursor.

---

## What Is Cursor?

Cursor is a code editor with built-in AI assistance. You can chat with the AI while writing code, and ask it to generate or modify code for you. Because it supports MCP, connecting it to OpenForge MCP lets you control 3D applications like Unity and Blender from the chat panel inside the editor.

It is especially well suited for those who want to do both programming and 3D work.

---

## Setup

### Method 1: Automatic Setup (Recommended)

Simply run the following command in your terminal, and the configuration file will be created automatically.

```bash
npx openforge-mcp setup --client cursor
```

If you see "Setup complete", you are done. Proceed to the "Verification" section below.

### Method 2: Manual Setup

To configure manually, follow these steps.

#### 1. Create the Configuration File

The MCP configuration file for Cursor is located at:

```
~/.cursor/mcp.json
```

:::tip Hint
`~` refers to your home directory. On Windows, this would be `C:\Users\YourUsername\.cursor\mcp.json`.
:::

#### 2. Edit the Configuration File

Open `mcp.json` in a text editor (create it if it does not exist) and enter the following, then save.

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
If you already have other MCP server configurations, only add the `"openforge-mcp"` block inside `"mcpServers"`.

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

#### 3. Restart Cursor

Quit Cursor and relaunch it for the settings to take effect.

---

## Verification

Follow these steps to confirm that OpenForge MCP is properly connected.

1. Launch Cursor
2. Press **Ctrl + L** (Mac: **Cmd + L**) to open the chat panel
3. In Composer mode or Chat mode, type the following:

> "Show me the OpenForge MCP tool list"

If a list of tools is returned, the connection is working.

You can also verify by opening Cursor's settings (**Ctrl + Shift + P** > "Cursor Settings" > "MCP") and checking that "openforge-mcp" appears in the list with a green status indicator.

---

## Usage Examples

Just chat naturally from the chat panel to control your 3D apps.

> "Create a Cube at position 0, 2, 0"

> "List all objects in the scene"

> "Add a point light and set its color to blue"

Using Cursor's Composer feature, you can generate code and manipulate the scene simultaneously. For example, you can have the AI generate a C# script while also building the scene where that script will run, all through OpenForge MCP.

---

## Troubleshooting

### The Connection Shows Red in the MCP Settings

- Check that the JSON in `~/.cursor/mcp.json` is valid. Common mistakes include missing commas and unclosed brackets
- Confirm that Node.js is installed (run `node --version` in the terminal -- v18 or later is required)
- Restart Cursor

### MCP Tools Are Not Used in Chat

- Make sure the chat panel mode is set to "Agent" or "Composer". MCP tools may not be available in "Chat" mode
- Try asking explicitly: "Use OpenForge MCP to add a cube to the scene"

### Cannot Find the Configuration File

If the `~/.cursor/` folder does not exist, launch Cursor once and check again. The folder is created on first launch. If the folder exists but the file does not, create `mcp.json` manually.

### npx Command Not Found

Node.js may not be installed. Download and install the LTS version from [nodejs.org](https://nodejs.org). After installation, restart the terminal and verify with `npx --version`.

---

That completes the Cursor setup. If you encounter any issues, see the [FAQ](/docs/reference/faq) as well.
