# OpenForge Screenshot Guide

This guide describes exactly which screenshots are needed for project documentation, what each should show, and how to capture them.

## General Guidelines

- **Format**: PNG (lossless, no compression artifacts)
- **Recommended Resolution**: 1920x1080 (preferred) or 1280x720 (minimum)
- **Naming**: Use the exact filenames listed below
- **Location**: Save all screenshots to `docs/images/`

---

## 1. `unity-demo.png` -- Unity Editor with OpenForge Objects

**What should be visible:**
- The full Unity Editor window (Scene view, Hierarchy, Inspector, Project panels)
- Several 3D objects in the scene that were created by OpenForge via AI commands
- The Hierarchy panel showing the created GameObjects with recognizable names

**Steps to capture:**
1. Open Unity and load a project that has the OpenForge Unity package installed.
2. Connect OpenForge (ensure the MCP server is running).
3. Using Claude Desktop or another MCP client, ask the AI to create several objects (e.g., "Create a red cube, a blue sphere, and a green cylinder arranged in a row").
4. In Unity, frame the created objects in the Scene view so they are clearly visible.
5. Take a screenshot of the full editor window at 1920x1080 or 1280x720.
6. Save as `docs/images/unity-demo.png`.

---

## 2. `blender-demo.png` -- Blender with OpenForge Objects

**What should be visible:**
- The full Blender window with the 3D Viewport active
- One or more meshes created by OpenForge via AI commands
- The Outliner showing the created objects

**Steps to capture:**
1. Open Blender with the OpenForge add-on installed and enabled.
2. Connect OpenForge (ensure the MCP server is running and the add-on is connected).
3. Using Claude Desktop or another MCP client, ask the AI to create a mesh (e.g., "Create a low-poly tree").
4. Frame the viewport so the created mesh is clearly visible.
5. Take a screenshot of the full Blender window at 1920x1080 or 1280x720.
6. Save as `docs/images/blender-demo.png`.

---

## 3. `setup-window.png` -- OpenForge Setup Window in Unity

**What should be visible:**
- The OpenForge Setup/Configuration window in Unity
- All configuration fields visible (server address, port, API key if applicable)
- The Unity Editor should be visible in the background

**Steps to capture:**
1. Open Unity with the OpenForge Unity package installed.
2. Go to the menu: **Tools > OpenForge > Setup** (or the equivalent menu path).
3. The setup window should appear. Make sure all fields and buttons are visible.
4. Take a screenshot of the full editor window (not just the popup) at 1920x1080 or 1280x720.
5. Save as `docs/images/setup-window.png`.

---

## 4. `claude-desktop.png` -- Claude Desktop with OpenForge Tools

**What should be visible:**
- The Claude Desktop application window
- A conversation where Claude is using OpenForge tools (e.g., creating objects, listing scenes)
- The tool call and its result should both be visible in the conversation

**Steps to capture:**
1. Open Claude Desktop with OpenForge configured as an MCP server in its config.
2. Start a new conversation.
3. Ask Claude to perform an action using OpenForge (e.g., "List all objects in the Unity scene" or "Create a cube at position 0,1,0").
4. Wait for the tool call to complete and the result to appear.
5. Take a screenshot of the Claude Desktop window showing both the request and response at 1920x1080 or 1280x720.
6. Save as `docs/images/claude-desktop.png`.

---

## 5. `blender-panel.png` -- OpenForge N-Panel in Blender

**What should be visible:**
- The Blender 3D Viewport with the N-panel (sidebar) open
- The OpenForge tab selected in the N-panel
- All panel controls and status indicators visible

**Steps to capture:**
1. Open Blender with the OpenForge add-on installed and enabled.
2. Hover over the 3D Viewport and press **N** to open the sidebar.
3. Click on the **OpenForge** tab in the sidebar.
4. Make sure the panel contents are fully visible (connection status, server URL, any buttons).
5. Take a screenshot of the Blender window with the panel visible at 1920x1080 or 1280x720.
6. Save as `docs/images/blender-panel.png`.

---

## Checklist

| Filename             | Resolution       | Format | Status |
|----------------------|------------------|--------|--------|
| `unity-demo.png`     | 1920x1080 / 1280x720 | PNG | [ ] |
| `blender-demo.png`   | 1920x1080 / 1280x720 | PNG | [ ] |
| `setup-window.png`   | 1920x1080 / 1280x720 | PNG | [ ] |
| `claude-desktop.png` | 1920x1080 / 1280x720 | PNG | [ ] |
| `blender-panel.png`  | 1920x1080 / 1280x720 | PNG | [ ] |
