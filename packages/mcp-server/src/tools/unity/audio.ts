import { ToolDefinition } from "../../registry.js";

const audioTools: ToolDefinition[] = [
  {
    name: "add_audio_source",
    description: "Add an AudioSource component to a GameObject with optional settings",
    category: "audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        clip: { type: "string", description: "Audio clip asset path" },
        volume: { type: "number", description: "Volume (0-1)" },
        pitch: { type: "number", description: "Pitch multiplier" },
        loop: { type: "boolean", description: "Enable looping" },
        play_on_awake: { type: "boolean", description: "Auto-play on scene start" },
        spatial_blend: { type: "number", description: "2D (0) to 3D (1) blend" },
      },
      required: ["target"],
    },
  },
  {
    name: "play_audio",
    description: "Play an AudioSource on a GameObject",
    category: "audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID with AudioSource" },
        clip: { type: "string", description: "Optional clip path to play instead of current" },
      },
      required: ["target"],
    },
  },
  {
    name: "stop_audio",
    description: "Stop an AudioSource on a GameObject",
    category: "audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID with AudioSource" },
      },
      required: ["target"],
    },
  },
  {
    name: "set_audio_clip",
    description: "Assign an audio clip to an AudioSource",
    category: "audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        clip: { type: "string", description: "Audio clip asset path or name" },
      },
      required: ["target", "clip"],
    },
  },
  {
    name: "set_audio_volume",
    description: "Set volume and pitch of an AudioSource",
    category: "audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        volume: { type: "number", description: "Volume (0-1)" },
        pitch: { type: "number", description: "Pitch multiplier" },
      },
      required: ["target", "volume"],
    },
  },
  {
    name: "set_audio_3d",
    description: "Configure 3D spatial audio settings on an AudioSource",
    category: "audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        spatial_blend: { type: "number", description: "2D (0) to 3D (1) blend" },
        min_distance: { type: "number", description: "Minimum hearing distance" },
        max_distance: { type: "number", description: "Maximum hearing distance" },
        rolloff_mode: { type: "string", enum: ["logarithmic", "linear", "custom"], description: "Volume rolloff mode" },
        doppler_level: { type: "number", description: "Doppler effect level" },
        spread: { type: "number", description: "Spread angle in degrees" },
      },
      required: ["target"],
    },
  },
  {
    name: "create_audio_mixer",
    description: "Create an Audio Mixer asset for audio routing and effects",
    category: "audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mixer name" },
        path: { type: "string", description: "Asset save path" },
      },
      required: [],
    },
  },
  {
    name: "add_audio_reverb_zone",
    description: "Create an Audio Reverb Zone for environmental audio effects",
    category: "audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Reverb zone name" },
        position: { type: "string", description: "Position as 'x,y,z'" },
        min_distance: { type: "number", description: "Inner distance for full reverb" },
        max_distance: { type: "number", description: "Outer distance for reverb falloff" },
        preset: { type: "string", description: "Reverb preset (e.g. Cave, Hallway, Arena)" },
      },
      required: [],
    },
  },
  {
    name: "set_audio_listener",
    description: "Move the AudioListener to a specific GameObject (removes others)",
    category: "audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID to receive the AudioListener" },
      },
      required: ["target"],
    },
  },
  {
    name: "create_ambient_sound",
    description: "Create a looping ambient sound source with optional 3D positioning",
    category: "audio",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Sound source name" },
        clip: { type: "string", description: "Audio clip asset path" },
        volume: { type: "number", description: "Volume (0-1)", default: 0.5 },
        position: { type: "string", description: "Position as 'x,y,z' (makes it 3D)" },
        min_distance: { type: "number", description: "3D min distance", default: 5 },
        max_distance: { type: "number", description: "3D max distance", default: 50 },
      },
      required: [],
    },
  },
];

export default audioTools;
