import { ToolDefinition } from "../../registry.js";

const buildTools: ToolDefinition[] = [
  {
    name: "set_build_platform",
    description: "Switch the active build platform (Windows, Mac, Linux, Android, iOS, WebGL)",
    category: "build",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        platform: { type: "string", enum: ["windows", "mac", "linux", "android", "ios", "webgl"], description: "Target platform" },
      },
      required: ["platform"],
    },
  },
  {
    name: "build_project",
    description: "Build the Unity project to an output path with configurable options",
    category: "build",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        output_path: { type: "string", description: "Output path for the build" },
        options: { type: "string", description: "Comma-separated build options: development, autorun, allowdebugging, compresswithlz4, compresswithlz4hc, strictmode" },
      },
      required: ["output_path"],
    },
  },
  {
    name: "set_player_settings",
    description: "Configure player settings like product name, version, resolution, and icons",
    category: "build",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "Company name" },
        product_name: { type: "string", description: "Product/game name" },
        version: { type: "string", description: "Bundle version string" },
        bundle_identifier: { type: "string", description: "Application identifier (e.g. com.company.game)" },
        screen_width: { type: "number", description: "Default screen width" },
        screen_height: { type: "number", description: "Default screen height" },
        fullscreen: { type: "boolean", description: "Default fullscreen mode" },
        run_in_background: { type: "boolean", description: "Allow running in background" },
        icon: { type: "string", description: "Icon texture asset path" },
      },
      required: [],
    },
  },
  {
    name: "add_scene_to_build",
    description: "Add a scene to the build settings scene list",
    category: "build",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Scene asset path (e.g. Assets/Scenes/MainMenu.unity)" },
      },
      required: ["path"],
    },
  },
  {
    name: "get_build_settings",
    description: "Get current build settings including platform, scenes, and player settings",
    category: "build",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "set_scripting_backend",
    description: "Set the scripting backend (Mono or IL2CPP) and API compatibility level",
    category: "build",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        backend: { type: "string", enum: ["mono", "il2cpp"], description: "Scripting backend" },
        api_compatibility: { type: "string", description: "API compatibility: net_standard_2_0, net_4_6" },
      },
      required: ["backend"],
    },
  },
];

export default buildTools;
