import { ToolRegistry, ToolDefinition } from "./registry.js";

/**
 * Represents a single tool entry in the Copilot tool manifest.
 * Copilot reads all available tools upfront but respects dynamic loading hints.
 */
export interface CopilotToolEntry {
  name: string;
  description: string;
  category: string;
  target: string;
  parameters: Record<string, unknown>;
  dynamicLoad: boolean;
}

/**
 * Copilot tool manifest returned to GitHub Copilot Chat.
 */
export interface CopilotToolManifest {
  serverName: string;
  version: string;
  mode: string;
  baseToolCount: number;
  totalToolCount: number;
  tools: CopilotToolEntry[];
}

/**
 * The set of base tool names that are always immediately available
 * in dynamic mode. These map to the 8 dynamic base tools defined
 * in the registry, plus the 3 meta tools (list_categories, list_tools, execute)
 * which are handled at the MCP server level.
 */
const META_TOOLS = ["list_categories", "list_tools", "execute"];

const DYNAMIC_BASE_TOOL_NAMES: Set<string> = new Set([
  "create_gameobject",
  "find_gameobject",
  "create_mesh",
  "create_material",
  "get_hierarchy",
  "get_objects",
  "get_scene_tree",
]);

/**
 * Generate a tool manifest optimized for GitHub Copilot's tool-calling format.
 *
 * In dynamic mode, all tools are listed in the manifest but tools that are not
 * part of the base set are annotated with `dynamicLoad: true` so Copilot knows
 * they need to be loaded on demand before execution.
 *
 * In full/essential mode, all available tools have `dynamicLoad: false`.
 */
export function getCopilotToolManifest(registry: ToolRegistry): CopilotToolManifest {
  const mode = registry.getMode();
  const allTools = registry.getAllToolsUnfiltered();
  const availableTools = registry.getTools();

  const toolsToExpose: ToolDefinition[] = mode === "dynamic" ? allTools : availableTools;

  const dynamicBaseKeys = registry.getDynamicBaseTools();

  const tools: CopilotToolEntry[] = toolsToExpose.map((tool): CopilotToolEntry => {
    const key = `${tool.target}:${tool.name}`;
    const isDynamicLoad =
      mode === "dynamic" && !dynamicBaseKeys.has(key);

    return {
      name: tool.name,
      description: tool.description,
      category: tool.category,
      target: tool.target,
      parameters: tool.parameters as unknown as Record<string, unknown>,
      dynamicLoad: isDynamicLoad,
    };
  });

  // Add meta tools (these are always available regardless of mode)
  const metaTools: CopilotToolEntry[] = [
    {
      name: "list_categories",
      description:
        "List all available tool categories grouped by target application (unity/blender/godot). Returns category names and tool counts.",
      category: "meta",
      target: "all",
      parameters: {
        type: "object",
        properties: {
          target: {
            type: "string",
            enum: ["unity", "blender", "godot"],
            description: "Filter categories by target. Omit to list all.",
          },
        },
      },
      dynamicLoad: false,
    },
    {
      name: "list_tools",
      description:
        "List all available tools, optionally filtered by target and category. Returns tool names, descriptions, and parameter schemas.",
      category: "meta",
      target: "all",
      parameters: {
        type: "object",
        properties: {
          target: {
            type: "string",
            enum: ["unity", "blender", "godot"],
            description: "Filter by target application",
          },
          category: {
            type: "string",
            description: "Filter by tool category",
          },
        },
      },
      dynamicLoad: false,
    },
    {
      name: "execute",
      description:
        "Execute a tool on the target application (Unity, Blender, or Godot). The tool must exist in the registry and the target editor must be connected.",
      category: "meta",
      target: "all",
      parameters: {
        type: "object",
        properties: {
          target: {
            type: "string",
            enum: ["unity", "blender", "godot"],
            description: "Target application to execute the tool on",
          },
          tool: {
            type: "string",
            description: "Name of the tool to execute",
          },
          args: {
            type: "object",
            description: "Arguments to pass to the tool",
            additionalProperties: true,
          },
        },
        required: ["target", "tool"],
      },
      dynamicLoad: false,
    },
  ];

  const allEntries = [...metaTools, ...tools];

  // Count base tools: meta tools (3) + dynamic base registry tools (8)
  const baseToolCount =
    mode === "dynamic"
      ? META_TOOLS.length + dynamicBaseKeys.size
      : allEntries.length;

  return {
    serverName: "openforge-mcp",
    version: "0.0.1",
    mode,
    baseToolCount,
    totalToolCount: allEntries.length,
    tools: allEntries,
  };
}
