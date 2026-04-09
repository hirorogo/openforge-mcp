---
sidebar_position: 8
title: "Performance Optimization"
description: "A guide to improving VRChat avatar performance rank through optimization"
---

# Performance Optimization

This guide explains how to understand and improve VRChat avatar performance ranks. It covers everything from checking your current rank, specific optimization steps, and before-and-after comparisons -- all executable through natural language.

## What Is Performance Rank

VRChat assigns a performance rank to every avatar. Avatars with a low rank (heavy) may be blocked or simplified by other players' settings.

| Rank | Display | Visibility to Other Players |
|---|---|---|
| **Excellent** | Green | Always displayed |
| **Good** | Green | Displayed in most environments |
| **Medium** | Yellow | May be hidden by some players |
| **Poor** | Red | Likely hidden by many players |
| **Very Poor** | Red | Hidden by default, requires manual toggle to display |

:::info Why Rank Matters
If your performance rank is Good or above, most players will see your avatar. Events and public instances often require Good or above, so aiming for Good is recommended when possible.
:::

## Rank Limits

The key limits for each rank are shown below.

| Item | Excellent | Good | Medium | Poor |
|---|---|---|---|---|
| Polygon count | 32,000 | 70,000 | 70,000 | Unlimited |
| Material count | 1 | 1 | 2 | 4 |
| Bone count | 75 | 90 | 150 | 256 |
| PhysBone components | 0 | 4 | 8 | 16 |
| PhysBone affected bones | 0 | 16 | 64 | 256 |
| PhysBone colliders | 0 | 8 | 16 | 32 |
| Mesh count | 1 | 1 | 2 | 8 |
| Texture memory | 10 MB | 18 MB | 25 MB | 40 MB |
| Skinned Mesh | 1 | 1 | 2 | 8 |
| Particle systems | 0 | 0 | 2 | 8 |

:::warning The Worst Item Determines Your Rank
The performance rank is determined by whichever item has the worst rating. For example, even if your polygon count is within the Excellent range, if your material count falls in the Medium range, your overall rank will be Medium.
:::

## Checking Performance Rank (check_avatar_rank)

**You:**
> Check the avatar's performance rank.

**AI action:** `check_avatar_rank` runs and displays the current rank with details for each item.

**AI response example:**

```
Performance Rank: Poor

Per-item ranks:
  Polygon count:          52,000    Good     (under 70,000)
  Material count:         6         Poor     (exceeds 4)
  Bone count:             142       Medium   (under 150)
  PhysBone components:    6         Medium   (under 8)
  PhysBone affected bones:48        Medium   (under 64)
  PhysBone colliders:     10        Medium   (under 16)
  Mesh count:             5         Medium   (exceeds 2)
  Texture memory:         22 MB     Medium   (under 25 MB)
  Skinned Mesh:           4         Medium   (exceeds 2)

Bottleneck: Material count (need to reduce from 6 to 4 or fewer)
```

## Optimization Suggestions (suggest_optimizations)

**You:**
> Suggest optimizations. I want to reach Good rank.

**AI action:** `suggest_optimizations` runs and displays specific recommendations for reaching Good rank.

**AI response example:**

```
Optimization suggestions to reach Good rank:

1. [Top Priority] Material merging: reduce 6 -> 1
   - Create a texture atlas and combine all materials into one
   - Expected result: Poor -> Good (clears material limit)
   - How: "Create a texture atlas and merge materials"

2. [Recommended] Mesh merging: reduce 5 -> 1
   - Combine body, hair, and outfit meshes into one
   - Expected result: Skinned Mesh count also improves
   - How: "Merge the meshes"

3. [Recommended] Bone reduction: 142 -> under 90
   - Remove unused bones: approximately 12 bones can be removed
   - Simplify finger bones: approximately 20 bones can be removed
   - How: "Remove unnecessary bones"

4. [Optional] Texture compression: 22 MB -> under 18 MB
   - Downscale 4096x4096 textures to 2048x2048
   - How: "Resize large textures to 2048"
```

## Automatic Optimization (auto_optimize_avatar)

**You:**
> Run automatic optimization. Target Good rank.

**AI action:** `auto_optimize_avatar` runs, automatically performing the following:

1. Create a texture atlas (combine multiple textures into one)
2. Merge materials
3. Merge meshes
4. Remove unused bones
5. Compress textures (if needed)

**AI response example:**

```
Automatic optimization complete:

Steps performed:
  1. Texture atlas creation: 6 textures -> 1 atlas (2048x2048)
  2. Material merging: 6 -> 1
  3. Mesh merging: 5 -> 1
  4. Bone removal: 12 unused bones removed
  5. Texture compression: body texture resized from 4096 -> 2048

Before -> After:
  Polygon count:     52,000 -> 52,000 (no change)
  Material count:    6 -> 1
  Bone count:        142 -> 130
  Mesh count:        5 -> 1
  Texture memory:    22 MB -> 14 MB
  Skinned Mesh:      4 -> 1

Rank: Poor -> Good
```

