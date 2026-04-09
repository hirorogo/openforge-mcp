---
sidebar_position: 6
title: "PhysBone Setup"
description: "A comprehensive VRChat PhysBone setup guide covering hair, skirts, tails, and accessories"
---

# PhysBone Setup

This guide explains how to use VRChat's PhysBone system to add natural swaying motion to hair, skirts, tails, and accessories. It covers everything from quick preset-based setup to fine-tuned manual parameter adjustments.

## What Is PhysBone

PhysBone is VRChat's physics simulation system. It applies physics calculations to avatar bones (skeleton), making hair, skirts, and other elements sway naturally with movement.

What PhysBone can do:

- Hair gently sways as you walk
- Skirts flow naturally with movement
- Tails move fluidly
- Earrings, ribbons, and other accessories swing
- React when other players touch them (Grab feature)

## Preset-Based Setup

OpenForge MCP provides presets for common use cases.

### Hair PhysBone (setup_hair_physbone)

#### Long Hair

**You:**
> Set up PhysBone for the hair. It's long hair down to the waist, and it should sway gently.

**AI action:** `setup_hair_physbone` runs with the long hair preset.

**AI response example:**

```
PhysBone setup complete (Long hair):
  Target bones: Hair_Root and 24 child bones
  Pull: 0.1
  Spring: 0.3
  Stiffness: 0.2
  Gravity: 0.05
  GravityFalloff: 0.5
  Immobile: 0.3
  Radius: 0.02
```

#### Short Hair

**You:**
> Set up short hair swaying. Keep the movement minimal.

**AI action:** `setup_hair_physbone` runs with the short hair preset.

**AI response example:**

```
PhysBone setup complete (Short hair):
  Target bones: Hair_Root and 12 child bones
  Pull: 0.2
  Spring: 0.5
  Stiffness: 0.4
  Gravity: 0.03
  GravityFalloff: 0.8
  Immobile: 0.5
  Radius: 0.01
```

### Skirt PhysBone (setup_skirt_physbone)

**You:**
> Set up PhysBone for the skirt. It's a knee-length pleated skirt.

**AI action:** `setup_skirt_physbone` runs.

**AI response example:**

```
PhysBone setup complete (Skirt):
  Target bones: Skirt_Root and 16 child bones
  Pull: 0.15
  Spring: 0.4
  Stiffness: 0.3
  Gravity: 0.08
  GravityFalloff: 0.6
  Immobile: 0.2
  Radius: 0.03
  Colliders: auto-added (left leg, right leg, hips)
```

:::info Colliders Are Important for Skirts
Skirt PhysBone setup automatically adds colliders (collision boundaries) for the legs and hips. This prevents the skirt from clipping through the legs.
:::

### Tail PhysBone (setup_tail_physbone)

**You:**
> Set up PhysBone for the tail. It's a cat tail that should move fluidly.

**AI action:** `setup_tail_physbone` runs.

**AI response example:**

```
PhysBone setup complete (Tail):
  Target bones: Tail_Root and 6 child bones
  Pull: 0.08
  Spring: 0.2
  Stiffness: 0.15
  Gravity: 0.1
  GravityFalloff: 0.4
  Immobile: 0.2
  Radius: 0.02
  Grab: Enabled (other players can grab it)
```

### Accessory PhysBone (setup_accessory_physbone)

**You:**
> Set up PhysBone for the earrings. Small, subtle swaying.

**AI action:** `setup_accessory_physbone` runs.

**AI response example:**

```
PhysBone setup complete (Accessory - Earrings):
  Target bones: Earring_L, Earring_R and 2 child bones each
  Pull: 0.05
  Spring: 0.6
  Stiffness: 0.1
  Gravity: 0.15
  GravityFalloff: 0.3
  Immobile: 0.1
  Radius: 0.005
```

**You:**
> Also set up PhysBone for the ribbon. It's a ribbon on the back of the hair that should flutter.

**AI action:** `setup_accessory_physbone` runs with ribbon-specific settings.

## Manual Setup: Parameter Reference (configure_physbone)

For cases where presets are not sufficient, or when fine adjustments are needed, specify parameters directly.

### Parameter List and Effects

| Parameter | Range | Description | When Higher | When Lower |
|---|---|---|---|---|
| **Pull** | 0.0 - 1.0 | Force to return to rest pose | Returns quickly | Returns slowly |
| **Spring** | 0.0 - 1.0 | Springiness/elasticity | Bouncy motion | Sluggish motion |
| **Stiffness** | 0.0 - 1.0 | Resistance to movement | Rigid, hard to move | Soft, sways easily |
| **Gravity** | -1.0 - 1.0 | Gravity influence | Hangs down strongly | Less gravity effect |
| **GravityFalloff** | 0.0 - 1.0 | Gravity variation by pose | Gravity changes with pose | Constant regardless of pose |
| **Immobile** | 0.0 - 1.0 | Proportion that stays still during movement | Less responsive to movement | Very responsive to movement |
| **Radius** | 0.0+ | Collision radius | Wider collision area | Narrower collision area |

### Parameter Adjustment Examples

