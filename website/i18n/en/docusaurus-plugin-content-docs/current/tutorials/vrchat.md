---
sidebar_position: 6
title: "Build a VRChat World"
description: "A tutorial on building a VRChat world from scratch using OpenForge MCP"
---

# Build a VRChat World

In this tutorial, you will build a VRChat world you can actually walk around in, together with an AI. The theme is a "seaside cafe terrace" -- a wooden deck terrace near a sandy beach where you can relax under parasols. Let's aim for a cozy, inviting world.

## Prerequisites

Building a VRChat world requires some preparation.

:::warning Requirements
- **Unity 2022.3.22f1** -- The version specified by VRChat. Other versions may not work correctly.
- **VRChat SDK (Software Development Kit)** -- A package that adds VRChat features to Unity. Available from the official VRChat website.
- **VRChat account** -- Required for uploading worlds.
- **OpenForge MCP setup completed**
:::

**You:**
> Create a new Unity project for VRChat. Make sure the VRChat SDK is included.

**AI action:** A Unity project with the VRChat SDK is created. The environment is ready for VRChat world creation.

## Step 1: Create the Terrain

Start with the sandy beach and ocean surface.

**You:**
> Create a Terrain. Make it 80 meters by 80 meters. The front half should be a flat sandy beach. Leave the back half at height 0 -- I'll use it as the ocean surface.

**AI action:** A Terrain object is created in Unity, with the front side forming the sandy ground.

**You:**
> Apply a bright beige sand texture to the beach. On the ocean side, lay a semi-transparent blue Plane at height 0 to look like the sea.

**AI action:** A sand texture is applied to the Terrain, and a semi-transparent blue object is placed on the far side to represent the ocean.

:::info What Is a Terrain?
A Terrain is a landscape object. It lets you deform a flat surface into mountains and valleys to create natural ground. You can also paint textures (surface patterns) onto it.
:::

**You:**
> Show me a screenshot.

## Step 2: Build the Wooden Deck

Build the cafe terrace platform on the beach.

**You:**
> Create a rectangular wooden deck near the ocean side of the beach. Make it 12 meters wide by 8 meters deep. Use a bright wood plank material, and raise it about 30 centimeters above the sand.

**AI action:** A rectangular wooden platform is created on the beach.

**You:**
> Add 8 support pillars under the deck. Use thick wooden square posts, evenly spaced.

**AI action:** Eight evenly spaced wooden support pillars are added beneath the platform.

## Step 3: Set Up Parasols and Tables

Arrange cafe-style furniture on the terrace.

**You:**
> Place 3 large beach parasols on the wooden deck. Space them evenly and make them white and navy striped.

**AI action:** Three parasols are placed on the deck, each with a pole and an open canopy shape.

**You:**
> Put a round table under each parasol. Make them 80 centimeters in diameter with a white top. Arrange 3 chairs around each table.

**AI action:** Three table-and-chair sets are placed under the parasols.

## Step 4: Build a Boardwalk

Create a walkway from the beach to the wooden deck.

**You:**
> Build a wooden boardwalk that extends about 15 meters from the terrace entrance across the sand. Make it 2 meters wide, placed directly on the sand.

**AI action:** A wooden plank walkway is created on the sand, connecting to the terrace.

**You:**
> Add low wooden poles evenly spaced along both sides of the boardwalk. Connect them with ropes.

**AI action:** Poles are added along the boardwalk with rope-like objects strung between them.

**You:**
> Take a screenshot showing the full scene.

Check the overall cafe terrace layout here.

## Step 5: Lighting -- A Sunset Scene

Since this is a seaside cafe, let's set it during sunset.

**You:**
> Set the directional light to an orange sunset color. Make it come from the direction of the ocean at a low angle, casting long shadows.

**AI action:** The main light turns orange, creating a sunset atmosphere.

**You:**
> Hang 2 small lantern-style point lights along each parasol pole. Use warm, soft light.

**AI action:** Warm-colored lights are placed near each parasol, gently illuminating the terrace.

**You:**
> Add about 4 similar lantern-style lights to the boardwalk poles. Just bright enough to see your footing.

**AI action:** Subtle lights are added along the boardwalk.

**You:**
> Hang 2 slightly brighter pendant lights above the counter area at the back of the terrace. Use them as the main lighting.

**AI action:** Pendant light objects and lights are added at the back of the terrace.

:::tip Sunset Lighting Tips
In sunset scenes, the angle and color of the directional light are key to the atmosphere. Setting the sun angle low to cast long shadows enhances the evening feel. Combining it with warm-colored lanterns and pendant lights creates a cozy space.
:::

## Step 6: Skybox -- Set Up a Sunset Ocean View

