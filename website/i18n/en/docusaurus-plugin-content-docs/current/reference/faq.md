---
sidebar_position: 5
title: "FAQ"
description: "Frequently asked questions about OpenForge MCP"
---

# FAQ

A collection of frequently asked questions about OpenForge MCP.

---

## General

### Which AI clients are supported?

Any AI client that supports MCP (Model Context Protocol) will work. Major compatible clients include:

- Claude Desktop
- GitHub Copilot
- VS Code (via MCP-compatible extensions)
- Other third-party MCP clients

You can also access OpenForge MCP from custom clients using HTTP API mode.

### Is it free?

Yes. OpenForge MCP is **completely free**, open-source software under the MIT license. Commercial use is allowed, and it will remain free going forward.

Note that your AI client may have its own costs (e.g., API usage fees). If you use a local LLM, you can bring the AI-side cost to zero as well.

### Can I use it offline?

OpenForge MCP itself runs offline. However, since AI inference is required, you need one of the following:

- **Cloud AI:** Requires an internet connection
- **Local LLM:** No internet needed. Tools like LM Studio or Ollama allow fully offline operation

See [Using a Local LLM](../advanced/local-llm.md) for details.

### Is my data sent to external servers?

**OpenForge MCP never sends data to external servers.** All processing happens on your local machine.

However, if you use a cloud AI (such as Claude Desktop), your instructions and responses will pass through the AI provider's servers. If you want to keep project data entirely local, consider using a local LLM.

---

## Unity

### Which versions of Unity are supported?

**Unity 2021.3 (LTS) and later** are supported. Recommended versions:

- Unity 2021.3 LTS
- Unity 2022.3 LTS
- Unity 6

:::info Choosing a Unity version
If you have no particular preference, use the latest LTS (Long-Term Support) version. LTS releases are stable, and OpenForge MCP is primarily tested against them.
:::

### Does it work with the VRChat SDK?

Yes. OpenForge MCP works without issues in Unity projects that have the VRChat SDK installed. You can use it for VRChat world and avatar creation.

See [Build a VRChat World](../tutorials/vrchat.md) for VRChat-specific workflows.

### Can I install it from Unity Package Manager?

Yes. You can install it via Unity Package Manager using a Git URL. See [Unity Setup](../setup/unity.md) for detailed instructions.

---

## Blender

### Which versions of Blender are supported?

**Blender 3.6 and later** are supported. Recommended versions:

- Blender 3.6 LTS
- Blender 4.0 and later

### How do I install the Blender add-on?

Install it from Blender's Preferences > Add-ons panel. See [Blender Setup](../setup/blender.md) for details.

---

## Godot

### Which versions of Godot are supported?

**Godot 4.x** is supported. Godot 3.x is not supported.

---

## Technical questions

### How many tools are there in total?

The current version (v0.2.0) includes **622 tools** across Unity, Blender, and Godot, each with its own dedicated set.

### Can I add my own tools?

Yes. You can add custom tools. See the relevant guide for your application:

- [Adding Unity tools](../contributing/add-unity-tool.md)
- [Adding Blender tools](../contributing/add-blender-tool.md)
- [Adding Godot tools](../contributing/add-godot-tool.md)

### What is the difference between HTTP API and stdio mode?

| Aspect | stdio mode | HTTP API mode |
|---|---|---|
| Connection | AI client launches MCP as a child process | MCP runs as a standalone server |
| Concurrency | Single client only | Multiple clients |
| Use case | Normal interactive use | Automation, multi-agent setups |
| Ease of setup | Simple (AI client config only) | More involved (requires starting a server) |

See [HTTP API](../advanced/http-api.md) for details.

---

## Troubleshooting

### I broke my scene by accident -- can I undo?

OpenForge MCP has built-in version control. You can revert to the state before any operation.

**You:**
> Undo the last operation

You can also use the save/restore feature to jump back to any saved point.

**You:**
> Show me the list of save points

See [Save and Restore](../tutorials/save-restore.md) for details.

:::tip Save often
Create a save point before making big changes. You can always come back to it if things go wrong.
:::

### The AI did something I didn't intend

First, say "Undo that" to revert the last action. Then try giving a more specific instruction.

Vague instruction:
> Make it look better

Specific instruction:
> Change the ground material color to RGB(120, 180, 80) green and set Smoothness to 0.3

### The connection to the MCP server dropped

1. Check that Unity / Blender / Godot is running
2. Verify the MCP server process is active
3. Restart the AI client
4. If none of that works, restart the MCP server

---

## How is OpenForge MCP different from other MCP tools?

OpenForge MCP has several distinguishing features:

- **Visual Feedback:** The AI captures and analyzes screenshots to verify its work as it goes
- **Cross-app pipeline:** Automatically transfer models between Blender and Unity / Godot
- **AI Playtest:** The AI runs your scene and identifies bugs automatically
- **Version control:** Save and restore operation history at any point
- **Recipe system:** Reuse common operation patterns
- **Three-app support:** Works with Unity, Blender, and Godot
- **622 tools:** A comprehensive set of tools covering a wide range of operations

Together, these features provide an end-to-end workflow for AI-assisted 3D development.
