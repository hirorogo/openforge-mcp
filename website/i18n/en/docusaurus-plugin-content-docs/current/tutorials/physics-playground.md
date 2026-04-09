---
sidebar_position: 7
title: "Physics Playground"
description: "Build an interactive physics playground in Unity"
---

# Physics Playground

This tutorial uses Unity's physics engine to build a playground where you can stack, smash, and roll things around. Just by talking to the AI, you can stack Rigidbody crates, launch balls to knock them down, and roll objects down slopes.

## Prerequisites

- Unity is running and connected to OpenForge MCP
- You have an empty scene (a new scene is fine)

## Step 1: Create the Ground

First, prepare a ground so physics objects do not fall into the void.

**You:**
> Create a large plane in the scene to serve as the ground. About 50x50 meters, colored gray.

**What happens:** A Plane object is placed at the origin. It has a Collider, so anything placed on top will rest on it.

## Step 2: Create a Wooden Crate

Next, create a crate that responds to physics.

**You:**
> Create a brown cube, 1x1x1 meter in size, with a Rigidbody component. Name it "WoodenCrate".

**What happens:** A cube with Rigidbody is created. When you press play, it will fall to the ground under gravity.

:::info What Is Rigidbody?
Rigidbody is Unity's physics simulation component. Objects with Rigidbody are affected by gravity and collide with other objects. Without it, objects remain fixed in the air.
:::

### Mass-Produce Crates

One crate is not much fun, so let's make many.

**You:**
> Duplicate WoodenCrate to make 12 total. Stack them in a pyramid on the ground. Bottom row: 4 across, then 3, 2, and 1 on top.

**What happens:** 12 crates are arranged in a pyramid. Since the scene is not playing yet, they remain stacked in place.

:::tip Placement Tips
When stacking crates, telling the AI "leave a small gap" prevents objects from overlapping. In physics simulations, overlapping objects can fly apart in unexpected directions.
:::

## Step 3: Create a Ball Launcher

Build a ball launcher to knock down the stacked crates.

**You:**
> Create a red sphere named "Cannonball". Diameter 0.5 meters, with Rigidbody. Place it 10 meters away from the crate pyramid.

**What happens:** A red sphere is placed in front of the pyramid.

### Add a Launch Script

Attach a script to apply force and launch the ball.

**You:**
> Add a new C# script to Cannonball. Name it "BallLauncher". In the Start method, apply force toward the pyramid using ForceMode.Impulse. Force magnitude: 20.

**What happens:** The AI generates a C# script and attaches it to Cannonball. When you play, the ball flies toward the pyramid.

### Play and Verify

**You:**
> Play the scene and take a screenshot.

**What happens:** Unity enters play mode. The ball flies and crashes into the crate pyramid, and a screenshot of the destruction is returned.

:::warning Save Before Playing
Physics tests scatter objects everywhere. They return to position when you stop playing, but saving the scene first gives peace of mind.

**You:**
> Save the scene.
:::

## Step 4: Create a Slope

Next, add a slope and roll some balls down it.

**You:**
> Create a slope on the ground. A board 3 meters wide and 8 meters long, tilted at 30 degrees. Color it green. No Rigidbody -- just a static collider.

**What happens:** A tilted green board is placed. This serves as the slope.

### Place Objects on the Slope

**You:**
> Place 5 yellow spheres at the top of the slope, each 0.3 meters in diameter. Give each one a Rigidbody.

**What happens:** 5 yellow spheres are placed at the top edge of the slope.

**You:**
> Play the scene and take a screenshot after 0.5 seconds.

**What happens:** When playing, the yellow spheres roll down the slope. Due to gravity and friction, each one moves slightly differently, which is fun to watch.

## Step 5: Change Behavior with Physics Materials

Physics Materials let you modify friction and bounce properties.

**You:**
> Create a Physics Material called "BouncyMaterial". Set Bounciness to 0.8. Apply it to Cannonball's collider.

**What happens:** The ball now bounces. When playing, you can see it bounce after hitting the crates.

**You:**
> Create a Physics Material called "IcyMaterial". Set Dynamic Friction to 0.01 and Static Friction to 0.01. Apply it to the slope.

**What happens:** The slope becomes slippery, and the spheres slide down with almost no friction.

## Step 6: Verify Physics with AI Playtest

Once the scene is complete, use the AI Playtest feature to verify physics behavior.

**You:**
> AI playtest this scene. Check the following:
> - Does the crate pyramid collapse?
> - Does the ball fly in the correct direction?
> - Do the slope spheres roll?
> - Do objects not fall through the ground?

**What happens:** The AI automatically plays the scene and checks the specified items. Any problems are reported.

:::info AI Playtest Details
For a detailed guide on the AI Playtest feature, see the [Let AI Playtest Your Scene](./ai-playtest.md) tutorial.
:::

## Further Ideas

Using the basics covered here, try expanding the playground:

- **Dominoes:** Line up thin boxes at regular intervals and topple the first one
- **Rube Goldberg machine:** Combine slopes, seesaws, and spinning bars to create chain-reaction devices
- **Target practice:** Place targets at various positions and aim balls at them
- **Weight comparison:** Keep the same size but change Rigidbody Mass to observe how collision behavior differs

## Summary

What you learned in this tutorial:

- Creating physics objects with Rigidbody
- Stacking and arranging objects
- Launching balls with a script
- Creating slopes and rolling objects
- Customizing behavior with Physics Materials
- Verifying physics with AI Playtest

Physics simulation is easy to experiment with through AI instructions. Feel free to try "what if I do this?" and experience how the physics engine behaves.
