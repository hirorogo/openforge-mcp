---
sidebar_position: 6
title: "Tips and Tricks"
---

# Tips and Tricks

A collection of techniques for getting more out of OpenForge MCP.


## Use Screenshots to Check Results

You can get visual feedback by having the AI look at the result.

```
Take a screenshot and check it
```

The AI will capture a screenshot and analyze the current state. If something looks off, you can ask for adjustments right away.

```
Take a screenshot. Make it a bit brighter overall
```


## Cross-App Workflows

You can issue a single instruction that spans both Blender and Unity.

```
Export the model from Blender as FBX and import it into Unity
```

```
Model a Cube in Blender and bring it into the Unity Assets folder
```

The AI will automatically execute the operations in multiple apps in sequence.


## Batch Operations

When you want to apply the same operation to multiple objects, you can give a single instruction.

```
Add a Rigidbody to all objects
```

```
Double the brightness of every light in the scene
```

```
Delete all objects whose name contains Enemy
```


## Recipe Feature

Recipes are pre-packaged sequences of common operations.

### View Available Recipes

```
Show me the recipe list
```

### Run a Recipe

```
Run the VRChat world basic setup recipe
```

```
Run the FPS player recipe
```

Recipes call multiple tools in order and automate complex setups.


## Working Safely

### Save Before Making Changes

It is good practice to ask the AI to save before making major changes.

```
Save first, then change all the materials
```

```
Save, then rearrange the objects
```

### Use Branches for Experiments

Combine version control with your workflow to safely try experimental changes.

```
Create an experimental branch and change all the lighting
```

If it does not work out, just switch back to the original branch.

```
Switch back to the original branch
```


## Performance Analysis

You can have the AI analyze your project's performance.

```
Analyze the performance
```

```
Tell me the polygon count and material count of the scene
```

```
Find the heavy objects
```

For VRChat avatars, you can also get performance rank checks and improvement suggestions.

```
Check the performance rank and suggest improvements
```


## AI Test Play

You can have the AI test your project.

```
Test play and look for bugs
```

```
Run the game and check if the UI displays correctly
```

```
Open all scenes in order and check for errors
```

The AI runs the game, analyzes screenshots and logs, and reports any issues.


## Combined Workflow Examples

### From Modeling to Import

```
Model a chair in Blender, unwrap the UVs, bring it into Unity as FBX,
and place it at (3, 0, 0) in the scene
```

### VRChat Avatar Finishing

```
Check the performance rank. If it is Poor, auto-optimize it,
then check the rank again
```

### Batch Scene Adjustments

```
Change all PointLight colors to warm tones, halve their intensity,
and take a screenshot to show me
```
