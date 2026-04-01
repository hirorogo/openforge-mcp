import { ToolDefinition } from "../../registry.js";

const recipeTools: ToolDefinition[] = [
  {
    name: "run_recipe",
    description:
      "Run a multi-step recipe defined in YAML. Accepts either inline YAML content or a file path to a .yaml file. Executes all steps sequentially on the target application.",
    category: "recipe",
    target: "unity",
    parameters: {
      type: "object",
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
    description:
      "List available recipe files in a directory. Scans for .yaml and .yml files and returns their names, descriptions, and step counts.",
    category: "recipe",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description: "Directory path to scan for recipe files. Defaults to the current working directory.",
        },
      },
      required: [],
    },
  },
  {
    name: "validate_recipe",
    description:
      "Validate a YAML recipe definition. Checks that all referenced tools exist and are available in the current mode.",
    category: "recipe",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        recipe: {
          type: "string",
          description: "YAML recipe content to validate.",
        },
      },
      required: ["recipe"],
    },
  },
];

export default recipeTools;
