import * as fs from "node:fs/promises";
import * as path from "node:path";
import yaml from "js-yaml";
import { ToolRouter, ExecuteResult } from "./router.js";
import { ToolRegistry } from "./registry.js";

export interface RecipeStep {
  tool: string;
  params?: Record<string, unknown>;
}

export interface Recipe {
  name: string;
  description: string;
  target: "unity" | "blender";
  steps: RecipeStep[];
}

export interface RecipeExecutionResult {
  success: boolean;
  recipeName: string;
  totalSteps: number;
  completedSteps: number;
  results: ExecuteResult[];
  error?: string;
}

export interface RecipeFileInfo {
  name: string;
  filePath: string;
  description: string;
  target: string;
  stepCount: number;
}

export interface RecipeValidationResult {
  valid: boolean;
  errors: string[];
}

export class RecipeEngine {
  private router: ToolRouter;
  private registry: ToolRegistry;

  constructor(router: ToolRouter, registry: ToolRegistry) {
    this.router = router;
    this.registry = registry;
  }

  loadRecipe(yamlString: string): Recipe {
    let parsed: unknown;
    try {
      parsed = yaml.load(yamlString);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse YAML: ${message}`);
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid recipe: YAML must parse to an object.");
    }

    const obj = parsed as Record<string, unknown>;

    if (typeof obj.name !== "string" || obj.name.trim() === "") {
      throw new Error("Invalid recipe: missing or empty 'name' field.");
    }

    if (typeof obj.description !== "string") {
      throw new Error("Invalid recipe: missing 'description' field.");
    }

    if (obj.target !== "unity" && obj.target !== "blender") {
      throw new Error(
        `Invalid recipe: 'target' must be "unity" or "blender", got "${String(obj.target)}".`,
      );
    }

    if (!Array.isArray(obj.steps) || obj.steps.length === 0) {
      throw new Error("Invalid recipe: 'steps' must be a non-empty array.");
    }

    const steps: RecipeStep[] = [];
    for (let i = 0; i < obj.steps.length; i++) {
      const step = obj.steps[i] as Record<string, unknown>;
      if (!step || typeof step !== "object") {
        throw new Error(`Invalid recipe: step ${i} must be an object.`);
      }
      if (typeof step.tool !== "string" || step.tool.trim() === "") {
        throw new Error(`Invalid recipe: step ${i} missing or empty 'tool' field.`);
      }
      steps.push({
        tool: step.tool,
        params:
          step.params && typeof step.params === "object"
            ? (step.params as Record<string, unknown>)
            : undefined,
      });
    }

    return {
      name: obj.name,
      description: obj.description,
      target: obj.target,
      steps,
    };
  }

  async loadRecipeFromFile(filePath: string): Promise<Recipe> {
    const content = await fs.readFile(filePath, "utf-8");
    return this.loadRecipe(content);
  }

  validateRecipe(recipe: Recipe): RecipeValidationResult {
    const errors: string[] = [];

    for (let i = 0; i < recipe.steps.length; i++) {
      const step = recipe.steps[i];
      const toolDef = this.registry.getTool(recipe.target, step.tool);
      if (!toolDef) {
        const allTools = this.registry.getAllToolsUnfiltered();
        const existsButUnavailable = allTools.some(
          (t) => t.target === recipe.target && t.name === step.tool,
        );
        if (existsButUnavailable) {
          errors.push(
            `Step ${i}: tool "${step.tool}" exists but is not available in the current mode.`,
          );
        } else {
          errors.push(
            `Step ${i}: tool "${step.tool}" not found for target "${recipe.target}".`,
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async executeRecipe(
    recipe: Recipe,
    overrides?: Record<string, unknown>,
  ): Promise<RecipeExecutionResult> {
    const results: ExecuteResult[] = [];

    for (let i = 0; i < recipe.steps.length; i++) {
      const step = recipe.steps[i];
      let params = step.params ? { ...step.params } : {};

      if (overrides) {
        params = { ...params, ...overrides };
      }

      const result = await this.router.execute({
        target: recipe.target,
        tool: step.tool,
        args: Object.keys(params).length > 0 ? params : undefined,
      });

      results.push(result);

      if (!result.success) {
        return {
          success: false,
          recipeName: recipe.name,
          totalSteps: recipe.steps.length,
          completedSteps: i,
          results,
          error: `Step ${i} ("${step.tool}") failed: ${result.error}`,
        };
      }
    }

    return {
      success: true,
      recipeName: recipe.name,
      totalSteps: recipe.steps.length,
      completedSteps: recipe.steps.length,
      results,
    };
  }

  async listRecipes(directory: string): Promise<RecipeFileInfo[]> {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const recipes: RecipeFileInfo[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (ext !== ".yaml" && ext !== ".yml") continue;

      const filePath = path.join(directory, entry.name);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        const recipe = this.loadRecipe(content);
        recipes.push({
          name: recipe.name,
          filePath,
          description: recipe.description,
          target: recipe.target,
          stepCount: recipe.steps.length,
        });
      } catch {
        // Skip files that fail to parse as valid recipes
      }
    }

    return recipes;
  }
}
