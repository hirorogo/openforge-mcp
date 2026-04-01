import { ToolDefinition } from "../../registry.js";

const hunyuan3dTools: ToolDefinition[] = [
  {
    name: "generate_hunyuan3d",
    description:
      "Generate a 3D model from a text prompt using the Hunyuan3D AI model. Optionally accepts a reference image URL for image-to-3D generation. Requires HUNYUAN3D_API_KEY environment variable.",
    category: "hunyuan3d",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Text description of the 3D model to generate",
        },
        image_url: {
          type: "string",
          description:
            "Optional URL of a reference image for image-to-3D generation",
        },
        output_format: {
          type: "string",
          enum: ["glb", "obj", "fbx"],
          description: "Output 3D file format",
          default: "glb",
        },
        quality: {
          type: "string",
          enum: ["draft", "standard", "high"],
          description: "Generation quality level (higher quality takes longer)",
          default: "standard",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "import_hunyuan3d",
    description:
      "Generate a 3D model with Hunyuan3D and import it directly into the current Blender scene. Requires HUNYUAN3D_API_KEY environment variable.",
    category: "hunyuan3d",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Text description of the 3D model to generate",
        },
        image_url: {
          type: "string",
          description:
            "Optional URL of a reference image for image-to-3D generation",
        },
        output_format: {
          type: "string",
          enum: ["glb", "obj", "fbx"],
          description: "Output 3D file format",
          default: "glb",
        },
        quality: {
          type: "string",
          enum: ["draft", "standard", "high"],
          description: "Generation quality level",
          default: "standard",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "get_hunyuan3d_status",
    description:
      "Check the status and progress of a Hunyuan3D generation task",
    category: "hunyuan3d",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "The task ID returned by generate_hunyuan3d",
        },
      },
      required: ["task_id"],
    },
  },
];

export default hunyuan3dTools;
