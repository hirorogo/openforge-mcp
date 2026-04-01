import { ToolDefinition } from "../../registry.js";

const safetyTools: ToolDefinition[] = [
  {
    name: "set_safety_level",
    description:
      "Set the safety level for tool operations. 'cautious' requires confirmation for all modifications, 'balanced' only for destructive operations, 'fast' skips all confirmations.",
    category: "safety",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        level: {
          type: "string",
          description:
            'Safety level: "cautious", "balanced", or "fast".',
        },
      },
      required: ["level"],
    },
  },
  {
    name: "get_safety_level",
    description:
      "Get the current safety level.",
    category: "safety",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_operation_classification",
    description:
      "Get the safety classification of a tool (safe, destructive, or unknown).",
    category: "safety",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        tool: {
          type: "string",
          description: "The tool name to classify.",
        },
      },
      required: ["tool"],
    },
  },
];

export default safetyTools;
