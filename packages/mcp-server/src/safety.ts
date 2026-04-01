import { VersionControl } from "./version-control.js";

export type SafetyLevel = "cautious" | "balanced" | "fast";
export type ToolClassification = "safe" | "destructive" | "unknown";

export interface CheckOperationResult {
  allowed: boolean;
  requiresConfirmation: boolean;
  reason: string;
}

const DESTRUCTIVE_KEYWORDS = [
  "delete",
  "destroy",
  "remove",
  "overwrite",
  "clear",
  "reset",
  "build",
  "export",
  "bake",
];

const SAFE_KEYWORDS = [
  "get",
  "list",
  "find",
  "info",
  "status",
  "screenshot",
];

export class SafetyGuard {
  private level: SafetyLevel = "balanced";
  private versionControl: VersionControl | null = null;

  setLevel(level: SafetyLevel): void {
    this.level = level;
  }

  getLevel(): SafetyLevel {
    return this.level;
  }

  setVersionControl(vc: VersionControl): void {
    this.versionControl = vc;
  }

  classifyTool(toolName: string): ToolClassification {
    const lower = toolName.toLowerCase();
    for (const keyword of DESTRUCTIVE_KEYWORDS) {
      if (lower.includes(keyword)) {
        return "destructive";
      }
    }
    for (const keyword of SAFE_KEYWORDS) {
      if (lower.includes(keyword)) {
        return "safe";
      }
    }
    return "unknown";
  }

  getDestructiveTools(): string[] {
    return [...DESTRUCTIVE_KEYWORDS];
  }

  checkOperation(
    toolName: string,
    _params?: Record<string, unknown>,
  ): CheckOperationResult {
    const classification = this.classifyTool(toolName);

    if (this.level === "fast") {
      return {
        allowed: true,
        requiresConfirmation: false,
        reason: "Fast mode: all operations allowed without confirmation.",
      };
    }

    if (this.level === "cautious") {
      if (classification === "safe") {
        return {
          allowed: true,
          requiresConfirmation: false,
          reason: `Tool "${toolName}" is classified as safe.`,
        };
      }
      return {
        allowed: true,
        requiresConfirmation: true,
        reason: `Cautious mode: tool "${toolName}" (${classification}) requires confirmation.`,
      };
    }

    // balanced
    if (classification === "destructive") {
      return {
        allowed: true,
        requiresConfirmation: true,
        reason: `Balanced mode: destructive tool "${toolName}" requires confirmation.`,
      };
    }

    return {
      allowed: true,
      requiresConfirmation: false,
      reason: `Balanced mode: tool "${toolName}" (${classification}) does not require confirmation.`,
    };
  }

  async createPreSnapshot(toolName: string): Promise<string | null> {
    if (!this.versionControl) {
      return null;
    }
    try {
      const saveInfo = await this.versionControl.save(
        `Pre-snapshot before ${toolName}`,
      );
      return saveInfo.id;
    } catch {
      // No changes to save or other error; acceptable
      return null;
    }
  }
}
