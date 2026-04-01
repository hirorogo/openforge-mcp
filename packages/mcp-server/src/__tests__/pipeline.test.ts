import { describe, it, expect, beforeEach, vi } from "vitest";
import { Pipeline } from "../pipeline.js";
import * as os from "node:os";
import * as path from "node:path";

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

describe("Pipeline", () => {
  let unityAdapter: ReturnType<typeof createMockAdapter>;
  let blenderAdapter: ReturnType<typeof createMockAdapter>;
  let pipeline: Pipeline;

  beforeEach(() => {
    unityAdapter = createMockAdapter("unity");
    blenderAdapter = createMockAdapter("blender");
    pipeline = new Pipeline(unityAdapter as any, blenderAdapter as any);
  });

  describe("getSharedPath", () => {
    it("should return a path inside the OS temp directory", () => {
      const sharedPath = pipeline.getSharedPath();
      expect(sharedPath).toBe(path.join(os.tmpdir(), "openforge-pipeline"));
    });

    it("should return a consistent path across multiple calls", () => {
      const path1 = pipeline.getSharedPath();
      const path2 = pipeline.getSharedPath();
      expect(path1).toBe(path2);
    });
  });

  describe("transferAsset", () => {
    it("should construct correct export and import commands for blender-to-unity FBX transfer", async () => {
      blenderAdapter._connected = true;
      unityAdapter._connected = true;

      const result = await pipeline.transferAsset("blender", "unity", "fbx");

      expect(result.success).toBe(true);
      expect(result.from).toBe("blender");
      expect(result.to).toBe("unity");
      expect(result.format).toBe("fbx");
      expect(result.exportPath).toContain("transfer_blender_to_unity_");
      expect(result.exportPath).toContain(".fbx");

      expect(blenderAdapter.sendCommand).toHaveBeenCalledWith(
        "export.export_fbx",
        { path: result.exportPath },
      );
      expect(unityAdapter.sendCommand).toHaveBeenCalledWith(
        "import.import_asset",
        { path: result.importPath },
      );
    });

    it("should construct correct commands for unity-to-blender glTF transfer", async () => {
      unityAdapter._connected = true;
      blenderAdapter._connected = true;

      const result = await pipeline.transferAsset("unity", "blender", "gltf");

      expect(result.success).toBe(true);
      expect(result.format).toBe("gltf");
      expect(result.exportPath).toContain(".gltf");

      expect(unityAdapter.sendCommand).toHaveBeenCalledWith(
        "export.export_gltf",
        { path: result.exportPath },
      );
      expect(blenderAdapter.sendCommand).toHaveBeenCalledWith(
        "import.import_asset",
        { path: result.importPath },
      );
    });

    it("should use custom source and target paths when provided", async () => {
      blenderAdapter._connected = true;
      unityAdapter._connected = true;

      const result = await pipeline.transferAsset("blender", "unity", "obj", {
        sourcePath: "/tmp/custom_export.obj",
        targetPath: "/tmp/custom_import.obj",
      });

      expect(result.success).toBe(true);
      expect(result.exportPath).toBe("/tmp/custom_export.obj");
      expect(result.importPath).toBe("/tmp/custom_import.obj");

      expect(blenderAdapter.sendCommand).toHaveBeenCalledWith(
        "export.export_obj",
        { path: "/tmp/custom_export.obj" },
      );
      expect(unityAdapter.sendCommand).toHaveBeenCalledWith(
        "import.import_asset",
        { path: "/tmp/custom_import.obj" },
      );
    });

    it("should fail when source adapter is not connected", async () => {
      blenderAdapter._connected = false;
      unityAdapter._connected = true;

      const result = await pipeline.transferAsset("blender", "unity", "fbx");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not connected");
      expect(result.error).toContain("blender");
      expect(blenderAdapter.sendCommand).not.toHaveBeenCalled();
      expect(unityAdapter.sendCommand).not.toHaveBeenCalled();
    });

    it("should fail when target adapter is not connected", async () => {
      blenderAdapter._connected = true;
      unityAdapter._connected = false;

      const result = await pipeline.transferAsset("blender", "unity", "fbx");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not connected");
      expect(result.error).toContain("unity");
    });

    it("should fail when source and target are the same", async () => {
      unityAdapter._connected = true;

      const result = await pipeline.transferAsset("unity", "unity", "fbx");

      expect(result.success).toBe(false);
      expect(result.error).toContain("must be different");
    });

    it("should fail when format is unsupported", async () => {
      blenderAdapter._connected = true;
      unityAdapter._connected = true;

      const result = await pipeline.transferAsset("blender", "unity", "abc" as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unsupported format");
    });

    it("should handle export command failure", async () => {
      blenderAdapter._connected = true;
      unityAdapter._connected = true;
      blenderAdapter.sendCommand.mockResolvedValueOnce({
        jsonrpc: "2.0",
        id: 1,
        error: { code: -1, message: "Export failed: file not found" },
      } as any);

      const result = await pipeline.transferAsset("blender", "unity", "fbx");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Export failed");
      expect(unityAdapter.sendCommand).not.toHaveBeenCalled();
    });

    it("should handle import command failure", async () => {
      blenderAdapter._connected = true;
      unityAdapter._connected = true;
      blenderAdapter.sendCommand.mockResolvedValueOnce({
        jsonrpc: "2.0",
        id: 1,
        result: { status: "ok" },
      });
      unityAdapter.sendCommand.mockResolvedValueOnce({
        jsonrpc: "2.0",
        id: 2,
        error: { code: -1, message: "Import failed: invalid format" },
      } as any);

      const result = await pipeline.transferAsset("blender", "unity", "fbx");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Import failed");
    });

    it("should handle adapter sendCommand throwing an exception", async () => {
      blenderAdapter._connected = true;
      unityAdapter._connected = true;
      blenderAdapter.sendCommand.mockRejectedValueOnce(new Error("Connection lost"));

      const result = await pipeline.transferAsset("blender", "unity", "fbx");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection lost");
    });
  });

  describe("getStatus", () => {
    it("should return connection status of both adapters", () => {
      unityAdapter._connected = true;
      blenderAdapter._connected = false;

      const status = pipeline.getStatus();
      expect(status).toEqual({ unity: true, blender: false });
    });

    it("should report both disconnected initially", () => {
      const status = pipeline.getStatus();
      expect(status).toEqual({ unity: false, blender: false });
    });
  });
});
