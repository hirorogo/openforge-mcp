import { ToolDefinition } from "../../registry.js";

const runtimeTools: ToolDefinition[] = [
  {
    name: "inject_runtime_command",
    description:
      "Send a command to the running game by invoking a method on a component via reflection (Play mode only)",
    category: "runtime",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description: "Runtime GameObject name",
        },
        component: {
          type: "string",
          description: "Component type name on the GameObject",
        },
        method: { type: "string", description: "Method name to invoke" },
        args: {
          type: "string",
          description: "Comma-separated arguments for the method",
        },
      },
      required: ["target", "component", "method"],
    },
  },
  {
    name: "get_runtime_objects",
    description:
      "List active GameObjects during Play mode with their components",
    category: "runtime",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description: "Filter by name (case-insensitive substring match)",
        },
        component: {
          type: "string",
          description: "Filter by component type name",
        },
        max_results: {
          type: "number",
          description: "Maximum results to return (default 100)",
        },
      },
      required: [],
    },
  },
  {
    name: "modify_runtime_value",
    description:
      "Change a field or property value on a component during Play mode",
    category: "runtime",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Runtime GameObject name" },
        component: { type: "string", description: "Component type name" },
        field: { type: "string", description: "Field or property name to modify" },
        value: { type: "string", description: "New value to set" },
      },
      required: ["target", "component", "field", "value"],
    },
  },
  {
    name: "call_runtime_method",
    description:
      "Invoke a method on a runtime component and return the result (Play mode only)",
    category: "runtime",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Runtime GameObject name" },
        component: { type: "string", description: "Component type name" },
        method: { type: "string", description: "Method name to call" },
        args: {
          type: "string",
          description: "Comma-separated arguments",
        },
      },
      required: ["target", "component", "method"],
    },
  },
  {
    name: "get_runtime_logs",
    description:
      "Get Debug.Log output captured during Play mode. Start capture first, then retrieve.",
    category: "runtime",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        start_capture: {
          type: "boolean",
          description: "Start capturing log messages (call first time)",
        },
        stop_capture: {
          type: "boolean",
          description: "Stop capturing log messages",
        },
        max_lines: {
          type: "number",
          description: "Maximum log lines to return (default 50)",
        },
        filter: {
          type: "string",
          description: "Filter log messages by substring",
        },
      },
      required: [],
    },
  },
  {
    name: "toggle_pause",
    description: "Pause, resume, or step through Play mode",
    category: "runtime",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["pause", "resume", "toggle", "step"],
          description: "Action to perform (default: toggle)",
        },
      },
      required: [],
    },
  },
];

export default runtimeTools;
