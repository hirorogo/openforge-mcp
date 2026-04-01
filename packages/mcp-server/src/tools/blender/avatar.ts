import { ToolDefinition } from "../../registry.js";

const avatarTools: ToolDefinition[] = [
  {
    name: "detect_body_parts",
    description: "Auto-detect avatar parts (body, hair, clothes, etc.) parented to an armature",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Root armature of the avatar" },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "list_avatar_bones",
    description: "List all bones with common humanoid name mapping for the detected rig format",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to inspect" },
        show_mapping: { type: "boolean", description: "Include humanoid bone mapping", default: true },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "adjust_body_region",
    description: "Scale a body region (head, torso, arms, legs) via bone scaling",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to modify" },
        region: {
          type: "string",
          enum: ["head", "neck", "torso", "upper_arms", "lower_arms", "hands", "upper_legs", "lower_legs", "feet"],
          description: "Body region to scale",
        },
        scale_factor: { type: "number", description: "Scale multiplier", default: 1.0 },
      },
      required: ["armature_name", "region"],
    },
  },
  {
    name: "set_body_proportions",
    description: "Set head-to-body ratio (how many head-heights tall the avatar is)",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to adjust" },
        head_ratio: { type: "number", description: "Head-heights for total body (5-9)", default: 7.0 },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "apply_body_preset",
    description: "Apply a body type preset (standard, chibi, tall, athletic, petite)",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to modify" },
        preset: {
          type: "string",
          enum: ["standard", "chibi", "tall", "athletic", "petite"],
          description: "Body type preset",
          default: "standard",
        },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "attach_clothing",
    description: "Parent clothing to body with armature and transfer vertex weights",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        clothing_name: { type: "string", description: "Clothing mesh to attach" },
        body_name: { type: "string", description: "Body mesh (weight source)" },
        armature_name: { type: "string", description: "Armature to parent to" },
        transfer_weights: { type: "boolean", description: "Transfer weights from body", default: true },
      },
      required: ["clothing_name", "body_name", "armature_name"],
    },
  },
  {
    name: "remove_clothing",
    description: "Remove clothing mesh from avatar by unparenting or deleting",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        clothing_name: { type: "string", description: "Clothing mesh to remove" },
        delete_mesh: { type: "boolean", description: "Delete entirely vs just unparent", default: false },
      },
      required: ["clothing_name"],
    },
  },
  {
    name: "toggle_visibility",
    description: "Toggle visibility of an object or all objects matching a category keyword",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        visible: { type: "boolean", description: "Force visibility state (toggles if omitted)" },
        category: { type: "string", description: "Toggle all matching this keyword (hair, clothing, etc.)" },
        armature_name: { type: "string", description: "Scope to children of this armature" },
      },
      required: ["name"],
    },
  },
  {
    name: "transfer_outfit",
    description: "Transfer clothing from one avatar to another with weight re-mapping",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        clothing_name: { type: "string", description: "Clothing mesh to transfer" },
        source_armature: { type: "string", description: "Current parent armature" },
        target_armature: { type: "string", description: "New parent armature" },
        target_body: { type: "string", description: "Target body mesh for weight transfer" },
      },
      required: ["clothing_name", "source_armature", "target_armature", "target_body"],
    },
  },
  {
    name: "bake_pose",
    description: "Bake the current pose as the new rest pose",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature whose pose becomes rest" },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "set_eye_scale",
    description: "Adjust eye bone scale for the avatar",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature containing eye bones" },
        scale: { type: "number", description: "Scale multiplier for eyes", default: 1.0 },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "create_accessory_shape",
    description: "Create a basic accessory shape primitive (ring, earring, stud, pendant, bangle)",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        shape_type: {
          type: "string",
          enum: ["ring", "earring", "stud", "pendant", "bangle"],
          description: "Accessory shape type",
          default: "ring",
        },
        size: { type: "number", description: "Base size in meters", default: 0.02 },
        location: {
          type: "array",
          items: { type: "number" },
          description: "XYZ world location",
        },
        name: { type: "string", description: "Name for the object" },
      },
      required: [],
    },
  },
  {
    name: "detect_rig_format",
    description: "Detect rig type (Mixamo, VRM, MMD, Unity humanoid, or unknown)",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to analyze" },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "remap_bones",
    description: "Remap bone names between rig formats (e.g. Mixamo to VRM)",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to remap" },
        source_format: {
          type: "string",
          enum: ["mixamo", "vrm", "mmd"],
          description: "Source rig format",
        },
        target_format: {
          type: "string",
          enum: ["mixamo", "vrm", "mmd"],
          description: "Target rig format",
        },
      },
      required: ["armature_name", "source_format", "target_format"],
    },
  },
  {
    name: "auto_fix_bone_orientation",
    description: "Fix bone orientation issues after import by recalculating bone rolls",
    category: "avatar",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to fix" },
        primary_axis: {
          type: "string",
          enum: ["X", "Y", "Z", "-X", "-Y", "-Z"],
          description: "Primary bone axis",
          default: "Y",
        },
      },
      required: ["armature_name"],
    },
  },
];

export default avatarTools;
