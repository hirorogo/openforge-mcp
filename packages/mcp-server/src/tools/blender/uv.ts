import { ToolDefinition } from "../../registry.js";

const uvTools: ToolDefinition[] = [
  {
    name: "smart_uv_project",
    description: "Perform Smart UV Project on a mesh object for automatic UV unwrapping",
    category: "uv",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Mesh object name",
        },
        angle_limit: {
          type: "number",
          description: "Angle limit in degrees for projection",
          default: 66.0,
        },
        island_margin: {
          type: "number",
          description: "Margin between UV islands",
          default: 0.0,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "unwrap_uv",
    description: "Unwrap the UV map of a mesh object using angle-based or conformal method",
    category: "uv",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Mesh object name",
        },
        method: {
          type: "string",
          enum: ["ANGLE_BASED", "CONFORMAL"],
          description: "Unwrapping algorithm",
          default: "ANGLE_BASED",
        },
        margin: {
          type: "number",
          description: "Space between UV islands",
          default: 0.001,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "mark_seam",
    description: "Mark edges as UV seams to control unwrapping boundaries",
    category: "uv",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Mesh object name",
        },
        edge_indices: {
          type: "array",
          items: { type: "number" },
          description: "Indices of edges to mark as seams",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "clear_seam",
    description: "Clear UV seams from mesh edges",
    category: "uv",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Mesh object name",
        },
        edge_indices: {
          type: "array",
          items: { type: "number" },
          description: "Indices of edges to clear seams from",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "pack_uv_islands",
    description: "Pack UV islands to fit efficiently within the UV space",
    category: "uv",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Mesh object name",
        },
        margin: {
          type: "number",
          description: "Space between packed islands",
          default: 0.001,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "scale_uv",
    description: "Scale UV coordinates of a mesh along U and V axes",
    category: "uv",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Mesh object name",
        },
        scale_u: {
          type: "number",
          description: "Scale factor for U axis",
          default: 1.0,
        },
        scale_v: {
          type: "number",
          description: "Scale factor for V axis",
          default: 1.0,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "rotate_uv",
    description: "Rotate UV coordinates of a mesh around the UV center",
    category: "uv",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Mesh object name",
        },
        angle: {
          type: "number",
          description: "Rotation angle in degrees",
          default: 90.0,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "align_uv",
    description: "Align selected UV vertices to an axis",
    category: "uv",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Mesh object name",
        },
        axis: {
          type: "string",
          description: "Alignment axis (ALIGN_S, ALIGN_T, ALIGN_U, ALIGN_AUTO_V, or AUTO)",
          default: "AUTO",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "project_from_view",
    description: "Project UVs from the current 3D viewport view direction",
    category: "uv",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Mesh object name",
        },
        orthographic: {
          type: "boolean",
          description: "Use orthographic projection instead of perspective",
          default: false,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "reset_uv",
    description: "Reset UVs to default where each face fills the entire UV space",
    category: "uv",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Mesh object name",
        },
      },
      required: ["name"],
    },
  },
];

export default uvTools;
