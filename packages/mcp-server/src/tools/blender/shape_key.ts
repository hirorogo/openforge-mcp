import { ToolDefinition } from "../../registry.js";

const shapeKeyTools: ToolDefinition[] = [
  {
    name: "create_shape_key",
    description: "Create a new shape key from the current mesh state",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Name for the new shape key" },
        from_mix: { type: "boolean", description: "Create from current mix rather than basis", default: false },
      },
      required: ["name", "shape_key_name"],
    },
  },
  {
    name: "delete_shape_key",
    description: "Remove a shape key from a mesh",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Shape key to delete" },
      },
      required: ["name", "shape_key_name"],
    },
  },
  {
    name: "rename_shape_key",
    description: "Rename a shape key",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        old_name: { type: "string", description: "Current shape key name" },
        new_name: { type: "string", description: "New name" },
      },
      required: ["name", "old_name", "new_name"],
    },
  },
  {
    name: "set_shape_value",
    description: "Set the value of a shape key (0.0 to 1.0)",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Shape key to adjust" },
        value: { type: "number", description: "Value (0.0 to 1.0)", default: 0.0 },
      },
      required: ["name", "shape_key_name"],
    },
  },
  {
    name: "edit_shape_vertices",
    description: "Modify specific vertex positions within a shape key",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Shape key to edit" },
        vertex_indices: {
          type: "array",
          items: { type: "number" },
          description: "Vertex indices to modify",
        },
        offsets: {
          type: "array",
          items: { type: "array", items: { type: "number" } },
          description: "XYZ offset for each vertex",
        },
      },
      required: ["name", "shape_key_name", "vertex_indices", "offsets"],
    },
  },
  {
    name: "mirror_shape",
    description: "Mirror a shape key across an axis into a new shape key",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Source shape key" },
        axis: { type: "string", enum: ["X", "Y", "Z"], description: "Mirror axis", default: "X" },
        new_name: { type: "string", description: "Name for mirrored shape key" },
      },
      required: ["name", "shape_key_name"],
    },
  },
  {
    name: "transfer_shapes",
    description: "Transfer shape keys from one mesh to another",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        source_name: { type: "string", description: "Source mesh with shape keys" },
        target_name: { type: "string", description: "Target mesh" },
        shape_names: {
          type: "array",
          items: { type: "string" },
          description: "Specific shape keys (all if omitted)",
        },
      },
      required: ["source_name", "target_name"],
    },
  },
  {
    name: "sort_shapes",
    description: "Sort shape keys alphabetically (Basis stays first)",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        reverse: { type: "boolean", description: "Reverse alphabetical order", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "create_expression_set",
    description: "Create a standard set of facial expression shape keys (VRM, ARKit, or basic)",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Face mesh object" },
        standard: {
          type: "string",
          enum: ["vrm", "arkit", "basic"],
          description: "Expression standard",
          default: "vrm",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "create_lip_sync_set",
    description: "Create lip sync viseme shape keys for VRChat or vowel-based lip sync",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Face mesh object" },
        format: {
          type: "string",
          enum: ["viseme", "vowel"],
          description: "Lip sync format",
          default: "viseme",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "blend_two_shapes",
    description: "Blend two shape keys into a new one with configurable weights",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_a: { type: "string", description: "First shape key" },
        shape_b: { type: "string", description: "Second shape key" },
        weight_a: { type: "number", description: "Weight for first shape", default: 0.5 },
        weight_b: { type: "number", description: "Weight for second shape", default: 0.5 },
        result_name: { type: "string", description: "Name for result", default: "Blended" },
      },
      required: ["name", "shape_a", "shape_b"],
    },
  },
  {
    name: "scale_shape_effect",
    description: "Scale the intensity of a shape key's deformation",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Shape key to scale" },
        intensity: { type: "number", description: "Scale factor (2.0 = double effect)", default: 1.0 },
      },
      required: ["name", "shape_key_name"],
    },
  },
  {
    name: "move_shape_vertices",
    description: "Offset all vertices in a shape key by a uniform amount",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Shape key to modify" },
        offset: {
          type: "array",
          items: { type: "number" },
          description: "XYZ offset",
        },
        vertex_group: { type: "string", description: "Limit to this vertex group" },
      },
      required: ["name", "shape_key_name", "offset"],
    },
  },
  {
    name: "rotate_shape_region",
    description: "Rotate vertices within a shape key around a vertex group center",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Shape key to modify" },
        vertex_group: { type: "string", description: "Rotation region" },
        angle: { type: "number", description: "Rotation angle in degrees", default: 0.0 },
        axis: { type: "string", enum: ["X", "Y", "Z"], description: "Rotation axis", default: "Z" },
      },
      required: ["name", "shape_key_name", "vertex_group"],
    },
  },
  {
    name: "copy_shape",
    description: "Duplicate a shape key",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Shape key to duplicate" },
        new_name: { type: "string", description: "Name for the copy" },
      },
      required: ["name", "shape_key_name"],
    },
  },
  {
    name: "apply_to_mesh",
    description: "Apply a shape key permanently to the mesh, removing all shape keys",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Shape key to apply as final shape" },
      },
      required: ["name", "shape_key_name"],
    },
  },
  {
    name: "smooth_shape",
    description: "Smooth a shape key's deformation by averaging neighbor deltas",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Shape key to smooth" },
        iterations: { type: "number", description: "Smoothing passes", default: 1 },
        factor: { type: "number", description: "Blend factor (0-1)", default: 0.5 },
      },
      required: ["name", "shape_key_name"],
    },
  },
  {
    name: "correct_symmetry",
    description: "Fix asymmetric shape keys by averaging mirrored vertex deltas",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Shape key to correct" },
        axis: { type: "string", enum: ["X", "Y", "Z"], description: "Symmetry axis", default: "X" },
        tolerance: { type: "number", description: "Position matching tolerance", default: 0.0001 },
      },
      required: ["name", "shape_key_name"],
    },
  },
  {
    name: "add_driver",
    description: "Add a driver to a shape key connecting it to a bone transform",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Shape key to drive" },
        armature_name: { type: "string", description: "Armature with driver bone" },
        bone_name: { type: "string", description: "Driver bone" },
        transform_type: {
          type: "string",
          enum: ["LOC_X", "LOC_Y", "LOC_Z", "ROT_X", "ROT_Y", "ROT_Z", "SCALE_X", "SCALE_Y", "SCALE_Z"],
          description: "Bone transform channel",
          default: "ROT_X",
        },
        influence: { type: "number", description: "Driver influence multiplier", default: 1.0 },
      },
      required: ["name", "shape_key_name", "armature_name", "bone_name"],
    },
  },
  {
    name: "get_vertex_positions",
    description: "Get vertex positions and deltas from a shape key",
    category: "shape_key",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Shape key to read" },
        vertex_indices: {
          type: "array",
          items: { type: "number" },
          description: "Specific indices (returns first 1000 if omitted)",
        },
      },
      required: ["name", "shape_key_name"],
    },
  },
];

export default shapeKeyTools;
