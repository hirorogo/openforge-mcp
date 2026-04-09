---
sidebar_position: 3
title: "Advanced Shader and Material Setup"
description: "Shader Graph material creation, PBR texture workflows, and Poly Haven integration"
---

# Advanced Shader and Material Setup

Use OpenForge MCP to efficiently create and manage Shader Graph-based materials. This covers PBR texture setup, material variants, lightmap baking, and texture retrieval from Poly Haven.

## Prerequisites

- Unity (URP or HDRP) is running and connected to OpenForge MCP
- Shader Graph package is installed
- You understand the basics of PBR workflows (Metallic/Roughness)

## PBR Texture Workflow

PBR (Physically Based Rendering) materials are composed of the following texture maps.

| Map | Role | Channels |
|-----|------|----------|
| Albedo (Base Color) | Surface color. Pure color without lighting influence | RGB |
| Normal Map | Simulates surface bumps and detail | RGB (tangent space) |
| Metallic | Defines whether the surface is metal or non-metal | R (grayscale) |
| Roughness (Smoothness) | Surface roughness. Unity uses Smoothness (1 - Roughness) | R (grayscale) |
| Ambient Occlusion | Environmental light occlusion. Darkens crevices and corners | R (grayscale) |
| Height (Displacement) | Actually deforms the mesh. Also used for Parallax Mapping | R (grayscale) |

:::tip Metallic vs Smoothness
In Unity's Standard/URP Lit shader, the Metallic map's Alpha channel is used as Smoothness. When using an external Roughness map, you need to invert the values.
:::

## Step 1: Retrieve Textures from Poly Haven

Poly Haven provides CC0-licensed PBR textures. You can download them directly through OpenForge MCP.

**You:**
> Download the "castle_brick" texture from Poly Haven at 2K resolution. Get all the necessary maps.

**AI Response Example:**
```
Downloaded textures from Poly Haven.

castle_brick_wall_03 (2048x2048):
  - castle_brick_wall_03_diff_2k.png  (Albedo)
  - castle_brick_wall_03_nor_gl_2k.png (Normal, OpenGL)
  - castle_brick_wall_03_arm_2k.png   (AO/Roughness/Metallic packed)
  - castle_brick_wall_03_disp_2k.png  (Displacement)

Saved to: Assets/Textures/PolyHaven/castle_brick_wall_03/
```

The ARM texture has AO (R), Roughness (G), and Metallic (B) packed together. If it does not match Unity's channel packing, separation is required.

## Step 2: Create a Material

**You:**
> Create a URP Lit material named "M_CastleBrick". Assign all the downloaded textures. Convert Roughness to Smoothness.

**AI Response Example:**
```
Created material M_CastleBrick.

Shader: Universal Render Pipeline/Lit
Texture assignments:
  Base Map: castle_brick_wall_03_diff_2k.png
  Normal Map: castle_brick_wall_03_nor_gl_2k.png (Scale: 1.0)
  Metallic Map: B channel of castle_brick_wall_03_arm_2k.png
  Smoothness Source: Metallic Alpha
  Occlusion Map: R channel of castle_brick_wall_03_arm_2k.png

Applied Roughness -> Smoothness conversion.
  (Inverted the ARM texture's G channel and set it as Smoothness)

Height Map: castle_brick_wall_03_disp_2k.png
  Parallax: Enabled (Scale: 0.02)
```

## Step 3: Create a Custom Shader Graph

When the standard shader is not enough, create a Shader Graph. Here we build a weathered brick shader.

**You:**
> Create a Shader Graph called "SG_WeatheredBrick". URP Lit base with the following features:
> - Base Map and Normal Map inputs
> - Float parameter "_WeatherAmount" (0-1) to control weathering
> - Weathering darkens the Albedo and increases Roughness
> - Blend a moss texture only on top-facing surfaces (World Normal Y > 0.7)
> - Moss amount also controlled by "_MossAmount" parameter

