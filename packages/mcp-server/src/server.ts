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
import godotNodeTools from "./tools/godot/node.js";
import godotResourceTools from "./tools/godot/resource.js";
import versionControlToolDefs from "./tools/system/version-control.js";
import transactionToolDefs from "./tools/system/transaction.js";
import pipelineToolDefs from "./tools/system/pipeline.js";
import recipeToolDefs from "./tools/system/recipe.js";

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
  start: () => Promise<void>;
} {
  const registry = new ToolRegistry();
  registry.setMode(options.mode);

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
  registry.registerTools(godotNodeTools);
  registry.registerTools(godotResourceTools);
  registry.registerTools(versionControlToolDefs);
  registry.registerTools(transactionToolDefs);
  registry.registerTools(pipelineToolDefs);
  registry.registerTools(recipeToolDefs);

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

        const result = await router.execute({ target, tool, args: toolArgs });
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

      // --- Copilot tools ---

      case "get_copilot_manifest": {
        const manifest = getCopilotToolManifest(registry);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(manifest, null, 2) }],
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

  return { server, registry, router, unityAdapter, blenderAdapter, godotAdapter, versionControl, transactionManager, pipeline, recipeEngine, start };
}
