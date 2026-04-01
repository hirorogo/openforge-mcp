---
sidebar_position: 5
title: "Using VRChat Mode"
---

# Using VRChat Mode

With OpenForge MCP's VRChat mode, you can give natural language instructions to the AI for VRChat world creation and avatar-related tasks.


## Enabling VRChat Mode

```bash
npx openforge-mcp setup --mode vrchat
```

When VRChat mode is enabled, you get access to specialized tools for VRChat SDK, Modular Avatar, FaceEmo, PhysBone, and more.


## World Creation

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Place a spawn point | `Place a spawn point at (0, 0, 0)` | `set_spawn_point` |
| Place a mirror | `Place a full-body mirror` | `create_mirror` |
| Place chairs | `Line up 3 chairs` | `create_chair` |
| Create a portal | `Place a portal to another world` | `create_portal` |
| Change world settings | `Set the max capacity to 16` | `set_world_settings` |


## Avatar

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Set up an avatar | `Set up this model as a VRChat avatar` | `setup_avatar` |
| Adjust the viewpoint | `Align the viewpoint to the eyes` | `set_viewpoint` |
| Check performance rank | `Check the avatar's performance rank` | `check_performance_rank` |
| Set bounds | `Auto-adjust the avatar bounds` | `set_avatar_bounds` |
| Upload the avatar | `Upload the avatar` | `upload_avatar` |


## Outfits (Modular Avatar)

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Dress the avatar | `Put this outfit on the avatar` | `ma_setup_outfit` |
| Make outfits toggleable | `Make the outfit toggleable from the menu` | `ma_add_toggle` |
| Auto-merge bones | `Set up Merge Armature` | `ma_merge_armature` |
| Set up Blendshape Sync | `Sync the body shape keys with the outfit` | `ma_sync_blendshape` |
| Organize the menu | `Group the outfit menu into a folder` | `ma_organize_menu` |


## Expressions (FaceEmo)

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Create an expression set | `Create a basic expression set` | `faceemo_create_set` |
| Add an expression | `Add a smile expression` | `faceemo_add_expression` |
| Preview an expression | `Preview the angry expression` | `faceemo_preview` |
| Assign to hand gestures | `Assign the smile to the peace sign` | `faceemo_assign_gesture` |
| Set expression transitions | `Set the expression transition time to 0.1 seconds` | `faceemo_set_transition` |


## Dynamic Bones (PhysBone)

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Set up hair physics | `Set up PhysBone on the hair with a preset` | `setup_physbone` |
| Set up skirt physics | `Set up PhysBone on the skirt` | `setup_physbone` |
| Set up tail physics | `Set up PhysBone on the tail` | `setup_physbone` |
| Adjust bounciness | `Make the hair sway more softly` | `set_physbone_property` |
| Add a collider | `Add a PhysBone collider to the head` | `add_physbone_collider` |


## Textures

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Change a color | `Change the outfit color to black` | `change_texture_color` |
| Add a gradient | `Add a gradient to the hair` | `apply_gradient` |
| Replace a texture | `Replace the eye texture` | `replace_texture` |
| Adjust color tone | `Make the skin color slightly brighter` | `adjust_texture_color` |


## Optimization

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Check performance rank | `What is the current rank?` | `check_performance_rank` |
| Auto-optimize | `Automatically improve the Poor rank` | `auto_optimize` |
| Check polygon count | `What is the polygon count?` | `get_polygon_count` |
| Compress textures | `Optimize the textures` | `optimize_textures` |
| Reduce materials | `Merge the materials` | `merge_materials` |
