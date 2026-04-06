---
sidebar_position: 5
---

# Gemini CLI

This page explains how to connect OpenForge MCP from the Gemini CLI.

---

## What is Gemini CLI?

Gemini CLI is a command-line (CLI) AI tool provided by Google. It lets you interact with AI from a terminal and supports connecting to MCP servers. When connected to OpenForge MCP, you can control 3D applications such as Unity and Blender through terminal conversations.

---

## Prerequisites

If you have not installed Gemini CLI yet, install it with the following command:

```bash
npm install -g @google/gemini-cli
```

Once the installation is complete, you can verify it by running `gemini --version`.

---

## Setup

To use OpenForge MCP from Gemini CLI, you connect through the HTTP API.

### Step 1: Start the OpenForge MCP server

First, start OpenForge MCP in HTTP server mode from a terminal:

```bash
npx openforge-mcp start --transport http
```

When the server starts, you will see the endpoint URL printed:

```
OpenForge MCP HTTP server listening on http://localhost:24601
```

:::warning Important
Do not close this terminal window. The server needs to keep running.
:::

### Step 2: Create the Gemini CLI configuration file

Edit the Gemini CLI MCP configuration file at `~/.gemini/settings.json` and add the OpenForge MCP connection information:

```json
{
  "mcpServers": {
    "openforge-mcp": {
      "uri": "http://localhost:24601/mcp"
    }
  }
}
```

:::tip Hint
If the `~/.gemini/` folder does not exist, start Gemini CLI once first. The folder is created on the first launch.
:::

### Automatic setup

Instead of the manual steps above, you can run the following command to configure things automatically:

```bash
npx openforge-mcp setup --client gemini-cli
```

However, you still need to start the OpenForge MCP HTTP server separately.

---

## Usage

With the OpenForge MCP server running, open a separate terminal window and start Gemini CLI:

```bash
gemini
```

Once interactive mode starts, you can control 3D applications simply by talking in natural language.

### Usage examples

```
$ gemini

> Create a Cube in the Unity scene and set its position to 0, 2, 0

I will create a Cube using OpenForge MCP.

A Cube has been created at position (0, 2, 0).

> Show me all the objects in the scene

The current scene contains the following objects:
- Main Camera
- Directional Light
- Cube
```

---

## Using the HTTP API directly

You can also call the HTTP API directly without Gemini CLI. This is useful for scripts and automation.

```bash
curl -X POST http://localhost:24601/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list", "params": {}}'
```

For more details on the HTTP API, see the [HTTP API documentation](/docs/advanced/http-api).

---

## Verify the connection

Start Gemini CLI and type the following:

> "Are you connected to OpenForge MCP? Please list the available tools."

If a list of tools comes back, the connection is working correctly.

---

## Troubleshooting

### "Connection refused" appears

- Check that the OpenForge MCP HTTP server is running.
- Look for error messages in the terminal where you started the server.
- Verify that the URL in the configuration file (`http://localhost:24601/mcp`) is correct.

### The server is running but tools are not available

- Restart Gemini CLI.
- Verify that the JSON in `~/.gemini/settings.json` is well-formed.

### npx command not found

Node.js may not be installed. Download and install the LTS version from [nodejs.org](https://nodejs.org).

### Port conflict with the server

If another application is using port 24601, you can start the server on a different port:

```bash
npx openforge-mcp start --transport http --port 24602
```

In that case, update the URL in the configuration file accordingly.

---

This completes the Gemini CLI setup. If you run into any issues, see the [FAQ](/docs/reference/faq) as well.
