import { ToolDefinition } from "../../registry.js";

const meshRepairTools: ToolDefinition[] = [
  {
    name: "remove_doubles",
    description: "Remove duplicate vertices within a distance threshold",
    category: "mesh_repair",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        threshold: {
          type: "number",
          description: "Maximum distance between vertices to merge",
          default: 0.0001,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "fix_non_manifold",
    description: "Attempt to fix non-manifold geometry by filling holes and removing interior faces",
    category: "mesh_repair",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        fill_holes: {
          type: "boolean",
          description: "Fill boundary edges to close holes",
          default: true,
        },
        remove_interior: {
          type: "boolean",
          description: "Remove interior faces",
          default: true,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "clean_unused_materials",
    description: "Remove material slots that have no faces assigned to them",
    category: "mesh_repair",
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
    name: "join_meshes",
    description: "Join multiple mesh objects into a single object",
    category: "mesh_repair",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        names: {
          type: "array",
          items: { type: "string" },
          description: "Object names to join (first becomes the receiving object)",
        },
        result_name: {
          type: "string",
          description: "Name for the resulting joined object",
        },
      },
      required: ["names"],
    },
  },
  {
    name: "separate_by_loose",
    description: "Separate a mesh into individual objects by disconnected loose parts",
    category: "mesh_repair",
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
    name: "separate_by_material",
    description: "Separate a mesh into individual objects by material assignment",
    category: "mesh_repair",
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
    name: "fill_boundary_holes",
    description: "Fill holes (boundary edge loops) in a mesh",
    category: "mesh_repair",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        sides: {
          type: "number",
          description: "Only fill holes with this many edges or fewer (0 = fill all)",
          default: 0,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "delete_by_position",
    description: "Delete vertices based on their position along an axis",
    category: "mesh_repair",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        axis: {
          type: "string",
          enum: ["X", "Y", "Z"],
          description: "Axis to check position on",
          default: "Z",
        },
        threshold: {
          type: "number",
          description: "Position threshold value",
          default: 0.0,
        },
        mode: {
          type: "string",
          enum: ["BELOW", "ABOVE"],
          description: "Delete vertices below or above the threshold",
          default: "BELOW",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "recalculate_normals",
    description: "Recalculate face normals to point consistently outward or inward",
    category: "mesh_repair",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        inside: {
          type: "boolean",
          description: "Point normals inward instead of outward",
          default: false,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "flip_normals",
    description: "Flip all face normals of a mesh",
    category: "mesh_repair",
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
];

export default meshRepairTools;
