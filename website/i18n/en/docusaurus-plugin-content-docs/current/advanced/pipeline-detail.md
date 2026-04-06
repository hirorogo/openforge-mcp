---
sidebar_position: 7
title: "Cross-App Pipeline Details"
description: "How the file transfer pipeline between Blender and Unity works, and supported formats"
---

# Cross-App Pipeline Details

The OpenForge MCP cross-app pipeline automatically transfers models created in Blender to Unity or Godot. This guide covers the internals of file transfer, supported formats, and troubleshooting.

## How file transfer works

The cross-app pipeline exchanges files through a shared directory.

```
Blender                    Shared directory                  Unity / Godot
                                                        
Create model  -->  Export as               -->  Auto-detect and
                   FBX/glTF                     import
                                                        
                   ~/OpenForge/shared/                     
```

### Processing flow

1. The AI instructs Blender to model something
2. The Blender plugin exports the model in the specified format
3. The exported file is saved to the shared directory
4. The Unity / Godot plugin monitors the shared directory
5. When a new file is detected, the import process runs automatically
6. Once the import completes, the AI is notified of the result

### Shared directory

The default shared directory locations:

| OS | Path |
|---|---|
| Windows | `%USERPROFILE%/OpenForge/shared/` |
| macOS | `~/OpenForge/shared/` |
| Linux | `~/OpenForge/shared/` |

You can customize the location in the configuration file:

```json
{
  "shared_directory": "D:/MyProject/shared_assets"
}
```

:::tip Separate by project
When working on multiple projects simultaneously, using separate shared directories per project keeps files from getting mixed up and makes management easier.
:::

## Supported formats

### FBX (.fbx)

**Use case:** The most suitable format for transferring to Unity.

| Item | Support |
|---|---|
| Meshes | Supported |
| Materials | Supported (basic settings only) |
| Textures | Embedded or external reference |
| Armature/Bones | Supported |
| Animations | Supported |
| Shape keys | Supported |

```
Blender --(FBX)--> Unity
```

:::info Why FBX is recommended
Unity has the best support for FBX. Materials, bones, and animations transfer reliably, so use FBX unless you have a specific reason not to.
:::

### glTF / GLB (.gltf / .glb)

**Use case:** Suitable when you prioritize open standards or the web.

| Item | Support |
|---|---|
| Meshes | Supported |
| Materials | PBR materials supported |
| Textures | GLB: embedded; glTF: external reference |
| Armature/Bones | Supported |
| Animations | Supported |
| Shape keys | Supported |

```
Blender --(glTF/GLB)--> Unity / Godot
```

GLB bundles everything into a single file, making it easy to handle. glTF keeps textures as separate files, which is convenient when you want to swap textures independently.

### OBJ (.obj)

**Use case:** Simple mesh exchange.

| Item | Support |
|---|---|
| Meshes | Supported |
| Materials | Basic color information via MTL file |
| Textures | External reference |
| Armature/Bones | Not supported |
| Animations | Not supported |
| Shape keys | Not supported |

```
Blender --(OBJ)--> Unity / Godot
```

:::warning OBJ limitations
OBJ cannot include bones or animations. Use it only for static meshes (buildings, furniture, props, etc.). It is not suitable for character models.
:::

### VRM (.vrm)

**Use case:** Humanoid avatar exchange.

| Item | Support |
|---|---|
| Meshes | Supported |
| Materials | MToon / Unlit / PBR |
| Textures | Embedded |
| Armature/Bones | Supported (humanoid only) |
| Animations | Not supported (poses only) |
| Shape keys | Supported (facial expressions) |
| VRM-specific data | License info, spring bone settings, etc. |

```
Blender --(VRM)--> Unity
```

VRM is a humanoid avatar format based on glTF. It is ideal for avatar creation workflows targeting platforms like VRChat and cluster.

## Walkthrough: Model in Blender, import into Unity

Here is a step-by-step example.

### Step 1: Create a model in Blender

**You:**
> Make a chair in Blender. The seat should be a flat square, and use four cylinders for the legs.

