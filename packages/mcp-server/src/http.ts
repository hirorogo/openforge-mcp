import http from "node:http";
import { ToolRegistry } from "./registry.js";
import { ToolRouter } from "./router.js";
import { UnityAdapter } from "./adapters/unity.js";
import { BlenderAdapter } from "./adapters/blender.js";
import { GodotAdapter } from "./adapters/godot.js";

interface QueuedRequest {
  execute: () => Promise<void>;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing: boolean = false;

  enqueue(execute: () => Promise<void>): void {
    this.queue.push({ execute });
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const item = this.queue.shift()!;
    try {
      await item.execute();
    } catch {
      // Error handling is done inside the execute function
    } finally {
      this.processing = false;
      this.processNext();
    }
  }
}

const MAX_BODY_SIZE = 1024 * 1024; // 1MB

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalLength = 0;
    req.on("data", (chunk: Buffer) => {
      totalLength += chunk.length;
      if (totalLength > MAX_BODY_SIZE) {
        req.destroy();
        reject(new Error("Payload Too Large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

const ALLOWED_ORIGINS = ['http://localhost', 'http://127.0.0.1'];

function getAllowedOrigin(req: http.IncomingMessage): string | undefined {
  const origin = req.headers.origin;
  if (!origin) return undefined;
  // Allow origins that exactly match or start with an allowed prefix followed by ':'
  for (const allowed of ALLOWED_ORIGINS) {
    if (origin === allowed || origin.startsWith(allowed + ':')) {
      return origin;
    }
  }
  return undefined;
}

function sendJson(res: http.ServerResponse, statusCode: number, data: unknown, req?: http.IncomingMessage): void {
  const body = JSON.stringify(data, null, 2);
  const headers: Record<string, string | number> = {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  };
  const allowedOrigin = req ? getAllowedOrigin(req) : undefined;
  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }
  res.writeHead(statusCode, headers);
  res.end(body);
}

function parseUrl(raw: string): { pathname: string; searchParams: URLSearchParams } {
  const url = new URL(raw, `http://localhost`);
  return { pathname: url.pathname, searchParams: url.searchParams };
}

export function createHttpServer(
  registry: ToolRegistry,
  router: ToolRouter,
  unityAdapter: UnityAdapter,
  blenderAdapter: BlenderAdapter,
  port: number = 19810,
  godotAdapter?: GodotAdapter,
): http.Server {
  const queue = new RequestQueue();

  const httpServer = http.createServer((req, res) => {
    // CORS preflight
    if (req.method === "OPTIONS") {
      const corsHeaders: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      };
      const allowedOrigin = getAllowedOrigin(req);
      if (allowedOrigin) {
        corsHeaders["Access-Control-Allow-Origin"] = allowedOrigin;
      }
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    const { pathname, searchParams } = parseUrl(req.url ?? "/");

    if (req.method === "GET" && pathname === "/api/status") {
      const connections: Record<string, boolean> = {
        unity: unityAdapter.isConnected(),
        blender: blenderAdapter.isConnected(),
      };
      if (godotAdapter) {
        connections.godot = godotAdapter.isConnected();
      }
      sendJson(res, 200, {
        mode: registry.getMode(),
        connections,
        toolCount: registry.getTools().length,
      }, req);
      return;
    }

    if (req.method === "GET" && pathname === "/api/categories") {
      const target = searchParams.get("target") || undefined;
      const categories = registry.getCategories(target);
      sendJson(res, 200, { mode: registry.getMode(), categories }, req);
      return;
    }

    // GET /api/tools/:category
    const toolsMatch = pathname.match(/^\/api\/tools\/([^/]+)$/);
    if (req.method === "GET" && toolsMatch) {
      const category = decodeURIComponent(toolsMatch[1]);
      const target = searchParams.get("target") || undefined;
      const tools = registry.getTools(target, category).map((t) => ({
        name: t.name,
        target: t.target,
        category: t.category,
        description: t.description,
        parameters: t.parameters,
      }));
      sendJson(res, 200, { category, toolCount: tools.length, tools }, req);
      return;
    }

    if (req.method === "POST" && pathname === "/api/execute") {
      queue.enqueue(async () => {
        try {
          const bodyStr = await readBody(req);
          let body: Record<string, unknown>;
          try {
            body = JSON.parse(bodyStr);
          } catch {
            sendJson(res, 400, { success: false, error: "Invalid JSON in request body" }, req);
            return;
          }

          const target = body.target as "unity" | "blender" | "godot";
          const tool = body.tool as string;
          const args = (body.args as Record<string, unknown>) || undefined;

          if (!target || !tool) {
            sendJson(res, 400, {
              success: false,
              error: "Both 'target' and 'tool' fields are required in the request body",
            }, req);
            return;
          }

          const result = await router.execute({ target, tool, args });
          sendJson(res, result.success ? 200 : 422, result, req);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message === "Payload Too Large") {
            sendJson(res, 413, { success: false, error: "Payload Too Large" }, req);
          } else {
            sendJson(res, 500, { success: false, error: message }, req);
          }
        }
      });
      return;
    }

    sendJson(res, 404, { error: `Not found: ${req.method} ${pathname}` }, req);
  });

  httpServer.listen(port, () => {
    process.stderr.write(`OpenForge HTTP API server listening on port ${port}\n`);
  });

  return httpServer;
}
