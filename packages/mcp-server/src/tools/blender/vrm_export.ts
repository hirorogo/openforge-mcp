import { ToolDefinition } from "../../registry.js";

const vrmExportTools: ToolDefinition[] = [
  {
    name: "export_for_unity",
    description: "Export FBX optimized for Unity/VRChat import with proper settings",
    category: "vrm_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Output .fbx file path" },
        armature_name: { type: "string", description: "Armature to export (all selected if omitted)" },
        apply_modifiers: { type: "boolean", description: "Apply modifiers before export", default: true },
        scale_factor: { type: "number", description: "Export scale factor", default: 1.0 },
      },
      required: ["filepath"],
    },
  },
  {
    name: "rename_bones_vrc",
    description: "Rename bones to VRChat humanoid convention (auto-detects source format)",
    category: "vrm_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to rename bones in" },
        auto_detect: { type: "boolean", description: "Auto-detect source format", default: true },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "setup_vrm_hierarchy",
    description: "Setup correct VRM bone hierarchy by re-parenting bones as needed",
    category: "vrm_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to configure" },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "validate_for_vrc",
    description: "Check model against VRChat requirements and performance rank limits",
    category: "vrm_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to validate" },
        performance_rank: {
          type: "string",
          enum: ["excellent", "good", "medium", "poor"],
          description: "Target performance rank",
          default: "medium",
        },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "batch_export_variants",
    description: "Export multiple avatar variants with different shape key combinations",
    category: "vrm_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to export" },
        output_dir: { type: "string", description: "Output directory" },
        variants: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Variant name" },
              shape_keys: {
                type: "object",
                description: "Shape key name to value mapping",
              },
            },
            required: ["name"],
          },
          description: "List of variant configurations",
        },
        format: {
          type: "string",
          enum: ["fbx", "vrm"],
          description: "Export format",
          default: "fbx",
        },
      },
      required: ["armature_name", "output_dir", "variants"],
    },
  },
  {
    name: "organize_bone_groups",
    description: "Organize bones into groups/collections (Body, Arms, Legs, Dynamics, etc.)",
    category: "vrm_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature to organize" },
        groups: {
          type: "object",
          description: "Mapping of group name to bone name arrays (uses defaults if omitted)",
        },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "export_animation_only",
    description: "Export only animation data as FBX without mesh",
    category: "vrm_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Output .fbx file path" },
        armature_name: { type: "string", description: "Armature with animation" },
        action_name: { type: "string", description: "Specific action (uses active if omitted)" },
      },
      required: ["filepath", "armature_name"],
    },
  },
  {
    name: "setup_vrm_materials",
    description: "Setup VRM-compatible materials (MToon/Unlit) on all meshes under an armature",
    category: "vrm_export",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature whose children to configure" },
        shader_type: {
          type: "string",
          enum: ["MToon", "Unlit"],
          description: "VRM shader type",
          default: "MToon",
        },
        outline_width: { type: "number", description: "Outline thickness for MToon", default: 0.002 },
        shade_factor: { type: "number", description: "Shade darkness factor (0-1)", default: 0.7 },
      },
      required: ["armature_name"],
    },
  },
];

export default vrmExportTools;
