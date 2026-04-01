import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TransactionManager } from "../transaction.js";
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

describe("TransactionManager", () => {
  describe("basic lifecycle", () => {
    let tm: TransactionManager;

    beforeEach(() => {
      tm = new TransactionManager();
    });

    it("should begin a transaction", () => {
      const info = tm.begin("Test Transaction");
      expect(info.label).toBe("Test Transaction");
      expect(info.operations).toEqual([]);
      expect(info.startedAt).toBeGreaterThan(0);
    });

    it("should report active state correctly", () => {
      expect(tm.isActive()).toBe(false);
      tm.begin("test");
      expect(tm.isActive()).toBe(true);
    });

    it("should commit a transaction", async () => {
      tm.begin("test");
      tm.addOperation("create", "Created object A");
      tm.addOperation("modify", "Changed color of A");

      const result = await tm.commit();
      expect(result.label).toBe("test");
      expect(result.operationCount).toBe(2);
      expect(result.saved).toBe(false);
      expect(tm.isActive()).toBe(false);
    });

    it("should rollback a transaction", () => {
      tm.begin("test");
      tm.addOperation("create", "Created object A");
      tm.addOperation("delete", "Deleted object B");

      const result = tm.rollback();
      expect(result.label).toBe("test");
      expect(result.operationsRolledBack).toBe(2);
      expect(result.operations).toHaveLength(2);
      expect(tm.isActive()).toBe(false);
    });
  });

  describe("nested transaction prevention", () => {
    let tm: TransactionManager;

    beforeEach(() => {
      tm = new TransactionManager();
    });

    it("should throw when beginning a transaction while one is active", () => {
      tm.begin("first");
      expect(() => tm.begin("second")).toThrow("already in progress");
    });

    it("should allow a new transaction after commit", async () => {
      tm.begin("first");
      await tm.commit();
      const info = tm.begin("second");
      expect(info.label).toBe("second");
    });

    it("should allow a new transaction after rollback", () => {
      tm.begin("first");
      tm.rollback();
      const info = tm.begin("second");
      expect(info.label).toBe("second");
    });
  });

  describe("error cases", () => {
    let tm: TransactionManager;

    beforeEach(() => {
      tm = new TransactionManager();
    });

    it("should throw when committing without an active transaction", async () => {
      await expect(tm.commit()).rejects.toThrow("No active transaction");
    });

    it("should throw when rolling back without an active transaction", () => {
      expect(() => tm.rollback()).toThrow("No active transaction");
    });

    it("should throw when adding an operation without an active transaction", () => {
      expect(() => tm.addOperation("test", "test")).toThrow("No active transaction");
    });
  });

  describe("getTransaction", () => {
    let tm: TransactionManager;

    beforeEach(() => {
      tm = new TransactionManager();
    });

    it("should return null when no transaction is active", () => {
      expect(tm.getTransaction()).toBeNull();
    });

    it("should return a copy of the current transaction", () => {
      tm.begin("test");
      tm.addOperation("create", "Created A");
      const info = tm.getTransaction();
      expect(info).not.toBeNull();
      expect(info!.label).toBe("test");
      expect(info!.operations).toHaveLength(1);
    });
  });

  describe("auto-save on commit", () => {
    let tempDir: string;
    let vc: VersionControl;
    let tm: TransactionManager;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), "tx-test-"));
      vc = new VersionControl(tempDir);
      await vc.init();
      await git(tempDir, "config", "user.email", "test@test.com");
      await git(tempDir, "config", "user.name", "Test User");
      // Commit the init-generated files so they do not interfere with tests
      await git(tempDir, "add", "-A");
      await git(tempDir, "commit", "-m", "init");

      tm = new TransactionManager({
        autoSave: true,
        versionControl: vc,
      });
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it("should auto-save when committing with autoSave enabled", async () => {
      // Create a file so there is something to commit
      await writeFile(join(tempDir, "work.txt"), "transaction work", "utf-8");

      tm.begin("auto-save test");
      tm.addOperation("create", "Created work.txt");

      const result = await tm.commit();
      expect(result.saved).toBe(true);
      expect(result.saveId).toBeDefined();

      // Verify the commit exists
      const saves = await vc.listSaves(1);
      expect(saves.length).toBe(1);
      expect(saves[0].message).toContain("Transaction: auto-save test");
    });

    it("should not fail when auto-save has nothing to commit", async () => {
      // No file changes, so auto-save will have nothing to commit
      tm.begin("empty transaction");

      const result = await tm.commit();
      expect(result.saved).toBe(false);
      expect(result.saveId).toBeUndefined();
    });

    it("should not auto-save when autoSave is disabled", async () => {
      tm.setAutoSave(false);
      await writeFile(join(tempDir, "work.txt"), "data", "utf-8");

      tm.begin("no-save");
      const result = await tm.commit();
      expect(result.saved).toBe(false);
    });
  });
});
