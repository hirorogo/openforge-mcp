import { describe, it, expect, beforeEach, vi } from "vitest";
import { ToolRegistry, ToolDefinition } from "../registry.js";
import { ToolRouter } from "../router.js";

// Mock the adapters - we create lightweight mocks that match the interface used by ToolRouter
function createMockAdapter(target: string) {
  return {
    targetName: target,
    _connected: false,
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

function makeTool(overrides: Partial<ToolDefinition> & { name: string; target: "unity" | "blender" }): ToolDefinition {
  return {
    description: `Description for ${overrides.name}`,
    category: "objects",
    parameters: { type: "object", properties: {} },
    ...overrides,
  };
}

describe("ToolRouter", () => {
  let registry: ToolRegistry;
  let unityAdapter: ReturnType<typeof createMockAdapter>;
  let blenderAdapter: ReturnType<typeof createMockAdapter>;
  let router: ToolRouter;

  beforeEach(() => {
    registry = new ToolRegistry();
    unityAdapter = createMockAdapter("unity");
    blenderAdapter = createMockAdapter("blender");
    // Cast the mock adapters since ToolRouter expects specific adapter types
    router = new ToolRouter(registry, unityAdapter as any, blenderAdapter as any, createMockAdapter("godot") as any);
  });

  describe("routing to correct adapter", () => {
    beforeEach(() => {
      registry.registerTools([
        makeTool({ name: "create_gameobject", target: "unity", category: "scene" }),
        makeTool({ name: "create_mesh", target: "blender", category: "mesh" }),
      ]);
    });

    it("should route unity commands to the unity adapter", async () => {
      const result = await router.execute({
        target: "unity",
        tool: "create_gameobject",
        args: { name: "Cube" },
      });

      expect(result.success).toBe(true);
      expect(result.target).toBe("unity");
      expect(unityAdapter.sendCommand).toHaveBeenCalledWith("scene.create_gameobject", { name: "Cube" });
      expect(blenderAdapter.sendCommand).not.toHaveBeenCalled();
    });

    it("should route blender commands to the blender adapter", async () => {
      const result = await router.execute({
        target: "blender",
        tool: "create_mesh",
        args: { type: "cube" },
      });

      expect(result.success).toBe(true);
      expect(result.target).toBe("blender");
      expect(blenderAdapter.sendCommand).toHaveBeenCalledWith("mesh.create_mesh", { type: "cube" });
      expect(unityAdapter.sendCommand).not.toHaveBeenCalled();
    });

    it("should return the result data from the adapter response", async () => {
      unityAdapter.sendCommand.mockResolvedValueOnce({
        jsonrpc: "2.0",
        id: 1,
        result: { status: "ok", objectId: "abc123", name: "Cube" } as any,
      });

      const result = await router.execute({
        target: "unity",
        tool: "create_gameobject",
        args: { name: "Cube" },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ status: "ok", objectId: "abc123", name: "Cube" });
    });

    it("should include a duration in the result", async () => {
      const result = await router.execute({
        target: "unity",
        tool: "create_gameobject",
      });

      expect(result.duration).toBeTypeOf("number");
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it("should send empty object when args are not provided", async () => {
      await router.execute({
        target: "unity",
        tool: "create_gameobject",
      });

      expect(unityAdapter.sendCommand).toHaveBeenCalledWith("scene.create_gameobject", {});
    });
  });

  describe("auto-connect on execute", () => {
    beforeEach(() => {
      registry.registerTool(makeTool({ name: "create_gameobject", target: "unity", category: "scene" }));
    });

    it("should connect to the adapter if not connected", async () => {
      unityAdapter._connected = false;
      await router.execute({ target: "unity", tool: "create_gameobject" });

      expect(unityAdapter.connect).toHaveBeenCalled();
    });

    it("should not call connect if already connected", async () => {
      unityAdapter._connected = true;
      await router.execute({ target: "unity", tool: "create_gameobject" });

      expect(unityAdapter.connect).not.toHaveBeenCalled();
    });
  });

  describe("validation of required params", () => {
    beforeEach(() => {
      registry.registerTool(
        makeTool({
          name: "set_transform",
          target: "unity",
          category: "scene",
          parameters: {
            type: "object",
            properties: {
              objectId: { type: "string" },
              position: { type: "object" },
            },
            required: ["objectId"],
          },
        }),
      );
    });

    it("should fail when required parameters are missing", async () => {
      const result = await router.execute({
        target: "unity",
        tool: "set_transform",
        args: { position: { x: 0, y: 0, z: 0 } },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Missing required parameters");
      expect(result.error).toContain("objectId");
    });

    it("should fail when args are omitted and required params exist", async () => {
      const result = await router.execute({
        target: "unity",
        tool: "set_transform",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Missing required parameters");
    });

    it("should succeed when all required parameters are provided", async () => {
      const result = await router.execute({
        target: "unity",
        tool: "set_transform",
        args: { objectId: "abc123", position: { x: 1, y: 2, z: 3 } },
      });

      expect(result.success).toBe(true);
    });

    it("should succeed when a tool has no required parameters", async () => {
      registry.registerTool(
        makeTool({
          name: "get_hierarchy",
          target: "unity",
          category: "scene",
          parameters: {
            type: "object",
            properties: { depth: { type: "number" } },
          },
        }),
      );

      const result = await router.execute({
        target: "unity",
        tool: "get_hierarchy",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("error handling for unknown tools", () => {
    it("should return an error for an unknown target", async () => {
      const result = await router.execute({
        target: "maya" as any,
        tool: "create_node",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("should return an error for a non-existent tool", async () => {
      const result = await router.execute({
        target: "unity",
        tool: "nonexistent_tool",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
      expect(result.error).toContain("nonexistent_tool");
    });

    it("should return a specific error when tool exists but is not available in current mode", async () => {
      registry.registerTool(makeTool({ name: "advanced_tool", target: "unity" }));
      registry.setMode("essential");

      const result = await router.execute({
        target: "unity",
        tool: "advanced_tool",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not available in the current mode");
    });
  });

  describe("error handling for disconnected adapters", () => {
    beforeEach(() => {
      registry.registerTool(makeTool({ name: "create_gameobject", target: "unity", category: "scene" }));
    });

    it("should return an error when connection fails", async () => {
      unityAdapter.connect.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      const result = await router.execute({
        target: "unity",
        tool: "create_gameobject",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot connect to unity");
      expect(result.error).toContain("ECONNREFUSED");
    });

    it("should return an error when sendCommand throws", async () => {
      unityAdapter._connected = true;
      unityAdapter.sendCommand.mockRejectedValueOnce(new Error("Connection lost"));

      const result = await router.execute({
        target: "unity",
        tool: "create_gameobject",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection lost");
    });

    it("should handle RPC error responses from the adapter", async () => {
      unityAdapter._connected = true;
      unityAdapter.sendCommand.mockResolvedValueOnce({
        jsonrpc: "2.0",
        id: 1,
        error: { code: -32600, message: "Invalid Request", data: { detail: "bad param" } },
      } as any);

      const result = await router.execute({
        target: "unity",
        tool: "create_gameobject",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid Request");
      expect(result.data).toEqual({ detail: "bad param" });
    });
  });

  describe("dynamic mode auto-load", () => {
    beforeEach(() => {
      registry.registerTool(makeTool({ name: "advanced_tool", target: "unity", category: "advanced" }));
      registry.setMode("dynamic");
    });

    it("should auto-load a tool in dynamic mode during execute", async () => {
      // In dynamic mode, the router should call loadDynamicTool before checking availability
      const result = await router.execute({
        target: "unity",
        tool: "advanced_tool",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("getConnectionStatus", () => {
    it("should reflect connection state of both adapters", () => {
      unityAdapter._connected = true;
      blenderAdapter._connected = false;

      const status = router.getConnectionStatus();
      expect(status).toMatchObject({ unity: true, blender: false });
    });

    it("should report both disconnected initially", () => {
      const status = router.getConnectionStatus();
      expect(status).toMatchObject({ unity: false, blender: false });
    });
  });
});
