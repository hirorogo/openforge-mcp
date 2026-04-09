---
sidebar_position: 7
title: "Texture Editing"
description: "Color changes, gradients, pattern generation, and decal compositing using OpenForge MCP texture editing tools"
---

# Texture Editing

This guide explains how to edit textures for avatars and worlds using OpenForge MCP's texture editing tools. You can change hair color, recolor outfits, generate patterns, and composite logos -- all through natural language, without image editing software.

## What You Can Do with Texture Editing

| Tool | Purpose | Example |
|---|---|---|
| `adjust_hsv` | Adjust hue, saturation, and value | Change hair color from brown to blonde |
| `apply_gradient` | Apply gradients | Add a top-to-bottom color gradient to an outfit |
| `generate_pattern` | Generate patterns | Create stripes, checks, or dots |
| `overlay_decal` | Composite a decal (image) | Place a logo or emblem on an outfit |
| `swap_color` | Replace a specific color | Change all red areas to blue |
| `batch_recolor` | Batch color change | Change the entire outfit color scheme |
| `export_texture` | Export edited textures | Save as PNG / TGA |

## Changing Hair Color (adjust_hsv)

`adjust_hsv` adjusts the Hue, Saturation, and Value of a texture.

### Basic Hair Color Change

**You:**
> Change the hair texture color. Change it from the current brown to blonde.

**AI action:** `adjust_hsv` runs, shifting the hue of the hair texture.

**AI response example:**

```
Texture editing complete:
  Target: Hair_Texture.png
  Hue shift: +30 degrees
  Saturation adjustment: +15%
  Value adjustment: +20%
  -> Changed from brown to blonde
```

**You:**
> Show me a screenshot to check.

### Fine-Tuning

**You:**
> Add a bit more red tint. Increase the saturation slightly too.

**AI action:** The hue and saturation are readjusted.

**You:**
> I want a dark silver. Lower the saturation and raise the value.

**AI action:** Saturation is reduced (removing color intensity) and value is raised (making it brighter). The result is a silver-like tone.

:::tip Color Adjustment Parameters
Hue is a value from 0 to 360 degrees that specifies the color type. Saturation controls color vibrancy, and Value controls brightness. If you say "more reddish" or "darker" in natural language, the AI will set the appropriate parameters.
:::

## Applying Gradients (apply_gradient)

Apply gradients (gradual color transitions) to outfits and objects.

**You:**
> Add a gradient to the skirt texture from top to bottom. Dark navy at the top, fading to light sky blue at the bottom.

**AI action:** `apply_gradient` runs, applying a vertical gradient to the skirt texture.

**AI response example:**

```
Gradient applied:
  Target: Skirt_Texture.png
  Direction: top -> bottom
  Start color: #1a237e (dark navy)
  End color: #81d4fa (light sky blue)
  Blend mode: multiply
```

### Gradient Directions

**You:**
> Add a left-to-right gradient to the socks texture. White to pink.

**AI action:** A horizontal gradient is applied.

Available directions:

| Direction | Description |
|---|---|
| Top -> bottom | Vertical (most common) |
| Bottom -> top | Reverse vertical |
| Left -> right | Horizontal |
| Right -> left | Reverse horizontal |
| Center -> outside | Radial |

## Generating Patterns (generate_pattern)

Generate stripe, check, dot, and other patterns as textures.

### Stripes

**You:**
> Generate a red and white stripe pattern. Vertical stripes, evenly spaced.

**AI action:** `generate_pattern` runs, generating a stripe pattern texture.

**AI response example:**

```
Pattern generated:
  Type: Stripes (vertical)
  Color 1: #e53935 (red)
  Color 2: #ffffff (white)
  Stripe width: even (32px)
  Resolution: 1024x1024
```

### Checks

**You:**
> Generate a black and white check pattern. Each square should be 64px.

**AI action:** A check pattern is generated.

### Dots

**You:**
> Generate a white dot pattern on a navy background. Dot diameter 16px, spacing 48px.

**AI action:** A dot pattern is generated.

### Applying Generated Patterns

**You:**
> Apply the generated stripe pattern to the socks texture.

**AI action:** The generated pattern texture is applied to the socks material.

## Compositing Decals (overlay_decal)

Overlay another image (logo, emblem, text, etc.) on top of an existing texture.

**You:**
> Composite "logo.png" onto the T-shirt texture at the chest position. Width 200px.

