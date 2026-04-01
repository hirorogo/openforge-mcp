---
sidebar_position: 1
title: "VRChat Mode Overview"
description: "An overview of OpenForge MCP's VRChat mode, including setup and available tools"
---

# VRChat Mode Overview

OpenForge MCP's VRChat mode is a dedicated mode that provides a specialized toolset for VRChat world creation and avatar editing. In addition to the standard Unity tools, it lets you control VRChat-specific features such as VRChat SDK, Modular Avatar, FaceEmo, and PhysBone through natural language.

## Why a Dedicated VRChat Mode?

Creating content for VRChat requires not only basic Unity knowledge but also familiarity with VRChat SDK's custom components and community tools like Modular Avatar. In Full mode, all tools are exposed, meaning tools unrelated to VRChat (Godot tools, Blender-only features, etc.) take up context space.

VRChat mode selectively exposes only the tools needed for VRChat creation, improving the AI's decision accuracy and reducing token consumption.

## Setup

Setting up VRChat mode takes a single command.

```bash
npx openforge-mcp setup --mode vrchat
```

This command performs the following:

1. Writes mode information to the OpenForge MCP configuration file
2. Configures the system to expose only VRChat-related tools
3. Updates the AI client configuration file (`claude_desktop_config.json`, etc.)

:::info Applying to an Existing Project
Even if you are already using OpenForge MCP, you can switch modes by re-running the command above. Your existing settings are backed up.
:::

## Available Tools

Here are the tools available in VRChat mode, organized by category.

### Scene and Object Operations

| Tool Name | Description |
|---|---|
| `create_gameobject` | Create a GameObject |
| `set_transform` | Set position, rotation, and scale |
| `set_material` | Set a material |
| `create_material` | Create a material |
| `take_screenshot` | Take a screenshot |
| `create_light` | Place a light |
| `set_skybox` | Set the skybox |

### VRChat World

| Tool Name | Description |
|---|---|
| `setup_vrc_world` | Set up VRC Scene Descriptor |
| `add_spawn_point` | Add a spawn point |
| `add_vrc_mirror` | Place a mirror |
| `add_vrc_chair` | Add a sittable object (chair) |
| `add_vrc_pickup` | Add a pickupable object |
| `add_vrc_video_player` | Place a video player |
| `add_vrc_portal` | Create a portal |
| `validate_for_upload` | Validate before upload |

### VRChat Avatar

| Tool Name | Description |
|---|---|
| `setup_vrc_avatar` | Set up VRC Avatar Descriptor |
| `set_viewpoint` | Set the viewpoint |
| `check_avatar_rank` | Check performance rank |
| `suggest_optimizations` | Suggest optimizations |
| `auto_optimize_avatar` | Auto-optimize |
| `compare_before_after` | Compare before and after optimization |

### Modular Avatar (Outfit Swapping)

| Tool Name | Description |
|---|---|
| `auto_setup_outfit` | Automatic outfit setup |
| `add_ma_merge_armature` | Add MA Merge Armature |
| `add_ma_bone_proxy` | Add MA Bone Proxy |
| `add_ma_toggle` | Set up ON/OFF toggle |
| `add_ma_blendshape_sync` | Set up BlendShape sync |

### FaceEmo (Expressions)

| Tool Name | Description |
|---|---|
| `auto_detect_blendshapes` | Auto-detect BlendShapes |
| `create_expression_preset` | Create an expression preset |
| `add_expression` | Add a custom expression |
| `add_gesture_expression` | Assign an expression to a gesture |

### PhysBone (Dynamic Bones)

| Tool Name | Description |
|---|---|
| `setup_hair_physbone` | Set up hair PhysBone |
| `setup_skirt_physbone` | Set up skirt PhysBone |
| `setup_tail_physbone` | Set up tail PhysBone |
| `setup_accessory_physbone` | Set up accessory PhysBone |
| `configure_physbone` | Configure individual PhysBone parameters |
| `add_physbone_collider` | Add a PhysBone collider |

### Texture Editing

| Tool Name | Description |
|---|---|
| `adjust_hsv` | Adjust hue, saturation, and brightness |
| `apply_gradient` | Apply a gradient |
| `generate_pattern` | Generate a pattern |
| `overlay_decal` | Overlay a decal |
| `swap_color` | Swap colors |
| `batch_recolor` | Batch color change |
| `export_texture` | Export a texture |

## Differences from Full Mode

| Item | Full Mode | VRChat Mode |
|---|---|---|
| Exposed tools | 100+ | ~50 |
| Blender tools | All | Cross-app pipeline only |
| Godot tools | All | None |
| VRChat-specific tools | Included | Included |
| Modular Avatar | Included | Included |
| FaceEmo | Included | Included |
| PhysBone-specific tools | Included | Included |
| Texture editing | Included | Included |
| Token consumption | High | Medium |

VRChat mode excludes tools not needed for VRChat creation (Godot tools, Blender-only modeling tools, etc.). However, cross-app pipeline features with Blender (such as polygon reduction) remain available.

## Supported VRChat SDK Versions

| SDK | Supported Version |
|---|---|
| VRChat SDK - Worlds | 3.5.x and later |
| VRChat SDK - Avatars | 3.5.x and later |

:::warning About SDK versions
VRChat SDK is updated frequently. OpenForge MCP tracks the latest stable SDK version, but may not support beta versions. If you encounter issues, update to the latest stable version through VRChat Creator Companion (VCC).
:::

## Recommended Unity Version

Use **Unity 2022.3.22f1 LTS**.

VRChat strictly specifies which Unity versions can be used. Using a different version may cause build errors or upload failures. Creating your project through VRChat Creator Companion (VCC) will automatically select the correct version.

:::tip How to check your Unity version
You can check the Unity version linked to your project in Unity Hub's install list. If you created the project through VCC, the correct version should already be set.
:::

## Next Steps

Once VRChat mode setup is complete, continue with these guides:

- [World Creation](./world-creation.md) -- Build a VRChat world from scratch
- [Avatar Setup](./avatar-setup.md) -- Make your avatar VRChat-ready
- [Outfit Swapping](./outfit-change.md) -- Add outfits with Modular Avatar
- [Expression Setup](./expressions.md) -- Create expressions with FaceEmo
- [Dynamic Bone Setup](./physbone.md) -- Add natural movement with PhysBone
