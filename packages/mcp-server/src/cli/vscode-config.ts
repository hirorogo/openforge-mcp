import * as path from "node:path";
import * as fs from "node:fs";
import { getServerEntryPath } from "./setup.js";

export interface VscodeConfigOptions {
  mode: "full" | "essential" | "dynamic" | "vrchat";
  unityPort?: number;
  blenderPort?: number;
  godotPort?: number;
}

/**
 * Build the VS Code MCP server configuration object.
 * VS Code uses the "servers" key (not "mcpServers").
 */
export function buildVscodeServerEntry(options: VscodeConfigOptions): Record<string, unknown> {
  const args: string[] = [getServerEntryPath(), "--mode", options.mode];
  const env: Record<string, string> = {};

  if (options.unityPort != null) {
    env.OPENFORGE_UNITY_PORT = String(options.unityPort);
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

/**
 * Generate a complete .vscode/mcp.json configuration object.
 */
export function generateVscodeConfig(options: VscodeConfigOptions): Record<string, unknown> {
  const entry = buildVscodeServerEntry(options);

  return {
    servers: {
      openforge: entry,
    },
  };
}

/**
 * Write .vscode/mcp.json to the specified project directory.
 * Merges with any existing configuration, preserving other servers.
 * Returns the absolute path of the written file.
 */
export function writeVscodeConfig(projectDir: string, options: VscodeConfigOptions): string {
  const vscodeDir = path.join(projectDir, ".vscode");
  const configPath = path.join(vscodeDir, "mcp.json");

  let existingConfig: Record<string, unknown> = {};

  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, "utf-8");
      existingConfig = JSON.parse(content) as Record<string, unknown>;
    } catch {
      // Invalid JSON -- start fresh
      existingConfig = {};
    }
  }

  if (typeof existingConfig.servers !== "object" || existingConfig.servers == null) {
    existingConfig.servers = {};
  }

  const servers = existingConfig.servers as Record<string, unknown>;
  servers["openforge"] = buildVscodeServerEntry(options);

  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir, { recursive: true });
  }

  const output = JSON.stringify(existingConfig, null, 2) + "\n";
  fs.writeFileSync(configPath, output, "utf-8");

  return configPath;
}
