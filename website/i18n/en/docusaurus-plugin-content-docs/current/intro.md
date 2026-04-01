---
slug: /intro
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Introduction

## What is OpenForge MCP?

OpenForge MCP is a **free tool that lets you control Unity and Blender just by talking to an AI**.

You will see the term "MCP" -- it stands for **Model Context Protocol**, a standard for connecting AI to applications. Don't worry about the technical details. Think of it like Bluetooth pairing your phone with headphones: MCP pairs an AI with the software you use (Unity, Blender, Godot).

In practice, you simply tell the AI what you want in plain English, and the AI operates Unity or Blender directly. No code required.

---

## Get started in 3 steps

Getting up and running with OpenForge MCP is straightforward.

**Step 1 -- Install**

Install Node.js, then run `npx openforge-mcp setup` in a terminal.

**[View the installation guide -->](./setup/install.md)**

**Step 2 -- Add the plugin**

Install the plugin for your app (Unity / Blender / Godot).

<Tabs>
  <TabItem value="unity" label="Unity">

Add the plugin via Unity Package Manager. See [Unity Plugin](./setup/unity.md) for details.

  </TabItem>
  <TabItem value="blender" label="Blender">

Install the Blender add-on. See [Blender Add-on](./setup/blender.md) for details.

  </TabItem>
  <TabItem value="godot" label="Godot">

Install the Godot plugin. See [Godot Plugin](./setup/godot.md) for details.

  </TabItem>
</Tabs>

**Step 3 -- Talk to the AI**

Open an AI client (such as Claude Desktop) and describe what you want to build.

**[Set up your AI client -->](./setup/ai-clients.md)**

---

## What can it do?

Here are a few examples -- just tell the AI what you want and it builds it for you.

<Tabs>
  <TabItem value="unity-example" label="Unity examples">

**World building:**

> "Build a ruined city. Line up about three crumbling buildings, add cracks to the road, and set the lighting to a sunset atmosphere."

**Game development:**

> "Create a mechanic where the door opens automatically when the player gets close."

> "Set up ragdoll physics on the character so it collapses naturally when it falls."

See the [Scene Building tutorial](./tutorials/scene-building.md) for more.

  </TabItem>
  <TabItem value="blender-example" label="Blender examples">

**3D Modeling:**

> "Make a neon sign. The word 'OPEN' should be glowing, and the frame should look like rusted metal."

> "Model a hat for an avatar. A wide-brimmed bucket hat in beige."

See the [Modeling tutorial](./tutorials/modeling.md) for more.

  </TabItem>
  <TabItem value="godot-example" label="Godot examples">

**Game development:**

> "Build a basic 2D platformer stage. Place the ground and some platforms, and add a player character."

> "Attach a patrol behavior script to the enemy character."

See the [First Steps tutorial](./tutorials/first-steps.md) for more.

  </TabItem>
</Tabs>

These are just a few examples. Share your idea and the AI will bring it to life.

---

## Four key features of OpenForge MCP

### 1. The AI sees the result and fixes it on its own

The AI can inspect its own work. If it notices something is off -- say an object is slightly misplaced -- it corrects the issue without you having to point it out. Less back-and-forth means less frustration.

### 2. Cross-app in a single conversation

You can say "Model this in Blender, then bring it into Unity and place it in the scene" -- all in **one conversation**. No manual file transfers, no switching between apps.

See the [Cross-App tutorial](./tutorials/cross-app.md) for details.

### 3. Save and restore like a video game

Say "Save the current state" and it is saved. Say "Go back to the previous state" and it is restored. It works just like save and load in a game.

See the [Save & Restore tutorial](./tutorials/save-restore.md) for details.

### 4. The AI playtests your game and finds bugs

You can ask "Play through this game and check for anything wrong." The AI runs the game itself and reports any bugs or oddities it finds.

See the [AI Playtest tutorial](./tutorials/ai-playtest.md) for details.

---

## Who is this for?

- **VRChat world and avatar creators** -- No 3D modeling or programming knowledge required
- **Solo game developers** -- Powerful support for indie developers juggling every role
- **Students learning 3D CG** -- Learn by doing, with the AI as your guide
- **Hobbyist creators** -- If you have an idea, the AI lowers the technical barriers

No programming experience is needed. Just describe what you want and get started.

---

## Completely free

OpenForge MCP is **completely free** and will stay that way. It is released under the MIT license, an open-source license that means anyone can use it freely, including for commercial projects.

When you are ready, head to the [Installation](./setup/install.md) page to get started.

---

## Where should I start?

| Goal | Recommended page |
|------|-----------------|
| Try it out right away | [First Steps](./tutorials/first-steps.md) |
| Use it with Unity | [Unity Usage](./usage/unity-usage.md) |
| Use it with Blender | [Blender Usage](./usage/blender-usage.md) |
| Build VRChat worlds/avatars | [VRChat Mode Overview](./vrchat/overview.md) |
| Student looking to start for free | [Students Can Start for Free](./guides/student-free.md) |
| Browse all available tools | [Tool Explorer](./reference/tool-explorer.md) |
| Advanced workflows | [Advanced Tutorial](./tutorials/advanced/custom-pipeline.md) |
| Contribute to development | [Contributing Guide](./contributing/overview.md) |
| See every page | [Full Sitemap](./sitemap.md) |
