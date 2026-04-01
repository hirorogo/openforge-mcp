import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { ToolRegistry, ToolDefinition } from "../registry.js";
import { getCopilotToolManifest } from "../copilot.js";
import {
  mergeConfig,
  getConfigFormat,
  buildMcpEntry,
} from "../cli/setup.js";
import {
  generateVscodeConfig,
  buildVscodeServerEntry,
} from "../cli/vscode-config.js";

// ---------- helpers ----------

function makeTool(
  overrides: Partial<ToolDefinition> & { name: string; target: "unity" | "blender" | "godot" },
): ToolDefinition {
  return {
    description: `Description for ${overrides.name}`,
    category: "objects",
    parameters: { type: "object", properties: {} },
    ...overrides,
  };
}

// ---------- VS Code config generation ----------

describe("VS Code config generation", () => {
  it("should use 'servers' key not 'mcpServers' for vscode client", () => {
    expect(getConfigFormat("vscode")).toBe("servers");
  });

  it("should use 'mcpServers' key for claude-desktop", () => {
    expect(getConfigFormat("claude-desktop")).toBe("mcpServers");
  });

  it("should use 'mcpServers' key for cursor", () => {
    expect(getConfigFormat("cursor")).toBe("mcpServers");
  });

  it("should use 'mcpServers' key when client is undefined", () => {
    expect(getConfigFormat(undefined)).toBe("mcpServers");
  });

  it("mergeConfig should produce 'servers' key for vscode", () => {
    const entry = { command: "node", args: ["test"], env: {} };
    const result = mergeConfig(null, entry, "vscode");

    expect(result).toEqual({
      servers: {
        openforge: entry,
      },
    });
    expect(result.mcpServers).toBeUndefined();
  });

  it("mergeConfig should produce 'mcpServers' key for claude-desktop", () => {
    const entry = { command: "node", args: ["test"], env: {} };
    const result = mergeConfig(null, entry, "claude-desktop");

    expect(result).toEqual({
      mcpServers: {
        openforge: entry,
      },
    });
    expect(result.servers).toBeUndefined();
  });

  it("mergeConfig should preserve existing servers in vscode format", () => {
    const existing = JSON.stringify({
      servers: {
        "other-server": { command: "python", args: ["other.py"] },
      },
    });
    const entry = { command: "node", args: ["test"], env: {} };
    const result = mergeConfig(existing, entry, "vscode");

    const servers = result.servers as Record<string, unknown>;
    expect(servers["other-server"]).toEqual({ command: "python", args: ["other.py"] });
    expect(servers["openforge"]).toEqual(entry);
  });

  it("generateVscodeConfig should produce correct structure", () => {
    const config = generateVscodeConfig({ mode: "dynamic" });

    expect(config).toHaveProperty("servers");
    expect(config.servers).toHaveProperty("openforge");

    const entry = (config.servers as Record<string, unknown>)["openforge"] as Record<string, unknown>;
    expect(entry.command).toBe("node");
    expect((entry.args as string[]).includes("--mode")).toBe(true);
    expect((entry.args as string[]).includes("dynamic")).toBe(true);
  });

  it("buildVscodeServerEntry should include env when ports are specified", () => {
    const entry = buildVscodeServerEntry({
      mode: "full",
      unityPort: 9000,
      blenderPort: 9001,
      godotPort: 9002,
    });

    const env = entry.env as Record<string, string>;
    expect(env.OPENFORGE_UNITY_PORT).toBe("9000");
    expect(env.OPENFORGE_BLENDER_PORT).toBe("9001");
    expect(env.OPENFORGE_GODOT_PORT).toBe("9002");
  });
});

// ---------- Dynamic mode base tool count ----------

