import { ToolDefinition } from "../../registry.js";

const accessoryTools: ToolDefinition[] = [
  {
    name: "mirror_accessory",
    description: "Duplicate and mirror an object across an axis (e.g. earrings, symmetrical accessories)",
    category: "accessory",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object to duplicate and mirror" },
        axis: {
          type: "string",
          enum: ["X", "Y", "Z"],
          description: "Mirror axis",
          default: "X",
        },
        new_name: { type: "string", description: "Name for the mirrored copy" },
      },
      required: ["name"],
    },
  },
  {
    name: "attach_to_bone",
    description: "Parent an object to a specific bone with optional offset",
    category: "accessory",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object to attach" },
        armature_name: { type: "string", description: "Armature containing the bone" },
        bone_name: { type: "string", description: "Bone to parent to" },
        offset: {
          type: "array",
          items: { type: "number" },
          description: "XYZ offset from bone head",
        },
      },
      required: ["name", "armature_name", "bone_name"],
    },
  },
  {
    name: "position_on_bone",
    description: "Place an accessory at a bone's head, tail, or midpoint",
    category: "accessory",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object to position" },
        armature_name: { type: "string", description: "Armature containing the bone" },
        bone_name: { type: "string", description: "Target bone" },
        position: {
          type: "string",
          enum: ["head", "tail", "center"],
          description: "Position on the bone",
          default: "head",
        },
        offset: {
          type: "array",
          items: { type: "number" },
          description: "Additional XYZ offset",
        },
      },
      required: ["name", "armature_name", "bone_name"],
    },
  },
  {
    name: "scale_accessory",
    description: "Scale an accessory uniformly or non-uniformly",
    category: "accessory",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object to scale" },
        scale: {
          type: "array",
          items: { type: "number" },
          description: "Non-uniform XYZ scale factors",
        },
        uniform_scale: { type: "number", description: "Uniform scale factor" },
      },
      required: ["name"],
    },
  },
  {
    name: "merge_into_body",
    description: "Merge an accessory mesh into the main body mesh",
    category: "accessory",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        accessory_name: { type: "string", description: "Accessory object to merge" },
        body_name: { type: "string", description: "Target body object" },
      },
      required: ["accessory_name", "body_name"],
    },
  },
  {
    name: "separate_by_material",
    description: "Split a mesh into separate objects by material slot",
    category: "accessory",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object to split" },
      },
      required: ["name"],
    },
  },
  {
    name: "setup_hair_physics",
    description: "Create a bone chain for hair dynamics starting from a root bone",
    category: "accessory",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to add hair bones to" },
        root_bone: { type: "string", description: "Existing bone to start from" },
        chain_length: { type: "number", description: "Number of bones in chain", default: 5 },
        stiffness: { type: "number", description: "Hair stiffness (0-1)", default: 0.5 },
        damping: { type: "number", description: "Damping factor (0-1)", default: 0.3 },
        prefix: { type: "string", description: "Naming prefix for chain bones", default: "Hair" },
      },
      required: ["armature_name", "root_bone"],
    },
  },
  {
    name: "setup_dynamic_chain",
    description: "Setup a physics bone chain with configurable naming convention",
    category: "accessory",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to configure" },
        root_bone: { type: "string", description: "Root bone of the chain" },
        count: { type: "number", description: "Number of bones in chain", default: 4 },
        naming_convention: {
          type: "string",
          enum: ["sequential", "suffix"],
          description: "Naming convention",
          default: "sequential",
        },
        pull: { type: "number", description: "Elasticity (0-1)", default: 0.2 },
        spring: { type: "number", description: "Bounciness (0-1)", default: 0.2 },
        gravity: { type: "number", description: "Gravity influence (0-1)", default: 0.0 },
      },
      required: ["armature_name", "root_bone"],
    },
  },
  {
    name: "distribute_along_curve",
    description: "Place copies of an object along a curve path at even intervals",
    category: "accessory",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object to distribute" },
        curve_name: { type: "string", description: "Curve to distribute along" },
        count: { type: "number", description: "Number of copies", default: 5 },
        use_rotation: { type: "boolean", description: "Align to curve tangent", default: true },
      },
      required: ["name", "curve_name"],
    },
  },
  {
    name: "snap_to_surface",
    description: "Snap an object to the nearest point on a target surface",
    category: "accessory",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object to snap" },
        target_name: { type: "string", description: "Target surface mesh" },
        direction: {
          type: "array",
          items: { type: "number" },
          description: "Ray direction (defaults to -Z)",
        },
        align_normal: { type: "boolean", description: "Align to surface normal", default: false },
      },
      required: ["name", "target_name"],
    },
  },
];

export default accessoryTools;
