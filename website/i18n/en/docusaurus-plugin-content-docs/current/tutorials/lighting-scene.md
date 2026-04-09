---
sidebar_position: 11
title: "Setting the Mood with Lighting"
description: "Learn how to dramatically change a scene's atmosphere using Unity's lighting features"
---

# Setting the Mood with Lighting

The same scene can feel completely different depending on the lighting. This tutorial covers Unity's light types, three-point lighting setup, lightmap baking, and post-processing -- all through conversation with the AI.

## Prerequisites

- Unity is running and connected to OpenForge MCP
- You have a scene with some objects placed (a simple room is fine)

## Understanding Light Types

Unity has 4 types of lights. Let's understand each one.

### Directional Light

Illuminates the entire scene from one direction, like sunlight. Position does not matter -- only the rotation affects the result. Commonly used as the main light for outdoor scenes.

### Point Light

Emits light in all directions from a single point, like a light bulb. Used for objects with a clear light source, such as lamps or campfires.

### Spot Light

Emits light in a cone shape, like a flashlight. Well-suited for stage lighting or street lights.

### Area Light

Emits light from a surface. Can represent light coming through a window or fluorescent tube lighting. Note that it is bake-only and cannot be used in real-time.

## Step 1: Start by Turning Off All Lights

Reset the current lighting and start from darkness.

**You:**
> Disable all lights in the scene. Make it completely dark.

**What the AI does:** All light objects are disabled and the scene goes dark.

**You:**
> Show me a screenshot.

**What the AI does:** A dark screenshot (or one with only ambient light) is returned. From here, we will add lights one by one.

## Step 2: Set Up Three-Point Lighting

Let's have the AI set up "three-point lighting" (Key Light / Fill Light / Back Light), a technique commonly used in film production.

### Key Light

The primary light source for the scene.

**You:**
> Create a Directional Light from the upper-left front of the scene. Warm white color (around 5500K color temperature), intensity 1.2. Enable shadows and make them soft.

**What the AI does:** A Directional Light is added, creating the main shadows and highlights in the scene.

**You:**
> Show me a screenshot.

With just one light, the side not hit by light should be quite dark.

### Fill Light

A weaker light from the opposite side to soften the shadows.

**You:**
> Add a Point Light from the right side of the scene. Place it opposite the key light. Slightly bluish white color, intensity about half of the key light. Disable shadows.

**What the AI does:** The Fill Light is added, slightly brightening the dark side. The key is that shadows remain partially visible rather than being completely eliminated.

### Back Light

Light from behind the subject to make the outline stand out.

**You:**
> Add a Spot Light from the upper rear of the scene. Aim it to illuminate the back of the objects. White color, intensity 0.8. Angle 45 degrees.

**What the AI does:** The Back Light is added, creating a rim light effect along the object outlines.

**You:**
> Show me a screenshot of the three-point lighting result.

:::tip Effect of Three-Point Lighting
Compare the before and after. The scene that looked flat with just one light should now have depth and dimension with three lights. The foundation of lighting is this balance of light and shadow.
:::

## Step 3: Create a Daytime Scene

As an application of three-point lighting, let's create an outdoor daytime scene.

**You:**
> Disable all three-point lights. Instead, create a Directional Light to simulate sunlight. Angle it to illuminate from 45 degrees above. Pure white color, intensity 1.5. Hard shadows.

**What the AI does:** The scene gets bright, strong daylight.

**You:**
> Set the ambient light to skybox-based. Make the overall scene tinted slightly blue from sky reflections.

**What the AI does:** The Lighting Settings ambient light is set to Skybox, adding bluish indirect light even to shaded areas.

**You:**
> Show me a screenshot.

## Step 4: Switch to a Night Scene

Let's change the same scene to nighttime.

**You:**
> Lower the Directional Light intensity to 0.05. Change the color to dark blue. Switch the skybox to a starry night sky.

**What the AI does:** The scene instantly transforms to a nighttime atmosphere.

**You:**
> Add 2 street lamps in the scene. Place an orange Point Light at the top of each. Range 8 meters, intensity 2.

**What the AI does:** Street lamp pole objects and Point Lights are placed. Only the areas around the lamps are illuminated with warm light, creating isolated pools of light in the darkness.

**You:**
> Show me side-by-side screenshots of daytime and nighttime.

:::info Day/Night Switching
To switch between day and night in real-time during gameplay, you can control the Directional Light's rotation and color via script. For now, let's focus on understanding the difference static lighting makes.
:::

## Step 5: Bake Lightmaps

Real-time lighting is expensive. Baking (pre-computing) lighting for static objects maintains the visual quality while reducing processing load.

**You:**
> Set all non-moving objects (floor, walls, furniture) to Static.

**What the AI does:** The Static flag is set on the target objects.

**You:**
> Bake lightmaps. Quality Medium, use ProgressiveGPU lightmapper.

**What the AI does:** Lightmap baking begins. When complete, the light and shadows on static objects are burned into textures.

**You:**
> Is there a performance difference before and after baking?

**What the AI does:** Information comparing rendering load before and after baking is returned. Since static object lighting calculations are eliminated, significant improvement can be expected, especially for mobile platforms.

:::warning Baking Considerations
- Objects set to Static cannot be moved during gameplay. Do not set objects you plan to move as Static.
- Baking can take time. Large scenes may take several minutes, so save frequently.
:::

## Step 6: Finish with Post-Processing

As the final touch to lighting, add post-processing. Apply screen-wide effects to the camera to enhance the atmosphere.

### Bloom

An effect that makes bright areas appear to glow softly.

**You:**
> Add a Post Processing Volume to the camera. Enable Bloom with Intensity 0.5 and Threshold 1.0.

**What the AI does:** A glow is added around bright light areas. Street lamp Point Lights will appear to glow softly.

### Color Grading

Adjust the overall color tone of the scene.

**You:**
> Add Color Grading. Shift the color temperature slightly warm, increase contrast by 10, and reduce saturation slightly for a subdued feel.

**What the AI does:** The overall color tone is adjusted, creating a cinematic, subdued look.

### Vignette

Darkens the corners of the screen. Creates an effect that draws the eye to the center.

**You:**
> Add Vignette with Intensity 0.3.

**What the AI does:** The screen edges become slightly darker, making it easier to focus on the center of the scene.

**You:**
> Show me a screenshot after post-processing is applied.

:::tip Use Visual Feedback
Post-processing effects often involve subtle adjustments. The key is to take frequent screenshots and tweak parameters incrementally.

**You:**
> Increase the Bloom strength a little and show me another screenshot.

Repeat this cycle of adjustment and verification.
:::

## Lighting Before and After

Your scene should look dramatically different by now. Let's review the progression.

| Stage | Description |
|-------|-------------|
| No lights | Completely dark or uniformly bright |
| Key Light only | Strong shadows on one side |
| Three-point lighting | Depth and dimension emerge |
| Lightmap bake | Performance improves |
| Post-processing | Cinematic finish |

## Summary

What you learned in this tutorial:

1. **4 light types** -- Characteristics and use cases for Directional, Point, Spot, and Area lights
2. **Three-point lighting** -- Dimensional lighting with Key / Fill / Back lights
3. **Day/night switching** -- Same scene, different atmosphere through lighting alone
4. **Lightmap baking** -- Pre-computing static object lighting for better performance
5. **Post-processing** -- Cinematic finishing with Bloom, Color Grading, and Vignette

Lighting may seem subtle, but it greatly affects the overall quality of a scene. With OpenForge MCP, you can experiment simply by telling the AI "make it warmer" or "soften the shadows."