Set up the star of the world -- the sunset ocean skybox.

**You:**
> Set the skybox to a sunset ocean scene. The sun should be sinking toward the horizon with the sky gradating from orange to purple. Include a few clouds dyed red.

**AI action:** The skybox is changed to a sunset ocean sky, giving the entire scene a seaside evening atmosphere.

**You:**
> Show me a screenshot. Use the angle of someone sitting in a chair looking out at the sea.

Check the atmosphere of the sunset cafe terrace here.

## Step 7: Set Up the Spawn Point

A VRChat world needs a spawn point -- the location where players first appear when they enter the world.

**You:**
> Set the VRChat spawn point near the entrance of the boardwalk. Orient it so players see the terrace and ocean when they enter.

**AI action:** An object with a `VRCSceneDescriptor` component is placed. This becomes the player's initial position.

:::info What Is a Spawn Point?
A spawn point is where players appear. It determines where a player stands and which direction they face when entering the world. Placing it where the terrace and ocean are visible creates a strong first impression.
:::

## Optimization -- Keeping Performance Smooth

VRChat worlds are visited by many people, so optimization is important to prevent lag.

### Check Draw Calls

A draw call is a rendering command issued to draw something on screen. Too many draw calls cause lag.

**You:**
> Tell me the current draw call count for this scene.

**AI response example:** "The current draw call count is approximately 85."

:::tip Draw Call Guidelines
For VRChat worlds, aim for under 100 draw calls. Above 200, lower-spec PCs and VR headsets may experience stuttering.
:::

### Check Polygon Count

Polygons are the small triangles that make up 3D models. More polygons mean smoother shapes but heavier performance.

**You:**
> Tell me the total polygon count for the entire scene.

**AI response example:** "The total polygon count for the scene is approximately 45,000."

### Optimization Adjustments

**You:**
> Tell me if any objects have too many polygons.

**AI response example:** "Each parasol canopy has 3,000 polygons. Consider adding LOD settings or reducing the polygon count."

**You:**
> Reduce the parasol polygon count by roughly half. Keep the visual impact minimal.

**AI action:** The parasol meshes are simplified, reducing the polygon count.

:::warning Optimization Checklist
Before uploading to VRChat, verify the following:
- Draw calls are under 200
- Total polygon count is under 1 million (ideally under 500,000)
- No textures are too large (2048x2048 pixels or less per texture is recommended)
- Lightmaps (pre-computed lighting data) have been baked
:::

**You:**
> Bake the lightmaps.

**AI action:** The scene's lighting information is pre-computed, reducing runtime load. This often improves visual quality as well.

## Test in VRChat

Time to walk around in VRChat and see how it feels.

**You:**
> Build for VRChat local testing.

**AI action:** The world is built and the VRChat client launches. It loads as a test world that only you can enter.

Points to check during testing:

1. **Spawn point** -- Can you see the terrace and ocean when you enter?
2. **Boardwalk** -- Can you walk on it without issues? (Are colliders set correctly?)
3. **Wooden deck** -- Can you walk around? Do you bump into tables and chairs?
4. **Lighting** -- Is it too dark or too bright?
5. **Sunset ocean** -- Does it look nice when sitting in a chair?
6. **Performance** -- Is there any stuttering?

**You:**
> I tested it, but I fall through the boardwalk midway. Check the colliders.

**AI action:** The boardwalk colliders (hit detection) are checked and fixed to prevent falling through.

:::info What Are Colliders?
Colliders are hit detection boundaries. Without them, players will pass through objects. Floors, walls, boardwalks, and anything players touch need colliders.
:::

## Finishing Touches and Upload

If testing reveals no issues, upload to VRChat.

**You:**
> Save with the name "Final version before upload".

**You:**
> Upload the world to VRChat. Set the world name to "Seaside Cafe Terrace" and the description to "Relax on the terrace while enjoying the sunset over the ocean".

**AI action:** The world is uploaded to VRChat servers. Once the upload completes, the world becomes accessible within VRChat.

## Summary

What you learned in this tutorial:

- **Terrain creation** -- Built a sandy beach and ocean surface with Terrain
- **Structure placement** -- Set up a wooden deck, parasols and tables, and a boardwalk
- **Sunset lighting** -- Created a warm atmosphere with sunset light and lanterns
- **Skybox configuration** -- Expressed a sunset ocean sky
- **VRChat-specific settings** -- Configured spawn points and colliders
- **Optimization** -- Adjusted draw calls and polygon counts
- **Testing and upload** -- Verified in VRChat and uploaded

Everything was accomplished through conversation with the AI alone. Congratulations on taking the first step toward creating your own VRChat world.
