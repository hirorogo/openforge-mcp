import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ToolRegistry, ToolMode } from "./registry.js";
import { ToolRouter } from "./router.js";
import { UnityAdapter } from "./adapters/unity.js";
import { BlenderAdapter } from "./adapters/blender.js";
import { GodotAdapter } from "./adapters/godot.js";
import { VersionControl } from "./version-control.js";
import { TransactionManager } from "./transaction.js";
import { Pipeline } from "./pipeline.js";
import { RecipeEngine } from "./recipe.js";
import { OperationLog } from "./operation-log.js";
import { Dashboard } from "./dashboard.js";

import { SafetyGuard, SafetyLevel } from "./safety.js";
import { ExtensionManager } from "./extension.js";
import { getCopilotToolManifest } from "./copilot.js";

import unitySceneTools from "./tools/unity/scene.js";
import unityGameObjectTools from "./tools/unity/gameobject.js";
import unityMaterialTools from "./tools/unity/material.js";
import unityScriptTools from "./tools/unity/script.js";
import unityAnimationTools from "./tools/unity/animation.js";
import unityPhysicsTools from "./tools/unity/physics.js";
import unityUITools from "./tools/unity/ui.js";
import unityLightingTools from "./tools/unity/lighting.js";
import unityCameraTools from "./tools/unity/camera.js";
import unityPrefabTools from "./tools/unity/prefab.js";
import unityAudioTools from "./tools/unity/audio.js";
import unityTerrainTools from "./tools/unity/terrain.js";
import unityNavmeshTools from "./tools/unity/navmesh.js";
import unityVFXTools from "./tools/unity/vfx.js";
import unityOptimizationTools from "./tools/unity/optimization.js";
import unityBuildTools from "./tools/unity/build.js";
import unityPlaytestTools from "./tools/unity/playtest.js";
import unityInputTools from "./tools/unity/input.js";
import unityTemplateTools from "./tools/unity/template.js";
import unityWeatherTools from "./tools/unity/weather.js";
import unityTimelineTools from "./tools/unity/timeline.js";
import unityMLAgentsTools from "./tools/unity/ml-agents.js";
import unityProBuilderTools from "./tools/unity/probuilder.js";
import unityPackageManagerTools from "./tools/unity/package-manager.js";
import unityScriptableObjectTools from "./tools/unity/scriptable-object.js";
import unityProfilerTools from "./tools/unity/profiler.js";
import unityGOAPTools from "./tools/unity/goap.js";
import unityRuntimeTools from "./tools/unity/runtime.js";
import unityAdvancedAudioTools from "./tools/unity/advanced-audio.js";
import unityVrcPerformanceTools from "./tools/unity/vrc-performance.js";
import unityVRChatSdkTools from "./tools/unity/vrchat-sdk.js";
import unityPhysBoneTools from "./tools/unity/physbone.js";
import unityModularAvatarTools from "./tools/unity/modular-avatar.js";
import unityFaceEmoTools from "./tools/unity/faceemo.js";
import unityTextureEditTools from "./tools/unity/texture-edit.js";
import blenderObjectTools from "./tools/blender/object.js";
import blenderMeshTools from "./tools/blender/mesh.js";
import blenderMaterialTools from "./tools/blender/material.js";
import blenderBakeTools from "./tools/blender/bake.js";
import blenderBatchTools from "./tools/blender/batch.js";
import blenderGameAssetTools from "./tools/blender/game_asset.js";
import blenderInspectionTools from "./tools/blender/inspection.js";
import blenderMeshRepairTools from "./tools/blender/mesh_repair.js";
import blenderProceduralTools from "./tools/blender/procedural.js";
import blenderCollectionTools from "./tools/blender/collection.js";
import blenderMeshAdvancedTools from "./tools/blender/mesh_advanced.js";
import blenderAnimationAdvancedTools from "./tools/blender/animation_advanced.js";
import blenderArmatureAdvancedTools from "./tools/blender/armature_advanced.js";
import blenderModifierExtendedTools from "./tools/blender/modifier_extended.js";
import blenderUvAdvancedTools from "./tools/blender/uv_advanced.js";
import blenderMaterialAdvancedTools from "./tools/blender/material_advanced.js";
import blenderAccessoryTools from "./tools/blender/accessory.js";
import blenderAvatarTools from "./tools/blender/avatar.js";
import blenderBodyShapeTools from "./tools/blender/body_shape.js";
import blenderClothFittingTools from "./tools/blender/cloth_fitting.js";
import blenderShapeKeyTools from "./tools/blender/shape_key.js";
import blenderWeightPaintTools from "./tools/blender/weight_paint.js";
import blenderVrmExportTools from "./tools/blender/vrm_export.js";
import blenderPolyhavenTools from "./tools/blender/polyhaven.js";
import blenderSketchfabTools from "./tools/blender/sketchfab.js";
import blenderPythonExecTools from "./tools/blender/python_exec.js";
import blenderHunyuan3dTools from "./tools/blender/hunyuan3d.js";
import godotNodeTools from "./tools/godot/node.js";
import godotResourceTools from "./tools/godot/resource.js";
import versionControlToolDefs from "./tools/system/version-control.js";
import transactionToolDefs from "./tools/system/transaction.js";
import pipelineToolDefs from "./tools/system/pipeline.js";
import recipeToolDefs from "./tools/system/recipe.js";
import safetyToolDefs from "./tools/system/safety.js";
import extensionToolDefs from "./tools/system/extension.js";
import assetGenerationToolDefs from "./tools/system/asset-generation.js";
import gameStudiosToolDefs from "./tools/system/game-studios.js";
import { AssetGeneration } from "./asset-generation.js";
import { GameStudiosBridge } from "./game-studios.js";

