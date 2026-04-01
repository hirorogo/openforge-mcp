import { ToolDefinition } from "../../registry.js";

const resourceTools: ToolDefinition[] = [
  {
    name: "create_material",
    description: "Create a new StandardMaterial3D or ShaderMaterial resource in Godot",
    category: "resource",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["StandardMaterial3D", "ShaderMaterial"],
          description: "Type of material to create",
        },
        name: {
          type: "string",
          description: "Resource name for the material",
        },
        albedoColor: {
          type: "object",
          properties: {
            r: { type: "number", description: "Red channel (0-1)" },
            g: { type: "number", description: "Green channel (0-1)" },
            b: { type: "number", description: "Blue channel (0-1)" },
            a: { type: "number", description: "Alpha channel (0-1)" },
          },
          required: ["r", "g", "b"],
          description: "Albedo color for StandardMaterial3D",
        },
        shaderCode: {
          type: "string",
          description: "Shader code string for ShaderMaterial",
        },
        metallic: {
          type: "number",
          description: "Metallic value (0-1) for StandardMaterial3D",
        },
        roughness: {
          type: "number",
          description: "Roughness value (0-1) for StandardMaterial3D",
        },
        savePath: {
          type: "string",
          description: "Optional res:// path to save the material as a .tres file",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "create_script",
    description: "Generate a GDScript file with the provided source code",
    category: "resource",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File path relative to res:// (e.g. res://scripts/player.gd)",
        },
        source: {
          type: "string",
          description: "Full GDScript source code",
        },
        baseClass: {
          type: "string",
          description: "Base class to extend (e.g. CharacterBody3D). Used if source is not provided to generate a template.",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "attach_script",
    description: "Attach an existing GDScript file to a node in the scene tree",
    category: "resource",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        nodePath: {
          type: "string",
          description: "Path to the target node",
        },
        scriptPath: {
          type: "string",
          description: "Resource path of the script (e.g. res://scripts/player.gd)",
        },
      },
      required: ["nodePath", "scriptPath"],
    },
  },
  {
    name: "load_scene",
    description: "Load a PackedScene file and optionally instance it into the current scene",
    category: "resource",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        scenePath: {
          type: "string",
          description: "Resource path of the scene file (e.g. res://scenes/enemy.tscn)",
        },
        parentPath: {
          type: "string",
          description: "If provided, instance the scene under this parent node. If omitted, only load without instancing.",
        },
        name: {
          type: "string",
          description: "Name for the instanced root node. If omitted, uses the scene's root name.",
        },
      },
      required: ["scenePath"],
    },
  },
  {
    name: "save_scene",
    description: "Save the current scene tree to a .tscn or .scn file",
    category: "resource",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File path to save to (e.g. res://scenes/main.tscn). If omitted, saves to the current scene's existing path.",
        },
      },
      required: [],
    },
  },
  {
    name: "create_mesh",
    description: "Create a primitive mesh resource (BoxMesh, SphereMesh, CylinderMesh, PlaneMesh, CapsuleMesh, PrismMesh, TorusMesh) and optionally assign it to a MeshInstance3D",
    category: "resource",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["BoxMesh", "SphereMesh", "CylinderMesh", "PlaneMesh", "CapsuleMesh", "PrismMesh", "TorusMesh"],
          description: "Type of primitive mesh to create",
        },
        nodePath: {
          type: "string",
          description: "Path to a MeshInstance3D node to assign the mesh to. If omitted, a new MeshInstance3D is created at the scene root.",
        },
        size: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            z: { type: "number" },
          },
          description: "Size of the mesh. Interpretation varies by type (width/height/depth for box, radius/height for cylinder, etc.)",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "set_material",
    description: "Apply a material to a MeshInstance3D node by surface index or material override",
    category: "resource",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        nodePath: {
          type: "string",
          description: "Path to the MeshInstance3D node",
        },
        materialPath: {
          type: "string",
          description: "Resource path of the material file (e.g. res://materials/red.tres)",
        },
        surfaceIndex: {
          type: "number",
          description: "Surface index to apply the material to. If omitted, sets the material override for the entire mesh.",
        },
      },
      required: ["nodePath", "materialPath"],
    },
  },
  {
    name: "import_asset",
    description: "Import an external file (image, model, audio) into the Godot project",
    category: "resource",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        sourcePath: {
          type: "string",
          description: "Absolute file system path to the source file",
        },
        targetPath: {
          type: "string",
          description: "Destination path inside the project (e.g. res://assets/texture.png)",
        },
        importType: {
          type: "string",
          enum: ["texture", "model", "audio", "font", "other"],
          description: "Hint for import type to configure import settings",
        },
      },
      required: ["sourcePath", "targetPath"],
    },
  },
];

export default resourceTools;