**AI Response Example:**
```
Created Shader Graph "SG_WeatheredBrick".

Path: Assets/Shaders/SG_WeatheredBrick.shadergraph

Properties:
  _BaseMap (Texture2D) - Main texture
  _NormalMap (Texture2D) - Normal map
  _MossMap (Texture2D) - Moss texture
  _MossNormal (Texture2D) - Moss normal map
  _WeatherAmount (Float, 0-1, default 0.3) - Weathering amount
  _MossAmount (Float, 0-1, default 0.5) - Moss amount
  _MossThreshold (Float, 0-1, default 0.7) - Normal Y threshold for moss growth

Node structure:
  1. Sample Texture 2D (_BaseMap) -> Lerp (toward darker color) -> controlled by _WeatherAmount
  2. World Normal Y -> Step (_MossThreshold) -> Multiply (_MossAmount)
     -> blend mask with moss texture
  3. Lerp between Base Albedo and Moss Albedo -> Fragment Base Color
  4. Roughness: interpolate from 0.4 -> 0.9 based on _WeatherAmount
  5. Normal: Blend Base Normal and Moss Normal
```

## Step 4: Create Material Variants

Create variants with different parameter values using the same shader.

**You:**
> Create 3 variants using SG_WeatheredBrick:
> - M_Brick_New: WeatherAmount=0, MossAmount=0 (new)
> - M_Brick_Old: WeatherAmount=0.6, MossAmount=0.3 (aged)
> - M_Brick_Ruins: WeatherAmount=0.9, MossAmount=0.8 (ruins)
> Use the same Base Map and Normal Map for all.

**AI Response Example:**
```
Created 3 material variants.

M_Brick_New:
  Shader: SG_WeatheredBrick
  _WeatherAmount: 0.0
  _MossAmount: 0.0
  Appearance: Clean brick, vibrant colors

M_Brick_Old:
  Shader: SG_WeatheredBrick
  _WeatherAmount: 0.6
  _MossAmount: 0.3
  Appearance: Faded color, partial moss coverage

M_Brick_Ruins:
  Shader: SG_WeatheredBrick
  _WeatherAmount: 0.9
  _MossAmount: 0.8
  Appearance: Very dark, covered in moss

Saved to: Assets/Materials/Brick/
```

**You:**
> Create comparison objects with all 3 materials side by side and take a screenshot.

**AI Response Example:**
```
Built comparison scene.
- 3 Cubes (2m x 2m x 2m) placed side by side
- Left: M_Brick_New / Center: M_Brick_Old / Right: M_Brick_Ruins
- Directional light + ambient light configured
Screenshot captured.
```

## Step 5: Lightmap Baking

Bake lightmaps for static objects to improve performance.

**You:**
> Set all walls and floors to Static. Bake lightmaps with the following settings:
> - Lightmapper: Progressive GPU
> - Lightmap Resolution: 40 texels/unit
> - Bounce: 2
> - Ambient Occlusion: Enabled, Distance 1.0
> - Directional Mode: Directional

**AI Response Example:**
```
Applied lightmap bake settings.

Static settings:
  - Wall_North: Contribute GI + Receive GI (Static)
  - Wall_South: Contribute GI + Receive GI (Static)
  - Wall_East: Contribute GI + Receive GI (Static)
  - Wall_West: Contribute GI + Receive GI (Static)
  - Floor: Contribute GI + Receive GI (Static)

Bake settings:
  Lightmapper: Progressive GPU
  Resolution: 40 texels/unit
  Bounces: 2
  AO: Enabled (Distance: 1.0)
  Directional Mode: Directional

Starting bake...
Bake complete (18.3 seconds)
  Lightmaps: 2 (1024x1024)
  Total texels: 2,097,152
```

## Pipeline: From Texture Retrieval to Material Application

Here is the complete flow summarized as a recipe.

