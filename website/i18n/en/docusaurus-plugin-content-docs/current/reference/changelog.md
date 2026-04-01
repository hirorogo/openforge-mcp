---
sidebar_position: 6
title: "Changelog"
description: "Changes in each version of OpenForge MCP"
---

# Changelog

A record of the changes in each version of OpenForge MCP.

---

## v0.2.0 (Current Version)

A major update. The tool count has grown significantly, with support for new applications and many new features.

### New Features

- **Godot Support:** Added support for Godot 4.x. A GDScript-based editor plugin provides scene manipulation, node management, script generation, and more
- **Visual Feedback:** Added the ability for the AI to take and analyze screenshots. You can now visually verify scene state while working
- **Cross-App Pipeline:** Added a mechanism for automatically transferring model files between Blender and Unity / Godot. Supports FBX, glTF, OBJ, and VRM formats
- **Version Control:** Added the ability to save and restore scene state. Operation history management and rollback are now possible
- **AI Playtest:** Added a feature where the AI automatically plays through a scene and detects bugs, generating a report
- **Recipe System:** Added the ability to save and reuse common operation patterns as recipes
- **GitHub Copilot Support:** MCP connections from GitHub Copilot are now supported

### Tools

- Total tool count expanded from **99 to 622** (approximately 6.3x increase)
- Unity tools: Cover object manipulation, component management, material settings, lighting, UI, animation, physics, audio, navigation, terrain, particles, and more
- Blender tools: Cover mesh editing, modifiers, materials/shaders, armatures, animation, rendering, UV editing, sculpting, and more
- Godot tools: Cover node manipulation, scene management, script generation, 2D/3D operations, resource management, and more
- System tools: Added common tools for screenshot capture, save/restore, recipe management, connection status checks, and more

### Documentation

- Published an official documentation site based on Docusaurus
- Prepared installation guides, tutorials, reference documentation, and contributing guides

### Other Improvements

- Improved HTTP API mode stability
- Enhanced error messages
- Improved reconnection handling
- Expanded logging output

---

## v0.1.0 (Initial Release)

The first release of OpenForge MCP. Provides basic functionality for controlling Unity and Blender from AI clients.

### Features

- **MCP Server:** Supports AI client connections via stdio mode
- **Unity Plugin:** Delivered as an Editor package. Communicates with the MCP server via WebSocket
- **Blender Add-on:** Delivered as a Python-based add-on. Communicates with the MCP server via WebSocket
- **3 Meta-Tool Design:** Implements a token-efficient design using the 3 meta-tools: `list_tools`, `call_tool`, and `get_tool_schema`
- **Dynamic / Full / Essential Modes:** Provides 3 modes for controlling how tools are exposed

### Tools

- Total tool count: **99**
- Unity: Basic object operations (create, delete, move, rotate, scale), material settings, component addition
- Blender: Basic mesh operations, modifier application, material settings

### Supported Environments

- Unity 2021.3 LTS and later
- Blender 3.6 and later
- Windows / macOS / Linux
