import { ToolDefinition } from "../../registry.js";

const textureEditTools: ToolDefinition[] = [
  {
    name: "adjust_hsv",
    description: "Adjust hue, saturation, and value of a texture. Creates a backup before modification.",
    category: "texture-edit",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        texture: { type: "string", description: "Asset path of the texture (e.g., Assets/Textures/body.png)" },
        hue_shift: { type: "number", description: "Hue shift in degrees (-180 to 180)", default: 0 },
        saturation_mult: { type: "number", description: "Saturation multiplier (0 = grayscale, 1 = unchanged, 2 = double)", default: 1 },
        value_mult: { type: "number", description: "Value/brightness multiplier (0 = black, 1 = unchanged, 2 = double)", default: 1 },
      },
      required: ["texture"],
    },
  },
  {
    name: "apply_gradient",
    description: "Apply a gradient overlay to a texture with configurable direction, colors, and blend mode",
    category: "texture-edit",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        texture: { type: "string", description: "Asset path of the texture" },
        top_color: { type: "string", description: "Color at the top/right (hex #RRGGBB, named color, or r,g,b)", default: "#FFFFFF" },
        bottom_color: { type: "string", description: "Color at the bottom/left (hex #RRGGBB, named color, or r,g,b)", default: "#000000" },
        direction: { type: "string", description: "Gradient direction: vertical or horizontal", default: "vertical" },
        opacity: { type: "number", description: "Gradient opacity (0-1)", default: 0.5 },
        blend_mode: { type: "string", description: "Blend mode: multiply, overlay, or add", default: "multiply" },
      },
      required: ["texture"],
    },
  },
  {
    name: "tint_region",
    description: "Tint pixels matching a source color range to a target color. Uses HSV color distance for matching.",
    category: "texture-edit",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        texture: { type: "string", description: "Asset path of the texture" },
        source_color: { type: "string", description: "Color to match (hex, named, or r,g,b)" },
        target_color: { type: "string", description: "Color to tint matched pixels toward" },
        tolerance: { type: "number", description: "Color matching tolerance (0-1, higher = more pixels affected)", default: 0.3 },
      },
      required: ["texture", "source_color", "target_color"],
    },
  },
  {
    name: "generate_pattern",
    description: "Generate a pattern texture (stripe, checker, dots, noise, diagonal) and save as PNG",
    category: "texture-edit",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "Pattern type: stripe, checker, dots, noise, diagonal", default: "checker" },
        color1: { type: "string", description: "Primary pattern color", default: "#FFFFFF" },
        color2: { type: "string", description: "Secondary pattern color", default: "#000000" },
        width: { type: "number", description: "Texture width in pixels", default: 256 },
        height: { type: "number", description: "Texture height in pixels", default: 256 },
        scale: { type: "number", description: "Pattern scale (repetitions)", default: 8 },
        path: { type: "string", description: "Asset path to save the pattern" },
      },
      required: [],
    },
  },
  {
    name: "overlay_decal",
    description: "Overlay a decal image onto a texture at a specified UV position and scale",
    category: "texture-edit",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        texture: { type: "string", description: "Asset path of the base texture" },
        decal: { type: "string", description: "Asset path of the decal image to overlay" },
        uv_x: { type: "number", description: "Horizontal UV position (0-1, 0.5 = center)", default: 0.5 },
        uv_y: { type: "number", description: "Vertical UV position (0-1, 0.5 = center)", default: 0.5 },
        scale_x: { type: "number", description: "Horizontal scale multiplier for the decal", default: 1 },
        scale_y: { type: "number", description: "Vertical scale multiplier for the decal", default: 1 },
        opacity: { type: "number", description: "Decal opacity (0-1)", default: 1 },
      },
      required: ["texture", "decal"],
    },
  },
  {
    name: "adjust_brightness_contrast",
    description: "Adjust brightness and contrast of a texture. Creates a backup before modification.",
    category: "texture-edit",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        texture: { type: "string", description: "Asset path of the texture" },
        brightness: { type: "number", description: "Brightness adjustment (-1 to 1, 0 = unchanged)", default: 0 },
        contrast: { type: "number", description: "Contrast adjustment (-1 to 1, 0 = unchanged)", default: 0 },
      },
      required: ["texture"],
    },
  },
  {
    name: "create_color_mask",
    description: "Auto-generate a grayscale mask from a color range selection on a texture",
    category: "texture-edit",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        texture: { type: "string", description: "Asset path of the source texture" },
        color: { type: "string", description: "Color to select for the mask (hex, named, or r,g,b)" },
        tolerance: { type: "number", description: "Color matching tolerance (0-1)", default: 0.3 },
        mask_path: { type: "string", description: "Output path for the mask texture (defaults to sourceName_mask.png)" },
        invert: { type: "boolean", description: "Invert the mask", default: false },
      },
      required: ["texture", "color"],
    },
  },
  {
    name: "swap_color",
    description: "Replace all pixels of one color with another color, with tolerance-based matching in HSV space",
    category: "texture-edit",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        texture: { type: "string", description: "Asset path of the texture" },
        from_color: { type: "string", description: "Color to replace (hex, named, or r,g,b)" },
        to_color: { type: "string", description: "Replacement color" },
        tolerance: { type: "number", description: "Color matching tolerance (0-1)", default: 0.2 },
        preserve_luminance: { type: "boolean", description: "Preserve original pixel luminance/brightness", default: false },
      },
      required: ["texture", "from_color", "to_color"],
    },
  },
  {
    name: "export_texture",
    description: "Export/save a texture as PNG or JPG to disk at a specified path",
    category: "texture-edit",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        texture: { type: "string", description: "Asset path of the texture to export" },
        output_path: { type: "string", description: "Output file path (defaults to texture path with _export suffix)" },
        format: { type: "string", description: "Export format: png or jpg", default: "png" },
        quality: { type: "number", description: "JPG quality (1-100, only for jpg format)", default: 90 },
      },
      required: ["texture"],
    },
  },
  {
    name: "batch_recolor",
    description: "Change the primary color across all material textures on a GameObject and its children. Operates in HSV space with tolerance-based matching.",
    category: "texture-edit",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        from_color: { type: "string", description: "Color to replace (hex, named, or r,g,b)" },
        to_color: { type: "string", description: "New color" },
        tolerance: { type: "number", description: "Color matching tolerance (0-1)", default: 0.3 },
      },
      required: ["target", "from_color", "to_color"],
    },
  },
];

export default textureEditTools;
