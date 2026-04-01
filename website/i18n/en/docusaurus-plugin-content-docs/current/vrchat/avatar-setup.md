---
sidebar_position: 3
title: "Avatar Setup"
description: "A complete guide from importing a VRM model to uploading it as a VRChat avatar"
---

# Avatar Setup

This guide covers the entire process of setting up a 3D model as a VRChat avatar. From VRM model import through viewpoint configuration, PhysBone, expressions, performance optimization, and pre-upload validation -- all done through natural language.

## Overview

| Step | Description | Main Tools |
|---|---|---|
| 1 | Import the model | Unity import / Blender pipeline |
| 2 | Configure VRChat avatar settings | `setup_vrc_avatar` |
| 3 | Set the viewpoint | `set_viewpoint` |
| 4 | Configure PhysBone | `setup_hair_physbone`, etc. |
| 5 | Set up expressions | FaceEmo tools |
| 6 | Check performance rank | `check_avatar_rank` |
| 7 | Optimize (if needed) | `auto_optimize_avatar` |
| 8 | Pre-upload validation | `validate_for_upload` |

## Step 1: Import the Model

### Importing a VRM File Directly

**You:**
> Import the VRM file "my_avatar.vrm" into Unity

**AI action:** The VRM file is imported into the Unity project and placed as a Prefab. Bone structure and materials are automatically converted.

:::info What is VRM?
VRM is a 3D avatar file format designed for VR applications. It bundles bone structure, expressions (BlendShapes), and material settings into a single file. Many avatar distribution sites provide files in VRM format.
:::

### Bringing a Model from Blender

You can use OpenForge MCP's cross-app pipeline to bring a model edited in Blender into Unity.

**You:**
> Transfer the model open in Blender to Unity. FBX format

**AI action:** The model is exported as FBX from Blender and imported into the Unity project's Assets folder. Bone structure and weight data are preserved.

**You:**
> Place the imported model in the scene

**AI action:** The model is placed in the scene.

### Post-Import Check

**You:**
> Show me the model's bone structure

**AI response example:**

```
Bone count: 142
Root bone: Hips
Main bones: Hips > Spine > Chest > Neck > Head
Left arm: LeftShoulder > LeftUpperArm > LeftLowerArm > LeftHand
Right arm: RightShoulder > RightUpperArm > RightLowerArm > RightHand
Left leg: LeftUpperLeg > LeftLowerLeg > LeftFoot > LeftToes
Right leg: RightUpperLeg > RightLowerLeg > RightFoot > RightToes
Other: Hair bones x 24, Skirt bones x 16, Accessory bones x 8
```

## Step 2: VRChat Avatar Configuration (setup_vrc_avatar)

Set up the model to be recognized as a VRChat avatar.

**You:**
> Set this model up as a VRChat avatar

**AI action:** `setup_vrc_avatar` is executed, automatically configuring the following:

- Addition of the `VRC_AvatarDescriptor` component
- Auto-detection and configuration of Humanoid bone mapping
- Setting lip sync mode to Viseme BlendShape
- Creation of a basic Expression Menu and Expression Parameters

:::tip Humanoid Bone Mapping
VRChat avatars use Unity's Humanoid rig. `setup_vrc_avatar` automatically maps bones based on their names, but manual adjustment may be needed if the bone names are non-standard.
:::

## Step 3: Viewpoint Configuration (set_viewpoint)

The viewpoint determines where the player's "eyes" are located when using the avatar in VRChat.

### Automatic Configuration

**You:**
> Set the viewpoint automatically

**AI action:** `set_viewpoint` is run in automatic mode. It uses the Head bone position as a reference to estimate eye position and places the viewpoint there.

### Manual Adjustment

If the automatic result is not quite right, you can adjust manually.

**You:**
> Move the viewpoint slightly forward. At eye height, slightly recessed

**AI action:** The viewpoint coordinates are adjusted.

**You:**
> Show me the viewpoint position in a screenshot

**AI action:** A screenshot is taken showing the viewpoint gizmo.

:::warning If the viewpoint is misplaced
If the viewpoint is off, the player will see the world from inside or above the avatar's head in VRChat. Place it between the eyes, slightly recessed, for a natural perspective.
:::

## Step 4: PhysBone Configuration

Add dynamic movement to hair, skirts, tails, and other parts.

**You:**
> Set up PhysBone on the hair. It is long hair, so make the sway gentle and flowing

**AI action:** `setup_hair_physbone` is executed, applying PhysBone components to the hair bones with a long-hair preset (heavier sway, moderate spring feel).

**You:**
> Set up PhysBone on the skirt too

**AI action:** `setup_skirt_physbone` is executed, applying PhysBone to the skirt bones.

:::info PhysBone Detail Settings
If you want to fine-tune PhysBone parameters, see the [PhysBone Setup](./physbone.md) guide.
:::

## Step 5: Expression Setup

Set up expressions using FaceEmo.

