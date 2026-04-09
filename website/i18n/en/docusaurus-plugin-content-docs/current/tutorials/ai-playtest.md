---
sidebar_position: 9
title: "Let AI Playtest Your Scene"
description: "Use the AI playtest feature to automatically find and fix bugs in your scene"
---

# Let AI Playtest Your Scene

OpenForge MCP includes an "AI Playtest" feature that lets AI automatically play through your scene and discover bugs and issues. Instead of playing it yourself, the AI tests on your behalf and delivers a report.

## What Is AI Playtest?

AI Playtest automatically performs the following:

1. **Scene playback** -- Enters Unity's play mode
2. **Visual inspection** -- Takes screenshots and analyzes the visuals
3. **Interaction testing** -- Verifies object collisions and script behavior
4. **Report generation** -- Produces a report summarizing discovered issues and improvement suggestions

It can catch problems that are easy to miss during manual testing.

:::info Supported Applications
AI Playtest is currently available for Unity. Rendering result verification is possible in Blender and Godot as well, but interactive playtesting targets Unity.
:::

## Prerequisites

- Unity is running and connected to OpenForge MCP
- The scene to test is open

## Step 1: Prepare a Test Scene

First, create a simple scene with intentional bugs to see AI Playtest in action.

**You:**
> Create a new scene. Place the following objects:
> - Ground (Plane, 50x50 meters)
> - Player character (Capsule with Rigidbody) at the origin
> - Goal object (yellow cube) at coordinates (10, 0.5, 10)
> - 3 walls (elongated boxes) arranged like a maze

**What happens:** A simple maze-like scene is constructed.

### Introduce Intentional Bugs

For learning purposes, let's intentionally introduce some problems.

**You:**
> Make the following changes:
> - Disable the collider on one of the walls (pass-through bug)
> - Move the goal object below the ground (Y coordinate to -2) (unreachable bug)
> - Set the player's Rigidbody Mass to 0.001 (abnormal physics behavior)

**What happens:** Three intentional bugs are now present in the scene.

## Step 2: Run the AI Playtest

Once everything is ready, run the playtest.

**You:**
> AI playtest this scene. Check the following items:
> - Can the player stand correctly on the ground?
> - Do all walls have collision detection?
> - Is the goal object reachable?
> - Does physics behave naturally?

**What happens:** The AI proceeds through the following steps:

1. Plays the scene
2. Checks the player object's state
3. Tests interactions with walls
4. Analyzes reachability to the goal
5. Checks physics behavior
6. Takes multiple screenshots

## Step 3: Read the Report

When testing completes, the AI returns a report.

Report example:

```
AI Playtest Report
========================

Test items: 4
Issues found: 3

[Issue 1] Collider Disabled -- Severity: High
  Wall object "Wall_02" has its Box Collider disabled.
  The player can pass through this wall.
  Recommendation: Enable Wall_02's Box Collider.

[Issue 2] Unreachable Object -- Severity: High
  Goal object "Goal" has a Y coordinate of -2, buried below the ground.
  It is neither visible nor reachable by the player.
  Recommendation: Change Goal's Y coordinate to 0.5 or higher.

[Issue 3] Abnormal Physics Behavior -- Severity: Medium
  Player Rigidbody Mass is 0.001, which is extremely light.
  The player may be sent flying by minor collisions.
  Recommendation: Change Mass to around 1.0.

[OK] Ground Placement
  The player stands correctly on the ground. No issues.
```

:::tip Reading the Report
The report includes severity ratings. "High" issues should definitely be fixed, "Medium" issues are recommended fixes, and "Low" issues are minor observations. Start by addressing "High" severity items.
:::

## Step 4: Fix the Issues

Based on the report, fix the problems. You can ask the AI to fix them directly.

**You:**
> Fix all the issues from the playtest report.

**What happens:** The AI automatically performs the following fixes based on the report:

1. Enables Wall_02's Box Collider
2. Changes Goal's Y coordinate to 0.5
3. Changes the player's Rigidbody Mass to 1.0

### Fixing Issues One at a Time

You can also fix items individually instead of all at once.

**You:**
> Fix just the Wall_02 collider. Leave the rest as-is.

**What happens:** Only the specified issue is fixed. This is useful when you want to verify changes step by step.

## Step 5: Re-test

After fixes are complete, run the playtest again to confirm the issues are resolved.

**You:**
> Run the AI playtest again. Check the same items as before.

**What happens:** The test runs again and returns a new report.

```
AI Playtest Report
========================

Test items: 4
Issues found: 0

[OK] Collider Check
  All walls have valid Colliders enabled. No issues.

[OK] Goal Reachability
  The goal object is above the ground and reachable. No issues.

[OK] Physics Behavior
  Player Mass is 1.0, showing natural behavior. No issues.

[OK] Ground Placement
  The player stands correctly on the ground. No issues.
```

All issues have been confirmed resolved.

## Customizing the Playtest

### Specifying Custom Check Items

You can freely specify what the playtest should check.

**You:**
> Run an AI playtest. Focus on the following:
> - Are all UI buttons clickable?
> - Does any text extend beyond the screen?
> - Does audio play correctly?

### Increasing Screenshot Count

**You:**
> During the playtest, take a screenshot every second. About 10 total.

**What happens:** Multiple screenshots are captured during the test, letting you track state changes over time.

### Testing Specific Scenarios

**You:**
> During the playtest, test a scenario where the player takes the shortest path from start to goal.

**What happens:** The AI calculates the path and runs the test based on that scenario.

## Common Playtest Use Cases

| Scenario | Example Check Items |
|----------|-------------------|
| Action game | Collision detection, fall detection, damage processing |
| UI design | Button placement, text readability, screen size adaptation |
| Physics puzzle | Object behavior, solution existence, deadlock states |
| World building | Wall clipping, traversable area, performance |

:::warning Playtest Limitations
AI Playtest is not a silver bullet. It struggles with complex game logic and judging human "fun factor." Use it as a tool to assist in finding technical issues. Final quality judgment should be done with your own eyes.
:::

## Summary

What you learned in this tutorial:

- Overview and mechanics of AI Playtest
- Preparing a test scene
- Running the playtest and reading reports
- Fixing issues based on the report
- Re-testing to verify fixes
- Customizing check items

Incorporating AI Playtest into your development workflow enables earlier bug detection and reduces rework. Building a habit of running playtests whenever you modify a scene makes it easier to maintain quality.
