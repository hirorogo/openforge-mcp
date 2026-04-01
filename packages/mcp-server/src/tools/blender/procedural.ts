import { ToolDefinition } from "../../registry.js";

const proceduralTools: ToolDefinition[] = [
  {
    name: "create_geometry_nodes",
    description: "Add a Geometry Nodes modifier with a fresh node tree to an object",
    category: "procedural",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        modifier_name: {
          type: "string",
          description: "Name for the modifier and node tree",
          default: "GeometryNodes",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "scatter_on_surface",
    description: "Scatter instances of an object across a surface using a particle system",
    category: "procedural",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        surface_name: {
          type: "string",
          description: "Name of the surface to scatter onto",
        },
        scatter_object_name: {
          type: "string",
          description: "Name of the object to scatter",
        },
        count: {
          type: "number",
          description: "Number of instances",
          default: 100,
        },
        seed: {
          type: "number",
          description: "Random seed",
          default: 0,
        },
        scale_min: {
          type: "number",
          description: "Minimum random scale",
          default: 0.8,
        },
        scale_max: {
          type: "number",
          description: "Maximum random scale",
          default: 1.2,
        },
        align_to_normal: {
          type: "boolean",
          description: "Align to surface normals",
          default: true,
        },
        collection_name: {
          type: "string",
          description: "Scatter objects from a collection instead of a single object",
        },
      },
      required: ["surface_name", "scatter_object_name"],
    },
  },
  {
    name: "create_random_array",
    description: "Create a randomized array of duplicated objects with random offsets",
    category: "procedural",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Source object name",
        },
        count: {
          type: "number",
          description: "Number of copies",
          default: 10,
        },
        spacing: {
          type: "number",
          description: "Base spacing along X",
          default: 2.0,
        },
        randomize_offset: {
          type: "number",
          description: "Max random position offset",
          default: 0.5,
        },
        randomize_rotation: {
          type: "number",
          description: "Max random rotation in radians",
          default: 0.0,
        },
        randomize_scale: {
          type: "number",
          description: "Max random scale variation",
          default: 0.0,
        },
        seed: {
          type: "number",
          description: "Random seed",
          default: 0,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "generate_terrain",
    description: "Generate a procedural terrain mesh using noise-based displacement",
    category: "procedural",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        size: {
          type: "number",
          description: "Terrain side length",
          default: 50.0,
        },
        subdivisions: {
          type: "number",
          description: "Subdivisions per side",
          default: 64,
        },
        height: {
          type: "number",
          description: "Maximum displacement height",
          default: 5.0,
        },
        noise_scale: {
          type: "number",
          description: "Scale of the noise pattern",
          default: 3.0,
        },
        seed: {
          type: "number",
          description: "Random seed offset",
          default: 0,
        },
        name: {
          type: "string",
          description: "Name for the terrain object",
          default: "Terrain",
        },
      },
      required: [],
    },
  },
  {
    name: "instance_on_points",
    description: "Place linked instances of an object at each vertex of a target mesh",
    category: "procedural",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        target_name: {
          type: "string",
          description: "Mesh whose vertices define placement points",
        },
        instance_name: {
          type: "string",
          description: "Object to instance",
        },
        align_to_normals: {
          type: "boolean",
          description: "Align instances to vertex normals",
          default: false,
        },
        scale: {
          type: "number",
          description: "Uniform scale for instances",
          default: 1.0,
        },
      },
      required: ["target_name", "instance_name"],
    },
  },
  {
    name: "create_city_block",
    description: "Generate a simple city block with randomized box buildings on a ground plane",
    category: "procedural",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        block_size: {
          type: "number",
          description: "Side length of the city block",
          default: 50.0,
        },
        building_count: {
          type: "number",
          description: "Number of buildings",
          default: 8,
        },
        min_height: {
          type: "number",
          description: "Minimum building height",
          default: 3.0,
        },
        max_height: {
          type: "number",
          description: "Maximum building height",
          default: 20.0,
        },
        min_width: {
          type: "number",
          description: "Minimum building width/depth",
          default: 3.0,
        },
        max_width: {
          type: "number",
          description: "Maximum building width/depth",
          default: 8.0,
        },
        gap: {
          type: "number",
          description: "Minimum gap between buildings",
          default: 1.0,
        },
        seed: {
          type: "number",
          description: "Random seed",
          default: 0,
        },
        name_prefix: {
          type: "string",
          description: "Prefix for building names",
          default: "Building",
        },
      },
      required: [],
    },
  },
  {
    name: "distribute_along_path",
    description: "Distribute instances of an object evenly along a curve path",
    category: "procedural",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        curve_name: {
          type: "string",
          description: "Name of the curve to distribute along",
        },
        object_name: {
          type: "string",
          description: "Object to instance along the curve",
        },
        count: {
          type: "number",
          description: "Number of instances",
          default: 10,
        },
        use_linked: {
          type: "boolean",
          description: "Create linked duplicates",
          default: true,
        },
        align_to_curve: {
          type: "boolean",
          description: "Orient instances to follow curve tangent",
          default: true,
        },
        scale: {
          type: "number",
          description: "Uniform scale for instances",
          default: 1.0,
        },
      },
      required: ["curve_name", "object_name"],
    },
  },
  {
    name: "random_transform",
    description: "Apply random position, rotation, and scale offsets to multiple objects",
    category: "procedural",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        names: {
          type: "array",
          items: { type: "string" },
          description: "Object names",
        },
        location_range: {
          type: "number",
          description: "Max random offset per axis",
          default: 0.0,
        },
        rotation_range: {
          type: "number",
          description: "Max random rotation in radians per axis",
          default: 0.0,
        },
        scale_range: {
          type: "number",
          description: "Max random scale variation around 1.0",
          default: 0.0,
        },
        uniform_scale: {
          type: "boolean",
          description: "Apply same scale to all axes",
          default: true,
        },
        seed: {
          type: "number",
          description: "Random seed",
          default: 0,
        },
      },
      required: ["names"],
    },
  },
];

export default proceduralTools;