**You:**
> Increase the hair PhysBone's Spring to 0.5. I want a bouncier feel.

**AI action:** `configure_physbone` runs, changing the Hair_Root PhysBone's Spring parameter to 0.5.

**You:**
> Set the tail's Gravity to 0.15. I want it to droop a bit more.

**AI action:** The Tail_Root PhysBone's Gravity is updated to 0.15.

### Recommended Parameter Combinations

Suggested parameter combinations by use case.

#### Soft Long Hair

```
Pull: 0.08, Spring: 0.25, Stiffness: 0.15,
Gravity: 0.05, Immobile: 0.3
```

Characteristics: Sways slowly, returns with a gentle floating motion. Minimal gravity influence.

#### Stiff Twintails

```
Pull: 0.2, Spring: 0.5, Stiffness: 0.4,
Gravity: 0.03, Immobile: 0.5
```

Characteristics: Returns quickly. Resists large sway but has springy bounce.

#### Light Frilly Skirt

```
Pull: 0.1, Spring: 0.4, Stiffness: 0.2,
Gravity: 0.1, Immobile: 0.15
```

Characteristics: Flutters lightly. Very responsive to movement.

#### Heavy Long Skirt

```
Pull: 0.2, Spring: 0.3, Stiffness: 0.35,
Gravity: 0.12, Immobile: 0.3
```

Characteristics: Slow, heavy movement. Hangs down firmly under gravity.

## Collider Setup (add_physbone_collider)

Colliders are collision boundaries that prevent PhysBones from clipping through specific objects.

### Common Collider Placements

**You:**
> Add colliders so the skirt does not clip through the legs.

**AI action:** `add_physbone_collider` runs, adding capsule-shaped colliders to both legs.

**AI response example:**

```
PhysBone colliders added:
  LeftUpperLeg: Capsule collider (radius 0.04, height 0.35)
  LeftLowerLeg: Capsule collider (radius 0.035, height 0.35)
  RightUpperLeg: Capsule collider (radius 0.04, height 0.35)
  RightLowerLeg: Capsule collider (radius 0.035, height 0.35)
  Hips: Sphere collider (radius 0.08)
  -> Associated colliders with skirt PhysBone
```

**You:**
> Add colliders to the chest and back too, so hair does not clip through the body.

**AI action:** Colliders are added to the Chest and Spine, and associated with the hair PhysBone.

### Collider Types

| Type | Shape | Use Case |
|---|---|---|
| Sphere | Ball | Head, joints, rough torso collision |
| Capsule | Cylinder with hemispherical caps | Arms, legs, and other elongated parts |
| Plane | Infinite plane | Ground, walls (special use) |

### Adjusting Colliders

**You:**
> Make the leg collider radius a bit larger. The skirt sometimes clips between the legs.

**AI action:** The collider radius is increased.

:::warning Making Colliders Too Large
If the collider radius is too large, skirts and hair will unnaturally float away from the body. Adjust gradually and use the smallest size that prevents clipping.
:::

## Tips for Natural Swaying

### General Guidelines

1. **Start with presets**: Presets are tuned for well-balanced values across many avatars
2. **Balance Spring and Pull**: Increasing Spring adds bounce, increasing Pull speeds up recovery. Raising both too much creates restless motion
3. **Keep Stiffness low**: Too much Stiffness prevents nearly all swaying. The 0.1 to 0.3 range often looks natural
4. **Keep Gravity moderate**: Too much gravity causes constant drooping. Values between 0.03 and 0.1 work well in most cases

### Adjustment Workflow

**You:**
> Test the hair swaying in play mode.

**AI action:** Unity's play mode starts, running the PhysBone simulation.

**You:**
> It's swaying too much. Increase Stiffness and decrease Spring.

**AI action:** The parameters are adjusted.

**You:**
> Looks good. Show me the current settings.

**AI response example:**

```
Current PhysBone settings (Hair_Root):
  Pull: 0.1
  Spring: 0.2
  Stiffness: 0.3
  Gravity: 0.05
  GravityFalloff: 0.5
  Immobile: 0.3
```

### Performance Impact

PhysBone affects performance rank.

| Rank | PhysBone Components | Affected Bones | Colliders |
|---|---|---|---|
| Excellent | 0 | 0 | 0 |
| Good | 4 or fewer | 16 or fewer | 8 or fewer |
| Medium | 8 or fewer | 64 or fewer | 16 or fewer |
| Poor | 16 or fewer | 256 or fewer | 32 or fewer |

:::tip PhysBone Performance Optimization
To reduce the number of PhysBone components, you can combine multiple bone chains under a single root bone. For example, instead of putting front hair and side hair in separate components, setting them up from a shared Hair_Root reduces the component count.
:::

## Next Steps

After completing PhysBone setup, see the following guides:

- [Avatar Setup](./avatar-setup.md) -- Overall avatar setup
- [Outfit Switching (Modular Avatar)](./outfit-change.md) -- Add PhysBone to outfits
- [Performance Optimization](./optimization.md) -- Manage PhysBone performance impact
- [Upload](./upload.md) -- Upload to VRChat
