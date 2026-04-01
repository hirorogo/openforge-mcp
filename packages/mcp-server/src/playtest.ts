import { UnityAdapter } from "./adapters/unity.js";
import { JsonRpcResponse } from "./adapters/base.js";

export interface PlaytestInput {
  type: "key" | "mouse";
  key?: string;
  action?: "press" | "hold" | "release";
  x?: number;
  y?: number;
  button?: number;
}

export interface PlaytestOptions {
  /** Duration in seconds. Converted to frame count at ~60fps. Default: 5 */
  duration?: number;
  /** Explicit frame count. Overrides duration if provided. */
  frames?: number;
  /** Input sequence to simulate during the playtest. */
  inputs?: PlaytestInput[];
  /** Width for screenshots. */
  screenshotWidth?: number;
  /** Height for screenshots. */
  screenshotHeight?: number;
}

export interface PlaytestLogEntry {
  message: string;
  type: string;
  timestamp: number;
}

export interface PlaytestPerformanceStats {
  fps: number;
  deltaTime: number;
  memory: {
    totalAllocatedMB: number;
    totalReservedMB: number;
    monoUsedMB: number;
    monoHeapMB: number;
  };
  rendering?: {
    drawCalls?: number;
    triangles?: number;
    vertices?: number;
    batches?: number;
  };
  scene: {
    gameObjects: number;
    renderers: number;
    lights: number;
  };
  isPlaying: boolean;
}

export interface PlaytestReport {
  success: boolean;
  preScreenshot: string | null;
  postScreenshot: string | null;
  enteredPlayMode: boolean;
  exitedPlayMode: boolean;
  inputsSimulated: number;
  framesWaited: number;
  consoleLogs: {
    totalCaptured: number;
    returned: number;
    logs: PlaytestLogEntry[];
  };
  performanceStats: PlaytestPerformanceStats | null;
  summary: {
    totalLogs: number;
    errors: number;
    warnings: number;
    durationSeconds: number;
    framesProcessed: number;
    passed: boolean;
  };
  error?: string;
}

export class PlaytestManager {
  private adapter: UnityAdapter;

  constructor(adapter: UnityAdapter) {
    this.adapter = adapter;
  }

