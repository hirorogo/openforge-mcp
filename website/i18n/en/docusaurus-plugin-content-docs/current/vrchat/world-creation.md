---
sidebar_position: 2
title: "World Creation"
description: "A complete guide to building a VRChat world from scratch using OpenForge MCP"
---

# World Creation

This guide walks you through building a VRChat world from scratch using OpenForge MCP. With the theme of a "seaside bar", we cover everything from terrain creation to interactive elements, lighting, and pre-upload validation -- all driven by natural language instructions.

## Overview

VRChat world creation follows these steps:

| Step | Description | Main Tools |
|---|---|---|
| 1 | Initial world setup | `setup_vrc_world` |
| 2 | Build the environment | `create_gameobject`, `set_material` |
| 3 | Configure spawn points | `add_spawn_point` |
| 4 | Place interactive elements | Mirrors, chairs, pickups, etc. |
| 5 | Lighting and atmosphere | `create_light`, `set_skybox` |
| 6 | Pre-upload validation | `validate_for_upload` |

## Step 1: Initial World Setup (setup_vrc_world)

First, set up the basic components needed for the scene to function as a VRChat world.

**You:**
> Set up the initial VRChat world configuration. The world name is "Seaside Bar"

**AI action:** `setup_vrc_world` is executed and the following are automatically created:

- A GameObject with the `VRC_SceneDescriptor` component
- A default spawn point
- A reference camera
- A basic Respawn Height setting (the height at which fallen players respawn)

:::info What is VRC_SceneDescriptor?
VRC_SceneDescriptor is the component that makes a Unity scene recognized as a VRChat world. Without this component, you cannot upload the world to VRChat. It holds the spawn point positions and world settings.
:::

## Step 2: Build the Environment

With the world skeleton in place, let's flesh out the environment.

### Terrain and Sea

**You:**
> Create a 60m x 60m Terrain. Make the south half a sandy beach and place a water surface Plane on the north side to look like the sea

**AI action:** A Terrain is generated with a sand texture applied. A semi-transparent water surface object is placed on the sea side.

**You:**
> Make the sand a cream color. The water should be a slightly greenish blue, semi-transparent

**AI action:** The sand and water materials are updated.

### The Bar Building

**You:**
> Build a bar shack near the beach facing the sea. 10m wide by 6m deep, with a palm-leaf covered roof. The front is open toward the sea. The counter is 8m wide, 1m tall, wooden

**AI action:** The bar structure is created. Roof, pillars, and counter are placed as separate GameObjects.

**You:**
> Place 5 bar stools in front of the counter. Wooden round stools, evenly spaced

**AI action:** 5 stools are placed at equal intervals.

**You:**
> Create a shelf behind the counter. Place about 10 bottle-shaped colored cylinders -- a mix of red, green, brown, and clear

**AI action:** The shelf and bottle-shaped objects are placed.

### Decorations

**You:**
> Plant 2 palm trees on each side of the bar, about 6m tall. Add 3 more scattered around the beach

**AI action:** A total of 7 palm tree-like objects are placed.

**You:**
> Place 3 beach chairs on the sand facing the sea. White and light-blue striped

**AI action:** 3 beach chairs are placed.

**You:**
> Take a screenshot from the bar counter looking out at the sea

Check the overall atmosphere here.

## Step 3: Configure Spawn Points (add_spawn_point)

Set the location where players first appear when they enter the world.

**You:**
> Set a spawn point near the beach entrance, facing toward the bar and sea

**AI action:** `add_spawn_point` is executed, placing a spawn point at the specified position and orientation.

**You:**
> Add another spawn point near the end of the bar counter

**AI action:** A second spawn point is added. When multiple spawn points exist, players appear randomly at one of them.

:::tip Spawn point placement tips
Place spawn points where the highlights of the world are visible. The first thing players see becomes their first impression of the world. Also, placing several spawn points with some spacing prevents players from overlapping when they spawn in simultaneously.
:::

## Step 4: Place Interactive Elements

The appeal of a VRChat world lies in its interactive elements that players can engage with.

### Mirror (add_vrc_mirror)

**You:**
> Mount a full-body mirror on the wall behind the bar counter. 2m wide by 2.5m tall

**AI action:** `add_vrc_mirror` is executed, placing a VRChat-compatible mirror. Players can see their avatar reflected in it.

:::info About mirror performance impact
Mirrors have a high rendering cost. When adding one to a world, limit it to one or provide players with a toggle to turn it on and off, keeping the performance impact manageable.
:::

### Sittable Chairs (add_vrc_chair)

