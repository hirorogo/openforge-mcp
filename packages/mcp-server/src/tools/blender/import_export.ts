import { ToolDefinition } from "../../registry.js";

const importExportTools: ToolDefinition[] = [
  {
    name: "import_fbx",
    description: "Import an FBX file with optional animation and scale settings",
    category: "import_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Path to the .fbx file" },
        use_anim: { type: "boolean", description: "Import animation data", default: true },
        global_scale: { type: "number", description: "Scale factor", default: 1.0 },
      },
      required: ["filepath"],
    },
  },
  {
    name: "export_fbx",
    description: "Export scene or selection to FBX format",
    category: "import_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Output .fbx path" },
        use_selection: { type: "boolean", description: "Export selection only", default: false },
        global_scale: { type: "number", description: "Scale factor", default: 1.0 },
        apply_modifiers: { type: "boolean", description: "Apply modifiers", default: true },
      },
      required: ["filepath"],
    },
  },
  {
    name: "import_obj",
    description: "Import an OBJ file",
    category: "import_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Path to the .obj file" },
      },
      required: ["filepath"],
    },
  },
  {
    name: "export_obj",
    description: "Export scene or selection to OBJ format",
    category: "import_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Output .obj path" },
        use_selection: { type: "boolean", description: "Export selection only", default: false },
        apply_modifiers: { type: "boolean", description: "Apply modifiers", default: true },
      },
      required: ["filepath"],
    },
  },
  {
    name: "import_gltf",
    description: "Import a glTF/GLB file",
    category: "import_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Path to the .gltf or .glb file" },
      },
      required: ["filepath"],
    },
  },
  {
    name: "export_gltf",
    description: "Export scene or selection to glTF/GLB format",
    category: "import_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Output path" },
        export_format: {
          type: "string",
          enum: ["GLB", "GLTF_SEPARATE", "GLTF_EMBEDDED"],
          description: "Export format variant",
          default: "GLB",
        },
        use_selection: { type: "boolean", description: "Export selection only", default: false },
        export_animations: { type: "boolean", description: "Include animations", default: true },
      },
      required: ["filepath"],
    },
  },
  {
    name: "import_stl",
    description: "Import an STL file (3D printing format)",
    category: "import_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Path to the .stl file" },
        global_scale: { type: "number", description: "Scale factor", default: 1.0 },
      },
      required: ["filepath"],
    },
  },
  {
    name: "export_stl",
    description: "Export scene or selection to STL format for 3D printing",
    category: "import_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Output .stl path" },
        use_selection: { type: "boolean", description: "Export selection only", default: false },
        global_scale: { type: "number", description: "Scale factor", default: 1.0 },
        ascii_format: { type: "boolean", description: "ASCII instead of binary", default: false },
      },
      required: ["filepath"],
    },
  },
  {
    name: "import_dae",
    description: "Import a Collada (.dae) file",
    category: "import_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Path to the .dae file" },
      },
      required: ["filepath"],
    },
  },
  {
    name: "export_dae",
    description: "Export scene or selection to Collada (.dae) format",
    category: "import_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Output .dae path" },
        use_selection: { type: "boolean", description: "Export selection only", default: false },
        apply_modifiers: { type: "boolean", description: "Apply modifiers", default: true },
      },
      required: ["filepath"],
    },
  },
];

export default importExportTools;
