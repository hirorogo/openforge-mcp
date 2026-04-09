---
sidebar_position: 5
title: "Performance Optimization Guide"
description: "From profiler-based bottleneck analysis to draw call reduction, LODs, and occlusion culling"
---

# Performance Optimization Guide

Use OpenForge MCP's profiler and optimization tools to systematically improve scene performance. This covers bottleneck identification, draw call reduction, LODs, memory optimization, and VRChat-specific constraints.

## Prerequisites

- Unity is running and connected to OpenForge MCP
- The scene to optimize is open
- You understand the basics of the Unity Profiler

## Optimization Workflow

```
1. Measure (Profiling)
   |
   v
2. Identify Bottlenecks
   |
   v
3. Apply Fixes
   |
   v
4. Re-measure (Verify Results)
   |
   v
5. If target not met, return to step 2
```

Do not optimize based on guesses. Always start with measurements.

## Step 1: Profiling

**You:**
> Profile the scene's performance. Show FPS, draw call count, triangle count, and memory usage.

**AI Response Example:**
```
Profiler started and data collected (5 seconds).

Performance Summary:
  FPS: 28 (average) / 22 (minimum)
  Frame time: 35.7ms (average)
    CPU: 28.1ms
    GPU: 31.2ms  <- GPU bound

Rendering:
  Draw calls: 847
  Batches: 312
  SetPass calls: 89
  Triangles: 2,840,000
  Vertices: 1,920,000

Memory:
  Total usage: 1.82 GB
  Textures: 890 MB
  Meshes: 245 MB
  Materials: 12 MB
  Audio: 34 MB

Bottleneck: GPU bound
  Primary cause: High draw call count (847)
  Secondary cause: Large texture memory (890 MB)
```

## Step 2: Draw Call Analysis

**You:**
> Analyze the draw call breakdown. Which objects are using the most draw calls?

**AI Response Example:**
```
Draw call analysis results:

Top 10 objects:
  1. Forest_Trees (312 calls) -- 312 individual trees with separate materials
  2. Building_Windows (128 calls) -- separate material per window pane
  3. Props_Furniture (87 calls) -- furniture item group
  4. Terrain (64 calls) -- terrain layers
  5. Characters (48 calls) -- NPC characters
  6. Ground_Debris (45 calls) -- pebbles and fallen leaves
  7. Lighting_Probes (38 calls)
  8. UI_Elements (32 calls)
  9. Particle_Systems (28 calls)
  10. Other (65 calls)

Recommendations:
  - Forest_Trees: Enable GPU instancing or SRP Batcher
  - Building_Windows: Consolidate materials (SRP Batcher is effective for same-shader materials)
  - Ground_Debris: Combine meshes to reduce draw calls
```

## Step 3: Draw Call Reduction

### 3a: Material Consolidation

**You:**
> Consolidate the Forest_Trees materials. Create a texture atlas and merge into a single material.

**AI Response Example:**
```
Texture atlas created.

Before:
  Materials: 8 (separate material per tree species)
  Textures: 8 x 1024x1024 = 8 MB

After:
  Materials: 1 (atlased)
  Texture atlas: 1 x 4096x4096 = 16 MB
  UV remap: Updated UVs for 312 meshes

Draw call reduction: 312 -> 1 (with GPU instancing)
```

:::warning Texture Atlas Trade-offs
Atlasing may increase texture memory (due to reduced mipmap efficiency). Consider the balance between draw call reduction and memory increase.
:::

### 3b: Mesh Combining

**You:**
> Combine Ground_Debris meshes. Only target static objects that won't move.

**AI Response Example:**
```
Mesh combining complete.

Before:
  Objects: 45
  Draw calls: 45

After:
  Objects: 3 (combined per area)
  Draw calls: 3

Note: Combined meshes can no longer be individually moved or deleted.
Static flag set.
```

### 3c: SRP Batcher Check

**You:**
> Check the SRP Batcher status. Fix any incompatible materials.

**AI Response Example:**
```
SRP Batcher compatibility check:

Compatible: 67 materials
Incompatible: 12 materials
  - M_CustomGlass: Custom shader does not declare CBUFFER correctly
  - M_Legacy_*: Using built-in shaders (11 materials)

Fixes:
  - M_CustomGlass: Added CBUFFER_START/CBUFFER_END -> now compatible
  - M_Legacy_*: Changed to URP Lit shader -> now compatible

SRP Batcher compatibility: 67/79 -> 79/79 (100%)
```

## Step 4: LOD (Level of Detail) Setup

**You:**
> Set up LODs for all Forest_Trees. 3 levels. Show polygon counts for each LOD.

**AI Response Example:**
```
LOD groups configured (312 objects).

LOD settings (per tree):
  LOD0 (screen ratio 50%+): 1,200 polygons (original)
  LOD1 (screen ratio 20%+): 400 polygons (66% reduction)
  LOD2 (screen ratio 5%+): 80 polygons (93% reduction)
  Culled: below 5% screen ratio

Total polygon reduction estimate (varies by camera position):
  Worst case (all LOD0): 374,400
  Typical case (mixed): ~120,000
  Reduction: ~68%
```

## Step 5: Occlusion Culling

Skip rendering objects that are not visible.

**You:**
> Set up and bake occlusion culling. Settings:
> - Smallest Occluder: 5m
> - Smallest Hole: 0.25m
> - Backface Threshold: 100

**AI Response Example:**
```
Occlusion culling configured.

Static Occluder: 48 objects (walls, floors, large buildings)
Static Occludee: 892 objects (all Static objects)

Bake settings:
  Smallest Occluder: 5m
  Smallest Hole: 0.25m
  Backface Threshold: 100

Bake complete (12.4 seconds)
  Cells: 256
  Data size: 1.2 MB

Culling effectiveness (measured at test positions):
  Indoor: 180/892 objects rendered (80% culled)
  Outdoor: 450/892 objects rendered (50% culled)
```

