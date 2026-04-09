---
sidebar_position: 1
title: "Building a Custom Pipeline"
description: "Build an end-to-end asset pipeline from Blender modeling to Unity prefab creation"
---

# Building a Custom Pipeline

Model in Blender, optimize, bake textures, import into Unity, set up materials, generate LODs, and create prefabs -- automate this entire flow with OpenForge MCP pipelines and recipes.

## Prerequisites

- Both Blender and Unity are running and connected to OpenForge MCP
- Cross-app pipeline is operational (shared directory configured)
- You understand the basics of the recipe feature (see [Recipe Feature](/docs/advanced/recipe))

## Pipeline Overview

```
Blender Modeling
    |
    v
Mesh Optimization (decimate, cleanup)
    |
    v
Texture Baking (albedo, normal, AO)
    |
    v
FBX Export -> Shared Directory
    |
    v
Unity Import (auto-detected)
    |
    v
Material Setup (URP/HDRP)
    |
    v
LOD Group Generation
    |
    v
Prefab Creation
```

## Step 1: Modeling in Blender

**You:**
> Create a medieval wooden crate in Blender. Size is 1m x 0.8m x 0.6m. Add plank seam details and make the lid a separate object.

**AI Response Example:**
```
Created the model in Blender.
- WoodenCrate_Body: 248 vertices, 120 polygons
- WoodenCrate_Lid: 86 vertices, 40 polygons
- Total polygon count: 160
```

## Step 2: Mesh Optimization

Using a high-poly model as-is is expensive. Use Decimate to progressively reduce the polygon count.

**You:**
> Decimate WoodenCrate_Body. Try ratio 0.5 first. Check if the silhouette holds up.

**AI Response Example:**
```
Applied the Decimate modifier.
- Before: 248 vertices, 120 polygons
- After: 126 vertices, 60 polygons
- Reduction: 50%
Screenshot captured. Silhouette change is minimal.
```

Review the screenshot here. If quality is an issue, adjust the ratio.

**You:**
> Clean up the mesh too. Remove duplicate vertices, recalculate normals, and fix non-manifold geometry.

**AI Response Example:**
```
Cleanup complete.
- Removed 3 duplicate vertices
- Recalculated normals (unified outward)
- Non-manifold edges: 0 (no issues)
```

## Step 3: Texture Baking

Bake high-poly details onto the low-poly model.

**You:**
> Bake the following textures for WoodenCrate_Body:
> - Albedo (1024x1024)
> - Normal Map (1024x1024)
> - Ambient Occlusion (1024x1024)
> Output to the //textures/ folder.

**AI Response Example:**
```
Texture baking complete.
- WoodenCrate_Body_Albedo.png (1024x1024)
- WoodenCrate_Body_Normal.png (1024x1024)
- WoodenCrate_Body_AO.png (1024x1024)
Output: //textures/
Bake time: 4.2 seconds
```

:::tip Margin Settings
If the margin between UV islands is too narrow, seams will appear at texture boundaries. Make sure to set adequate UV margins before baking. For 2048x2048, use 4px; for 1024x1024, use 2px as a guideline.
:::

## Step 4: FBX Export

**You:**
> Export WoodenCrate_Body and WoodenCrate_Lid as FBX. Use Unity-compatible settings. Also export textures to the shared directory.

**AI Response Example:**
```
FBX export complete.
- File: ~/OpenForge/shared/WoodenCrate.fbx (245 KB)
- Texture: ~/OpenForge/shared/textures/WoodenCrate_Body_Albedo.png
- Texture: ~/OpenForge/shared/textures/WoodenCrate_Body_Normal.png
- Texture: ~/OpenForge/shared/textures/WoodenCrate_Body_AO.png
- Scale: FBX All (Unity compatible)
- Coordinate system: Y-Up (Unity compatible)
```

## Step 5: Unity Import and Material Setup

Files exported to the shared directory are automatically detected on the Unity side. After detection, set up the materials.

**You:**
> Create a URP Lit material for the imported WoodenCrate in Unity and apply it. Assign the baked textures. Set Metallic to 0 and Smoothness to 0.2.

