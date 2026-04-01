import { ToolDefinition } from "../../registry.js";

const clothFittingTools: ToolDefinition[] = [
  {
    name: "auto_fit",
    description: "Automatically fit clothing to a body using shrinkwrap with offset",
    category: "cloth_fitting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        clothing_name: { type: "string", description: "Clothing mesh to fit" },
        body_name: { type: "string", description: "Body mesh to fit onto" },
        offset: { type: "number", description: "Distance offset from body surface", default: 0.001 },
      },
      required: ["clothing_name", "body_name"],
    },
  },
  {
    name: "add_shrinkwrap",
    description: "Add a shrinkwrap modifier for surface-following clothing",
    category: "cloth_fitting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        clothing_name: { type: "string", description: "Clothing mesh" },
        body_name: { type: "string", description: "Target body mesh" },
        wrap_method: {
          type: "string",
          enum: ["NEAREST_SURFACEPOINT", "PROJECT", "NEAREST_VERTEX"],
          description: "Wrap method",
          default: "NEAREST_SURFACEPOINT",
        },
        offset: { type: "number", description: "Surface offset distance", default: 0.002 },
        apply: { type: "boolean", description: "Apply the modifier immediately", default: false },
      },
      required: ["clothing_name", "body_name"],
    },
  },
  {
    name: "add_surface_bind",
    description: "Bind clothing to body surface using surface deform modifier",
    category: "cloth_fitting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        clothing_name: { type: "string", description: "Clothing mesh" },
        body_name: { type: "string", description: "Body mesh to bind to" },
        apply: { type: "boolean", description: "Apply after binding", default: false },
      },
      required: ["clothing_name", "body_name"],
    },
  },
  {
    name: "add_lattice_deform",
    description: "Add a lattice modifier for shaping clothing",
    category: "cloth_fitting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        clothing_name: { type: "string", description: "Clothing mesh" },
        resolution: {
          type: "array",
          items: { type: "number" },
          description: "Lattice resolution [U, V, W]",
        },
        apply: { type: "boolean", description: "Apply immediately", default: false },
      },
      required: ["clothing_name"],
    },
  },
  {
    name: "adjust_offset",
    description: "Adjust clothing offset from body by pushing vertices along normals",
    category: "cloth_fitting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        clothing_name: { type: "string", description: "Clothing mesh" },
        body_name: { type: "string", description: "Body mesh reference" },
        offset: { type: "number", description: "Distance to push outward", default: 0.002 },
      },
      required: ["clothing_name", "body_name"],
    },
  },
  {
    name: "detect_clipping",
    description: "Find clothing vertices that penetrate the body surface",
    category: "cloth_fitting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        clothing_name: { type: "string", description: "Clothing mesh to check" },
        body_name: { type: "string", description: "Body mesh to check against" },
        threshold: { type: "number", description: "Distance threshold", default: 0.0 },
      },
      required: ["clothing_name", "body_name"],
    },
  },
  {
    name: "fix_clipping",
    description: "Push clipping vertices outward past the body surface",
    category: "cloth_fitting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        clothing_name: { type: "string", description: "Clothing mesh" },
        body_name: { type: "string", description: "Body mesh" },
        push_distance: { type: "number", description: "Extra distance beyond surface", default: 0.001 },
      },
      required: ["clothing_name", "body_name"],
    },
  },
  {
    name: "smooth_boundary",
    description: "Smooth clothing mesh edges at boundary/open edges",
    category: "cloth_fitting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        clothing_name: { type: "string", description: "Clothing mesh" },
        iterations: { type: "number", description: "Smoothing iterations", default: 3 },
        factor: { type: "number", description: "Smoothing factor (0-1)", default: 0.5 },
      },
      required: ["clothing_name"],
    },
  },
  {
    name: "transfer_body_weights",
    description: "Copy vertex weights from body mesh to clothing",
    category: "cloth_fitting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        body_name: { type: "string", description: "Source body mesh with weights" },
        clothing_name: { type: "string", description: "Target clothing mesh" },
        method: {
          type: "string",
          enum: ["POLYINTERP_NEAREST", "NEAREST", "TOPOLOGY"],
          description: "Transfer method",
          default: "POLYINTERP_NEAREST",
        },
      },
      required: ["body_name", "clothing_name"],
    },
  },
  {
    name: "bind_to_mesh",
    description: "Bind clothing to body using mesh deform modifier",
    category: "cloth_fitting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        clothing_name: { type: "string", description: "Clothing mesh" },
        body_name: { type: "string", description: "Body mesh as deform cage" },
        precision: { type: "number", description: "Binding precision (1-10)", default: 5 },
        apply: { type: "boolean", description: "Apply after binding", default: false },
      },
      required: ["clothing_name", "body_name"],
    },
  },
  {
    name: "check_intersection",
    description: "Check for mesh intersections between two objects using BVH trees",
    category: "cloth_fitting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        mesh_a_name: { type: "string", description: "First mesh" },
        mesh_b_name: { type: "string", description: "Second mesh" },
      },
      required: ["mesh_a_name", "mesh_b_name"],
    },
  },
  {
    name: "proportional_resize",
    description: "Resize mesh with proportional falloff from a center region",
    category: "cloth_fitting",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Mesh object" },
        center_vertex_group: { type: "string", description: "Center vertex group (uses origin if omitted)" },
        scale_factor: { type: "number", description: "Scale multiplier", default: 1.0 },
        falloff: {
          type: "string",
          enum: ["SMOOTH", "SPHERE", "ROOT", "SHARP", "LINEAR", "CONSTANT", "INVERSE_SQUARE", "RANDOM"],
          description: "Falloff type",
          default: "SMOOTH",
        },
        radius: { type: "number", description: "Proportional editing radius", default: 1.0 },
      },
      required: ["name"],
    },
  },
];

export default clothFittingTools;
