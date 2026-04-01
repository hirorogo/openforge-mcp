import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SafetyGuard } from "../safety.js";
import { VersionControl } from "../version-control.js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCb);

async function git(cwd: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFile("git", args, { cwd });
  return stdout;
}

describe("SafetyGuard", () => {
  let guard: SafetyGuard;

  beforeEach(() => {
    guard = new SafetyGuard();
  });

  describe("level setting/getting", () => {
    it("should default to balanced", () => {
      expect(guard.getLevel()).toBe("balanced");
    });

    it("should set level to cautious", () => {
      guard.setLevel("cautious");
      expect(guard.getLevel()).toBe("cautious");
    });

    it("should set level to fast", () => {
      guard.setLevel("fast");
      expect(guard.getLevel()).toBe("fast");
    });

    it("should set level to balanced", () => {
      guard.setLevel("fast");
      guard.setLevel("balanced");
      expect(guard.getLevel()).toBe("balanced");
    });
  });

  describe("tool classification", () => {
    it("should classify delete tools as destructive", () => {
      expect(guard.classifyTool("delete_gameobject")).toBe("destructive");
    });

    it("should classify destroy tools as destructive", () => {
      expect(guard.classifyTool("destroy_gameobject")).toBe("destructive");
    });

    it("should classify remove tools as destructive", () => {
      expect(guard.classifyTool("remove_component")).toBe("destructive");
    });

    it("should classify overwrite tools as destructive", () => {
      expect(guard.classifyTool("overwrite_file")).toBe("destructive");
    });

    it("should classify clear tools as destructive", () => {
      expect(guard.classifyTool("clear_scene")).toBe("destructive");
    });

    it("should classify reset tools as destructive", () => {
      expect(guard.classifyTool("reset_transform")).toBe("destructive");
    });

    it("should classify build tools as destructive", () => {
      expect(guard.classifyTool("build_project")).toBe("destructive");
    });

    it("should classify export tools as destructive", () => {
      expect(guard.classifyTool("export_mesh")).toBe("destructive");
    });

    it("should classify bake tools as destructive", () => {
      expect(guard.classifyTool("bake_lighting")).toBe("destructive");
    });

    it("should classify get tools as safe", () => {
      expect(guard.classifyTool("get_hierarchy")).toBe("safe");
    });

    it("should classify list tools as safe", () => {
      expect(guard.classifyTool("list_objects")).toBe("safe");
    });

    it("should classify find tools as safe", () => {
      expect(guard.classifyTool("find_gameobject")).toBe("safe");
    });

    it("should classify info tools as safe", () => {
      expect(guard.classifyTool("object_info")).toBe("safe");
    });

    it("should classify status tools as safe", () => {
      expect(guard.classifyTool("project_status")).toBe("safe");
    });

    it("should classify screenshot tools as safe", () => {
      expect(guard.classifyTool("take_screenshot")).toBe("safe");
    });

    it("should classify unknown tools as unknown", () => {
      expect(guard.classifyTool("create_gameobject")).toBe("unknown");
    });

    it("should classify mixed-keyword tools correctly (destructive wins)", () => {
      // "delete" comes before "get" in keyword checks
      expect(guard.classifyTool("delete_and_get")).toBe("destructive");
    });
  });

  describe("checkOperation at each level", () => {
    describe("cautious mode", () => {
      beforeEach(() => {
        guard.setLevel("cautious");
      });

      it("should require confirmation for destructive tools", () => {
        const result = guard.checkOperation("delete_gameobject");
        expect(result.allowed).toBe(true);
        expect(result.requiresConfirmation).toBe(true);
      });

      it("should not require confirmation for safe tools", () => {
        const result = guard.checkOperation("get_hierarchy");
        expect(result.allowed).toBe(true);
        expect(result.requiresConfirmation).toBe(false);
      });

      it("should require confirmation for unknown tools", () => {
        const result = guard.checkOperation("create_gameobject");
        expect(result.allowed).toBe(true);
        expect(result.requiresConfirmation).toBe(true);
      });
    });

    describe("balanced mode", () => {
      beforeEach(() => {
        guard.setLevel("balanced");
      });

      it("should require confirmation for destructive tools", () => {
        const result = guard.checkOperation("delete_gameobject");
        expect(result.allowed).toBe(true);
        expect(result.requiresConfirmation).toBe(true);
      });

      it("should not require confirmation for safe tools", () => {
        const result = guard.checkOperation("get_hierarchy");
        expect(result.allowed).toBe(true);
        expect(result.requiresConfirmation).toBe(false);
      });

      it("should not require confirmation for unknown tools", () => {
        const result = guard.checkOperation("create_gameobject");
        expect(result.allowed).toBe(true);
        expect(result.requiresConfirmation).toBe(false);
      });
    });

    describe("fast mode", () => {
      beforeEach(() => {
        guard.setLevel("fast");
      });

      it("should not require confirmation for destructive tools", () => {
        const result = guard.checkOperation("delete_gameobject");
        expect(result.allowed).toBe(true);
        expect(result.requiresConfirmation).toBe(false);
      });

      it("should not require confirmation for safe tools", () => {
        const result = guard.checkOperation("get_hierarchy");
        expect(result.allowed).toBe(true);
        expect(result.requiresConfirmation).toBe(false);
      });

      it("should not require confirmation for unknown tools", () => {
        const result = guard.checkOperation("create_gameobject");
        expect(result.allowed).toBe(true);
        expect(result.requiresConfirmation).toBe(false);
      });
    });
  });

  describe("getDestructiveTools", () => {
    it("should return the list of destructive keywords", () => {
      const keywords = guard.getDestructiveTools();
      expect(keywords).toContain("delete");
      expect(keywords).toContain("destroy");
      expect(keywords).toContain("remove");
      expect(keywords).toContain("build");
      expect(keywords).toContain("bake");
      expect(keywords.length).toBeGreaterThan(0);
    });
  });

  describe("pre-snapshot", () => {
    let tempDir: string;
    let vc: VersionControl;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), "safety-test-"));
      vc = new VersionControl(tempDir);
      await vc.init();
      await git(tempDir, "config", "user.email", "test@test.com");
      await git(tempDir, "config", "user.name", "Test User");
      await git(tempDir, "add", "-A");
      await git(tempDir, "commit", "-m", "init");
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it("should create a pre-snapshot when version control is available", async () => {
      guard.setVersionControl(vc);
      await writeFile(join(tempDir, "test.txt"), "data", "utf-8");

      const snapshotId = await guard.createPreSnapshot("delete_gameobject");
      expect(snapshotId).toBeDefined();
      expect(typeof snapshotId).toBe("string");

      const saves = await vc.listSaves(1);
      expect(saves[0].message).toContain("Pre-snapshot before delete_gameobject");
    });

    it("should return null when no version control is set", async () => {
      const snapshotId = await guard.createPreSnapshot("delete_gameobject");
      expect(snapshotId).toBeNull();
    });

    it("should return null when there are no changes to save", async () => {
      guard.setVersionControl(vc);
      const snapshotId = await guard.createPreSnapshot("delete_gameobject");
      expect(snapshotId).toBeNull();
    });
  });
});
