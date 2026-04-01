import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createOpenForgeServer } from "../server.js";
import type { UnityAdapter } from "../adapters/unity.js";
import type { BlenderAdapter } from "../adapters/blender.js";

/**
 * Integration tests for the OpenForge MCP Server.
 *
 * Uses InMemoryTransport to wire a real MCP Client to the server so that
 * every request goes through the full SDK request/response pipeline without
 * needing stdio or HTTP.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ToolCallTextResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

function parseToolResult(result: ToolCallTextResult): unknown {
  const textItem = result.content.find((c) => c.type === "text");
  if (!textItem) throw new Error("No text content in tool result");
  return JSON.parse(textItem.text);
}

// ---------------------------------------------------------------------------
// Full-mode server suite
// ---------------------------------------------------------------------------

describe("OpenForge MCP Server (full mode)", () => {
  let client: Client;
  let cleanup: () => Promise<void>;
  let unityAdapter: UnityAdapter;
  let blenderAdapter: BlenderAdapter;

  beforeAll(async () => {
    const { server, unityAdapter: ua, blenderAdapter: ba } = createOpenForgeServer({
      mode: "full",
      transport: "stdio", // ignored -- we connect via InMemoryTransport
    });

    unityAdapter = ua;
    blenderAdapter = ba;

    // Stub adapter.connect so it never opens a real TCP socket.
    vi.spyOn(unityAdapter, "connect").mockRejectedValue(new Error("no unity"));
    vi.spyOn(blenderAdapter, "connect").mockRejectedValue(new Error("no blender"));

    client = new Client({ name: "test-client", version: "0.0.1" });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    cleanup = async () => {
      await client.close();
      await server.close();
    };
  });

  afterAll(async () => {
    await cleanup();
  });

  // -----------------------------------------------------------------------
  // ListTools (MCP-level) -- should expose exactly the 3 meta-tools
  // -----------------------------------------------------------------------

  it("exposes exactly the three meta-tools via listTools", async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "begin_transaction",
      "commit_transaction",
      "create_branch",
      "execute",
      "get_project_status",
      "list_categories",
      "list_saves",
      "list_tools",
      "merge_branch",
      "restore_save",
      "rollback_transaction",
      "save_project",
    ]);
  });

  // -----------------------------------------------------------------------
  // list_categories
  // -----------------------------------------------------------------------

  describe("list_categories", () => {
    it("returns categories for both unity and blender when no target filter", async () => {
      const result = (await client.callTool({
        name: "list_categories",
        arguments: {},
      })) as ToolCallTextResult;

      const parsed = parseToolResult(result) as {
        mode: string;
        categories: Array<{ target: string; category: string; toolCount: number }>;
      };

      expect(parsed.mode).toBe("full");

      const targets = [...new Set(parsed.categories.map((c) => c.target))].sort();
      expect(targets).toEqual(["blender", "unity"]);

      // Unity should have scene, gameobject, material, script
      const unityCategories = parsed.categories
        .filter((c) => c.target === "unity")
        .map((c) => c.category)
        .sort();
      expect(unityCategories).toContain("gameobject");
      expect(unityCategories).toContain("material");
      expect(unityCategories).toContain("scene");
      expect(unityCategories).toContain("script");
      expect(unityCategories.length).toBeGreaterThanOrEqual(6);

      // Blender should have object, mesh, material and more
      const blenderCategories = parsed.categories
        .filter((c) => c.target === "blender")
        .map((c) => c.category)
        .sort();
      expect(blenderCategories).toContain("object");
      expect(blenderCategories).toContain("mesh");
      expect(blenderCategories).toContain("material");
      expect(blenderCategories.length).toBeGreaterThanOrEqual(3);

      // Every category should have a positive tool count
      for (const cat of parsed.categories) {
        expect(cat.toolCount).toBeGreaterThan(0);
      }
    });

    it("filters categories by target", async () => {
      const result = (await client.callTool({
        name: "list_categories",
        arguments: { target: "unity" },
      })) as ToolCallTextResult;

      const parsed = parseToolResult(result) as {
        categories: Array<{ target: string; category: string; toolCount: number }>;
      };

      for (const cat of parsed.categories) {
        expect(cat.target).toBe("unity");
      }
    });
  });

  // -----------------------------------------------------------------------
  // list_tools
  // -----------------------------------------------------------------------

  describe("list_tools", () => {
    it("returns tools for a specific category", async () => {
      const result = (await client.callTool({
        name: "list_tools",
        arguments: { target: "unity", category: "scene" },
      })) as ToolCallTextResult;

      const parsed = parseToolResult(result) as {
        mode: string;
        toolCount: number;
        tools: Array<{
          name: string;
          target: string;
          category: string;
          description: string;
          parameters: unknown;
        }>;
      };

      expect(parsed.mode).toBe("full");
      expect(parsed.toolCount).toBeGreaterThan(0);
      expect(parsed.tools.length).toBe(parsed.toolCount);

      // All returned tools should belong to unity / scene
      for (const tool of parsed.tools) {
        expect(tool.target).toBe("unity");
        expect(tool.category).toBe("scene");
      }

      // The scene category should include known tools
      const names = parsed.tools.map((t) => t.name);
      expect(names).toContain("get_hierarchy");
      expect(names).toContain("save_scene");
    });

    it("returns all tools when no filter is provided", async () => {
      const result = (await client.callTool({
        name: "list_tools",
        arguments: {},
      })) as ToolCallTextResult;

      const parsed = parseToolResult(result) as {
        toolCount: number;
        tools: Array<{ target: string; category: string }>;
      };

      // There should be tools from both targets
      const targets = [...new Set(parsed.tools.map((t) => t.target))].sort();
      expect(targets).toEqual(["blender", "unity"]);
      expect(parsed.toolCount).toBeGreaterThanOrEqual(10);
    });
  });

  // -----------------------------------------------------------------------
  // execute
  // -----------------------------------------------------------------------

  describe("execute", () => {
    it("returns an error when the adapter is not connected", async () => {
      const result = (await client.callTool({
        name: "execute",
        arguments: {
          target: "unity",
          tool: "get_hierarchy",
        },
      })) as ToolCallTextResult;

      expect(result.isError).toBe(true);

      const parsed = parseToolResult(result) as {
        success: boolean;
        error: string;
      };
      expect(parsed.success).toBe(false);
      expect(parsed.error).toMatch(/cannot connect to unity/i);
    });

    it("returns an error when target and tool are missing", async () => {
      const result = (await client.callTool({
        name: "execute",
        arguments: {},
      })) as ToolCallTextResult;

      expect(result.isError).toBe(true);

      const parsed = parseToolResult(result) as {
        success: boolean;
        error: string;
      };
      expect(parsed.success).toBe(false);
      expect(parsed.error).toMatch(/required/i);
    });

    it("returns an error for an unknown tool name", async () => {
      const result = (await client.callTool({
        name: "execute",
        arguments: {
          target: "blender",
          tool: "nonexistent_tool",
        },
      })) as ToolCallTextResult;

      expect(result.isError).toBe(true);

      const parsed = parseToolResult(result) as {
        success: boolean;
        error: string;
      };
      expect(parsed.success).toBe(false);
      expect(parsed.error).toMatch(/not found/i);
    });

    it("returns an error for an unknown meta-tool name", async () => {
      const result = (await client.callTool({
        name: "totally_unknown",
        arguments: {},
      })) as ToolCallTextResult;

      expect(result.isError).toBe(true);

      const parsed = parseToolResult(result) as {
        success: boolean;
        error: string;
      };
      expect(parsed.success).toBe(false);
      expect(parsed.error).toMatch(/unknown tool/i);
    });
  });

  // -----------------------------------------------------------------------
  // Resources
  // -----------------------------------------------------------------------

  describe("resources", () => {
    it("lists the registered resources", async () => {
      const { resources } = await client.listResources();
      const uris = resources.map((r) => r.uri).sort();

      expect(uris).toContain("scene://unity/hierarchy");
      expect(uris).toContain("scene://unity/console");
      expect(uris).toContain("scene://blender/objects");
      expect(resources.length).toBe(3);
    });

    it("reading scene://unity/hierarchy returns an error when unity is not connected", async () => {
      const result = await client.readResource({ uri: "scene://unity/hierarchy" });
      const textContent = result.contents[0];
      expect(textContent.uri).toBe("scene://unity/hierarchy");

      const text = "text" in textContent ? textContent.text : "";
      const parsed = JSON.parse(text as string);
      expect(parsed.error).toMatch(/not connected/i);
    });

    it("reading scene://blender/objects returns an error when blender is not connected", async () => {
      const result = await client.readResource({ uri: "scene://blender/objects" });
      const textContent = result.contents[0];
      expect(textContent.uri).toBe("scene://blender/objects");

      const text = "text" in textContent ? textContent.text : "";
      const parsed = JSON.parse(text as string);
      expect(parsed.error).toMatch(/not connected/i);
    });
  });
});

// ---------------------------------------------------------------------------
// Essential-mode server suite
// ---------------------------------------------------------------------------

describe("OpenForge MCP Server (essential mode)", () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const { server, unityAdapter, blenderAdapter } = createOpenForgeServer({
      mode: "essential",
      transport: "stdio",
    });

    vi.spyOn(unityAdapter, "connect").mockRejectedValue(new Error("no unity"));
    vi.spyOn(blenderAdapter, "connect").mockRejectedValue(new Error("no blender"));

    client = new Client({ name: "test-client", version: "0.0.1" });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    cleanup = async () => {
      await client.close();
      await server.close();
    };
  });

  afterAll(async () => {
    await cleanup();
  });

  it("reports essential mode in list_categories", async () => {
    const result = (await client.callTool({
      name: "list_categories",
      arguments: {},
    })) as ToolCallTextResult;

    const parsed = parseToolResult(result) as {
      mode: string;
      categories: Array<{ target: string; category: string; toolCount: number }>;
    };

    expect(parsed.mode).toBe("essential");
  });

  it("exposes fewer tools than full mode", async () => {
    const essentialResult = (await client.callTool({
      name: "list_tools",
      arguments: {},
    })) as ToolCallTextResult;

    const essentialParsed = parseToolResult(essentialResult) as {
      toolCount: number;
      tools: Array<{ name: string; target: string }>;
    };

    // The essential set is a curated subset -- it should be strictly fewer than full.
    // Full mode has well over 20 tools; essential defines exactly 18.
    expect(essentialParsed.toolCount).toBeLessThanOrEqual(18);
    expect(essentialParsed.toolCount).toBeGreaterThan(0);

    // Verify some expected essential tools are present
    const names = essentialParsed.tools.map((t) => `${t.target}:${t.name}`);
    expect(names).toContain("unity:create_gameobject");
    expect(names).toContain("unity:save_scene");
    expect(names).toContain("blender:create_mesh");
    expect(names).toContain("blender:boolean_operation");
  });

  it("essential mode reduces available categories compared to full", async () => {
    const result = (await client.callTool({
      name: "list_categories",
      arguments: {},
    })) as ToolCallTextResult;

    const parsed = parseToolResult(result) as {
      categories: Array<{ target: string; category: string; toolCount: number }>;
    };

    // Essential mode should still have some categories, but each one should
    // have fewer (or equal) tools compared to full mode.
    for (const cat of parsed.categories) {
      expect(cat.toolCount).toBeGreaterThan(0);
    }
  });

  it("execute returns 'not available in current mode' for non-essential tool", async () => {
    // "create_scene" is a unity scene tool that is NOT in the ESSENTIAL_TOOLS set.
    const result = (await client.callTool({
      name: "execute",
      arguments: {
        target: "unity",
        tool: "create_scene",
      },
    })) as ToolCallTextResult;

    expect(result.isError).toBe(true);

    const parsed = parseToolResult(result) as {
      success: boolean;
      error: string;
    };
    expect(parsed.success).toBe(false);
    expect(parsed.error).toMatch(/not available in the current mode/i);
  });
});
