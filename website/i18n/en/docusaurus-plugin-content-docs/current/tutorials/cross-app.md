---
sidebar_position: 4
title: "From Blender to Unity"
description: "Learn how to bring models made in Blender into Unity using OpenForge MCP's cross-app workflow"
---

# From Blender to Unity

One of the unique features of OpenForge MCP is the ability to work across multiple applications. In this tutorial, you will create a bench in Blender and then place it in a Unity scene.

## What Makes This Special

Normally, bringing a model from Blender to Unity requires these steps:

1. Create the model in Blender
2. Export it as FBX
3. Copy the file to the Unity project folder
4. Check the imported model in Unity
5. Drag and drop it into the scene
6. Adjust the position and scale

With OpenForge MCP, you can do all of this seamlessly through a conversation with the AI.

## Tutorial: Create a Bench and Place It in a Scene

### Part 1: Create the Bench in Blender

**You:**
> I want to make a park bench in Blender. Seat is 1.5 meters wide, 0.4 meters deep, and 0.45 meters off the ground

**AI action:** A new object is created in Blender. A flat box forming the seat is placed at the specified dimensions.

**You:**
> Add a backrest too. About 0.5 meters tall from the back of the seat, tilted slightly backward

**AI action:** A slightly angled backrest is added behind the seat.

**You:**
> The legs should be 4 metal pipes. Black metallic material

**AI action:** Four cylinders are placed as legs, with a black metallic material applied.

**You:**
> Apply a light natural wood material to the seat and backrest

**AI action:** A wood-grain material is applied to the seat and backrest.

Let's check it.

**You:**
> Show me a screenshot in render preview

:::tip Quality check before transfer
Check the result in Blender before bringing it into Unity. It is easier to make corrections in Blender than after the transfer to Unity.
:::

### Part 2: Bring It Into Unity

This is where OpenForge MCP really shines.

**You:**
> Import this bench into Unity

**AI action:** Behind the scenes, the following happens automatically:

1. The Blender model is exported as FBX
2. The file is copied to the Unity project's Assets folder
3. Unity detects and imports the file

That is all there is to it. You just say one thing to the AI.

**You:**
> Did it import? Show me a confirmation screenshot

**AI action:** A screenshot is returned showing the imported bench model in Unity's Project window.

### Part 3: Place It in the Scene

**You:**
> Place the bench in the scene at position (3, 0, 2)

**AI action:** The imported bench prefab is placed in the scene at the specified coordinates.

**You:**
> Rotate it 90 degrees on the Y axis so it faces the path

**AI action:** The bench rotates to change its orientation.

**You:**
> Place another copy of the same bench at (3, 0, -2) facing the opposite way, so they are facing each other

**AI action:** Another bench is placed, facing the first one.

**You:**
> Take a screenshot from an angle that shows both benches

## Reviewing the Conversation Flow

Let's look back at the full sequence of operations.

| Order | What You Said | What the AI Did | In Which App |
|---:|---|---|---|
| 1 | Make a bench | Created the seat | Blender |
| 2 | Add a backrest | Added the backrest | Blender |
| 3 | Add legs | Created the legs | Blender |
| 4 | Set the materials | Applied textures | Blender |
| 5 | Import into Unity | Export, copy, import | Blender to Unity |
| 6 | Place it in the scene | Placed in scene | Unity |
| 7 | Rotate it | Adjusted orientation | Unity |
| 8 | Place another one | Duplicated and placed | Unity |

Notice how both Blender and Unity were used within a single conversation. The key point is that you never had to think about switching between apps.

## What Happens Behind the Scenes?

For those curious about the internals, here is a brief explanation.

```
You --> AI --> OpenForge MCP Server --> Blender / Unity
```

When the AI receives your instruction, it determines whether it is a "Blender task" or a "Unity task" and sends the command to the appropriate application through the OpenForge MCP server.

For operations that span multiple apps, like "import", the MCP server acts as a bridge and automatically handles these steps:

1. Execute the export on the Blender side
2. Copy the file to the appropriate location in the Unity project
3. Execute the import on the Unity side

You do not need to know any of this. A single word -- "import" -- is all it takes.

:::info Supported Applications
This cross-app workflow is available between applications that OpenForge MCP supports. The Blender-Unity combination is the most common, but support for additional apps is planned.
:::

## When This Is Especially Useful

Here are some scenarios where cross-app workflows really shine.

### Creating an Interior Scene with Original Furniture

**You:**
> Make a modern round table in Blender, then place it in the Unity cafe scene

### Creating Character Props

**You:**
> Make a magic wand in Blender, then place it at the character's hand position in Unity

### Customizing Architectural Parts

**You:**
> Make an arched window frame in Blender, then fit it into the building wall in Unity

:::warning Things to Keep in Mind
- Materials created in Blender may look slightly different when brought into Unity. Some tweaking on the Unity side may be needed
- Very complex models (extremely high polygon counts) may take time to import
- Both Blender and Unity need to be running for this to work
:::

## Summary

What you learned in this tutorial:

- A single AI instruction can bring a Blender model into Unity
- You can work across apps seamlessly within the flow of a conversation
- Behind the scenes, the MCP server automatically handles export, copy, and import

Next, let's learn about saving and restoring your work.
