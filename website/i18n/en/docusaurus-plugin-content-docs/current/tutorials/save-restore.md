---
sidebar_position: 5
title: "Save and Restore"
description: "Learn how to save your work and revert to any previous state"
---

# Save and Restore

When building 3D scenes, you will often wish you could go back to an earlier state. With OpenForge MCP's version control feature, you can save your work state like a game save point and return to it at any time.

## Why Saving Matters

Have you ever experienced something like this?

- You changed the lighting and ruined the mood
- You moved a bunch of objects and lost track of where they were
- You wanted to experiment freely but did not want to break the current state

If you save beforehand, you have nothing to worry about. You can try things out without fear of failure.

:::info Think of it like saving in a game
It is just like saving before a boss fight in an RPG. If you save before making a big change, you can always try again if things go wrong.
:::

## Saving

The process is very simple. Just tell the AI to save.

**You:**
> Save

**AI action:** The current scene state is saved as a version.

**AI response example:** "Scene saved. Save point: 2026-04-01 15:30"

If you want a more descriptive name:

**You:**
> Save with the name "Before lighting adjustments"

**AI action:** The save is created with the label "Before lighting adjustments". Naming your saves makes them easier to find later.

:::tip When to save
Here are good times to save:
- Before making a big change
- When you finish a task
- When you think "this looks good right now"
- Before trying something experimental
:::

## Viewing Save History

You can see a list of all your save points.

**You:**
> Show me the save history

**AI response example:**

```
Save history:
1. 2026-04-01 16:00 - "Plants placement done"
2. 2026-04-01 15:30 - "Before lighting adjustments"
3. 2026-04-01 14:45 - "After adding benches"
4. 2026-04-01 14:00 - "Floor and walls complete"
```

You can see at a glance when each save was made.

## Reverting (Loading)

Restoring to a saved state is just as easy.

### Revert to the Previous Save

**You:**
> Go back to the previous save

**AI action:** The scene reverts to the most recent save point.

### Revert to a Specific Save

**You:**
> Go back to the "Before lighting adjustments" save

**AI action:** The scene reverts to the named save point.

### Revert by Number

**You:**
> Go back to the 3rd save

**AI action:** The scene reverts to the 3rd save point in the history.

:::warning Loading overwrites the current state
When you load a save, any changes made after that save point are lost. If you are unsure, save the current state first before loading.

**You:**
> Save the current state as "Experimenting", then go back to "Before lighting adjustments"

This way you can keep both states.
:::

## Practical Scenario: Mistakes Are No Problem

Let's see how this works in a real workflow.

### Scenario: Experimenting with Lighting

**You:**
> Save as "Current good state"

**AI response:** "Saved."

**You:**
> Change the directional light color to bright blue

**AI action:** The light turns blue. The entire scene takes on a cool blue tone.

**You:**
> Show me a screenshot

**You:**
> Hmm, that looks weird. Go back to the previous save

**AI action:** The light returns to its original color, and the scene is restored to "Current good state".

**You:**
> Good, it is back. This time try making the light a bit warmer

Just like that, you can experiment with confidence.

## Branches: Experiment Without Touching the Main Work

Another useful feature is "branches". A branch lets you create a separate path where you can experiment freely.

:::info What is a branch?
Think of it like a "second playthrough" in a game. Your first playthrough (main work) stays intact while you try different choices in the second playthrough (branch). If you like what you find, you can merge it back.
:::

### How to Use Branches

**You:**
> Create a branch called "Night version"

**AI action:** A new branch is created based on the current state. Changes from here on will not affect the main work.

**You:**
> Turn off the directional light and add a moonlight-style point light

**You:**
> Add warm-colored light to the windows, as if there are lights on inside

**You:**
> Show me a screenshot

All changes so far are only in the "Night version" branch.

### Switch Back to Main

**You:**
> Switch to the main branch

**AI action:** The scene returns to the main work state. None of the night version changes are present.

**You:**
> Show me a screenshot

You should be able to confirm that the original state is untouched.

### Merge a Branch into Main

If you like the night version, you can bring it into main.

**You:**
> Merge the night version into main

**AI action:** The branch changes are integrated into the main work.

## Save and Restore Best Practices

Here is a summary of recommended usage patterns.

| Action | When | Example Command |
|---|---|---|
| Save frequently | At each milestone | "Save" |
| Save with a name | Before major changes | "Save as 'Before material changes'" |
| Check history | When unsure where to revert | "Show me the save history" |
| Load | When something goes wrong | "Go back to the previous save" |
| Branch | When running big experiments | "Create a 'Test' branch" |

:::tip Do not fear failure
With save and restore, any mistake can be undone. Stop worrying about breaking things and try bold experiments. That is the real joy of working with OpenForge MCP.
:::

## Summary

What you learned in this tutorial:

- **Save** -- "Save" preserves the current state
- **History** -- "Show me the save history" lists past save points
- **Load** -- "Go back to the previous save" returns to any point in time
- **Branch** -- Lets you experiment without affecting your main work

Next, let's put these skills to use and try building a VRChat world.
