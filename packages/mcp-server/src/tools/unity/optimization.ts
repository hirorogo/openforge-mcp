import { ToolDefinition } from "../../registry.js";

const optimizationTools: ToolDefinition[] = [
  {
    name: "analyze_draw_calls",
    description: "Analyze the scene for renderer count, material usage, triangle count, and estimated draw calls",
    category: "optimization",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "create_lod_group",
    description: "Add a LOD Group to a GameObject for level-of-detail rendering",
    category: "optimization",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        levels: { type: "string", description: "Comma-separated LOD thresholds (e.g. '0.6,0.3,0.1')" },
      },
      required: ["target"],
    },
  },
  {
    name: "set_static_batching",
    description: "Mark a GameObject (and optionally children) as static for batching optimization",
    category: "optimization",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        static: { type: "boolean", description: "Enable or disable static flags", default: true },
        include_children: { type: "boolean", description: "Apply to children too", default: true },
      },
      required: ["target"],
    },
  },
  {
    name: "set_occlusion_culling",
    description: "Configure occlusion culling flags on objects or bake/clear occlusion data",
    category: "optimization",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        type: { type: "string", enum: ["occluder", "occludee", "both", "none"], description: "Occlusion type" },
        bake: { type: "boolean", description: "Start occlusion culling bake" },
        clear: { type: "boolean", description: "Clear baked occlusion data" },
      },
      required: [],
    },
  },
  {
    name: "optimize_textures",
    description: "Batch optimize texture import settings (max size, compression, mipmaps)",
    category: "optimization",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Asset folder to scan", default: "Assets" },
        max_size: { type: "number", description: "Maximum texture resolution", default: 2048 },
        format: { type: "string", enum: ["compressed", "uncompressed", "high_quality", "low_quality"], description: "Compression format" },
        mipmaps: { type: "boolean", description: "Generate mipmaps", default: true },
      },
      required: [],
    },
  },
  {
    name: "combine_meshes",
    description: "Combine child meshes of a GameObject into a single mesh to reduce draw calls",
    category: "optimization",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Parent GameObject containing meshes to combine" },
        name: { type: "string", description: "Name for the combined object" },
        merge_submeshes: { type: "boolean", description: "Merge into single submesh", default: true },
        save_path: { type: "string", description: "Asset path to save the combined mesh" },
        disable_originals: { type: "boolean", description: "Disable original mesh objects", default: false },
      },
      required: ["target"],
    },
  },
  {
    name: "set_quality_settings",
    description: "Configure graphics quality level and individual settings",
    category: "optimization",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        level: { type: "string", description: "Quality level name or index" },
        vsync: { type: "number", description: "VSync count (0=off, 1=every vblank, 2=every other)" },
        anti_aliasing: { type: "number", description: "Anti-aliasing samples (0, 2, 4, 8)" },
        anisotropic_filtering: { type: "string", description: "Anisotropic filtering: Disable, Enable, ForceEnable" },
        lod_bias: { type: "number", description: "LOD bias (higher=more detail)" },
        pixel_light_count: { type: "number", description: "Max per-pixel lights" },
        texture_quality: { type: "number", description: "Texture mipmap limit (0=full, 1=half, 2=quarter)" },
      },
      required: [],
    },
  },
  {
    name: "get_performance_stats",
    description: "Get scene complexity statistics: object counts, triangle counts, system info",
    category: "optimization",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

export default optimizationTools;
