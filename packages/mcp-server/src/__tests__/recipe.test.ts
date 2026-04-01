import { describe, it, expect, beforeEach, vi } from "vitest";
import { RecipeEngine } from "../recipe.js";
import { ToolRegistry, ToolDefinition } from "../registry.js";
import { ToolRouter } from "../router.js";

function createMockAdapter(target: string) {
  return {
    targetName: target,
    _connected: true,
    isConnected() {
      return this._connected;
    },
    connect: vi.fn(async function (this: ReturnType<typeof createMockAdapter>) {
      this._connected = true;
    }),
    sendCommand: vi.fn(async () => ({
      jsonrpc: "2.0" as const,
      id: 1,
      result: { status: "ok" },
    })),
  };
}

function makeTool(
  overrides: Partial<ToolDefinition> & { name: string; target: "unity" | "blender" },
): ToolDefinition {
  return {
    description: `Description for ${overrides.name}`,
    category: "scene",
    parameters: { type: "object", properties: {} },
    ...overrides,
  };
}

const VALID_RECIPE_YAML = `
name: "Basic Scene Setup"
description: "Creates a scene with lighting and a camera"
target: unity
steps:
  - tool: create_gameobject
    params:
      name: "Floor"
      primitiveType: "Plane"
  - tool: create_light
    params:
      type: "Directional"
      intensity: 1.2
  - tool: create_camera
    params:
      position: [0, 5, -10]
`;

