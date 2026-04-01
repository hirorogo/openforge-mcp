import { ToolDefinition } from "../../registry.js";

const prefabTools: ToolDefinition[] = [
  {
    name: "create_prefab",
    description: "Save a scene GameObject as a prefab asset",
    category: "prefab",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID to save as prefab" },
        path: { type: "string", description: "Asset path to save the prefab" },
      },
      required: ["target"],
    },
  },
  {
    name: "instantiate_prefab",
    description: "Instantiate a prefab asset into the scene",
    category: "prefab",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Asset path of the prefab" },
        name: { type: "string", description: "Name for the instance" },
        position: { type: "string", description: "Position as 'x,y,z'" },
        rotation: { type: "string", description: "Rotation as 'x,y,z'" },
        scale: { type: "string", description: "Scale as 'x,y,z'" },
        parent: { type: "string", description: "Parent GameObject name or ID" },
      },
      required: ["path"],
    },
  },
  {
    name: "apply_prefab_overrides",
    description: "Apply all overrides from a prefab instance back to the prefab asset",
    category: "prefab",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Prefab instance GameObject name or ID" },
      },
      required: ["target"],
    },
  },
  {
    name: "revert_prefab",
    description: "Revert a prefab instance to match its prefab asset",
    category: "prefab",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Prefab instance GameObject name or ID" },
      },
      required: ["target"],
    },
  },
  {
    name: "unpack_prefab",
    description: "Unpack a prefab instance, breaking its prefab connection",
    category: "prefab",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Prefab instance GameObject name or ID" },
        mode: { type: "string", enum: ["root", "completely"], description: "Unpack mode" },
      },
      required: ["target"],
    },
  },
  {
    name: "get_prefab_info",
    description: "Get prefab status and override information for a scene object or prefab asset",
    category: "prefab",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Scene GameObject name or ID" },
        path: { type: "string", description: "Asset path of a prefab (alternative to target)" },
      },
      required: [],
    },
  },
  {
    name: "create_prefab_variant",
    description: "Create a prefab variant based on an existing prefab",
    category: "prefab",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        base_prefab: { type: "string", description: "Asset path of the base prefab" },
        path: { type: "string", description: "Asset path for the new variant" },
      },
      required: ["base_prefab", "path"],
    },
  },
  {
    name: "save_prefab",
    description: "Save a GameObject as a prefab or apply changes to an existing prefab",
    category: "prefab",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        path: { type: "string", description: "Asset path (for non-prefab instances)" },
      },
      required: ["target"],
    },
  },
];

export default prefabTools;
