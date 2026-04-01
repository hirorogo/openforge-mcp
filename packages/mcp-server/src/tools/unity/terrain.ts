import { ToolDefinition } from "../../registry.js";

const terrainTools: ToolDefinition[] = [
  {
    name: "create_terrain",
    description: "Create a new Terrain with configurable size and resolution",
    category: "terrain",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Terrain name" },
        width: { type: "number", description: "Terrain width in units", default: 1000 },
        height: { type: "number", description: "Maximum terrain height", default: 600 },
        length: { type: "number", description: "Terrain length in units", default: 1000 },
        heightmap_resolution: { type: "number", description: "Heightmap resolution (power of 2 + 1)", default: 513 },
        position: { type: "string", description: "Position as 'x,y,z'" },
        path: { type: "string", description: "Asset save path for terrain data" },
      },
      required: [],
    },
  },
  {
    name: "set_terrain_height",
    description: "Set terrain height at a specific point with falloff radius",
    category: "terrain",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Terrain GameObject name (uses active terrain if empty)" },
        x: { type: "number", description: "Heightmap X coordinate" },
        y: { type: "number", description: "Heightmap Y coordinate" },
        height: { type: "number", description: "Target height (0-1 normalized)" },
        radius: { type: "number", description: "Brush radius in heightmap pixels", default: 1 },
      },
      required: ["x", "y", "height"],
    },
  },
  {
    name: "paint_terrain_texture",
    description: "Paint a terrain texture layer at a specific location",
    category: "terrain",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Terrain GameObject name" },
        layer_index: { type: "number", description: "Terrain layer index to paint" },
        x: { type: "number", description: "Alphamap X coordinate" },
        y: { type: "number", description: "Alphamap Y coordinate" },
        radius: { type: "number", description: "Brush radius", default: 5 },
        strength: { type: "number", description: "Paint strength (0-1)", default: 1 },
      },
      required: ["layer_index", "x", "y"],
    },
  },
  {
    name: "add_terrain_tree",
    description: "Add tree instances to the terrain using a prefab prototype",
    category: "terrain",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Terrain GameObject name" },
        prefab: { type: "string", description: "Tree prefab asset path" },
        x: { type: "number", description: "Normalized X position (0-1)", default: 0.5 },
        z: { type: "number", description: "Normalized Z position (0-1)", default: 0.5 },
        count: { type: "number", description: "Number of trees to place", default: 1 },
        height_scale: { type: "number", description: "Height scale multiplier", default: 1 },
        width_scale: { type: "number", description: "Width scale multiplier", default: 1 },
      },
      required: ["prefab"],
    },
  },
  {
    name: "add_terrain_detail",
    description: "Add a detail/grass prototype to the terrain",
    category: "terrain",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Terrain GameObject name" },
        texture: { type: "string", description: "Grass/detail texture path" },
        prefab: { type: "string", description: "Detail mesh prefab path (alternative to texture)" },
        min_width: { type: "number", description: "Minimum width" },
        max_width: { type: "number", description: "Maximum width" },
        min_height: { type: "number", description: "Minimum height" },
        max_height: { type: "number", description: "Maximum height" },
      },
      required: [],
    },
  },
  {
    name: "set_terrain_size",
    description: "Set the dimensions of a terrain",
    category: "terrain",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Terrain GameObject name" },
        width: { type: "number", description: "Terrain width" },
        height: { type: "number", description: "Terrain max height" },
        length: { type: "number", description: "Terrain length" },
      },
      required: [],
    },
  },
  {
    name: "smooth_terrain",
    description: "Apply smoothing to the entire terrain heightmap",
    category: "terrain",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Terrain GameObject name" },
        iterations: { type: "number", description: "Number of smoothing passes", default: 1 },
      },
      required: [],
    },
  },
  {
    name: "flatten_terrain",
    description: "Flatten the entire terrain to a uniform height",
    category: "terrain",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Terrain GameObject name" },
        height: { type: "number", description: "Target height (0-1 normalized)", default: 0 },
      },
      required: [],
    },
  },
  {
    name: "create_terrain_layer",
    description: "Create a terrain texture layer and optionally add it to a terrain",
    category: "terrain",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        texture: { type: "string", description: "Diffuse texture asset path" },
        name: { type: "string", description: "Layer name" },
        normal_map: { type: "string", description: "Normal map texture path" },
        tile_size: { type: "string", description: "Texture tile size as 'width,height'" },
        target: { type: "string", description: "Terrain to add the layer to" },
        path: { type: "string", description: "Asset save path for the layer" },
      },
      required: ["texture"],
    },
  },
  {
    name: "get_terrain_info",
    description: "Get terrain dimensions, resolution, layer, and tree instance information",
    category: "terrain",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Terrain GameObject name (uses active terrain if empty)" },
      },
      required: [],
    },
  },
  {
    name: "set_terrain_material",
    description: "Set the material template on a terrain",
    category: "terrain",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Terrain GameObject name" },
        material: { type: "string", description: "Material asset path" },
      },
      required: ["material"],
    },
  },
  {
    name: "raise_lower_terrain",
    description: "Raise or lower terrain height at a point with brush radius and falloff",
    category: "terrain",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Terrain GameObject name" },
        x: { type: "number", description: "Heightmap X coordinate" },
        y: { type: "number", description: "Heightmap Y coordinate" },
        amount: { type: "number", description: "Amount to raise (positive) or lower (negative)" },
        radius: { type: "number", description: "Brush radius", default: 5 },
      },
      required: ["x", "y", "amount"],
    },
  },
];

export default terrainTools;
