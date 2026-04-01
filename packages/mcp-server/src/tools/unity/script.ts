import { ToolDefinition } from "../../registry.js";

const scriptTools: ToolDefinition[] = [
  {
    name: "create_script",
    description: "Create a new C# MonoBehaviour script file in the Unity project with a default class template",
    category: "script",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Class name for the script (must be a valid C# identifier)",
        },
        path: {
          type: "string",
          description: "Asset folder to save the script (e.g. 'Assets/Scripts')",
          default: "Assets/Scripts",
        },
        baseClass: {
          type: "string",
          description: "Base class to inherit from (e.g. 'MonoBehaviour', 'ScriptableObject', 'Editor')",
          default: "MonoBehaviour",
        },
        namespace: {
          type: "string",
          description: "Optional C# namespace to wrap the class in",
        },
        template: {
          type: "string",
          description: "Full C# source code to use instead of the default template. When provided, name and baseClass are ignored for content generation.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "edit_script",
    description: "Modify an existing C# script by replacing a section of code identified by a search pattern",
    category: "script",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Asset path of the script file (e.g. 'Assets/Scripts/PlayerController.cs')",
        },
        oldCode: {
          type: "string",
          description: "Exact code snippet to search for and replace. Must match existing file content exactly including whitespace.",
        },
        newCode: {
          type: "string",
          description: "Replacement code to insert in place of oldCode",
        },
        createIfMissing: {
          type: "boolean",
          description: "If the file does not exist, create it with newCode as the full content",
          default: false,
        },
      },
      required: ["path", "oldCode", "newCode"],
    },
  },
  {
    name: "attach_script",
    description: "Attach a C# script component to a GameObject in the scene",
    category: "script",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        gameObjectId: {
          type: "string",
          description: "Instance ID or path of the target GameObject",
        },
        scriptName: {
          type: "string",
          description: "Class name of the script to attach (must match the C# class name)",
        },
        properties: {
          type: "object",
          description: "Key-value pairs of serialized field values to set after attaching",
          additionalProperties: true,
        },
      },
      required: ["gameObjectId", "scriptName"],
    },
  },
  {
    name: "get_script",
    description: "Read the full source code of a C# script file from the Unity project",
    category: "script",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Asset path of the script file (e.g. 'Assets/Scripts/PlayerController.cs')",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "search_code",
    description: "Search across all C# scripts in the Unity project for a text pattern or regex",
    category: "script",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Search pattern or regular expression to find in script files",
        },
        regex: {
          type: "boolean",
          description: "If true, treat the pattern as a regular expression",
          default: false,
        },
        directory: {
          type: "string",
          description: "Limit search to a specific asset folder (e.g. 'Assets/Scripts')",
          default: "Assets",
        },
        filePattern: {
          type: "string",
          description: "Glob pattern to filter files (e.g. '*.cs', '*Controller*.cs')",
          default: "*.cs",
        },
        maxResults: {
          type: "number",
          description: "Maximum number of matching lines to return",
          default: 50,
        },
      },
      required: ["pattern"],
    },
  },
];

export default scriptTools;
