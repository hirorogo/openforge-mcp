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
  target: "unity" | "blender";
  parameters: ParameterSchema;
}

export type ToolMode = "full" | "essential" | "dynamic";

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

  private isToolAvailable(key: string): boolean {
    switch (this.mode) {
      case "full":
        return true;
      case "essential":
        return ESSENTIAL_TOOLS.has(key);
      case "dynamic":
        return ESSENTIAL_TOOLS.has(key) || this.dynamicallyLoaded.has(key);
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
