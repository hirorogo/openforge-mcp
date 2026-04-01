/**
 * GameStudiosBridge -- Integration layer between OpenForge MCP and
 * Claude-Code-Game-Studios (https://github.com/Donchitos/Claude-Code-Game-Studios).
 *
 * Claude-Code-Game-Studios is created by Donchitos and licensed under the MIT License.
 * See: https://github.com/Donchitos/Claude-Code-Game-Studios/blob/main/LICENSE
 *
 * This module maps Game Studios' 48 specialized AI agents to the relevant
 * OpenForge MCP tool categories so that each agent only sees the tools it
 * needs.  It also provides helpers to generate config files, permission
 * lists, and workflow definitions.
 *
 * Dynamic sync: The bridge can discover agents from a local project or
 * from the GitHub repository and auto-map them to tool categories based
 * on keywords in their descriptions.
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EngineType = "unity" | "blender" | "godot";

export interface AgentToolMapping {
  agent: string;
  description: string;
  categories: string[];
}

export interface AgentPermission {
  agent: string;
  allowedTools: string[];
}

export interface StudioConfig {
  mcpServers: {
    "openforge-mcp": {
      command: string;
      args: string[];
      env?: Record<string, string>;
    };
  };
  permissions: Record<string, string[]>;
}

export interface WorkflowStep {
  agent: string;
  tools: string[];
  prompt: string;
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  agents: string[];
  steps: WorkflowStep[];
}

// ---------------------------------------------------------------------------
// Tool category constants -- these match the category values used in
// packages/mcp-server/src/tools/...  (e.g. "scene", "gameobject", etc.)
// ---------------------------------------------------------------------------

const UNITY_CATEGORIES = [
  "scene",
  "gameobject",
  "material",
  "script",
  "animation",
  "physics",
  "ui",
  "lighting",
  "camera",
  "prefab",
  "audio",
  "terrain",
  "navmesh",
  "vfx",
  "optimization",
  "build",
  "playtest",
  "input",
  "template",
  "weather",
  "timeline",
  "ml-agents",
] as const;

const BLENDER_CATEGORIES = [
  "object",
  "mesh",
  "material",
  "bake",
  "batch",
  "game_asset",
  "inspection",
  "mesh_repair",
  "procedural",
  "collection",
  "mesh_advanced",
  "animation_advanced",
  "armature_advanced",
  "modifier_extended",
  "uv_advanced",
  "material_advanced",
  "accessory",
  "avatar",
  "body_shape",
  "cloth_fitting",
  "shape_key",
  "weight_paint",
  "vrm_export",
] as const;

const GODOT_CATEGORIES = ["node", "resource"] as const;

function allCategories(): string[] {
  return [
    ...UNITY_CATEGORIES.map((c) => `unity:${c}`),
    ...BLENDER_CATEGORIES.map((c) => `blender:${c}`),
    ...GODOT_CATEGORIES.map((c) => `godot:${c}`),
  ];
}

// ---------------------------------------------------------------------------
// Keyword -> category auto-mapping rules
// ---------------------------------------------------------------------------

const KEYWORD_CATEGORY_RULES: Array<{ keywords: string[]; categories: string[] }> = [
  {
    keywords: ["art", "visual", "material", "shader", "texture"],
    categories: ["unity:material", "unity:lighting", "unity:vfx", "blender:material", "blender:material_advanced"],
  },
  {
    keywords: ["code", "script", "program"],
    categories: [
      "unity:script",
      "unity:physics",
      "unity:animation",
      "unity:gameobject",
      "unity:prefab",
      "unity:template",
      "unity:ui",
      "unity:input",
      "godot:node",
      "godot:resource",
    ],
  },
  {
    keywords: ["level", "scene", "terrain", "environment"],
    categories: ["unity:scene", "unity:gameobject", "unity:terrain", "godot:node", "godot:resource"],
  },
  {
    keywords: ["audio", "sound", "music"],
    categories: ["unity:audio"],
  },
  {
    keywords: ["test", "qa", "quality", "bug"],
    categories: ["unity:playtest", "unity:optimization", "unity:camera"],
  },
  {
    keywords: ["ui", "ux", "interface", "menu"],
    categories: ["unity:ui"],
  },
  {
    keywords: ["ai", "behavior", "npc", "pathfind"],
    categories: ["unity:navmesh", "unity:ml-agents", "unity:script"],
  },
  {
    keywords: ["animation", "motion", "rig"],
    categories: [
      "unity:animation",
      "unity:timeline",
      "blender:animation_advanced",
      "blender:armature_advanced",
    ],
  },
  {
    keywords: ["model", "mesh", "3d", "sculpt"],
    categories: [
      "blender:object",
      "blender:mesh",
      "blender:mesh_advanced",
      "blender:modifier_extended",
      "blender:procedural",
    ],
  },
  {
    keywords: ["build", "deploy", "release", "package"],
    categories: ["unity:build", "unity:optimization"],
  },
  {
    keywords: ["camera", "cine"],
    categories: ["unity:camera"],
  },
  {
    keywords: ["physics", "collision", "rigid"],
    categories: ["unity:physics"],
  },
];

const DEFAULT_CATEGORIES = [
  "unity:scene",
  "unity:gameobject",
  "unity:material",
  "unity:script",
];

/**
 * Given a text description, return tool categories inferred from keyword
 * matches.  Falls back to DEFAULT_CATEGORIES when no keywords match.
 */
