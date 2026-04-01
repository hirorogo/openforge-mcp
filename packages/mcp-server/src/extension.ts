import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { ToolRegistry, ToolDefinition } from "./registry.js";

export interface DiscoveredExtension {
  name: string;
  description: string;
  source: string;
  filePath: string;
  parameters: string[];
}

// Regex to parse C# attribute: [OpenForgeTool("name", "description")]
const CSHARP_ATTRIBUTE_RE =
  /\[OpenForgeTool\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)\]\s*(?:public\s+)?(?:static\s+)?(?:\w+\s+)+(\w+)\s*\(([^)]*)\)/g;

// Regex to parse Python decorator: @openforge_tool("name", "description")
const PYTHON_DECORATOR_RE =
  /@openforge_tool\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)\s*\ndef\s+(\w+)\s*\(([^)]*)\)/g;

function parseCSParams(paramsStr: string): string[] {
  if (!paramsStr.trim()) return [];
  return paramsStr
    .split(",")
    .map((p) => {
      const parts = p.trim().split(/\s+/);
      return parts.length >= 2 ? parts[parts.length - 1] : parts[0];
    })
    .filter((p) => p.length > 0);
}

function parsePyParams(paramsStr: string): string[] {
  if (!paramsStr.trim()) return [];
  return paramsStr
    .split(",")
    .map((p) => {
      const name = p.trim().split(":")[0].split("=")[0].trim();
      return name;
    })
    .filter((p) => p.length > 0 && p !== "self");
}

export class ExtensionManager {
  private extensions: DiscoveredExtension[] = [];

  async scanForExtensions(projectPath: string): Promise<DiscoveredExtension[]> {
    this.extensions = [];

    const files = await this.collectFiles(projectPath);

    for (const filePath of files) {
      const ext = extname(filePath).toLowerCase();
      let content: string;
      try {
        content = await readFile(filePath, "utf-8");
      } catch {
        continue;
      }

      if (ext === ".cs") {
        this.parseCSharpFile(content, filePath);
      } else if (ext === ".py") {
        this.parsePythonFile(content, filePath);
      }
    }

    return [...this.extensions];
  }

  private async collectFiles(dirPath: string): Promise<string[]> {
    const result: string[] = [];
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        if (entry.isDirectory()) {
          // Skip hidden directories and common non-source directories
          if (
            entry.name.startsWith(".") ||
            entry.name === "node_modules" ||
            entry.name === "Library" ||
            entry.name === "__pycache__"
          ) {
            continue;
          }
          const subFiles = await this.collectFiles(fullPath);
          result.push(...subFiles);
        } else {
          const ext = extname(entry.name).toLowerCase();
          if (ext === ".cs" || ext === ".py") {
            result.push(fullPath);
          }
        }
      }
    } catch {
      // Directory not readable
    }
    return result;
  }

  parseCSharpFile(content: string, filePath: string): void {
    CSHARP_ATTRIBUTE_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = CSHARP_ATTRIBUTE_RE.exec(content)) !== null) {
      const name = match[1];
      const description = match[2];
      const paramsStr = match[4];
      this.extensions.push({
        name,
        description,
        source: "unity",
        filePath,
        parameters: parseCSParams(paramsStr),
      });
    }
  }

  parsePythonFile(content: string, filePath: string): void {
    PYTHON_DECORATOR_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PYTHON_DECORATOR_RE.exec(content)) !== null) {
      const name = match[1];
      const description = match[2];
      const paramsStr = match[4];
      this.extensions.push({
        name,
        description,
        source: "blender",
        filePath,
        parameters: parsePyParams(paramsStr),
      });
    }
  }

  registerDiscoveredTools(registry: ToolRegistry): number {
    let count = 0;
    for (const ext of this.extensions) {
      const target = ext.source === "unity" ? "unity" : "blender";
      const properties: Record<string, unknown> = {};
      for (const param of ext.parameters) {
        properties[param] = {
          type: "string",
          description: `Parameter: ${param}`,
        };
      }
      const toolDef: ToolDefinition = {
        name: ext.name,
        description: ext.description,
        category: "extension",
        target: target as "unity" | "blender" | "godot",
        parameters: {
          type: "object",
          properties,
          required: ext.parameters,
        },
      };
      registry.registerTools([toolDef]);
      count++;
    }
    return count;
  }

  getExtensionCount(): number {
    return this.extensions.length;
  }

  getExtensions(): DiscoveredExtension[] {
    return [...this.extensions];
  }
}
