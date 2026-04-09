---
sidebar_position: 4
title: "Outfit Switching (Modular Avatar)"
description: "A guide to avatar outfit switching using Modular Avatar"
---

# Outfit Switching (Modular Avatar)

This guide explains how to add outfits to avatars using Modular Avatar. It covers everything from automatic setup with a single command to fine-tuned manual adjustments.

## What Is Modular Avatar

Modular Avatar (MA) is a tool for non-destructively adding outfits and accessories to VRChat avatars. "Non-destructive" means you can add and remove outfits without modifying the original avatar data.

Benefits of using Modular Avatar:

- **No risk to the original avatar**: Outfits can be safely added and removed
- **Manage multiple outfits**: Register and switch between multiple outfits on a single avatar
- **Automatic bone merging**: Automatically aligns outfit bones with avatar bones
- **Merged at upload time**: Kept separate in Unity, automatically merged when uploading

## Installing Modular Avatar

### Via VRChat Creator Companion (VCC)

**You:**
> Install Modular Avatar.

**AI action:** The Modular Avatar package is added to the project from the VCC repository.

:::info If the Repository Is Not Registered in VCC
You need to add the Modular Avatar repository to VCC from the official Modular Avatar website. Tell the AI "Add the Modular Avatar VCC repository" for instructions.
:::

### Manual Installation

**You:**
> Import the Modular Avatar unitypackage.

**AI action:** The specified package file is imported into the Unity project.

## Automatic Setup: auto_setup_outfit

The simplest approach is to use `auto_setup_outfit`.

**You:**
> Automatically set up this outfit on the avatar.

**AI action:** `auto_setup_outfit` runs, performing the following automatically:

1. Place the outfit Prefab as a child of the avatar
2. Add the MA Merge Armature component (bone merge settings)
3. Auto-detect where the avatar body mesh and outfit overlap
4. Set parts of the body mesh to hidden as needed
5. Configure BlendShape sync (if body shape keys exist)

**AI response example:**

```
Outfit setup complete:
  Outfit name: SummerDress
  MA Merge Armature: Configured
  Bone merging: 68 bones auto-mapped
  Body mesh: Torso, arms, and legs partially hidden
  BlendShape sync: 3 body shape keys synced
```

**You:**
> Show me screenshots. Front and side views.

Check the outfit result here.

:::tip If Automatic Setup Has Issues
If the automatic setup fails to match bones correctly (outfit shifts from the body, some parts do not follow properly, etc.), you can fix it with the manual settings described below.
:::

## Manual Setup

For cases where automatic setup is not sufficient, or when fine-grained control is needed, use the individual tools.

### Adding MA Merge Armature

MA Merge Armature is a component that merges outfit bones with avatar bones.

**You:**
> Add MA Merge Armature to the outfit. Set the target to the avatar's Armature.

**AI action:** `add_ma_merge_armature` runs, adding an MA Merge Armature component to the outfit's root object. The outfit's bone hierarchy is mapped to the avatar's bone hierarchy.

:::info How MA Merge Armature Works
MA Merge Armature compares bone names between the outfit and avatar to automatically create mappings. For example, the outfit's "LeftUpperArm" bone is merged with the avatar's "LeftUpperArm" bone. If bone names differ, you need to specify the mapping manually.
:::

### Adding MA Bone Proxy

For objects you want to attach directly to a specific bone (such as accessories), use MA Bone Proxy.

**You:**
> Make this hair accessory follow the Head bone. Use MA Bone Proxy.

**AI action:** `add_ma_bone_proxy` runs, adding an MA Bone Proxy component to the hair accessory's GameObject. The Head bone is set as the target.

**You:**
> Adjust the position slightly. Move it to the right side of the head, above the ear.

**AI action:** The accessory's Transform (position data) is adjusted.

## ON/OFF Toggle Setup (add_ma_toggle)

Enable toggling outfit visibility from the Expression Menu.

**You:**
> Create an ON/OFF toggle for this outfit. Add it to the Expression Menu as "Summer Dress".

**AI action:** `add_ma_toggle` runs, configuring the following:

- ON/OFF animation for the outfit's GameObject
- A "Summer Dress" toggle item in the Expression Menu
- A boolean parameter in Expression Parameters

