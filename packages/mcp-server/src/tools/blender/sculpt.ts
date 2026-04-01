import { ToolDefinition } from "../../registry.js";

const sculptTools: ToolDefinition[] = [
  {
    name: "enter_sculpt_mode",
    description: "Enter sculpt mode for a mesh object",
    category: "sculpt",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object name" },
      },
      required: ["name"],
    },
  },
  {
    name: "set_sculpt_brush",
    description: "Set the active sculpt brush type (draw, clay, smooth, grab, etc.)",
    category: "sculpt",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        brush_type: {
          type: "string",
          enum: ["DRAW", "CLAY", "CLAY_STRIPS", "LAYER", "INFLATE", "BLOB", "CREASE", "SMOOTH", "FLATTEN", "FILL", "SCRAPE", "PINCH", "GRAB", "SNAKE_HOOK", "THUMB", "NUDGE", "ROTATE", "MASK"],
          description: "Brush type",
          default: "DRAW",
        },
      },
    },
  },
  {
    name: "set_brush_strength",
    description: "Set the strength of the current sculpt brush",
    category: "sculpt",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        strength: { type: "number", description: "Brush strength (0-1)", default: 0.5 },
      },
    },
  },
  {
    name: "set_brush_radius",
    description: "Set the radius of the current sculpt brush in pixels",
    category: "sculpt",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        radius: { type: "number", description: "Brush radius in pixels", default: 50 },
      },
    },
  },
  {
    name: "enable_dynamic_topology",
    description: "Enable dynamic topology (dyntopo) for adaptive detail sculpting",
    category: "sculpt",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object name" },
        detail_size: { type: "number", description: "Detail level", default: 12.0 },
        detail_mode: {
          type: "string",
          enum: ["RELATIVE_DETAIL", "CONSTANT_DETAIL", "BRUSH_DETAIL"],
          description: "Detail calculation mode",
          default: "RELATIVE_DETAIL",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "smooth_mesh",
    description: "Smooth a mesh using the smooth vertices operator",
    category: "sculpt",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object name" },
        iterations: { type: "number", description: "Smoothing passes", default: 1 },
        factor: { type: "number", description: "Smoothing factor (0-1)", default: 0.5 },
      },
      required: ["name"],
    },
  },
  {
    name: "remesh_voxel",
    description: "Apply voxel remeshing to regenerate mesh topology at a uniform resolution",
    category: "sculpt",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object name" },
        voxel_size: { type: "number", description: "Voxel size (smaller = more detail)", default: 0.1 },
        adaptivity: { type: "number", description: "Adaptivity for flat areas (0-1)", default: 0.0 },
      },
      required: ["name"],
    },
  },
  {
    name: "apply_sculpt",
    description: "Exit sculpt mode and return to object mode preserving all changes",
    category: "sculpt",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object name" },
      },
      required: ["name"],
    },
  },
  {
    name: "symmetrize_mesh",
    description: "Symmetrize a mesh by mirroring one half onto the other",
    category: "sculpt",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object name" },
        direction: {
          type: "string",
          enum: ["NEGATIVE_X", "POSITIVE_X", "NEGATIVE_Y", "POSITIVE_Y", "NEGATIVE_Z", "POSITIVE_Z"],
          description: "Symmetry direction",
          default: "NEGATIVE_X",
        },
        threshold: { type: "number", description: "Merge distance threshold", default: 0.001 },
      },
      required: ["name"],
    },
  },
  {
    name: "set_smooth_shading",
    description: "Set smooth or flat shading on a mesh object with auto-smooth angle",
    category: "sculpt",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object name" },
        smooth: { type: "boolean", description: "True for smooth, false for flat", default: true },
        auto_smooth_angle: { type: "number", description: "Auto smooth angle in degrees", default: 30.0 },
      },
      required: ["name"],
    },
  },
];

export default sculptTools;
