---
sidebar_position: 15
title: "Mastering Version Control"
description: "Leverage branches, merges, diffs, and more with OpenForge MCP's version control features"
---

# Mastering Version Control

In the [Save and Restore](./save-restore.md) tutorial, you learned the basics of saving and restoring. Here we go one step further -- using branches for experimentation, merging, viewing detailed history, and comparing diffs to get the most out of version control.

## Prerequisites

- OpenForge MCP is connected
- You understand the content from [Save and Restore](./save-restore.md)
- You have a project in progress

## Why Branches Are Useful

When you want to make major changes to a scene, you might worry about whether you can undo things if they go wrong. You could revert to a save point, but there is a smarter way -- branches.

With branches, you can create a separate path for experimentation while keeping your current state intact. If the experiment works out, merge it into the main line. If it does not, discard it. The main line is never affected.

## Step 1: Check the Current State

Start by understanding where you are.

**You:**
> Show me the current version control status. Include which branch I'm on and the recent history.

**AI action:** The current branch name (usually "main") and recent save history are displayed.

```
Current branch: main
Recent history:
  3. Adjusted lighting
  2. Placed furniture
  1. Created room walls and floor
```

## Step 2: Create an Experimental Branch

You want to make bold lighting changes but also keep the current state. This is when you create a branch.

**You:**
> Create a new branch called "lighting-experiment". Branch off from the current state.

**AI action:** The "lighting-experiment" branch is created and you are switched to it. The main branch state remains unchanged.

**You:**
> Change all lights to red. Add 10 Point Lights to the walls with an intensity of 3.

**AI action:** Bold lighting changes are applied. The main branch is unaffected.

**You:**
> Save this state with the message "Red lighting experiment".

**AI action:** The save is recorded on the lighting-experiment branch.

## Step 3: Switch Branches

After reviewing the experiment results, go back to the original state.

**You:**
> Switch to the main branch.

**AI action:** The scene reverts to the last saved state on the main branch. The red lighting is gone, and you should be back to the original state.

**You:**
> Show me a screenshot. I want to verify the original state is restored.

**You:**
> Switch back to the lighting-experiment branch.

**AI action:** The red lighting state is restored.

:::tip You Can Create as Many Branches as You Need
By creating branches like "lighting-experiment", "layout-v2", and "sound-test", you can try multiple directions in parallel.

**You:**
> Show me a list of all existing branches.
:::

## Step 4: Create Another Experimental Branch

Switch back to main and start a different experiment.

**You:**
> Switch to the main branch.

**You:**
> Create a new branch called "layout-rearrange".

**You:**
> Move all furniture to the walls. Clear the center of the room.

**You:**
> Save this state with the message "Moved furniture to walls".

Now you have three branches:

- **main** -- The original state
- **lighting-experiment** -- The red lighting experiment
- **layout-rearrange** -- The furniture rearrangement

## Step 5: Compare Diffs Between Saves

Check the differences between branches.

**You:**
> Show me the diff between the main branch and the layout-rearrange branch. List what changed.

**AI action:** A list of modified objects is displayed.

```
Modified objects:
  - Sofa: position changed from (3, 0, 2) to (0.5, 0, 4)
  - Table: position changed from (0, 0, 0) to (4.5, 0, 0)
  - Bookshelf: position changed from (2, 0, 3) to (0.5, 0, 2)
  Added: none
  Deleted: none
```

**You:**
> Show me the diff between the lighting-experiment branch and the main branch too.

**AI action:** Information about light colors and added Point Lights is displayed.

:::info When Diffs Are Useful
Diffs help you understand exactly what changed. They are especially handy when you resume work after a break and need to recall what you did last time.
:::

## Step 6: Merge Branches

You like the furniture layout from layout-rearrange, so merge it into main.

**You:**
> Switch to the main branch.

**You:**
> Merge the changes from the layout-rearrange branch into main.

**AI action:** The furniture rearrangement from layout-rearrange is incorporated into the main branch.

**You:**
> Show me a screenshot of the merge result.

### Merge Conflicts

If both branches modified the same object differently, a conflict may occur.

**You:**
> Merge the lighting-experiment branch into main too.

**AI action:** If there are no conflicts, the merge completes directly. If there are conflicts, the AI reports the conflict details.

```
Conflict detected:
  - PointLight_1: deleted in main, color changed in lighting-experiment
  Which version would you like to keep?
```

**You:**
> Keep the lighting-experiment changes.

**AI action:** The conflict is resolved and the merge completes.

:::warning Save Before Merging
Merges can involve significant changes. If you save the current state before merging, you can revert if you are unhappy with the result.
:::

## Step 7: View Detailed History

Inspect the project's change history in detail.

**You:**
> Show me the full history of the main branch. Include what changed in each save.

**AI action:** All save points are displayed in chronological order with a summary of changes for each.

```
main branch history:
  5. [Merge] Merged layout-rearrange
     - Changed furniture positions (3 objects)
  4. [Merge] Merged lighting-experiment
     - Changed light colors and count (12 objects)
  3. Adjusted lighting
     - Changed Directional Light angle
  2. Placed furniture
     - Added Sofa, Table, Bookshelf
  1. Created room walls and floor
     - Added Floor, Wall_N, Wall_E, Wall_S, Wall_W
```

**You:**
> Show me a screenshot from the state at save point 2.

**AI action:** The state at history point 2 is temporarily restored and a screenshot is captured.

## Step 8: Clean Up Unnecessary Branches

Delete branches that have already been merged.

**You:**
> Delete the merged branches lighting-experiment and layout-rearrange.

**AI action:** Both branches are deleted. The merged changes remain in the main branch, so nothing is lost.

## Best Practices for Team Projects

When multiple people are working on a project, version control becomes even more important.

### Task Assignment and Branches

Assign separate branches to each team member.

- **Member A:** Works on lighting in the "feature/lighting" branch
- **Member B:** Arranges furniture in the "feature/furniture" branch
- **Member C:** Configures sound in the "feature/sound" branch

Once each task is complete, merge them into main one at a time.

### Save Message Conventions

When working in a team, standardizing save message formats makes the history easier to read.

:::tip Recommended Save Message Format
```
[Category] Summary of changes

Examples:
[Lighting] Changed indoor Point Lights to warm colors
[Layout] Added second-floor bookshelf
[Sound] Fixed BGM loop settings
[Fix] Filled gap in wall
```
:::

### Merge Order

Merge branches with larger changes first to reduce the chance of conflicts. Save branches with minor adjustments for later.

## Summary

What you learned in this tutorial:

1. **Branches** -- Create experimental forks to try things safely
2. **Branch switching** -- Move between different states instantly
3. **Diff comparison** -- Check what changed between branches or saves
4. **Merging** -- Incorporate branch changes into the main line
5. **Conflict resolution** -- Reconcile different changes to the same object
6. **Detailed history** -- Review all changes in the project
7. **Team workflow best practices** -- Branch assignment and save message conventions

Version control may seem mundane, but it becomes increasingly powerful as your project grows. When you know you can always recover from mistakes, you gain the confidence to experiment boldly.
