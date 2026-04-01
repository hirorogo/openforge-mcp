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

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function sendJson(res: http.ServerResponse, statusCode: number, data: unknown): void {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function parsePath(url: string): { pathname: string; query: Record<string, string> } {
  const qIndex = url.indexOf("?");
  const pathname = qIndex === -1 ? url : url.substring(0, qIndex);
  const query: Record<string, string> = {};
  if (qIndex !== -1) {
    const qs = url.substring(qIndex + 1);
    for (const pair of qs.split("&")) {
      const [key, val] = pair.split("=");
      if (key) {
        query[decodeURIComponent(key)] = decodeURIComponent(val ?? "");
      }
    }
  }
  return { pathname, query };
}

export function createHttpServer(
  registry: ToolRegistry,
  router: ToolRouter,
  unityAdapter: UnityAdapter,
  blenderAdapter: BlenderAdapter,
  port: number = 19810,
): http.Server {
  const queue = new RequestQueue();

  const httpServer = http.createServer((req, res) => {
    // CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      });
      res.end();
      return;
    }

    const { pathname } = parsePath(req.url ?? "/");

    if (req.method === "GET" && pathname === "/api/status") {
      sendJson(res, 200, {
        mode: registry.getMode(),
        connections: {
          unity: unityAdapter.isConnected(),
          blender: blenderAdapter.isConnected(),
        },
        toolCount: registry.getTools().length,
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/categories") {
      const { query } = parsePath(req.url ?? "/");
      const target = query.target || undefined;
      const categories = registry.getCategories(target);
      sendJson(res, 200, { mode: registry.getMode(), categories });
      return;
    }

    // GET /api/tools/:category
    const toolsMatch = pathname.match(/^\/api\/tools\/([^/]+)$/);
    if (req.method === "GET" && toolsMatch) {
      const category = decodeURIComponent(toolsMatch[1]);
      const { query } = parsePath(req.url ?? "/");
      const target = query.target || undefined;
      const tools = registry.getTools(target, category).map((t) => ({
        name: t.name,
        target: t.target,
        category: t.category,
        description: t.description,
        parameters: t.parameters,
      }));
      sendJson(res, 200, { category, toolCount: tools.length, tools });
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
            sendJson(res, 400, { success: false, error: "Invalid JSON in request body" });
            return;
          }

          const target = body.target as "unity" | "blender" | "godot";
          const tool = body.tool as string;
          const args = (body.args as Record<string, unknown>) || undefined;

          if (!target || !tool) {
            sendJson(res, 400, {
              success: false,
              error: "Both 'target' and 'tool' fields are required in the request body",
            });
            return;
          }

          const result = await router.execute({ target, tool, args });
          sendJson(res, result.success ? 200 : 422, result);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          sendJson(res, 500, { success: false, error: message });
        }
      });
      return;
    }

    sendJson(res, 404, { error: `Not found: ${req.method} ${pathname}` });
  });

  httpServer.listen(port, () => {
    process.stderr.write(`OpenForge HTTP API server listening on port ${port}\n`);
  });

  return httpServer;
}
