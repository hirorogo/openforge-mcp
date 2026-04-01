import { ToolDefinition } from "../../registry.js";

const inputTools: ToolDefinition[] = [
  {
    name: "setup_input_system",
    description:
      "Configure a central input system manager with movement, look, and action events",
    category: "input",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        folder: {
          type: "string",
          description: "Folder to create the script in",
          default: "Assets/Scripts/Input",
        },
      },
      required: [],
    },
  },
  {
    name: "create_input_action",
    description:
      "Create an input action script that reads a specific key or axis and fires events",
    category: "input",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the input action (e.g. 'Jump', 'Fire', 'Interact')",
        },
        type: {
          type: "string",
          enum: ["button", "axis", "vector2"],
          description: "Type of input action",
          default: "button",
        },
        key: {
          type: "string",
          description:
            "KeyCode to bind to (e.g. 'Space', 'E', 'Mouse0'). If omitted, uses Input.GetButton with the action name.",
        },
        folder: {
          type: "string",
          description: "Folder to create the script in",
          default: "Assets/Scripts/Input",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "add_touch_input",
    description:
      "Setup touch and gesture input handling with tap, swipe, pinch, and drag support",
    category: "input",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description:
            "GameObject name or instance ID to attach the handler to. If omitted, creates a new object.",
        },
        folder: {
          type: "string",
          description: "Folder to create the script in",
          default: "Assets/Scripts/Input",
        },
      },
      required: [],
    },
  },
  {
    name: "add_drag_drop",
    description:
      "Setup drag and drop interaction for UI elements or 3D objects with grid snapping and axis locking",
    category: "input",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description:
            "GameObject name or instance ID to make draggable. If omitted, only creates the script.",
        },
        folder: {
          type: "string",
          description: "Folder to create the script in",
          default: "Assets/Scripts/Input",
        },
      },
      required: [],
    },
  },
  {
    name: "create_interaction_zone",
    description:
      "Create a trigger-based interaction area with configurable shape, prompt message, and events",
    category: "input",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the interaction zone GameObject",
          default: "InteractionZone",
        },
        shape: {
          type: "string",
          enum: ["sphere", "box"],
          description: "Trigger collider shape",
          default: "sphere",
        },
        radius: {
          type: "number",
          description: "Radius of the trigger area (or half-extent for box)",
          default: 3,
        },
        position: {
          type: "string",
          description: "Position as [x,y,z]",
        },
        tag: {
          type: "string",
          description: "Tag to assign to the zone",
        },
        folder: {
          type: "string",
          description: "Folder to create the script in",
          default: "Assets/Scripts/Input",
        },
      },
      required: [],
    },
  },
  {
    name: "add_raycast_interaction",
    description:
      "Setup raycast-based clicking and selection with hover highlight and events",
    category: "input",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description:
            "GameObject to attach the raycast handler to. If omitted, creates a new object.",
        },
        distance: {
          type: "number",
          description: "Maximum raycast distance",
          default: 100,
        },
        layer_mask: {
          type: "string",
          description: "Layer mask value for raycast filtering (-1 for all)",
          default: "-1",
        },
        folder: {
          type: "string",
          description: "Folder to create the script in",
          default: "Assets/Scripts/Input",
        },
      },
      required: [],
    },
  },
  {
    name: "setup_player_input",
    description:
      "Configure a PlayerInput controller component with movement, look, and action bindings on a target GameObject",
    category: "input",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description: "Name or instance ID of the player GameObject",
        },
        folder: {
          type: "string",
          description: "Folder to create the script in",
          default: "Assets/Scripts/Input",
        },
      },
      required: ["target"],
    },
  },
  {
    name: "create_input_binding",
    description:
      "Create a script that binds a named action to a specific key/button with press, hold, and release events",
    category: "input",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Name of the action to bind",
        },
        key: {
          type: "string",
          description: "KeyCode to bind (e.g. 'Space', 'E', 'LeftShift')",
        },
        callback: {
          type: "string",
          description:
            "Name of the callback method. Defaults to On<ActionName>.",
        },
        folder: {
          type: "string",
          description: "Folder to create the script in",
          default: "Assets/Scripts/Input",
        },
      },
      required: ["action", "key"],
    },
  },
  {
    name: "add_event_trigger",
    description:
      "Add a UI EventTrigger component with a specified event type to a GameObject",
    category: "input",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description: "Name or instance ID of the target GameObject",
        },
        event_type: {
          type: "string",
          enum: [
            "PointerEnter",
            "PointerExit",
            "PointerDown",
            "PointerUp",
            "PointerClick",
            "Drag",
            "Drop",
            "Scroll",
            "UpdateSelected",
            "Select",
            "Deselect",
            "Move",
            "InitializePotentialDrag",
            "BeginDrag",
            "EndDrag",
            "Submit",
            "Cancel",
          ],
          description: "Type of UI event to add",
          default: "PointerClick",
        },
      },
      required: ["target"],
    },
  },
  {
    name: "get_input_config",
    description:
      "Get the current input configuration including defined axes, EventSystem status, and input scripts",
    category: "input",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

export default inputTools;
