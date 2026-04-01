import { ToolDefinition } from "../../registry.js";

const lightingTools: ToolDefinition[] = [
  {
    name: "create_light",
    description: "Create a new light object in the scene (point, sun, spot, or area)",
    category: "lighting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        light_type: {
          type: "string",
          enum: ["POINT", "SUN", "SPOT", "AREA"],
          description: "Type of light",
          default: "POINT",
        },
        name: { type: "string", description: "Name for the light", default: "Light" },
        location: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" }, z: { type: "number" } },
          required: ["x", "y", "z"],
          description: "World location",
        },
        energy: { type: "number", description: "Light energy in watts", default: 1000.0 },
        color: {
          type: "array",
          items: { type: "number" },
          description: "RGB color [0-1 each]",
        },
      },
    },
  },
  {
    name: "setup_studio_lighting",
    description: "Create a studio lighting setup with key, fill, and rim area lights",
    category: "lighting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        key_energy: { type: "number", description: "Key light energy", default: 1000.0 },
        fill_energy: { type: "number", description: "Fill light energy", default: 500.0 },
        rim_energy: { type: "number", description: "Rim light energy", default: 750.0 },
        distance: { type: "number", description: "Distance from origin", default: 5.0 },
      },
    },
  },
  {
    name: "setup_3point_lighting",
    description: "Create a classic 3-point lighting setup (key, fill, back)",
    category: "lighting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        energy: { type: "number", description: "Base energy for key light", default: 1000.0 },
        distance: { type: "number", description: "Distance from center", default: 5.0 },
        height: { type: "number", description: "Height above ground", default: 3.0 },
      },
    },
  },
  {
    name: "create_hdri_environment",
    description: "Set up an HDRI environment map for image-based lighting",
    category: "lighting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: { type: "string", description: "Path to the HDR/EXR image file" },
        strength: { type: "number", description: "Environment light strength", default: 1.0 },
        rotation: { type: "number", description: "Z-axis rotation in degrees", default: 0.0 },
      },
      required: ["filepath"],
    },
  },
  {
    name: "set_world_background",
    description: "Set a solid color world background",
    category: "lighting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        color: {
          type: "array",
          items: { type: "number" },
          description: "RGB color [0-1 each]",
        },
        strength: { type: "number", description: "Background strength", default: 1.0 },
      },
    },
  },
  {
    name: "set_light_energy",
    description: "Set the energy/power of an existing light",
    category: "lighting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Light object name" },
        energy: { type: "number", description: "Energy in watts" },
      },
      required: ["name", "energy"],
    },
  },
  {
    name: "set_light_color",
    description: "Set the color of an existing light",
    category: "lighting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Light object name" },
        color: {
          type: "array",
          items: { type: "number" },
          description: "RGB color [0-1 each]",
        },
      },
      required: ["name", "color"],
    },
  },
  {
    name: "set_light_shadow",
    description: "Configure shadow settings for a light",
    category: "lighting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Light object name" },
        use_shadow: { type: "boolean", description: "Enable shadows", default: true },
        shadow_soft_size: { type: "number", description: "Shadow softness", default: 0.25 },
      },
      required: ["name"],
    },
  },
  {
    name: "create_area_light",
    description: "Create an area light with configurable shape and dimensions",
    category: "lighting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Light name", default: "AreaLight" },
        location: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" }, z: { type: "number" } },
          required: ["x", "y", "z"],
        },
        energy: { type: "number", description: "Energy in watts", default: 1000.0 },
        size: { type: "number", description: "Size (X dimension)", default: 2.0 },
        shape: {
          type: "string",
          enum: ["SQUARE", "RECTANGLE", "DISK", "ELLIPSE"],
          description: "Area light shape",
          default: "RECTANGLE",
        },
        size_y: { type: "number", description: "Y dimension", default: 2.0 },
      },
    },
  },
  {
    name: "set_environment_strength",
    description: "Set the environment/world background light strength",
    category: "lighting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        strength: { type: "number", description: "Background light strength", default: 1.0 },
      },
    },
  },
];

export default lightingTools;
