import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GameStudiosBridge, autoMapCategories } from "../game-studios.js";
import type { EngineType } from "../game-studios.js";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

describe("GameStudiosBridge", () => {
  let bridge: GameStudiosBridge;

  beforeEach(() => {
    bridge = new GameStudiosBridge();
  });

  // -----------------------------------------------------------------------
  // getAgentToolMapping
  // -----------------------------------------------------------------------

  describe("getAgentToolMapping", () => {
    it("should return a non-empty array of agent mappings", () => {
      const mappings = bridge.getAgentToolMapping();
      expect(mappings.length).toBeGreaterThan(0);
    });

    it("should include all required agent roles from Game Studios", () => {
      const mappings = bridge.getAgentToolMapping();
      const roles = mappings.map((m) => m.agent);

      const requiredRoles = [
        "creative-director",
        "technical-director",
        "producer",
        "game-designer",
        "lead-programmer",
        "art-director",
        "audio-director",
        "narrative-director",
        "qa-lead",
        "level-designer",
        "gameplay-programmer",
        "ui-programmer",
        "ai-programmer",
        "sound-designer",
        "qa-tester",
        "tools-programmer",
      ];

      for (const role of requiredRoles) {
        expect(roles).toContain(role);
      }
    });

    it("should give lead-programmer access to all categories", () => {
      const mappings = bridge.getAgentToolMapping();
      const lead = mappings.find((m) => m.agent === "lead-programmer");
      expect(lead).toBeDefined();
      expect(lead!.categories.length).toBeGreaterThan(30);
    });

    it("should restrict ui-programmer to UI-related categories", () => {
      const mappings = bridge.getAgentToolMapping();
      const ui = mappings.find((m) => m.agent === "ui-programmer");
      expect(ui).toBeDefined();
      expect(ui!.categories).toContain("unity:ui");
      expect(ui!.categories).not.toContain("unity:terrain");
      expect(ui!.categories).not.toContain("unity:navmesh");
    });

    it("should give sound-designer only audio categories", () => {
      const mappings = bridge.getAgentToolMapping();
      const sound = mappings.find((m) => m.agent === "sound-designer");
      expect(sound).toBeDefined();
      expect(sound!.categories).toContain("unity:audio");
      expect(sound!.categories).toHaveLength(1);
    });

    it("should give ai-programmer navmesh and ml-agents categories", () => {
      const mappings = bridge.getAgentToolMapping();
      const ai = mappings.find((m) => m.agent === "ai-programmer");
      expect(ai).toBeDefined();
      expect(ai!.categories).toContain("unity:navmesh");
      expect(ai!.categories).toContain("unity:ml-agents");
    });

    it("should give qa-tester playtest and screenshot categories", () => {
      const mappings = bridge.getAgentToolMapping();
      const qa = mappings.find((m) => m.agent === "qa-tester");
      expect(qa).toBeDefined();
      expect(qa!.categories).toContain("unity:playtest");
      expect(qa!.categories).toContain("unity:camera");
      expect(qa!.categories).toContain("unity:optimization");
    });

    it("should have a description for every mapping", () => {
      const mappings = bridge.getAgentToolMapping();
      for (const m of mappings) {
        expect(m.description).toBeTruthy();
      }
    });
  });

  // -----------------------------------------------------------------------
  // generateStudioConfig
  // -----------------------------------------------------------------------

  describe("generateStudioConfig", () => {
    it("should produce a valid config for unity engine type", () => {
      const config = bridge.generateStudioConfig("unity");
      expect(config.mcpServers["openforge-mcp"]).toBeDefined();
      expect(config.mcpServers["openforge-mcp"].command).toBe("npx");
      expect(config.permissions).toBeDefined();
      expect(Object.keys(config.permissions).length).toBeGreaterThan(0);
    });

    it("should include lead-programmer permissions in every engine config", () => {
      const engines: EngineType[] = ["unity", "blender", "godot"];
      for (const engine of engines) {
        const config = bridge.generateStudioConfig(engine);
        expect(config.permissions["lead-programmer"]).toBeDefined();
        expect(config.permissions["lead-programmer"].length).toBeGreaterThan(0);
      }
    });

    it("should filter blender-only agents when engine is blender", () => {
      const config = bridge.generateStudioConfig("blender");
      // sound-designer only has unity:audio, so should be excluded from blender config
      expect(config.permissions["sound-designer"]).toBeUndefined();
    });

    it("should include blender categories for unity engine type", () => {
      const config = bridge.generateStudioConfig("unity");
      const techArtist = config.permissions["technical-artist"];
      expect(techArtist).toBeDefined();
      const hasBlender = techArtist.some((c: string) => c.startsWith("blender:"));
      expect(hasBlender).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // generateAgentPermissions
  // -----------------------------------------------------------------------

  describe("generateAgentPermissions", () => {
    it("should return permissions for a known agent role", () => {
      const perms = bridge.generateAgentPermissions("level-designer");
      expect(perms).not.toBeNull();
      expect(perms!.agent).toBe("level-designer");
      expect(perms!.allowedTools).toContain("unity:scene");
      expect(perms!.allowedTools).toContain("unity:terrain");
      expect(perms!.allowedTools).toContain("unity:gameobject");
      expect(perms!.allowedTools).toContain("unity:lighting");
      expect(perms!.allowedTools).toContain("unity:navmesh");
    });

    it("should return null for an unknown agent role", () => {
      const perms = bridge.generateAgentPermissions("nonexistent-agent");
      expect(perms).toBeNull();
    });

    it("should return a fresh array (not a reference to internal state)", () => {
      const perms1 = bridge.generateAgentPermissions("art-director");
      const perms2 = bridge.generateAgentPermissions("art-director");
      expect(perms1).not.toBe(perms2);
      expect(perms1!.allowedTools).not.toBe(perms2!.allowedTools);
    });
  });

  // -----------------------------------------------------------------------
  // getWorkflowIntegration
  // -----------------------------------------------------------------------

  describe("getWorkflowIntegration", () => {
    it("should return all built-in workflows", () => {
      const workflows = bridge.getWorkflowIntegration();
      expect(Object.keys(workflows)).toContain("create_level");
      expect(Object.keys(workflows)).toContain("performance_audit");
      expect(Object.keys(workflows)).toContain("art_pass");
      expect(Object.keys(workflows)).toContain("qa_pass");
    });

    it("should have valid steps with agent, tools, and prompt", () => {
      const workflows = bridge.getWorkflowIntegration();
      for (const [, wf] of Object.entries(workflows)) {
        expect(wf.name).toBeTruthy();
        expect(wf.description).toBeTruthy();
        expect(wf.agents.length).toBeGreaterThan(0);
        expect(wf.steps.length).toBeGreaterThan(0);
        for (const step of wf.steps) {
          expect(step.agent).toBeTruthy();
          expect(step.tools.length).toBeGreaterThan(0);
          expect(step.prompt).toBeTruthy();
        }
      }
    });

    it("create_level workflow should use level-designer, art-director, technical-artist", () => {
      const workflows = bridge.getWorkflowIntegration();
      const wf = workflows["create_level"];
      expect(wf.agents).toContain("level-designer");
      expect(wf.agents).toContain("art-director");
      expect(wf.agents).toContain("technical-artist");
    });
  });

  // -----------------------------------------------------------------------
  // getWorkflow
  // -----------------------------------------------------------------------

  describe("getWorkflow", () => {
    it("should return a workflow by key", () => {
      const wf = bridge.getWorkflow("create_level");
      expect(wf).not.toBeNull();
      expect(wf!.name).toBe("Create Level");
    });

    it("should return null for unknown workflow", () => {
      const wf = bridge.getWorkflow("nonexistent");
      expect(wf).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getAgentRoles
  // -----------------------------------------------------------------------

  describe("getAgentRoles", () => {
    it("should return an array of agent role strings", () => {
      const roles = bridge.getAgentRoles();
      expect(roles.length).toBeGreaterThan(10);
      expect(roles).toContain("lead-programmer");
      expect(roles).toContain("art-director");
    });
  });

  // -----------------------------------------------------------------------
  // getAgentEngines
  // -----------------------------------------------------------------------

  describe("getAgentEngines", () => {
    it("should return relevant engines for a given agent", () => {
      const engines = bridge.getAgentEngines("level-designer");
      expect(engines).toContain("unity");
      expect(engines).toContain("godot");
    });

    it("should return empty array for unknown agent", () => {
      const engines = bridge.getAgentEngines("nonexistent");
      expect(engines).toHaveLength(0);
    });

    it("should return only blender for 3d-modeler", () => {
      const engines = bridge.getAgentEngines("3d-modeler");
      expect(engines).toContain("blender");
      expect(engines).not.toContain("unity");
    });
  });

  // -----------------------------------------------------------------------
  // autoMapCategories (keyword-based mapping)
  // -----------------------------------------------------------------------

  describe("autoMapCategories", () => {
    it("should map art-related keywords to material/lighting/vfx", () => {
      const cats = autoMapCategories("This agent handles visual design and shader creation");
      expect(cats).toContain("unity:material");
      expect(cats).toContain("unity:lighting");
      expect(cats).toContain("unity:vfx");
    });

    it("should map code/script keywords to programming categories", () => {
      const cats = autoMapCategories("Responsible for scripting gameplay logic");
      expect(cats).toContain("unity:script");
      expect(cats).toContain("unity:physics");
    });

    it("should map level/scene keywords to scene categories", () => {
      const cats = autoMapCategories("Builds levels and terrain layouts");
      expect(cats).toContain("unity:scene");
      expect(cats).toContain("unity:gameobject");
      expect(cats).toContain("unity:terrain");
    });

    it("should map audio keywords to audio category", () => {
      const cats = autoMapCategories("Designs sound effects and music");
      expect(cats).toContain("unity:audio");
    });

    it("should map test/qa keywords to playtest categories", () => {
      const cats = autoMapCategories("QA testing and bug tracking");
      expect(cats).toContain("unity:playtest");
      expect(cats).toContain("unity:optimization");
      expect(cats).toContain("unity:camera");
    });

    it("should map UI keywords to ui category", () => {
      const cats = autoMapCategories("Creates user interface and menu systems");
      expect(cats).toContain("unity:ui");
    });

    it("should map AI/behavior keywords to navmesh and ml-agents", () => {
      const cats = autoMapCategories("AI behavior trees and NPC pathfinding");
      expect(cats).toContain("unity:navmesh");
      expect(cats).toContain("unity:ml-agents");
    });

    it("should map animation keywords to animation categories", () => {
      const cats = autoMapCategories("Character animation and rigging");
      expect(cats).toContain("unity:animation");
      expect(cats).toContain("blender:animation_advanced");
      expect(cats).toContain("blender:armature_advanced");
    });

    it("should map 3D modeling keywords to mesh categories", () => {
      const cats = autoMapCategories("3D mesh modeling and sculpting");
      expect(cats).toContain("blender:object");
      expect(cats).toContain("blender:mesh");
      expect(cats).toContain("blender:mesh_advanced");
    });

    it("should map build/deploy keywords to build categories", () => {
      const cats = autoMapCategories("Handles build pipelines and deployment");
      expect(cats).toContain("unity:build");
      expect(cats).toContain("unity:optimization");
    });

    it("should map camera keywords to camera category", () => {
      const cats = autoMapCategories("Cinematic camera work");
      expect(cats).toContain("unity:camera");
    });

    it("should map physics keywords to physics category", () => {
      const cats = autoMapCategories("Rigid body collision handling");
      expect(cats).toContain("unity:physics");
    });

    it("should fall back to default categories when no keywords match", () => {
      const cats = autoMapCategories("Some completely unrelated text about cooking and baking");
      expect(cats).toContain("unity:scene");
      expect(cats).toContain("unity:gameobject");
      expect(cats).toContain("unity:material");
      expect(cats).toContain("unity:script");
      expect(cats).toHaveLength(4);
    });

    it("should combine categories from multiple keyword matches", () => {
      const cats = autoMapCategories("Handles audio design and UI interface layout");
      expect(cats).toContain("unity:audio");
      expect(cats).toContain("unity:ui");
    });
  });

  // -----------------------------------------------------------------------
  // syncFromRepo (local file scanning)
  // -----------------------------------------------------------------------

  describe("syncFromRepo", () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-test-"));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("should discover agent files from .claude/agents/", async () => {
      const agentsDir = path.join(tmpDir, ".claude", "agents");
      fs.mkdirSync(agentsDir, { recursive: true });
      fs.writeFileSync(
        path.join(agentsDir, "lighting-artist.md"),
        "# Lighting Artist\n\nHandles lighting and visual atmosphere in scenes.\n",
      );
      fs.writeFileSync(
        path.join(agentsDir, "network-programmer.md"),
        "# Network Programmer\n\nImplements multiplayer code and scripting.\n",
      );

      const result = await bridge.syncFromRepo(tmpDir);
      expect(result.source).toBe("local");
      expect(result.agentsDiscovered).toBe(2);
      expect(result.agentNames).toContain("lighting-artist");
      expect(result.agentNames).toContain("network-programmer");
    });

    it("should auto-map discovered agents by keywords", async () => {
      const agentsDir = path.join(tmpDir, ".claude", "agents");
      fs.mkdirSync(agentsDir, { recursive: true });
      fs.writeFileSync(
        path.join(agentsDir, "physics-expert.md"),
        "# Physics Expert\n\nHandles rigid body physics and collision detection.\n",
      );

      await bridge.syncFromRepo(tmpDir);
      const perms = bridge.generateAgentPermissions("physics-expert");
      expect(perms).not.toBeNull();
      expect(perms!.allowedTools).toContain("unity:physics");
    });

    it("should return 0 agents when directory does not exist", async () => {
      const result = await bridge.syncFromRepo("/nonexistent/path");
      expect(result.agentsDiscovered).toBe(0);
      expect(result.agentNames).toHaveLength(0);
    });

    it("should not replace static agents with dynamic ones of the same name", async () => {
      const agentsDir = path.join(tmpDir, ".claude", "agents");
      fs.mkdirSync(agentsDir, { recursive: true });
      // Create a file with the same name as a static agent
      fs.writeFileSync(
        path.join(agentsDir, "lead-programmer.md"),
        "# Lead Programmer\n\nDoes audio stuff only.\n",
      );

      await bridge.syncFromRepo(tmpDir);
      const perms = bridge.generateAgentPermissions("lead-programmer");
      expect(perms).not.toBeNull();
      // Static lead-programmer has access to all categories (>30), not just audio
      expect(perms!.allowedTools.length).toBeGreaterThan(30);
    });

    it("should add dynamic agents alongside static ones", async () => {
      const agentsDir = path.join(tmpDir, ".claude", "agents");
      fs.mkdirSync(agentsDir, { recursive: true });
      fs.writeFileSync(
        path.join(agentsDir, "custom-agent.md"),
        "# Custom Agent\n\nDoes custom audio and sound work.\n",
      );

      const rolesBefore = bridge.getAgentRoles();
      await bridge.syncFromRepo(tmpDir);
      const rolesAfter = bridge.getAgentRoles();

      expect(rolesAfter.length).toBe(rolesBefore.length + 1);
      expect(rolesAfter).toContain("custom-agent");
    });

    it("should set isSynced to true after successful sync with agents", async () => {
      expect(bridge.isSynced()).toBe(false);

      const agentsDir = path.join(tmpDir, ".claude", "agents");
      fs.mkdirSync(agentsDir, { recursive: true });
      fs.writeFileSync(
        path.join(agentsDir, "some-agent.md"),
        "# Some Agent\n\nHandles scripting.\n",
      );

      await bridge.syncFromRepo(tmpDir);
      expect(bridge.isSynced()).toBe(true);
      expect(bridge.getLastSyncTime()).not.toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // syncFromGitHub (mock fetch)
  // -----------------------------------------------------------------------

  describe("syncFromGitHub", () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it("should discover agents from GitHub API", async () => {
      const dirListingResponse = [
        { name: "cinematic-director.md", download_url: "https://raw.example.com/cinematic-director.md" },
        { name: "readme.txt", download_url: "https://raw.example.com/readme.txt" },
      ];

      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("api.github.com")) {
          return new Response(JSON.stringify(dirListingResponse), { status: 200 });
        }
        if (urlStr.includes("cinematic-director.md")) {
          return new Response("# Cinematic Director\n\nCamera and cinematic work.\n", { status: 200 });
        }
        return new Response("", { status: 404 });
      }) as typeof fetch;

      const result = await bridge.syncFromGitHub();
      expect(result.source).toBe("github");
      expect(result.agentsDiscovered).toBe(1);
      expect(result.agentNames).toContain("cinematic-director");

      const perms = bridge.generateAgentPermissions("cinematic-director");
      expect(perms).not.toBeNull();
      expect(perms!.allowedTools).toContain("unity:camera");
    });

    it("should handle rate limiting (403/429) gracefully", async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response("rate limited", { status: 429 });
      }) as typeof fetch;

      const result = await bridge.syncFromGitHub();
      expect(result.source).toBe("github");
      // Should not throw, just return what we have
      expect(result.agentsDiscovered).toBe(0);
    });

    it("should handle network errors gracefully", async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error("Network error");
      }) as typeof fetch;

      const result = await bridge.syncFromGitHub();
      expect(result.source).toBe("github");
      expect(result.agentsDiscovered).toBe(0);
    });

    it("should use cache within the TTL window", async () => {
      const fetchMock = vi.fn(async (url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("api.github.com")) {
          return new Response(JSON.stringify([
            { name: "test-agent.md", download_url: "https://raw.example.com/test-agent.md" },
          ]), { status: 200 });
        }
        return new Response("# Test Agent\n\nHandles scripting code.\n", { status: 200 });
      }) as typeof fetch;

      globalThis.fetch = fetchMock;

      // First call should fetch
      await bridge.syncFromGitHub();
      const callCount1 = (fetchMock as unknown as { mock: { calls: unknown[] } }).mock.calls.length;

      // Second call should use cache
      await bridge.syncFromGitHub();
      const callCount2 = (fetchMock as unknown as { mock: { calls: unknown[] } }).mock.calls.length;

      expect(callCount2).toBe(callCount1); // No additional fetch calls
    });
  });

  // -----------------------------------------------------------------------
  // Fallback behavior
  // -----------------------------------------------------------------------

  describe("fallback to static", () => {
    it("should still have all static agents when sync fails", async () => {
      const rolesBefore = bridge.getAgentRoles();
      await bridge.syncFromRepo("/does/not/exist");
      const rolesAfter = bridge.getAgentRoles();

      expect(rolesAfter).toEqual(rolesBefore);
    });

    it("should report isSynced false when sync found no agents", async () => {
      await bridge.syncFromRepo("/does/not/exist");
      expect(bridge.isSynced()).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // _parseAgentFile
  // -----------------------------------------------------------------------

  describe("_parseAgentFile", () => {
    it("should extract agent name from filename", () => {
      const result = bridge._parseAgentFile("my-agent.md", "# My Agent\n\nDoes stuff.\n");
      expect(result).not.toBeNull();
      expect(result!.agent).toBe("my-agent");
    });

    it("should extract description from first heading", () => {
      const result = bridge._parseAgentFile("test.md", "# Great Agent\n\nBody text.\n");
      expect(result!.description).toBe("Great Agent");
    });

    it("should fall back to first non-empty line for description", () => {
      const result = bridge._parseAgentFile("test.md", "This is a plain description.\n\nMore text.\n");
      expect(result!.description).toBe("This is a plain description.");
    });

    it("should use filename as description if content is empty", () => {
      const result = bridge._parseAgentFile("empty-agent.md", "");
      expect(result!.description).toBe("empty-agent");
    });

    it("should return null for empty filename", () => {
      const result = bridge._parseAgentFile(".md", "some content");
      expect(result).toBeNull();
    });
  });
});
