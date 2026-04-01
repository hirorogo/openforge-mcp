import { ToolDefinition } from "../../registry.js";

const armatureAdvancedTools: ToolDefinition[] = [
  {
    name: "create_simple_rig",
    description: "Create a simple humanoid rig skeleton with spine, head, arms, and legs",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name", default: "HumanoidRig" },
        location: { type: "array", items: { type: "number" }, description: "World location [x, y, z]" },
        height: { type: "number", description: "Total rig height in Blender units", default: 2.0 },
      },
    },
  },
  {
    name: "connect_bones",
    description: "Set whether a bone is connected to its parent",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        bone_name: { type: "string", description: "Bone name" },
        connected: { type: "boolean", description: "Connect to parent", default: true },
      },
      required: ["armature_name", "bone_name"],
    },
  },
  {
    name: "align_bones",
    description: "Align a bone to a primary axis direction",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        bone_name: { type: "string", description: "Bone name" },
        axis: { type: "string", enum: ["X", "Y", "Z", "NEG_X", "NEG_Y", "NEG_Z"], default: "Z" },
      },
      required: ["armature_name", "bone_name"],
    },
  },
  {
    name: "mirror_bones",
    description: "Mirror bones across X axis using Blender symmetrize (creates .R from .L)",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "delete_bone",
    description: "Remove a bone from an armature",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        bone_name: { type: "string", description: "Bone to delete" },
      },
      required: ["armature_name", "bone_name"],
    },
  },
  {
    name: "rename_bone",
    description: "Rename a single bone in an armature",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        old_name: { type: "string", description: "Current bone name" },
        new_name: { type: "string", description: "New bone name" },
      },
      required: ["armature_name", "old_name", "new_name"],
    },
  },
  {
    name: "rename_bones_batch",
    description: "Batch rename bones by replacing prefix and/or suffix patterns",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        prefix_old: { type: "string", description: "Old prefix to replace", default: "" },
        prefix_new: { type: "string", description: "New prefix", default: "" },
        suffix_old: { type: "string", description: "Old suffix to replace", default: "" },
        suffix_new: { type: "string", description: "New suffix", default: "" },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "set_bone_display",
    description: "Set the armature bone display mode (visual style)",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        display_type: { type: "string", enum: ["OCTAHEDRAL", "STICK", "BBONE", "ENVELOPE", "WIRE"], default: "OCTAHEDRAL" },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "reparent_bone",
    description: "Change the parent of a bone, or unparent it",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        bone_name: { type: "string", description: "Bone to reparent" },
        new_parent: { type: "string", description: "New parent bone (omit to unparent)" },
        connected: { type: "boolean", description: "Connect to new parent", default: false },
      },
      required: ["armature_name", "bone_name"],
    },
  },
  {
    name: "switch_bone_direction",
    description: "Swap the head and tail positions of a bone",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        bone_name: { type: "string", description: "Bone to flip" },
      },
      required: ["armature_name", "bone_name"],
    },
  },
  {
    name: "remove_constraint",
    description: "Remove a specific constraint from a pose bone",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        bone_name: { type: "string", description: "Pose bone name" },
        constraint_name: { type: "string", description: "Constraint name to remove" },
      },
      required: ["armature_name", "bone_name", "constraint_name"],
    },
  },
  {
    name: "list_constraints",
    description: "List all constraints on a pose bone with type, target, and influence",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        bone_name: { type: "string", description: "Pose bone name" },
      },
      required: ["armature_name", "bone_name"],
    },
  },
  {
    name: "add_copy_rotation",
    description: "Add a Copy Rotation constraint to a pose bone",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        bone_name: { type: "string", description: "Bone name" },
        target_name: { type: "string", description: "Target object name" },
        target_bone: { type: "string", description: "Target bone name" },
        influence: { type: "number", description: "Constraint influence (0-1)", default: 1.0 },
      },
      required: ["armature_name", "bone_name", "target_name"],
    },
  },
  {
    name: "add_copy_location",
    description: "Add a Copy Location constraint to a pose bone",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        bone_name: { type: "string", description: "Bone name" },
        target_name: { type: "string", description: "Target object name" },
        target_bone: { type: "string", description: "Target bone name" },
        influence: { type: "number", description: "Constraint influence (0-1)", default: 1.0 },
      },
      required: ["armature_name", "bone_name", "target_name"],
    },
  },
  {
    name: "add_copy_transforms",
    description: "Add a Copy Transforms constraint to a pose bone",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        bone_name: { type: "string", description: "Bone name" },
        target_name: { type: "string", description: "Target object name" },
        target_bone: { type: "string", description: "Target bone name" },
        influence: { type: "number", description: "Constraint influence (0-1)", default: 1.0 },
      },
      required: ["armature_name", "bone_name", "target_name"],
    },
  },
  {
    name: "add_child_of",
    description: "Add a Child Of constraint to a pose bone",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        bone_name: { type: "string", description: "Bone name" },
        target_name: { type: "string", description: "Target object name" },
        target_bone: { type: "string", description: "Target bone name" },
        influence: { type: "number", description: "Constraint influence (0-1)", default: 1.0 },
      },
      required: ["armature_name", "bone_name", "target_name"],
    },
  },
  {
    name: "parent_mesh_to_armature",
    description: "Parent a mesh to an armature with automatic, name-based, or envelope weights",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        mesh_name: { type: "string", description: "Mesh object name" },
        parent_type: {
          type: "string",
          enum: ["ARMATURE_AUTO", "ARMATURE_NAME", "ARMATURE_ENVELOPE"],
          default: "ARMATURE_AUTO",
        },
      },
      required: ["armature_name", "mesh_name"],
    },
  },
  {
    name: "merge_armatures",
    description: "Merge two armatures by joining the source into the target",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        target_armature: { type: "string", description: "Target armature (kept)" },
        source_armature: { type: "string", description: "Source armature (consumed)" },
      },
      required: ["target_armature", "source_armature"],
    },
  },
  {
    name: "reset_all_poses",
    description: "Reset all bone poses to rest position",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "detect_and_fix_rolls",
    description: "Recalculate bone roll angles for all bones in an armature",
    category: "armature_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        roll_type: {
          type: "string",
          enum: ["GLOBAL_POS_X", "GLOBAL_POS_Y", "GLOBAL_POS_Z", "GLOBAL_NEG_X", "GLOBAL_NEG_Y", "GLOBAL_NEG_Z", "ACTIVE", "VIEW", "CURSOR"],
          default: "GLOBAL_POS_Z",
        },
      },
      required: ["armature_name"],
    },
  },
];

export default armatureAdvancedTools;
