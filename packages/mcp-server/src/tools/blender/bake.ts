import { ToolDefinition } from "../../registry.js";

const bakeTools: ToolDefinition[] = [
  {
    name: "bake_diffuse",
    description: "Bake diffuse/albedo color map from an object's materials",
    category: "bake",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the object to bake from",
        },
        image_name: {
          type: "string",
          description: "Name for the bake result image",
          default: "BakeDiffuse",
        },
        width: {
          type: "number",
          description: "Image width in pixels",
          default: 1024,
        },
        height: {
          type: "number",
          description: "Image height in pixels",
          default: 1024,
        },
        samples: {
          type: "number",
          description: "Number of render samples for baking",
          default: 64,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "bake_normal",
    description: "Bake normal map from an object's surface geometry",
    category: "bake",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the object to bake from",
        },
        image_name: {
          type: "string",
          description: "Name for the bake result image",
          default: "BakeNormal",
        },
        width: {
          type: "number",
          description: "Image width in pixels",
          default: 1024,
        },
        height: {
          type: "number",
          description: "Image height in pixels",
          default: 1024,
        },
        samples: {
          type: "number",
          description: "Number of render samples",
          default: 64,
        },
        normal_space: {
          type: "string",
          enum: ["TANGENT", "OBJECT"],
          description: "Normal map space",
          default: "TANGENT",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "bake_ao",
    description: "Bake ambient occlusion map for an object",
    category: "bake",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the object to bake from",
        },
        image_name: {
          type: "string",
          description: "Name for the bake result image",
          default: "BakeAO",
        },
        width: {
          type: "number",
          description: "Image width in pixels",
          default: 1024,
        },
        height: {
          type: "number",
          description: "Image height in pixels",
          default: 1024,
        },
        samples: {
          type: "number",
          description: "Number of render samples (higher reduces noise)",
          default: 128,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "bake_emission",
    description: "Bake emission map from an object's materials",
    category: "bake",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the object to bake from",
        },
        image_name: {
          type: "string",
          description: "Name for the bake result image",
          default: "BakeEmission",
        },
        width: {
          type: "number",
          description: "Image width in pixels",
          default: 1024,
        },
        height: {
          type: "number",
          description: "Image height in pixels",
          default: 1024,
        },
        samples: {
          type: "number",
          description: "Number of render samples",
          default: 64,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "bake_combined",
    description: "Bake all render passes combined into a single texture image",
    category: "bake",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the object to bake from",
        },
        image_name: {
          type: "string",
          description: "Name for the bake result image",
          default: "BakeCombined",
        },
        width: {
          type: "number",
          description: "Image width in pixels",
          default: 1024,
        },
        height: {
          type: "number",
          description: "Image height in pixels",
          default: 1024,
        },
        samples: {
          type: "number",
          description: "Number of render samples",
          default: 128,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "bake_from_highpoly",
    description: "Bake texture data from a high-poly mesh onto a low-poly mesh using ray projection",
    category: "bake",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        lowpoly_name: {
          type: "string",
          description: "Name of the low-poly target object",
        },
        highpoly_name: {
          type: "string",
          description: "Name of the high-poly source object",
        },
        bake_type: {
          type: "string",
          enum: ["NORMAL", "DIFFUSE", "AO", "COMBINED", "EMIT", "ROUGHNESS"],
          description: "Type of bake pass",
          default: "NORMAL",
        },
        image_name: {
          type: "string",
          description: "Name for the result image",
          default: "BakeHighToLow",
        },
        width: {
          type: "number",
          description: "Image width",
          default: 2048,
        },
        height: {
          type: "number",
          description: "Image height",
          default: 2048,
        },
        samples: {
          type: "number",
          description: "Render samples",
          default: 128,
        },
        ray_distance: {
          type: "number",
          description: "Maximum ray distance for projection",
          default: 0.1,
        },
        cage_extrusion: {
          type: "number",
          description: "Cage extrusion distance",
          default: 0.0,
        },
      },
      required: ["lowpoly_name", "highpoly_name"],
    },
  },
  {
    name: "setup_bake_cage",
    description: "Create a cage mesh for baking by duplicating and inflating the low-poly mesh along normals",
    category: "bake",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        lowpoly_name: {
          type: "string",
          description: "Name of the low-poly object",
        },
        extrusion: {
          type: "number",
          description: "Inflation distance along normals",
          default: 0.05,
        },
        cage_name: {
          type: "string",
          description: "Name for the cage object",
        },
      },
      required: ["lowpoly_name"],
    },
  },
  {
    name: "export_texture_set",
    description: "Export multiple baked texture images to disk files",
    category: "bake",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        image_names: {
          type: "array",
          items: { type: "string" },
          description: "Names of images in Blender to export",
        },
        output_dir: {
          type: "string",
          description: "Output directory path",
        },
        file_format: {
          type: "string",
          enum: ["PNG", "TARGA", "OPEN_EXR", "JPEG"],
          description: "Image file format",
          default: "PNG",
        },
        color_depth: {
          type: "string",
          enum: ["8", "16", "32"],
          description: "Bit depth for the output",
          default: "8",
        },
      },
      required: ["image_names", "output_dir"],
    },
  },
  {
    name: "bake_curvature",
    description: "Bake a curvature map using geometry pointiness data",
    category: "bake",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the object to bake from",
        },
        image_name: {
          type: "string",
          description: "Name for the bake result image",
          default: "BakeCurvature",
        },
        width: {
          type: "number",
          description: "Image width",
          default: 1024,
        },
        height: {
          type: "number",
          description: "Image height",
          default: 1024,
        },
        samples: {
          type: "number",
          description: "Number of render samples",
          default: 64,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "bake_roughness",
    description: "Bake roughness values from Principled BSDF materials into a texture",
    category: "bake",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the object to bake from",
        },
        image_name: {
          type: "string",
          description: "Name for the bake result image",
          default: "BakeRoughness",
        },
        width: {
          type: "number",
          description: "Image width",
          default: 1024,
        },
        height: {
          type: "number",
          description: "Image height",
          default: 1024,
        },
        samples: {
          type: "number",
          description: "Number of render samples",
          default: 64,
        },
      },
      required: ["name"],
    },
  },
];

export default bakeTools;
