---
sidebar_position: 3
title: "Modeling in Blender"
description: "Create a street lamp model in Blender by giving instructions to the AI"
---

# Modeling in Blender

OpenForge MCP can control not just Unity but Blender as well. In this tutorial, we will create a "street lamp" in Blender by chatting with the AI.

:::info What is Blender?
Blender is a free 3D modeling application. You can create 3D objects and refine their shapes. With OpenForge MCP, you can leave even Blender's complex operations to the AI.
:::

## Preparation

- Blender is running
- OpenForge MCP's Blender integration is enabled

## Step 1: Create the Basic Shape

We will start with the lamp pole.

**You:**
> Open a new project in Blender and delete the default cube

**AI action:** The default cube in Blender's initial scene is deleted, leaving an empty scene.

**You:**
> Create a cylinder. 3 meters tall, 0.1 meters in diameter. This will be the street lamp pole

**AI action:** A tall, thin cylinder is created. This will serve as the lamp post.

**You:**
> Place a cylinder at the base of the pole: 0.15 meters tall, 0.3 meters in diameter. This is the base

**AI action:** A slightly wider cylinder is placed at the bottom of the pole to form the base.

**You:**
> Place an upside-down bowl-shaped hemisphere on top of the pole. 0.4 meters in diameter. This will be the lamp shade

**AI action:** A hemisphere (the top half of a UV Sphere, facing downward) is placed at the top of the pole.

Let's check our work.

**You:**
> Show me a screenshot

## Step 2: Refine the Shape

With the basic shape in place, let's refine the details to make it look like a proper street lamp.

**You:**
> Inside the lamp shade, place a glass sphere for the light source. 0.15 meters in diameter, fitting inside the shade

**AI action:** A small sphere is added inside the lamp shade. This represents the bulb.

**You:**
> Add a gently curving arm from the top of the pole toward the lamp shade. It should extend about 30 cm horizontally from the top of the pole

**AI action:** An arm-shaped object extending horizontally from the top of the pole is added, with the lamp shade hanging from its end.

**You:**
> Wrap 2 small ring-shaped moldings around the base as decoration. Space them 5 cm apart

**AI action:** Two ring-shaped (torus) objects are added around the upper part of the base.

## Step 3: Set Up Materials (Surface Appearance)

Now that the shape is done, let's define the visual look. A material is a setting that determines an object's color and surface quality.

**You:**
> Apply an iron material to the pole, base, arm, and moldings. Dark greenish-black with a slightly metallic finish

**AI action:** A metallic-looking material is applied to the specified parts, with color and metallic values set.

**You:**
> Apply a tarnished copper material to the lamp shade. Slightly rusty, with a rough surface

**AI action:** A rough-surfaced copper-colored material is applied to the lamp shade.

**You:**
> Set the glass sphere to a translucent glass material. Slightly yellowish milky white, letting light through

**AI action:** A semi-transparent glass-like material is applied to the sphere.

:::tip Material tips
When describing materials, include not just the color but also the surface quality. Words like "smooth", "rough", "metallic", and "matte" help the AI set things up more accurately.
:::

## Step 4: Use Modifiers (Processing Tools)

Modifiers are features that automatically process an object's shape. Instead of manually fixing things one by one, you can adjust shapes in bulk.

### Bevel -- Rounding Edges

**You:**
> Apply a bevel modifier to the base and lamp shade. Round the edges slightly, about 2 mm width

**AI action:** The edges of the base and lamp shade are slightly rounded. Real iron objects never have perfectly sharp edges, so this small change adds realism.

:::info What is a bevel?
A bevel "shaves off" edges. When 3D model edges are too sharp, they look unnatural. Rounding them slightly produces a more natural appearance.
:::

### Subdivision Surface -- Smoothing the Whole Surface

**You:**
> Apply a subdivision surface to the glass sphere at level 2

**AI action:** The sphere's surface becomes even smoother. Subdivision surface (commonly called subsurf) divides the faces into smaller sections to create a smoother appearance.

**You:**
> Show me a screenshot in material preview mode so I can see the materials

Checking the render preview here should show the street lamp with materials and modifiers applied.

## Step 5: Export

Let's export the finished model as a file so it can be used in other software like Unity.

**You:**
> Export this street lamp model in FBX format. Name it "street_lamp"

**AI action:** Blender's export function runs and creates a `street_lamp.fbx` file. FBX is a common 3D model format that can be loaded by many applications.

:::warning Check before exporting
Before exporting, verify the following:
- Modifiers are applied as intended
- Materials are correctly configured
- The object's origin is at center

**You:**
> Select the entire street lamp and move the origin to the center

This way you can clean up the positioning before exporting.
:::

## Step 6: Check the Final Result

**You:**
> Show me the street lamp from different angles. Front, side, and top -- 3 screenshots please

**AI action:** Three screenshots from different angles are displayed.

If anything needs fixing, adjust it now.

**You:**
> I think the arm's curve should be smoother. Add more vertices

**You:**
> Make the lamp shade a bit bigger. Change the diameter to 0.45 meters

You can adjust as many times as you like, so keep tweaking until you are satisfied.

## Summary

What you learned in this tutorial:

- **Combining basic shapes** -- Built the street lamp from cylinders and hemispheres
- **Materials for surface quality** -- Set not just colors, but also metallic and roughness properties
- **Modifiers for processing** -- Rounded edges with bevel, smoothed surfaces with subdivision surface
- **Exporting** -- Saved as FBX for use in other applications

Everything was done through conversation with the AI. In the next tutorial, you will learn how to bring this model from Blender into Unity.
