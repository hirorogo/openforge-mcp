---
sidebar_position: 9
title: "Upload"
description: "A guide to uploading avatars and worlds to VRChat, including validation steps"
---

# Upload

This guide explains how to upload avatars and worlds created with OpenForge MCP to VRChat. It covers every step from pre-upload validation, through building, to publish settings.

## Pre-Upload Validation (validate_for_upload)

Always run validation before starting the upload. Skipping validation can lead to build errors or upload failures.

### Avatar Validation

**You:**
> Run the avatar pre-upload validation.

**AI action:** `validate_for_upload` runs, checking the following items:

| Validation Item | Details |
|---|---|
| VRC_AvatarDescriptor | Is the component configured correctly? |
| Viewpoint | Is it placed at an appropriate position? |
| Bone mapping | Are there issues with the Humanoid rig mapping? |
| Lip sync | Are Viseme BlendShapes configured? |
| Expression Menu | Are menus and parameters set up? |
| Performance rank | Display of current rank |
| Material errors | Are shaders VRChat-compatible? |
| Missing References | Are there components with broken references? |

**AI response example:**

```
Avatar validation results:
  VRC_AvatarDescriptor: OK
  Viewpoint: OK
  Bone mapping: OK (all required bones mapped)
  Lip sync: OK (15 Viseme BlendShapes)
  Expression Menu: OK (8 expressions, 2 outfit toggles)
  Performance rank: Good
  Materials: OK
  Missing References: OK

Ready to upload.
```

### World Validation

**You:**
> Run the world pre-upload validation.

**AI action:** `validate_for_upload` runs in world mode.

| Validation Item | Details |
|---|---|
| VRC_SceneDescriptor | Is the component configured correctly? |
| Spawn points | Is at least one configured? |
| Colliders | Are floor and wall collisions present? |
| Lightmaps | Check bake status |
| Draw calls | Performance check |
| Respawn Height | Is the fall respawn height appropriate? |
| Audio sources | Spatial audio configuration check |

**AI response example:**

```
World validation results:
  VRC_SceneDescriptor: OK
  Spawn points: OK (2 configured)
  Colliders: Warning - bar roof is missing colliders
  Lightmaps: OK (baked)
  Draw calls: 156 (recommended: under 200)
  Respawn Height: OK (-10m)
  Audio sources: OK

1 warning, no errors. Ready to upload.
```

## Common Validation Errors and Fixes

### Error List

| Error | Cause | Fix |
|---|---|---|
| VRC_AvatarDescriptor missing | Avatar setup not performed | "Set this up as a VRChat avatar" |
| VRC_SceneDescriptor missing | World setup not performed | "Run the VRChat world initial setup" |
| Viewpoint not set | set_viewpoint not run | "Auto-configure the viewpoint" |
| Bone mapping error | Humanoid rig misconfiguration | "Check and fix the bone mapping" |
| Lip sync not set | Viseme BlendShapes not assigned | "Set up lip sync" |
| Incompatible shader | Non-VRChat-compatible shader used | "Change the shader to a VRChat-compatible one" |
| Missing References | References to deleted assets | "Fix the broken references" |
| No spawn point | Spawn point not configured | "Set up a spawn point" |
| Missing colliders | Floor colliders absent | "Add colliders to the floor" |

### Fixing Validation Errors

**You:**
> The avatar validation shows a lip sync error. Fix it.

**AI action:** Lip sync Viseme BlendShapes are automatically detected and assigned.

**You:**
> The world validation shows a missing collider warning. Check it.

**AI action:** Objects without colliders are listed, and colliders are added where needed.

:::tip Re-Run Validation
After fixing errors, always run validation again. While fixing one error rarely introduces new issues, it is good practice to verify.
:::

## Build and Upload

Once validation passes, upload from the VRChat SDK Control Panel in Unity.

### Avatar Upload

**You:**
> Prepare the avatar build.

**AI action:** All OpenForge MCP settings are finalized. Then perform the following steps in Unity:

1. Open **VRChat SDK > Show Control Panel** from the Unity menu bar
2. Select the **Builder** tab
3. Enter avatar information:
   - **Name**: Avatar name (displayed in VRChat)
   - **Description**: Avatar description (optional)
   - **Sharing**: Private (yourself only) or Public (shared)
4. Click the **Build & Publish** button
5. When the build completes, a thumbnail capture screen appears
6. Capture the thumbnail and click **Upload**

