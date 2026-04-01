import { ToolDefinition } from "../../registry.js";

const vrmTools: ToolDefinition[] = [
  {
    name: "import_vrm",
    description: "Import a VRM file into the Blender scene",
    category: "vrm",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Path to the .vrm file" },
      },
      required: ["filepath"],
    },
  },
  {
    name: "export_vrm",
    description: "Export the scene as a VRM file",
    category: "vrm",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Output path for the .vrm file" },
      },
      required: ["filepath"],
    },
  },
  {
    name: "setup_vrm_metadata",
    description: "Set VRM metadata (title, author, usage permissions) on an armature",
    category: "vrm",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature object name" },
        title: { type: "string", description: "Model title" },
        author: { type: "string", description: "Author name" },
        version: { type: "string", description: "Model version", default: "1.0" },
        contact_info: { type: "string", description: "Contact URL or email" },
        allowed_user: {
          type: "string",
          enum: ["OnlyAuthor", "ExplicitlyLicensedPerson", "Everyone"],
          description: "Allowed user scope",
          default: "OnlyAuthor",
        },
        commercial_usage: {
          type: "string",
          enum: ["Disallow", "Allow"],
          description: "Commercial usage permission",
          default: "Disallow",
        },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "create_facial_expressions",
    description: "Create shape keys for standard VRM facial expressions (visemes, emotions, etc.)",
    category: "vrm",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        mesh_name: { type: "string", description: "Face mesh object name" },
        expressions: {
          type: "array",
          items: { type: "string" },
          description: "Expression names (defaults to standard VRM set if omitted)",
        },
      },
      required: ["mesh_name"],
    },
  },
  {
    name: "setup_spring_bones",
    description: "Configure spring bone physics parameters on bones for VRM",
    category: "vrm",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        bone_names: {
          type: "array",
          items: { type: "string" },
          description: "Bones to configure as spring bones",
        },
        stiffness: { type: "number", description: "Spring stiffness", default: 1.0 },
        gravity_power: { type: "number", description: "Gravity influence", default: 0.0 },
        drag_force: { type: "number", description: "Drag force damping", default: 0.4 },
      },
      required: ["armature_name", "bone_names"],
    },
  },
  {
    name: "setup_physbone_chain",
    description: "Configure a bone chain as a VRChat PhysBone with dynamics parameters",
    category: "vrm",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature name" },
        root_bone: { type: "string", description: "Root bone of the chain" },
        pull: { type: "number", description: "Elasticity (0-1)", default: 0.2 },
        spring: { type: "number", description: "Bounciness (0-1)", default: 0.2 },
        stiffness: { type: "number", description: "Movement resistance (0-1)", default: 0.0 },
        immobile: { type: "number", description: "Immobile fraction (0-1)", default: 0.0 },
      },
      required: ["armature_name", "root_bone"],
    },
  },
  {
    name: "reduce_polycount",
    description: "Reduce polygon count of a mesh for VRM optimization",
    category: "vrm",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object name" },
        target_faces: { type: "number", description: "Target face count", default: 10000 },
      },
      required: ["name"],
    },
  },
  {
    name: "setup_vrm_materials",
    description: "Configure materials on a mesh for VRM-compatible rendering (MToon/Unlit)",
    category: "vrm",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        mesh_name: { type: "string", description: "Mesh object name" },
        shader_type: {
          type: "string",
          enum: ["MToon", "Unlit"],
          description: "VRM shader type",
          default: "MToon",
        },
      },
      required: ["mesh_name"],
    },
  },
  {
    name: "create_blend_shapes",
    description: "Create multiple blend shapes (shape keys) on a mesh in batch",
    category: "vrm",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        mesh_name: { type: "string", description: "Mesh object name" },
        blend_shape_names: {
          type: "array",
          items: { type: "string" },
          description: "Names for the blend shapes to create",
        },
      },
      required: ["mesh_name", "blend_shape_names"],
    },
  },
  {
    name: "optimize_for_vrchat",
    description: "Optimize a VRM model for VRChat by checking limits and auto-decimating",
    category: "vrm",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature object name" },
        max_polygons: { type: "number", description: "Target max polygon count", default: 32000 },
        max_materials: { type: "number", description: "Target max material count", default: 4 },
      },
      required: ["armature_name"],
    },
  },
];

export default vrmTools;