## Step 6: Memory Optimization

**You:**
> Analyze texture memory usage. Identify unnecessarily large textures.

**AI Response Example:**
```
Texture memory analysis:

Top 10 textures (by memory consumption):
  1. T_Terrain_Splat (4096x4096, RGBA32) - 64 MB
  2. T_Skybox_HDR (4096x2048, RGBAHalf) - 32 MB
  3. T_Building_Albedo (4096x4096, RGBA32) - 64 MB
  4. T_Building_Normal (4096x4096, RGBA32) - 64 MB
  5. T_Tree_Atlas (4096x4096, RGBA32) - 64 MB
  ...

Recommended compression settings:
  T_Terrain_Splat: RGBA32 -> ASTC 6x6 = 64 MB -> 11 MB
  T_Building_Albedo: RGBA32 -> BC7 = 64 MB -> 16 MB
  T_Building_Normal: RGBA32 -> BC5 (for normals) = 64 MB -> 16 MB
  T_Tree_Atlas: RGBA32 -> BC7 = 64 MB -> 16 MB

Estimated total reduction: 890 MB -> 320 MB (64% reduction)
```

**You:**
> Apply all the recommended settings.

**AI Response Example:**
```
Applied texture compression settings.

Textures modified: 42
Texture memory:
  Before: 890 MB
  After: 315 MB
  Reduction: 575 MB (65%)

Note: Please visually verify key textures for quality degradation from compression.
```

## Step 7: Before and After Comparison

After applying all optimizations, re-measure to confirm the results.

**You:**
> Profile again. Show a comparison with the pre-optimization numbers.

**AI Response Example:**
```
Post-optimization profiling results:

                      Before      After       Improvement
FPS (average):        28          72          +157%
Frame time:           35.7ms      13.9ms      -61%
  CPU:                28.1ms      11.2ms      -60%
  GPU:                31.2ms      12.8ms      -59%

Draw calls:           847         186         -78%
Batches:              312         142         -54%
Triangles:            2,840,000   680,000     -76%

Memory:
  Textures:           890 MB      315 MB      -65%
  Meshes:             245 MB      198 MB      -19%
  Total:              1.82 GB     1.12 GB     -38%

Bottleneck: None (well balanced)
60 FPS target achieved.
```

## VRChat-Specific Constraints

VRChat has strict performance ranks for avatars and worlds.

### Avatar Performance Ranks

| Rank | Polygons | Materials | Meshes | Bones |
|------|----------|-----------|--------|-------|
| Excellent | 7,500 | 1 | 1 | 75 |
| Good | 10,000 | 1 | 1 | 90 |
| Medium | 15,000 | 2 | 2 | 150 |
| Poor | 20,000 | 4 | 2 | 256 |

### World Guidelines

| Metric | Recommended Value |
|--------|------------------|
| Batches | Under 200 |
| Triangles | Under 500,000 |
| Lightmap resolution | Under 100 MB total |
| Texture memory | Under 256 MB total |

### VRChat Optimization Check

**You:**
> Check the VRChat performance rank. Target Good or better for the avatar.

**AI Response Example:**
```
VRChat performance rank analysis:

Current avatar "MyAvatar":
  Polygons: 18,200 -> Rank: Poor (Good requires 10,000 or less)
  Materials: 3 -> Rank: Medium (Good requires 1)
  Meshes: 2 -> Rank: Medium (Good requires 1)
  Bones: 120 -> Rank: Medium (Good requires 90)

  Overall rank: Poor

Work needed for Good:
  1. Reduce polygons to 10,000 or less (Decimate by 45%)
  2. Consolidate to 1 material (texture atlas)
  3. Combine to 1 mesh
  4. Reduce bones to 90 or less (merge unnecessary bones)
```

**You:**
> Do it all. Achieve Good rank.

**AI Response Example:**
```
VRChat Good rank optimization complete.

1. Polygon reduction:
   18,200 -> 9,800 (Decimate ratio: 0.54)
   Silhouette quality verified -- within acceptable range

2. Material consolidation:
   3 materials -> 1 material
   Texture atlas: 2048x2048 (Albedo, Normal, Emission packed)
   UV remap complete

3. Mesh combining:
   Body + Hair -> 1 mesh
   Shape keys preserved

4. Bone optimization:
   120 -> 88 bones
   Merged 32 end-node finger bones

Post-optimization:
  Polygons: 9,800 (Good: 10,000 or less)
  Materials: 1 (Good: 1)
  Meshes: 1 (Good: 1)
  Bones: 88 (Good: 90 or less)

  Overall rank: Good
```

## Optimization Checklist

A checklist for optimization work. Items near the top tend to have the biggest impact.

| Item | Check Command | Target |
|------|--------------|--------|
| Draw calls | `analyze_draw_calls` | Under 200 |
| SRP Batcher | `check_srp_batcher` | 100% compatibility |
| GPU Instancing | `check_gpu_instancing` | Enable for identical meshes |
| LOD | `analyze_lod_coverage` | Required for distant objects |
| Occlusion Culling | `check_occlusion` | Required for indoor scenes |
| Texture Compression | `analyze_texture_memory` | Platform-optimal compression |
| Mesh Combining | `analyze_mesh_count` | Combine small static props |
| Lightmaps | `check_lightmap_size` | Not unnecessarily high-resolution |
| Shadow Distance | `get_shadow_settings` | Set to minimum needed |
| Realtime Light Count | `count_realtime_lights` | Replace with baked lights where possible |
