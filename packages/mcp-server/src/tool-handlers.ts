import { ToolRegistry } from "./registry.js";
import { ToolRouter } from "./router.js";
import { UnityAdapter } from "./adapters/unity.js";
import { BlenderAdapter } from "./adapters/blender.js";
import { GodotAdapter } from "./adapters/godot.js";
import { VersionControl } from "./version-control.js";
import { TransactionManager } from "./transaction.js";
import { Pipeline } from "./pipeline.js";
import { RecipeEngine } from "./recipe.js";
import { SafetyGuard, SafetyLevel } from "./safety.js";
import { ExtensionManager } from "./extension.js";
import { AssetGeneration } from "./asset-generation.js";
import type { MeshProvider, TextureProvider, AudioProvider, SkyboxProvider, TextureType, AudioType } from "./asset-generation.js";
import { GameStudiosBridge } from "./game-studios.js";
import { OperationLog } from "./operation-log.js";
import { getCopilotToolManifest } from "./copilot.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

export interface ToolHandlerDeps {
  registry: ToolRegistry;
  router: ToolRouter;
  unityAdapter: UnityAdapter;
  blenderAdapter: BlenderAdapter;
  godotAdapter: GodotAdapter;
  versionControl: VersionControl | null;
  transactionManager: TransactionManager;
  pipeline: Pipeline;
  recipeEngine: RecipeEngine;
  safetyGuard: SafetyGuard;
  extensionManager: ExtensionManager;
  assetGeneration: AssetGeneration;
  gameStudiosBridge: GameStudiosBridge;
  operationLog: OperationLog;
  projectPath?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wrapToolResult(result: unknown): ToolResult {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

function wrapError(error: string): ToolResult {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ success: false, error }) }],
    isError: true,
  };
}

function extractErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function requireVersionControl(vc: VersionControl | null): VersionControl {
  if (!vc) {
    throw new Error("No project path configured. Use --project-path to set one.");
  }
  return vc;
}

// ---------------------------------------------------------------------------
// Tool definitions (ListToolsRequestSchema response data)
// ---------------------------------------------------------------------------