This allows toggling the outfit's visibility from the Expression Menu in VRChat.

**You:**
> When the outfit is OFF, make the body mesh visible again.

**AI action:** Body mesh visibility toggling is added to the toggle animation. When the outfit is OFF, the body mesh is shown; when ON, parts of the body mesh are hidden.

## BlendShape Sync (add_ma_blendshape_sync)

Sync body shape BlendShapes (e.g., chest size, body width) from the avatar to the outfit.

**You:**
> Sync the avatar's body shape BlendShapes to the outfit.

**AI action:** `add_ma_blendshape_sync` runs, syncing the avatar's body shape BlendShapes with the corresponding outfit BlendShapes.

**AI response example:**

```
BlendShape sync settings:
  Breast_Size: Avatar -> Outfit (synced)
  Body_Thin: Avatar -> Outfit (synced)
  Hip_Size: Avatar -> Outfit (synced)
  No matching outfit BlendShape for: Muscle (skipped)
```

:::warning BlendShape Name Mismatches
If the avatar and outfit use different BlendShape names, automatic sync may be skipped. In that case, specify the mapping manually.

```
"Sync the avatar's Breast_Size to the outfit's Bust_Size"
```
:::

## Managing Multiple Outfits

Register multiple outfits on a single avatar and switch between them.

**You:**
> Add another outfit. Set it up as "Winter Coat" using auto_setup_outfit.

**AI action:** A second outfit is added and automatic setup runs.

**You:**
> Make Summer Dress and Winter Coat switch exclusively. Create an "Outfits" submenu in the Expression Menu where they can be selected.

**AI action:** An "Outfits" submenu is created in the Expression Menu, with "Summer Dress" and "Winter Coat" set as exclusive toggles (enabling one disables the other).

**You:**
> Add a "Base Body" option too. Allow both outfits to be turned off.

**AI action:** A "Base Body" option is added.

Final Expression Menu structure:

```
Expression Menu
  └─ Outfits
       ├─ Base Body
       ├─ Summer Dress
       └─ Winter Coat
```

## Troubleshooting

### Outfit Clips Through the Body

**You:**
> The outfit clips through the body around the chest area. Fix it.

**AI action:** The overlap between outfit and body mesh is re-detected, and the body mesh hiding settings are adjusted.

Causes and solutions:

| Symptom | Cause | Solution |
|---|---|---|
| Body visible through outfit | Body mesh hidden area too small | Expand the hidden area |
| Outfit clips into body | Outfit mesh too close to body | Fine-tune outfit position |
| Clips during movement | PhysBone settings missing | Add PhysBone colliders |

### Bone Mapping Misalignment

**You:**
> The outfit's right arm bends in a wrong direction.

**AI action:** The MA Merge Armature bone mapping is checked and incorrect mappings are corrected.

Common causes:

- The outfit uses different bone naming conventions from the avatar
- The outfit's bone hierarchy has a different structure from the avatar
- The local coordinate systems of bones differ

**You:**
> Manually map the outfit's "arm_R" bone to the avatar's "RightUpperArm".

**AI action:** The MA Merge Armature mapping is manually updated.

### Expression Parameters Running Low

VRChat Expression Parameters have a memory limit of 256 bits.

**You:**
> Check the Expression Parameters usage.

**AI response example:**

```
Expression Parameters usage: 184 / 256 bits
  Summer Dress toggle: 1 bit (bool)
  Winter Coat toggle: 1 bit (bool)
  Expression parameter: 8 bits (int)
  Other: 174 bits
Remaining: 72 bits
```

:::warning Parameter Limits
Each outfit or expression toggle you add consumes Expression Parameters. When registering many outfits, keep an eye on parameter usage. Boolean values (ON/OFF) consume 1 bit, integers consume 8 bits, and floats consume 8 bits. Using exclusive toggles helps reduce consumption.
:::

## Next Steps

After completing outfit switching setup, see the following guides:

- [Expression Setup (FaceEmo)](./expressions.md) -- Customize expressions
- [PhysBone Setup](./physbone.md) -- Set up outfit physics
- [Performance Optimization](./optimization.md) -- Optimize after adding outfits
- [Upload](./upload.md) -- Upload to VRChat
