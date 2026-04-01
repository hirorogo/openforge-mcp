---
sidebar_position: 6
---

# LM Studio

This page explains how to connect OpenForge MCP to LM Studio.

---

## What Is LM Studio?

LM Studio is a desktop application that lets you run AI (large language models) on your own computer. It works entirely locally with no internet connection required, so your data never leaves your machine. There are no API usage fees.

Because it supports MCP, connecting it to OpenForge MCP lets you control 3D applications like Unity and Blender using a locally running AI.

---

## Why Choose LM Studio?

- **Free to use** -- No API fees
- **Privacy** -- Your data is never sent over the internet
- **Works offline** -- Usable even without an internet connection
- **Graphical interface** -- Model selection and chat are done through a GUI

:::info System Requirements
The performance of the AI running in LM Studio depends heavily on your computer's specs, particularly GPU memory. A GPU with at least 8 GB of VRAM is recommended for a comfortable experience.
:::

---

## Setup

### Method 1: Automatic Setup (Recommended)

Run the following command in your terminal to automatically create the configuration file in Essential Mode.

```bash
npx openforge-mcp setup --client lmstudio --mode essential
```

If you see "Setup complete", you are done. Proceed to the "Preparing a Model" and "Verification" sections below.

### Method 2: Manual Setup

To configure manually, follow these steps.

#### 1. Create the Configuration File

The MCP configuration file for LM Studio is located at:

```
~/.lmstudio/mcp.json
```

:::tip Hint
`~` refers to your home directory. On Windows, this would be `C:\Users\YourUsername\.lmstudio\mcp.json`.
:::

#### 2. Edit the Configuration File

Open `mcp.json` in a text editor (create it if it does not exist) and enter the following, then save.

```json
{
  "mcpServers": {
    "openforge-mcp": {
      "command": "npx",
      "args": ["openforge-mcp", "start", "--mode", "essential"]
    }
  }
}
```

:::warning Important: Essential Mode Is Specified
The configuration above includes `--mode essential`. This is a mode optimized for local models. Details are explained in the next section.
:::

---

## About Essential Mode

Local AI models have more limited context (the amount of information they can process at once) compared to cloud-based AI. To address this, OpenForge MCP includes **Essential Mode**, a lightweight mode.

| Mode | Number of Tools | Target |
|---|---|---|
| Full Mode (default) | All tools | Cloud AI |
| Essential Mode | Approximately 80 tools | Local AI |

Essential Mode loads only the most commonly used tools, so it runs comfortably within the limited context of local models. It covers all basic 3D operations such as creating objects, moving them, and setting materials.

---

## Preparing a Model

Launch LM Studio and download an AI model.

### Recommended Model Sizes

| System Specs | Recommended Size | Examples |
|---|---|---|
| GPU memory 8 GB or less | 7B parameters | Qwen 2.5 7B, Llama 3 8B |
| GPU memory around 16 GB | 13B parameters | Qwen 2.5 14B, Codestral 22B |
| GPU memory 24 GB or more | 70B parameters | Qwen 2.5 72B, Llama 3 70B |

:::tip Hint
If you are unsure, start with a **7B model**. It can handle basic operations just fine. You can switch to a larger model later if you need higher accuracy.
:::

Search for the model names listed above in the LM Studio model search screen and download them. GGUF format models are the most commonly used.

---

## Verification

1. Launch LM Studio
2. Load the downloaded model
3. Navigate to the chat screen
4. Try typing the following:

> "Show me the OpenForge MCP tool list"

If a list of tools is returned, the connection is working.

---

## Usage Examples

Chat naturally from the chat screen.

> "Create a Cube at position 0, 2, 0"

> "List the objects in the scene"

> "Move the Cube 3 units in the X direction"

With local models, larger models produce more accurate results. If things are not working well, try simplifying your instructions.

---

## Performance Tips

Here are some tips for using OpenForge MCP comfortably with local models.

### Keep Instructions Simple

Giving one instruction at a time is more reliable than asking for multiple operations at once.

Good:
> "Create a Cube" then "Set the position to 0, 2, 0" then "Apply a red material"

Less effective:
> "Create a red Cube at position 0, 2, 0, also add a light, and change the camera angle"

### Use GPU Offloading

In LM Studio's settings, offload as many model layers to the GPU as possible. GPU processing is significantly faster than CPU.

### Adjust Context Length

In the LM Studio model settings, set the context length to at least 4096. If it is too short, tool information may get truncated mid-conversation.

---

## Troubleshooting

### MCP Tools Are Not Listed

- Check that the JSON in `~/.lmstudio/mcp.json` is valid
- Confirm that Node.js is installed: `node --version` (v18 or later is required)
- Restart LM Studio

### The AI Does Not Call Tools

- Verify that the model supports "Function Calling" or "Tool Use". Not all models support this
- Make sure tool usage is enabled in LM Studio's chat settings
- Try being more explicit: "Use the OpenForge MCP tools to create a Cube"

### Slow Performance

- Try a smaller model (7B size)
- Confirm that Essential Mode is enabled (`--mode essential` is specified)
- Check your GPU offloading settings
- Make sure other applications are not consuming a large amount of GPU memory

### Unusual Model Output

- Try a different model. Compatibility with MCP tools varies by model
- Check that the context length is not too short

---

That completes the LM Studio setup. If you encounter any issues, see the [FAQ](/docs/reference/faq) as well.
