import { ToolDefinition } from "../../registry.js";

const timelineTools: ToolDefinition[] = [
  {
    name: "create_timeline",
    description:
      "Create a Timeline asset and PlayableDirector, optionally attached to an existing GameObject",
    category: "timeline",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the timeline asset",
          default: "NewTimeline",
        },
        target: {
          type: "string",
          description:
            "GameObject name or instance ID to attach the PlayableDirector to. If omitted, creates a new object.",
        },
        folder: {
          type: "string",
          description: "Folder to save the timeline asset in",
          default: "Assets/Timelines",
        },
        duration: {
          type: "number",
          description: "Initial timeline duration in seconds",
          default: 10,
        },
      },
      required: [],
    },
  },
  {
    name: "add_animation_track",
    description:
      "Add an animation track to a timeline and optionally bind it to a target GameObject",
    category: "timeline",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        timeline: {
          type: "string",
          description: "Timeline asset name or path",
        },
        target: {
          type: "string",
          description:
            "GameObject name or instance ID to bind the animation track to",
        },
        track_name: {
          type: "string",
          description: "Display name of the track",
          default: "Animation Track",
        },
      },
      required: ["timeline"],
    },
  },
  {
    name: "add_activation_track",
    description:
      "Add an activation (show/hide) track to a timeline with a default clip spanning the full duration",
    category: "timeline",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        timeline: {
          type: "string",
          description: "Timeline asset name or path",
        },
        target: {
          type: "string",
          description:
            "GameObject name or instance ID to bind the activation track to",
        },
        track_name: {
          type: "string",
          description: "Display name of the track",
          default: "Activation Track",
        },
      },
      required: ["timeline"],
    },
  },
  {
    name: "add_audio_track",
    description:
      "Add an audio track to a timeline and ensure the target has an AudioSource component",
    category: "timeline",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        timeline: {
          type: "string",
          description: "Timeline asset name or path",
        },
        target: {
          type: "string",
          description:
            "GameObject name or instance ID to bind the audio track to",
        },
        track_name: {
          type: "string",
          description: "Display name of the track",
          default: "Audio Track",
        },
      },
      required: ["timeline"],
    },
  },
  {
    name: "add_signal_track",
    description:
      "Add a signal/event track to a timeline for firing custom events at specific times",
    category: "timeline",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        timeline: {
          type: "string",
          description: "Timeline asset name or path",
        },
        track_name: {
          type: "string",
          description: "Display name of the track",
          default: "Signal Track",
        },
      },
      required: ["timeline"],
    },
  },
  {
    name: "set_timeline_clip",
    description:
      "Configure a clip on a track: set its start time, duration, and display name",
    category: "timeline",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        timeline: {
          type: "string",
          description: "Timeline asset name or path",
        },
        track: {
          type: "string",
          description: "Name of the track containing the clip",
        },
        clip_index: {
          type: "number",
          description:
            "Index of the clip on the track (0-based). If the clip does not exist, a new one is created.",
          default: 0,
        },
        clip_name: {
          type: "string",
          description: "Display name for the clip",
          default: "Clip",
        },
        start: {
          type: "number",
          description: "Start time of the clip in seconds",
          default: 0,
        },
        duration: {
          type: "number",
          description: "Duration of the clip in seconds",
          default: 1,
        },
      },
      required: ["timeline", "track"],
    },
  },
  {
    name: "play_timeline",
    description:
      "Play a timeline from the start. In edit mode, evaluates at time 0; in play mode, starts playback.",
    category: "timeline",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        timeline: {
          type: "string",
          description: "Timeline asset name to play",
        },
        director: {
          type: "string",
          description:
            "Name or instance ID of the PlayableDirector GameObject. If omitted, finds the first matching director.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_timeline_info",
    description:
      "Get detailed information about a timeline including all tracks, clips, duration, and director state",
    category: "timeline",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        timeline: {
          type: "string",
          description: "Timeline asset name or path",
        },
        director: {
          type: "string",
          description:
            "Name or instance ID of the PlayableDirector to inspect",
        },
      },
      required: [],
    },
  },
];

export default timelineTools;
