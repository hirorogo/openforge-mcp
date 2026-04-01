import { ToolDefinition } from "../../registry.js";

const modifierAdvancedTools: ToolDefinition[] = [
  {
    name: "add_array_modifier",
    description: "Add an Array modifier to duplicate geometry in a repeating pattern",
    category: "modifier_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        count: { type: "number", description: "Number of copies", default: 2 },
        offset_x: { type: "number", description: "Relative X offset", default: 1.0 },
        offset_y: { type: "number", description: "Relative Y offset", default: 0.0 },
        offset_z: { type: "number", description: "Relative Z offset", default: 0.0 },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "add_curve_modifier",
    description: "Add a Curve modifier to deform geometry along a curve object",
    category: "modifier_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        curve_name: { type: "string", description: "Curve object name" },
        deform_axis: {
          type: "string",
          enum: ["POS_X", "POS_Y", "POS_Z", "NEG_X", "NEG_Y", "NEG_Z"],
          default: "POS_X",
        },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name", "curve_name"],
    },
  },
  {
    name: "add_lattice_modifier",
    description: "Add a Lattice modifier for free-form deformation, optionally creating the lattice",
    category: "modifier_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        lattice_name: { type: "string", description: "Existing lattice (creates one if omitted)" },
        resolution_u: { type: "number", description: "Lattice U resolution", default: 2 },
        resolution_v: { type: "number", description: "Lattice V resolution", default: 2 },
        resolution_w: { type: "number", description: "Lattice W resolution", default: 2 },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "add_shrinkwrap_modifier",
    description: "Add a Shrinkwrap modifier to project geometry onto a target surface",
    category: "modifier_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        target_name: { type: "string", description: "Target surface object" },
        wrap_method: {
          type: "string",
          enum: ["NEAREST_SURFACEPOINT", "PROJECT", "NEAREST_VERTEX", "TARGET_PROJECT"],
          default: "NEAREST_SURFACEPOINT",
        },
        offset: { type: "number", description: "Offset from surface", default: 0.0 },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name", "target_name"],
    },
  },
  {
    name: "add_solidify_modifier",
    description: "Add a Solidify modifier to give thickness to a flat surface",
    category: "modifier_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        thickness: { type: "number", description: "Wall thickness", default: 0.01 },
        offset: { type: "number", description: "Direction (-1 inward, 1 outward)", default: -1.0 },
        use_even_offset: { type: "boolean", description: "Even thickness", default: true },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "add_wireframe_modifier",
    description: "Add a Wireframe modifier to convert mesh faces into a wireframe",
    category: "modifier_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        thickness: { type: "number", description: "Wire thickness", default: 0.02 },
        use_replace: { type: "boolean", description: "Replace original surface", default: true },
        use_even_offset: { type: "boolean", description: "Even thickness", default: true },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "add_cloth_modifier",
    description: "Add a Cloth physics simulation modifier to a mesh",
    category: "modifier_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object name" },
        quality: { type: "number", description: "Simulation quality (1-80)", default: 5 },
        mass: { type: "number", description: "Cloth mass", default: 0.3 },
        air_damping: { type: "number", description: "Air viscosity", default: 1.0 },
        use_pressure: { type: "boolean", description: "Enable pressure", default: false },
        pressure: { type: "number", description: "Internal pressure", default: 0.0 },
      },
      required: ["name"],
    },
  },
  {
    name: "add_particle_system",
    description: "Add a Particle System for emitter or hair particles",
    category: "modifier_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object name" },
        count: { type: "number", description: "Number of particles", default: 1000 },
        particle_type: {
          type: "string",
          enum: ["EMITTER", "HAIR"],
          default: "EMITTER",
        },
        lifetime: { type: "number", description: "Particle lifetime in frames", default: 50 },
        emit_from: {
          type: "string",
          enum: ["VERT", "FACE", "VOLUME"],
          default: "FACE",
        },
        render_type: {
          type: "string",
          enum: ["NONE", "HALO", "LINE", "PATH", "OBJECT", "COLLECTION"],
          default: "HALO",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "add_mirror_modifier",
    description: "Add a Mirror modifier for symmetric modeling across one or more axes",
    category: "modifier_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        axis_x: { type: "boolean", description: "Mirror X", default: true },
        axis_y: { type: "boolean", description: "Mirror Y", default: false },
        axis_z: { type: "boolean", description: "Mirror Z", default: false },
        use_clip: { type: "boolean", description: "Prevent crossing mirror plane", default: true },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "add_subsurf_modifier",
    description: "Add a Subdivision Surface modifier for smooth geometry refinement",
    category: "modifier_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        levels: { type: "number", description: "Viewport subdivision levels", default: 2 },
        render_levels: { type: "number", description: "Render subdivision levels", default: 2 },
        subdivision_type: {
          type: "string",
          enum: ["CATMULL_CLARK", "SIMPLE"],
          default: "CATMULL_CLARK",
        },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "add_bevel_modifier",
    description: "Add a Bevel modifier for rounding or chamfering edges",
    category: "modifier_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        width: { type: "number", description: "Bevel width", default: 0.1 },
        segments: { type: "number", description: "Number of segments", default: 1 },
        limit_method: {
          type: "string",
          enum: ["NONE", "ANGLE", "WEIGHT", "VGROUP"],
          default: "NONE",
        },
        angle_limit: { type: "number", description: "Angle limit in degrees", default: 30.0 },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
];

export default modifierAdvancedTools;