describe("RecipeEngine", () => {
  let registry: ToolRegistry;
  let unityAdapter: ReturnType<typeof createMockAdapter>;
  let blenderAdapter: ReturnType<typeof createMockAdapter>;
  let router: ToolRouter;
  let engine: RecipeEngine;

  beforeEach(() => {
    registry = new ToolRegistry();
    registry.registerTools([
      makeTool({ name: "create_gameobject", target: "unity", category: "scene" }),
      makeTool({ name: "create_light", target: "unity", category: "lighting" }),
      makeTool({ name: "create_camera", target: "unity", category: "camera" }),
      makeTool({ name: "create_mesh", target: "blender", category: "mesh" }),
    ]);

    unityAdapter = createMockAdapter("unity");
    blenderAdapter = createMockAdapter("blender");
    router = new ToolRouter(registry, unityAdapter as any, blenderAdapter as any, createMockAdapter("godot") as any);
    engine = new RecipeEngine(router, registry);
  });

  describe("loadRecipe (YAML parsing)", () => {
    it("should parse a valid YAML recipe", () => {
      const recipe = engine.loadRecipe(VALID_RECIPE_YAML);

      expect(recipe.name).toBe("Basic Scene Setup");
      expect(recipe.description).toBe("Creates a scene with lighting and a camera");
      expect(recipe.target).toBe("unity");
      expect(recipe.steps).toHaveLength(3);
      expect(recipe.steps[0].tool).toBe("create_gameobject");
      expect(recipe.steps[0].params).toEqual({ name: "Floor", primitiveType: "Plane" });
      expect(recipe.steps[1].tool).toBe("create_light");
      expect(recipe.steps[1].params).toEqual({ type: "Directional", intensity: 1.2 });
      expect(recipe.steps[2].tool).toBe("create_camera");
      expect(recipe.steps[2].params).toEqual({ position: [0, 5, -10] });
    });

    it("should throw on invalid YAML syntax", () => {
      expect(() => engine.loadRecipe("{{invalid yaml")).toThrow("Failed to parse YAML");
    });

    it("should throw when YAML parses to a non-object", () => {
      expect(() => engine.loadRecipe("just a string")).toThrow("YAML must parse to an object");
    });

    it("should throw when name is missing", () => {
      const yaml = `
description: "test"
target: unity
steps:
  - tool: foo
`;
      expect(() => engine.loadRecipe(yaml)).toThrow("missing or empty 'name'");
    });

    it("should throw when description is missing", () => {
      const yaml = `
name: "test"
target: unity
steps:
  - tool: foo
`;
      expect(() => engine.loadRecipe(yaml)).toThrow("missing 'description'");
    });

    it("should throw when target is invalid", () => {
      const yaml = `
name: "test"
description: "test"
target: godot
steps:
  - tool: foo
`;
      expect(() => engine.loadRecipe(yaml)).toThrow("'target' must be");
    });

    it("should throw when steps is empty", () => {
      const yaml = `
name: "test"
description: "test"
target: unity
steps: []
`;
      expect(() => engine.loadRecipe(yaml)).toThrow("non-empty array");
    });

    it("should throw when a step is missing tool field", () => {
      const yaml = `
name: "test"
description: "test"
target: unity
steps:
  - params:
      name: "Floor"
`;
      expect(() => engine.loadRecipe(yaml)).toThrow("missing or empty 'tool'");
    });

    it("should parse steps without params", () => {
      const yaml = `
name: "test"
description: "test"
target: unity
steps:
  - tool: create_gameobject
`;
      const recipe = engine.loadRecipe(yaml);
      expect(recipe.steps[0].params).toBeUndefined();
    });
  });

  describe("validateRecipe", () => {
    it("should validate a recipe where all tools exist", () => {
      const recipe = engine.loadRecipe(VALID_RECIPE_YAML);
      const result = engine.validateRecipe(recipe);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should report missing tools", () => {
      const yaml = `
name: "test"
description: "test"
target: unity
steps:
  - tool: create_gameobject
  - tool: nonexistent_tool
  - tool: another_missing
`;
      const recipe = engine.loadRecipe(yaml);
      const result = engine.validateRecipe(recipe);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain("nonexistent_tool");
      expect(result.errors[0]).toContain("not found");
      expect(result.errors[1]).toContain("another_missing");
    });

    it("should report tools unavailable in current mode", () => {
      registry.setMode("essential");
      const yaml = `
name: "test"
description: "test"
target: unity
steps:
  - tool: create_gameobject
  - tool: create_light
`;
      const recipe = engine.loadRecipe(yaml);
      const result = engine.validateRecipe(recipe);

      // create_gameobject is essential, create_light is not
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes("not available in the current mode"))).toBe(true);
    });
  });

  describe("executeRecipe", () => {
    it("should execute all steps sequentially and return success", async () => {
      const recipe = engine.loadRecipe(VALID_RECIPE_YAML);
      const result = await engine.executeRecipe(recipe);

      expect(result.success).toBe(true);
      expect(result.recipeName).toBe("Basic Scene Setup");
      expect(result.totalSteps).toBe(3);
      expect(result.completedSteps).toBe(3);
      expect(result.results).toHaveLength(3);
      expect(result.results.every((r) => r.success)).toBe(true);
    });

    it("should execute steps in order", async () => {
      const callOrder: string[] = [];
      unityAdapter.sendCommand.mockImplementation(async (method: string) => {
        callOrder.push(method);
        return { jsonrpc: "2.0" as const, id: 1, result: { status: "ok" } };
      });

      const recipe = engine.loadRecipe(VALID_RECIPE_YAML);
      await engine.executeRecipe(recipe);

      expect(callOrder).toEqual([
        "scene.create_gameobject",
        "lighting.create_light",
        "camera.create_camera",
      ]);
    });

    it("should stop execution on first failure", async () => {
      unityAdapter.sendCommand
        .mockResolvedValueOnce({
          jsonrpc: "2.0",
          id: 1,
          result: { status: "ok" },
        })
        .mockResolvedValueOnce({
          jsonrpc: "2.0",
          id: 2,
          error: { code: -1, message: "Light creation failed" },
        } as any);

      const recipe = engine.loadRecipe(VALID_RECIPE_YAML);
      const result = await engine.executeRecipe(recipe);

      expect(result.success).toBe(false);
      expect(result.completedSteps).toBe(1);
      expect(result.totalSteps).toBe(3);
      expect(result.results).toHaveLength(2);
      expect(result.error).toContain("create_light");
      expect(result.error).toContain("failed");
    });

    it("should apply overrides to every step", async () => {
      const yaml = `
name: "test"
description: "test"
target: unity
steps:
  - tool: create_gameobject
    params:
      name: "Floor"
  - tool: create_gameobject
    params:
      name: "Wall"
`;
      const recipe = engine.loadRecipe(yaml);
      await engine.executeRecipe(recipe, { layer: "Environment" });

      expect(unityAdapter.sendCommand).toHaveBeenCalledWith("scene.create_gameobject", {
        name: "Floor",
        layer: "Environment",
      });
      expect(unityAdapter.sendCommand).toHaveBeenCalledWith("scene.create_gameobject", {
        name: "Wall",
        layer: "Environment",
      });
    });

    it("should handle steps with no params", async () => {
      const yaml = `
name: "test"
description: "test"
target: unity
steps:
  - tool: create_gameobject
`;
      const recipe = engine.loadRecipe(yaml);
      const result = await engine.executeRecipe(recipe);

      expect(result.success).toBe(true);
      expect(unityAdapter.sendCommand).toHaveBeenCalledWith("scene.create_gameobject", {});
    });
  });
});
