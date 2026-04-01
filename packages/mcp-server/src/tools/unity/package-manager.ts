import { ToolDefinition } from "../../registry.js";

const packageManagerTools: ToolDefinition[] = [
  {
    name: "install_package",
    description:
      "Install a Unity package by name from the Unity Registry (e.g. com.unity.cinemachine, com.unity.probuilder)",
    category: "package-manager",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        package_id: {
          type: "string",
          description: "Package identifier (e.g. com.unity.cinemachine)",
        },
        version: {
          type: "string",
          description: "Specific version to install (omit for latest)",
        },
      },
      required: ["package_id"],
    },
  },
  {
    name: "remove_package",
    description: "Remove an installed Unity package",
    category: "package-manager",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        package_id: { type: "string", description: "Package identifier to remove" },
      },
      required: ["package_id"],
    },
  },
  {
    name: "list_packages",
    description: "List all installed Unity packages in the project",
    category: "package-manager",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        offline: {
          type: "boolean",
          description: "Use offline/cached package list (faster)",
        },
      },
      required: [],
    },
  },
  {
    name: "search_packages",
    description: "Search the Unity package registry for available packages",
    category: "package-manager",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (e.g. 'cinemachine', 'probuilder'). Omit to list all.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_package_info",
    description:
      "Get detailed information about a package including version, description, dependencies",
    category: "package-manager",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        package_id: {
          type: "string",
          description: "Package identifier or display name",
        },
      },
      required: ["package_id"],
    },
  },
  {
    name: "update_package",
    description: "Update an installed package to the latest or a specific version",
    category: "package-manager",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        package_id: { type: "string", description: "Package identifier to update" },
        version: {
          type: "string",
          description: "Target version (omit for latest)",
        },
      },
      required: ["package_id"],
    },
  },
];

export default packageManagerTools;
