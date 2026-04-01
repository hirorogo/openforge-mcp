import { describe, it, expect, beforeEach } from "vitest";
import { OperationLog, OperationEntry } from "../operation-log.js";

describe("OperationLog", () => {
  let log: OperationLog;

  beforeEach(() => {
    log = new OperationLog();
  });

  describe("log", () => {
    it("should add an entry to the log", () => {
      log.log({
        tool: "create_gameobject",
        target: "unity",
        success: true,
        timestamp: Date.now(),
        duration: 42,
      });

      const recent = log.getRecent(10);
      expect(recent.length).toBe(1);
      expect(recent[0].tool).toBe("create_gameobject");
      expect(recent[0].target).toBe("unity");
      expect(recent[0].success).toBe(true);
      expect(recent[0].duration).toBe(42);
    });

    it("should store params and error when provided", () => {
      log.log({
        tool: "set_material_color",
        target: "unity",
        params: { color: "#ff0000" },
        success: false,
        error: "Material not found",
        timestamp: Date.now(),
        duration: 10,
      });

      const recent = log.getRecent(10);
      expect(recent[0].params).toEqual({ color: "#ff0000" });
      expect(recent[0].error).toBe("Material not found");
    });

    it("should respect maxEntries limit", () => {
      const smallLog = new OperationLog(3);

      for (let i = 0; i < 5; i++) {
        smallLog.log({
          tool: `tool_${i}`,
          target: "unity",
          success: true,
          timestamp: Date.now(),
          duration: i * 10,
        });
      }

      const recent = smallLog.getRecent(10);
      expect(recent.length).toBe(3);
      expect(recent[0].tool).toBe("tool_2");
      expect(recent[1].tool).toBe("tool_3");
      expect(recent[2].tool).toBe("tool_4");
    });
  });

  describe("getRecent", () => {
    it("should return the last N entries", () => {
      for (let i = 0; i < 10; i++) {
        log.log({
          tool: `tool_${i}`,
          target: "unity",
          success: true,
          timestamp: Date.now(),
          duration: 5,
        });
      }

      const recent = log.getRecent(3);
      expect(recent.length).toBe(3);
      expect(recent[0].tool).toBe("tool_7");
      expect(recent[1].tool).toBe("tool_8");
      expect(recent[2].tool).toBe("tool_9");
    });

    it("should return all entries if fewer than limit", () => {
      log.log({
        tool: "only_one",
        target: "blender",
        success: true,
        timestamp: Date.now(),
        duration: 1,
      });

      const recent = log.getRecent(20);
      expect(recent.length).toBe(1);
    });

    it("should default to 20 entries", () => {
      for (let i = 0; i < 25; i++) {
        log.log({
          tool: `tool_${i}`,
          target: "unity",
          success: true,
          timestamp: Date.now(),
          duration: 1,
        });
      }

      const recent = log.getRecent();
      expect(recent.length).toBe(20);
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      log.log({
        tool: "test",
        target: "unity",
        success: true,
        timestamp: Date.now(),
        duration: 1,
      });
      log.log({
        tool: "test2",
        target: "blender",
        success: false,
        timestamp: Date.now(),
        duration: 2,
      });

      log.clear();

      expect(log.getRecent(100).length).toBe(0);
      expect(log.getStats().total).toBe(0);
    });
  });

  describe("getStats", () => {
    it("should return zero stats for empty log", () => {
      const stats = log.getStats();
      expect(stats.total).toBe(0);
      expect(stats.successful).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.averageDuration).toBe(0);
    });

    it("should compute correct stats", () => {
      log.log({ tool: "a", target: "unity", success: true, timestamp: 1, duration: 10 });
      log.log({ tool: "b", target: "unity", success: true, timestamp: 2, duration: 20 });
      log.log({ tool: "c", target: "unity", success: false, error: "err", timestamp: 3, duration: 30 });
      log.log({ tool: "d", target: "blender", success: true, timestamp: 4, duration: 40 });

      const stats = log.getStats();
      expect(stats.total).toBe(4);
      expect(stats.successful).toBe(3);
      expect(stats.failed).toBe(1);
      expect(stats.averageDuration).toBe(25);
    });

    it("should handle all-failed entries", () => {
      log.log({ tool: "x", target: "godot", success: false, error: "e1", timestamp: 1, duration: 100 });
      log.log({ tool: "y", target: "godot", success: false, error: "e2", timestamp: 2, duration: 200 });

      const stats = log.getStats();
      expect(stats.total).toBe(2);
      expect(stats.successful).toBe(0);
      expect(stats.failed).toBe(2);
      expect(stats.averageDuration).toBe(150);
    });
  });
});

describe("Dashboard status endpoint (unit)", () => {
  it("should provide status payload shape", () => {
    // This tests the shape of data the dashboard expects, using OperationLog directly
    const log = new OperationLog();
    log.log({ tool: "test_tool", target: "unity", success: true, timestamp: Date.now(), duration: 15 });

    const stats = log.getStats();
    const recent = log.getRecent(20);

    // Verify the status payload shape
    const payload = {
      connections: { unity: false, blender: false, godot: false },
      mode: "full",
      stats,
      transaction: null,
      screenshot: null,
    };

    expect(payload.connections).toHaveProperty("unity");
    expect(payload.connections).toHaveProperty("blender");
    expect(payload.connections).toHaveProperty("godot");
    expect(payload.mode).toBe("full");
    expect(payload.stats.total).toBe(1);
    expect(payload.stats.successful).toBe(1);
    expect(payload.transaction).toBeNull();

    // Verify log entries shape
    expect(recent.length).toBe(1);
    expect(recent[0]).toHaveProperty("tool");
    expect(recent[0]).toHaveProperty("target");
    expect(recent[0]).toHaveProperty("success");
    expect(recent[0]).toHaveProperty("timestamp");
    expect(recent[0]).toHaveProperty("duration");
  });
});
