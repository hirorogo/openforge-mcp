import { ToolDefinition } from "../../registry.js";

const collectionTools: ToolDefinition[] = [
  {
    name: "create_collection",
    description: "Create a new collection in the Blender scene",
    category: "collection",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name for the new collection",
        },
        parent_name: {
          type: "string",
          description: "Parent collection name (omit for scene root)",
        },
        color_tag: {
          type: "string",
          enum: ["NONE", "COLOR_01", "COLOR_02", "COLOR_03", "COLOR_04", "COLOR_05", "COLOR_06", "COLOR_07", "COLOR_08"],
          description: "Color tag for the collection",
          default: "NONE",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "move_to_collection",
    description: "Move objects into a target collection",
    category: "collection",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        names: {
          type: "array",
          items: { type: "string" },
          description: "Object names to move",
        },
        collection_name: {
          type: "string",
          description: "Target collection name",
        },
        remove_from_others: {
          type: "boolean",
          description: "Unlink objects from all other collections first",
          default: true,
        },
      },
      required: ["names", "collection_name"],
    },
  },
  {
    name: "list_collections",
    description: "List all collections in the current scene with object counts",
    category: "collection",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        include_hierarchy: {
          type: "boolean",
          description: "Return nested hierarchy instead of flat list",
          default: true,
        },
      },
      required: [],
    },
  },
  {
    name: "toggle_collection",
    description: "Show or hide a collection in the viewport",
    category: "collection",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Collection name",
        },
        visible: {
          type: "boolean",
          description: "Set visibility (omit to toggle)",
        },
        exclude: {
          type: "boolean",
          description: "Set the exclude-from-view-layer flag",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "merge_collections",
    description: "Merge multiple source collections into one target collection",
    category: "collection",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        source_names: {
          type: "array",
          items: { type: "string" },
          description: "Names of collections to merge from",
        },
        target_name: {
          type: "string",
          description: "Destination collection name",
        },
        delete_sources: {
          type: "boolean",
          description: "Remove source collections after merging",
          default: true,
        },
      },
      required: ["source_names", "target_name"],
    },
  },
  {
    name: "organize_by_type",
    description: "Auto-organize all scene objects into collections by their object type",
    category: "collection",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        prefix: {
          type: "string",
          description: "Optional prefix for collection names",
        },
        types: {
          type: "array",
          items: { type: "string" },
          description: "Object types to organize (omit for all types)",
        },
      },
      required: [],
    },
  },
];

export default collectionTools;
