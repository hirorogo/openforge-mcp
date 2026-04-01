import { BaseAdapter, JsonRpcResponse } from "./base.js";

const DEFAULT_GODOT_PORT = 19802;

export class GodotAdapter extends BaseAdapter {
  constructor(port: number = DEFAULT_GODOT_PORT, host: string = "127.0.0.1") {
    super("godot", port, host);
  }

  async captureScreenshot(width?: number, height?: number): Promise<JsonRpcResponse> {
    const params: Record<string, unknown> = {};
    if (width !== undefined) params.width = width;
    if (height !== undefined) params.height = height;
    return this.sendCommand("screenshot.get_viewport_screenshot", params);
  }

  async getSceneTree(maxDepth: number = -1): Promise<JsonRpcResponse> {
    return this.sendCommand("node.get_scene_tree", { maxDepth });
  }

  async getNodeInfo(nodePath: string): Promise<JsonRpcResponse> {
    return this.sendCommand("node.get_node_info", { nodePath });
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