**What happens:** A chair model is created in Blender.

### Step 2: Set up materials

**You:**
> Add a wood-like material to the chair. Use a brown base color.

**What happens:** A Principled BSDF material is applied, turning the chair brown.

### Step 3: Optimize the mesh

Before sending to Unity, optimize the mesh.

**You:**
> Show me the polygon count of the chair. Reduce it if there are too many.

**What happens:** The current polygon count is reported, and a Decimate modifier is applied if needed.

### Step 4: Export to Unity

**You:**
> Send this chair to Unity in FBX format.

**What happens:** The following runs automatically:

1. FBX export is executed in Blender
2. The FBX file is saved to the shared directory
3. The Unity plugin detects the file
4. The model is imported into Unity
5. The import result is reported to the AI

**You:**
> Place the imported chair in the scene.

**What happens:** The imported chair prefab from the Assets folder is placed in the scene.

### Step 5: Adjust in Unity

**You:**
> Check the scale of the chair. Is it the same size as in Blender?

**What happens:** The object's scale in Unity is reported. If there is a scale difference from Blender, you can adjust it here.

:::tip Unifying scale
Blender and Unity have different default unit systems. Both use 1 unit = 1 meter, but depending on the FBX export scale settings, the model can end up 100x larger. Setting "Apply Scalings: FBX Units Scale" in the export settings helps keep scales consistent.
:::

## Format selection guide

If you are unsure which format to use, refer to this table.

| Use case | Recommended format | Reason |
|---|---|---|
| Send characters to Unity | FBX | Most reliable bone and animation support |
| Send static models to Unity | FBX or glTF | Either works well |
| Send models to Godot | glTF / GLB | Godot has strong glTF support |
| Send avatars | VRM | Preserves humanoid-specific information |
| Send simple meshes only | OBJ | Simplest and most compatible |
| Bundle textures into one file | GLB | Everything is embedded in a single binary |

## Troubleshooting

### Model does not appear in Unity

**Things to check:**
1. Was the file exported to the shared directory?
2. Is the Unity plugin running and monitoring the shared directory?
3. Are there any errors in the Unity Console?
4. Does the imported file exist in the Assets folder?

### Textures are missing (appear white)

**Causes and solutions:**
- **FBX:** Check the texture embedding settings. Enable "Path Mode: Copy" and "Embed Textures" during export to embed textures in the FBX.
- **glTF:** Use GLB format, which automatically embeds textures.
- **OBJ:** Verify that the MTL file and texture image files are in the same directory.

### Scale is wrong (too large or too small)

**Solutions:**
1. Check the "Apply Scalings" setting in Blender's export options
2. Adjust the "Scale Factor" in Unity's import settings
3. If nothing else works, manually adjust the object's scale in Unity

**You:**
> Set the imported chair's scale to 0.01

### Materials look different

Blender and Unity use different rendering engines, so materials will not look identical.

**Solutions:**
- FBX: You may need to manually adjust materials in Unity
- glTF: PBR materials are reproduced relatively faithfully

**You:**
> Check the materials on the imported chair. Adjust if the colors are off.

### Bones are not working correctly

**Things to check:**
1. Was the armature applied in Blender before export?
2. Does the FBX export include "Armature"?
3. Is the "Animation Type" correct in Unity's import settings under the "Rig" tab (Humanoid or Generic)?

:::warning Axis differences for bones
Blender and Unity use different coordinate axes (Blender: Z-up, Unity: Y-up). Axis conversion happens automatically during FBX export, but occasionally unintended rotation is introduced. If that happens, adjust the "Forward" and "Up" axis settings in the export options.
:::

## Summary

- The cross-app pipeline transfers files through a shared directory
- Four formats are supported: FBX, glTF/GLB, OBJ, and VRM
- FBX is recommended for Unity; glTF is recommended for Godot
- Scale, texture, and material differences are common issues -- always verify after transfer
- All operations can be directed in natural language, so you do not need to touch complex export settings manually
