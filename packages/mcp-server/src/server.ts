import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ToolRegistry, ToolMode } from "./registry.js";
import { ToolRouter } from "./router.js";
import { UnityAdapter } from "./adapters/unity.js";
import { BlenderAdapter } from "./adapters/blender.js";

import unitySceneTools from "./tools/unity/scene.js";
import unityGameObjectTools from "./tools/unity/gameobject.js";
import unityMaterialTools from "./tools/unity/material.js";
import unityScriptTools from "./tools/unity/script.js";
import blenderObjectTools from "./tools/blender/object.js";
import blenderMeshTools from "./tools/blender/mesh.js";
import blenderMaterialTools from "./tools/blender/material.js";

import http from "node:http";

export interface ServerOptions {
  mode: ToolMode;
  transport: "stdio" | "sse";
  ssePort?: number;
}

export function createOpenForgeServer(options: ServerOptions): {
  server: Server;
  registry: ToolRegistry;
  router: ToolRouter;
  unityAdapter: UnityAdapter;
  blenderAdapter: BlenderAdapter;
  start: () => Promise<void>;
} {
  const registry = new ToolRegistry();
  registry.setMode(options.mode);

  // Register all tool definitions
  registry.registerTools(unitySceneTools);
  registry.registerTools(unityGameObjectTools);
  registry.registerTools(unityMaterialTools);
  registry.registerTools(unityScriptTools);
  registry.registerTools(blenderObjectTools);
  registry.registerTools(blenderMeshTools);
  registry.registerTools(blenderMaterialTools);

  const unityAdapter = new UnityAdapter();
  const blenderAdapter = new BlenderAdapter();
  const router = new ToolRouter(registry, unityAdapter, blenderAdapter);

  const server = new Server(
    {
      name: "openforge-mcp",
      version: "0.0.1",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  );

  // --- Tool handlers ---

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "list_categories",
          description:
            "List all available tool categories grouped by target application (unity/blender). Returns category names and tool counts.",
          inputSchema: {
            type: "object" as const,
            properties: {
              target: {
                type: "string",
                enum: ["unity", "blender"],
                description: "Filter categories by target. Omit to list all.",
              },
            },
            required: [],
          },
        },
        {
          name: "list_tools",
          description:
            "List all available tools, optionally filtered by target and category. Returns tool names, descriptions, and parameter schemas.",
          inputSchema: {
            type: "object" as const,
            properties: {
              target: {
                type: "string",
                enum: ["unity", "blender"],
                description: "Filter by target application",
              },
              category: {
                type: "string",
                description: "Filter by tool category (e.g. scene, gameobject, material, mesh)",
              },
            },
            required: [],
          },
        },
        {
          name: "execute",
          description:
            "Execute a tool on the target application (Unity or Blender). The tool must exist in the registry and the target editor must be connected.",
          inputSchema: {
            type: "object" as const,
            properties: {
              target: {
                type: "string",
                enum: ["unity", "blender"],
                description: "Target application to execute the tool on",
              },
              tool: {
                type: "string",
                description: "Name of the tool to execute",
              },
              args: {
                type: "object",
                description: "Arguments to pass to the tool, matching its parameter schema",
                additionalProperties: true,
              },
            },
            required: ["target", "tool"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "list_categories": {
        const target = (args?.target as string) || undefined;
        const categories = registry.getCategories(target);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ mode: registry.getMode(), categories }, null, 2),
            },
          ],
        };
      }

      case "list_tools": {
        const target = (args?.target as string) || undefined;
        const category = (args?.category as string) || undefined;
        const tools = registry.getTools(target, category).map((t) => ({
          name: t.name,
          target: t.target,
          category: t.category,
          description: t.description,
          parameters: t.parameters,
        }));
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ mode: registry.getMode(), toolCount: tools.length, tools }, null, 2),
            },
          ],
        };
      }

      case "execute": {
        const target = args?.target as "unity" | "blender";
        const tool = args?.tool as string;
        const toolArgs = (args?.args as Record<string, unknown>) || undefined;

        if (!target || !tool) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ success: false, error: "Both 'target' and 'tool' parameters are required." }),
              },
            ],
            isError: true,
          };
        }

        const result = await router.execute({ target, tool, args: toolArgs });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      default:
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
  });

  // --- Resource handlers ---

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: "scene://unity/hierarchy",
          name: "Unity Scene Hierarchy",
          description: "The current Unity scene hierarchy as a nested tree of GameObjects",
          mimeType: "application/json",
        },
        {
          uri: "scene://unity/console",
          name: "Unity Console Log",
          description: "Recent Unity Editor console log messages including errors, warnings, and info",
          mimeType: "application/json",
        },
        {
          uri: "scene://blender/objects",
          name: "Blender Scene Objects",
          description: "List of all objects in the current Blender scene with type and transform data",
          mimeType: "application/json",
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    switch (uri) {
      case "scene://unity/hierarchy": {
        if (!unityAdapter.isConnected()) {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({ error: "Unity is not connected" }),
              },
            ],
          };
        }
        try {
          const response = await unityAdapter.getHierarchy();
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(response.result ?? response.error, null, 2),
              },
            ],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ error: msg }) }],
          };
        }
      }

      case "scene://unity/console": {
        if (!unityAdapter.isConnected()) {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({ error: "Unity is not connected" }),
              },
            ],
          };
        }
        try {
          const response = await unityAdapter.getConsoleLog();
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(response.result ?? response.error, null, 2),
              },
            ],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ error: msg }) }],
          };
        }
      }

      case "scene://blender/objects": {
        if (!blenderAdapter.isConnected()) {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({ error: "Blender is not connected" }),
              },
            ],
          };
        }
        try {
          const response = await blenderAdapter.getObjects();
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(response.result ?? response.error, null, 2),
              },
            ],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ error: msg }) }],
          };
        }
      }

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });

  // --- Start function ---

  const start = async (): Promise<void> => {
    if (options.transport === "stdio") {
      const transport = new StdioServerTransport();
      await server.connect(transport);
    } else {
      const port = options.ssePort ?? 19820;
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
  };

  return { server, registry, router, unityAdapter, blenderAdapter, start };
}
