import { ToolDefinition } from "../../registry.js";

const gameStudiosTools: ToolDefinition[] = [
  {
    name: "setup_game_studios",
    description:
      "Generate configuration files to integrate OpenForge MCP with an existing Claude Code Game Studios project. Creates a .claude/settings.json snippet with the correct MCP server entry and per-agent tool permissions.",
    category: "game-studios",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description:
            "Absolute path to the Game Studios project directory.",
        },
        engine: {
          type: "string",
          description:
            'Primary game engine used by the project: "unity", "blender", or "godot".',
        },
      },
      required: ["projectPath", "engine"],
    },
  },
  {
    name: "get_agent_tools",
    description:
      "Return the list of OpenForge tool categories that a specific Game Studios agent should use. Useful for restricting context or permissions per agent.",
    category: "game-studios",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        agent: {
          type: "string",
          description:
            'The Game Studios agent role name (e.g. "lead-programmer", "art-director", "qa-tester").',
        },
      },
      required: ["agent"],
    },
  },
  {
    name: "get_studio_status",
    description:
      "Return the current studio status: which game engines are connected, which agent roles are available, and how many tools are registered.",
    category: "game-studios",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "run_studio_workflow",
    description:
      'Execute a predefined multi-agent studio workflow such as "create_level", "performance_audit", "art_pass", or "qa_pass". Returns the workflow steps with their assigned agents and tools.',
    category: "game-studios",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        workflow: {
          type: "string",
          description:
            'Name of the workflow to execute (e.g. "create_level", "performance_audit", "art_pass", "qa_pass").',
        },
        params: {
          type: "object",
          description: "Optional parameters to pass to the workflow steps.",
          additionalProperties: true,
        },
      },
      required: ["workflow"],
    },
  },
];

export default gameStudiosTools;
