import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import {
  getClientConfigPath,
  detectClients,
  buildMcpEntry,
  mergeConfig,
  runSetup,
  parseSetupArgs,
  type SetupOptions,
} from "../cli/setup.js";

vi.mock("node:os", async () => {
  const actual = await vi.importActual<typeof import("node:os")>("node:os");
  return {
    ...actual,
    platform: vi.fn(() => "darwin"),
    homedir: vi.fn(() => "/Users/testuser"),
  };
});

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return {
    ...actual,
    existsSync: vi.fn(() => false),
    readFileSync: vi.fn(() => ""),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

describe("setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getClientConfigPath", () => {
    it("should return macOS path for Claude Desktop on darwin", () => {
      vi.mocked(os.platform).mockReturnValue("darwin");
      vi.mocked(os.homedir).mockReturnValue("/Users/testuser");

      const result = getClientConfigPath("claude-desktop");
      expect(result).toBe(
        path.join("/Users/testuser", "Library", "Application Support", "Claude", "claude_desktop_config.json"),
      );
    });

    it("should return Windows path for Claude Desktop on win32", () => {
      vi.mocked(os.platform).mockReturnValue("win32");
      vi.mocked(os.homedir).mockReturnValue("C:\\Users\\testuser");
      const originalAppData = process.env.APPDATA;
      process.env.APPDATA = "C:\\Users\\testuser\\AppData\\Roaming";

      const result = getClientConfigPath("claude-desktop");
      expect(result).toBe(
        path.join("C:\\Users\\testuser\\AppData\\Roaming", "Claude", "claude_desktop_config.json"),
      );

      process.env.APPDATA = originalAppData;
    });

    it("should return cursor config path", () => {
      vi.mocked(os.homedir).mockReturnValue("/Users/testuser");

      const result = getClientConfigPath("cursor");
      expect(result).toBe(path.join("/Users/testuser", ".cursor", "mcp.json"));
    });

    it("should return vscode config path in cwd", () => {
      const result = getClientConfigPath("vscode");
      expect(result).toBe(path.join(process.cwd(), ".vscode", "mcp.json"));
    });

    it("should return lmstudio config path", () => {
      vi.mocked(os.homedir).mockReturnValue("/Users/testuser");

      const result = getClientConfigPath("lmstudio");
      expect(result).toBe(path.join("/Users/testuser", ".lmstudio", "mcp.json"));
    });
  });

  describe("detectClients", () => {
    it("should detect clients whose config directory exists", () => {
      vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
        const s = String(p);
        // Only the Claude config directory exists
        return s.includes("Claude") && !s.endsWith(".json");
      });

      const clients = detectClients();
      expect(clients.length).toBe(1);
      expect(clients[0].name).toBe("claude-desktop");
    });

    it("should return empty array when no clients found", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const clients = detectClients();
      expect(clients).toEqual([]);
    });

    it("should detect multiple clients", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const clients = detectClients();
      expect(clients.length).toBe(4);
      expect(clients.map((c) => c.name)).toEqual([
        "claude-desktop",
        "cursor",
        "vscode",
        "lmstudio",
      ]);
    });
  });

  describe("buildMcpEntry", () => {
    it("should build entry with default options", () => {
      const entry = buildMcpEntry({ mode: "full", dryRun: false });
      expect(entry.command).toBe("node");
      expect((entry.args as string[])[1]).toBe("--mode");
      expect((entry.args as string[])[2]).toBe("full");
      expect(entry.env).toEqual({});
    });

    it("should include port in env when specified", () => {
      const entry = buildMcpEntry({ mode: "essential", port: 9999, dryRun: false });
      expect((entry.args as string[])[2]).toBe("essential");
      expect((entry.env as Record<string, string>).OPENFORGE_UNITY_PORT).toBe("9999");
    });

    it("should include blender port in env when specified", () => {
      const entry = buildMcpEntry({ mode: "full", blenderPort: 8888, dryRun: false });
      expect((entry.env as Record<string, string>).OPENFORGE_BLENDER_PORT).toBe("8888");
    });

    it("should include both ports when specified", () => {
      const entry = buildMcpEntry({
        mode: "dynamic",
        port: 9999,
        blenderPort: 8888,
        dryRun: false,
      });
      const env = entry.env as Record<string, string>;
      expect(env.OPENFORGE_UNITY_PORT).toBe("9999");
      expect(env.OPENFORGE_BLENDER_PORT).toBe("8888");
    });
  });

  describe("mergeConfig", () => {
    it("should create new config from null", () => {
      const entry = { command: "node", args: ["test"], env: {} };
      const result = mergeConfig(null, entry);

      expect(result).toEqual({
        mcpServers: {
          openforge: entry,
        },
      });
    });

    it("should create new config from empty string", () => {
      const entry = { command: "node", args: ["test"], env: {} };
      const result = mergeConfig("", entry);

      expect(result).toEqual({
        mcpServers: {
          openforge: entry,
        },
      });
    });

    it("should preserve existing MCP servers", () => {
      const existing = JSON.stringify({
        mcpServers: {
          "other-server": {
            command: "python",
            args: ["other.py"],
          },
        },
      });
      const entry = { command: "node", args: ["test"], env: {} };
      const result = mergeConfig(existing, entry);

      expect(result).toEqual({
        mcpServers: {
          "other-server": {
            command: "python",
            args: ["other.py"],
          },
          openforge: entry,
        },
      });
    });

    it("should update existing openforge entry", () => {
      const existing = JSON.stringify({
        mcpServers: {
          openforge: {
            command: "node",
            args: ["old-path"],
          },
          "other-server": {
            command: "python",
            args: ["other.py"],
          },
        },
      });
      const entry = { command: "node", args: ["new-path"], env: {} };
      const result = mergeConfig(existing, entry);

      expect((result.mcpServers as Record<string, unknown>)["openforge"]).toEqual(entry);
      expect((result.mcpServers as Record<string, unknown>)["other-server"]).toEqual({
        command: "python",
        args: ["other.py"],
      });
    });

    it("should handle invalid JSON gracefully", () => {
      const entry = { command: "node", args: ["test"], env: {} };
      const result = mergeConfig("{invalid json", entry);

      expect(result).toEqual({
        mcpServers: {
          openforge: entry,
        },
      });
    });

    it("should handle config with no mcpServers key", () => {
      const existing = JSON.stringify({ someOtherKey: "value" });
      const entry = { command: "node", args: ["test"], env: {} };
      const result = mergeConfig(existing, entry);

      expect(result).toEqual({
        someOtherKey: "value",
        mcpServers: {
          openforge: entry,
        },
      });
    });
  });

  describe("runSetup", () => {
    it("should write config for detected clients", () => {
      // Mock that cursor config dir exists
      vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
        const s = String(p);
        return s.includes(".cursor");
      });

      const results = runSetup({ mode: "full", dryRun: false });

      expect(results.length).toBe(1);
      expect(results[0].action).toBe("written");
      expect(results[0].client.name).toBe("cursor");
      expect(vi.mocked(fs.writeFileSync)).toHaveBeenCalledTimes(1);
    });

    it("should target a specific client", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const results = runSetup({ client: "cursor", mode: "full", dryRun: false });

      expect(results.length).toBe(1);
      expect(results[0].client.name).toBe("cursor");
      // mkdirSync should have been called since dir doesn't exist
      expect(vi.mocked(fs.mkdirSync)).toHaveBeenCalled();
      expect(vi.mocked(fs.writeFileSync)).toHaveBeenCalled();
    });

    it("should not write in dry-run mode", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const results = runSetup({ client: "cursor", mode: "full", dryRun: true });

      expect(results.length).toBe(1);
      expect(results[0].action).toBe("dry-run");
      expect(vi.mocked(fs.writeFileSync)).not.toHaveBeenCalled();
    });

    it("should read and merge existing config", () => {
      const existingConfig = JSON.stringify({
        mcpServers: {
          "other-server": { command: "python", args: ["test.py"] },
        },
      });

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(existingConfig);

      const results = runSetup({ client: "cursor", mode: "essential", dryRun: false });

      expect(results[0].action).toBe("written");
      const writtenContent = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string;
      const parsed = JSON.parse(writtenContent);
      // Existing server preserved
      expect(parsed.mcpServers["other-server"]).toBeDefined();
      // Openforge added
      expect(parsed.mcpServers["openforge"]).toBeDefined();
      expect(parsed.mcpServers["openforge"].args).toContain("--mode");
      expect(parsed.mcpServers["openforge"].args).toContain("essential");
    });

    it("should handle write errors gracefully", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.mkdirSync).mockImplementation(() => {
        throw new Error("Permission denied");
      });

      const results = runSetup({ client: "cursor", mode: "full", dryRun: false });

      expect(results.length).toBe(1);
      expect(results[0].action).toBe("skipped");
      expect(results[0].error).toBe("Permission denied");
    });

    it("should pass port options through to config", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      runSetup({
        client: "cursor",
        mode: "full",
        port: 5555,
        blenderPort: 6666,
        dryRun: false,
      });

      const writtenContent = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string;
      const parsed = JSON.parse(writtenContent);
      expect(parsed.mcpServers["openforge"].env.OPENFORGE_UNITY_PORT).toBe("5555");
      expect(parsed.mcpServers["openforge"].env.OPENFORGE_BLENDER_PORT).toBe("6666");
    });
  });

  describe("parseSetupArgs", () => {
    it("should return defaults with no args", () => {
      const options = parseSetupArgs(["node", "cli.js", "setup"]);
      expect(options.mode).toBe("full");
      expect(options.dryRun).toBe(false);
      expect(options.client).toBeUndefined();
      expect(options.port).toBeUndefined();
      expect(options.blenderPort).toBeUndefined();
    });

    it("should parse --mode", () => {
      const options = parseSetupArgs(["node", "cli.js", "setup", "--mode", "essential"]);
      expect(options.mode).toBe("essential");
    });

    it("should parse --client", () => {
      const options = parseSetupArgs(["node", "cli.js", "setup", "--client", "cursor"]);
      expect(options.client).toBe("cursor");
    });

    it("should parse --port", () => {
      const options = parseSetupArgs(["node", "cli.js", "setup", "--port", "9999"]);
      expect(options.port).toBe(9999);
    });

    it("should parse --blender-port", () => {
      const options = parseSetupArgs(["node", "cli.js", "setup", "--blender-port", "8888"]);
      expect(options.blenderPort).toBe(8888);
    });

    it("should parse --dry-run", () => {
      const options = parseSetupArgs(["node", "cli.js", "setup", "--dry-run"]);
      expect(options.dryRun).toBe(true);
    });

    it("should parse multiple arguments", () => {
      const options = parseSetupArgs([
        "node",
        "cli.js",
        "setup",
        "--client",
        "claude-desktop",
        "--mode",
        "dynamic",
        "--port",
        "1234",
        "--blender-port",
        "5678",
        "--dry-run",
      ]);
      expect(options.client).toBe("claude-desktop");
      expect(options.mode).toBe("dynamic");
      expect(options.port).toBe(1234);
      expect(options.blenderPort).toBe(5678);
      expect(options.dryRun).toBe(true);
    });
  });
});
