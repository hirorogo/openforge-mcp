import { ToolDefinition } from "../../registry.js";

const sketchfabTools: ToolDefinition[] = [
  {
    name: "search_sketchfab",
    description:
      "Search for 3D models on Sketchfab by keyword with filtering and sorting options",
    category: "sketchfab",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keyword",
        },
        downloadable: {
          type: "boolean",
          description: "If true, only return downloadable models",
          default: true,
        },
        sort_by: {
          type: "string",
          enum: ["-likeCount", "-viewCount", "-createdAt", "-publishedAt"],
          description: "Sort order for results",
          default: "-likeCount",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (1-24)",
          default: 20,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "download_sketchfab",
    description:
      "Download a Sketchfab model archive (requires API token). Returns the path to the extracted model file.",
    category: "sketchfab",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        uid: {
          type: "string",
          description: "The Sketchfab model UID",
        },
      },
      required: ["uid"],
    },
  },
  {
    name: "import_sketchfab",
    description:
      "Download a Sketchfab model and import it directly into the current Blender scene (requires API token)",
    category: "sketchfab",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        uid: {
          type: "string",
          description: "The Sketchfab model UID",
        },
      },
      required: ["uid"],
    },
  },
  {
    name: "get_sketchfab_info",
    description:
      "Get detailed information about a Sketchfab model including vertex count, license, and tags",
    category: "sketchfab",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        uid: {
          type: "string",
          description: "The Sketchfab model UID",
        },
      },
      required: ["uid"],
    },
  },
  {
    name: "list_sketchfab_collections",
    description:
      "List the authenticated user's Sketchfab collections (requires API token)",
    category: "sketchfab",
    target: "blender",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "set_sketchfab_token",
    description:
      "Store a Sketchfab API token for the current session. Obtain your token from https://sketchfab.com/settings/password",
    category: "sketchfab",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "Your Sketchfab API token",
        },
      },
      required: ["token"],
    },
  },
];

export default sketchfabTools;
