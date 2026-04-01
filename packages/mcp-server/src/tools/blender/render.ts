import { ToolDefinition } from "../../registry.js";

const renderTools: ToolDefinition[] = [
  {
    name: "render_image",
    description: "Render the current frame to an image file",
    category: "render",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        output_path: {
          type: "string",
          description: "File path for the output image",
        },
      },
    },
  },
  {
    name: "render_animation",
    description: "Render the full animation sequence to files",
    category: "render",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        output_path: {
          type: "string",
          description: "Base file path for the output frames",
        },
      },
    },
  },
  {
    name: "set_output_format",
    description: "Set the render output file format and related options",
    category: "render",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        file_format: {
          type: "string",
          enum: ["PNG", "JPEG", "BMP", "TIFF", "OPEN_EXR", "FFMPEG"],
          description: "Output file format",
          default: "PNG",
        },
        color_mode: {
          type: "string",
          enum: ["BW", "RGB", "RGBA"],
          description: "Color mode",
          default: "RGBA",
        },
        color_depth: {
          type: "string",
          enum: ["8", "16", "32"],
          description: "Color depth per channel",
          default: "8",
        },
        compression: {
          type: "number",
          description: "PNG compression (0-100)",
          default: 15,
        },
        quality: {
          type: "number",
          description: "JPEG quality (0-100)",
          default: 90,
        },
      },
    },
  },
  {
    name: "set_output_path",
    description: "Set the render output file path",
    category: "render",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Output directory or file path",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "set_render_samples",
    description: "Set the number of render samples and denoising option",
    category: "render",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        samples: {
          type: "number",
          description: "Number of render samples",
          default: 128,
        },
        denoise: {
          type: "boolean",
          description: "Enable denoising",
          default: true,
        },
      },
    },
  },
  {
    name: "set_transparent_background",
    description: "Enable or disable transparent background for renders",
    category: "render",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        transparent: {
          type: "boolean",
          description: "Whether to render with a transparent background",
          default: true,
        },
      },
    },
  },
  {
    name: "set_film_exposure",
    description: "Set the film exposure value for rendering",
    category: "render",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        exposure: {
          type: "number",
          description: "Exposure value (1.0 is default)",
          default: 1.0,
        },
      },
    },
  },
  {
    name: "set_color_management",
    description: "Configure color management settings for rendering",
    category: "render",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        view_transform: {
          type: "string",
          description: "View transform (Standard, Filmic, AgX, Raw, etc.)",
          default: "Filmic",
        },
        look: {
          type: "string",
          description: "Look preset (None, High Contrast, etc.)",
          default: "None",
        },
        gamma: {
          type: "number",
          description: "Display gamma",
          default: 1.0,
        },
      },
    },
  },
  {
    name: "create_compositor_node",
    description: "Add a compositor node to the scene compositor node tree",
    category: "render",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        node_type: {
          type: "string",
          description: "Blender compositor node type (e.g. CompositorNodeGlare)",
          default: "CompositorNodeGlare",
        },
      },
    },
  },
  {
    name: "set_render_border",
    description: "Set a render border to render only a portion of the frame",
    category: "render",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        min_x: { type: "number", description: "Left boundary (0-1)", default: 0.0 },
        min_y: { type: "number", description: "Bottom boundary (0-1)", default: 0.0 },
        max_x: { type: "number", description: "Right boundary (0-1)", default: 1.0 },
        max_y: { type: "number", description: "Top boundary (0-1)", default: 1.0 },
        enabled: { type: "boolean", description: "Enable the render border", default: true },
      },
    },
  },
];

export default renderTools;