import http from "node:http";

export interface ServerOptions {
  mode: ToolMode;
  transport: "stdio" | "sse";
  ssePort?: number;
  projectPath?: string;
  autoSave?: boolean;
}

export function createOpenForgeServer(options: ServerOptions): {
  server: Server;
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
  dashboard: Dashboard;
  start: () => Promise<void>;
} {
  const registry = new ToolRegistry();
  registry.setMode(options.mode);
  const operationLog = new OperationLog();

  // Register all tool definitions
  registry.registerTools(unitySceneTools);
  registry.registerTools(unityGameObjectTools);
  registry.registerTools(unityMaterialTools);
  registry.registerTools(unityScriptTools);
  registry.registerTools(unityAnimationTools);
  registry.registerTools(unityPhysicsTools);
  registry.registerTools(unityUITools);
  registry.registerTools(unityLightingTools);
  registry.registerTools(unityCameraTools);
  registry.registerTools(unityPrefabTools);
  registry.registerTools(unityAudioTools);
  registry.registerTools(unityTerrainTools);
  registry.registerTools(unityNavmeshTools);
  registry.registerTools(unityVFXTools);
  registry.registerTools(unityOptimizationTools);
  registry.registerTools(unityBuildTools);
  registry.registerTools(unityPlaytestTools);
  registry.registerTools(unityInputTools);
  registry.registerTools(unityTemplateTools);
  registry.registerTools(unityWeatherTools);
  registry.registerTools(unityTimelineTools);
  registry.registerTools(unityMLAgentsTools);
  registry.registerTools(unityProBuilderTools);
  registry.registerTools(unityPackageManagerTools);
  registry.registerTools(unityScriptableObjectTools);
  registry.registerTools(unityProfilerTools);
  registry.registerTools(unityGOAPTools);
  registry.registerTools(unityRuntimeTools);
  registry.registerTools(unityAdvancedAudioTools);
  registry.registerTools(unityVrcPerformanceTools);
  registry.registerTools(unityVRChatSdkTools);
  registry.registerTools(unityPhysBoneTools);
  registry.registerTools(unityModularAvatarTools);
  registry.registerTools(unityFaceEmoTools);
  registry.registerTools(unityTextureEditTools);
  registry.registerTools(blenderObjectTools);
  registry.registerTools(blenderMeshTools);
  registry.registerTools(blenderMaterialTools);
  registry.registerTools(blenderBakeTools);
  registry.registerTools(blenderBatchTools);
  registry.registerTools(blenderGameAssetTools);
  registry.registerTools(blenderInspectionTools);
  registry.registerTools(blenderMeshRepairTools);
  registry.registerTools(blenderProceduralTools);
  registry.registerTools(blenderCollectionTools);
  registry.registerTools(blenderMeshAdvancedTools);
  registry.registerTools(blenderAnimationAdvancedTools);
  registry.registerTools(blenderArmatureAdvancedTools);
  registry.registerTools(blenderModifierExtendedTools);
  registry.registerTools(blenderUvAdvancedTools);
  registry.registerTools(blenderMaterialAdvancedTools);
  registry.registerTools(blenderAccessoryTools);
  registry.registerTools(blenderAvatarTools);
  registry.registerTools(blenderBodyShapeTools);
  registry.registerTools(blenderClothFittingTools);
  registry.registerTools(blenderShapeKeyTools);
  registry.registerTools(blenderWeightPaintTools);
  registry.registerTools(blenderVrmExportTools);
  registry.registerTools(blenderPolyhavenTools);
  registry.registerTools(blenderSketchfabTools);
  registry.registerTools(blenderPythonExecTools);
  registry.registerTools(blenderHunyuan3dTools);
  registry.registerTools(godotNodeTools);
  registry.registerTools(godotResourceTools);
  registry.registerTools(versionControlToolDefs);
  registry.registerTools(transactionToolDefs);
  registry.registerTools(pipelineToolDefs);
  registry.registerTools(recipeToolDefs);
  registry.registerTools(safetyToolDefs);
  registry.registerTools(extensionToolDefs);
  registry.registerTools(assetGenerationToolDefs);
  registry.registerTools(gameStudiosToolDefs);

  const unityAdapter = new UnityAdapter();
  const blenderAdapter = new BlenderAdapter();
  const godotAdapter = new GodotAdapter();
  const router = new ToolRouter(registry, unityAdapter, blenderAdapter, godotAdapter);

  // Version control and transaction systems
  const versionControl = options.projectPath
    ? new VersionControl(options.projectPath)
    : null;

  const transactionManager = new TransactionManager({
    autoSave: options.autoSave ?? false,
    versionControl: versionControl ?? undefined,
  });

  const pipeline = new Pipeline(unityAdapter, blenderAdapter);
  const recipeEngine = new RecipeEngine(router, registry);

  const safetyGuard = new SafetyGuard();
  if (versionControl) {
    safetyGuard.setVersionControl(versionControl);
  }

  const extensionManager = new ExtensionManager();
  const assetGeneration = new AssetGeneration();
  const gameStudiosBridge = new GameStudiosBridge();

  const dashboard = new Dashboard({
    registry,
    operationLog,
    unityAdapter,
    blenderAdapter,
    godotAdapter,
    transactionManager,
  });

  const server = new Server(
    {
      name: "openforge-mcp",
      version: "0.0.1",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  );

  // --- Tool handlers ---

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
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
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "list_categories": {
        const target = (args?.target as string) || undefined;
        const categories = registry.getCategories(target);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ mode: registry.getMode(), categories }, null, 2),
            },
          ],
        };
      }

      case "list_tools": {
        const target = (args?.target as string) || undefined;
        const category = (args?.category as string) || undefined;
        const tools = registry.getTools(target, category).map((t) => ({
          name: t.name,
          target: t.target,
          category: t.category,
          description: t.description,
          parameters: t.parameters,
        }));
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ mode: registry.getMode(), toolCount: tools.length, tools }, null, 2),
            },
          ],
        };
      }

      case "execute": {
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
              return {
                content: [
                  {
                    type: "text" as const,
                    text: JSON.stringify({
                      success: false,
                      error: `Tool "${tool}" not found in the registry for target "${target}".`,
                    }),
                  },
                ],
                isError: true,
              };
            }
          }
        }

        // Safety guard check
        const safetyCheck = safetyGuard.checkOperation(tool, toolArgs);
        if (safetyCheck.requiresConfirmation) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  requiresConfirmation: true,
                  reason: safetyCheck.reason,
                  tool,
                  target,
                }, null, 2),
              },
            ],
          };
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
      }

      // --- Version control tools ---

      case "save_project": {
        if (!versionControl) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "No project path configured. Use --project-path to set one." }) }],
            isError: true,
          };
        }
        try {
          const message = (args?.message as string) || undefined;
          const saveInfo = await versionControl.save(message);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: true, save: saveInfo }, null, 2) }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "list_saves": {
        if (!versionControl) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "No project path configured. Use --project-path to set one." }) }],
            isError: true,
          };
        }
        try {
          const limit = (args?.limit as number) || undefined;
          const saves = await versionControl.listSaves(limit);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: true, saves }, null, 2) }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "restore_save": {
        if (!versionControl) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "No project path configured. Use --project-path to set one." }) }],
            isError: true,
          };
        }
        try {
          const saveId = args?.saveId as string;
          if (!saveId) {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameter: saveId" }) }],
              isError: true,
            };
          }
          const result = await versionControl.restore(saveId);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: true, ...result }, null, 2) }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "get_project_status": {
        if (!versionControl) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "No project path configured. Use --project-path to set one." }) }],
            isError: true,
          };
        }
        try {
          const status = await versionControl.getStatus();
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: true, status }, null, 2) }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "create_branch": {
        if (!versionControl) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "No project path configured. Use --project-path to set one." }) }],
            isError: true,
          };
        }
        try {
          const branchName = args?.name as string;
          if (!branchName) {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameter: name" }) }],
              isError: true,
            };
          }
          const result = await versionControl.createBranch(branchName);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: true, ...result }, null, 2) }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "merge_branch": {
        if (!versionControl) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "No project path configured. Use --project-path to set one." }) }],
            isError: true,
          };
        }
        try {
          const branchName = args?.name as string;
          if (!branchName) {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameter: name" }) }],
              isError: true,
            };
          }
          const result = await versionControl.mergeBranch(branchName);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: true, ...result }, null, 2) }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      // --- Transaction tools ---

      case "begin_transaction": {
        try {
          const label = args?.label as string;
          if (!label) {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameter: label" }) }],
              isError: true,
            };
          }
          const info = transactionManager.begin(label);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: true, transaction: info }, null, 2) }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "commit_transaction": {
        try {
          const result = await transactionManager.commit();
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: true, ...result }, null, 2) }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "rollback_transaction": {
        try {
          const result = transactionManager.rollback();
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: true, ...result }, null, 2) }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      // --- Pipeline tools ---

      case "transfer_asset": {
        try {
          const from = args?.from as "blender" | "unity";
          const to = args?.to as "blender" | "unity";
          const format = args?.format as "fbx" | "gltf" | "obj" | "vrm";
          if (!from || !to || !format) {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameters: from, to, format" }) }],
              isError: true,
            };
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
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "get_pipeline_status": {
        const status = pipeline.getStatus();
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: true, adapters: status }, null, 2) }],
        };
      }

      // --- Recipe tools ---

      case "run_recipe": {
        try {
          const recipeInput = args?.recipe as string;
          if (!recipeInput) {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameter: recipe" }) }],
              isError: true,
            };
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
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "list_recipes": {
        try {
          const directory = (args?.directory as string) || process.cwd();
          const recipes = await recipeEngine.listRecipes(directory);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: true, recipes }, null, 2) }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "validate_recipe": {
        try {
          const recipeYaml = args?.recipe as string;
          if (!recipeYaml) {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameter: recipe" }) }],
              isError: true,
            };
          }
          const recipe = recipeEngine.loadRecipe(recipeYaml);
          const validation = recipeEngine.validateRecipe(recipe);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: true, recipeName: recipe.name, ...validation }, null, 2) }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      // --- Safety tools ---

      case "set_safety_level": {
        const level = args?.level as string;
        if (level !== "cautious" && level !== "balanced" && level !== "fast") {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: 'Invalid level. Must be "cautious", "balanced", or "fast".' }) }],
            isError: true,
          };
        }
        safetyGuard.setLevel(level as SafetyLevel);
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: true, level: safetyGuard.getLevel() }, null, 2) }],
        };
      }

      case "get_safety_level": {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: true, level: safetyGuard.getLevel() }, null, 2) }],
        };
      }

      case "get_operation_classification": {
        const toolName = args?.tool as string;
        if (!toolName) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameter: tool" }) }],
            isError: true,
          };
        }
        const toolClassification = safetyGuard.classifyTool(toolName);
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: true, tool: toolName, classification: toolClassification }, null, 2) }],
        };
      }

      // --- Extension tools ---

      case "scan_extensions": {
        const scanPath = (args?.path as string) || options.projectPath || process.cwd();
        try {
          const discovered = await extensionManager.scanForExtensions(scanPath);
          extensionManager.registerDiscoveredTools(registry);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: true, count: discovered.length, extensions: discovered }, null, 2) }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "list_extensions": {
        const extensions = extensionManager.getExtensions();
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: true, count: extensions.length, extensions }, null, 2) }],
        };
      }

      case "reload_extensions": {
        const reloadPath = options.projectPath || process.cwd();
        try {
          const discovered = await extensionManager.scanForExtensions(reloadPath);
          extensionManager.registerDiscoveredTools(registry);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: true, count: discovered.length, extensions: discovered }, null, 2) }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      // --- Asset generation tools ---

      case "generate_3d_model": {
        try {
          const prompt = args?.prompt as string;
          if (!prompt) {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameter: prompt" }) }],
              isError: true,
            };
          }
          const result = await assetGeneration.generateMesh(prompt, {
            provider: (args?.provider as any) || undefined,
            format: (args?.format as string) || undefined,
            polycount: (args?.polycount as number) || undefined,
          });
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "generate_texture": {
        try {
          const prompt = args?.prompt as string;
          if (!prompt) {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameter: prompt" }) }],
              isError: true,
            };
          }
          const result = await assetGeneration.generateTexture(prompt, {
            provider: (args?.provider as any) || undefined,
            type: (args?.type as any) || undefined,
            width: (args?.width as number) || undefined,
            height: (args?.height as number) || undefined,
          });
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "generate_audio": {
        try {
          const prompt = args?.prompt as string;
          if (!prompt) {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameter: prompt" }) }],
              isError: true,
            };
          }
          const result = await assetGeneration.generateAudio(prompt, {
            provider: (args?.provider as any) || undefined,
            type: (args?.type as any) || undefined,
            duration: (args?.duration as number) || undefined,
          });
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "generate_skybox": {
        try {
          const prompt = args?.prompt as string;
          if (!prompt) {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameter: prompt" }) }],
              isError: true,
            };
          }
          const result = await assetGeneration.generateSkybox(prompt, {
            provider: (args?.provider as any) || undefined,
            style: (args?.style as string) || undefined,
          });
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "get_generation_providers": {
        const status = assetGeneration.getProviderStatus();
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: true, providers: status }, null, 2) }],
        };
      }

      // --- Copilot tools ---

      case "get_copilot_manifest": {
        const manifest = getCopilotToolManifest(registry);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(manifest, null, 2) }],
        };
      }

      // --- Game Studios integration tools ---

      case "setup_game_studios": {
        try {
          const projectPath = args?.projectPath as string;
          const engine = args?.engine as "unity" | "blender" | "godot";
          if (!projectPath || !engine) {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameters: projectPath and engine" }) }],
              isError: true,
            };
          }
          if (engine !== "unity" && engine !== "blender" && engine !== "godot") {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: 'Invalid engine. Must be "unity", "blender", or "godot".' }) }],
              isError: true,
            };
          }
          const config = gameStudiosBridge.generateStudioConfig(engine);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: true, projectPath, engine, config }, null, 2) }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }) }],
            isError: true,
          };
        }
      }

      case "get_agent_tools": {
        const agentRole = args?.agent as string;
        if (!agentRole) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameter: agent" }) }],
            isError: true,
          };
        }
        const permissions = gameStudiosBridge.generateAgentPermissions(agentRole);
        if (!permissions) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: `Unknown agent role: "${agentRole}". Use get_studio_status to see available roles.` }) }],
            isError: true,
          };
        }
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: true, ...permissions }, null, 2) }],
        };
      }

      case "get_studio_status": {
        const engines = {
          unity: unityAdapter.isConnected(),
          blender: blenderAdapter.isConnected(),
          godot: godotAdapter.isConnected(),
        };
        const roles = gameStudiosBridge.getAgentRoles();
        const workflows = Object.keys(gameStudiosBridge.getWorkflowIntegration());
        const toolCount = registry.getTools().length;
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              engines,
              agentRoles: roles,
              workflows,
              toolCount,
            }, null, 2),
          }],
        };
      }

      case "run_studio_workflow": {
        const workflowName = args?.workflow as string;
        if (!workflowName) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "Missing required parameter: workflow" }) }],
            isError: true,
          };
        }
        const workflow = gameStudiosBridge.getWorkflow(workflowName);
        if (!workflow) {
          const available = Object.keys(gameStudiosBridge.getWorkflowIntegration());
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: `Unknown workflow: "${workflowName}". Available: ${available.join(", ")}` }) }],
            isError: true,
          };
        }
        const workflowParams = (args?.params as Record<string, unknown>) || {};
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              workflow: workflow.name,
              description: workflow.description,
              agents: workflow.agents,
              steps: workflow.steps,
              params: workflowParams,
            }, null, 2),
          }],
        };
      }

      default:
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: false, error: `Unknown tool: ${name}` }),
            },
          ],
          isError: true,
        };
    }
  });

  // --- Resource handlers ---

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: "scene://unity/hierarchy",
          name: "Unity Scene Hierarchy",
          description: "The current Unity scene hierarchy as a nested tree of GameObjects",
          mimeType: "application/json",
        },
        {
          uri: "scene://unity/console",
          name: "Unity Console Log",
          description: "Recent Unity Editor console log messages including errors, warnings, and info",
          mimeType: "application/json",
        },
        {
          uri: "scene://blender/objects",
          name: "Blender Scene Objects",
          description: "List of all objects in the current Blender scene with type and transform data",
          mimeType: "application/json",
        },
        {
          uri: "scene://godot/tree",
          name: "Godot Scene Tree",
          description: "The current Godot scene tree as a nested hierarchy of nodes",
          mimeType: "application/json",
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    switch (uri) {
      case "scene://unity/hierarchy": {
        if (!unityAdapter.isConnected()) {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({ error: "Unity is not connected" }),
              },
            ],
          };
        }
        try {
          const response = await unityAdapter.getHierarchy();
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(response.result ?? response.error, null, 2),
              },
            ],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ error: msg }) }],
          };
        }
      }

      case "scene://unity/console": {
        if (!unityAdapter.isConnected()) {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({ error: "Unity is not connected" }),
              },
            ],
          };
        }
        try {
          const response = await unityAdapter.getConsoleLog();
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(response.result ?? response.error, null, 2),
              },
            ],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ error: msg }) }],
          };
        }
      }

      case "scene://blender/objects": {
        if (!blenderAdapter.isConnected()) {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({ error: "Blender is not connected" }),
              },
            ],
          };
        }
        try {
          const response = await blenderAdapter.getObjects();
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(response.result ?? response.error, null, 2),
              },
            ],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ error: msg }) }],
          };
        }
      }

      case "scene://godot/tree": {
        if (!godotAdapter.isConnected()) {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({ error: "Godot is not connected" }),
              },
            ],
          };
        }
        try {
          const response = await godotAdapter.getSceneTree();
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(response.result ?? response.error, null, 2),
              },
            ],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ error: msg }) }],
          };
        }
      }

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });

  // --- Start function ---

  const start = async (): Promise<void> => {
    if (options.transport === "stdio") {
      const transport = new StdioServerTransport();
      await server.connect(transport);
    } else {
      const port = options.ssePort ?? 19820;
      let currentTransport: SSEServerTransport | null = null;

      const httpServer = http.createServer(async (req, res) => {
        if (req.method === "GET" && req.url === "/sse") {
          currentTransport = new SSEServerTransport("/messages", res);
          await server.connect(currentTransport);
        } else if (req.method === "POST" && req.url === "/messages") {
          if (currentTransport) {
            await currentTransport.handlePostMessage(req, res);
          } else {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "No active SSE connection" }));
          }
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      await new Promise<void>((resolve) => {
        httpServer.listen(port, () => {
          process.stderr.write(`OpenForge MCP SSE server listening on port ${port}\n`);
          resolve();
        });
      });
    }

    // Attempt to connect adapters in the background (non-blocking)
    unityAdapter.connect().catch(() => {
      process.stderr.write("Unity adapter: editor not available, will retry on demand\n");
    });
    blenderAdapter.connect().catch(() => {
      process.stderr.write("Blender adapter: editor not available, will retry on demand\n");
    });
    godotAdapter.connect().catch(() => {
      process.stderr.write("Godot adapter: editor not available, will retry on demand\n");
    });
  };

  return { server, registry, router, unityAdapter, blenderAdapter, godotAdapter, versionControl, transactionManager, pipeline, recipeEngine, safetyGuard, extensionManager, assetGeneration, gameStudiosBridge, operationLog, dashboard, start };
}
