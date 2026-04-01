import { ToolDefinition } from "../../registry.js";

const polyhavenTools: ToolDefinition[] = [
  {
    name: "search_polyhaven",
    description:
      "Search Poly Haven for free CC0 assets (3D models, HDRIs, textures) by keyword and type",
    category: "polyhaven",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keyword (e.g. 'brick', 'forest', 'chair')",
        },
        asset_type: {
          type: "string",
          enum: ["all", "hdris", "textures", "models"],
          description: "Filter by asset type",
          default: "all",
        },
        categories: {
          type: "string",
          description: "Comma-separated category filter (e.g. 'outdoor,nature')",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return",
          default: 20,
        },
      },
      required: [],
    },
  },
  {
    name: "download_polyhaven_model",
    description:
      "Download and optionally import a 3D model from Poly Haven into the Blender scene",
    category: "polyhaven",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        asset_id: {
          type: "string",
          description: "Poly Haven asset identifier (e.g. 'park_bench')",
        },
        resolution: {
          type: "string",
          enum: ["1k", "2k", "4k"],
          description: "Resolution tier for textures included with the model",
          default: "1k",
        },
        file_format: {
          type: "string",
          enum: ["gltf", "fbx", "blend"],
          description: "File format to download",
          default: "gltf",
        },
        import_to_scene: {
          type: "boolean",
          description: "If true, import the model into the current scene after downloading",
          default: true,
        },
      },
      required: ["asset_id"],
    },
  },
  {
    name: "download_polyhaven_hdri",
    description:
      "Download an HDRI from Poly Haven and optionally apply it as the world environment lighting",
    category: "polyhaven",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        asset_id: {
          type: "string",
          description: "HDRI asset identifier (e.g. 'rosendal_plains')",
        },
        resolution: {
          type: "string",
          enum: ["1k", "2k", "4k", "8k"],
          description: "HDRI resolution",
          default: "1k",
        },
        apply_to_world: {
          type: "boolean",
          description: "If true, set the HDRI as the world environment texture",
          default: true,
        },
      },
      required: ["asset_id"],
    },
  },
  {
    name: "download_polyhaven_texture",
    description:
      "Download a PBR texture set from Poly Haven (diffuse, normal, roughness, displacement, etc.)",
    category: "polyhaven",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        asset_id: {
          type: "string",
          description: "Texture asset identifier (e.g. 'brick_wall_001')",
        },
        resolution: {
          type: "string",
          enum: ["1k", "2k", "4k", "8k"],
          description: "Texture resolution",
          default: "1k",
        },
      },
      required: ["asset_id"],
    },
  },
  {
    name: "apply_polyhaven_hdri",
    description:
      "Apply a previously downloaded HDRI file as the world environment lighting",
    category: "polyhaven",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the .hdr or .exr file on disk",
        },
        strength: {
          type: "number",
          description: "Background lighting strength multiplier",
          default: 1.0,
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "apply_polyhaven_texture",
    description:
      "Apply downloaded Poly Haven PBR texture maps to a material on an object",
    category: "polyhaven",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        object_name: {
          type: "string",
          description: "Name of the Blender object to apply textures to",
        },
        texture_maps: {
          type: "object",
          description:
            "Mapping of map type to file path, e.g. {\"Diffuse\": \"/path/to/diff.png\", \"nor_gl\": \"/path/to/nor.png\"}",
          additionalProperties: { type: "string" },
        },
      },
      required: ["object_name", "texture_maps"],
    },
  },
  {
    name: "list_polyhaven_categories",
    description: "List available asset categories on Poly Haven",
    category: "polyhaven",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        asset_type: {
          type: "string",
          enum: ["all", "hdris", "textures", "models"],
          description: "Filter categories by asset type",
          default: "all",
        },
      },
      required: [],
    },
  },
  {
    name: "get_polyhaven_info",
    description:
      "Get detailed information about a specific Poly Haven asset including author, tags, and download count",
    category: "polyhaven",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        asset_id: {
          type: "string",
          description: "The Poly Haven asset identifier",
        },
      },
      required: ["asset_id"],
    },
  },
];

export default polyhavenTools;
