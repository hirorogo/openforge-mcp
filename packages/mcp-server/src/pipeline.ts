import * as os from "node:os";
import * as path from "node:path";
import { UnityAdapter } from "./adapters/unity.js";
import { BlenderAdapter } from "./adapters/blender.js";

export type PipelineApp = "unity" | "blender";
export type PipelineFormat = "fbx" | "gltf" | "obj" | "vrm";

const SUPPORTED_FORMATS: Set<string> = new Set(["fbx", "gltf", "obj", "vrm"]);

const FORMAT_EXTENSIONS: Record<PipelineFormat, string> = {
  fbx: ".fbx",
  gltf: ".gltf",
  obj: ".obj",
  vrm: ".vrm",
};

const EXPORT_COMMANDS: Record<PipelineApp, Record<PipelineFormat, string>> = {
  blender: {
    fbx: "export.export_fbx",
    gltf: "export.export_gltf",
    obj: "export.export_obj",
    vrm: "export.export_vrm",
  },
  unity: {
    fbx: "export.export_fbx",
    gltf: "export.export_gltf",
    obj: "export.export_obj",
    vrm: "export.export_vrm",
  },
};

const IMPORT_COMMANDS: Record<PipelineApp, string> = {
  unity: "import.import_asset",
  blender: "import.import_asset",
};

export interface TransferOptions {
  sourcePath?: string;
  targetPath?: string;
}

export interface TransferResult {
  success: boolean;
  format: PipelineFormat;
  exportPath: string;
  importPath: string;
  from: PipelineApp;
  to: PipelineApp;
  error?: string;
}

export class Pipeline {
  private unityAdapter: UnityAdapter;
  private blenderAdapter: BlenderAdapter;

  constructor(unityAdapter: UnityAdapter, blenderAdapter: BlenderAdapter) {
    this.unityAdapter = unityAdapter;
    this.blenderAdapter = blenderAdapter;
  }

  getSharedPath(): string {
    return path.join(os.tmpdir(), "openforge-pipeline");
  }

  async transferAsset(
    from: PipelineApp,
    to: PipelineApp,
    format: PipelineFormat,
    options?: TransferOptions,
  ): Promise<TransferResult> {
    if (from === to) {
      return {
        success: false,
        format,
        exportPath: "",
        importPath: "",
        from,
        to,
        error: "Source and target applications must be different.",
      };
    }

    if (!SUPPORTED_FORMATS.has(format)) {
      return {
        success: false,
        format,
        exportPath: "",
        importPath: "",
        from,
        to,
        error: `Unsupported format "${format}". Supported formats: ${Array.from(SUPPORTED_FORMATS).join(", ")}`,
      };
    }

    const sourceAdapter = this.getAdapter(from);
    const targetAdapter = this.getAdapter(to);

    if (!sourceAdapter.isConnected()) {
      return {
        success: false,
        format,
        exportPath: "",
        importPath: "",
        from,
        to,
        error: `Source application "${from}" is not connected.`,
      };
    }

    if (!targetAdapter.isConnected()) {
      return {
        success: false,
        format,
        exportPath: "",
        importPath: "",
        from,
        to,
        error: `Target application "${to}" is not connected.`,
      };
    }

    const sharedDir = this.getSharedPath();
    const timestamp = Date.now();
    const fileName = `transfer_${from}_to_${to}_${timestamp}${FORMAT_EXTENSIONS[format]}`;
    const exportPath = options?.sourcePath ?? path.join(sharedDir, fileName);
    const importPath = options?.targetPath ?? exportPath;

    try {
      const exportCommand = EXPORT_COMMANDS[from][format];
      const exportResponse = await sourceAdapter.sendCommand(exportCommand, {
        path: exportPath,
      });

      if (exportResponse.error) {
        return {
          success: false,
          format,
          exportPath,
          importPath,
          from,
          to,
          error: `Export failed: ${exportResponse.error.message}`,
        };
      }

      const importCommand = IMPORT_COMMANDS[to];
      const importResponse = await targetAdapter.sendCommand(importCommand, {
        path: importPath,
      });

      if (importResponse.error) {
        return {
          success: false,
          format,
          exportPath,
          importPath,
          from,
          to,
          error: `Import failed: ${importResponse.error.message}`,
        };
      }

      return {
        success: true,
        format,
        exportPath,
        importPath,
        from,
        to,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        format,
        exportPath,
        importPath,
        from,
        to,
        error: message,
      };
    }
  }

  getAdapter(app: PipelineApp): UnityAdapter | BlenderAdapter {
    return app === "unity" ? this.unityAdapter : this.blenderAdapter;
  }

  getStatus(): { unity: boolean; blender: boolean } {
    return {
      unity: this.unityAdapter.isConnected(),
      blender: this.blenderAdapter.isConnected(),
    };
  }
}