  async runPlaytest(options: PlaytestOptions = {}): Promise<PlaytestReport> {
    if (!this.adapter.isConnected()) {
      return this.failReport("Unity adapter is not connected.");
    }

    const duration = Math.min(Math.max(options.duration ?? 5, 0.1), 300);
    let frames = Math.max(1, Math.round(duration * 60));
    if (options.frames !== undefined && options.frames > 0) {
      frames = Math.min(options.frames, 18000);
    }

    let preScreenshot: string | null = null;
    let postScreenshot: string | null = null;
    let enteredPlayMode = false;
    let exitedPlayMode = false;
    let inputsSimulated = 0;
    let consoleLogs: PlaytestReport["consoleLogs"] = { totalCaptured: 0, returned: 0, logs: [] };
    let performanceStats: PlaytestPerformanceStats | null = null;
    let framesWaited = 0;

    // Step 1: Check if already playing
    const playingResponse = await this.sendTool("playtest.is_playing", {});
    const isAlreadyPlaying = this.extractBoolFromResult(playingResponse, "isPlaying");

    // Step 2: Pre-playtest screenshot
    try {
      const screenshotParams: Record<string, unknown> = { source: "scene" };
      if (options.screenshotWidth) screenshotParams.width = options.screenshotWidth;
      if (options.screenshotHeight) screenshotParams.height = options.screenshotHeight;
      const ssResponse = await this.sendTool("editor.captureScreenshot", screenshotParams);
      if (ssResponse.result) {
        const result = ssResponse.result as Record<string, unknown>;
        if (typeof result.data === "string") {
          preScreenshot = result.data;
        }
      }
    } catch {
      // Screenshot failure is non-fatal
    }

    // Step 3: Enter play mode if not already playing
    if (!isAlreadyPlaying) {
      try {
        const enterResponse = await this.sendTool("playtest.enter_playmode", {});
        if (enterResponse.error) {
          return this.failReport(`Failed to enter play mode: ${enterResponse.error.message}`);
        }
        enteredPlayMode = true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return this.failReport(`Failed to enter play mode: ${msg}`);
      }
    }

    // Step 4: Simulate inputs
    if (options.inputs && options.inputs.length > 0) {
      for (const input of options.inputs) {
        try {
          const params: Record<string, unknown> = { type: input.type };
          if (input.key) params.key = input.key;
          if (input.action) params.action = input.action;
          if (input.x !== undefined) params.x = input.x;
          if (input.y !== undefined) params.y = input.y;
          if (input.button !== undefined) params.button = input.button;

          await this.sendTool("playtest.simulate_input", params);
          inputsSimulated++;
        } catch {
          // Input simulation failure is non-fatal
        }
      }
    }

    // Step 5: Wait for specified duration
    try {
      const waitResponse = await this.sendTool("playtest.wait_frames", { count: frames });
      if (waitResponse.result) {
        const result = waitResponse.result as Record<string, unknown>;
        if (typeof result.data === "string") {
          try {
            const parsed = JSON.parse(result.data);
            framesWaited = parsed.requestedFrames ?? frames;
          } catch {
            framesWaited = frames;
          }
        } else {
          framesWaited = frames;
        }
      }
    } catch {
      framesWaited = frames;
    }

    // Step 6: Collect console logs
    try {
      const logResponse = await this.sendTool("playtest.get_console_logs", { limit: 500 });
      if (logResponse.result) {
        const result = logResponse.result as Record<string, unknown>;
        if (typeof result.data === "string") {
          try {
            consoleLogs = JSON.parse(result.data);
          } catch {
            // leave default
          }
        }
      }
    } catch {
      // Log collection failure is non-fatal
    }

    // Step 7: Collect performance stats
    try {
      const statsResponse = await this.sendTool("playtest.get_performance_stats", {});
      if (statsResponse.result) {
        const result = statsResponse.result as Record<string, unknown>;
        if (typeof result.data === "string") {
          try {
            performanceStats = JSON.parse(result.data);
          } catch {
            // leave null
          }
        }
      }
    } catch {
      // Stats collection failure is non-fatal
    }

    // Step 8: Post-playtest screenshot
    try {
      const screenshotParams: Record<string, unknown> = { source: "game" };
      if (options.screenshotWidth) screenshotParams.width = options.screenshotWidth;
      if (options.screenshotHeight) screenshotParams.height = options.screenshotHeight;
      const ssResponse = await this.sendTool("editor.captureScreenshot", screenshotParams);
      if (ssResponse.result) {
        const result = ssResponse.result as Record<string, unknown>;
        if (typeof result.data === "string") {
          postScreenshot = result.data;
        }
      }
    } catch {
      // Screenshot failure is non-fatal
    }

    // Step 9: Exit play mode
    if (enteredPlayMode) {
      try {
        await this.sendTool("playtest.exit_playmode", {});
        exitedPlayMode = true;
      } catch {
        // Exit failure is non-fatal but noted
      }
    }

    // Build summary
    let errorCount = 0;
    let warningCount = 0;
    for (const log of consoleLogs.logs) {
      if (log.type === "Error" || log.type === "Exception" || log.type === "Assert") {
        errorCount++;
      } else if (log.type === "Warning") {
        warningCount++;
      }
    }

    return {
      success: true,
      preScreenshot,
      postScreenshot,
      enteredPlayMode,
      exitedPlayMode,
      inputsSimulated,
      framesWaited,
      consoleLogs,
      performanceStats,
      summary: {
        totalLogs: consoleLogs.totalCaptured,
        errors: errorCount,
        warnings: warningCount,
        durationSeconds: duration,
        framesProcessed: framesWaited,
        passed: errorCount === 0,
      },
    };
  }

  private async sendTool(method: string, params: Record<string, unknown>): Promise<JsonRpcResponse> {
    return this.adapter.sendCommand(method, params);
  }

  private extractBoolFromResult(response: JsonRpcResponse, key: string): boolean {
    if (!response.result) return false;
    const result = response.result as Record<string, unknown>;
    if (typeof result.data === "string") {
      try {
        const parsed = JSON.parse(result.data);
        return !!parsed[key];
      } catch {
        return false;
      }
    }
    return false;
  }

  private failReport(error: string): PlaytestReport {
    return {
      success: false,
      preScreenshot: null,
      postScreenshot: null,
      enteredPlayMode: false,
      exitedPlayMode: false,
      inputsSimulated: 0,
      framesWaited: 0,
      consoleLogs: { totalCaptured: 0, returned: 0, logs: [] },
      performanceStats: null,
      summary: {
        totalLogs: 0,
        errors: 0,
        warnings: 0,
        durationSeconds: 0,
        framesProcessed: 0,
        passed: false,
      },
      error,
    };
  }
}
