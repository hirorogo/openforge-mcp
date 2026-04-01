import { ToolDefinition } from "../../registry.js";

const uvAdvancedTools: ToolDefinition[] = [
  {
    name: "cube_project",
    description: "Apply cube projection UV mapping",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        cube_size: { type: "number", description: "Cube projection size", default: 1.0 },
      },
      required: ["name"],
    },
  },
  {
    name: "cylinder_project",
    description: "Apply cylinder projection UV mapping",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        direction: { type: "string", enum: ["VIEW_ON_EQUATOR", "VIEW_ON_POLES", "ALIGN_TO_OBJECT"], default: "VIEW_ON_EQUATOR" },
        align: { type: "string", enum: ["POLAR_ZX", "POLAR_ZY"], default: "POLAR_ZX" },
        scale_to_bounds: { type: "boolean", description: "Scale to fit bounds", default: true },
      },
      required: ["name"],
    },
  },
  {
    name: "sphere_project",
    description: "Apply sphere projection UV mapping",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        direction: { type: "string", enum: ["VIEW_ON_EQUATOR", "VIEW_ON_POLES", "ALIGN_TO_OBJECT"], default: "VIEW_ON_EQUATOR" },
        align: { type: "string", enum: ["POLAR_ZX", "POLAR_ZY"], default: "POLAR_ZX" },
        scale_to_bounds: { type: "boolean", description: "Scale to fit bounds", default: true },
      },
      required: ["name"],
    },
  },
  {
    name: "create_uv_layer",
    description: "Create a new UV layer on a mesh",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        layer_name: { type: "string", description: "UV layer name", default: "UVMap" },
        set_active: { type: "boolean", description: "Set as active layer", default: true },
      },
      required: ["name"],
    },
  },
  {
    name: "list_uv_layers",
    description: "List all UV layers on a mesh",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
      },
      required: ["name"],
    },
  },
  {
    name: "delete_uv_layer",
    description: "Delete a UV layer from a mesh",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        layer_name: { type: "string", description: "UV layer name to delete" },
      },
      required: ["name", "layer_name"],
    },
  },
  {
    name: "rename_uv_layer",
    description: "Rename a UV layer",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        old_name: { type: "string", description: "Current layer name" },
        new_name: { type: "string", description: "New layer name" },
      },
      required: ["name", "old_name", "new_name"],
    },
  },
  {
    name: "set_active_uv",
    description: "Set the active UV layer",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        layer_name: { type: "string", description: "UV layer to make active" },
      },
      required: ["name", "layer_name"],
    },
  },
  {
    name: "average_island_scale",
    description: "Average UV island scales for uniform texel density",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
      },
      required: ["name"],
    },
  },
  {
    name: "minimize_stretch",
    description: "Minimize UV stretch to reduce distortion",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        iterations: { type: "number", description: "Relaxation iterations", default: 128 },
        blend: { type: "number", description: "Blend factor (0-1)", default: 1.0 },
      },
      required: ["name"],
    },
  },
  {
    name: "select_overlapping",
    description: "Select overlapping UV faces for fixing UV issues",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
      },
      required: ["name"],
    },
  },
  {
    name: "stitch_uvs",
    description: "Stitch selected UV edges together",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
      },
      required: ["name"],
    },
  },
  {
    name: "export_uv_layout",
    description: "Export UV layout as an image file (PNG or SVG)",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        filepath: { type: "string", description: "Output file path" },
        size_x: { type: "number", description: "Image width", default: 1024 },
        size_y: { type: "number", description: "Image height", default: 1024 },
        opacity: { type: "number", description: "Fill opacity (0-1)", default: 0.25 },
      },
      required: ["name", "filepath"],
    },
  },
  {
    name: "analyze_distortion",
    description: "Analyze UV distortion per face and return statistics on texel density",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
      },
      required: ["name"],
    },
  },
  {
    name: "get_uv_info",
    description: "Get UV information: island count, bounds, and total UV area",
    category: "uv_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
      },
      required: ["name"],
    },
  },
];

export default uvAdvancedTools;
