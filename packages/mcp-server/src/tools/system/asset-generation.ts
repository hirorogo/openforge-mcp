import { ToolDefinition } from "../../registry.js";

const assetGenerationTools: ToolDefinition[] = [
  {
    name: "generate_3d_model",
    description:
      "Generate a 3D model from a text description using an AI provider (Rodin, Meshy, or Tripo). Returns the file path of the generated model.",
    category: "asset-generation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Text description of the 3D model to generate.",
        },
        provider: {
          type: "string",
          enum: ["rodin", "meshy", "tripo"],
          description:
            "AI provider to use. If omitted, uses OPENFORGE_MESH_PROVIDER env var or first configured provider.",
        },
        format: {
          type: "string",
          enum: ["glb", "fbx", "obj"],
          description: "Output file format. Defaults to glb.",
        },
        polycount: {
          type: "number",
          description: "Target polygon count for the generated model.",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "generate_texture",
    description:
      "Generate a texture or image from a text description using an AI provider (Stable Diffusion or DALL-E). Supports albedo, normal, roughness, and PBR texture types.",
    category: "asset-generation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Text description of the texture to generate.",
        },
        provider: {
          type: "string",
          enum: ["stable-diffusion", "dall-e"],
          description:
            "AI provider to use. If omitted, uses OPENFORGE_TEXTURE_PROVIDER env var or first configured provider.",
        },
        type: {
          type: "string",
          enum: ["albedo", "normal", "roughness", "pbr"],
          description: "Type of texture map to generate. Defaults to albedo.",
        },
        width: {
          type: "number",
          description: "Image width in pixels.",
        },
        height: {
          type: "number",
          description: "Image height in pixels.",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "generate_audio",
    description:
      "Generate audio from a text description using an AI provider (Suno for music, ElevenLabs for sound effects). Returns the file path of the generated audio.",
    category: "asset-generation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Text description of the audio to generate.",
        },
        provider: {
          type: "string",
          enum: ["suno", "elevenlabs"],
          description:
            "AI provider to use. If omitted, uses OPENFORGE_AUDIO_PROVIDER env var or first configured provider.",
        },
        type: {
          type: "string",
          enum: ["music", "sfx"],
          description: "Type of audio to generate. Suno is best for music, ElevenLabs for sfx.",
        },
        duration: {
          type: "number",
          description: "Desired audio duration in seconds.",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "generate_skybox",
    description:
      "Generate a 360-degree skybox image from a text description using Blockade Labs Skybox AI. Returns the file path of the generated skybox.",
    category: "asset-generation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Text description of the skybox environment to generate.",
        },
        provider: {
          type: "string",
          enum: ["blockade"],
          description: "AI provider to use. Currently only Blockade Labs is supported.",
        },
        style: {
          type: "string",
          description: "Skybox style ID from Blockade Labs.",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "get_generation_providers",
    description:
      "Check which AI asset generation providers are configured (have API keys set). Returns the status for each provider across mesh, texture, audio, and skybox categories.",
    category: "asset-generation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

export default assetGenerationTools;