```yaml
name: pbr-material-pipeline
description: Create and apply a material from Poly Haven textures
version: "1.0"

variables:
  texture_name: "castle_brick_wall_03"
  resolution: "2k"
  material_name: "M_CastleBrick"
  target_objects:
    - "Wall_North"
    - "Wall_South"
    - "Wall_East"
    - "Wall_West"
  tiling_x: 3.0
  tiling_y: 3.0

steps:
  - name: Download Textures
    tool: download_polyhaven
    params:
      asset_name: "{{ texture_name }}"
      resolution: "{{ resolution }}"
      types: ["diffuse", "normal", "arm", "displacement"]
      output_dir: "Assets/Textures/PolyHaven/{{ texture_name }}"
    on_error: stop

  - name: Texture Import Settings
    tool: set_texture_import_settings
    params:
      path: "Assets/Textures/PolyHaven/{{ texture_name }}"
      settings:
        - pattern: "*_nor_*"
          type: "NormalMap"
        - pattern: "*_arm_*"
          type: "Default"
          sRGB: false
        - pattern: "*_disp_*"
          type: "Default"
          sRGB: false
    on_error: continue

  - name: Create Material
    tool: create_material
    params:
      name: "{{ material_name }}"
      shader: "Universal Render Pipeline/Lit"
    on_error: stop

  - name: Assign Textures
    tool: set_material_textures
    params:
      material: "{{ material_name }}"
      albedo: "{{ texture_name }}_diff_{{ resolution }}.png"
      normal: "{{ texture_name }}_nor_gl_{{ resolution }}.png"
      metallic_ao_packed: "{{ texture_name }}_arm_{{ resolution }}.png"
      height: "{{ texture_name }}_disp_{{ resolution }}.png"
    on_error: stop

  - name: Tiling Settings
    tool: set_material_property
    params:
      material: "{{ material_name }}"
      properties:
        _BaseMap_ST: { x: "{{ tiling_x }}", y: "{{ tiling_y }}", z: 0, w: 0 }
    on_error: continue

  - name: Apply Material
    tool: set_material_batch
    params:
      targets: "{{ target_objects }}"
      material: "{{ material_name }}"
    on_error: stop

  - name: Confirmation Screenshot
    tool: take_screenshot
    params:
      width: 1920
      height: 1080
    on_error: continue
```

## ARM Texture Channel Separation

To correctly use Poly Haven's ARM texture (AO/Roughness/Metallic packed) in Unity, you need to understand the channel mapping.

| ARM Channel | Content | Unity Usage |
|-------------|---------|-------------|
| R | Ambient Occlusion | Set as Occlusion Map |
| G | Roughness | Invert and use as Smoothness |
| B | Metallic | Set as Metallic Map |

**You:**
> Separate the ARM texture channels for Unity. Invert Roughness to Smoothness.

**AI Response Example:**
```
Channel separation complete.

Input: castle_brick_wall_03_arm_2k.png
Output:
  - castle_brick_wall_03_ao_2k.png (R channel)
  - castle_brick_wall_03_smoothness_2k.png (G channel inverted)
  - castle_brick_wall_03_metallic_2k.png (B channel)

Saved to: Assets/Textures/PolyHaven/castle_brick_wall_03/
```

## Texture Atlasing

When consolidating multiple materials into one to reduce draw calls, texture atlasing is effective.

**You:**
> Combine the Albedo textures of M_Brick_New, M_Brick_Old, and M_Brick_Ruins into a single atlas. Adjust UVs too.

**AI Response Example:**
```
Texture atlas created.

Atlas: Atlas_Brick_Albedo.png (4096x4096)
  Top-left: M_Brick_New Albedo (2048x2048)
  Top-right: M_Brick_Old Albedo (2048x2048)
  Bottom-left: M_Brick_Ruins Albedo (2048x2048)
  Bottom-right: (empty)

UV adjustments:
  M_Brick_New objects: UV remapped to (0,0.5)-(0.5,1.0)
  M_Brick_Old objects: UV remapped to (0.5,0.5)-(1.0,1.0)
  M_Brick_Ruins objects: UV remapped to (0,0)-(0.5,0.5)

Material consolidation: Atlas_Brick_Mat (1 material, 1 draw call)
```

This technique is also covered in detail in the [Performance Optimization Guide](./performance-optimization.md).
