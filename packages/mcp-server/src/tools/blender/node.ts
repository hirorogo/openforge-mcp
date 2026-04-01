import { ToolDefinition } from "../../registry.js";

const nodeTools: ToolDefinition[] = [
  {
    name: "add_shader_node",
    description: "Add a shader node to a material's node tree",
    category: "node",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        node_type: { type: "string", description: "Blender node type identifier (e.g. ShaderNodeMixRGB)" },
        location_x: { type: "number", description: "X position", default: 0 },
        location_y: { type: "number", description: "Y position", default: 0 },
        label: { type: "string", description: "Display label" },
      },
      required: ["material_name", "node_type"],
    },
  },
  {
    name: "connect_nodes",
    description: "Connect two nodes in a material's node tree by their sockets",
    category: "node",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        from_node: { type: "string", description: "Source node name" },
        from_output: { type: "string", description: "Output socket name or index" },
        to_node: { type: "string", description: "Destination node name" },
        to_input: { type: "string", description: "Input socket name or index" },
      },
      required: ["material_name", "from_node", "from_output", "to_node", "to_input"],
    },
  },
  {
    name: "create_node_group",
    description: "Create a new reusable shader node group",
    category: "node",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        group_name: { type: "string", description: "Node group name" },
        material_name: { type: "string", description: "Material to add a group node instance to" },
      },
      required: ["group_name"],
    },
  },
  {
    name: "add_geometry_node",
    description: "Add a Geometry Nodes modifier to an object",
    category: "node",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        object_name: { type: "string", description: "Object name" },
        modifier_name: { type: "string", description: "Modifier name", default: "GeometryNodes" },
      },
      required: ["object_name"],
    },
  },
  {
    name: "set_node_value",
    description: "Set an input value on a shader node",
    category: "node",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        node_name: { type: "string", description: "Node name" },
        input_name: { type: "string", description: "Input socket name" },
        value: { description: "Value to set (number, color array, etc.)" },
      },
      required: ["material_name", "node_name", "input_name", "value"],
    },
  },
  {
    name: "add_math_node",
    description: "Add a Math node for arithmetic operations in the shader graph",
    category: "node",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        operation: {
          type: "string",
          enum: ["ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "POWER", "LOGARITHM", "SQRT", "ABSOLUTE", "MINIMUM", "MAXIMUM", "LESS_THAN", "GREATER_THAN", "ROUND", "FLOOR", "CEIL", "FRACT", "MODULO", "SINE", "COSINE", "TANGENT"],
          description: "Math operation",
          default: "ADD",
        },
        value1: { type: "number", description: "First input value", default: 0.5 },
        value2: { type: "number", description: "Second input value", default: 0.5 },
        location_x: { type: "number", default: -200 },
        location_y: { type: "number", default: 0 },
      },
      required: ["material_name"],
    },
  },
  {
    name: "add_mix_node",
    description: "Add a Mix node for blending colors, vectors, or values",
    category: "node",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        data_type: {
          type: "string",
          enum: ["FLOAT", "VECTOR", "RGBA"],
          default: "RGBA",
        },
        blend_type: {
          type: "string",
          enum: ["MIX", "ADD", "MULTIPLY", "SCREEN", "OVERLAY", "DARKEN", "LIGHTEN"],
          default: "MIX",
        },
        factor: { type: "number", description: "Mix factor (0-1)", default: 0.5 },
        location_x: { type: "number", default: -200 },
        location_y: { type: "number", default: 0 },
      },
      required: ["material_name"],
    },
  },
  {
    name: "add_texture_node",
    description: "Add a texture node to a material's shader graph",
    category: "node",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        texture_type: {
          type: "string",
          description: "Node type (e.g. ShaderNodeTexNoise, ShaderNodeTexVoronoi)",
          default: "ShaderNodeTexNoise",
        },
        location_x: { type: "number", default: -400 },
        location_y: { type: "number", default: 0 },
      },
      required: ["material_name"],
    },
  },
  {
    name: "create_compositor_setup",
    description: "Create a compositor node setup (basic, bloom, or color correction)",
    category: "node",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        setup_type: {
          type: "string",
          enum: ["basic", "bloom", "color_correct"],
          description: "Preset setup type",
          default: "basic",
        },
      },
    },
  },
  {
    name: "add_color_ramp",
    description: "Add a Color Ramp node with configurable color stops",
    category: "node",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        material_name: { type: "string", description: "Material name" },
        location_x: { type: "number", default: -300 },
        location_y: { type: "number", default: 0 },
        color_stops: {
          type: "array",
          items: {
            type: "object",
            properties: {
              position: { type: "number", description: "Stop position (0-1)" },
              color: {
                type: "array",
                items: { type: "number" },
                description: "RGBA color",
              },
            },
          },
          description: "Color stop definitions",
        },
      },
      required: ["material_name"],
    },
  },
];

export default nodeTools;