export function autoMapCategories(description: string): string[] {
  const lower = description.toLowerCase();
  const matched = new Set<string>();
  for (const rule of KEYWORD_CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        for (const cat of rule.categories) {
          matched.add(cat);
        }
        break; // one keyword match per rule is enough
      }
    }
  }
  if (matched.size === 0) {
    return [...DEFAULT_CATEGORIES];
  }
  return [...matched];
}

// ---------------------------------------------------------------------------
// Agent -> tool category mapping
// ---------------------------------------------------------------------------

const AGENT_TOOL_MAP: AgentToolMapping[] = [
  {
    agent: "creative-director",
    description: "Overall creative vision -- needs read access to everything",
    categories: allCategories(),
  },
  {
    agent: "technical-director",
    description: "Technical oversight across all engines",
    categories: allCategories(),
  },
  {
    agent: "producer",
    description: "Project management, build status, pipeline overview",
    categories: [
      "unity:build",
      "unity:playtest",
      "unity:optimization",
    ],
  },
  {
    agent: "game-designer",
    description: "Gameplay systems, level layout, input, templates",
    categories: [
      "unity:scene",
      "unity:gameobject",
      "unity:terrain",
      "unity:input",
      "unity:template",
      "unity:physics",
      "unity:navmesh",
      "unity:prefab",
      "godot:node",
      "godot:resource",
    ],
  },
  {
    agent: "lead-programmer",
    description: "Full access to all Unity/Blender/Godot tools",
    categories: allCategories(),
  },
  {
    agent: "art-director",
    description: "Materials, lighting, VFX, camera, screenshots",
    categories: [
      "unity:material",
      "unity:lighting",
      "unity:vfx",
      "unity:camera",
      "unity:playtest",
      "unity:weather",
      "unity:timeline",
      "blender:material",
      "blender:material_advanced",
      "blender:bake",
      "blender:uv_advanced",
    ],
  },
  {
    agent: "technical-artist",
    description: "Shaders, materials, optimization, ProBuilder, mesh tools",
    categories: [
      "unity:material",
      "unity:optimization",
      "unity:vfx",
      "unity:lighting",
      "blender:material",
      "blender:material_advanced",
      "blender:mesh",
      "blender:mesh_advanced",
      "blender:mesh_repair",
      "blender:bake",
      "blender:uv_advanced",
      "blender:procedural",
      "blender:modifier_extended",
      "blender:game_asset",
    ],
  },
  {
    agent: "level-designer",
    description: "Scene construction, terrain, GameObjects, lighting, NavMesh",
    categories: [
      "unity:scene",
      "unity:gameobject",
      "unity:terrain",
      "unity:lighting",
      "unity:navmesh",
      "unity:prefab",
      "unity:weather",
      "unity:camera",
      "godot:node",
      "godot:resource",
    ],
  },
  {
    agent: "gameplay-programmer",
    description: "Physics, input, animation, scripting, templates",
    categories: [
      "unity:physics",
      "unity:input",
      "unity:animation",
      "unity:script",
      "unity:template",
      "unity:gameobject",
      "unity:prefab",
      "unity:timeline",
      "godot:node",
      "godot:resource",
    ],
  },
  {
    agent: "ui-programmer",
    description: "UI creation and layout",
    categories: [
      "unity:ui",
      "unity:script",
      "unity:camera",
    ],
  },
  {
    agent: "ai-programmer",
    description: "NavMesh, GOAP-style AI, ML-Agents",
    categories: [
      "unity:navmesh",
      "unity:ml-agents",
      "unity:script",
      "unity:gameobject",
      "unity:physics",
    ],
  },
  {
    agent: "audio-director",
    description: "Audio systems and sound design",
    categories: [
      "unity:audio",
      "unity:script",
    ],
  },
  {
    agent: "sound-designer",
    description: "Audio assets and integration",
    categories: [
      "unity:audio",
    ],
  },
  {
    agent: "narrative-director",
    description: "Story-related scripting and UI",
    categories: [
      "unity:script",
      "unity:ui",
      "unity:animation",
      "unity:timeline",
    ],
  },
  {
    agent: "qa-lead",
    description: "Testing oversight, playtesting, profiling",
    categories: [
      "unity:playtest",
      "unity:optimization",
      "unity:build",
    ],
  },
  {
    agent: "qa-tester",
    description: "Playtest, screenshots, profiler",
    categories: [
      "unity:playtest",
      "unity:camera",
      "unity:optimization",
    ],
  },
  {
    agent: "tools-programmer",
    description: "Build system, package management, optimization",
    categories: [
      "unity:build",
      "unity:optimization",
      "unity:template",
      "unity:script",
    ],
  },
  {
    agent: "vfx-artist",
    description: "Visual effects and particle systems",
    categories: [
      "unity:vfx",
      "unity:material",
      "unity:lighting",
      "unity:camera",
    ],
  },
  {
    agent: "animator",
    description: "Animation and timeline",
    categories: [
      "unity:animation",
      "unity:timeline",
      "blender:animation_advanced",
      "blender:armature_advanced",
      "blender:shape_key",
    ],
  },
  {
    agent: "3d-modeler",
    description: "3D modeling in Blender",
    categories: [
      "blender:object",
      "blender:mesh",
      "blender:mesh_advanced",
      "blender:mesh_repair",
      "blender:procedural",
      "blender:modifier_extended",
      "blender:collection",
      "blender:game_asset",
    ],
  },
  {
    agent: "character-artist",
    description: "Character modeling, rigging, clothing",
    categories: [
      "blender:object",
      "blender:mesh",
      "blender:mesh_advanced",
      "blender:armature_advanced",
      "blender:weight_paint",
      "blender:shape_key",
      "blender:body_shape",
      "blender:cloth_fitting",
      "blender:accessory",
      "blender:avatar",
      "blender:vrm_export",
    ],
  },
  {
    agent: "environment-artist",
    description: "Environment creation, terrain, lighting",
    categories: [
      "unity:terrain",
      "unity:lighting",
      "unity:weather",
      "unity:gameobject",
      "unity:scene",
      "unity:prefab",
      "blender:object",
      "blender:procedural",
      "blender:material",
    ],
  },
];

