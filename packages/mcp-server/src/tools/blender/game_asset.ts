import { ToolDefinition } from "../../registry.js";

const gameAssetTools: ToolDefinition[] = [
  {
    name: "snap_to_grid",
    description: "Snap an object's position and optionally rotation to a grid",
    category: "game_asset",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        grid_size: {
          type: "number",
          description: "Grid cell size in Blender units",
          default: 1.0,
        },
        snap_rotation: {
          type: "boolean",
          description: "Also snap rotation to increments",
          default: false,
        },
        rotation_step: {
          type: "number",
          description: "Rotation snap increment in degrees",
          default: 90.0,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "create_box_collider",
    description: "Create an axis-aligned box collision shape around an object",
    category: "game_asset",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object to create collider for",
        },
        padding: {
          type: "number",
          description: "Extra padding around bounding box",
          default: 0.0,
        },
        collider_name: {
          type: "string",
          description: "Name for the collider object",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "create_capsule_collider",
    description: "Create a capsule collision shape around an object",
    category: "game_asset",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object to create collider for",
        },
        axis: {
          type: "string",
          enum: ["X", "Y", "Z"],
          description: "Primary axis for the capsule",
          default: "Z",
        },
        padding: {
          type: "number",
          description: "Extra padding",
          default: 0.0,
        },
        segments: {
          type: "number",
          description: "Cylinder segment count",
          default: 16,
        },
        collider_name: {
          type: "string",
          description: "Name for the collider object",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "create_convex_collider",
    description: "Create a convex hull collision shape from an object's mesh",
    category: "game_asset",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object to create collider for",
        },
        collider_name: {
          type: "string",
          description: "Name for the collider object",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "decimate_to_target",
    description: "Decimate a mesh to a target triangle count",
    category: "game_asset",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        target_tris: {
          type: "number",
          description: "Target triangle count",
          default: 5000,
        },
        method: {
          type: "string",
          enum: ["COLLAPSE", "UNSUBDIV", "DISSOLVE"],
          description: "Decimation method",
          default: "COLLAPSE",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "generate_lod_chain",
    description: "Generate LOD (Level of Detail) meshes from LOD0 through LOD3",
    category: "game_asset",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Source object name (becomes LOD0)",
        },
        lod_count: {
          type: "number",
          description: "Number of LOD levels including LOD0",
          default: 4,
        },
        reduction_factor: {
          type: "number",
          description: "Triangle reduction factor per level (0.5 = halve each level)",
          default: 0.5,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "optimize_for_game",
    description: "Apply common game-engine optimizations to a mesh object",
    category: "game_asset",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        merge_distance: {
          type: "number",
          description: "Distance threshold for merging vertices",
          default: 0.0001,
        },
        remove_doubles: {
          type: "boolean",
          description: "Remove duplicate vertices",
          default: true,
        },
        apply_transforms: {
          type: "boolean",
          description: "Apply location, rotation, and scale",
          default: true,
        },
        triangulate: {
          type: "boolean",
          description: "Triangulate the mesh",
          default: false,
        },
        limit_bones_per_vertex: {
          type: "number",
          description: "Limit vertex group influences (0 = no limit)",
          default: 0,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "set_origin_bottom",
    description: "Set object origin to the bottom center of its bounding box",
    category: "game_asset",
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
    name: "set_origin_center",
    description: "Set object origin to the geometric center of its mesh",
    category: "game_asset",
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
    name: "export_game_ready",
    description: "Export an object with game-engine-friendly settings (axis conventions, no leaf bones)",
    category: "game_asset",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name to export",
        },
        filepath: {
          type: "string",
          description: "Output file path",
        },
        file_format: {
          type: "string",
          enum: ["FBX", "GLB", "GLTF"],
          description: "Export format",
          default: "FBX",
        },
        apply_modifiers: {
          type: "boolean",
          description: "Apply modifiers before export",
          default: true,
        },
        forward_axis: {
          type: "string",
          description: "Forward axis convention",
          default: "-Z",
        },
        up_axis: {
          type: "string",
          description: "Up axis convention",
          default: "Y",
        },
      },
      required: ["name", "filepath"],
    },
  },
];

export default gameAssetTools;
