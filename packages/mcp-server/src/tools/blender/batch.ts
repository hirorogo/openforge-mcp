import { ToolDefinition } from "../../registry.js";

const batchTools: ToolDefinition[] = [
  {
    name: "batch_rename",
    description: "Rename multiple objects using a pattern with find/replace, prefix, and suffix support",
    category: "batch",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        names: {
          type: "array",
          items: { type: "string" },
          description: "Object names to rename",
        },
        pattern: {
          type: "string",
          description: "Pattern with {name}, {index}, {type} placeholders",
          default: "{name}",
        },
        find: {
          type: "string",
          description: "Substring to find in names",
        },
        replace: {
          type: "string",
          description: "Replacement for the found substring",
        },
        prefix: {
          type: "string",
          description: "Prefix to prepend",
        },
        suffix: {
          type: "string",
          description: "Suffix to append",
        },
        start_number: {
          type: "number",
          description: "Starting index for {index} placeholder",
          default: 1,
        },
      },
      required: ["names"],
    },
  },
  {
    name: "batch_transform",
    description: "Apply transform offsets to multiple objects at once",
    category: "batch",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        names: {
          type: "array",
          items: { type: "string" },
          description: "Object names to transform",
        },
        location_offset: {
          type: "array",
          items: { type: "number" },
          description: "XYZ location offset to add",
        },
        rotation_offset: {
          type: "array",
          items: { type: "number" },
          description: "XYZ rotation offset in radians",
        },
        scale_factor: {
          type: "array",
          items: { type: "number" },
          description: "XYZ scale multipliers",
        },
      },
      required: ["names"],
    },
  },
  {
    name: "batch_add_modifier",
    description: "Add a modifier to multiple objects simultaneously",
    category: "batch",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        names: {
          type: "array",
          items: { type: "string" },
          description: "Object names to add modifier to",
        },
        modifier_type: {
          type: "string",
          description: "Blender modifier type (e.g., SUBSURF, MIRROR, SOLIDIFY)",
        },
        modifier_name: {
          type: "string",
          description: "Custom name for the modifier",
        },
        properties: {
          type: "object",
          description: "Key-value properties to set on the modifier",
          additionalProperties: true,
        },
      },
      required: ["names", "modifier_type"],
    },
  },
  {
    name: "batch_apply_modifier",
    description: "Apply a named modifier on multiple objects",
    category: "batch",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        names: {
          type: "array",
          items: { type: "string" },
          description: "Object names",
        },
        modifier_name: {
          type: "string",
          description: "Name of the modifier to apply",
        },
      },
      required: ["names", "modifier_name"],
    },
  },
  {
    name: "batch_remove_modifier",
    description: "Remove a named modifier from multiple objects",
    category: "batch",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        names: {
          type: "array",
          items: { type: "string" },
          description: "Object names",
        },
        modifier_name: {
          type: "string",
          description: "Name of the modifier to remove",
        },
      },
      required: ["names", "modifier_name"],
    },
  },
  {
    name: "batch_set_material",
    description: "Assign a material to multiple objects at once",
    category: "batch",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        names: {
          type: "array",
          items: { type: "string" },
          description: "Object names",
        },
        material_name: {
          type: "string",
          description: "Material name to assign",
        },
        slot_index: {
          type: "number",
          description: "Material slot index",
          default: 0,
        },
        create_if_missing: {
          type: "boolean",
          description: "Create the material if it does not exist",
          default: true,
        },
      },
      required: ["names", "material_name"],
    },
  },
  {
    name: "batch_export",
    description: "Export multiple objects to individual files",
    category: "batch",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        names: {
          type: "array",
          items: { type: "string" },
          description: "Object names to export",
        },
        output_dir: {
          type: "string",
          description: "Directory path for exported files",
        },
        file_format: {
          type: "string",
          enum: ["FBX", "OBJ", "GLB", "GLTF"],
          description: "Export file format",
          default: "FBX",
        },
      },
      required: ["names", "output_dir"],
    },
  },
  {
    name: "batch_parent",
    description: "Set a parent for multiple child objects",
    category: "batch",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        child_names: {
          type: "array",
          items: { type: "string" },
          description: "Names of child objects",
        },
        parent_name: {
          type: "string",
          description: "Name of the parent object",
        },
        keep_transform: {
          type: "boolean",
          description: "Maintain world transforms of children",
          default: true,
        },
      },
      required: ["child_names", "parent_name"],
    },
  },
  {
    name: "batch_create",
    description: "Create multiple mesh primitives arranged along an axis",
    category: "batch",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        mesh_type: {
          type: "string",
          enum: ["cube", "sphere", "cylinder", "plane", "cone"],
          description: "Primitive type",
          default: "cube",
        },
        count: {
          type: "number",
          description: "Number of objects to create",
          default: 5,
        },
        spacing: {
          type: "number",
          description: "Distance between objects",
          default: 3.0,
        },
        axis: {
          type: "string",
          enum: ["X", "Y", "Z"],
          description: "Axis to arrange along",
          default: "X",
        },
        base_name: {
          type: "string",
          description: "Base name for created objects",
        },
        size: {
          type: "number",
          description: "Size of each primitive",
          default: 1.0,
        },
      },
      required: [],
    },
  },
  {
    name: "batch_rename_bones",
    description: "Batch rename bones in an armature with find/replace or regex",
    category: "batch",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: {
          type: "string",
          description: "Name of the armature object",
        },
        find: {
          type: "string",
          description: "Substring to find in bone names",
        },
        replace: {
          type: "string",
          description: "Replacement string",
        },
        prefix: {
          type: "string",
          description: "Prefix to add to all bone names",
        },
        suffix: {
          type: "string",
          description: "Suffix to add to all bone names",
        },
        pattern: {
          type: "string",
          description: "Regex pattern for matching (overrides find)",
        },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "batch_copy_shapes",
    description: "Copy shape keys from a source mesh to multiple target meshes",
    category: "batch",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        source_name: {
          type: "string",
          description: "Source object with shape keys",
        },
        target_names: {
          type: "array",
          items: { type: "string" },
          description: "Target objects to receive shape keys",
        },
        shape_names: {
          type: "array",
          items: { type: "string" },
          description: "Specific shape key names to copy (omit for all)",
        },
      },
      required: ["source_name", "target_names"],
    },
  },
  {
    name: "execute_sequence",
    description: "Execute multiple tool operations in sequential order",
    category: "batch",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        operations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tool: { type: "string", description: "Tool name to execute" },
              params: { type: "object", description: "Parameters for the tool", additionalProperties: true },
            },
            required: ["tool"],
          },
          description: "Ordered list of tool operations",
        },
      },
      required: ["operations"],
    },
  },
];

export default batchTools;
