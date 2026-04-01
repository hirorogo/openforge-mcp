import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import http from "node:http";

import { ToolRegistry, ToolMode } from "./registry.js";
import { ToolRouter } from "./router.js";
import { UnityAdapter } from "./adapters/unity.js";
import { BlenderAdapter } from "./adapters/blender.js";
import { GodotAdapter } from "./adapters/godot.js";
import { VersionControl } from "./version-control.js";
import { TransactionManager } from "./transaction.js";
import { Pipeline } from "./pipeline.js";
import { RecipeEngine } from "./recipe.js";
import { OperationLog } from "./operation-log.js";
import { Dashboard } from "./dashboard.js";
import { SafetyGuard } from "./safety.js";
import { ExtensionManager } from "./extension.js";
import { AssetGeneration } from "./asset-generation.js";
import { GameStudiosBridge } from "./game-studios.js";

import { SERVER_NAME, SERVER_VERSION, DEFAULT_SSE_PORT } from "./constants.js";
import { registerAllTools } from "./tool-registration.js";
import { createToolHandlers, getToolDefinitions } from "./tool-handlers.js";
import { createResourceHandlers, getResourceDefinitions } from "./resource-handlers.js";

export interface ServerOptions {
  mode: ToolMode;
  transport: "stdio" | "sse";
  ssePort?: number;
  projectPath?: string;
  autoSave?: boolean;
}

export function createOpenForgeServer(options: ServerOptions): {
  server: Server;
  registry: ToolRegistry;
  router: ToolRouter;
  unityAdapter: UnityAdapter;
  blenderAdapter: BlenderAdapter;
  godotAdapter: GodotAdapter;
  versionControl: VersionControl | null;
  transactionManager: TransactionManager;
  pipeline: Pipeline;
  recipeEngine: RecipeEngine;
  safetyGuard: SafetyGuard;
  extensionManager: ExtensionManager;
  assetGeneration: AssetGeneration;
  gameStudiosBridge: GameStudiosBridge;
  operationLog: OperationLog;
  dashboard: Dashboard;
  start: () => Promise<void>;
} {
  // --- Registry and tool registration ---
  const registry = new ToolRegistry();
  registry.setMode(options.mode);
  registerAllTools(registry);

  // --- Adapters ---
  const unityAdapter = new UnityAdapter();
  const blenderAdapter = new BlenderAdapter();
  const godotAdapter = new GodotAdapter();
  const router = new ToolRouter(registry, unityAdapter, blenderAdapter, godotAdapter);

  // --- Supporting services ---
  const operationLog = new OperationLog();

  const versionControl = options.projectPath
    ? new VersionControl(options.projectPath)
    : null;

  const transactionManager = new TransactionManager({
    autoSave: options.autoSave ?? false,
    versionControl: versionControl ?? undefined,
  });

  const pipeline = new Pipeline(unityAdapter, blenderAdapter);
  const recipeEngine = new RecipeEngine(router, registry);

  const safetyGuard = new SafetyGuard();
  if (versionControl) {
    safetyGuard.setVersionControl(versionControl);
  }

  const extensionManager = new ExtensionManager();
  const assetGeneration = new AssetGeneration();
  const gameStudiosBridge = new GameStudiosBridge();

  const dashboard = new Dashboard({
    registry,
    operationLog,
    unityAdapter,
    blenderAdapter,
    godotAdapter,
    transactionManager,
  });

  // --- MCP Server ---
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {}, resources: {} } },
  );

  // --- Tool handlers ---
  const toolHandlers = createToolHandlers({
    registry,
    router,
    unityAdapter,
    blenderAdapter,
    godotAdapter,
    versionControl,
    transactionManager,
    pipeline,
    recipeEngine,
    safetyGuard,
    extensionManager,
    assetGeneration,
    gameStudiosBridge,
    operationLog,
    projectPath: options.projectPath,
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: getToolDefinitions() };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = toolHandlers.get(name);
    if (!handler) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ success: false, error: `Unknown tool: ${name}` }),
          },
        ],
        isError: true,
      };
    }
    return handler(args ?? {});
  });

  // --- Resource handlers ---
  const resourceHandlers = createResourceHandlers({
    unityAdapter,
    blenderAdapter,
    godotAdapter,
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: getResourceDefinitions() };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const handler = resourceHandlers.get(uri);
    if (!handler) {
      throw new Error(`Unknown resource: ${uri}`);
    }
    return handler(uri);
  });

  // --- Start function ---
  const start = async (): Promise<void> => {
    if (options.transport === "stdio") {
      const transport = new StdioServerTransport();
      await server.connect(transport);
    } else {
      const port = options.ssePort ?? DEFAULT_SSE_PORT;
      let currentTransport: SSEServerTransport | null = null;

      const httpServer = http.createServer(async (req, res) => {
        if (req.method === "GET" && req.url === "/sse") {
          currentTransport = new SSEServerTransport("/messages", res);
          await server.connect(currentTransport);
        } else if (req.method === "POST" && req.url === "/messages") {
          if (currentTransport) {
            await currentTransport.handlePostMessage(req, res);
          } else {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "No active SSE connection" }));
          }
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      await new Promise<void>((resolve) => {
        httpServer.listen(port, () => {
          process.stderr.write(`OpenForge MCP SSE server listening on port ${port}\n`);
          resolve();
        });
      });
    }

    // Attempt to connect adapters in the background (non-blocking)
    unityAdapter.connect().catch(() => {
      process.stderr.write("Unity adapter: editor not available, will retry on demand\n");
    });
    blenderAdapter.connect().catch(() => {
      process.stderr.write("Blender adapter: editor not available, will retry on demand\n");
    });
    godotAdapter.connect().catch(() => {
      process.stderr.write("Godot adapter: editor not available, will retry on demand\n");
    });
  };

  return {
    server,
    registry,
    router,
    unityAdapter,
    blenderAdapter,
    godotAdapter,
    versionControl,
    transactionManager,
    pipeline,
    recipeEngine,
    safetyGuard,
    extensionManager,
    assetGeneration,
    gameStudiosBridge,
    operationLog,
    dashboard,
    start,
  };
}
