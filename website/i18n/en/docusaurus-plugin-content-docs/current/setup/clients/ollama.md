---
sidebar_position: 7
---

# Ollama

This page explains how to connect OpenForge MCP with Ollama.

---

## What Is Ollama?

Ollama is a tool that lets you run AI (large language models) from the terminal. You can download and run models with a single command, and everything runs locally. There are no API fees, and it works even without an internet connection.

When connected to OpenForge MCP, you can control 3D applications like Unity and Blender through terminal conversations.

:::info Note
Ollama is a terminal-based tool. If you prefer a graphical interface, [LM Studio](/docs/setup/clients/lm-studio) might be easier to use.
:::

---

## Prerequisites

### Installing Ollama

Download the installer from [ollama.com](https://ollama.com) and install it.

Once the installation is complete, run the following command in your terminal to verify:

```bash
ollama --version
```

### Downloading a Model

To use AI with Ollama, you first need to download a model.

```bash
ollama pull llama3
```

This command downloads the "llama3" model. Depending on the model size, the download may be several GB and take some time.

### Recommended Models

| Model Name | Size | Features |
|---|---|---|
| `llama3` | 8B | Well balanced, recommended for beginners |
| `codellama` | 7B | Strong at code generation. Ideal when combined with script creation |
| `mistral` | 7B | Lightweight and fast. Good when response speed is a priority |

For higher performance, you can also use larger models such as `llama3:70b` or `qwen2.5:72b` (24 GB or more of GPU memory recommended).

---

## Setup

### Automatic Setup

Run the following command in your terminal to automatically configure Essential Mode.

```bash
npx openforge-mcp setup --client ollama --mode essential
```

If you see "Setup complete", you are done.

### Manual Setup

To use OpenForge MCP from Ollama, you connect through the HTTP API.

#### Step 1: Start the OpenForge MCP Server

Run the following command in your terminal to start OpenForge MCP in HTTP server mode.

```bash
npx openforge-mcp start --transport http --mode essential
```

When the server starts, you will see the endpoint URL:

```
OpenForge MCP HTTP server listening on http://localhost:24601
```

:::warning Note
Do not close this terminal window. The server needs to keep running.
:::

#### Step 2: Start a Model with Ollama

Open another terminal window and start a model with Ollama.

```bash
ollama run llama3
```

The interactive mode will begin.

---

## About Essential Mode

Local AI models have more limited context compared to cloud AI. In Essential Mode, only about 80 of the most commonly used tools from OpenForge MCP are loaded.

This allows comfortable operation within the limited context of local models. All basic 3D operations (creating objects, moving them, deleting them, setting materials, and so on) are covered.

---

## Usage

With the OpenForge MCP server running, give instructions from Ollama's interactive mode.

### Usage Examples

```
$ ollama run llama3

> Create a Cube in the Unity scene

Created a Cube.

> Change the position to 0, 2, 0

Changed the Cube's position to (0, 2, 0).

> Show me the list of objects in the scene

The current scene contains the following objects:
- Main Camera
- Directional Light
- Cube
```

---

## Verification

With the OpenForge MCP server running, execute the following command from another terminal:

```bash
npx openforge-mcp test
```

If you see "All tests passed", OpenForge MCP is working correctly.

Next, try typing the following in Ollama's interactive mode:

> "Show me the OpenForge MCP tool list"

If tool information is returned, the connection is working.

---

## Troubleshooting

### "Connection refused" Error

- Check that the OpenForge MCP HTTP server is running
- Look for errors in the terminal where the server was started
- Verify the port number (default: 24601)

### Cannot Download a Model with Ollama

- Check your internet connection (only needed for downloading models)
- Check your available disk space. Models can be several GB in size
- Run `ollama list` to see if you already have downloaded models

### The AI Does Not Use Tools Correctly

- Try a larger model (13B or above). Smaller models may be less accurate at tool calling
- Simplify your instructions. Giving one operation at a time is the key
- Confirm that Essential Mode is enabled

### Slow Performance

- Check whether the GPU is available. Ollama auto-detects the GPU, but an outdated driver may cause it to fall back to CPU
- Try a smaller model
- Run `ollama ps` to see currently running models. If unneeded models are running, stop them with `ollama stop modelname`

### npx Command Not Found

Node.js may not be installed. Download and install the LTS version from [nodejs.org](https://nodejs.org).

---

That completes the Ollama setup. If you encounter any issues, see the [FAQ](/docs/reference/faq) as well.