**AI Response Example:**
```
Created and applied the material.
- Material: WoodenCrate_Mat (URP/Lit)
- Albedo Map: WoodenCrate_Body_Albedo.png
- Normal Map: WoodenCrate_Body_Normal.png (Scale: 1.0)
- Occlusion Map: WoodenCrate_Body_AO.png
- Metallic: 0.0
- Smoothness: 0.2
```

## Step 6: LOD Group Generation

**You:**
> Set up an LOD group for WoodenCrate. LOD0 as-is, LOD1 at 50%, LOD2 at 25%. Cull beyond LOD2.

**AI Response Example:**
```
LOD group configured.
- LOD0: 160 polygons (screen ratio 60% or higher)
- LOD1: 80 polygons (screen ratio 30% or higher)
- LOD2: 40 polygons (screen ratio 10% or higher)
- Culled: below 10% screen ratio
```

## Step 7: Prefab Creation

**You:**
> Save WoodenCrate as a prefab in Assets/Prefabs/Props/. Also add a BoxCollider.

**AI Response Example:**
```
Prefab created.
- Path: Assets/Prefabs/Props/WoodenCrate.prefab
- Components: MeshRenderer, MeshFilter, LODGroup, BoxCollider
- BoxCollider size: (1.0, 0.8, 0.6) -- auto-fit to mesh
```

## Turning It Into a Recipe: Defining the Full Flow in YAML

Package the above steps into a recipe for single-command execution.

```yaml
name: blender-to-unity-asset
description: Optimize a Blender model and output it as a Unity prefab
version: "1.0"
author: your-team

variables:
  model_name: "WoodenCrate"
  body_object: "WoodenCrate_Body"
  lid_object: "WoodenCrate_Lid"
  texture_resolution: 1024
  decimate_ratio: 0.5
  lod1_ratio: 0.5
  lod2_ratio: 0.25
  metallic: 0.0
  smoothness: 0.2
  prefab_path: "Assets/Prefabs/Props"

steps:
  # --- Blender-side processing ---
  - name: Mesh Optimization (Body)
    tool: blender_decimate
    params:
      object: "{{ body_object }}"
      ratio: "{{ decimate_ratio }}"
    on_error: stop

  - name: Mesh Optimization (Lid)
    tool: blender_decimate
    params:
      object: "{{ lid_object }}"
      ratio: "{{ decimate_ratio }}"
    on_error: stop

  - name: Mesh Cleanup (Body)
    tool: blender_clean_mesh
    params:
      object: "{{ body_object }}"
      remove_doubles: true
      recalc_normals: true
    on_error: continue

  - name: Mesh Cleanup (Lid)
    tool: blender_clean_mesh
    params:
      object: "{{ lid_object }}"
      remove_doubles: true
      recalc_normals: true
    on_error: continue

  - name: Albedo Bake
    tool: blender_bake_texture
    params:
      object: "{{ body_object }}"
      type: "DIFFUSE"
      resolution: "{{ texture_resolution }}"
      output: "//textures/{{ model_name }}_Albedo.png"
    on_error: stop

  - name: Normal Map Bake
    tool: blender_bake_texture
    params:
      object: "{{ body_object }}"
      type: "NORMAL"
      resolution: "{{ texture_resolution }}"
      output: "//textures/{{ model_name }}_Normal.png"
    on_error: stop

  - name: AO Bake
    tool: blender_bake_texture
    params:
      object: "{{ body_object }}"
      type: "AO"
      resolution: "{{ texture_resolution }}"
      output: "//textures/{{ model_name }}_AO.png"
    on_error: stop

  - name: FBX Export
    tool: blender_export
    params:
      objects:
        - "{{ body_object }}"
        - "{{ lid_object }}"
      format: "fbx"
      filename: "{{ model_name }}.fbx"
      to_shared: true
      include_textures: true
    on_error: stop

  # --- Unity-side processing ---
  - name: Wait for Import
    tool: wait_for_import
    params:
      filename: "{{ model_name }}.fbx"
      timeout: 30
    on_error: stop

  - name: Create Material
    tool: create_material
    params:
      name: "{{ model_name }}_Mat"
      shader: "Universal Render Pipeline/Lit"
    on_error: stop

  - name: Assign Textures
    tool: set_material_textures
    params:
      material: "{{ model_name }}_Mat"
      albedo: "{{ model_name }}_Albedo.png"
      normal: "{{ model_name }}_Normal.png"
      occlusion: "{{ model_name }}_AO.png"
    on_error: stop

  - name: Set Material Properties
    tool: set_material_property
    params:
      material: "{{ model_name }}_Mat"
      properties:
        _Metallic: "{{ metallic }}"
        _Smoothness: "{{ smoothness }}"
    on_error: continue

  - name: Apply Material
    tool: set_material
    params:
      target: "{{ model_name }}"
      material: "{{ model_name }}_Mat"
    on_error: stop

  - name: Configure LOD Group
    tool: create_lod_group
    params:
      target: "{{ model_name }}"
      lod_levels:
        - ratio: 1.0
          screen_percentage: 0.6
        - ratio: "{{ lod1_ratio }}"
          screen_percentage: 0.3
        - ratio: "{{ lod2_ratio }}"
          screen_percentage: 0.1
      cull_below: 0.1
    on_error: continue

  - name: Add BoxCollider
    tool: add_component
    params:
      target: "{{ model_name }}"
      component: "BoxCollider"
      auto_fit: true
    on_error: continue

  - name: Create Prefab
    tool: create_prefab
    params:
      source: "{{ model_name }}"
      path: "{{ prefab_path }}/{{ model_name }}.prefab"
    on_error: stop
```

