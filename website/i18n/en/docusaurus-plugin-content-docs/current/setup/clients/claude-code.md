---
sidebar_position: 4
---

# Claude Code CLI

This page explains how to connect OpenForge MCP to the Claude Code CLI.

---

## What is Claude Code?

Claude Code is a command-line (CLI) AI tool provided by Anthropic. You simply run the `claude` command from a terminal to start working alongside the AI in a conversational way. Because it supports MCP, connecting it with OpenForge MCP lets you control 3D applications such as Unity and Blender through terminal conversations.

---

## Prerequisites

If you have not installed Claude Code yet, install it with the following command:

```bash
npm install -g @anthropic-ai/claude-code
```

Once the installation is complete, you can verify it by running `claude --version`.

---

## Setup

### Method 1: Automatic setup (recommended)

Run the following command in a terminal to configure everything automatically:

```bash
npx openforge-mcp setup --client claude-code
```

If you see "Setup complete", the process was successful.

### Method 2: Manual setup

Claude Code automatically discovers MCP servers from a `.mcp.json` file in your project directory, or from the global configuration.

#### Per-project configuration

Create a `.mcp.json` file in the root of your project directory with the following content:

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

#### Global configuration

You can add an MCP server globally using the Claude Code settings command:

```bash
claude mcp add openforge-mcp -- npx openforge-mcp start
```

After running this command, OpenForge MCP will be available from any project directory.

---

## Usage

Run the `claude` command in a terminal to start a conversation with the AI:

```bash
claude
```

Once interactive mode starts, you can control 3D applications simply by talking in natural language.

### Usage examples

Here is an example conversation using OpenForge MCP with Claude Code:

```
$ claude

> List the objects in the Unity scene

Let me check the scene using OpenForge MCP tools.

[Tool call: list_scene_objects]

The current scene contains the following objects:
- Main Camera
- Directional Light

> Create a Cube at position 0, 2, 0

[Tool call: create_primitive]

A Cube has been created at position (0, 2, 0).

> Create a red material and apply it to that Cube

[Tool call: create_material]
[Tool call: apply_material]

A red material has been created and applied to the Cube.
```

Claude Code can also chain multiple tool calls in sequence. Even complex operations can be carried out by giving a single instruction -- the AI will execute the necessary steps in order.

---

## Verify the connection

Start Claude Code and type the following:

> "List the OpenForge MCP tool categories"

If a list of tool categories comes back, the connection is working correctly.

You can also check the registered MCP servers with the following command:

```bash
claude mcp list
```

If `openforge-mcp` appears in the list, the setup is correct.

---

## Troubleshooting

### "openforge-mcp" does not appear in the MCP server list

- Make sure `.mcp.json` is in the current directory or one of its parent directories.
- If you are using the global configuration, verify that the `claude mcp add` command completed successfully.
- Check that the JSON syntax is correct.

### Tools are not being called

- Make sure Claude Code is up to date: `npm update -g @anthropic-ai/claude-code`
- Verify that Node.js v18 or later is installed: `node --version`

### "npx: command not found"

Node.js may not be installed. Download and install the LTS version from [nodejs.org](https://nodejs.org).

### The connection drops mid-session

Exit Claude Code (`Ctrl + C` or `/exit`) and run `claude` again. If the problem persists, check whether OpenForge MCP runs on its own with the following command:

```bash
npx openforge-mcp test
```

---

This completes the Claude Code setup. If you run into any issues, see the [FAQ](/docs/reference/faq) as well.
