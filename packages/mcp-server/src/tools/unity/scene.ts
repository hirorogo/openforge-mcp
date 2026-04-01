import { ToolDefinition } from "../../registry.js";

const sceneTools: ToolDefinition[] = [
  {
    name: "create_scene",
    description: "Create a new empty Unity scene with the specified name",
    category: "scene",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the new scene",
        },
        additive: {
          type: "boolean",
          description: "If true, load the new scene additively without unloading the current scene",
          default: false,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "load_scene",
    description: "Load an existing Unity scene by name or path",
    category: "scene",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Asset path of the scene (e.g. Assets/Scenes/Main.unity)",
        },
        mode: {
          type: "string",
          enum: ["single", "additive"],
          description: "Load mode: single replaces all scenes, additive adds alongside current",
          default: "single",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "save_scene",
    description: "Save the current Unity scene to disk",
    category: "scene",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Asset path to save to. If omitted, saves to the current scene path.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_scene_info",
    description: "Retrieve metadata about the currently active Unity scene including name, path, dirty state, and root object count",
    category: "scene",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_hierarchy",
    description: "Return the full scene hierarchy as a nested tree of GameObjects with their names, IDs, and active states",
    category: "scene",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        depth: {
          type: "number",
          description: "Maximum depth to traverse. -1 for unlimited.",
          default: -1,
        },
        includeInactive: {
          type: "boolean",
          description: "Whether to include inactive GameObjects in the result",
          default: true,
        },
      },
      required: [],
    },
  },
];

export default sceneTools;
