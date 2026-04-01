import { ToolDefinition } from "../../registry.js";

const pipelineTools: ToolDefinition[] = [
  {
    name: "transfer_asset",
    description:
      "Transfer an asset between applications (e.g., Blender to Unity). Exports from the source app and imports into the target app using a shared temp directory.",
    category: "pipeline",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        from: {
          type: "string",
          enum: ["blender", "unity"],
          description: "Source application to export from.",
        },
        to: {
          type: "string",
          enum: ["blender", "unity"],
          description: "Target application to import into.",
        },
        format: {
          type: "string",
          enum: ["fbx", "gltf", "obj", "vrm"],
          description: "File format for the transfer.",
        },
        sourcePath: {
          type: "string",
          description: "Optional custom export path. Defaults to a shared temp directory.",
        },
        targetPath: {
          type: "string",
          description: "Optional custom import path. Defaults to the export path.",
        },
      },
      required: ["from", "to", "format"],
    },
  },
  {
    name: "get_pipeline_status",
    description:
      "Get the current pipeline status showing which adapters (Unity, Blender) are connected and available for cross-app transfers.",
    category: "pipeline",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

export default pipelineTools;
