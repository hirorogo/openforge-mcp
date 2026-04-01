import { ToolDefinition } from "../../registry.js";

const lightingTools: ToolDefinition[] = [
  {
    name: "create_light",
    description: "Create a light source (directional, point, spot, or area) in the scene",
    category: "lighting",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Light name" },
        type: { type: "string", enum: ["directional", "point", "spot", "area"], description: "Light type" },
        color: { type: "string", description: "Light color (hex, rgba, or named)" },
        intensity: { type: "number", description: "Light intensity" },
        range: { type: "number", description: "Range for point/spot lights" },
        spot_angle: { type: "number", description: "Spot light cone angle in degrees" },
        shadows: { type: "string", description: "Shadow type: None, Hard, Soft" },
        position: { type: "string", description: "Position as 'x,y,z'" },
        rotation: { type: "string", description: "Rotation as 'x,y,z' euler angles" },
      },
      required: [],
    },
  },
  {
    name: "set_light_color",
    description: "Set the color of a Light component",
    category: "lighting",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID with a Light" },
        color: { type: "string", description: "Light color" },
      },
      required: ["target", "color"],
    },
  },
  {
    name: "set_light_intensity",
    description: "Set the intensity of a Light component",
    category: "lighting",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID with a Light" },
        intensity: { type: "number", description: "Light intensity value" },
      },
      required: ["target", "intensity"],
    },
  },
  {
    name: "set_light_range",
    description: "Set the range of a point or spot Light",
    category: "lighting",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID with a Light" },
        range: { type: "number", description: "Light range" },
      },
      required: ["target", "range"],
    },
  },
  {
    name: "bake_lighting",
    description: "Bake, clear, or cancel lightmap baking",
    category: "lighting",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["bake", "clear", "cancel"], description: "Bake operation mode" },
      },
      required: [],
    },
  },
  {
    name: "create_reflection_probe",
    description: "Create a reflection probe for environment reflections",
    category: "lighting",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Probe name" },
        position: { type: "string", description: "Position as 'x,y,z'" },
        size: { type: "string", description: "Probe bounds size as 'x,y,z'" },
        resolution: { type: "number", description: "Reflection resolution" },
        mode: { type: "string", enum: ["baked", "realtime", "custom"], description: "Probe mode" },
        intensity: { type: "number", description: "Reflection intensity" },
      },
      required: [],
    },
  },
  {
    name: "create_light_probe_group",
    description: "Create a group of light probes for dynamic object lighting",
    category: "lighting",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Light probe group name" },
        position: { type: "string", description: "Position as 'x,y,z'" },
        pattern: { type: "string", description: "Probe pattern: 'grid' for automatic grid placement" },
        count_x: { type: "number", description: "Grid count X", default: 3 },
        count_y: { type: "number", description: "Grid count Y", default: 2 },
        count_z: { type: "number", description: "Grid count Z", default: 3 },
        spacing: { type: "number", description: "Grid spacing", default: 2 },
      },
      required: [],
    },
  },
  {
    name: "set_ambient_light",
    description: "Configure ambient lighting mode, color, and intensity",
    category: "lighting",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["skybox", "trilight", "flat", "color"], description: "Ambient mode" },
        color: { type: "string", description: "Ambient color (flat mode)" },
        sky_color: { type: "string", description: "Sky color (trilight mode)" },
        equator_color: { type: "string", description: "Equator color (trilight mode)" },
        ground_color: { type: "string", description: "Ground color (trilight mode)" },
        intensity: { type: "number", description: "Ambient intensity" },
      },
      required: [],
    },
  },
  {
    name: "set_skybox",
    description: "Set the scene skybox material or create a procedural skybox",
    category: "lighting",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        material: { type: "string", description: "Asset path of skybox material" },
        shader: { type: "string", description: "Skybox shader name for new material" },
        tint: { type: "string", description: "Tint color for procedural skybox" },
        exposure: { type: "number", description: "Skybox exposure" },
      },
      required: [],
    },
  },
  {
    name: "set_fog",
    description: "Configure scene fog settings",
    category: "lighting",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        enabled: { type: "boolean", description: "Enable or disable fog" },
        color: { type: "string", description: "Fog color" },
        mode: { type: "string", enum: ["linear", "exponential", "exponential_squared"], description: "Fog mode" },
        density: { type: "number", description: "Fog density (exponential modes)" },
        start_distance: { type: "number", description: "Start distance (linear mode)" },
        end_distance: { type: "number", description: "End distance (linear mode)" },
      },
      required: [],
    },
  },
  {
    name: "set_shadow_settings",
    description: "Configure global shadow quality settings",
    category: "lighting",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        distance: { type: "number", description: "Shadow draw distance" },
        resolution: { type: "string", description: "Shadow resolution: Low, Medium, High, VeryHigh" },
        cascades: { type: "number", description: "Number of shadow cascades (1, 2, or 4)" },
        projection: { type: "string", description: "Shadow projection: CloseFit, StableFit" },
      },
      required: [],
    },
  },
  {
    name: "set_render_pipeline_settings",
    description: "Set or query the active render pipeline asset (URP/HDRP)",
    category: "lighting",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        pipeline_asset: { type: "string", description: "Asset path of render pipeline asset" },
        clear: { type: "boolean", description: "Clear pipeline to use built-in" },
      },
      required: [],
    },
  },
];

export default lightingTools;
