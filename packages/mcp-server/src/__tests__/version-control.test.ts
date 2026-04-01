import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { VersionControl } from "../version-control.js";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCb);

async function git(cwd: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFile("git", args, { cwd });
  return stdout;
}

describe("VersionControl", () => {
  let tempDir: string;
  let vc: VersionControl;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "vc-test-"));
    vc = new VersionControl(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("init", () => {
    it("should initialize a new git repository", async () => {
      const result = await vc.init();
      expect(result.initialized).toBe(true);

      // Verify .git directory exists
      const out = await git(tempDir, "rev-parse", "--is-inside-work-tree");
      expect(out.trim()).toBe("true");
    });

    it("should not re-initialize an existing repo", async () => {
      await vc.init();
      const result = await vc.init();
      expect(result.initialized).toBe(false);
    });

    it("should create a .gitignore with Unity and Blender patterns", async () => {
      await vc.init();
      const content = await readFile(join(tempDir, ".gitignore"), "utf-8");

      expect(content).toContain("[Ll]ibrary/");
      expect(content).toContain("[Tt]emp/");
      expect(content).toContain("[Oo]bj/");
      expect(content).toContain("*.blend1");
      expect(content).toContain("__pycache__/");
    });

    it("should not overwrite an existing .gitignore", async () => {
      await writeFile(join(tempDir, ".gitignore"), "custom-ignore\n", "utf-8");
      await vc.init();
      const content = await readFile(join(tempDir, ".gitignore"), "utf-8");
      expect(content).toBe("custom-ignore\n");
    });
  });

  describe("save and listSaves", () => {
    beforeEach(async () => {
      await vc.init();
      // Configure git user for commits
      await git(tempDir, "config", "user.email", "test@test.com");
      await git(tempDir, "config", "user.name", "Test User");
      // Commit init-generated files so they do not affect test counts
      await git(tempDir, "add", "-A");
      await git(tempDir, "commit", "-m", "init");
    });

    it("should save changes with a custom message", async () => {
      await writeFile(join(tempDir, "test.txt"), "hello", "utf-8");

      const save = await vc.save("Initial save");
      expect(save.id).toBeDefined();
      expect(save.message).toBe("Initial save");
      expect(save.date).toBeDefined();
    });

    it("should auto-generate a commit message when none is provided", async () => {
      await writeFile(join(tempDir, "auto.txt"), "content", "utf-8");

      const save = await vc.save();
      expect(save.message).toMatch(/^Auto-save/);
    });

    it("should throw when there are no changes to save", async () => {
      await writeFile(join(tempDir, "first.txt"), "data", "utf-8");
      await vc.save("first");

      await expect(vc.save("empty")).rejects.toThrow("No changes to save");
    });

    it("should list saves with correct info", async () => {
      await writeFile(join(tempDir, "a.txt"), "a", "utf-8");
      await vc.save("Save A");

      await writeFile(join(tempDir, "b.txt"), "b", "utf-8");
      await vc.save("Save B");

      const saves = await vc.listSaves();
      // 3 saves: init (from beforeEach), Save A, Save B
      expect(saves.length).toBe(3);
      expect(saves[0].message).toBe("Save B");
      expect(saves[1].message).toBe("Save A");
      expect(saves[2].message).toBe("init");
    });

    it("should respect the limit parameter", async () => {
      await writeFile(join(tempDir, "a.txt"), "a", "utf-8");
      await vc.save("Save A");

      await writeFile(join(tempDir, "b.txt"), "b", "utf-8");
      await vc.save("Save B");

      await writeFile(join(tempDir, "c.txt"), "c", "utf-8");
      await vc.save("Save C");

      const saves = await vc.listSaves(2);
      expect(saves.length).toBe(2);
      expect(saves[0].message).toBe("Save C");
      expect(saves[1].message).toBe("Save B");
    });

    it("should return an empty list when there are no commits", async () => {
      // Use a fresh directory without the init commit
      const freshDir = await mkdtemp(join(tmpdir(), "vc-empty-"));
      const freshVc = new VersionControl(freshDir);
      await freshVc.init();
      const saves = await freshVc.listSaves();
      expect(saves).toEqual([]);
      await rm(freshDir, { recursive: true, force: true });
    });
  });

  describe("restore", () => {
    beforeEach(async () => {
      await vc.init();
      await git(tempDir, "config", "user.email", "test@test.com");
      await git(tempDir, "config", "user.name", "Test User");
    });

    it("should revert a commit and create a new revert commit", async () => {
      await writeFile(join(tempDir, "file.txt"), "original", "utf-8");
      await vc.save("Original");

      await writeFile(join(tempDir, "file.txt"), "modified", "utf-8");
      const modifiedSave = await vc.save("Modified");

      const result = await vc.restore(modifiedSave.id);
      expect(result.reverted).toBe(true);
      expect(result.newCommitId).toBeDefined();

      // File should be back to original content
      const content = await readFile(join(tempDir, "file.txt"), "utf-8");
      expect(content).toBe("original");
    });

    it("should throw for an invalid save ID", async () => {
      await writeFile(join(tempDir, "file.txt"), "data", "utf-8");
      await vc.save("initial");

      await expect(vc.restore("nonexistent123")).rejects.toThrow("not found");
    });
  });

  describe("branch operations", () => {
    beforeEach(async () => {
      await vc.init();
      await git(tempDir, "config", "user.email", "test@test.com");
      await git(tempDir, "config", "user.name", "Test User");
      // Need at least one commit for branches
      await writeFile(join(tempDir, "init.txt"), "init", "utf-8");
      await vc.save("Initial commit");
    });

    it("should create a new branch and switch to it", async () => {
      const result = await vc.createBranch("experiment");
      expect(result.created).toBe(true);
      expect(result.branch).toBe("experiment");

      const status = await vc.getStatus();
      expect(status.branch).toBe("experiment");
    });

    it("should merge a branch", async () => {
      // Create a branch, add a file, switch back, merge
      await vc.createBranch("feature");
      await writeFile(join(tempDir, "feature.txt"), "feature content", "utf-8");
      await vc.save("Feature work");

      // Switch back to original branch
      await git(tempDir, "checkout", "master").catch(() =>
        git(tempDir, "checkout", "main"),
      );

      const result = await vc.mergeBranch("feature");
      expect(result.merged).toBe(true);

      // The feature file should now exist on the main branch
      const content = await readFile(join(tempDir, "feature.txt"), "utf-8");
      expect(content).toBe("feature content");
    });

    it("should delete a branch", async () => {
      await vc.createBranch("to-delete");
      // Switch back so we can delete
      await git(tempDir, "checkout", "master").catch(() =>
        git(tempDir, "checkout", "main"),
      );

      const result = await vc.deleteBranch("to-delete");
      expect(result.deleted).toBe(true);
    });

    it("should not allow deleting the current branch", async () => {
      await vc.createBranch("current");
      await expect(vc.deleteBranch("current")).rejects.toThrow("currently checked out");
    });
  });

  describe("getStatus", () => {
    beforeEach(async () => {
      await vc.init();
      await git(tempDir, "config", "user.email", "test@test.com");
      await git(tempDir, "config", "user.name", "Test User");
    });

    it("should report dirty state when there are uncommitted changes", async () => {
      await writeFile(join(tempDir, "file.txt"), "data", "utf-8");
      await vc.save("commit");

      await writeFile(join(tempDir, "file.txt"), "modified", "utf-8");
      const status = await vc.getStatus();

      expect(status.dirty).toBe(true);
    });

    it("should report clean state after a save", async () => {
      await writeFile(join(tempDir, "file.txt"), "data", "utf-8");
      await vc.save("commit");

      const status = await vc.getStatus();
      expect(status.dirty).toBe(false);
      expect(status.lastSave).toBeDefined();
      expect(status.lastSave?.message).toBe("commit");
    });

    it("should return the current branch name", async () => {
      await writeFile(join(tempDir, "file.txt"), "data", "utf-8");
      await vc.save("commit");

      const status = await vc.getStatus();
      // Default branch name varies (master or main)
      expect(typeof status.branch).toBe("string");
      expect(status.branch.length).toBeGreaterThan(0);
    });
  });
});
