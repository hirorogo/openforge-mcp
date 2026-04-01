import { ToolDefinition } from "../../registry.js";

const extensionTools: ToolDefinition[] = [
  {
    name: "scan_extensions",
    description:
      "Scan a project directory for user-defined OpenForge tool extensions. Finds C# files with [OpenForgeTool] attribute and Python files with @openforge_tool decorator.",
    category: "extension",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Project directory path to scan. Defaults to the configured project path.",
        },
      },
      required: [],
    },
  },
  {
    name: "list_extensions",
    description:
      "List all discovered user-defined tool extensions.",
    category: "extension",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "reload_extensions",
    description:
      "Re-scan and reload all user-defined tool extensions from the project directory.",
    category: "extension",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

export default extensionTools;
