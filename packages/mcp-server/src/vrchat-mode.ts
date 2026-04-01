import * as fs from "node:fs/promises";
import * as path from "node:path";
import yaml from "js-yaml";
import { Recipe } from "./recipe.js";

/**
 * Curated tool set and recipe loader for VRChat mode.
 *
 * VRChat mode exposes only the tools relevant to VRChat avatar and world
 * creation, keeping the tool list focused and manageable for LLM clients.
 */

// --- VRChat SDK tools ---
const VRCHAT_SDK_TOOLS: string[] = [
  "check_sdk_installed",
  "setup_vrc_world",
  "add_spawn_point",
  "set_spawn_order",
  "add_mirror",
  "add_pickup",
  "add_portal",
  "set_world_capacity",
  "add_video_player",
  "add_chair",
  "setup_vrc_avatar",
  "set_viewpoint",
  "validate_for_upload",
  "get_vrc_components",
  "estimate_performance",
];

// --- PhysBone tools ---
const PHYSBONE_TOOLS: string[] = [
  "add_physbone",
  "configure_physbone",
  "add_physbone_collider",
  "setup_hair_physbone",
  "setup_skirt_physbone",
  "setup_tail_physbone",
  "setup_accessory_physbone",
  "list_physbones",
  "get_physbone_info",
  "copy_physbone_settings",
];

// --- Modular Avatar tools ---
const MODULAR_AVATAR_TOOLS: string[] = [
  "auto_setup_outfit",
  "add_ma_merge_armature",
  "add_ma_menu_item",
  "add_ma_toggle",
  "add_ma_blendshape_sync",
  "remove_ma_components",
];

// --- FaceEmo tools ---
const FACEEMO_TOOLS: string[] = [
  "auto_detect_blendshapes",
  "create_expression_preset",
  "create_expression_menu",
  "add_expression_pattern",
  "set_expression_trigger",
];

// --- TextureEdit tools ---
const TEXTURE_EDIT_TOOLS: string[] = [
  "resize_texture",
  "compress_texture",
  "create_texture_atlas",
  "adjust_texture_brightness",
  "convert_texture_format",
];

// --- VRC Performance tools ---
const VRC_PERFORMANCE_TOOLS: string[] = [
  "check_avatar_rank",
  "count_polygons",
  "count_materials",
  "count_bones",
  "count_physbones",
  "suggest_optimizations",
  "auto_optimize_avatar",
  "compare_before_after",
];

// --- Selected Unity tools ---
// Scene (5)
const UNITY_SCENE_TOOLS: string[] = [
  "new_scene",
  "save_scene",
  "load_scene",
  "get_hierarchy",
  "find_gameobject",
];

// GameObject (10)
const UNITY_GAMEOBJECT_TOOLS: string[] = [
  "create_gameobject",
  "destroy_gameobject",
  "rename_gameobject",
  "set_transform",
  "get_transform",
  "set_parent",
  "duplicate_gameobject",
  "set_active",
  "add_component",
  "remove_component",
];

// Material (6)
const UNITY_MATERIAL_TOOLS: string[] = [
  "create_material",
  "set_material_color",
  "set_material_texture",
  "set_material_property",
  "assign_material",
  "get_material_properties",
];

// Script (5)
const UNITY_SCRIPT_TOOLS: string[] = [
  "create_script",
  "edit_script",
  "attach_script",
  "read_script",
  "compile_scripts",
];

// Lighting (12)
const UNITY_LIGHTING_TOOLS: string[] = [
  "create_light",
  "set_light_color",
  "set_light_intensity",
  "set_light_range",
  "set_light_type",
  "set_shadow_type",
  "set_ambient_light",
  "set_fog",
  "set_skybox",
  "set_reflection_probe",
  "bake_lighting",
  "set_light_cookie",
];

// Camera (2)
const UNITY_CAMERA_TOOLS: string[] = [
  "create_camera",
  "set_camera_properties",
];

// UI (3)
const UNITY_UI_TOOLS: string[] = [
  "create_canvas",
  "create_ui_text",
  "create_ui_button",
];

// Optimization (8)
const UNITY_OPTIMIZATION_TOOLS: string[] = [
  "analyze_draw_calls",
  "create_lod_group",
  "set_static_batching",
  "set_occlusion_culling",
  "optimize_textures",
  "combine_meshes",
  "set_quality_settings",
  "get_performance_stats",
];

