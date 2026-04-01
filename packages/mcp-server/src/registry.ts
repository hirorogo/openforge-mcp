import { VRCHAT_TOOLS, VRCHAT_BLENDER_CATEGORIES } from "./vrchat-mode.js";

export interface ParameterSchema {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  target: "unity" | "blender" | "godot";
  parameters: ParameterSchema;
}

export type ToolMode = "full" | "essential" | "dynamic" | "vrchat";

/**
 * The base set of tools registered at startup in dynamic mode.
 * These are the 8 tools that VS Code / Copilot dynamic mode exposes immediately.
 * Additional tools are loaded on demand via loadToolOnDemand().
 */
const DYNAMIC_BASE_TOOLS: Set<string> = new Set([
  // Meta tools (handled in server.ts, not in registry, but listed for counting)
  // list_categories, list_tools, execute -- these are always present as MCP-level tools

  // Core creation / query tools available at startup
  "unity:create_gameobject",
  "unity:find_gameobject",
  "blender:create_mesh",
  "blender:create_material",
  "unity:create_material",
  "unity:get_hierarchy",
  "blender:get_objects",
  "godot:get_scene_tree",
]);

const ESSENTIAL_TOOLS: Set<string> = new Set([
  // Unity essentials
  "unity:create_gameobject",
  "unity:find_gameobject",
  "unity:destroy_gameobject",
  "unity:set_transform",
  "unity:get_hierarchy",
  "unity:create_material",
  "unity:set_material_color",
  "unity:create_script",
  "unity:edit_script",
  "unity:save_scene",
  // Blender essentials
  "blender:create_mesh",
  "blender:transform_object",
  "blender:delete_object",
  "blender:duplicate_object",
  "blender:create_material",
  "blender:set_color",
  "blender:extrude",
  "blender:boolean_operation",
  // Godot essentials
  "godot:create_node",
  "godot:find_node",
  "godot:delete_node",
  "godot:set_transform_3d",
  "godot:get_scene_tree",
  "godot:create_material",
  "godot:create_script",
  "godot:attach_script",
  "godot:save_scene",
  "godot:set_property",
]);

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private mode: ToolMode = "full";
  private dynamicallyLoaded: Set<string> = new Set();

  registerTool(tool: ToolDefinition): void {
    const key = `${tool.target}:${tool.name}`;
    this.tools.set(key, tool);
  }

  registerTools(tools: ToolDefinition[]): void {
    for (const tool of tools) {
      this.registerTool(tool);
    }
  }

  setMode(mode: ToolMode): void {
    this.mode = mode;
    if (mode !== "dynamic") {
      this.dynamicallyLoaded.clear();
    }
  }

  getMode(): ToolMode {
    return this.mode;
  }

  loadDynamicTool(target: string, toolName: string): boolean {
    const key = `${target}:${toolName}`;
    if (this.tools.has(key)) {
      this.dynamicallyLoaded.add(key);
      return true;
    }
    return false;
  }

  /**
   * Load a tool on demand by its full key (target:name) or just its name.
   * Searches all registered tools. Returns the loaded tool definition or undefined.
   */
  loadToolOnDemand(toolName: string): ToolDefinition | undefined {
    // Try as a full key first (e.g. "unity:create_gameobject")
    if (this.tools.has(toolName)) {
      this.dynamicallyLoaded.add(toolName);
      return this.tools.get(toolName);
    }

    // Search by tool name across all targets
    for (const [key, tool] of this.tools) {
      if (tool.name === toolName) {
        this.dynamicallyLoaded.add(key);
        return tool;
      }
    }

    return undefined;
  }

  /**
   * Returns the set of base tool keys for dynamic mode.
   */
  getDynamicBaseTools(): Set<string> {
    return new Set(DYNAMIC_BASE_TOOLS);
  }

  private isToolAvailable(key: string): boolean {
    switch (this.mode) {
      case "full":
        return true;
      case "essential":
        return ESSENTIAL_TOOLS.has(key);
      case "dynamic":
        return DYNAMIC_BASE_TOOLS.has(key) || this.dynamicallyLoaded.has(key);
      case "vrchat": {
        if (VRCHAT_TOOLS.has(key)) return true;
        // For blender tools, check by category
        const tool = this.tools.get(key);
        if (tool && tool.target === "blender" && VRCHAT_BLENDER_CATEGORIES.has(tool.category)) {
          return true;
        }
        return false;
      }
    }
  }

  getCategories(target?: string): { target: string; category: string; toolCount: number }[] {
    const categoryMap = new Map<string, { target: string; category: string; count: number }>();

    for (const [key, tool] of this.tools) {
      if (!this.isToolAvailable(key)) continue;
      if (target && tool.target !== target) continue;

      const mapKey = `${tool.target}:${tool.category}`;
      const existing = categoryMap.get(mapKey);
      if (existing) {
        existing.count++;
      } else {
        categoryMap.set(mapKey, { target: tool.target, category: tool.category, count: 1 });
      }
    }

    return Array.from(categoryMap.values()).map((c) => ({
      target: c.target,
      category: c.category,
      toolCount: c.count,
    }));
  }

  getTools(target?: string, category?: string): ToolDefinition[] {
    const result: ToolDefinition[] = [];
    for (const [key, tool] of this.tools) {
      if (!this.isToolAvailable(key)) continue;
      if (target && tool.target !== target) continue;
      if (category && tool.category !== category) continue;
      result.push(tool);
    }
    return result;
  }

  getTool(target: string, toolName: string): ToolDefinition | undefined {
    const key = `${target}:${toolName}`;
    if (!this.tools.has(key)) return undefined;
    if (!this.isToolAvailable(key)) return undefined;
    return this.tools.get(key);
  }

  getAllToolsUnfiltered(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }
}
