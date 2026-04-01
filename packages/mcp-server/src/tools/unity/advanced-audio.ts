import { ToolDefinition } from "../../registry.js";

const advancedAudioTools: ToolDefinition[] = [
  {
    name: "create_sound_pool",
    description:
      "Create an object pool of AudioSources for efficient sound effect playback",
    category: "advanced-audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Pool name (default: SoundPool)" },
        pool_size: {
          type: "number",
          description: "Number of AudioSource instances in the pool (default 5)",
        },
        clip: { type: "string", description: "Default audio clip asset path" },
        volume: { type: "number", description: "Default volume (0-1)" },
      },
      required: [],
    },
  },
  {
    name: "setup_adaptive_music",
    description:
      "Create an adaptive music system with multiple layers that can be blended dynamically",
    category: "advanced-audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Music system name (default: AdaptiveMusic)",
        },
        layers: {
          type: "string",
          description:
            "Comma-separated layer names (default: Base,Percussion,Melody,Intensity)",
        },
        base_volume: {
          type: "number",
          description: "Volume for the base layer (default 0.7)",
        },
      },
      required: [],
    },
  },
  {
    name: "create_audio_snapshot",
    description:
      "Create or find an AudioMixer snapshot for transitioning between audio states",
    category: "advanced-audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        mixer_path: {
          type: "string",
          description: "AudioMixer asset path or name",
        },
        snapshot_name: {
          type: "string",
          description: "Name for the snapshot",
        },
      },
      required: ["mixer_path", "snapshot_name"],
    },
  },
  {
    name: "crossfade_audio",
    description:
      "Set up crossfading between two AudioSources with a generated controller script",
    category: "advanced-audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        source_a: {
          type: "string",
          description: "First AudioSource GameObject name or ID",
        },
        source_b: {
          type: "string",
          description: "Second AudioSource GameObject name or ID",
        },
        duration: {
          type: "number",
          description: "Crossfade duration in seconds (default 2)",
        },
        target_volume: {
          type: "number",
          description: "Target volume for the destination source (default 1)",
        },
        name: {
          type: "string",
          description: "Name for the crossfade controller",
        },
      },
      required: ["source_a", "source_b"],
    },
  },
  {
    name: "create_audio_zone",
    description:
      "Create an audio zone with trigger collider, AudioSource, and reverb for spatial audio areas",
    category: "advanced-audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Zone name" },
        clip: { type: "string", description: "Audio clip asset path" },
        position: { type: "string", description: "Position as 'x,y,z'" },
        inner_radius: {
          type: "number",
          description: "Inner radius for full volume (default 5)",
        },
        outer_radius: {
          type: "number",
          description: "Outer radius for volume falloff (default 15)",
        },
        volume: { type: "number", description: "Volume (0-1, default 1)" },
        shape: {
          type: "string",
          enum: ["sphere", "box"],
          description: "Collider shape (default: sphere)",
        },
      },
      required: [],
    },
  },
  {
    name: "setup_spatial_audio",
    description:
      "Configure advanced 3D spatial audio on a GameObject with custom rolloff curves",
    category: "advanced-audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        spatial_blend: {
          type: "number",
          description: "2D (0) to 3D (1) blend (default 1)",
        },
        min_distance: {
          type: "number",
          description: "Minimum hearing distance (default 1)",
        },
        max_distance: {
          type: "number",
          description: "Maximum hearing distance (default 50)",
        },
        rolloff_mode: {
          type: "string",
          enum: ["logarithmic", "linear", "custom"],
          description: "Volume rolloff mode",
        },
        doppler_level: { type: "number", description: "Doppler effect level" },
        spread: { type: "number", description: "Spread angle in degrees" },
        volume: { type: "number", description: "Volume (0-1)" },
        curve: {
          type: "string",
          enum: ["exponential", "inverse_square", "s_curve"],
          description: "Custom rolloff curve preset (sets rolloff to custom)",
        },
      },
      required: ["target"],
    },
  },
];

export default advancedAudioTools;
