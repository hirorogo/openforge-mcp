import { ToolRegistry } from "./registry.js";
import { UnityAdapter } from "./adapters/unity.js";
import { BlenderAdapter } from "./adapters/blender.js";
import { GodotAdapter } from "./adapters/godot.js";

export interface ExecuteParams {
  target: "unity" | "blender" | "godot";
  tool: string;
  args?: Record<string, unknown>;
}

export interface ExecuteResult {
  success: boolean;
  target: string;
  tool: string;
  data?: unknown;
  error?: string;
  duration?: number;
}

export class ToolRouter {
  private registry: ToolRegistry;
  private unityAdapter: UnityAdapter;
  private blenderAdapter: BlenderAdapter;
  private godotAdapter: GodotAdapter;

  constructor(registry: ToolRegistry, unityAdapter: UnityAdapter, blenderAdapter: BlenderAdapter, godotAdapter: GodotAdapter) {
    this.registry = registry;
    this.unityAdapter = unityAdapter;
    this.blenderAdapter = blenderAdapter;
    this.godotAdapter = godotAdapter;
  }

  async execute(params: ExecuteParams): Promise<ExecuteResult> {
    const startTime = Date.now();
    const { target, tool: toolName, args } = params;

    if (target !== "unity" && target !== "blender" && target !== "godot") {
      return {
        success: false,
        target,
        tool: toolName,
        error: `Unknown target "${target}". Must be "unity", "blender", or "godot".`,
      };
    }

    // In dynamic mode, auto-load the tool if it exists in the full registry
    if (this.registry.getMode() === "dynamic") {
      this.registry.loadDynamicTool(target, toolName);
    }

    const toolDef = this.registry.getTool(target, toolName);
    if (!toolDef) {
      const allTools = this.registry.getAllToolsUnfiltered();
      const exists = allTools.some((t) => t.target === target && t.name === toolName);
      if (exists) {
        return {
          success: false,
          target,
          tool: toolName,
          error: `Tool "${toolName}" exists but is not available in the current mode ("${this.registry.getMode()}"). Switch to "full" mode or load it dynamically.`,
        };
      }
      return {
        success: false,
        target,
        tool: toolName,
        error: `Tool "${toolName}" not found for target "${target}".`,
      };
    }

    const validationError = this.validateParams(toolDef.parameters, args);
    if (validationError) {
      return {
        success: false,
        target,
        tool: toolName,
        error: validationError,
      };
    }

    const adapter = target === "unity" ? this.unityAdapter : target === "blender" ? this.blenderAdapter : this.godotAdapter;

    if (!adapter.isConnected()) {
      try {
        await adapter.connect();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          target,
          tool: toolName,
          error: `Cannot connect to ${target}: ${message}`,
        };
      }
    }

    try {
      const rpcMethod = `${toolDef.category}.${toolDef.name}`;
      const response = await adapter.sendCommand(rpcMethod, args ?? {});

      if (response.error) {
        return {
          success: false,
          target,
          tool: toolName,
          error: response.error.message,
          data: response.error.data,
          duration: Date.now() - startTime,
        };
      }

      return {
        success: true,
        target,
        tool: toolName,
        data: response.result,
        duration: Date.now() - startTime,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        target,
        tool: toolName,
        error: message,
        duration: Date.now() - startTime,
      };
    }
  }

  private validateParams(
    schema: { required?: string[]; properties: Record<string, unknown> },
    args?: Record<string, unknown>,
  ): string | null {
    if (!schema.required || schema.required.length === 0) {
      return null;
    }

    const provided = args ?? {};
    const missing = schema.required.filter((key) => !(key in provided));
    if (missing.length > 0) {
      return `Missing required parameters: ${missing.join(", ")}`;
    }

    return null;
  }

  getConnectionStatus(): { unity: boolean; blender: boolean; godot: boolean } {
    return {
      unity: this.unityAdapter.isConnected(),
      blender: this.blenderAdapter.isConnected(),
      godot: this.godotAdapter.isConnected(),
    };
  }
}
