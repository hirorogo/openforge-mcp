---
sidebar_position: 12
title: "Building Terrain and Expanding Your World"
description: "Use Unity's Terrain feature to build a vast world with coastal cliffs and a desert oasis"
---

# Building Terrain and Expanding Your World

So far we have been working in indoor and confined spaces, but you can also create vast outdoor worlds. This tutorial uses Unity's Terrain feature to build a world with coastal cliffs and a desert oasis, all through conversation with the AI.

## Prerequisites

- Unity is running and connected to OpenForge MCP
- You have an empty scene

## Vision

Rugged cliffs face the ocean; looking down from the clifftop reveals the shoreline below. Heading inland from the cliffs, dry sandy ground stretches out, eventually leading to a small oasis. A few palm trees stand around it, and clear water reflects the sky -- that is the world we are aiming for.

## Step 1: Create a Terrain

Start by creating the Terrain object.

**You:**
> Create a new Terrain. Size 500 meters x 500 meters. Maximum height 100 meters.

**What the AI does:** A Terrain object is created. Initially it appears as a flat, expansive green surface.

## Step 2: Shape the Terrain with Heightmaps

Use heightmaps to create the terrain's elevation.

### Create the Cliffs

**You:**
> Create cliffs on the west side of the terrain. About 60 meters high with steep, near-vertical faces toward the ocean. Keep the clifftop flat.

**What the AI does:** A heightmap is applied to the west edge of the terrain, forming steep cliffs.

**You:**
> Add some bumps to the cliff surface so it looks like natural rock. Do not make it a perfectly flat wall.

**What the AI does:** Fine irregularities are added to the cliff face, creating a more natural cliff appearance.

### Create Hills and Valleys

**You:**
> Create 2 gentle hills in the center of the terrain. Heights of 15 meters and 10 meters with smooth, gradual curves.

**What the AI does:** Two gentle hills are generated.

**You:**
> Create a shallow valley between the hills. A low depression to place the oasis in.

**What the AI does:** A basin-shaped depression forms between the hills. This is where the oasis water will be placed.

### Create the Desert Area

**You:**
> On the east side of the terrain, create about 3 gentle sand dune undulations. Low rolling waves about 5 meters high.

**What the AI does:** Gentle, wave-like dune terrain is created on the eastern side.

**You:**
> Show me a screenshot of the whole terrain from above.

:::tip Heightmap Tips
When creating terrain, start with the broad shapes before adding detail. Trying to add fine bumps too early tends to throw off the overall balance.
:::

## Step 3: Paint Textures

With the terrain shape done, paint textures on the surface.

### Rock Texture

**You:**
> Paint rock texture on the cliff areas. A gray, hard rock face texture with 5-meter tiling.

**What the AI does:** Rock texture is applied to the cliff sections using the terrain paint feature.

### Grass Texture

**You:**
> Paint grass texture on the flat clifftop and hill slopes. A slightly faded green, like grass in an arid climate.

**What the AI does:** Grass texture is applied to the hilly areas.

### Sand Texture

**You:**
> Paint sand texture on the eastern dune area and around the oasis. Light beige sand.

**What the AI does:** Sand texture is applied, giving the area a desert appearance.

### Blend Texture Boundaries

**You:**
> Blend the boundaries between grass and sand textures naturally. Instead of a sharp divide, make it a gradual transition.

**What the AI does:** Texture boundaries are smoothly blended, creating a natural ground transition.

**You:**
> Show me a screenshot of the textured terrain.

:::info About Terrain Layers
Terrain supports multiple stacked texture layers. By painting the opacity of each layer with a brush, you can create natural transitions from rock to grass to sand.
:::

## Step 4: Add Trees and Vegetation

### Oasis Palm Trees

**You:**
> Plant about 8 palm trees around the oasis depression. Scatter them randomly with varying heights.

**What the AI does:** Palm trees are placed using the Terrain Tree Paint feature. Position and height vary randomly for a natural look.

### Clifftop Shrubs

**You:**
> Scatter low shrubs on the flat area atop the cliffs. Sparse density, fitting an arid environment.

**What the AI does:** Low shrubs are sparsely placed on the clifftop.

### Grass Detail

**You:**
> Add 3D grass detail on top of the grass texture in the hilly area. Make it sway in the wind.

**What the AI does:** Grass meshes are added using the Terrain Detail feature. Wind settings are applied so the grass gently sways.

:::tip Vegetation Density and Performance
Adding too many trees and details impacts performance. Start with fewer and add more if there is headroom.

**You:**
> What is the current FPS?
:::

## Step 5: Create Water Surfaces

Add water to the oasis and the ocean.

### Oasis Water

**You:**
> Place a Water Plane in the oasis depression. Match the height to the low point of the terrain. Make the water a clear emerald green.

**What the AI does:** A water surface object is placed in the depression. With the terrain shaping, water appears to fill only the low area.

### Ocean

**You:**
> Place a large Water Plane on the west side of the terrain, below the cliffs. Position it so the lower half of the cliff is submerged. Deep blue water color.

**What the AI does:** A vast ocean surface is added below the cliffs. Looking down from the clifftop reveals the sea far below.

**You:**
> Add wave motion to the water surfaces. Large waves for the ocean, gentle waves for the oasis.

**What the AI does:** Water shader wave parameters are adjusted for each surface.

## Step 6: Set the Skybox

Configure the sky as the world's backdrop.

**You:**
> Set the skybox to a clear daytime sky. Some clouds floating, slightly whitish near the horizon.

**What the AI does:** The skybox is set to clear sky, with blue sky stretching above the world.

**You:**
> Align the Directional Light direction with the sun position. Afternoon sun so the western cliffs cast long shadows.

**What the AI does:** The sunlight angle is adjusted, casting long shadows from the cliffs.

## Step 7: Set Up Fog and Atmosphere

Add fog to make distant scenery haze, creating a sense of atmosphere.

**You:**
> Enable linear fog. Color: light blue. Start distance: 100 meters. End distance: 400 meters.

**What the AI does:** Distant objects fade into a light blue fog. This adds a sense of atmospheric depth and makes the world feel expansive.

**You:**
> Show me a screenshot from the clifftop looking down at the ocean.

**You:**
> Show me a screenshot from the oasis waterside at eye level.

:::tip Fog Effects
Fog does more than just hide distant objects -- it is an important tool for conveying spatial depth. Using warm-colored fog in the desert area can suggest heat haze.

**You:**
> Can the fog color be changed to a light orange just for the desert area?

Try asking the AI about adjustments like these.
:::

## Step 8: Final Adjustments

Look at the whole picture and adjust anything that needs work.

**You:**
> Show me an aerial overview screenshot of the entire terrain.

**You:**
> The cliff face looks too smooth. Make the rock bumps more pronounced.

**You:**
> The oasis palm trees are too clustered. Spread them out more.

**You:**
> The sand dune undulations should be bigger. Increase the height by 1.5x.

Keep iterating with the AI to refine the result.

## Summary

What you learned in this tutorial:

1. **Terrain creation** -- Created the base for a large landscape
2. **Heightmaps** -- Added elevation with cliffs, hills, and sand dunes
3. **Texture painting** -- Painted rock, grass, and sand surfaces
4. **Vegetation** -- Added palm trees, shrubs, and grass detail
5. **Water surfaces** -- Placed oasis and ocean water
6. **Skybox** -- Set up a clear sky backdrop
7. **Fog and atmosphere** -- Added depth and a sense of airiness

With terrain, you can create vast worlds at a completely different scale from indoor scenes. Just tell the AI "make it steeper" or "make it more gradual" to shape the landscape as you wish.