// Screenshot (1)
const UNITY_SCREENSHOT_TOOLS: string[] = [
  "take_screenshot",
];

// Playtest (4)
const UNITY_PLAYTEST_TOOLS: string[] = [
  "enter_play_mode",
  "exit_play_mode",
  "pause_play_mode",
  "is_playing",
];

// --- Selected Blender tools (by category name) ---
const BLENDER_TOOL_CATEGORIES: string[] = [
  "object",
  "mesh",
  "material",
  "armature",
  "vrm",
  "shape_key",
  "weight_paint",
  "avatar",
  "body_shape",
  "cloth_fitting",
  "accessory",
  "bake",
  "import_export",
  "inspection",
];

/**
 * Build the complete set of VRChat-mode tool keys.
 * Unity tools use the format "unity:<tool_name>".
 * Blender tools are included by category.
 */
function buildVRChatToolSet(): Set<string> {
  const tools = new Set<string>();

  // Add all VRChat-specific tool groups as unity tools
  const unityToolNames = [
    ...VRCHAT_SDK_TOOLS,
    ...PHYSBONE_TOOLS,
    ...MODULAR_AVATAR_TOOLS,
    ...FACEEMO_TOOLS,
    ...TEXTURE_EDIT_TOOLS,
    ...VRC_PERFORMANCE_TOOLS,
    ...UNITY_SCENE_TOOLS,
    ...UNITY_GAMEOBJECT_TOOLS,
    ...UNITY_MATERIAL_TOOLS,
    ...UNITY_SCRIPT_TOOLS,
    ...UNITY_LIGHTING_TOOLS,
    ...UNITY_CAMERA_TOOLS,
    ...UNITY_UI_TOOLS,
    ...UNITY_OPTIMIZATION_TOOLS,
    ...UNITY_SCREENSHOT_TOOLS,
    ...UNITY_PLAYTEST_TOOLS,
  ];

  for (const name of unityToolNames) {
    tools.add(`unity:${name}`);
  }

  return tools;
}

const VRCHAT_TOOLS: Set<string> = buildVRChatToolSet();

/** Blender categories included in VRChat mode. */
const VRCHAT_BLENDER_CATEGORIES: Set<string> = new Set(BLENDER_TOOL_CATEGORIES);

export class VRChatMode {
  /**
   * Returns the curated set of tool keys (target:name) for VRChat mode.
   * Unity tools are returned as explicit keys.
   * For Blender tools, use isVRChatBlenderCategory() to check by category.
   */
  getVRChatTools(): Set<string> {
    return new Set(VRCHAT_TOOLS);
  }

  /**
   * Load all VRChat recipes from the workflows/vrchat/ directory.
   */
  async getVRChatRecipes(workflowDir: string): Promise<Recipe[]> {
    const vrchatDir = path.join(workflowDir, "vrchat");
    const recipes: Recipe[] = [];

    let entries: any[];
    try {
      entries = await fs.readdir(vrchatDir, { withFileTypes: true }) as any[];
    } catch {
      return recipes;
    }

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (ext !== ".yaml" && ext !== ".yml") continue;

      const filePath = path.join(vrchatDir, entry.name);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        const parsed = yaml.load(content) as Record<string, unknown>;

        if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed.name === "string" &&
          typeof parsed.description === "string" &&
          Array.isArray(parsed.steps)
        ) {
          const steps = (parsed.steps as Array<Record<string, unknown>>).map(
            (s) => ({
              tool: s.tool as string,
              params: s.params as Record<string, unknown> | undefined,
            }),
          );

          recipes.push({
            name: parsed.name,
            description: parsed.description,
            target: (parsed.target as "unity" | "blender") || "unity",
            steps,
          });
        }
      } catch {
        // Skip invalid recipe files
      }
    }

    return recipes;
  }

  /**
   * Check if a tool key (target:name) is in the VRChat tool set.
   * For Blender tools, also checks if the tool's category is included.
   */
  isVRChatTool(toolKey: string, category?: string): boolean {
    if (VRCHAT_TOOLS.has(toolKey)) {
      return true;
    }

    // For blender tools, check by category
    if (toolKey.startsWith("blender:") && category) {
      return VRCHAT_BLENDER_CATEGORIES.has(category);
    }

    return false;
  }
}

/**
 * Exported constant for use in registry.ts
 */
export { VRCHAT_TOOLS, VRCHAT_BLENDER_CATEGORIES };