**You:**
> Show me the available BlendShapes

**AI action:** `auto_detect_blendshapes` is executed, displaying a list of BlendShapes in the model.

**You:**
> Set up the basic 8 expressions

**AI action:** `create_expression_preset` is executed, creating presets for smile, anger, sadness, surprise, and other basic expressions.

**You:**
> Assign expressions to gestures. Peace sign for smile, fist for anger, open hand for surprise

**AI action:** `add_gesture_expression` is executed, linking hand gestures to expressions.

:::info Expression Detail Settings
For detailed expression customization, see the [Expression Setup (FaceEmo)](./expressions.md) guide.
:::

## Step 6: Performance Rank Check (check_avatar_rank)

VRChat has avatar performance ranks, and heavy avatars may have their display restricted by other players.

**You:**
> Check the avatar's performance rank

**AI action:** `check_avatar_rank` is executed, displaying the current rank and detailed breakdowns.

**AI response example:**

```
Performance rank: Medium

Breakdown:
  Polygons: 48,000 (Good: under 70,000)
  Materials: 5 (Poor: exceeds the 4 or fewer threshold)
  Bones: 142 (Medium: under 150)
  PhysBone components: 6 (Medium: under 8)
  PhysBone affected bones: 64 (Medium: under 64)
  Meshes: 8 (Medium: under 16)

Primary factor lowering rank: Material count
```

## Step 7: Optimization (If Needed)

Optimize to improve the performance rank.

### Get Optimization Suggestions

**You:**
> Suggest optimizations

**AI action:** `suggest_optimizations` is executed, providing specific optimization recommendations.

**AI response example:**

```
Optimization suggestions:
1. Material merging: 5 materials can be reduced to 2
   - Merge face and body materials (create a texture atlas)
   - Merge hair and eyebrow materials
   -> Expected to improve rank to Good

2. Texture atlas: Merge 3 body textures into 1
   -> Contributes to material count reduction

3. Bone reduction: Simplify finger bones (5 fingers -> 3 fingers)
   -> Can reduce bone count by approximately 20
```

### Auto-Optimization

**You:**
> Run auto-optimization

**AI action:** `auto_optimize_avatar` is executed, automatically performing:

- Texture atlas creation and material merging
- Removal of unnecessary bones
- Mesh combining (where possible)

**You:**
> Show me a before-and-after comparison

**AI action:** `compare_before_after` is executed, displaying specs side by side.

**AI response example:**

```
              Before        After         Change
Polygons      48,000        48,000        No change
Materials     5             2             -3 (60% reduction)
Bones         142           124           -18 (13% reduction)
Meshes        8             4             -4 (50% reduction)

Rank: Medium -> Good
```

:::info Polygon Reduction via Blender
If significant polygon reduction is needed, the cross-app pipeline with Blender is effective. See [Performance Optimization](./optimization.md) for details.
:::

## Step 8: Pre-Upload Validation (validate_for_upload)

Once all settings are complete, run a final validation before uploading.

**You:**
> Run the avatar pre-upload validation

**AI action:** `validate_for_upload` is executed, checking the following:

- Is VRC_AvatarDescriptor correctly configured?
- Is the viewpoint in an appropriate position?
- Are there any Humanoid bone mapping issues?
- Are Expression Menu and Parameters configured?
- Is lip sync configured?
- Performance rank check

**AI response example:**

```
Validation result: All passed
  VRC_AvatarDescriptor: OK
  Viewpoint: OK (appropriate distance from Head bone)
  Bone mapping: OK (all required bones mapped)
  Expression Menu: OK (8 expressions configured)
  Lip sync: OK (15 Viseme BlendShapes configured)
  Performance rank: Good

Ready for upload.
```

## Avatar Setup Summary

| Process | Estimated Time | Notes |
|---|---|---|
| Model import | 1 min | Auto-conversion for VRM |
| Avatar configuration | 1 min | Mostly automatic |
| Viewpoint | 1 min | Auto-setup + fine-tuning |
| PhysBone | 3-5 min | Accelerated by presets |
| Expressions | 3-5 min | Accelerated by presets |
| Rank check and optimization | 5-10 min | Varies by situation |
| Pre-upload validation | 1 min | Automatic check |

:::tip Automate the entire process with a recipe
A recipe for basic avatar setup is also available. Just say "Run the avatar quick setup recipe" and steps 2 through 6 will be executed automatically. See [VRChat Recipes](./recipes.md) for details.
:::

## Next Steps

Once the basic avatar setup is complete, use these guides to configure each feature in more detail:

- [Outfit Swapping (Modular Avatar)](./outfit-change.md) -- Add outfits to your avatar
- [Expression Setup (FaceEmo)](./expressions.md) -- Customize expressions in detail
- [PhysBone Setup](./physbone.md) -- Fine-tune PhysBone parameters
- [Performance Optimization](./optimization.md) -- Improve performance rank
- [Upload](./upload.md) -- Steps for uploading to VRChat
