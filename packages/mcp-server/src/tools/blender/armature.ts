import { ToolDefinition } from "../../registry.js";

const armatureTools: ToolDefinition[] = [
  {
    name: "create_armature",
    description: "Create a new armature object with a single root bone",
    category: "armature",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name for the armature",
          default: "Armature",
        },
        location: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            z: { type: "number" },
          },
          required: ["x", "y", "z"],
          description: "World location",
        },
      },
    },
  },
  {
    name: "add_bone",
    description: "Add a bone to an existing armature with configurable position and parent",
    category: "armature",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Name of the armature object" },
        bone_name: { type: "string", description: "Name for the new bone", default: "Bone" },
        head: {
          type: "array",
          items: { type: "number" },
          description: "Head position [x, y, z]",
        },
        tail: {
          type: "array",
          items: { type: "number" },
          description: "Tail position [x, y, z]",
        },
        parent_bone: { type: "string", description: "Name of the parent bone" },
        connected: { type: "boolean", description: "Connect to parent bone", default: false },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "set_bone_parent",
    description: "Set the parent of a bone within an armature",
    category: "armature",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature object name" },
        bone_name: { type: "string", description: "Child bone name" },
        parent_bone: { type: "string", description: "Parent bone name" },
        connected: { type: "boolean", description: "Connect to parent", default: false },
      },
      required: ["armature_name", "bone_name", "parent_bone"],
    },
  },
  {
    name: "set_ik_constraint",
    description: "Add an Inverse Kinematics constraint to a bone",
    category: "armature",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature object name" },
        bone_name: { type: "string", description: "Bone to add IK to" },
        target_name: { type: "string", description: "Target object name" },
        target_bone: { type: "string", description: "Target bone within the target armature" },
        chain_length: { type: "number", description: "IK chain length (0 for auto)", default: 0 },
      },
      required: ["armature_name", "bone_name"],
    },
  },
  {
    name: "set_bone_roll",
    description: "Set the roll angle of a bone in an armature",
    category: "armature",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature object name" },
        bone_name: { type: "string", description: "Bone name" },
        roll: { type: "number", description: "Roll angle in radians", default: 0.0 },
      },
      required: ["armature_name", "bone_name"],
    },
  },
  {
    name: "create_bone_chain",
    description: "Create a chain of connected bones in an armature",
    category: "armature",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature object name" },
        chain_name: { type: "string", description: "Base name for the bones", default: "Chain" },
        bone_count: { type: "number", description: "Number of bones", default: 3 },
        bone_length: { type: "number", description: "Length of each bone", default: 0.5 },
        start_position: {
          type: "array",
          items: { type: "number" },
          description: "Starting position [x, y, z]",
        },
        direction: {
          type: "array",
          items: { type: "number" },
          description: "Direction vector [x, y, z]",
        },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "setup_rig",
    description: "Parent a mesh to an armature with automatic weights for rigging",
    category: "armature",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature object name" },
        mesh_name: { type: "string", description: "Mesh object name" },
      },
      required: ["armature_name", "mesh_name"],
    },
  },
  {
    name: "weight_paint_auto",
    description: "Automatically generate weight paint for a mesh with an armature",
    category: "armature",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature object name" },
        mesh_name: { type: "string", description: "Mesh object name" },
      },
      required: ["armature_name", "mesh_name"],
    },
  },
  {
    name: "assign_vertex_group",
    description: "Assign vertices to a vertex group with a specified weight",
    category: "armature",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        mesh_name: { type: "string", description: "Mesh object name" },
        group_name: { type: "string", description: "Vertex group name" },
        vertex_indices: {
          type: "array",
          items: { type: "number" },
          description: "Vertex indices to assign (all if omitted)",
        },
        weight: { type: "number", description: "Weight value (0-1)", default: 1.0 },
      },
      required: ["mesh_name", "group_name"],
    },
  },
  {
    name: "create_shape_key",
    description: "Create a new shape key on a mesh object",
    category: "armature",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object name" },
        shape_key_name: { type: "string", description: "Shape key name", default: "Key" },
        from_mix: { type: "boolean", description: "Create from current mix", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "set_shape_key_value",
    description: "Set the influence value of a shape key",
    category: "armature",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object name" },
        shape_key_name: { type: "string", description: "Shape key name" },
        value: { type: "number", description: "Influence value (0-1)", default: 1.0 },
      },
      required: ["name", "shape_key_name"],
    },
  },
  {
    name: "mirror_weights",
    description: "Mirror vertex group weights from one side to the other using .L/.R convention",
    category: "armature",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        mesh_name: { type: "string", description: "Mesh object name" },
      },
      required: ["mesh_name"],
    },
  },
];

export default armatureTools;
