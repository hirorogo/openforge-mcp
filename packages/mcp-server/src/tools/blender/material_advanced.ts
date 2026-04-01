import { ToolDefinition } from "../../registry.js";

const materialAdvancedTools: ToolDefinition[] = [
  {
    name: "create_principled",
    description: "Create a Principled BSDF material with full control over all shader settings",
    category: "material_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Material name" },
        color: { type: "array", items: { type: "number" }, description: "RGBA base color" },
        metallic: { type: "number", description: "Metallic (0-1)", default: 0.0 },
        roughness: { type: "number", description: "Roughness (0-1)", default: 0.5 },
        specular: { type: "number", description: "Specular (0-1)", default: 0.5 },
        ior: { type: "number", description: "Index of refraction", default: 1.45 },
        transmission: { type: "number", description: "Transmission/glass (0-1)", default: 0.0 },
        emission_color: { type: "array", items: { type: "number" }, description: "Emission color RGBA" },
        emission_strength: { type: "number", description: "Emission strength", default: 0.0 },
        alpha: { type: "number", description: "Alpha (0-1)", default: 1.0 },
        normal_strength: { type: "number", description: "Normal map strength", default: 1.0 },
        assign_to: { type: "string", description: "Object to assign material to" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_materials",
    description: "List all materials in the scene with usage and node information",
    category: "material_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "copy_material",
    description: "Copy a material from one object to another",
    category: "material_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        source_object: { type: "string", description: "Source object name" },
        target_object: { type: "string", description: "Target object name" },
        slot_index: { type: "number", description: "Material slot index to copy", default: 0 },
      },
      required: ["source_object", "target_object"],
    },
  },
  {
    name: "assign_to_faces",
    description: "Assign a material to specific faces of a mesh",
    category: "material_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        material_name: { type: "string", description: "Material name" },
        face_indices: { type: "array", items: { type: "number" }, description: "Face indices (all faces if omitted)" },
      },
      required: ["name", "material_name"],
    },
  },
  {
    name: "combine_materials",
    description: "Merge multiple material slots into one on an object",
    category: "material_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        material_names: { type: "array", items: { type: "string" }, description: "Materials to combine (all if omitted)" },
        combined_name: { type: "string", description: "Combined material name", default: "Combined" },
      },
      required: ["name"],
    },
  },
  {
    name: "create_color_variant",
    description: "Create a color variant by duplicating a material and changing its base color",
    category: "material_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        source_material: { type: "string", description: "Source material to copy" },
        new_name: { type: "string", description: "Name for new variant" },
        color: { type: "array", items: { type: "number" }, description: "New RGBA base color" },
      },
      required: ["source_material", "new_name", "color"],
    },
  },
  {
    name: "add_image_texture",
    description: "Add a texture image node to a material and connect to Principled BSDF",
    category: "material_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        image_path: { type: "string", description: "Image file path" },
        input_name: { type: "string", description: "BSDF input (Base Color, Roughness, Normal, Metallic)", default: "Base Color" },
      },
      required: ["material_name", "image_path"],
    },
  },
  {
    name: "swap_texture",
    description: "Swap the texture image in a material's Image Texture node",
    category: "material_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        node_name: { type: "string", description: "Image Texture node name" },
        new_image_path: { type: "string", description: "New image file path" },
      },
      required: ["material_name", "node_name", "new_image_path"],
    },
  },
  {
    name: "extract_textures",
    description: "Extract all texture images from a material to files on disk",
    category: "material_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        output_dir: { type: "string", description: "Output directory path" },
      },
      required: ["material_name", "output_dir"],
    },
  },
  {
    name: "resize_textures",
    description: "Resize all texture images used in a material",
    category: "material_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        width: { type: "number", description: "Target width in pixels", default: 1024 },
        height: { type: "number", description: "Target height in pixels", default: 1024 },
      },
      required: ["material_name"],
    },
  },
];

export default materialAdvancedTools;