export function getToolDefinitions(): Array<{
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}> {
  return [
    {
      name: "list_categories",
      description:
        "List all available tool categories grouped by target application (unity/blender/godot). Returns category names and tool counts.",
      inputSchema: {
        type: "object" as const,
        properties: {
          target: {
            type: "string",
            enum: ["unity", "blender", "godot"],
            description: "Filter categories by target. Omit to list all.",
          },
        },
        required: [],
      },
    },
    {
      name: "list_tools",
      description:
        "List all available tools, optionally filtered by target and category. Returns tool names, descriptions, and parameter schemas.",
      inputSchema: {
        type: "object" as const,
        properties: {
          target: {
            type: "string",
            enum: ["unity", "blender", "godot"],
            description: "Filter by target application",
          },
          category: {
            type: "string",
            description: "Filter by tool category (e.g. scene, gameobject, material, mesh)",
          },
        },
        required: [],
      },
    },
    {
      name: "execute",
      description:
        "Execute a tool on the target application (Unity, Blender, or Godot). The tool must exist in the registry and the target editor must be connected.",
      inputSchema: {
        type: "object" as const,
        properties: {
          target: {
            type: "string",
            enum: ["unity", "blender", "godot"],
            description: "Target application to execute the tool on",
          },
          tool: {
            type: "string",
            description: "Name of the tool to execute",
          },
          args: {
            type: "object",
            description: "Arguments to pass to the tool, matching its parameter schema",
            additionalProperties: true,
          },
        },
        required: ["target", "tool"],
      },
    },
    // Version control tools
    {
      name: "save_project",
      description: "Save the current project state by staging all changes and creating a git commit.",
      inputSchema: {
        type: "object" as const,
        properties: {
          message: {
            type: "string",
            description: "Optional commit message. If omitted, an auto-generated message is used.",
          },
        },
        required: [],
      },
    },
    {
      name: "list_saves",
      description: "List recent project saves (git commits) with IDs, messages, dates, and changed files.",
      inputSchema: {
        type: "object" as const,
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of saves to return. Defaults to 20.",
          },
        },
        required: [],
      },
    },
    {
      name: "restore_save",
      description: "Safely revert the project to a previous save by creating a new revert commit.",
      inputSchema: {
        type: "object" as const,
        properties: {
          saveId: {
            type: "string",
            description: "The commit ID of the save to restore.",
          },
        },
        required: ["saveId"],
      },
    },
    {
      name: "get_project_status",
      description: "Get the current project version control status.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "create_branch",
      description: "Create a new experiment branch and switch to it.",
      inputSchema: {
        type: "object" as const,
        properties: {
          name: {
            type: "string",
            description: "Name of the new branch.",
          },
        },
        required: ["name"],
      },
    },
    {
      name: "merge_branch",
      description: "Merge the specified branch into the current branch.",
      inputSchema: {
        type: "object" as const,
        properties: {
          name: {
            type: "string",
            description: "Name of the branch to merge.",
          },
        },
        required: ["name"],
      },
    },
    // Transaction tools
    {
      name: "begin_transaction",
      description: "Start a new transaction to group multiple operations.",
      inputSchema: {
        type: "object" as const,
        properties: {
          label: {
            type: "string",
            description: "A descriptive label for the transaction.",
          },
        },
        required: ["label"],
      },
    },
    {
      name: "commit_transaction",
      description: "End the current transaction successfully. If auto-save is enabled, creates a project save.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "rollback_transaction",
      description: "Rollback the current transaction, discarding all tracked operations.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    // Pipeline tools
    {
      name: "transfer_asset",
      description: "Transfer an asset between applications (e.g., Blender to Unity). Exports from the source and imports into the target.",
      inputSchema: {
        type: "object" as const,
        properties: {
          from: {
            type: "string",
            enum: ["blender", "unity"],
            description: "Source application to export from.",
          },
          to: {
            type: "string",
            enum: ["blender", "unity"],
            description: "Target application to import into.",
          },
          format: {
            type: "string",
            enum: ["fbx", "gltf", "obj", "vrm"],
            description: "File format for the transfer.",
          },
          sourcePath: {
            type: "string",
            description: "Optional custom export path.",
          },
          targetPath: {
            type: "string",
            description: "Optional custom import path.",
          },
        },
        required: ["from", "to", "format"],
      },
    },
    {
      name: "get_pipeline_status",
      description: "Get the current pipeline status showing which adapters are connected.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    // Recipe tools
    {
      name: "run_recipe",
      description: "Run a multi-step recipe defined in YAML. Accepts inline YAML content or a file path.",
      inputSchema: {
        type: "object" as const,
        properties: {
          recipe: {
            type: "string",
            description: "YAML recipe content or an absolute file path to a .yaml recipe file.",
          },
          overrides: {
            type: "object",
            description: "Optional parameter overrides applied to every step.",
            additionalProperties: true,
          },
        },
        required: ["recipe"],
      },
    },
    {
      name: "list_recipes",
      description: "List available recipe files in a directory.",
      inputSchema: {
        type: "object" as const,
        properties: {
          directory: {
            type: "string",
            description: "Directory path to scan for recipe files.",
          },
        },
        required: [],
      },
    },
    {
      name: "validate_recipe",
      description: "Validate a YAML recipe definition, checking that all referenced tools exist.",
      inputSchema: {
        type: "object" as const,
        properties: {
          recipe: {
            type: "string",
            description: "YAML recipe content to validate.",
          },
        },
        required: ["recipe"],
      },
    },
    // Safety tools
    {
      name: "set_safety_level",
      description: "Set the safety level for tool operations. 'cautious' requires confirmation for all modifications, 'balanced' only for destructive operations, 'fast' skips all confirmations.",
      inputSchema: {
        type: "object" as const,
        properties: {
          level: {
            type: "string",
            enum: ["cautious", "balanced", "fast"],
            description: "Safety level to set.",
          },
        },
        required: ["level"],
      },
    },
    {
      name: "get_safety_level",
      description: "Get the current safety level.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "get_operation_classification",
      description: "Get the safety classification of a tool (safe, destructive, or unknown).",
      inputSchema: {
        type: "object" as const,
        properties: {
          tool: {
            type: "string",
            description: "The tool name to classify.",
          },
        },
        required: ["tool"],
      },
    },
    // Extension tools
    {
      name: "scan_extensions",
      description: "Scan a project directory for user-defined OpenForge tool extensions.",
      inputSchema: {
        type: "object" as const,
        properties: {
          path: {
            type: "string",
            description: "Project directory path to scan. Defaults to the configured project path.",
          },
        },
        required: [],
      },
    },
    {
      name: "list_extensions",
      description: "List all discovered user-defined tool extensions.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "reload_extensions",
      description: "Re-scan and reload all user-defined tool extensions from the project directory.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    // Asset generation tools
    {
      name: "generate_3d_model",
      description: "Generate a 3D model from a text description using an AI provider (Rodin, Meshy, or Tripo).",
      inputSchema: {
        type: "object" as const,
        properties: {
          prompt: { type: "string", description: "Text description of the 3D model to generate." },
          provider: { type: "string", enum: ["rodin", "meshy", "tripo"], description: "AI provider to use." },
          format: { type: "string", enum: ["glb", "fbx", "obj"], description: "Output file format. Defaults to glb." },
          polycount: { type: "number", description: "Target polygon count." },
        },
        required: ["prompt"],
      },
    },
    {
      name: "generate_texture",
      description: "Generate a texture from a text description using an AI provider (Stable Diffusion or DALL-E).",
      inputSchema: {
        type: "object" as const,
        properties: {
          prompt: { type: "string", description: "Text description of the texture to generate." },
          provider: { type: "string", enum: ["stable-diffusion", "dall-e"], description: "AI provider to use." },
          type: { type: "string", enum: ["albedo", "normal", "roughness", "pbr"], description: "Texture map type. Defaults to albedo." },
          width: { type: "number", description: "Image width in pixels." },
          height: { type: "number", description: "Image height in pixels." },
        },
        required: ["prompt"],
      },
    },
    {
      name: "generate_audio",
      description: "Generate audio from a text description using an AI provider (Suno for music, ElevenLabs for SFX).",
      inputSchema: {
        type: "object" as const,
        properties: {
          prompt: { type: "string", description: "Text description of the audio to generate." },
          provider: { type: "string", enum: ["suno", "elevenlabs"], description: "AI provider to use." },
          type: { type: "string", enum: ["music", "sfx"], description: "Audio type." },
          duration: { type: "number", description: "Duration in seconds." },
        },
        required: ["prompt"],
      },
    },
    {
      name: "generate_skybox",
      description: "Generate a 360-degree skybox from a text description using Blockade Labs.",
      inputSchema: {
        type: "object" as const,
        properties: {
          prompt: { type: "string", description: "Text description of the skybox environment." },
          provider: { type: "string", enum: ["blockade"], description: "AI provider to use." },
          style: { type: "string", description: "Skybox style ID." },
        },
        required: ["prompt"],
      },
    },
    {
      name: "get_generation_providers",
      description: "Check which AI asset generation providers are configured with API keys.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    // Copilot tools
    {
      name: "get_copilot_manifest",
      description: "Get the GitHub Copilot-optimized tool manifest. Returns all tools with dynamic loading hints for Copilot agent mode.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    // Game Studios integration tools
    {
      name: "setup_game_studios",
      description: "Generate config files to integrate OpenForge MCP with an existing Claude Code Game Studios project.",
      inputSchema: {
        type: "object" as const,
        properties: {
          projectPath: { type: "string", description: "Absolute path to the Game Studios project directory." },
          engine: { type: "string", enum: ["unity", "blender", "godot"], description: "Primary game engine." },
        },
        required: ["projectPath", "engine"],
      },
    },
    {
      name: "get_agent_tools",
      description: "Return which OpenForge tool categories a specific Game Studios agent should use.",
      inputSchema: {
        type: "object" as const,
        properties: {
          agent: { type: "string", description: 'Agent role name (e.g. "lead-programmer", "art-director").' },
        },
        required: ["agent"],
      },
    },
    {
      name: "get_studio_status",
      description: "Return studio status: connected engines, available agent roles, and tool counts.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "run_studio_workflow",
      description: 'Execute a predefined multi-agent studio workflow (e.g. "create_level", "performance_audit", "art_pass", "qa_pass").',
      inputSchema: {
        type: "object" as const,
        properties: {
          workflow: { type: "string", description: "Workflow name." },
          params: { type: "object", description: "Optional workflow parameters.", additionalProperties: true },
        },
        required: ["workflow"],
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Handler map factory
// ---------------------------------------------------------------------------

export function createToolHandlers(deps: ToolHandlerDeps): Map<string, ToolHandler> {
  const {
    registry,
    router,
    versionControl,
    transactionManager,
    pipeline,
    recipeEngine,
    safetyGuard,
    extensionManager,
    assetGeneration,
    gameStudiosBridge,
    operationLog,
    unityAdapter,
    blenderAdapter,
    godotAdapter,
    projectPath,
  } = deps;

  const handlers = new Map<string, ToolHandler>();

  // --- Meta tools ---

  handlers.set("list_categories", async (args) => {
    const target = (args?.target as string) || undefined;
    const categories = registry.getCategories(target);
    return wrapToolResult({ mode: registry.getMode(), categories });
  });

  handlers.set("list_tools", async (args) => {
    const target = (args?.target as string) || undefined;
    const category = (args?.category as string) || undefined;
    const tools = registry.getTools(target, category).map((t) => ({
      name: t.name,
      target: t.target,
      category: t.category,
      description: t.description,
      parameters: t.parameters,
    }));
    return wrapToolResult({ mode: registry.getMode(), toolCount: tools.length, tools });
  });

  handlers.set("execute", async (args) => {
    const target = args?.target as "unity" | "blender" | "godot";
    const tool = args?.tool as string;
    const toolArgs = (args?.args as Record<string, unknown>) || undefined;

    if (!target || !tool) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ success: false, error: "Both 'target' and 'tool' parameters are required." }),
          },
        ],
        isError: true,
      };
    }

    // In dynamic mode, load the tool on demand if it is not yet available
    if (registry.getMode() === "dynamic") {
      const existing = registry.getTool(target, tool);
      if (!existing) {
        const loaded = registry.loadToolOnDemand(`${target}:${tool}`);
        if (!loaded) {
          return wrapError(`Tool "${tool}" not found in the registry for target "${target}".`);
        }
      }
    }

    // Safety guard check
    const safetyCheck = safetyGuard.checkOperation(tool, toolArgs);
    if (safetyCheck.requiresConfirmation) {
      return wrapToolResult({
        success: false,
        requiresConfirmation: true,
        reason: safetyCheck.reason,
        tool,
        target,
      });
    }

    // Pre-snapshot for destructive tools when not in fast mode
    const classification = safetyGuard.classifyTool(tool);
    if (classification === "destructive" && safetyGuard.getLevel() !== "fast") {
      await safetyGuard.createPreSnapshot(tool);
    }

    const execStart = Date.now();
    const result = await router.execute({ target, tool, args: toolArgs });
    operationLog.log({
      tool,
      target,
      params: toolArgs,
      success: result.success,
      error: result.error,
      timestamp: execStart,
      duration: Date.now() - execStart,
    });
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
      isError: !result.success,
    };
  });

  // --- Version control tools ---

  handlers.set("save_project", async (args) => {
    try {
      const vc = requireVersionControl(versionControl);
      const message = (args?.message as string) || undefined;
      const saveInfo = await vc.save(message);
      return wrapToolResult({ success: true, save: saveInfo });
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("list_saves", async (args) => {
    try {
      const vc = requireVersionControl(versionControl);
      const limit = (args?.limit as number) || undefined;
      const saves = await vc.listSaves(limit);
      return wrapToolResult({ success: true, saves });
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("restore_save", async (args) => {
    try {
      const vc = requireVersionControl(versionControl);
      const saveId = args?.saveId as string;
      if (!saveId) {
        return wrapError("Missing required parameter: saveId");
      }
      const result = await vc.restore(saveId);
      return wrapToolResult({ success: true, ...result });
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("get_project_status", async () => {
    try {
      const vc = requireVersionControl(versionControl);
      const status = await vc.getStatus();
      return wrapToolResult({ success: true, status });
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("create_branch", async (args) => {
    try {
      const vc = requireVersionControl(versionControl);
      const branchName = args?.name as string;
      if (!branchName) {
        return wrapError("Missing required parameter: name");
      }
      const result = await vc.createBranch(branchName);
      return wrapToolResult({ success: true, ...result });
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("merge_branch", async (args) => {
    try {
      const vc = requireVersionControl(versionControl);
      const branchName = args?.name as string;
      if (!branchName) {
        return wrapError("Missing required parameter: name");
      }
      const result = await vc.mergeBranch(branchName);
      return wrapToolResult({ success: true, ...result });
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  // --- Transaction tools ---

  handlers.set("begin_transaction", async (args) => {
    try {
      const label = args?.label as string;
      if (!label) {
        return wrapError("Missing required parameter: label");
      }
      const info = transactionManager.begin(label);
      return wrapToolResult({ success: true, transaction: info });
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("commit_transaction", async () => {
    try {
      const result = await transactionManager.commit();
      return wrapToolResult({ success: true, ...result });
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("rollback_transaction", async () => {
    try {
      const result = transactionManager.rollback();
      return wrapToolResult({ success: true, ...result });
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  // --- Pipeline tools ---

  handlers.set("transfer_asset", async (args) => {
    try {
      const from = args?.from as "blender" | "unity";
      const to = args?.to as "blender" | "unity";
      const format = args?.format as "fbx" | "gltf" | "obj" | "vrm";
      if (!from || !to || !format) {
        return wrapError("Missing required parameters: from, to, format");
      }
      const result = await pipeline.transferAsset(from, to, format, {
        sourcePath: (args?.sourcePath as string) || undefined,
        targetPath: (args?.targetPath as string) || undefined,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("get_pipeline_status", async () => {
    const status = pipeline.getStatus();
    return wrapToolResult({ success: true, adapters: status });
  });

  // --- Recipe tools ---

  handlers.set("run_recipe", async (args) => {
    try {
      const recipeInput = args?.recipe as string;
      if (!recipeInput) {
        return wrapError("Missing required parameter: recipe");
      }
      const overrides = (args?.overrides as Record<string, unknown>) || undefined;
      let recipe;
      if (recipeInput.trim().startsWith("name:") || recipeInput.includes("\n")) {
        recipe = recipeEngine.loadRecipe(recipeInput);
      } else {
        recipe = await recipeEngine.loadRecipeFromFile(recipeInput);
      }
      const result = await recipeEngine.executeRecipe(recipe, overrides);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("list_recipes", async (args) => {
    try {
      const directory = (args?.directory as string) || process.cwd();
      const recipes = await recipeEngine.listRecipes(directory);
      return wrapToolResult({ success: true, recipes });
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("validate_recipe", async (args) => {
    try {
      const recipeYaml = args?.recipe as string;
      if (!recipeYaml) {
        return wrapError("Missing required parameter: recipe");
      }
      const recipe = recipeEngine.loadRecipe(recipeYaml);
      const validation = recipeEngine.validateRecipe(recipe);
      return wrapToolResult({ success: true, recipeName: recipe.name, ...validation });
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  // --- Safety tools ---

  handlers.set("set_safety_level", async (args) => {
    const level = args?.level as string;
    if (level !== "cautious" && level !== "balanced" && level !== "fast") {
      return wrapError('Invalid level. Must be "cautious", "balanced", or "fast".');
    }
    safetyGuard.setLevel(level as SafetyLevel);
    return wrapToolResult({ success: true, level: safetyGuard.getLevel() });
  });

  handlers.set("get_safety_level", async () => {
    return wrapToolResult({ success: true, level: safetyGuard.getLevel() });
  });

  handlers.set("get_operation_classification", async (args) => {
    const toolName = args?.tool as string;
    if (!toolName) {
      return wrapError("Missing required parameter: tool");
    }
    const toolClassification = safetyGuard.classifyTool(toolName);
    return wrapToolResult({ success: true, tool: toolName, classification: toolClassification });
  });

  // --- Extension tools ---

  handlers.set("scan_extensions", async (args) => {
    const scanPath = (args?.path as string) || projectPath || process.cwd();
    try {
      const discovered = await extensionManager.scanForExtensions(scanPath);
      extensionManager.registerDiscoveredTools(registry);
      return wrapToolResult({ success: true, count: discovered.length, extensions: discovered });
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("list_extensions", async () => {
    const extensions = extensionManager.getExtensions();
    return wrapToolResult({ success: true, count: extensions.length, extensions });
  });

  handlers.set("reload_extensions", async () => {
    const reloadPath = projectPath || process.cwd();
    try {
      const discovered = await extensionManager.scanForExtensions(reloadPath);
      extensionManager.registerDiscoveredTools(registry);
      return wrapToolResult({ success: true, count: discovered.length, extensions: discovered });
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  // --- Asset generation tools ---

  handlers.set("generate_3d_model", async (args) => {
    try {
      const prompt = args?.prompt as string;
      if (!prompt) {
        return wrapError("Missing required parameter: prompt");
      }
      const result = await assetGeneration.generateMesh(prompt, {
        provider: (args?.provider as MeshProvider) || undefined,
        format: (args?.format as string) || undefined,
        polycount: (args?.polycount as number) || undefined,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("generate_texture", async (args) => {
    try {
      const prompt = args?.prompt as string;
      if (!prompt) {
        return wrapError("Missing required parameter: prompt");
      }
      const result = await assetGeneration.generateTexture(prompt, {
        provider: (args?.provider as TextureProvider) || undefined,
        type: (args?.type as TextureType) || undefined,
        width: (args?.width as number) || undefined,
        height: (args?.height as number) || undefined,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("generate_audio", async (args) => {
    try {
      const prompt = args?.prompt as string;
      if (!prompt) {
        return wrapError("Missing required parameter: prompt");
      }
      const result = await assetGeneration.generateAudio(prompt, {
        provider: (args?.provider as AudioProvider) || undefined,
        type: (args?.type as AudioType) || undefined,
        duration: (args?.duration as number) || undefined,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("generate_skybox", async (args) => {
    try {
      const prompt = args?.prompt as string;
      if (!prompt) {
        return wrapError("Missing required parameter: prompt");
      }
      const result = await assetGeneration.generateSkybox(prompt, {
        provider: (args?.provider as SkyboxProvider) || undefined,
        style: (args?.style as string) || undefined,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("get_generation_providers", async () => {
    const status = assetGeneration.getProviderStatus();
    return wrapToolResult({ success: true, providers: status });
  });

  // --- Copilot tools ---

  handlers.set("get_copilot_manifest", async () => {
    const manifest = getCopilotToolManifest(registry);
    return wrapToolResult(manifest);
  });

  // --- Game Studios integration tools ---

  handlers.set("setup_game_studios", async (args) => {
    try {
      const gsProjectPath = args?.projectPath as string;
      const engine = args?.engine as "unity" | "blender" | "godot";
      if (!gsProjectPath || !engine) {
        return wrapError("Missing required parameters: projectPath and engine");
      }
      if (engine !== "unity" && engine !== "blender" && engine !== "godot") {
        return wrapError('Invalid engine. Must be "unity", "blender", or "godot".');
      }
      const config = gameStudiosBridge.generateStudioConfig(engine);
      return wrapToolResult({ success: true, projectPath: gsProjectPath, engine, config });
    } catch (err) {
      return wrapError(extractErrorMessage(err));
    }
  });

  handlers.set("get_agent_tools", async (args) => {
    const agentRole = args?.agent as string;
    if (!agentRole) {
      return wrapError("Missing required parameter: agent");
    }
    const permissions = gameStudiosBridge.generateAgentPermissions(agentRole);
    if (!permissions) {
      return wrapError(`Unknown agent role: "${agentRole}". Use get_studio_status to see available roles.`);
    }
    return wrapToolResult({ success: true, ...permissions });
  });

  handlers.set("get_studio_status", async () => {
    const engines = {
      unity: unityAdapter.isConnected(),
      blender: blenderAdapter.isConnected(),
      godot: godotAdapter.isConnected(),
    };
    const roles = gameStudiosBridge.getAgentRoles();
    const workflows = Object.keys(gameStudiosBridge.getWorkflowIntegration());
    const toolCount = registry.getTools().length;
    return wrapToolResult({
      success: true,
      engines,
      agentRoles: roles,
      workflows,
      toolCount,
    });
  });

  handlers.set("run_studio_workflow", async (args) => {
    const workflowName = args?.workflow as string;
    if (!workflowName) {
      return wrapError("Missing required parameter: workflow");
    }
    const workflow = gameStudiosBridge.getWorkflow(workflowName);
    if (!workflow) {
      const available = Object.keys(gameStudiosBridge.getWorkflowIntegration());
      return wrapError(`Unknown workflow: "${workflowName}". Available: ${available.join(", ")}`);
    }
    const workflowParams = (args?.params as Record<string, unknown>) || {};
    return wrapToolResult({
      success: true,
      workflow: workflow.name,
      description: workflow.description,
      agents: workflow.agents,
      steps: workflow.steps,
      params: workflowParams,
    });
  });

  return handlers;
}
