import { ToolDefinition } from "../../registry.js";

const probuilderTools: ToolDefinition[] = [
  {
    name: "create_probuilder_shape",
    description:
      "Create a ProBuilder primitive shape (cube, cylinder, sphere, plane, stairs, arch). Requires com.unity.probuilder package.",
    category: "probuilder",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        shape: {
          type: "string",
          enum: ["cube", "cylinder", "sphere", "plane", "stairs", "arch"],
          description: "Shape type to create",
        },
        name: { type: "string", description: "Name for the created object" },
        position: { type: "string", description: "Position as 'x,y,z'" },
        size_x: { type: "number", description: "Size X (for cube)" },
        size_y: { type: "number", description: "Size Y (for cube)" },
        size_z: { type: "number", description: "Size Z (for cube)" },
        radius: { type: "number", description: "Radius (for cylinder, sphere, arch)" },
        height: { type: "number", description: "Height (for cylinder, stairs)" },
        sides: { type: "number", description: "Number of sides (for cylinder)" },
        steps: { type: "number", description: "Number of steps (for stairs)" },
        subdivisions: { type: "number", description: "Subdivisions (for sphere)" },
        segments: { type: "number", description: "Segments (for arch)" },
        angle: { type: "number", description: "Angle in degrees (for arch)" },
        width: { type: "number", description: "Width (for plane, stairs, arch)" },
        depth: { type: "number", description: "Depth (for stairs, arch)" },
      },
      required: [],
    },
  },
  {
    name: "extrude_probuilder_faces",
    description: "Extrude faces on a ProBuilder mesh by a specified distance",
    category: "probuilder",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "ProBuilder GameObject name or ID" },
        distance: { type: "number", description: "Extrusion distance (default 0.5)" },
        face_indices: {
          type: "string",
          description: "Comma-separated face indices to extrude (omit for all faces)",
        },
      },
      required: ["target"],
    },
  },
  {
    name: "probuilder_boolean",
    description:
      "Perform boolean operations (union, subtract, intersect) between two ProBuilder meshes",
    category: "probuilder",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target_a: { type: "string", description: "First ProBuilder object name or ID" },
        target_b: { type: "string", description: "Second ProBuilder object name or ID" },
        operation: {
          type: "string",
          enum: ["union", "subtract", "intersect"],
          description: "Boolean operation type",
        },
        name: { type: "string", description: "Name for the resulting object" },
      },
      required: ["target_a", "target_b"],
    },
  },
  {
    name: "set_probuilder_material",
    description: "Set material on specific faces or all faces of a ProBuilder mesh",
    category: "probuilder",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "ProBuilder GameObject name or ID" },
        material: { type: "string", description: "Material asset path or name" },
        face_indices: {
          type: "string",
          description: "Comma-separated face indices (omit for all faces)",
        },
      },
      required: ["target", "material"],
    },
  },
  {
    name: "merge_probuilder",
    description: "Merge multiple ProBuilder objects into a single mesh",
    category: "probuilder",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        targets: {
          type: "string",
          description: "Comma-separated list of ProBuilder object names to merge",
        },
        name: { type: "string", description: "Name for the merged object" },
      },
      required: ["targets"],
    },
  },
  {
    name: "subdivide_probuilder",
    description: "Subdivide faces on a ProBuilder mesh for finer geometry control",
    category: "probuilder",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "ProBuilder GameObject name or ID" },
        face_indices: {
          type: "string",
          description: "Comma-separated face indices to subdivide (omit for all)",
        },
      },
      required: ["target"],
    },
  },
  {
    name: "probuilder_to_mesh",
    description:
      "Convert a ProBuilder mesh to a standard Unity mesh, removing ProBuilder components",
    category: "probuilder",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "ProBuilder GameObject name or ID" },
        save_path: {
          type: "string",
          description: "Optional asset path to save the mesh (e.g. Assets/Meshes/myMesh.asset)",
        },
      },
      required: ["target"],
    },
  },
  {
    name: "get_probuilder_info",
    description:
      "Get detailed information about a ProBuilder mesh (vertex count, face count, edge count)",
    category: "probuilder",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "ProBuilder GameObject name or ID" },
      },
      required: ["target"],
    },
  },
];

export default probuilderTools;
