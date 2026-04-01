import { ToolDefinition } from "../../registry.js";

const versionControlTools: ToolDefinition[] = [
  {
    name: "save_project",
    description:
      "Save the current project state by staging all changes and creating a git commit. Optionally provide a custom commit message.",
    category: "version-control",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Optional commit message. If omitted, an auto-generated message is used.",
        },
      },
      required: [],
    },
  },
  {
    name: "list_saves",
    description:
      "List recent project saves (git commits) with their IDs, messages, dates, and changed files.",
    category: "version-control",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of saves to return. Defaults to 20.",
        },
      },
      required: [],
    },
  },
  {
    name: "restore_save",
    description:
      "Safely revert the project to a previous save by creating a new revert commit. Does not rewrite history.",
    category: "version-control",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        saveId: {
          type: "string",
          description: "The commit ID of the save to restore.",
        },
      },
      required: ["saveId"],
    },
  },
  {
    name: "get_project_status",
    description:
      "Get the current project version control status including branch name, dirty state, and last save info.",
    category: "version-control",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "create_branch",
    description:
      "Create a new experiment branch and switch to it. Useful for trying out changes without affecting the main branch.",
    category: "version-control",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the new branch to create.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "merge_branch",
    description:
      "Merge the specified branch into the current branch.",
    category: "version-control",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the branch to merge into the current branch.",
        },
      },
      required: ["name"],
    },
  },
];

export default versionControlTools;