:::info Responsibility Split Between OpenForge MCP and Upload
OpenForge MCP handles avatar and world setup, optimization, and validation. The final build and upload are performed manually from the VRChat SDK Control Panel. This is due to VRChat SDK security requirements.
:::

### World Upload

1. Open **VRChat SDK > Show Control Panel** from the Unity menu bar
2. Select the **Builder** tab
3. Enter world information:
   - **Name**: World name
   - **Description**: World description
   - **Max Capacity**: Maximum player capacity (recommended: 16-32)
   - **Tags**: Search tags
4. Click the **Build & Publish** button
5. When the build completes, a thumbnail capture screen appears
6. Capture the thumbnail and click **Upload**

## Differences Between Avatar and World Upload

| Item | Avatar | World |
|---|---|---|
| Target | Object containing VRC_AvatarDescriptor | Scene containing VRC_SceneDescriptor |
| Displayed in | My Avatars | My Worlds |
| Testing method | Change into it and check | Local test (Build & Test) |
| Size limit | None (managed via performance rank) | Recommended under 200 MB |
| Visibility | Private / Public | Private / Public |
| Updating | Re-upload with the same Blueprint ID | Re-upload with the same Blueprint ID |

### Local Testing (Worlds Only)

You can test a world locally before uploading.

**You:**
> Run a local test of the world.

**AI action:** The VRChat SDK Build & Test feature launches, loading the world in the VRChat client. It creates a test instance that only you can enter.

Points to check during testing:

- Is the spawn point position and orientation correct?
- Do all floor and wall colliders work? (No falling through?)
- Can you sit in chairs and do mirrors work?
- Is the lighting natural?
- Are there performance issues? (Frame rate drops?)

## Tags and Descriptions

### Avatar Tags

VRChat avatar search does not use tags, but adding a description for your own reference is convenient.

### World Tags

World tags are used in VRChat search. Setting appropriate tags makes your world easier to find.

Commonly used tag examples:

| Category | Tag Examples |
|---|---|
| Atmosphere | chill, relaxing, cozy, atmospheric |
| Purpose | hangout, meeting, event, game |
| Theme | beach, bar, cafe, club, nature |
| Features | mirror, video player, seating |

**You:**
> Set the world tags. Use "chill", "beach", "bar", "hangout", and "mirror".

**AI action:** Tags are added to the world settings.

## Thumbnails

Thumbnails are the images displayed in VRChat's world and avatar lists.

### Thumbnail Tips

| Item | Recommendation |
|---|---|
| Resolution | 1200 x 900 pixels (VRChat standard ratio) |
| Content | An angle that conveys the appeal of the world or avatar |
| Brightness | Moderately bright, not too dark |
| Composition | Important elements centered in the frame |

**You:**
> Take a screenshot for the thumbnail. Show the bar counter and sunset ocean, at 1200x900.

**AI action:** A screenshot is captured at the specified composition and size. This screenshot can be used as the thumbnail during upload.

## Post-Upload Verification

After uploading, verify within VRChat.

### Verifying an Avatar

1. Launch VRChat
2. Open **Avatars** from the menu
3. Select the uploaded avatar in the **My Avatars** tab
4. Press **Change** to switch to the avatar
5. Check all features in front of a mirror

Checklist:

- Does the appearance match what you saw in Unity?
- Do expressions work correctly?
- Do PhysBones sway naturally?
- Can you switch outfits?
- Does lip sync work?

### Verifying a World

1. Launch VRChat
2. Open **Worlds** from the menu
3. Select the uploaded world in the **My Worlds** tab
4. Press **Go** to enter the world

Checklist:

- Is the spawn point correct?
- Do all interactive elements work?
- Is performance adequate?
- Does the appearance match what you saw in Unity?

## Updating an Upload

When re-uploading a modified avatar or world, using the same Blueprint ID updates the existing upload.

**You:**
> I modified the avatar and want to re-upload. Update it with the same ID.

**AI action:** The Blueprint ID is preserved and the build is prepared. Re-uploading from the VRChat SDK Control Panel in Unity will update the existing avatar.

:::warning About Blueprint IDs
A Blueprint ID is the unique identifier for an avatar or world. It is stored in the VRC_AvatarDescriptor or VRC_SceneDescriptor in the Unity scene. Changing or deleting this ID causes the content to be uploaded as a new avatar/world, separate from the existing one.
:::

## Next Steps

After uploading, see the following guides:

- [Performance Optimization](./optimization.md) -- Improve performance after upload
- [VRChat Recipes](./recipes.md) -- Automate production workflows
- [VRChat Mode Overview](./overview.md) -- Overview of available tools
