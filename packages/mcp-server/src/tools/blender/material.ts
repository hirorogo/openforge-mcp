import { ToolDefinition } from "../../registry.js";

const blenderMaterialTools: ToolDefinition[] = [
  {
    name: "create_material",
    description: "Create a new Principled BSDF material and optionally assign it to an object",
    category: "material",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the new material",
        },
        assignTo: {
          type: "string",
          description: "Name of the object to assign the material to. If omitted, the material is created but not assigned.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "set_color",
    description: "Set the base color of a Blender material's Principled BSDF node",
    category: "material",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        materialName: {
          type: "string",
          description: "Name of the material to modify",
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
          description: "RGBA base color with channels in 0-1 range",
        },
      },
      required: ["materialName", "color"],
    },
  },
  {
    name: "set_metallic",
    description: "Set the metallic value of a Blender material's Principled BSDF node",
    category: "material",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        materialName: {
          type: "string",
          description: "Name of the material to modify",
        },
        value: {
          type: "number",
          description: "Metallic value from 0.0 (dielectric) to 1.0 (fully metallic)",
          minimum: 0,
          maximum: 1,
        },
      },
      required: ["materialName", "value"],
    },
  },
  {
    name: "set_roughness",
    description: "Set the roughness value of a Blender material's Principled BSDF node",
    category: "material",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        materialName: {
          type: "string",
          description: "Name of the material to modify",
        },
        value: {
          type: "number",
          description: "Roughness value from 0.0 (perfectly smooth/glossy) to 1.0 (fully rough/diffuse)",
          minimum: 0,
          maximum: 1,
        },
      },
      required: ["materialName", "value"],
    },
  },
  {
    name: "create_glass_material",
    description: "Create a glass/transparent material with Principled BSDF configured for glass rendering",
    category: "material",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the glass material",
        },
        color: {
          type: "object",
          properties: {
            r: { type: "number", description: "Red channel (0-1)" },
            g: { type: "number", description: "Green channel (0-1)" },
            b: { type: "number", description: "Blue channel (0-1)" },
          },
          required: ["r", "g", "b"],
          description: "Tint color for the glass",
        },
        ior: {
          type: "number",
          description: "Index of Refraction (1.0 = no refraction, 1.45 = glass, 1.33 = water, 2.42 = diamond)",
          default: 1.45,
        },
        roughness: {
          type: "number",
          description: "Surface roughness (0 = perfectly clear, 1 = frosted)",
          default: 0,
        },
        assignTo: {
          type: "string",
          description: "Name of the object to assign the material to",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "create_emission_material",
    description: "Create an emissive material with a configurable emission color and strength",
    category: "material",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the emission material",
        },
        color: {
          type: "object",
          properties: {
            r: { type: "number", description: "Red channel (0-1)" },
            g: { type: "number", description: "Green channel (0-1)" },
            b: { type: "number", description: "Blue channel (0-1)" },
          },
          required: ["r", "g", "b"],
          description: "Emission color",
        },
        strength: {
          type: "number",
          description: "Emission strength in watts. Higher values produce brighter light.",
          default: 10,
        },
        assignTo: {
          type: "string",
          description: "Name of the object to assign the material to",
        },
      },
      required: ["name"],
    },
  },
];

export default blenderMaterialTools;
