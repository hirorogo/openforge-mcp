import { ToolDefinition } from "../../registry.js";

const pythonExecTools: ToolDefinition[] = [
  {
    name: "execute_python",
    description:
      "Execute arbitrary Python code in Blender's embedded Python environment with full access to bpy and all Blender APIs. Returns captured stdout, stderr, and an optional result variable.",
    category: "python_exec",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description:
            "Python code to execute. The code has access to bpy and the full Blender Python environment. Assign to a variable named 'result' to return a value.",
        },
      },
      required: ["code"],
    },
  },
  {
    name: "execute_python_file",
    description:
      "Execute a Python (.py) file in Blender's Python environment",
    category: "python_exec",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Absolute path to the .py file to execute",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "get_python_info",
    description:
      "Get information about Blender's Python environment including version, installed modules, and platform details",
    category: "python_exec",
    target: "blender",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "eval_expression",
    description:
      "Evaluate a single Python expression in Blender and return the result (e.g. 'len(bpy.data.objects)')",
    category: "python_exec",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description:
            "A Python expression to evaluate (e.g. 'bpy.context.active_object.name')",
        },
      },
      required: ["expression"],
    },
  },
];

export default pythonExecTools;
