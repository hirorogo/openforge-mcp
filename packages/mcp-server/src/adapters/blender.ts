import { BaseAdapter, JsonRpcResponse } from "./base.js";

const DEFAULT_BLENDER_PORT = 19801;

export class BlenderAdapter extends BaseAdapter {
  constructor(port: number = DEFAULT_BLENDER_PORT, host: string = "127.0.0.1") {
    super("blender", port, host);
  }

  async captureScreenshot(width?: number, height?: number): Promise<JsonRpcResponse> {
    const params: Record<string, unknown> = {};
    if (width !== undefined) params.width = width;
    if (height !== undefined) params.height = height;
    return this.sendCommand("viewport.captureScreenshot", params);
  }

  async getObjects(includeHidden: boolean = false): Promise<JsonRpcResponse> {
    return this.sendCommand("scene.getObjects", { includeHidden });
  }

  async getSceneInfo(): Promise<JsonRpcResponse> {
    return this.sendCommand("scene.getInfo", {});
  }

  protected override onMessage(message: JsonRpcResponse): void {
    if (message.result && typeof message.result === "object") {
      const result = message.result as Record<string, unknown>;
      if (result.type === "progress") {
        this.emit("progress", result);
      }
    }
  }
}
