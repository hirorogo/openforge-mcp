import { ToolDefinition } from "../../registry.js";

const bodyShapeTools: ToolDefinition[] = [
  {
    name: "adjust_proportions",
    description: "Adjust body proportions by scaling a specific bone in pose mode",
    category: "body_shape",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature containing the bone" },
        bone_name: { type: "string", description: "Bone to scale" },
        scale_x: { type: "number", description: "X axis scale factor", default: 1.0 },
        scale_y: { type: "number", description: "Y axis scale factor", default: 1.0 },
        scale_z: { type: "number", description: "Z axis scale factor", default: 1.0 },
      },
      required: ["armature_name", "bone_name"],
    },
  },
  {
    name: "adjust_limb_length",
    description: "Change the length of a limb bone (arm or leg segment)",
    category: "body_shape",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to edit" },
        bone_name: { type: "string", description: "Bone to adjust" },
        length_factor: { type: "number", description: "Length multiplier", default: 1.0 },
      },
      required: ["armature_name", "bone_name"],
    },
  },
  {
    name: "create_shape_variant",
    description: "Create a body shape variant as a new shape key from the current mesh state",
    category: "body_shape",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        variant_name: { type: "string", description: "Name for the shape key variant" },
      },
      required: ["name", "variant_name"],
    },
  },
  {
    name: "apply_shape_deform",
    description: "Permanently apply a shape key deformation to the mesh",
    category: "body_shape",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_key_name: { type: "string", description: "Shape key to apply" },
      },
      required: ["name", "shape_key_name"],
    },
  },
  {
    name: "modify_region_mesh",
    description: "Direct mesh editing of a body region defined by a vertex group",
    category: "body_shape",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        vertex_group: { type: "string", description: "Vertex group defining the region" },
        offset: {
          type: "array",
          items: { type: "number" },
          description: "XYZ offset to apply",
        },
        scale: {
          type: "array",
          items: { type: "number" },
          description: "XYZ scale relative to group center",
        },
      },
      required: ["name", "vertex_group"],
    },
  },
  {
    name: "scale_body_part",
    description: "Scale a specific body part defined by a vertex group",
    category: "body_shape",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        vertex_group: { type: "string", description: "Vertex group of the body part" },
        scale_factor: { type: "number", description: "Uniform scale factor", default: 1.0 },
      },
      required: ["name", "vertex_group"],
    },
  },
  {
    name: "simple_sculpt",
    description: "Apply a simple sculpt operation (smooth, inflate, shrink) to a mesh",
    category: "body_shape",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        operation: {
          type: "string",
          enum: ["smooth", "inflate", "shrink"],
          description: "Sculpt operation",
          default: "smooth",
        },
        strength: { type: "number", description: "Effect strength (0-1)", default: 0.5 },
        vertex_group: { type: "string", description: "Limit to this vertex group" },
      },
      required: ["name"],
    },
  },
  {
    name: "smooth_surface",
    description: "Smooth the mesh surface using a smooth modifier",
    category: "body_shape",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        iterations: { type: "number", description: "Smoothing iterations", default: 1 },
        factor: { type: "number", description: "Smoothing factor (0-1)", default: 0.5 },
      },
      required: ["name"],
    },
  },
  {
    name: "make_symmetric",
    description: "Symmetrize mesh along an axis",
    category: "body_shape",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        axis: {
          type: "string",
          enum: ["X", "Y", "Z"],
          description: "Symmetry axis",
          default: "X",
        },
        direction: {
          type: "string",
          enum: ["NEGATIVE", "POSITIVE"],
          description: "Which side overwrites",
          default: "NEGATIVE",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "blend_shapes",
    description: "Blend multiple shape keys into one new shape key",
    category: "body_shape",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        shape_names: {
          type: "array",
          items: { type: "string" },
          description: "Shape key names to blend",
        },
        weights: {
          type: "array",
          items: { type: "number" },
          description: "Weight for each shape key",
        },
        result_name: { type: "string", description: "Name for the blended result", default: "Blended" },
      },
      required: ["name", "shape_names"],
    },
  },
];

export default bodyShapeTools;
