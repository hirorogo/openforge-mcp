import { ToolDefinition } from "../../registry.js";

const vrcPerformanceTools: ToolDefinition[] = [
  {
    name: "check_avatar_rank",
    description:
      "Calculate VRChat performance rank based on official limits. Returns Excellent/Good/Medium/Poor/VeryPoor with per-category breakdown for polygons, materials, bones, and PhysBones.",
    category: "vrc-performance",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description:
            "Avatar root GameObject name or ID. If omitted, auto-detects the avatar in the scene.",
        },
      },
      required: [],
    },
  },
  {
    name: "count_polygons",
    description:
      "Count total triangle/polygon count for the selected object or all objects in the scene. Returns per-mesh breakdown.",
    category: "vrc-performance",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description:
            "GameObject name or ID to count polygons for. If omitted, counts all objects in the scene.",
        },
      },
      required: [],
    },
  },
  {
    name: "count_materials",
    description:
      "Count unique materials and total material slots across all renderers. Lists each material with its shader.",
    category: "vrc-performance",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description:
            "GameObject name or ID. If omitted, counts across the entire scene.",
        },
      },
      required: [],
    },
  },
  {
    name: "count_bones",
    description:
      "Count total unique bones in the armature across all skinned mesh renderers. Returns per-mesh bone counts.",
    category: "vrc-performance",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description:
            "GameObject name or ID. If omitted, counts across the entire scene.",
        },
      },
      required: [],
    },
  },
  {
    name: "count_physbones",
    description:
      "Count VRCPhysBone components and the total number of transforms affected by them.",
    category: "vrc-performance",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description:
            "Avatar root GameObject name or ID. If omitted, auto-detects.",
        },
      },
      required: [],
    },
  },
  {
    name: "suggest_optimizations",
    description:
      "Analyze current avatar stats and suggest specific actions to improve VRChat performance rank. Provides concrete numbers (e.g., 'Reduce polygons by 5000 to reach Good rank').",
    category: "vrc-performance",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description:
            "Avatar root GameObject name or ID. If omitted, auto-detects.",
        },
      },
      required: [],
    },
  },
  {
    name: "auto_optimize_avatar",
    description:
      "Run an automated optimization pipeline on an avatar: merge meshes sharing materials, prepare texture atlas, remove unused bones, and set up LOD. Returns before/after comparison.",
    category: "vrc-performance",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description:
            "Avatar root GameObject name or ID. If omitted, auto-detects.",
        },
      },
      required: [],
    },
  },
  {
    name: "compare_before_after",
    description:
      "Show performance comparison. First call takes a snapshot of current stats; second call compares current stats against the snapshot. Resets after comparison.",
    category: "vrc-performance",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description:
            "Avatar root GameObject name or ID. If omitted, counts the whole scene.",
        },
      },
      required: [],
    },
  },
];

export default vrcPerformanceTools;
