---
sidebar_position: 0
title: Tool Explorer
---

# Tool Explorer

OpenForge MCP provides over 620 tools. This page gives an overview of the tool landscape for each engine and explains how tools are used.

---

## Tools by engine

| Engine | Tool count | Main categories |
|---|---|---|
| **Unity** | 260+ | Scene, GameObject, Component, Material, Physics, Animation, UI, Editor |
| **Blender** | 240+ | Object, Mesh, Material, Modifier, Animation, Render, Nodes, UV |
| **Godot** | 100+ | Node, Scene, Script, Resource, Physics, UI, TileMap, Animation |
| **System (shared)** | 20+ | Project management, Snapshots, Screenshots, Pipeline |

---

## Category quick links

### Unity

[Scene](./unity-tools.md#sceneシーン) | [GameObject](./unity-tools.md#gameobjectゲームオブジェクト) | [Material](./unity-tools.md#materialマテリアル) | [Script](./unity-tools.md#scriptスクリプト) | [Physics](./unity-tools.md#physics物理演算) | [Animation](./unity-tools.md#animationアニメーション) | [UI](./unity-tools.md#uiユーザーインターフェース) | [Lighting](./unity-tools.md#lightingライティング)

### Blender

[Object](./blender-tools.md#objectオブジェクト) | [Mesh](./blender-tools.md#meshメッシュ) | [Material](./blender-tools.md#materialマテリアル) | [Modifier](./blender-tools.md#modifierモディファイア) | [Animation](./blender-tools.md#animationアニメーション) | [Render](./blender-tools.md#renderレンダリング)

### Godot

[Node](./godot-tools.md#nodeノード) | [Resource](./godot-tools.md#resourceリソース) | [Screenshot](./godot-tools.md#screenshotスクリーンショット)

---

## Choose your engine

Pick the engine you are using to view its full tool list.

### Unity tools

Best for game development and VRChat world creation. Over 260 tools covering scene construction, material configuration, physics, animation, and more.

**[View Unity tools -->](./unity-tools.md)**

### Blender tools

Best for 3D modeling, rendering, and avatar creation. Over 240 tools covering mesh editing, material nodes, modifiers, and more.

**[View Blender tools -->](./blender-tools.md)**

### Godot tools

For those developing with the open-source game engine. Over 100 tools covering node manipulation, scene management, and script execution.

**[View Godot tools -->](./godot-tools.md)**

### System tools (shared)

Tools available across all engines. Provides project management, snapshot save/restore, screenshot capture, and more.

**[View System tools -->](./system-tools.md)**

---

## How tools work

In OpenForge MCP's Dynamic mode, tools are used in the following flow:

### 1. List available categories

```
list_categories
```

Returns the list of available categories (Scene, GameObject, Material, etc.).

### 2. List tools in a category

```
list_tools category="Scene"
```

Returns the tools that belong to the specified category.

### 3. Execute a tool

```
execute tool="create_gameobject" params={"name": "MyCube", "type": "Cube", "position": [0, 1, 0]}
```

Runs the specified tool with the given parameters.

:::tip Tip
In practice, the AI handles this flow automatically. All you need to do is say "Create a cube" and the AI takes care of the rest.
:::
