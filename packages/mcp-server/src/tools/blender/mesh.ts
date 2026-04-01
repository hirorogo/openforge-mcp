import { ToolDefinition } from "../../registry.js";

const meshTools: ToolDefinition[] = [
  {
    name: "extrude",
    description: "Extrude selected faces, edges, or vertices of a mesh along a direction",
    category: "mesh",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        objectName: {
          type: "string",
          description: "Name of the mesh object to operate on",
        },
        mode: {
          type: "string",
          enum: ["faces", "edges", "vertices", "region"],
          description: "Extrusion mode determining which geometry elements are extruded",
          default: "region",
        },
        offset: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            z: { type: "number" },
          },
          required: ["x", "y", "z"],
          description: "Translation offset applied to the extruded geometry",
        },
        selectionIndices: {
          type: "array",
          items: { type: "number" },
          description: "Indices of faces/edges/vertices to select before extruding. If omitted, uses current selection.",
        },
      },
      required: ["objectName", "offset"],
    },
  },
  {
    name: "bevel",
    description: "Apply a bevel operation to selected edges or vertices of a mesh",
    category: "mesh",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        objectName: {
          type: "string",
          description: "Name of the mesh object",
        },
        width: {
          type: "number",
          description: "Bevel width (distance from original edge)",
        },
        segments: {
          type: "number",
          description: "Number of segments in the bevel profile",
          default: 1,
        },
        affectType: {
          type: "string",
          enum: ["EDGES", "VERTICES"],
          description: "Whether to bevel edges or vertices",
          default: "EDGES",
        },
        profile: {
          type: "number",
          description: "Bevel profile curvature. 0.5 is round, 0 is flat, 1 is sharp.",
          default: 0.5,
        },
        selectionIndices: {
          type: "array",
          items: { type: "number" },
          description: "Edge or vertex indices to bevel. If omitted, uses current selection.",
        },
      },
      required: ["objectName", "width"],
    },
  },
  {
    name: "subdivide",
    description: "Subdivide the mesh to increase geometry resolution",
    category: "mesh",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        objectName: {
          type: "string",
          description: "Name of the mesh object",
        },
        cuts: {
          type: "number",
          description: "Number of subdivision cuts",
          default: 1,
        },
        smoothness: {
          type: "number",
          description: "Smoothness factor applied during subdivision (0 = flat, 1 = fully smooth)",
          default: 0,
        },
        useSubsurfModifier: {
          type: "boolean",
          description: "If true, add a Subdivision Surface modifier instead of applying a direct subdivision",
          default: false,
        },
        level: {
          type: "number",
          description: "Subdivision level when using the modifier (viewport display level)",
          default: 2,
        },
      },
      required: ["objectName"],
    },
  },
  {
    name: "boolean_operation",
    description: "Perform a boolean operation between two mesh objects (union, difference, or intersection)",
    category: "mesh",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        objectName: {
          type: "string",
          description: "Name of the primary mesh object that receives the result",
        },
        targetName: {
          type: "string",
          description: "Name of the secondary mesh object used as the boolean operand",
        },
        operation: {
          type: "string",
          enum: ["UNION", "DIFFERENCE", "INTERSECT"],
          description: "Boolean operation type",
        },
        apply: {
          type: "boolean",
          description: "If true, apply the modifier immediately rather than keeping it live",
          default: true,
        },
        deleteTarget: {
          type: "boolean",
          description: "If true, delete the target object after applying the boolean",
          default: false,
        },
      },
      required: ["objectName", "targetName", "operation"],
    },
  },
  {
    name: "decimate",
    description: "Reduce the polygon count of a mesh while preserving its shape as much as possible",
    category: "mesh",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        objectName: {
          type: "string",
          description: "Name of the mesh object",
        },
        ratio: {
          type: "number",
          description: "Target face ratio (0.0 to 1.0). 0.5 reduces face count by half.",
        },
        method: {
          type: "string",
          enum: ["COLLAPSE", "UNSUBDIV", "PLANAR"],
          description: "Decimation algorithm to use",
          default: "COLLAPSE",
        },
        apply: {
          type: "boolean",
          description: "If true, apply the modifier immediately",
          default: true,
        },
      },
      required: ["objectName", "ratio"],
    },
  },
  {
    name: "merge_by_distance",
    description: "Merge vertices that are within a specified distance of each other to clean up mesh geometry",
    category: "mesh",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        objectName: {
          type: "string",
          description: "Name of the mesh object",
        },
        distance: {
          type: "number",
          description: "Maximum distance between vertices to merge (in Blender units)",
          default: 0.0001,
        },
        selectionOnly: {
          type: "boolean",
          description: "If true, only merge selected vertices. If false, process all vertices.",
          default: false,
        },
      },
      required: ["objectName"],
    },
  },
  {
    name: "knife_cut",
    description: "Perform a knife cut through the mesh along specified points to add new edge loops",
    category: "mesh",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        objectName: {
          type: "string",
          description: "Name of the mesh object",
        },
        points: {
          type: "array",
          items: {
            type: "object",
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              z: { type: "number" },
            },
            required: ["x", "y", "z"],
          },
          description: "Ordered list of 3D points defining the cut path in object-local space",
          minItems: 2,
        },
        cutThrough: {
          type: "boolean",
          description: "If true, cut through the entire mesh rather than only visible faces",
          default: false,
        },
      },
      required: ["objectName", "points"],
    },
  },
];

export default meshTools;