// ---------------------------------------------------------------------------
// Workflow definitions
// ---------------------------------------------------------------------------

const BUILTIN_WORKFLOWS: Record<string, WorkflowDefinition> = {
  create_level: {
    name: "Create Level",
    description:
      "Level designer + art director + technical artist collaborate to build a level",
    agents: ["level-designer", "art-director", "technical-artist"],
    steps: [
      {
        agent: "level-designer",
        tools: [
          "create_scene",
          "create_terrain",
          "create_gameobject",
          "set_transform",
        ],
        prompt: "Set up the level geometry and layout",
      },
      {
        agent: "art-director",
        tools: ["create_material", "create_light", "set_skybox"],
        prompt: "Set up lighting and materials",
      },
      {
        agent: "technical-artist",
        tools: ["analyze_draw_calls", "create_lod_group", "optimize_textures"],
        prompt: "Optimize for performance",
      },
    ],
  },
  performance_audit: {
    name: "Performance Audit",
    description:
      "QA tester + tools programmer audit performance and produce a report",
    agents: ["qa-tester", "tools-programmer", "qa-lead"],
    steps: [
      {
        agent: "qa-tester",
        tools: ["start_profiler", "get_profiler_data"],
        prompt: "Profile the scene and collect performance metrics",
      },
      {
        agent: "tools-programmer",
        tools: [
          "analyze_draw_calls",
          "create_lod_group",
          "optimize_textures",
          "combine_meshes",
        ],
        prompt: "Apply optimizations based on profiler data",
      },
      {
        agent: "qa-tester",
        tools: ["enter_play_mode", "take_screenshot"],
        prompt: "Playtest the optimized scene",
      },
      {
        agent: "qa-lead",
        tools: ["get_profiler_data", "take_screenshot"],
        prompt: "Generate the final performance report with before/after comparison",
      },
    ],
  },
  art_pass: {
    name: "Art Pass",
    description:
      "Art director + VFX artist polish materials, lighting, and effects",
    agents: ["art-director", "vfx-artist", "technical-artist"],
    steps: [
      {
        agent: "art-director",
        tools: [
          "create_material",
          "set_material_color",
          "set_material_property",
        ],
        prompt: "Set up and refine materials",
      },
      {
        agent: "art-director",
        tools: ["create_light", "set_light_property", "set_skybox"],
        prompt: "Adjust lighting and atmosphere",
      },
      {
        agent: "vfx-artist",
        tools: ["create_particle_system", "set_particle_property"],
        prompt: "Add visual effects and particles",
      },
      {
        agent: "art-director",
        tools: ["take_screenshot"],
        prompt: "Review final result with screenshots",
      },
    ],
  },
  qa_pass: {
    name: "QA Pass",
    description:
      "QA tester plays the game, reports bugs, captures screenshot evidence",
    agents: ["qa-tester", "qa-lead"],
    steps: [
      {
        agent: "qa-tester",
        tools: ["enter_play_mode", "simulate_input", "take_screenshot"],
        prompt: "Playtest the game and capture any issues",
      },
      {
        agent: "qa-tester",
        tools: ["take_screenshot", "exit_play_mode"],
        prompt: "Document bugs with screenshots and console output",
      },
      {
        agent: "qa-lead",
        tools: ["take_screenshot"],
        prompt: "Compare screenshots and compile the bug report",
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// GameStudiosBridge
// ---------------------------------------------------------------------------

export class GameStudiosBridge {
  /**
   * Generate a .claude/settings.json snippet that adds OpenForge MCP as a
   * tool source for all Game Studios agents.
   */
  generateStudioConfig(engineType: EngineType): StudioConfig {
    const permissions: Record<string, string[]> = {};
    for (const mapping of AGENT_TOOL_MAP) {
      const filtered = mapping.categories.filter((cat) => {
        const [engine] = cat.split(":");
        if (engineType === "unity") {
          return engine === "unity" || engine === "blender";
        }
        if (engineType === "blender") {
          return engine === "blender";
        }
        if (engineType === "godot") {
          return engine === "godot" || engine === "unity";
        }
        return true;
      });
      if (filtered.length > 0) {
        permissions[mapping.agent] = filtered;
      }
    }

    return {
      mcpServers: {
        "openforge-mcp": {
          command: "npx",
          args: ["-y", "openforge-mcp", "--mode", "full"],
        },
      },
      permissions,
    };
  }

  /**
   * Return the full agent -> tool category mapping table.
   */
  getAgentToolMapping(): AgentToolMapping[] {
    return [...AGENT_TOOL_MAP];
  }

  /**
   * Generate the list of allowed tool categories for a specific agent role.
   * Returns null if the agent role is unknown.
   */
  generateAgentPermissions(agentRole: string): AgentPermission | null {
    const mapping = AGENT_TOOL_MAP.find((m) => m.agent === agentRole);
    if (!mapping) {
      return null;
    }
    return {
      agent: mapping.agent,
      allowedTools: [...mapping.categories],
    };
  }

  /**
   * Return all built-in workflow definitions that Game Studios slash
   * commands can invoke via OpenForge tools.
   */
  getWorkflowIntegration(): Record<string, WorkflowDefinition> {
    return { ...BUILTIN_WORKFLOWS };
  }

  /**
   * Retrieve a single workflow by key.
   */
  getWorkflow(workflowKey: string): WorkflowDefinition | null {
    return BUILTIN_WORKFLOWS[workflowKey] ?? null;
  }

  /**
   * List the names of all known agent roles.
   */
  getAgentRoles(): string[] {
    return AGENT_TOOL_MAP.map((m) => m.agent);
  }

  /**
   * Check which engines are relevant to a given agent by inspecting
   * the category prefixes in their mapping.
   */
  getAgentEngines(agentRole: string): EngineType[] {
    const mapping = AGENT_TOOL_MAP.find((m) => m.agent === agentRole);
    if (!mapping) return [];
    const engines = new Set<EngineType>();
    for (const cat of mapping.categories) {
      const [engine] = cat.split(":");
      if (engine === "unity" || engine === "blender" || engine === "godot") {
        engines.add(engine);
      }
    }
    return [...engines];
  }
}
