import { ToolDefinition } from "../../registry.js";

const inspectionTools: ToolDefinition[] = [
  {
    name: "get_mesh_stats",
    description: "Get detailed mesh statistics including vertex, edge, face, and triangle counts",
    category: "inspection",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "check_mesh_errors",
    description: "Check a mesh for common problems like non-manifold edges, loose vertices, and missing UVs",
    category: "inspection",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "check_vrc_requirements",
    description: "Validate a mesh or armature against VRChat avatar performance requirements",
    category: "inspection",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object or armature name to check",
        },
        performance_rank: {
          type: "string",
          enum: ["excellent", "good", "medium", "poor"],
          description: "Target VRChat performance rank",
          default: "medium",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "list_all_bones",
    description: "List all bones in an armature with optional hierarchy information",
    category: "inspection",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: {
          type: "string",
          description: "Name of the armature object",
        },
        include_hierarchy: {
          type: "boolean",
          description: "Include parent-child relationships",
          default: true,
        },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "list_all_shapes",
    description: "List all shape keys on a mesh object with their values and settings",
    category: "inspection",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "analyze_topology",
    description: "Analyze mesh topology quality including quad ratio, pole distribution, and face area variance",
    category: "inspection",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "count_draw_calls",
    description: "Estimate draw call count based on material assignments across objects",
    category: "inspection",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        names: {
          type: "array",
          items: { type: "string" },
          description: "Object names to check (omit for all visible mesh objects)",
        },
      },
      required: [],
    },
  },
  {
    name: "measure_dimensions",
    description: "Get the bounding box dimensions, center, and diagonal of an object",
    category: "inspection",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        world_space: {
          type: "boolean",
          description: "Return dimensions in world space (true) or local space (false)",
          default: true,
        },
      },
      required: ["name"],
    },
  },
];

export default inspectionTools;
