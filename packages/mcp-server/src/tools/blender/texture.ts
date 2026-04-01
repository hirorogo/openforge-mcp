import { ToolDefinition } from "../../registry.js";

const textureTools: ToolDefinition[] = [
  {
    name: "create_image_texture",
    description: "Create a new blank image texture in Blender's data",
    category: "texture",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Image name", default: "Texture" },
        width: { type: "number", description: "Width in pixels", default: 1024 },
        height: { type: "number", description: "Height in pixels", default: 1024 },
        color: {
          type: "array",
          items: { type: "number" },
          description: "RGBA fill color [0-1 each]",
        },
        alpha: { type: "boolean", description: "Include alpha channel", default: true },
      },
    },
  },
  {
    name: "paint_texture",
    description: "Enter texture paint mode for an object",
    category: "texture",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        object_name: { type: "string", description: "Mesh object name" },
        image_name: { type: "string", description: "Image to paint on" },
      },
      required: ["object_name"],
    },
  },
  {
    name: "bake_texture",
    description: "Bake textures (diffuse, normal, AO, etc.) for a mesh object",
    category: "texture",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        object_name: { type: "string", description: "Mesh object name" },
        bake_type: {
          type: "string",
          enum: ["DIFFUSE", "GLOSSY", "TRANSMISSION", "COMBINED", "AO", "SHADOW", "NORMAL", "UV", "ROUGHNESS", "EMIT", "ENVIRONMENT", "POSITION"],
          description: "Type of bake",
          default: "DIFFUSE",
        },
        image_name: { type: "string", description: "Target image name" },
        width: { type: "number", description: "Bake image width", default: 1024 },
        height: { type: "number", description: "Bake image height", default: 1024 },
      },
      required: ["object_name"],
    },
  },
  {
    name: "assign_texture",
    description: "Assign an image texture to a material's Principled BSDF input",
    category: "texture",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        image_name: { type: "string", description: "Image name in Blender data" },
        input_name: { type: "string", description: "BSDF input to connect to", default: "Base Color" },
      },
      required: ["material_name", "image_name"],
    },
  },
  {
    name: "create_procedural_texture",
    description: "Create a procedural texture node and connect it to a material",
    category: "texture",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        texture_type: {
          type: "string",
          enum: ["NOISE", "VORONOI", "MUSGRAVE", "WAVE", "CHECKER", "BRICK", "GRADIENT", "MAGIC"],
          description: "Procedural texture type",
          default: "NOISE",
        },
        scale: { type: "number", description: "Texture scale", default: 5.0 },
        input_name: { type: "string", description: "BSDF input to connect to", default: "Base Color" },
      },
      required: ["material_name"],
    },
  },
  {
    name: "set_texture_scale",
    description: "Set the scale parameter of a texture node",
    category: "texture",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        node_name: { type: "string", description: "Texture node name" },
        scale: { type: "number", description: "New scale value", default: 5.0 },
      },
      required: ["material_name", "node_name"],
    },
  },
  {
    name: "set_texture_mapping",
    description: "Add texture coordinate and mapping nodes to control UV/object mapping",
    category: "texture",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        mapping_type: {
          type: "string",
          enum: ["UV", "Object", "Generated", "Normal", "Window", "Reflection", "Camera"],
          description: "Texture coordinate source",
          default: "UV",
        },
      },
      required: ["material_name"],
    },
  },
  {
    name: "create_normal_map",
    description: "Add a normal map node chain to a material for surface detail",
    category: "texture",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        image_name: { type: "string", description: "Normal map image name" },
        strength: { type: "number", description: "Normal map strength", default: 1.0 },
      },
      required: ["material_name"],
    },
  },
];

export default textureTools;
