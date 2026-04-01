import { ToolDefinition } from "../../registry.js";

const weightPaintTools: ToolDefinition[] = [
  {
    name: "auto_weights",
    description: "Apply automatic weights from armature bones to a mesh",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        armature_name: { type: "string", description: "Armature to weight to" },
      },
      required: ["name", "armature_name"],
    },
  },
  {
    name: "transfer_weights",
    description: "Transfer vertex weights from source mesh to target mesh",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        source_name: { type: "string", description: "Source mesh with weights" },
        target_name: { type: "string", description: "Target mesh" },
        method: {
          type: "string",
          enum: ["POLYINTERP_NEAREST", "NEAREST", "TOPOLOGY"],
          description: "Transfer method",
          default: "POLYINTERP_NEAREST",
        },
        groups: {
          type: "array",
          items: { type: "string" },
          description: "Specific groups to transfer (all if omitted)",
        },
      },
      required: ["source_name", "target_name"],
    },
  },
  {
    name: "normalize_weights",
    description: "Normalize all vertex weights so they sum to 1.0 per vertex",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
      },
      required: ["name"],
    },
  },
  {
    name: "limit_weight_count",
    description: "Limit the number of weight groups per vertex",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        limit: { type: "number", description: "Max groups per vertex", default: 4 },
      },
      required: ["name"],
    },
  },
  {
    name: "smooth_weights",
    description: "Smooth vertex weights for a specific group by averaging neighbors",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        group_name: { type: "string", description: "Vertex group to smooth" },
        iterations: { type: "number", description: "Smoothing iterations", default: 1 },
        factor: { type: "number", description: "Smoothing factor (0-1)", default: 0.5 },
      },
      required: ["name", "group_name"],
    },
  },
  {
    name: "mirror_weights",
    description: "Mirror vertex weights across an axis (bones must follow .L/.R naming)",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        axis: { type: "string", enum: ["X", "Y", "Z"], description: "Mirror axis", default: "X" },
      },
      required: ["name"],
    },
  },
  {
    name: "clean_zero_weights",
    description: "Remove zero-weight or near-zero vertex group assignments",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        threshold: { type: "number", description: "Weight threshold for removal", default: 0.001 },
      },
      required: ["name"],
    },
  },
  {
    name: "create_vertex_group",
    description: "Create a new vertex group, optionally adding vertices with a weight",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        group_name: { type: "string", description: "Name for the new group" },
        vertex_indices: {
          type: "array",
          items: { type: "number" },
          description: "Vertices to add",
        },
        weight: { type: "number", description: "Weight to assign", default: 1.0 },
      },
      required: ["name", "group_name"],
    },
  },
  {
    name: "copy_vertex_group",
    description: "Copy a vertex group to a new group",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        source_group: { type: "string", description: "Group to copy" },
        new_name: { type: "string", description: "Name for the copy" },
      },
      required: ["name", "source_group"],
    },
  },
  {
    name: "list_vertex_groups",
    description: "List all vertex groups with their vertex counts",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
      },
      required: ["name"],
    },
  },
  {
    name: "paint_manual",
    description: "Set specific vertex weight values manually",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        group_name: { type: "string", description: "Target vertex group" },
        vertex_indices: {
          type: "array",
          items: { type: "number" },
          description: "Vertex indices to paint",
        },
        weight: { type: "number", description: "Weight value (0-1)", default: 1.0 },
        mode: {
          type: "string",
          enum: ["REPLACE", "ADD", "SUBTRACT"],
          description: "Paint mode",
          default: "REPLACE",
        },
      },
      required: ["name", "group_name", "vertex_indices"],
    },
  },
  {
    name: "select_by_weight",
    description: "Select vertices by weight threshold in a vertex group",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        group_name: { type: "string", description: "Vertex group to check" },
        min_weight: { type: "number", description: "Minimum weight", default: 0.0 },
        max_weight: { type: "number", description: "Maximum weight", default: 1.0 },
      },
      required: ["name", "group_name"],
    },
  },
  {
    name: "gradient_weight",
    description: "Apply a gradient weight along an axis to a vertex group",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        group_name: { type: "string", description: "Target vertex group" },
        axis: { type: "string", enum: ["X", "Y", "Z"], description: "Gradient axis", default: "Z" },
        min_weight: { type: "number", description: "Weight at low end", default: 0.0 },
        max_weight: { type: "number", description: "Weight at high end", default: 1.0 },
        reverse: { type: "boolean", description: "Reverse direction", default: false },
      },
      required: ["name", "group_name"],
    },
  },
  {
    name: "blend_between_bones",
    description: "Blend and normalize weights between two bone groups",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        bone_a: { type: "string", description: "First bone vertex group" },
        bone_b: { type: "string", description: "Second bone vertex group" },
      },
      required: ["name", "bone_a", "bone_b"],
    },
  },
  {
    name: "assign_to_bone",
    description: "Assign specific vertices to a bone at a given weight",
    category: "weight_paint",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        bone_name: { type: "string", description: "Bone name (vertex group)" },
        vertex_indices: {
          type: "array",
          items: { type: "number" },
          description: "Vertices to assign",
        },
        weight: { type: "number", description: "Weight to assign", default: 1.0 },
      },
      required: ["name", "bone_name", "vertex_indices"],
    },
  },
];

export default weightPaintTools;