### Running the Recipe

**You:**
> Run this recipe. Change model_name to "IronChest".

**AI Response Example:**
```
Running recipe blender-to-unity-asset.
Variable override: model_name = "IronChest"

[1/17] Mesh Optimization (Body)... Done
[2/17] Mesh Optimization (Lid)... Done
[3/17] Mesh Cleanup (Body)... Done
[4/17] Mesh Cleanup (Lid)... Done
[5/17] Albedo Bake... Done
[6/17] Normal Map Bake... Done
[7/17] AO Bake... Done
[8/17] FBX Export... Done
[9/17] Wait for Import... Done (3.2s)
[10/17] Create Material... Done
[11/17] Assign Textures... Done
[12/17] Set Material Properties... Done
[13/17] Apply Material... Done
[14/17] Configure LOD Group... Done
[15/17] Add BoxCollider... Done
[16/17] Create Prefab... Done

All 17 steps completed successfully.
Prefab: Assets/Prefabs/Props/IronChest.prefab
```

## Error Handling Design

Each recipe step can have an `on_error` setting. Here are the design guidelines.

| Phase | on_error | Reason |
|-------|----------|--------|
| Decimate | `stop` | No point continuing with a broken mesh |
| Cleanup | `continue` | Zero duplicate vertices is not a problem. Treat as a warning |
| Texture Bake | `stop` | Missing textures make the material incomplete |
| FBX Export | `stop` | Export failure is critical |
| Import Wait | `stop` | Timeout suggests connection or path issues |
| Material Properties | `continue` | Default values are minimally functional |
| LOD Setup | `continue` | The asset still works without LODs |
| Prefab Creation | `stop` | Failing to produce the final output is a failure |

### Conditional Branching

Adding a `condition` to a step lets you control execution based on previous step results.

```yaml
  - name: High-poly Warning Check
    tool: blender_get_mesh_info
    params:
      object: "{{ body_object }}"

  - name: Decimate (only if polygon count is high)
    tool: blender_decimate
    condition: "{{ steps.High-poly Warning Check.result.polygon_count > 5000 }}"
    params:
      object: "{{ body_object }}"
      ratio: "{{ decimate_ratio }}"
```

## When to Use Pipelines vs. Recipes

| Aspect | Pipeline (Natural Language) | Recipe (YAML) |
|--------|---------------------------|---------------|
| Flexibility | High. AI judges based on the situation | Low. Executes exactly as defined |
| Reproducibility | Low. Same instructions may yield different results | High. Same input produces the same result |
| Best for | Exploratory work, one-off tasks | Repetitive tasks, team sharing, CI/CD |
| Error handling | AI autonomously attempts recovery | Explicitly controlled via on_error and condition |

In practice, the most efficient approach is to experiment with natural language first, then package the finalized steps into a recipe.
