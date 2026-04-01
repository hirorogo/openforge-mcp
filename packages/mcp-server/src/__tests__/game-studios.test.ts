import { describe, it, expect, beforeEach } from "vitest";
import { GameStudiosBridge } from "../game-studios.js";
import type { EngineType } from "../game-studios.js";

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
});