**AI action:** `overlay_decal` runs, compositing the logo image onto the T-shirt texture.

**AI response example:**

```
Decal composited:
  Base texture: TShirt_Texture.png
  Decal: logo.png
  Position: (412, 280) - near chest center
  Size: 200 x 150 px (aspect ratio maintained)
  Blend mode: normal
```

**You:**
> Move the position up a bit. Set the opacity to 80%.

**AI action:** The decal position and opacity are adjusted.

:::info Specifying Composite Position
You can specify precise pixel coordinates on the texture, or use natural language like "chest center" or "upper back". For natural language, the AI estimates the appropriate position considering the texture's UV mapping.
:::

## Color Replacement (swap_color)

Replace a specific color in the texture with another color.

**You:**
> Change all red areas in the outfit texture to blue.

**AI action:** `swap_color` runs, replacing red-hue pixels with blue.

**AI response example:**

```
Color replacement complete:
  Target: Outfit_Texture.png
  Before: red range (H: 340-20, S: 50-100%, V: 30-100%)
  After: blue range (H: 220, S: same values, V: same values)
  Replaced pixels: 48,320 / 1,048,576 (4.6%)
```

**You:**
> Change the green areas to yellow too.

**AI action:** Green-hue areas are additionally replaced with yellow.

:::warning Color Replacement Range
Color replacement converts all colors with similar hues at once. Gradients at the boundaries may look unnatural. If this occurs, narrow the color range or consider using HSV adjustment (`adjust_hsv`) instead.
:::

## Batch Color Change (batch_recolor)

Change the entire color scheme of an outfit at once. Unlike `swap_color`, which replaces individual colors, `batch_recolor` changes multiple colors simultaneously for a cohesive result.

**You:**
> Change the entire outfit color scheme. Convert the current red-based palette to a blue-based one.

**AI action:** `batch_recolor` runs, shifting the hue across the entire texture.

**AI response example:**

```
Batch color change complete:
  Target: Outfit_Texture.png
  Changes:
    Main color: #c62828 (red) -> #1565c0 (blue)
    Sub color: #ef5350 (light red) -> #42a5f5 (light blue)
    Accent color: #b71c1c (dark red) -> #0d47a1 (dark blue)
  Converted while maintaining color harmony
```

**You:**
> Keep the gold on the buttons and trim unchanged.

**AI action:** The gold color range is excluded from the mask and the operation re-runs.

## Exporting Textures (export_texture)

Export edited textures as files.

**You:**
> Export the edited hair texture as PNG.

**AI action:** `export_texture` runs and the texture file is saved.

**AI response example:**

```
Texture export complete:
  File: Assets/Textures/Hair_Texture_edited.png
  Resolution: 2048 x 2048
  Format: PNG (32bit RGBA)
  File size: 4.2 MB
```

:::tip Texture Backup
Texture editing does not overwrite the original file; it saves as a new file. The original texture remains intact, so you can always revert.
:::

## Practical Example: Outfit Color Variations

Create multiple color variations from a single outfit texture.

**You:**
> Create 3 color variations of the outfit texture. Red, blue, and green schemes.

**AI action:** Three color variations are generated from the original texture.

**AI response example:**

```
Color variations created:
  1. Outfit_Red.png - red scheme (adjusted from original hue)
  2. Outfit_Blue.png - blue scheme (hue shift: +120 degrees)
  3. Outfit_Green.png - green scheme (hue shift: +240 degrees)
Each texture saved to Assets/Textures/
```

**You:**
> Show me a screenshot with all 3 variations side by side.

Check the results of each variation here.

## Texture Editing Best Practices

| Item | Recommendation |
|---|---|
| Resolution | Avatar: 2048x2048 or less, World: 512-2048 depending on use |
| File format | PNG (with transparency), TGA (Unity standard) |
| Color space | sRGB (textures), Linear (normal maps) |
| File size | Keep size down to reduce VRAM consumption |

:::warning Texture Size and Performance
Larger textures consume more VRAM. This also affects VRChat performance rank. Keep textures as small as practical. If a 4096x4096 texture offers no visible improvement, downscale it to 2048x2048.
:::

## Next Steps

After completing texture editing, see the following guides:

- [Avatar Setup](./avatar-setup.md) -- Avatar settings after texture changes
- [Performance Optimization](./optimization.md) -- Texture size optimization
- [Upload](./upload.md) -- Upload to VRChat
