import { ToolDefinition } from "../../registry.js";

const modifierExtendedTools: ToolDefinition[] = [
  {
    name: "add_armature_modifier",
    description: "Add an Armature deform modifier to a mesh",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        armature_name: { type: "string", description: "Armature object name" },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name", "armature_name"],
    },
  },
  {
    name: "add_boolean_modifier",
    description: "Add a Boolean modifier without applying it",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        target: { type: "string", description: "Boolean operand object" },
        operation: { type: "string", enum: ["UNION", "DIFFERENCE", "INTERSECT"], default: "DIFFERENCE" },
        solver: { type: "string", enum: ["EXACT", "FAST"], default: "EXACT" },
      },
      required: ["name", "target"],
    },
  },
  {
    name: "add_displace",
    description: "Add a Displacement modifier for surface deformation",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        strength: { type: "number", description: "Displacement strength", default: 1.0 },
        mid_level: { type: "number", description: "Midpoint level (0-1)", default: 0.5 },
        direction: { type: "string", enum: ["X", "Y", "Z", "NORMAL", "CUSTOM_NORMAL", "RGB_TO_XYZ"], default: "NORMAL" },
        texture_name: { type: "string", description: "Texture name for displacement" },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "add_laplacian_smooth",
    description: "Add a Laplacian Smooth modifier for shape-preserving smoothing",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        iterations: { type: "number", description: "Smoothing iterations", default: 1 },
        lambda_factor: { type: "number", description: "Smoothing factor", default: 1.0 },
        lambda_border: { type: "number", description: "Border smoothing factor", default: 0.01 },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "add_screw",
    description: "Add a Screw modifier for creating spiral or lathe geometry",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        angle: { type: "number", description: "Total angle in degrees", default: 360.0 },
        steps: { type: "number", description: "Steps per revolution", default: 16 },
        screw_offset: { type: "number", description: "Height per revolution (spiral)", default: 0.0 },
        axis: { type: "string", enum: ["X", "Y", "Z"], default: "Z" },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "add_simple_deform",
    description: "Add a Simple Deform modifier for twist, bend, taper, or stretch",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        deform_method: { type: "string", enum: ["TWIST", "BEND", "TAPER", "STRETCH"], default: "TWIST" },
        angle: { type: "number", description: "Deformation angle in degrees (for TWIST/BEND)", default: 45.0 },
        factor: { type: "number", description: "Deformation factor (for TAPER/STRETCH)", default: 0.0 },
        axis: { type: "string", enum: ["X", "Y", "Z"], default: "Z" },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "add_smooth_modifier",
    description: "Add a Smooth modifier for mesh smoothing",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        factor: { type: "number", description: "Smoothing factor (0-1)", default: 0.5 },
        iterations: { type: "number", description: "Number of iterations", default: 1 },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "add_subdivision",
    description: "Add a Subdivision Surface modifier",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        levels: { type: "number", description: "Viewport levels (0-6)", default: 2 },
        render_levels: { type: "number", description: "Render levels (0-6)", default: 2 },
        subdivision_type: { type: "string", enum: ["CATMULL_CLARK", "SIMPLE"], default: "CATMULL_CLARK" },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "add_triangulate",
    description: "Add a Triangulate modifier for game engine export preparation",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        quad_method: {
          type: "string",
          enum: ["BEAUTY", "FIXED", "FIXED_ALTERNATE", "SHORTEST_DIAGONAL", "LONGEST_DIAGONAL"],
          default: "BEAUTY",
        },
        ngon_method: { type: "string", enum: ["BEAUTY", "CLIP"], default: "BEAUTY" },
        min_vertices: { type: "number", description: "Minimum vertices per face to triangulate", default: 4 },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "add_weighted_normal",
    description: "Add a Weighted Normal modifier for game asset normal control",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        weight: { type: "number", description: "Normal weight (1-100)", default: 50 },
        mode: { type: "string", enum: ["FACE_AREA", "CORNER_ANGLE", "FACE_AREA_AND_ANGLE"], default: "FACE_AREA" },
        keep_sharp: { type: "boolean", description: "Preserve sharp edges", default: true },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "add_data_transfer",
    description: "Add a Data Transfer modifier to transfer normals or UVs from another mesh",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        source_name: { type: "string", description: "Source object for data transfer" },
        use_loop_data: { type: "boolean", description: "Transfer loop data (normals, UVs)", default: true },
        data_types_loops: { type: "array", items: { type: "string" }, description: "Loop data types: CUSTOM_NORMAL, UV" },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["name", "source_name"],
    },
  },
  {
    name: "apply_all_modifiers",
    description: "Apply all modifiers on an object in stack order",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
      },
      required: ["name"],
    },
  },
  {
    name: "copy_modifiers",
    description: "Copy all modifiers from one object to another",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        source_name: { type: "string", description: "Source object" },
        target_name: { type: "string", description: "Target object" },
      },
      required: ["source_name", "target_name"],
    },
  },
  {
    name: "list_modifiers",
    description: "List all modifiers on an object with type and visibility status",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
      },
      required: ["name"],
    },
  },
  {
    name: "reorder_modifier",
    description: "Move a modifier up or down in the modifier stack",
    category: "modifier_extended",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        modifier_name: { type: "string", description: "Modifier to move" },
        direction: { type: "string", enum: ["UP", "DOWN"], description: "Move direction" },
      },
      required: ["name", "modifier_name", "direction"],
    },
  },
];

export default modifierExtendedTools;
