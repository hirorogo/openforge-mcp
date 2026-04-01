import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ClientName = "claude-desktop" | "cursor" | "vscode" | "lmstudio";

export interface SetupOptions {
  client?: ClientName;
  mode: "full" | "essential" | "dynamic" | "vrchat";
  port?: number;
  blenderPort?: number;
  godotPort?: number;
  dryRun: boolean;
}

export interface ClientInfo {
  name: ClientName;
  displayName: string;
  configPath: string;
}

export function getClientConfigPath(client: ClientName): string {
  const platform = os.platform();
  const home = os.homedir();

  switch (client) {
    case "claude-desktop": {
      if (platform === "darwin") {
        return path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
      }
      if (platform === "linux") {
        return path.join(home, ".config", "Claude", "claude_desktop_config.json");
      }
      // Windows
      const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
      return path.join(appData, "Claude", "claude_desktop_config.json");
    }
    case "cursor":
      return path.join(home, ".cursor", "mcp.json");
    case "vscode":
      return path.join(process.cwd(), ".vscode", "mcp.json");
    case "lmstudio":
      return path.join(home, ".lmstudio", "mcp.json");
  }
}

export function detectClients(): ClientInfo[] {
  const clients: { name: ClientName; displayName: string }[] = [
    { name: "claude-desktop", displayName: "Claude Desktop" },
    { name: "cursor", displayName: "Cursor" },
    { name: "vscode", displayName: "VS Code" },
    { name: "lmstudio", displayName: "LM Studio" },
  ];

  const detected: ClientInfo[] = [];

  for (const client of clients) {
    const configPath = getClientConfigPath(client.name);
    const configDir = path.dirname(configPath);
    if (fs.existsSync(configDir)) {
      detected.push({ ...client, configPath });
    }
  }

  return detected;
}

export function getServerEntryPath(): string {
  // Resolve the path to dist/index.js relative to this package
  return path.resolve(__dirname, "..", "..", "dist", "index.js");
}

/**
 * Returns the correct top-level wrapper key for the MCP config based on client type.
 * VS Code uses "servers", all other clients use "mcpServers".
 */
export function getConfigFormat(client?: ClientName): "servers" | "mcpServers" {
  if (client === "vscode") {
    return "servers";
  }
  return "mcpServers";
}

export function buildMcpEntry(options: SetupOptions): Record<string, unknown> {
  const args: string[] = [getServerEntryPath(), "--mode", options.mode];
  const env: Record<string, string> = {};

  if (options.port != null) {
    env.OPENFORGE_UNITY_PORT = String(options.port);
  }
  if (options.blenderPort != null) {
    env.OPENFORGE_BLENDER_PORT = String(options.blenderPort);
  }
  if (options.godotPort != null) {
    env.OPENFORGE_GODOT_PORT = String(options.godotPort);
  }

  return {
    command: "node",
    args,
    env,
  };
}

export function mergeConfig(
  existingContent: string | null,
  mcpEntry: Record<string, unknown>,
  client?: ClientName,
): Record<string, unknown> {
  let config: Record<string, unknown> = {};

  if (existingContent != null && existingContent.trim().length > 0) {
    try {
      config = JSON.parse(existingContent) as Record<string, unknown>;
    } catch {
      // If the existing file is not valid JSON, start fresh but warn
      config = {};
    }
  }

  const wrapperKey = getConfigFormat(client);

  if (typeof config[wrapperKey] !== "object" || config[wrapperKey] == null) {
    config[wrapperKey] = {};
  }

  const servers = config[wrapperKey] as Record<string, unknown>;
  servers["openforge"] = mcpEntry;

  return config;
}

export interface SetupResult {
  client: ClientInfo;
  action: "written" | "skipped" | "dry-run";
  configPath: string;
  error?: string;
}

export function runSetup(options: SetupOptions): SetupResult[] {
  const results: SetupResult[] = [];

  let clients: ClientInfo[];

  if (options.client) {
    const configPath = getClientConfigPath(options.client);
    const allClients: Record<ClientName, string> = {
      "claude-desktop": "Claude Desktop",
      cursor: "Cursor",
      vscode: "VS Code",
      lmstudio: "LM Studio",
    };
    clients = [
      {
        name: options.client,
        displayName: allClients[options.client],
        configPath,
      },
    ];
  } else {
    clients = detectClients();
  }

  if (clients.length === 0) {
    process.stderr.write("[SKIP] No supported AI clients detected.\n");
    return results;
  }

  const mcpEntry = buildMcpEntry(options);

  for (const client of clients) {
    const result: SetupResult = {
      client,
      action: "written",
      configPath: client.configPath,
    };

    try {
      let existingContent: string | null = null;
      if (fs.existsSync(client.configPath)) {
        existingContent = fs.readFileSync(client.configPath, "utf-8");
      }

      const merged = mergeConfig(existingContent, mcpEntry, client.name);
      const output = JSON.stringify(merged, null, 2) + "\n";

      if (options.dryRun) {
        result.action = "dry-run";
        process.stderr.write(`[DRY-RUN] ${client.displayName} (${client.configPath}):\n`);
        process.stderr.write(output);
      } else {
        const dir = path.dirname(client.configPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(client.configPath, output, "utf-8");
        result.action = "written";
        process.stderr.write(`[OK] ${client.displayName} -- ${client.configPath}\n`);
      }
    } catch (err) {
      result.action = "skipped";
      result.error = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `[ERROR] ${client.displayName} -- ${result.error}\n`,
      );
    }

    results.push(result);
  }

  return results;
}

export function parseSetupArgs(argv: string[]): SetupOptions {
  const options: SetupOptions = {
    mode: "full",
    dryRun: false,
  };

  // Skip "node", script path, and "setup" command
  let i = 3;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg === "--client" && i + 1 < argv.length) {
      const value = argv[++i] as ClientName;
      const validClients: ClientName[] = ["claude-desktop", "cursor", "vscode", "lmstudio"];
      if (validClients.includes(value)) {
        options.client = value;
      } else {
        process.stderr.write(`[ERROR] Unknown client "${value}". Valid: ${validClients.join(", ")}\n`);
        process.exit(1);
      }
    } else if (arg === "--mode" && i + 1 < argv.length) {
      const value = argv[++i];
      if (value === "full" || value === "essential" || value === "dynamic" || value === "vrchat") {
        options.mode = value;
      } else {
        process.stderr.write(`[ERROR] Unknown mode "${value}". Valid: full, essential, dynamic, vrchat\n`);
        process.exit(1);
      }
    } else if (arg === "--port" && i + 1 < argv.length) {
      options.port = parseInt(argv[++i], 10);
    } else if (arg === "--blender-port" && i + 1 < argv.length) {
      options.blenderPort = parseInt(argv[++i], 10);
    } else if (arg === "--godot-port" && i + 1 < argv.length) {
      options.godotPort = parseInt(argv[++i], 10);
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      process.stderr.write(
        [
          "OpenForge MCP Setup",
          "",
          "Usage: openforge-mcp setup [options]",
          "",
          "Options:",
          "  --client <name>          Target client (claude-desktop, cursor, vscode, lmstudio)",
          "  --mode <mode>            Tool mode: full, essential, dynamic, vrchat (default: full)",
          "  --port <number>          Override Unity port",
          "  --blender-port <number>  Override Blender port",
          "  --godot-port <number>    Override Godot port",
          "  --dry-run                Show config without writing",
          "  --help, -h               Show this help message",
          "",
        ].join("\n"),
      );
      process.exit(0);
    }

    i++;
  }

  return options;
}
