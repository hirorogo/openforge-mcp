import { createOpenForgeServer, ServerOptions } from "./server.js";
import { createHttpServer } from "./http.js";
import { ToolMode } from "./registry.js";

function parseArgs(argv: string[]): ServerOptions & { httpPort: number } {
  let mode: ToolMode = "full";
  let transport: "stdio" | "sse" = "stdio";
  let ssePort = 19820;
  let httpPort = 19810;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--mode" && i + 1 < argv.length) {
      const value = argv[++i];
      if (value === "full" || value === "essential" || value === "dynamic") {
        mode = value;
      } else {
        process.stderr.write(`Unknown mode "${value}". Using "full".\n`);
      }
    } else if (arg === "--transport" && i + 1 < argv.length) {
      const value = argv[++i];
      if (value === "stdio" || value === "sse") {
        transport = value;
      } else {
        process.stderr.write(`Unknown transport "${value}". Using "stdio".\n`);
      }
    } else if (arg === "--sse-port" && i + 1 < argv.length) {
      ssePort = parseInt(argv[++i], 10);
    } else if (arg === "--http-port" && i + 1 < argv.length) {
      httpPort = parseInt(argv[++i], 10);
    } else if (arg === "--help" || arg === "-h") {
      process.stderr.write(
        [
          "OpenForge MCP Server",
          "",
          "Usage: openforge-mcp [options]",
          "",
          "Options:",
          "  --mode <full|essential|dynamic>  Tool exposure mode (default: full)",
          "  --transport <stdio|sse>          MCP transport (default: stdio)",
          "  --sse-port <port>                SSE server port (default: 19820)",
          "  --http-port <port>               HTTP API port (default: 19810)",
          "  --help, -h                       Show this help message",
          "",
        ].join("\n"),
      );
      process.exit(0);
    }
  }

  return { mode, transport, ssePort, httpPort };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv);

  process.stderr.write(
    `Starting OpenForge MCP Server (mode=${options.mode}, transport=${options.transport})\n`,
  );

  const { server, registry, router, unityAdapter, blenderAdapter, start } =
    createOpenForgeServer(options);

  createHttpServer(registry, router, unityAdapter, blenderAdapter, options.httpPort);

  await start();

  process.stderr.write("OpenForge MCP Server is running\n");

  const shutdown = async (): Promise<void> => {
    process.stderr.write("Shutting down...\n");
    await unityAdapter.disconnect();
    await blenderAdapter.disconnect();
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
