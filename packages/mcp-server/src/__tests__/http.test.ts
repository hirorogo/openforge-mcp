import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import http from "node:http";
import { ToolRegistry } from "../registry.js";
import { ToolRouter } from "../router.js";
import { createHttpServer } from "../http.js";

function createMockAdapter(target: string) {
  return {
    targetName: target,
    _connected: false,
    isConnected() {
      return this._connected;
    },
    connect: vi.fn(async function (this: any) {
      this._connected = true;
    }),
    sendCommand: vi.fn(async () => ({
      jsonrpc: "2.0" as const,
      id: 1,
      result: { status: "ok" },
    })),
  };
}

function request(
  server: http.Server,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const addr = server.address() as { port: number };
    const options: http.RequestOptions = {
      hostname: "127.0.0.1",
      port: addr.port,
      path,
      method,
      headers: { "Content-Type": "application/json" },
    };

    const req = http.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf-8");
        let parsed: any;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }
        resolve({ status: res.statusCode!, headers: res.headers, body: parsed });
      });
    });
    req.on("error", reject);
    if (body !== undefined) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

describe("HTTP API Server", () => {
  let registry: ToolRegistry;
  let router: ToolRouter;
  let unityAdapter: ReturnType<typeof createMockAdapter>;
  let blenderAdapter: ReturnType<typeof createMockAdapter>;
  let server: http.Server;

  beforeEach(async () => {
    registry = new ToolRegistry();
    unityAdapter = createMockAdapter("unity");
    blenderAdapter = createMockAdapter("blender");
    router = new ToolRouter(registry, unityAdapter as any, blenderAdapter as any, createMockAdapter("godot") as any);

    registry.registerTools([
      {
        name: "create_gameobject",
        description: "Create a game object",
        category: "scene",
        target: "unity",
        parameters: {
          type: "object",
          properties: { name: { type: "string" } },
          required: ["name"],
        },
      },
      {
        name: "create_mesh",
        description: "Create a mesh",
        category: "mesh",
        target: "blender",
        parameters: { type: "object", properties: {} },
      },
    ]);

    // Use port 0 to let the OS pick an available port
    // Suppress stderr output from createHttpServer
    const origWrite = process.stderr.write;
    process.stderr.write = (() => true) as any;
    server = createHttpServer(registry, router, unityAdapter as any, blenderAdapter as any, 0);
    process.stderr.write = origWrite;

    // Wait for server to start listening
    await new Promise<void>((resolve) => {
      if (server.listening) {
        resolve();
      } else {
        server.on("listening", resolve);
      }
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe("GET /api/status", () => {
    it("should return current mode and connection status", async () => {
      const res = await request(server, "GET", "/api/status");
      expect(res.status).toBe(200);
      expect(res.body.mode).toBe("full");
      expect(res.body.connections).toEqual({ unity: false, blender: false });
      expect(res.body.toolCount).toBe(2);
    });

    it("should reflect connected adapters", async () => {
      unityAdapter._connected = true;
      const res = await request(server, "GET", "/api/status");
      expect(res.body.connections.unity).toBe(true);
      expect(res.body.connections.blender).toBe(false);
    });

    it("should reflect the current tool mode", async () => {
      registry.setMode("essential");
      const res = await request(server, "GET", "/api/status");
      expect(res.body.mode).toBe("essential");
      // In essential mode, only tools in the ESSENTIAL_TOOLS set are counted
      // "create_gameobject" is essential, "create_mesh" is essential
      expect(res.body.toolCount).toBe(2);
    });
  });

  describe("GET /api/categories", () => {
    it("should return all categories", async () => {
      const res = await request(server, "GET", "/api/categories");
      expect(res.status).toBe(200);
      expect(res.body.categories).toHaveLength(2);
      expect(res.body.mode).toBe("full");
    });

    it("should filter categories by target query param", async () => {
      const res = await request(server, "GET", "/api/categories?target=unity");
      expect(res.status).toBe(200);
      expect(res.body.categories).toHaveLength(1);
      expect(res.body.categories[0].target).toBe("unity");
    });
  });

  describe("GET /api/tools/:category", () => {
    it("should return tools for a given category", async () => {
      const res = await request(server, "GET", "/api/tools/scene");
      expect(res.status).toBe(200);
      expect(res.body.category).toBe("scene");
      expect(res.body.toolCount).toBe(1);
      expect(res.body.tools[0].name).toBe("create_gameobject");
    });

    it("should return an empty list for a nonexistent category", async () => {
      const res = await request(server, "GET", "/api/tools/nonexistent");
      expect(res.status).toBe(200);
      expect(res.body.toolCount).toBe(0);
      expect(res.body.tools).toEqual([]);
    });

    it("should filter by target query param", async () => {
      const res = await request(server, "GET", "/api/tools/mesh?target=blender");
      expect(res.status).toBe(200);
      expect(res.body.toolCount).toBe(1);
      expect(res.body.tools[0].target).toBe("blender");
    });

    it("should include tool details in the response", async () => {
      const res = await request(server, "GET", "/api/tools/scene");
      const tool = res.body.tools[0];
      expect(tool).toHaveProperty("name");
      expect(tool).toHaveProperty("description");
      expect(tool).toHaveProperty("category");
      expect(tool).toHaveProperty("target");
      expect(tool).toHaveProperty("parameters");
    });
  });

  describe("POST /api/execute", () => {
    it("should execute a valid request and return the result", async () => {
      const res = await request(server, "POST", "/api/execute", {
        target: "unity",
        tool: "create_gameobject",
        args: { name: "Cube" },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.target).toBe("unity");
      expect(res.body.tool).toBe("create_gameobject");
    });

    it("should return 400 for missing target field", async () => {
      const res = await request(server, "POST", "/api/execute", {
        tool: "create_gameobject",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("required");
    });

    it("should return 400 for missing tool field", async () => {
      const res = await request(server, "POST", "/api/execute", {
        target: "unity",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("required");
    });

    it("should return 400 for invalid JSON body", async () => {
      const addr = server.address() as { port: number };
      const res = await new Promise<{ status: number; body: any }>((resolve, reject) => {
        const req = http.request(
          {
            hostname: "127.0.0.1",
            port: addr.port,
            path: "/api/execute",
            method: "POST",
            headers: { "Content-Type": "application/json" },
          },
          (resp) => {
            const chunks: Buffer[] = [];
            resp.on("data", (chunk: Buffer) => chunks.push(chunk));
            resp.on("end", () => {
              resolve({
                status: resp.statusCode!,
                body: JSON.parse(Buffer.concat(chunks).toString()),
              });
            });
          },
        );
        req.on("error", reject);
        req.write("not valid json{{{");
        req.end();
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Invalid JSON");
    });

    it("should return 422 when tool execution fails", async () => {
      const res = await request(server, "POST", "/api/execute", {
        target: "unity",
        tool: "create_gameobject",
        args: {}, // missing required "name" param
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Missing required parameters");
    });
  });

  describe("CORS headers", () => {
    it("should include Access-Control-Allow-Origin in GET responses", async () => {
      const res = await request(server, "GET", "/api/status");
      expect(res.headers["access-control-allow-origin"]).toBe("*");
    });

    it("should include Access-Control-Allow-Origin in POST responses", async () => {
      const res = await request(server, "POST", "/api/execute", {
        target: "unity",
        tool: "create_gameobject",
        args: { name: "Cube" },
      });
      expect(res.headers["access-control-allow-origin"]).toBe("*");
    });

    it("should handle OPTIONS preflight requests", async () => {
      const addr = server.address() as { port: number };
      const res = await new Promise<{ status: number; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
        const req = http.request(
          {
            hostname: "127.0.0.1",
            port: addr.port,
            path: "/api/execute",
            method: "OPTIONS",
          },
          (resp) => {
            resp.on("data", () => {});
            resp.on("end", () => resolve({ status: resp.statusCode!, headers: resp.headers }));
          },
        );
        req.on("error", reject);
        req.end();
      });

      expect(res.status).toBe(204);
      expect(res.headers["access-control-allow-origin"]).toBe("*");
      expect(res.headers["access-control-allow-methods"]).toContain("POST");
      expect(res.headers["access-control-allow-headers"]).toContain("Content-Type");
    });
  });

  describe("404 handling", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await request(server, "GET", "/api/nonexistent");
      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Not found");
    });

    it("should return 404 for wrong method on known routes", async () => {
      const res = await request(server, "POST", "/api/status");
      expect(res.status).toBe(404);
    });
  });
});
