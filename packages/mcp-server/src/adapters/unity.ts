import { BaseAdapter, JsonRpcResponse } from "./base.js";

const DEFAULT_UNITY_PORT = 19800;

export class UnityAdapter extends BaseAdapter {
  constructor(port: number = DEFAULT_UNITY_PORT, host: string = "127.0.0.1") {
    super("unity", port, host);
  }

  async captureScreenshot(width?: number, height?: number): Promise<JsonRpcResponse> {
    const params: Record<string, unknown> = {};
    if (width !== undefined) params.width = width;
    if (height !== undefined) params.height = height;
    return this.sendCommand("editor.captureScreenshot", params);
  }

  async getHierarchy(depth: number = -1, includeInactive: boolean = true): Promise<JsonRpcResponse> {
    return this.sendCommand("scene.getHierarchy", { depth, includeInactive });
  }

  async getConsoleLog(count: number = 100, logType?: string): Promise<JsonRpcResponse> {
    const params: Record<string, unknown> = { count };
    if (logType) params.logType = logType;
    return this.sendCommand("editor.getConsoleLog", params);
  }

  protected override onMessage(message: JsonRpcResponse): void {
    if (message.result && typeof message.result === "object") {
      const result = message.result as Record<string, unknown>;
      if (result.type === "log") {
        this.emit("log", result);
      }
    }
  }
}
