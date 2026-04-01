import { ToolDefinition } from "../../registry.js";

const playtestTools: ToolDefinition[] = [
  {
    name: "enter_playmode",
    description:
      "Enter Unity play mode. Starts log capture automatically. Fails if already in play mode.",
    category: "playtest",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "exit_playmode",
    description:
      "Exit Unity play mode and stop log capture. Fails if not currently in play mode.",
    category: "playtest",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "is_playing",
    description:
      "Check whether the Unity editor is currently in play mode. Returns isPlaying, isPaused, and isCompiling flags.",
    category: "playtest",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "simulate_input",
    description:
      "Simulate keyboard or mouse input during play mode. Broadcasts to all active MonoBehaviours via SendMessage.",
    category: "playtest",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["key", "mouse"],
          description: "Type of input to simulate: 'key' for keyboard, 'mouse' for mouse events.",
          default: "key",
        },
        key: {
          type: "string",
          description: "Key name (e.g. 'Space', 'W', 'LeftArrow'). Required when type is 'key'.",
        },
        action: {
          type: "string",
          enum: ["press", "hold", "release"],
          description: "Input action type.",
          default: "press",
        },
        x: {
          type: "number",
          description: "Mouse X position in screen coordinates. Used when type is 'mouse'.",
        },
        y: {
          type: "number",
          description: "Mouse Y position in screen coordinates. Used when type is 'mouse'.",
        },
        button: {
          type: "number",
          description: "Mouse button index (0=left, 1=right, 2=middle). Used when type is 'mouse'.",
          default: 0,
        },
      },
      required: ["type"],
    },
  },
  {
    name: "get_console_logs",
    description:
      "Retrieve captured console log messages (Debug.Log, Warning, Error) from the current or most recent play mode session.",
    category: "playtest",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          enum: ["Log", "Warning", "Error", "Exception", "Assert"],
          description: "Filter logs by type. Omit to return all types.",
        },
        limit: {
          type: "number",
          description: "Maximum number of log entries to return (most recent). Defaults to 500.",
          default: 500,
        },
      },
      required: [],
    },
  },
  {
    name: "get_performance_stats",
    description:
      "Collect performance statistics: FPS, memory usage (total allocated, mono heap), draw calls, triangle/vertex counts, and scene object counts.",
    category: "playtest",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "wait_frames",
    description:
      "Step the editor forward by N frames during play mode using EditorApplication.Step(). Useful for timing between input simulation and observation.",
    category: "playtest",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        count: {
          type: "number",
          description: "Number of frames to step forward. Clamped between 1 and 10000.",
          default: 1,
        },
      },
      required: [],
    },
  },
  {
    name: "run_playtest",
    description:
      "Run a complete automated playtest session. Captures pre-playtest screenshot, enters play mode, optionally simulates inputs, waits for the specified duration, collects logs and performance stats, captures post-playtest screenshot, and exits play mode. Returns a structured report with pass/fail based on error count.",
    category: "playtest",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        duration: {
          type: "number",
          description:
            "Playtest duration in seconds. Converted to frame count at ~60fps. Clamped between 0.1 and 300.",
          default: 5,
        },
        frames: {
          type: "number",
          description:
            "Explicit frame count to step. Overrides the duration-based calculation if provided. Max 18000.",
        },
        inputs: {
          type: "string",
          description:
            "Comma-separated input sequence. Format: 'key:Space:press,key:W:hold,mouse:100:200:0:click'. Each entry is type:params.",
        },
      },
      required: [],
    },
  },
];

export default playtestTools;
