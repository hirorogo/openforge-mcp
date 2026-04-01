import { describe, it, expect, beforeEach, vi } from "vitest";
import { PlaytestManager, PlaytestOptions } from "../playtest.js";

function createMockAdapter() {
  return {
    targetName: "unity",
    _connected: true,
    isConnected() {
      return this._connected;
    },
    connect: vi.fn(async function (this: ReturnType<typeof createMockAdapter>) {
      this._connected = true;
    }),
    sendCommand: vi.fn(async (_method: string, _params?: Record<string, unknown>) => ({
      jsonrpc: "2.0" as const,
      id: 1,
      result: { success: true, message: "ok", data: "{}" },
    })),
  };
}

function mockSendCommand(adapter: ReturnType<typeof createMockAdapter>, responses: Record<string, unknown>) {
  adapter.sendCommand.mockImplementation(async (method: string, _params?: Record<string, unknown>): Promise<any> => {
    if (method in responses) {
      return {
        jsonrpc: "2.0" as const,
        id: 1,
        result: responses[method],
      };
    }
    return {
      jsonrpc: "2.0" as const,
      id: 1,
      result: { success: true, message: "ok", data: "{}" },
    };
  });
}

describe("PlaytestManager", () => {
  let adapter: ReturnType<typeof createMockAdapter>;
  let manager: PlaytestManager;

  beforeEach(() => {
    adapter = createMockAdapter();
    manager = new PlaytestManager(adapter as any);
  });

  describe("runPlaytest orchestration", () => {
    it("should execute a full playtest sequence and return a report", async () => {
      const logsData = JSON.stringify({
        totalCaptured: 2,
        returned: 2,
        logs: [
          { message: "Game started", type: "Log", timestamp: 1.0 },
          { message: "Player spawned", type: "Log", timestamp: 1.5 },
        ],
      });

      const statsData = JSON.stringify({
        fps: 60.0,
        deltaTime: 0.0167,
        memory: {
          totalAllocatedMB: 256.0,
          totalReservedMB: 512.0,
          monoUsedMB: 32.0,
          monoHeapMB: 64.0,
        },
        scene: {
          gameObjects: 100,
          renderers: 50,
          lights: 3,
        },
        isPlaying: true,
      });

      const waitData = JSON.stringify({
        requestedFrames: 300,
        startFrame: 0,
        endFrame: 300,
      });

      mockSendCommand(adapter, {
        "playtest.is_playing": { success: true, message: "not playing", data: '{"isPlaying":false,"isPaused":false,"isCompiling":false}' },
        "playtest.enter_playmode": { success: true, message: "Entering play mode." },
        "playtest.wait_frames": { success: true, message: "Stepped", data: waitData },
        "playtest.get_console_logs": { success: true, message: "Retrieved logs", data: logsData },
        "playtest.get_performance_stats": { success: true, message: "Stats collected", data: statsData },
        "playtest.exit_playmode": { success: true, message: "Exiting play mode." },
        "editor.captureScreenshot": { success: true, message: "Screenshot captured", data: '{"format":"png","encoding":"base64","image":"AAAA"}' },
      });

      const report = await manager.runPlaytest({ duration: 5 });

      expect(report.success).toBe(true);
      expect(report.enteredPlayMode).toBe(true);
      expect(report.exitedPlayMode).toBe(true);
      expect(report.consoleLogs.returned).toBe(2);
      expect(report.performanceStats).not.toBeNull();
      expect(report.performanceStats?.fps).toBe(60.0);
      expect(report.summary.passed).toBe(true);
      expect(report.summary.errors).toBe(0);
      expect(report.summary.totalLogs).toBe(2);
    });

    it("should simulate inputs when provided", async () => {
      mockSendCommand(adapter, {
        "playtest.is_playing": { success: true, data: '{"isPlaying":false}' },
        "playtest.enter_playmode": { success: true },
        "playtest.simulate_input": { success: true, message: "Simulated" },
        "playtest.wait_frames": { success: true, data: '{"requestedFrames":60}' },
        "playtest.get_console_logs": { success: true, data: '{"totalCaptured":0,"returned":0,"logs":[]}' },
        "playtest.get_performance_stats": { success: true, data: '{}' },
        "playtest.exit_playmode": { success: true },
      });

      const options: PlaytestOptions = {
        duration: 1,
        inputs: [
          { type: "key", key: "Space", action: "press" },
          { type: "key", key: "W", action: "hold" },
          { type: "mouse", x: 100, y: 200, button: 0, action: "press" },
        ],
      };

      const report = await manager.runPlaytest(options);

      expect(report.success).toBe(true);
      expect(report.inputsSimulated).toBe(3);

      // Verify simulate_input was called 3 times
      const simulateCalls = adapter.sendCommand.mock.calls.filter(
        (c: unknown[]) => c[0] === "playtest.simulate_input",
      );
      expect(simulateCalls.length).toBe(3);
      expect(simulateCalls[0][1]).toEqual({ type: "key", key: "Space", action: "press" });
      expect(simulateCalls[2][1]).toEqual({ type: "mouse", x: 100, y: 200, button: 0, action: "press" });
    });

    it("should use explicit frame count when provided", async () => {
      mockSendCommand(adapter, {
        "playtest.is_playing": { success: true, data: '{"isPlaying":false}' },
        "playtest.enter_playmode": { success: true },
        "playtest.wait_frames": { success: true, data: '{"requestedFrames":120}' },
        "playtest.get_console_logs": { success: true, data: '{"totalCaptured":0,"returned":0,"logs":[]}' },
        "playtest.get_performance_stats": { success: true, data: '{}' },
        "playtest.exit_playmode": { success: true },
      });

      const report = await manager.runPlaytest({ frames: 120 });

      expect(report.success).toBe(true);
      const waitCall = adapter.sendCommand.mock.calls.find(
        (c: unknown[]) => c[0] === "playtest.wait_frames",
      );
      expect(waitCall).toBeDefined();
      expect((waitCall![1] as Record<string, unknown>).count).toBe(120);
    });

    it("should not enter/exit play mode if already playing", async () => {
      mockSendCommand(adapter, {
        "playtest.is_playing": { success: true, data: '{"isPlaying":true}' },
        "playtest.wait_frames": { success: true, data: '{"requestedFrames":60}' },
        "playtest.get_console_logs": { success: true, data: '{"totalCaptured":0,"returned":0,"logs":[]}' },
        "playtest.get_performance_stats": { success: true, data: '{}' },
      });

      const report = await manager.runPlaytest({ duration: 1 });

      expect(report.success).toBe(true);
      expect(report.enteredPlayMode).toBe(false);
      expect(report.exitedPlayMode).toBe(false);

      const enterCalls = adapter.sendCommand.mock.calls.filter(
        (c: unknown[]) => c[0] === "playtest.enter_playmode",
      );
      expect(enterCalls.length).toBe(0);

      const exitCalls = adapter.sendCommand.mock.calls.filter(
        (c: unknown[]) => c[0] === "playtest.exit_playmode",
      );
      expect(exitCalls.length).toBe(0);
    });
  });

  describe("report generation", () => {
    it("should mark report as failed when errors are found in logs", async () => {
      const logsData = JSON.stringify({
        totalCaptured: 3,
        returned: 3,
        logs: [
          { message: "Game started", type: "Log", timestamp: 1.0 },
          { message: "NullReferenceException", type: "Error", timestamp: 2.0 },
          { message: "Missing reference", type: "Warning", timestamp: 2.5 },
        ],
      });

      mockSendCommand(adapter, {
        "playtest.is_playing": { success: true, data: '{"isPlaying":false}' },
        "playtest.enter_playmode": { success: true },
        "playtest.wait_frames": { success: true, data: '{"requestedFrames":60}' },
        "playtest.get_console_logs": { success: true, data: logsData },
        "playtest.get_performance_stats": { success: true, data: '{}' },
        "playtest.exit_playmode": { success: true },
      });

      const report = await manager.runPlaytest({ duration: 1 });

      expect(report.success).toBe(true);
      expect(report.summary.passed).toBe(false);
      expect(report.summary.errors).toBe(1);
      expect(report.summary.warnings).toBe(1);
      expect(report.summary.totalLogs).toBe(3);
    });

    it("should count Exception and Assert types as errors", async () => {
      const logsData = JSON.stringify({
        totalCaptured: 2,
        returned: 2,
        logs: [
          { message: "Assertion failed", type: "Assert", timestamp: 1.0 },
          { message: "Unhandled exception", type: "Exception", timestamp: 1.5 },
        ],
      });

      mockSendCommand(adapter, {
        "playtest.is_playing": { success: true, data: '{"isPlaying":false}' },
        "playtest.enter_playmode": { success: true },
        "playtest.wait_frames": { success: true, data: '{"requestedFrames":60}' },
        "playtest.get_console_logs": { success: true, data: logsData },
        "playtest.get_performance_stats": { success: true, data: '{}' },
        "playtest.exit_playmode": { success: true },
      });

      const report = await manager.runPlaytest({ duration: 1 });

      expect(report.summary.errors).toBe(2);
      expect(report.summary.passed).toBe(false);
    });

    it("should include performance stats in the report", async () => {
      const statsData = JSON.stringify({
        fps: 30.0,
        deltaTime: 0.0333,
        memory: {
          totalAllocatedMB: 128.0,
          totalReservedMB: 256.0,
          monoUsedMB: 16.0,
          monoHeapMB: 32.0,
        },
        rendering: {
          drawCalls: 200,
          triangles: 50000,
          vertices: 100000,
          batches: 80,
        },
        scene: {
          gameObjects: 50,
          renderers: 25,
          lights: 2,
        },
        isPlaying: true,
      });

      mockSendCommand(adapter, {
        "playtest.is_playing": { success: true, data: '{"isPlaying":false}' },
        "playtest.enter_playmode": { success: true },
        "playtest.wait_frames": { success: true, data: '{"requestedFrames":60}' },
        "playtest.get_console_logs": { success: true, data: '{"totalCaptured":0,"returned":0,"logs":[]}' },
        "playtest.get_performance_stats": { success: true, data: statsData },
        "playtest.exit_playmode": { success: true },
      });

      const report = await manager.runPlaytest({ duration: 1 });

      expect(report.performanceStats).not.toBeNull();
      expect(report.performanceStats!.fps).toBe(30.0);
      expect(report.performanceStats!.rendering?.drawCalls).toBe(200);
      expect(report.performanceStats!.scene.gameObjects).toBe(50);
    });
  });

  describe("error handling", () => {
    it("should return a failed report when adapter is not connected", async () => {
      adapter._connected = false;

      const report = await manager.runPlaytest();

      expect(report.success).toBe(false);
      expect(report.error).toContain("not connected");
      expect(report.summary.passed).toBe(false);
    });

    it("should return a failed report when entering play mode fails with RPC error", async () => {
      adapter.sendCommand.mockImplementation(async (method: string): Promise<any> => {
        if (method === "playtest.is_playing") {
          return { jsonrpc: "2.0" as const, id: 1, result: { data: '{"isPlaying":false}' } };
        }
        if (method === "playtest.enter_playmode") {
          return {
            jsonrpc: "2.0" as const,
            id: 1,
            error: { code: -32000, message: "Compilation errors prevent entering play mode" },
          };
        }
        // screenshot calls
        return { jsonrpc: "2.0" as const, id: 1, result: {} };
      });

      const report = await manager.runPlaytest();

      expect(report.success).toBe(false);
      expect(report.error).toContain("Failed to enter play mode");
      expect(report.error).toContain("Compilation errors");
    });

    it("should return a failed report when entering play mode throws", async () => {
      adapter.sendCommand.mockImplementation(async (method: string): Promise<any> => {
        if (method === "playtest.is_playing") {
          return { jsonrpc: "2.0" as const, id: 1, result: { data: '{"isPlaying":false}' } };
        }
        if (method === "playtest.enter_playmode") {
          throw new Error("Connection lost");
        }
        return { jsonrpc: "2.0" as const, id: 1, result: {} };
      });

      const report = await manager.runPlaytest();

      expect(report.success).toBe(false);
      expect(report.error).toContain("Connection lost");
    });

    it("should still produce a report when log collection fails", async () => {
      adapter.sendCommand.mockImplementation(async (method: string): Promise<any> => {
        if (method === "playtest.is_playing") {
          return { jsonrpc: "2.0" as const, id: 1, result: { data: '{"isPlaying":false}' } };
        }
        if (method === "playtest.get_console_logs") {
          throw new Error("Log retrieval failed");
        }
        if (method === "playtest.get_performance_stats") {
          throw new Error("Stats retrieval failed");
        }
        return { jsonrpc: "2.0" as const, id: 1, result: { success: true, data: '{}' } };
      });

      const report = await manager.runPlaytest({ duration: 1 });

      expect(report.success).toBe(true);
      expect(report.consoleLogs.returned).toBe(0);
      expect(report.performanceStats).toBeNull();
    });

    it("should clamp duration to valid range", async () => {
      mockSendCommand(adapter, {
        "playtest.is_playing": { success: true, data: '{"isPlaying":false}' },
        "playtest.enter_playmode": { success: true },
        "playtest.wait_frames": { success: true, data: '{"requestedFrames":6}' },
        "playtest.get_console_logs": { success: true, data: '{"totalCaptured":0,"returned":0,"logs":[]}' },
        "playtest.get_performance_stats": { success: true, data: '{}' },
        "playtest.exit_playmode": { success: true },
      });

      // Very small duration should be clamped to 0.1
      const report = await manager.runPlaytest({ duration: 0.001 });

      expect(report.success).toBe(true);
      expect(report.summary.durationSeconds).toBe(0.1);
    });
  });
});
