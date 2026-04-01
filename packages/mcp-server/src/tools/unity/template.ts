import { ToolDefinition } from "../../registry.js";

const templateTools: ToolDefinition[] = [
  {
    name: "create_fps_controller",
    description:
      "Create a complete first-person character controller with camera, mouse look, WASD movement, jumping, sprinting, and head bob",
    category: "template",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the player GameObject",
          default: "FPSPlayer",
        },
        speed: {
          type: "number",
          description: "Walk speed in units per second",
          default: 6,
        },
        jump_force: {
          type: "number",
          description: "Jump force",
          default: 8,
        },
        mouse_sensitivity: {
          type: "number",
          description: "Mouse look sensitivity",
          default: 2,
        },
        position: {
          type: "string",
          description: "Initial position as [x,y,z]",
        },
        folder: {
          type: "string",
          description: "Folder for generated scripts",
          default: "Assets/Scripts/Player",
        },
      },
      required: [],
    },
  },
  {
    name: "create_tps_controller",
    description:
      "Create a third-person character controller with orbital camera, camera collision, and smooth rotation toward movement direction",
    category: "template",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the player GameObject",
          default: "TPSPlayer",
        },
        speed: {
          type: "number",
          description: "Walk speed in units per second",
          default: 5,
        },
        camera_distance: {
          type: "number",
          description: "Camera distance from player",
          default: 5,
        },
        position: {
          type: "string",
          description: "Initial position as [x,y,z]",
        },
        folder: {
          type: "string",
          description: "Folder for generated scripts",
          default: "Assets/Scripts/Player",
        },
      },
      required: [],
    },
  },
  {
    name: "create_platformer_controller",
    description:
      "Create a 2D or 3D platformer controller with double jump, coyote time, jump buffering, and optional wall slide",
    category: "template",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the player GameObject",
          default: "PlatformerPlayer",
        },
        mode: {
          type: "string",
          enum: ["2d", "3d"],
          description: "2D or 3D platformer mode",
          default: "2d",
        },
        speed: {
          type: "number",
          description: "Move speed",
          default: 7,
        },
        jump_force: {
          type: "number",
          description: "Jump force",
          default: 12,
        },
        position: {
          type: "string",
          description: "Initial position as [x,y,z]",
        },
        folder: {
          type: "string",
          description: "Folder for generated scripts",
          default: "Assets/Scripts/Player",
        },
      },
      required: [],
    },
  },
  {
    name: "create_inventory_system",
    description:
      "Create a complete inventory system with ScriptableObject items, slot management, stacking, and events for UI binding",
    category: "template",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        slots: {
          type: "number",
          description: "Number of inventory slots",
          default: 20,
        },
        folder: {
          type: "string",
          description: "Folder for generated scripts",
          default: "Assets/Scripts/Systems",
        },
      },
      required: [],
    },
  },
  {
    name: "create_health_system",
    description:
      "Create a health/damage system with optional shield, invincibility frames, and events for UI and death handling",
    category: "template",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description:
            "GameObject to attach to. If omitted, creates a new GameObject.",
        },
        max_health: {
          type: "number",
          description: "Maximum health value",
          default: 100,
        },
        shield: {
          type: "boolean",
          description: "Enable shield system with auto-regeneration",
          default: false,
        },
        folder: {
          type: "string",
          description: "Folder for generated scripts",
          default: "Assets/Scripts/Systems",
        },
      },
      required: [],
    },
  },
  {
    name: "create_dialogue_system",
    description:
      "Create a dialogue/conversation system with ScriptableObject nodes, branching choices, condition flags, and UI integration",
    category: "template",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        folder: {
          type: "string",
          description: "Folder for generated scripts",
          default: "Assets/Scripts/Systems",
        },
      },
      required: [],
    },
  },
  {
    name: "create_state_machine",
    description:
      "Create a generic finite state machine framework with IState interface, conditional transitions, and example idle/moving states",
    category: "template",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        folder: {
          type: "string",
          description: "Folder for generated scripts",
          default: "Assets/Scripts/Systems",
        },
      },
      required: [],
    },
  },
  {
    name: "create_spawn_system",
    description:
      "Create an object spawner with built-in pooling, weighted random prefab selection, multiple spawn points, and wave-based spawning",
    category: "template",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        pool_size: {
          type: "number",
          description: "Pool size per prefab",
          default: 20,
        },
        interval: {
          type: "number",
          description: "Spawn interval in seconds",
          default: 2,
        },
        folder: {
          type: "string",
          description: "Folder for generated scripts",
          default: "Assets/Scripts/Systems",
        },
      },
      required: [],
    },
  },
  {
    name: "create_waypoint_system",
    description:
      "Create a waypoint navigation system with loop, ping-pong, once, and random patrol modes, speed curves, and wait times",
    category: "template",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the waypoint system container",
          default: "WaypointSystem",
        },
        mode: {
          type: "string",
          enum: ["loop", "pingpong", "once", "random"],
          description: "Patrol mode",
          default: "loop",
        },
        speed: {
          type: "number",
          description: "Movement speed",
          default: 3,
        },
        folder: {
          type: "string",
          description: "Folder for generated scripts",
          default: "Assets/Scripts/Systems",
        },
      },
      required: [],
    },
  },
  {
    name: "create_score_system",
    description:
      "Create a score/points tracking system with combo multiplier, high score persistence via PlayerPrefs, and events for UI",
    category: "template",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        initial_score: {
          type: "number",
          description: "Starting score",
          default: 0,
        },
        persistent: {
          type: "boolean",
          description: "Persist high score to PlayerPrefs",
          default: true,
        },
        folder: {
          type: "string",
          description: "Folder for generated scripts",
          default: "Assets/Scripts/Systems",
        },
      },
      required: [],
    },
  },
];

export default templateTools;
