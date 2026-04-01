# OpenForge MCP for VRChat Creators

A guide for VRChat world and avatar creators who want to use AI to speed up their workflow.

## What can you do?

Talk to your AI in plain language to control Unity and Blender. No coding knowledge required.

### World Creation

```
"Create a terrain with grass texture, 500x500 meters"
"Add directional lighting with warm color"
"Place 50 trees randomly across the terrain"
"Add a spawn point at the center"
"Set the skybox to a blue sky"
```

### Avatar Editing (Blender)

```
"Import the VRM file from Downloads folder"
"Reduce the polygon count to 70,000"
"Add a bevel modifier to smooth the edges"
"Create a glass material for the accessories"
"Export as VRM"
```

### Optimization

```
"Analyze the draw calls in this scene"
"Combine meshes that share the same material"
"Generate LOD groups for all objects"
"Set texture compression to ASTM for mobile"
"Show me a performance report"
```

### Materials and Visuals

```
"Create a toon shader material"
"Make an emission material with blue glow"
"Set up a 3-point studio lighting"
"Add fog and post-processing bloom"
```

## Setup

### Requirements

- Unity 2022.3.22f1 LTS (VRChat SDK compatible)
- Blender 3.6+ (for avatar editing)
- One of: Claude Desktop, Cursor, VS Code, LM Studio

### Installation

```bash
npx openforge-mcp setup
```

Then import the Unity plugin via `Tools > OpenForge > Setup`.

See [Getting Started](getting-started.md) for detailed steps.

## Tips for VRChat Development

### Use save points before big changes

```
"Save the project"
```

This creates a Git save point automatically. If something breaks:

```
"Restore the previous save"
```

### Be specific with your instructions

Good:
```
"Create a cube at position 0, 1, 0 with scale 2, 0.1, 2 as a floor"
```

Less useful:
```
"Make a floor"
```

The more detail you give, the better the result.

### Check the scene after changes

The AI can take screenshots of the viewport to see what it built:

```
"Take a screenshot of the scene view"
```

This lets the AI verify its work and make corrections.

### Working with VRChat SDK

OpenForge controls Unity Editor operations (creating objects, setting materials, writing scripts, etc.). VRChat SDK components can be added through the standard `add_component` tool:

```
"Add a VRC_SceneDescriptor component to the root object"
"Set the spawn point to position 0, 1, 0"
```

### Combining Blender and Unity

You can use both in a single conversation:

```
"In Blender, create a simple table model and export it as FBX"
"In Unity, import the FBX and place it at position 3, 0, 2"
"Create a wood material and apply it to the table"
```

## Useful Tool Categories

| What you want to do | Category | Example tools |
|---------------------|----------|---------------|
| Build the world | Scene, GameObject | create_scene, create_gameobject, set_transform |
| Set up lighting | Material | create_material, set_material_color |
| Write interaction scripts | Script | create_script, attach_script |
| Edit avatar mesh | Mesh (Blender) | decimate, bevel, subdivide |
| Create avatar materials | Material (Blender) | create_material, set_color, create_emission_material |
| Export/Import models | Object (Blender) | export as FBX, import VRM |
| Check performance | Screenshot | get_viewport_screenshot |

## FAQ

**Q: Can I use this with VRChat SDK?**
A: Yes. OpenForge operates Unity Editor functions. VRChat SDK is a set of Unity components, so they work together.

**Q: Does this support Udon / UdonSharp?**
A: You can create and edit UdonSharp scripts through the Script tools. Tell the AI to write in UdonSharp format.

**Q: Can I use this offline?**
A: The AI connection (Claude, etc.) requires internet. However, if you use LM Studio or Ollama with a local model, everything runs on your machine.

**Q: Is my project data sent anywhere?**
A: OpenForge runs locally. Your project files stay on your machine. The AI client sends only the text of your conversation and tool results to its API -- not your project files directly.
