import { describe, it, expect, beforeEach } from "vitest";
import { ToolRegistry, ToolDefinition } from "../registry.js";

function makeTool(overrides: Partial<ToolDefinition> & { name: string; target: "unity" | "blender" }): ToolDefinition {
  return {
    description: `Description for ${overrides.name}`,
    category: "objects",
    parameters: { type: "object", properties: {} },
    ...overrides,
  };
}

describe("ToolRegistry", () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe("registerTool", () => {
    it("should register a single tool", () => {
      const tool = makeTool({ name: "create_gameobject", target: "unity" });
      registry.registerTool(tool);

      const result = registry.getTool("unity", "create_gameobject");
      expect(result).toEqual(tool);
    });

    it("should overwrite a tool with the same key", () => {
      const tool1 = makeTool({ name: "create_gameobject", target: "unity", description: "v1" });
      const tool2 = makeTool({ name: "create_gameobject", target: "unity", description: "v2" });

      registry.registerTool(tool1);
      registry.registerTool(tool2);

      const result = registry.getTool("unity", "create_gameobject");
      expect(result?.description).toBe("v2");
    });

    it("should keep tools with the same name but different targets separate", () => {
      const unityTool = makeTool({ name: "create_material", target: "unity", category: "materials" });
      const blenderTool = makeTool({ name: "create_material", target: "blender", category: "materials" });

      registry.registerTool(unityTool);
      registry.registerTool(blenderTool);

      expect(registry.getTool("unity", "create_material")).toEqual(unityTool);
      expect(registry.getTool("blender", "create_material")).toEqual(blenderTool);
    });
  });

  describe("registerTools", () => {
    it("should register multiple tools at once", () => {
      const tools = [
        makeTool({ name: "create_gameobject", target: "unity" }),
        makeTool({ name: "find_gameobject", target: "unity" }),
        makeTool({ name: "create_mesh", target: "blender" }),
      ];
      registry.registerTools(tools);

      expect(registry.getTool("unity", "create_gameobject")).toBeDefined();
      expect(registry.getTool("unity", "find_gameobject")).toBeDefined();
      expect(registry.getTool("blender", "create_mesh")).toBeDefined();
    });
  });

  describe("getCategories", () => {
    beforeEach(() => {
      registry.registerTools([
        makeTool({ name: "create_gameobject", target: "unity", category: "objects" }),
        makeTool({ name: "find_gameobject", target: "unity", category: "objects" }),
        makeTool({ name: "create_material", target: "unity", category: "materials" }),
        makeTool({ name: "create_mesh", target: "blender", category: "mesh" }),
        makeTool({ name: "transform_object", target: "blender", category: "mesh" }),
        makeTool({ name: "create_material", target: "blender", category: "materials" }),
      ]);
    });

    it("should return all categories when no target is specified", () => {
      const categories = registry.getCategories();
      expect(categories).toHaveLength(4);
    });

    it("should filter categories by target", () => {
      const unityCategories = registry.getCategories("unity");
      expect(unityCategories).toHaveLength(2);
      expect(unityCategories.every((c) => c.target === "unity")).toBe(true);

      const blenderCategories = registry.getCategories("blender");
      expect(blenderCategories).toHaveLength(2);
      expect(blenderCategories.every((c) => c.target === "blender")).toBe(true);
    });

    it("should include correct tool counts per category", () => {
      const categories = registry.getCategories("unity");
      const objectsCategory = categories.find((c) => c.category === "objects");
      expect(objectsCategory?.toolCount).toBe(2);

      const materialsCategory = categories.find((c) => c.category === "materials");
      expect(materialsCategory?.toolCount).toBe(1);
    });

    it("should return an empty array for a target with no tools", () => {
      const categories = registry.getCategories("nonexistent");
      expect(categories).toEqual([]);
    });
  });

  describe("getTools", () => {
    beforeEach(() => {
      registry.registerTools([
        makeTool({ name: "create_gameobject", target: "unity", category: "objects" }),
        makeTool({ name: "find_gameobject", target: "unity", category: "objects" }),
        makeTool({ name: "create_material", target: "unity", category: "materials" }),
        makeTool({ name: "create_mesh", target: "blender", category: "mesh" }),
      ]);
    });

    it("should return all tools when no filter is applied", () => {
      const tools = registry.getTools();
      expect(tools).toHaveLength(4);
    });

    it("should filter tools by target", () => {
      const unityTools = registry.getTools("unity");
      expect(unityTools).toHaveLength(3);
      expect(unityTools.every((t) => t.target === "unity")).toBe(true);
    });

    it("should filter tools by target and category", () => {
      const tools = registry.getTools("unity", "objects");
      expect(tools).toHaveLength(2);
      expect(tools.every((t) => t.target === "unity" && t.category === "objects")).toBe(true);
    });

    it("should return an empty array when no tools match", () => {
      const tools = registry.getTools("blender", "objects");
      expect(tools).toEqual([]);
    });
  });

  describe("getTool", () => {
    it("should return a tool by target and name", () => {
      const tool = makeTool({ name: "create_gameobject", target: "unity" });
      registry.registerTool(tool);

      const result = registry.getTool("unity", "create_gameobject");
      expect(result).toEqual(tool);
    });

    it("should return undefined for a non-existent tool", () => {
      expect(registry.getTool("unity", "nonexistent")).toBeUndefined();
    });

    it("should return undefined when a tool exists but is not available in current mode", () => {
      const tool = makeTool({ name: "some_niche_tool", target: "unity" });
      registry.registerTool(tool);
      registry.setMode("essential");

      expect(registry.getTool("unity", "some_niche_tool")).toBeUndefined();
    });
  });

  describe("mode switching", () => {
    beforeEach(() => {
      registry.registerTools([
        // Essential unity tool
        makeTool({ name: "create_gameobject", target: "unity", category: "objects" }),
        // Non-essential unity tool
        makeTool({ name: "some_advanced_tool", target: "unity", category: "advanced" }),
        // Essential blender tool
        makeTool({ name: "create_mesh", target: "blender", category: "mesh" }),
        // Non-essential blender tool
        makeTool({ name: "some_blender_tool", target: "blender", category: "advanced" }),
      ]);
    });

    it("should default to full mode", () => {
      expect(registry.getMode()).toBe("full");
    });

    it("should allow setting mode to essential", () => {
      registry.setMode("essential");
      expect(registry.getMode()).toBe("essential");
    });

    it("should allow setting mode to dynamic", () => {
      registry.setMode("dynamic");
      expect(registry.getMode()).toBe("dynamic");
    });

    it("full mode should return all tools", () => {
      registry.setMode("full");
      const tools = registry.getTools();
      expect(tools).toHaveLength(4);
    });

    it("essential mode should only return core tools", () => {
      registry.setMode("essential");
      const tools = registry.getTools();
      // Only "create_gameobject" and "create_mesh" are in the ESSENTIAL_TOOLS set
      expect(tools).toHaveLength(2);
      expect(tools.map((t) => t.name).sort()).toEqual(["create_gameobject", "create_mesh"]);
    });

    it("essential mode should exclude non-essential tools from categories", () => {
      registry.setMode("essential");
      const categories = registry.getCategories();
      const advancedCategory = categories.find((c) => c.category === "advanced");
      expect(advancedCategory).toBeUndefined();
    });

    it("dynamic mode should start with only essential tools", () => {
      registry.setMode("dynamic");
      const tools = registry.getTools();
      expect(tools).toHaveLength(2);
    });

    it("dynamic mode should allow loading additional tools", () => {
      registry.setMode("dynamic");
      const loaded = registry.loadDynamicTool("unity", "some_advanced_tool");
      expect(loaded).toBe(true);

      const tools = registry.getTools();
      expect(tools).toHaveLength(3);
      expect(registry.getTool("unity", "some_advanced_tool")).toBeDefined();
    });

    it("loadDynamicTool should return false for non-existent tools", () => {
      registry.setMode("dynamic");
      const loaded = registry.loadDynamicTool("unity", "nonexistent_tool");
      expect(loaded).toBe(false);
    });

    it("switching away from dynamic mode should clear dynamically loaded tools", () => {
      registry.setMode("dynamic");
      registry.loadDynamicTool("unity", "some_advanced_tool");
      expect(registry.getTools()).toHaveLength(3);

      registry.setMode("full");
      registry.setMode("dynamic");
      // After switching away and back, dynamically loaded set is cleared
      expect(registry.getTools()).toHaveLength(2);
    });
  });

  describe("getAllToolsUnfiltered", () => {
    it("should return all registered tools regardless of mode", () => {
      registry.registerTools([
        makeTool({ name: "create_gameobject", target: "unity" }),
        makeTool({ name: "some_advanced_tool", target: "unity" }),
      ]);

      registry.setMode("essential");
      const filtered = registry.getTools();
      const unfiltered = registry.getAllToolsUnfiltered();

      expect(filtered).toHaveLength(1);
      expect(unfiltered).toHaveLength(2);
    });
  });
});
