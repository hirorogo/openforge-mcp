---
sidebar_position: 1
title: "First Steps"
description: "Give your first instructions to the AI using OpenForge MCP"
---

# First Steps

Now that OpenForge MCP is set up, let's start talking to the AI. In this tutorial you will create a few simple objects to get a feel for how everything works.

## Give the AI your first instruction

When you are ready, type the following into the AI chat.

**You:**
> Place a red cube in the Unity scene

**What the AI does:**
When the AI receives this message, it sends a command to Unity through OpenForge MCP. A red cube is automatically created in your Unity scene.

**Result:**
Open the Unity Scene view and you should see a red cube with a red material applied, positioned near the center of the scene.

:::info What is happening behind the scenes?
When you talk to the AI, here is the flow:

1. You give the AI an instruction in plain language
2. The AI interprets the instruction and sends an operation request to the MCP server
3. The MCP server communicates with Unity and creates the object
4. The result appears in the Unity scene

In other words, all you do is talk. No code required.
:::

## Try five more commands

Now that you know the basics, let's experiment.

### 1. Move an object

**You:**
> Move that cube up by 3 meters

**What happens:** The red cube you just created floats up into the air. Its Y coordinate changes to 3.

---

### 2. Add another object

**You:**
> Place a blue sphere below the cube

**What happens:** A sphere with a blue material appears beneath the red cube.

---

### 3. Change the size

**You:**
> Make the blue sphere twice as big

**What happens:** The sphere's scale doubles and it becomes noticeably larger.

---

### 4. Rotate an object

**You:**
> Tilt the red cube 45 degrees

**What happens:** The cube rotates 45 degrees around the Y axis, giving it a diamond-like appearance.

---

### 5. Delete an object

**You:**
> Delete the blue sphere

**What happens:** The blue sphere disappears from the scene, leaving only the red cube.

:::tip Tip
Your instructions can be completely natural. Words like "place," "move," and "delete" all work -- there is no need for programming terminology.
:::

## Check your work -- the screenshot feature

If you want to see how things look, ask the AI for a screenshot.

**You:**
> Show me a screenshot of the current scene

**What happens:** The AI captures a screenshot of the Unity Scene view and displays it in the chat. You can check the current state without leaving the conversation.

**You:**
> Take a screenshot from a higher angle

**What happens:** The AI adjusts the camera and returns an overhead view of the scene.

:::tip Make use of screenshots
It is a good habit to check screenshots frequently during your work. Catching something that doesn't look right early on saves you time later.
:::

## Troubleshooting

Things might not go perfectly on your first try. Here are some common issues and how to handle them.

### The AI doesn't respond

The connection to the MCP server may have dropped. Check the following:

- Is the MCP server running?
- Is Unity running?
- Are the connection settings correct?

**You:**
> Check the connection status

The AI may be able to report the current connection state.

### An object is missing

If you created an object but can't see it, the camera position may be the issue.

**You:**
> Zoom the camera out so I can see the whole scene

### The result isn't what you expected

Vague instructions can lead to misinterpretations. Try being more specific.

Vague:
> Make a box

Specific:
> Create a white box at the scene origin, 2 meters wide, 1 meter tall, and 3 meters deep

:::warning Don't panic
Mistakes are fine. You can tell the AI "Undo that" to revert the last operation in most cases. Experiment freely and get a feel for the workflow.
:::

## Summary

Here is what you learned in this tutorial:

- You can give the AI instructions in plain language
- You can create, move, scale, rotate, and delete objects
- You can verify results with screenshots
- You know how to troubleshoot common issues

Next, try combining these basic operations to build a full scene.