**You:**
> Make all 5 bar stools into VRChat chairs. When sitting, players should face the sea

**AI action:** A `VRC_Station` component is added to each stool, making them sittable.

**You:**
> Make the 3 beach chairs sittable too. Use a reclined sitting pose

**AI action:** `VRC_Station` is added to the beach chairs as well. The sitting posture (animation) is configured.

### Pickupable Objects (add_vrc_pickup)

**You:**
> Place 3 glasses on the counter. Make them pickupable by players

**AI action:** `add_vrc_pickup` is executed, placing glass objects with the `VRC_Pickup` component. Players can grab and carry them.

**You:**
> Also place a beach ball on the sand. Make it pickupable. 40 cm diameter, yellow and white striped

**AI action:** A beach ball is placed as a Pickup object.

### Video Player (add_vrc_video_player)

**You:**
> Mount a video player on the bar wall. A 2m wide screen

**AI action:** `add_vrc_video_player` is executed, placing a video screen and its UI. Players can enter a URL to play videos.

### Portal (add_vrc_portal)

**You:**
> Place a portal in the corner of the beach. For traveling to another world

**AI action:** `add_vrc_portal` is executed, placing a world-travel portal.

:::warning Portal configuration
The destination world ID can be specified from the VRChat world settings page after upload. A placeholder ID is used during testing.
:::

## Step 5: Lighting and Atmosphere

Let's create the sunset atmosphere befitting a seaside bar.

### Main Light

**You:**
> Set the directional light to a sunset color. Warm orange, coming from a low angle near the horizon

**AI action:** The main light's color and angle are changed, creating a sunset feel.

### Decorative Lights

**You:**
> Run 6 string-light-style point lights under the bar roof. Warm, soft glow, not too bright

**AI action:** Warm point lights are placed along the bar roof.

**You:**
> Add 3 subtle warm point lights under the counter as indirect lighting

**AI action:** Understated lights are added beneath the counter.

### Skybox

**You:**
> Set the skybox to a sunset over the ocean. The horizon glowing red and orange, fading to purple and deep blue above

**AI action:** `set_skybox` is executed, changing the entire sky to a sunset atmosphere.

### Lightmap Baking

**You:**
> Bake the lightmaps. Make the indirect lighting feel natural

**AI action:** Lightmap baking is executed. Light information is baked into static objects, reducing the real-time rendering load.

:::tip Before baking lightmaps
Lightmap baking can take a while. It is most efficient to bake after finalizing object placement and light settings. You will need to re-bake whenever you change the layout.
:::

**You:**
> Take a screenshot from the perspective of sitting at the bar counter

Check the final atmosphere here.

## Step 6: Pre-Upload Validation (validate_for_upload)

Once everything is set up, validate the world for any issues before uploading.

**You:**
> Run the pre-upload validation for VRChat

**AI action:** `validate_for_upload` is executed, checking the following:

- Is VRC_SceneDescriptor correctly configured?
- Does a spawn point exist?
- Are there any missing colliders?
- Are lightmaps baked?
- Are there any performance concerns (draw calls, polygon count)?
- Are texture sizes appropriate?

**AI response example:**

```
Validation result: 2 warnings
- [Warning] Texture "SandTexture" is 4096x4096. 2048x2048 or smaller is recommended
- [Warning] The bar roof has no collider. This does not affect the shelter effect,
  but players will not be able to stand on the roof
No errors found. Ready for upload.
```

**You:**
> Resize the sand texture to 2048x2048

**AI action:** The texture is resized.

**You:**
> Run the validation again

**AI response example:** "Validation result: No errors, 1 warning (roof collider). Ready for upload."

## Completed World Summary

Here is the final summary of the "Seaside Bar" world:

| Element | Details |
|---|---|
| Terrain | 60m x 60m, sand beach and sea surface |
| Building | Bar shack (counter, shelf, bottles) |
| Furniture | 5 bar stools, 3 beach chairs |
| Plants | 7 palm trees |
| Mirror | 1 (behind the counter) |
| Sittable spots | 8 (5 stools + 3 chairs) |
| Pickups | 3 glasses, 1 beach ball |
| Video player | 1 |
| Portal | 1 |
| Lights | 1 directional + 9 point |
| Spawn points | 2 |

## Next Steps

Once the world is complete, continue with:

- [Upload](./upload.md) -- Steps for uploading to VRChat
- [Performance Optimization](./optimization.md) -- Improve world performance
- [VRChat Recipes](./recipes.md) -- Automate basic world configurations
