---
sidebar_position: 8
title: "Editing Avatars"
description: "Load, edit, and re-export VRM avatars using Blender"
---

# Editing Avatars

This tutorial covers loading a VRM avatar into Blender, reducing polygon count, adding accessories, adjusting body proportions, creating expressions, and re-exporting to VRM format. Everything is done through natural language instructions to the AI.

## Prerequisites

- Blender is running and connected to OpenForge MCP
- You have a VRM file (self-made or downloaded)
- The VRM add-on is installed in Blender

:::info What Is VRM?
VRM is a file format for humanoid 3D avatars. It is widely used on platforms like VRChat and cluster. You need the VRM add-on to edit these files in Blender.
:::

## Step 1: Load the VRM File

Start by loading the avatar into Blender.

**You:**
> Load "C:/Users/me/avatars/my_avatar.vrm" into Blender.

**What happens:** The VRM file is imported and the avatar appears in the Blender viewport. Bones (skeleton) and meshes (shape) are loaded.

**You:**
> Tell me the polygon count of the loaded avatar.

**What happens:** The AI checks and reports the vertex and face (polygon) counts of the mesh. Platforms like VRChat have polygon limits, so it is good to check the current state here.

## Step 2: Reduce Polygon Count

If the polygon count is too high, use the Decimate modifier to reduce it.

**You:**
> Add a Decimate modifier to the avatar mesh and reduce polygons to 70%.

**What happens:** The Decimate modifier is applied and the polygon count is reduced to approximately 70%.

:::warning Be Careful Not to Over-Reduce
Reducing polygons too much can distort facial features or melt fingers together. Start at around 80% and reduce gradually while checking the results.
:::

**You:**
> Show me screenshots of the current avatar. Front and side views.

**What happens:** Front and side rendering results are returned. Check for significant visual degradation.

### Partial Reduction

Sometimes you want to keep the face intact while reducing the body and clothing.

**You:**
> Apply the Decimate modifier only to parts other than the face mesh. Reduce to 60%.

**What happens:** The modifier is applied only to non-face mesh objects. This reduces overall polygon count without distorting facial expressions.

## Step 3: Add an Accessory (Headphones)

Add headphones to give the avatar some personality.

**You:**
> Create headphones and attach them to the avatar's head. Black headband, with round, thick ear pads.

**What happens:** The AI combines basic shapes like torus and cylinder to create headphone geometry. It is positioned to fit the avatar's head.

### Fine-tune the Position

**You:**
> Move the headphones down a bit to align with the ears.

**What happens:** The headphones' Y coordinate is adjusted to fit over the ears.

### Make It Follow the Head

Set the accessory to follow head movement.

**You:**
> Parent the headphone object to the avatar's Head bone so it follows head movement.

**What happens:** The headphones are parented to the Head bone. When the head moves, the headphones move along with it.

:::tip Accessory Ideas
Beyond headphones, you can add hats, glasses, ribbons, necklaces, and more using the same approach. Combining basic shapes can create a surprising variety of forms.
:::

## Step 4: Adjust Body Proportions

Change the avatar's body proportions.

**You:**
> Make the avatar's arms slightly longer. About 1.1x the current length.

**What happens:** The arm bone scale is adjusted, making the arms slightly longer.

**You:**
> I want to change the head-to-body ratio. Make the head slightly larger. Scale the head to 1.15x.

**What happens:** The Head bone scale is increased, giving a slightly larger head for a cuter look.

**You:**
> Reduce the overall height by 10% for a more stylized feel.

**What happens:** The entire armature scale is adjusted for a more compact body type.

:::warning Bone Changes Require Caution
Large changes to bone scale can cause unnatural mesh deformation. Always check with screenshots after changes and look for any oddities.
:::

## Step 5: Create Expressions (Shape Keys)

VRM avatar expressions are controlled by shape keys (blend shapes). Let's add new expressions.

**You:**
> Show me the shape key list for the avatar's face mesh.

**What happens:** A list of currently registered shape key names and their count is returned. You should see entries like "Blink", "Joy", "Angry", etc.

### Add a New Expression

**You:**
> Create a new shape key named "Surprised". Eyes wide open, mouth in a small round O-shape -- a surprised expression.

**What happens:** A new shape key is created by copying the Basis. The AI edits the eye and mouth vertices to create the surprised expression.

**You:**
> Show me a preview of the Surprised shape key. Take screenshots changing the value from 0 to 1 in stages.

**What happens:** Screenshots are returned showing the expression changing as the shape key value increases.

### Add Another Expression

**You:**
> Create a "Smug" shape key too. One eye slightly narrowed, one corner of the mouth raised in a smirk.

**What happens:** An asymmetric expression is created. This gives the character more personality.

:::tip Expression Creation Tips
Expressions often work best when slightly exaggerated. Since shape key values can be adjusted between 0 and 1, making the maximum (1.0) change prominent during modeling makes it easier to fine-tune during actual use.
:::

## Step 6: Export to VRM Format

When editing is complete, export back to VRM format.

**You:**
> Export the current avatar to VRM format. Save to "C:/Users/me/avatars/my_avatar_edited.vrm".

**What happens:** The VRM export process runs. Bone structure, shape keys, materials, and textures are all packaged into VRM format.

### Pre-export Final Check

**You:**
> Run a check before exporting. Tell me the polygon count, bone count, and material count.

**What happens:** Various avatar metrics are reported. Verify they fit within the target platform's limits.

| Check Item | VRChat Guideline (Medium) |
|---|---|
| Polygons | 32,000 or less |
| Bones | 256 or less |
| Materials | 8 or less |
| Meshes | 16 or less |

:::info Do Not Overwrite the Original
When exporting, it is recommended to save with a different name than the original VRM file. If anything goes wrong, you can always start over from the original.
:::

## Summary

What you learned in this tutorial:

- Loading VRM files into Blender
- Reducing polygon count with the Decimate modifier
- Creating and attaching accessories (headphones) from basic shapes
- Changing body proportions through bone scale adjustment
- Adding expressions with shape keys
- Re-exporting to VRM format

Since all operations can be done through natural language instructions, you can customize avatars without memorizing Blender's complex UI. Try creating your own original avatar.
