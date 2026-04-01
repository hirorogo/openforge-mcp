import { ToolDefinition } from "../../registry.js";

const materialTools: ToolDefinition[] = [
  {
    name: "create_material",
    description: "Create a new Unity material with a specified shader and save it as an asset",
    category: "material",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the new material asset",
        },
        shader: {
          type: "string",
          description: "Shader name (e.g. 'Standard', 'Universal Render Pipeline/Lit', 'HDRP/Lit')",
          default: "Standard",
        },
        savePath: {
          type: "string",
          description: "Asset path to save the material (e.g. 'Assets/Materials/MyMat.mat')",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "set_material_color",
    description: "Set a color property on a material (e.g. base color, emission color)",
    category: "material",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        materialPath: {
          type: "string",
          description: "Asset path of the material or instance ID",
        },
        property: {
          type: "string",
          description: "Shader property name (e.g. '_Color', '_BaseColor', '_EmissionColor')",
          default: "_Color",
        },
        color: {
          type: "object",
          properties: {
            r: { type: "number", description: "Red channel (0-1)" },
            g: { type: "number", description: "Green channel (0-1)" },
            b: { type: "number", description: "Blue channel (0-1)" },
            a: { type: "number", description: "Alpha channel (0-1)", default: 1.0 },
          },
          required: ["r", "g", "b"],
          description: "RGBA color with channels in 0-1 range",
        },
      },
      required: ["materialPath", "color"],
    },
  },
  {
    name: "set_material_shader",
    description: "Change the shader used by an existing material",
    category: "material",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        materialPath: {
          type: "string",
          description: "Asset path of the material or instance ID",
        },
        shader: {
          type: "string",
          description: "Full shader name (e.g. 'Standard', 'Universal Render Pipeline/Lit')",
        },
      },
      required: ["materialPath", "shader"],
    },
  },
  {
    name: "set_material_texture",
    description: "Assign a texture to a material property slot",
    category: "material",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        materialPath: {
          type: "string",
          description: "Asset path of the material or instance ID",
        },
        property: {
          type: "string",
          description: "Shader texture property name (e.g. '_MainTex', '_BaseMap', '_BumpMap', '_MetallicGlossMap')",
        },
        texturePath: {
          type: "string",
          description: "Asset path of the texture to assign (e.g. 'Assets/Textures/Brick.png')",
        },
        tiling: {
          type: "object",
          properties: {
            x: { type: "number", description: "Tiling X scale" },
            y: { type: "number", description: "Tiling Y scale" },
          },
          required: ["x", "y"],
          description: "Texture tiling scale",
        },
        offset: {
          type: "object",
          properties: {
            x: { type: "number", description: "Offset X" },
            y: { type: "number", description: "Offset Y" },
          },
          required: ["x", "y"],
          description: "Texture offset",
        },
      },
      required: ["materialPath", "property", "texturePath"],
    },
  },
  {
    name: "set_material_property",
    description: "Set a generic float, int, or vector property on a material",
    category: "material",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        materialPath: {
          type: "string",
          description: "Asset path of the material or instance ID",
        },
        property: {
          type: "string",
          description: "Shader property name (e.g. '_Metallic', '_Glossiness', '_Cutoff')",
        },
        value: {
          description: "Value to set. A number for float/int properties, or an object {x,y,z,w} for vector properties.",
          oneOf: [
            { type: "number" },
            {
              type: "object",
              properties: {
                x: { type: "number" },
                y: { type: "number" },
                z: { type: "number" },
                w: { type: "number" },
              },
              required: ["x", "y"],
            },
          ],
        },
      },
      required: ["materialPath", "property", "value"],
    },
  },
  {
    name: "get_material_info",
    description: "Retrieve all properties and their current values from a material including shader name, colors, textures, and numeric properties",
    category: "material",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        materialPath: {
          type: "string",
          description: "Asset path of the material or instance ID",
        },
      },
      required: ["materialPath"],
    },
  },
];

export default materialTools;