describe("Dynamic mode", () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
    // Register a mix of base and non-base tools
    registry.registerTools([
      makeTool({ name: "create_gameobject", target: "unity", category: "gameobject" }),
      makeTool({ name: "find_gameobject", target: "unity", category: "gameobject" }),
      makeTool({ name: "create_material", target: "unity", category: "material" }),
      makeTool({ name: "get_hierarchy", target: "unity", category: "scene" }),
      makeTool({ name: "create_mesh", target: "blender", category: "mesh" }),
      makeTool({ name: "create_material", target: "blender", category: "material" }),
      makeTool({ name: "get_objects", target: "blender", category: "objects" }),
      makeTool({ name: "get_scene_tree", target: "godot", category: "scene" }),
      // Non-base tools
      makeTool({ name: "set_transform", target: "unity", category: "gameobject" }),
      makeTool({ name: "extrude", target: "blender", category: "mesh" }),
      makeTool({ name: "create_node", target: "godot", category: "node" }),
    ]);
  });

  it("should expose exactly 8 base registry tools in dynamic mode", () => {
    registry.setMode("dynamic");
    const tools = registry.getTools();
    expect(tools).toHaveLength(8);
  });

  it("getDynamicBaseTools should return 8 entries", () => {
    const baseTools = registry.getDynamicBaseTools();
    expect(baseTools.size).toBe(8);
  });

  it("should not expose non-base tools until loaded", () => {
    registry.setMode("dynamic");
    expect(registry.getTool("unity", "set_transform")).toBeUndefined();
    expect(registry.getTool("blender", "extrude")).toBeUndefined();
    expect(registry.getTool("godot", "create_node")).toBeUndefined();
  });

  it("loadToolOnDemand should load a tool by full key", () => {
    registry.setMode("dynamic");
    const tool = registry.loadToolOnDemand("unity:set_transform");
    expect(tool).toBeDefined();
    expect(tool?.name).toBe("set_transform");
    expect(registry.getTool("unity", "set_transform")).toBeDefined();
  });

  it("loadToolOnDemand should load a tool by name only", () => {
    registry.setMode("dynamic");
    const tool = registry.loadToolOnDemand("extrude");
    expect(tool).toBeDefined();
    expect(tool?.name).toBe("extrude");
    expect(registry.getTool("blender", "extrude")).toBeDefined();
  });

  it("loadToolOnDemand should return undefined for non-existent tool", () => {
    registry.setMode("dynamic");
    const tool = registry.loadToolOnDemand("nonexistent_tool");
    expect(tool).toBeUndefined();
  });

  it("should increase tool count after on-demand loading", () => {
    registry.setMode("dynamic");
    expect(registry.getTools()).toHaveLength(8);

    registry.loadToolOnDemand("unity:set_transform");
    expect(registry.getTools()).toHaveLength(9);

    registry.loadToolOnDemand("blender:extrude");
    expect(registry.getTools()).toHaveLength(10);
  });

  it("switching away from dynamic mode should clear dynamically loaded tools", () => {
    registry.setMode("dynamic");
    registry.loadToolOnDemand("unity:set_transform");
    expect(registry.getTools()).toHaveLength(9);

    registry.setMode("full");
    registry.setMode("dynamic");
    expect(registry.getTools()).toHaveLength(8);
  });
});

// ---------- Copilot tool manifest ----------

describe("Copilot tool manifest", () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
    registry.registerTools([
      makeTool({ name: "create_gameobject", target: "unity", category: "gameobject" }),
      makeTool({ name: "find_gameobject", target: "unity", category: "gameobject" }),
      makeTool({ name: "create_material", target: "unity", category: "material" }),
      makeTool({ name: "get_hierarchy", target: "unity", category: "scene" }),
      makeTool({ name: "create_mesh", target: "blender", category: "mesh" }),
      makeTool({ name: "create_material", target: "blender", category: "material" }),
      makeTool({ name: "get_objects", target: "blender", category: "objects" }),
      makeTool({ name: "get_scene_tree", target: "godot", category: "scene" }),
      makeTool({ name: "set_transform", target: "unity", category: "gameobject" }),
      makeTool({ name: "extrude", target: "blender", category: "mesh" }),
    ]);
  });

  it("should return a manifest with server info", () => {
    const manifest = getCopilotToolManifest(registry);
    expect(manifest.serverName).toBe("openforge-mcp");
    expect(manifest.version).toBe("0.0.1");
  });

  it("should include all tools in full mode with dynamicLoad false", () => {
    registry.setMode("full");
    const manifest = getCopilotToolManifest(registry);

    // 3 meta tools + 10 registry tools
    expect(manifest.totalToolCount).toBe(13);
    expect(manifest.tools.every((t) => t.dynamicLoad === false)).toBe(true);
  });

  it("should mark non-base tools as dynamicLoad in dynamic mode", () => {
    registry.setMode("dynamic");
    const manifest = getCopilotToolManifest(registry);

    // In dynamic mode, all tools (including non-base) are listed
    // 3 meta + 10 registry = 13
    expect(manifest.totalToolCount).toBe(13);

    // Base tool count: 3 meta + 8 base = 11
    expect(manifest.baseToolCount).toBe(11);

    // set_transform and extrude should be marked as dynamicLoad
    const setTransform = manifest.tools.find((t) => t.name === "set_transform");
    expect(setTransform).toBeDefined();
    expect(setTransform?.dynamicLoad).toBe(true);

    const extrude = manifest.tools.find((t) => t.name === "extrude");
    expect(extrude).toBeDefined();
    expect(extrude?.dynamicLoad).toBe(true);

    // Base tools should not be dynamicLoad
    const createGo = manifest.tools.find(
      (t) => t.name === "create_gameobject" && t.target === "unity",
    );
    expect(createGo?.dynamicLoad).toBe(false);
  });

  it("should include meta tools in the manifest", () => {
    const manifest = getCopilotToolManifest(registry);
    const metaNames = manifest.tools
      .filter((t) => t.category === "meta")
      .map((t) => t.name);

    expect(metaNames).toContain("list_categories");
    expect(metaNames).toContain("list_tools");
    expect(metaNames).toContain("execute");
  });

  it("meta tools should never have dynamicLoad true", () => {
    registry.setMode("dynamic");
    const manifest = getCopilotToolManifest(registry);
    const metaTools = manifest.tools.filter((t) => t.category === "meta");

    expect(metaTools.every((t) => t.dynamicLoad === false)).toBe(true);
  });

  it("essential mode should only include available tools", () => {
    registry.setMode("essential");
    const manifest = getCopilotToolManifest(registry);

    // Only essential tools from the registry are exposed
    const registryTools = manifest.tools.filter((t) => t.category !== "meta");
    for (const tool of registryTools) {
      expect(tool.dynamicLoad).toBe(false);
    }
  });
});
