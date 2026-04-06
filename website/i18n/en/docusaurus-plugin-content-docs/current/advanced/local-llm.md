---
sidebar_position: 5
title: "Using Local LLMs"
description: "How to run OpenForge MCP in a fully local environment using LM Studio or Ollama"
---

# Using Local LLMs

OpenForge MCP works not only with cloud AI services but also with locally running LLMs (large language models). This guide covers setup with LM Studio and Ollama in detail.

## Why use a local LLM?

Local LLMs offer advantages that cloud services do not.

| Factor | Cloud AI | Local LLM |
|---|---|---|
| Privacy | Data is sent to external servers | Data stays on your machine |
| API costs | Pay-per-use charges apply | Free (only electricity) |
| Internet | Always-on connection required | Not required (works offline) |
| Response speed | Network latency present | Can be fast depending on GPU |
| Model freedom | Only models offered by the provider | Choose any model you like |

:::info Who this is for
- You want to keep project data from leaving your machine
- You want to reduce monthly API costs
- You work in locations with unstable internet
- You want to experiment with specific models
:::

## Setting up with LM Studio

LM Studio is a desktop application that makes it easy to run local LLMs. Its GUI-based interface is approachable even for first-time users.

### Step 1: Install LM Studio

1. Visit the LM Studio website (https://lmstudio.ai)
2. Download the installer for your OS
3. Run the installer and follow the on-screen instructions

### Step 2: Download a model

After launching LM Studio, download a model.

1. Open the search screen from the left menu
2. Enter a model name in the search bar (recommended models are listed below)
3. Click the download button
4. Wait for the download to complete (this may take a while depending on model size)

### Step 3: Start the local server

1. Open the local server screen from the left menu
2. Select the downloaded model
3. Click the "Start Server" button
4. Once the server starts, it becomes accessible at `http://localhost:1234`

### Step 4: Update the OpenForge MCP configuration

Point the AI client connection to the local server in the OpenForge MCP settings. In the MCP configuration file or the AI client settings, change the API endpoint as follows:

```json
{
  "api_base": "http://localhost:1234/v1",
  "api_key": "not-needed"
}
```

:::tip About api_key
The LM Studio local server does not require authentication, but some AI clients require the api_key field. In that case, enter any placeholder string such as "not-needed".
:::

### Step 5: Verify the connection

**You:**
> List the objects in the Unity scene

If everything is working, the local LLM communicates with Unity through OpenForge MCP and returns a list of objects in the scene.

## Setting up with Ollama

Ollama is a tool geared toward users comfortable with the command line. It is lightweight and starts quickly.

### Step 1: Install Ollama

**Windows:**

Download the installer from the official site (https://ollama.com) and run it.

**macOS:**

```bash
brew install ollama
```

**Linux:**

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Step 2: Download and run a model

Run the following command in a terminal:

```bash
ollama run llama3:8b
```

On the first run, the model download begins. Once the download finishes, interactive mode starts. Exit interactive mode with `Ctrl+D`.

### Step 3: Use it as an API server

Ollama acts as an API server simply by running. By default, it accepts requests at `http://localhost:11434`.

OpenForge MCP configuration:

```json
{
  "api_base": "http://localhost:11434/v1",
  "api_key": "not-needed"
}
```

### Step 4: Run in the background

You do not need to enter interactive mode every time. Start the server by itself with:

```bash
ollama serve
```

Verify from another terminal:

```bash
curl http://localhost:11434/api/tags
```

If a model list is returned, the server is running correctly.

## Essential mode

Local LLMs may have smaller context windows and more limited reasoning ability compared to large cloud models. OpenForge MCP's **Essential mode** is designed for comfortable use with these constrained models.

### Essential mode features

- Exposes only a minimal set of tools (the most frequently used basics)
- Reduces token consumption from tool definitions
- Prompt design encourages simpler responses

### Enabling Essential mode

Specify the following in the configuration file:

```json
{
  "tool_mode": "essential"
}
```

:::info Choosing a mode
- **Essential mode**: For smaller models with 7B parameters or fewer
- **Dynamic mode**: For 13B+ models where token efficiency matters
- **Full mode**: For large 70B+ models, or cloud AI

See [Tool modes](./modes.md) for details.
:::

## Recommended models

Choose a model based on your use case and hardware specifications.

### 7B parameter class (approximately 8 GB VRAM)

- **Llama 3 8B** -- Well-balanced and sufficient for basic operations
- **Mistral 7B** -- Relatively strong at code generation
- **Gemma 2 9B** -- High reasoning ability despite its light weight

Recommended with Essential mode. Handles basic object manipulation and scene building, though complex script generation may be challenging.

### 13B parameter class (approximately 16 GB VRAM)

- **Llama 3 13B** -- More accurate instruction following than 7B
- **CodeLlama 13B** -- Strong at script generation

Runs comfortably in Dynamic mode. Handles script generation and cross-app operations.

### 70B parameter class (48 GB+ VRAM)

- **Llama 3 70B** -- Performance approaching cloud AI
- **Mixtral 8x22B** -- Runs efficiently with MoE architecture

Can use Full mode with all features. Provides an experience nearly equivalent to cloud AI, but requires a high-end GPU.

:::warning About quantization
If you do not have enough VRAM, you can use quantized models. Quantization formats like Q4_K_M or Q5_K_M significantly reduce the required VRAM. However, more quantization means lower accuracy. Starting with Q5_K_M is a good balance.
:::

## Performance tips

### Maximize GPU offloading

Local LLM speed depends heavily on the GPU. Loading all model layers onto the GPU delivers the best speed.

- **LM Studio:** Set the "GPU Offload" layer count to maximum in the settings
- **Ollama:** Automatically uses the GPU, but can be tuned with the `OLLAMA_NUM_GPU` environment variable

### Adjust the context length

The default context length is often 4096 tokens. For comfortable use with OpenForge MCP, 8192 or more is recommended.

- **LM Studio:** Change the "Context Length" in the server settings
- **Ollama:** Set the `num_ctx` parameter in a Modelfile

```
# Ollama Modelfile example
FROM llama3:8b
PARAMETER num_ctx 8192
```

### Close unnecessary applications

Local LLMs consume large amounts of memory and GPU resources. Close browser tabs and unused applications to free up resources.

## Troubleshooting

### Responses are extremely slow

**Cause:** The model may be running on the CPU.

**Solution:**
1. Check that GPU drivers are up to date
2. For NVIDIA cards, verify that CUDA is correctly installed
3. Check LM Studio / Ollama logs to confirm the GPU is recognized
4. Try switching to a smaller model

### Connection errors

**Cause:** The local server is not running or the port number is incorrect.

**Solution:**
1. Verify the LM Studio / Ollama server is running
2. Confirm the port number matches the configuration (LM Studio: 1234, Ollama: 11434)
3. Check that a firewall is not blocking local communication

### AI responses are incorrect or tools are not called properly

**Cause:** The model's capability may be insufficient.

**Solution:**
1. Switch to Essential mode
2. Try a larger model
3. Increase the quantization level (e.g., from Q4 to Q5)
4. Make your instructions more specific

### Out-of-memory crash

**Cause:** VRAM or RAM is insufficient for the model size.

**Solution:**
1. Switch to a smaller model
2. Lower the quantization level (e.g., from Q5 to Q4)
3. Reduce the context length
4. Close other applications to free memory

## Summary

Using a local LLM lets you take advantage of OpenForge MCP while preserving privacy and avoiding API costs. The initial setup takes some effort, but once configured, it works just like cloud AI.

Start with a 7B model and Essential mode, then explore settings that suit your environment.