:::tip Safety of Automatic Optimization
Automatic optimization is non-destructive. The pre-optimization state is backed up, so you can revert if the result is unsatisfactory.
:::

## Manual Optimization Techniques

For cases where automatic optimization is not sufficient, or when finer control is needed.

### Polygon Reduction

When you need to significantly reduce polygon count, use the Blender cross-app integration feature.

**You:**
> I want to reduce the avatar's polygon count. Decimate in Blender to under 32,000.

**AI action:** The avatar mesh is transferred to Blender, where the Decimate modifier is applied to reduce polygon count. It is then returned to Unity.

**You:**
> Don't alter the face too much. Focus the reduction on the body and outfit.

**AI action:** The face mesh Decimate ratio is kept conservative, while the body and outfit meshes are reduced more aggressively.

:::warning Notes on Polygon Reduction
Polygon reduction affects appearance. Be especially careful with the face and areas that affect the silhouette. Checking with screenshots after reduction is recommended.
:::

### Texture Atlas

Create a texture atlas (a single large texture combining multiple textures) to merge multiple materials into one.

**You:**
> Create a texture atlas. Combine all materials into one.

**AI action:** All textures are combined into a single atlas texture, UV mappings are recalculated, and materials are merged into one.

**You:**
> What resolution is the atlas?

**AI response example:** "Atlas resolution: 4096x4096. Downscaling to 2048x2048 should not cause noticeable quality loss."

**You:**
> Downscale to 2048x2048.

### Bone Reduction

**You:**
> List unused bones.

**AI response example:**

```
Unused bones (12):
  Accessory_Holder_L, Accessory_Holder_R
  Wing_Root_L, Wing_Root_R, Wing_Mid_L, Wing_Mid_R, Wing_Tip_L, Wing_Tip_R
  Belt_Bone_1, Belt_Bone_2, Belt_Bone_3, Belt_Bone_4
These bones have no mesh weights assigned.
```

**You:**
> Delete all of them.

**AI action:** Unused bones are removed.

**You:**
> Simplify finger bones. Reduce from 5 fingers to 3.

**AI action:** The ring finger and pinky bones are merged.

### Mesh Merging

**You:**
> Merge the body and outfit meshes.

**AI action:** Multiple Skinned Mesh Renderers are combined into one.

:::warning Mesh Merging Limitations
Once meshes are merged, you can no longer toggle individual meshes on and off. If you are using Modular Avatar for outfit switching, Modular Avatar automatically merges meshes at upload time, so manual merging is unnecessary.
:::

## Before-and-After Comparison (compare_before_after)

Verify the optimization results with numbers.

**You:**
> Show me a before-and-after comparison.

**AI action:** `compare_before_after` runs.

**AI response example:**

```
Before-and-after comparison:

Item              Before      After       Change      Rank Change
Polygon count     52,000      35,000      -32.7%      Good -> Good
Material count    6           1           -83.3%      Poor -> Excellent
Bone count        142         88          -38.0%      Medium -> Good
PhysBone          6           4           -33.3%      Medium -> Good
Mesh count        5           1           -80.0%      Medium -> Excellent
Texture memory    22 MB       10 MB       -54.5%      Medium -> Excellent
Skinned Mesh      4           1           -75.0%      Medium -> Excellent

Overall rank: Poor -> Good
```

**You:**
> Show me a visual comparison with screenshots too.

**AI action:** Side-by-side screenshots of the avatar before and after optimization are captured.

## World Optimization

Performance optimization is important not just for avatars, but for worlds as well.

### Key World Optimization Items

| Item | Recommended Value | How to Check |
|---|---|---|
| Draw calls | Under 200 | "Tell me the draw call count" |
| Polygon count | Under 500,000 | "Tell me the scene polygon count" |
| Texture size | Under 2048x2048 per texture | "Check the texture sizes" |
| Lightmaps | Baked | "Bake the lightmaps" |
| Occlusion culling | Enabled | "Enable occlusion culling" |

### World Optimization Example

**You:**
> Check the world's performance.

**AI response example:**

```
World performance:
  Draw calls: 156
  Polygon count: 320,000
  Texture memory: 85 MB
  Lightmaps: Baked
  Occlusion culling: Not configured

Recommendation: Enabling occlusion culling can reduce draw calls
```

**You:**
> Enable occlusion culling.

**AI action:** Occlusion culling (a feature that skips rendering objects not visible to the camera) is configured.

## Next Steps

After completing optimization, proceed to the following guides:

- [Upload](./upload.md) -- Upload procedure for VRChat
- [Avatar Setup](./avatar-setup.md) -- Overall avatar setup
- [VRChat Recipes](./recipes.md) -- Automation recipes including optimization
