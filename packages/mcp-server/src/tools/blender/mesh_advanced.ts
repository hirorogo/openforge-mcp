import { ToolDefinition } from "../../registry.js";

const meshAdvancedTools: ToolDefinition[] = [
  {
    name: "bridge_edge_loops",
    description: "Bridge two selected edge loops to create connecting faces",
    category: "mesh_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        segments: { type: "number", description: "Number of bridge segments", default: 1 },
        profile_shape: { type: "number", description: "Profile shape factor (0.0 to 1.0)", default: 1.0 },
      },
      required: ["name"],
    },
  },
  {
    name: "fill_holes",
    description: "Fill holes in a mesh by creating faces in boundary loops",
    category: "mesh_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        sides: { type: "number", description: "Maximum number of sides for holes to fill", default: 4 },
      },
      required: ["name"],
    },
  },
  {
    name: "flip_face_normals",
    description: "Flip face normals of all selected faces",
    category: "mesh_advanced",
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
    name: "recalculate_outside_normals",
    description: "Recalculate face normals to point outward (or inward)",
    category: "mesh_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        inside: { type: "boolean", description: "Point normals inward", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "inset_faces",
    description: "Inset selected faces by adding a border ring",
    category: "mesh_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        thickness: { type: "number", description: "Inset border width", default: 0.1 },
        depth: { type: "number", description: "Inset depth (positive outward, negative inward)", default: 0.0 },
        use_individual: { type: "boolean", description: "Inset each face individually", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "poke_faces",
    description: "Poke faces by adding a center vertex to each selected face",
    category: "mesh_advanced",
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
    name: "loop_cut",
    description: "Add loop cuts to a mesh at a specified edge",
    category: "mesh_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        number_cuts: { type: "number", description: "Number of loop cuts", default: 1 },
        edge_index: { type: "number", description: "Edge index for loop cut placement", default: 0 },
        factor: { type: "number", description: "Offset factor (-1.0 to 1.0)", default: 0.0 },
      },
      required: ["name"],
    },
  },
  {
    name: "mark_sharp",
    description: "Mark or clear sharp edges on a mesh for normal shading",
    category: "mesh_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        edge_indices: { type: "array", items: { type: "number" }, description: "Edge indices to mark" },
        clear: { type: "boolean", description: "Clear sharp marking instead of setting", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "mark_freestyle",
    description: "Mark or clear freestyle edges for NPR rendering",
    category: "mesh_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        edge_indices: { type: "array", items: { type: "number" }, description: "Edge indices to mark" },
        clear: { type: "boolean", description: "Clear freestyle marking", default: false },
      },
      required: ["name"],
    },
  },
  {
    name: "set_shade_smooth",
    description: "Set smooth shading on the entire object",
    category: "mesh_advanced",
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
    name: "set_shade_flat",
    description: "Set flat shading on the entire object",
    category: "mesh_advanced",
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
    name: "auto_smooth",
    description: "Set auto smooth angle for automatic smooth/flat shading based on face angle",
    category: "mesh_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        angle: { type: "number", description: "Auto smooth angle in degrees", default: 30.0 },
      },
      required: ["name"],
    },
  },
  {
    name: "solidify",
    description: "Add thickness to a mesh via Solidify modifier",
    category: "mesh_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        thickness: { type: "number", description: "Wall thickness", default: 0.1 },
        offset: { type: "number", description: "Direction (-1 inward, 1 outward)", default: -1.0 },
        apply: { type: "boolean", description: "Apply modifier immediately", default: true },
      },
      required: ["name"],
    },
  },
  {
    name: "spin_mesh",
    description: "Spin (lathe) geometry around an axis to create surfaces of revolution",
    category: "mesh_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        angle: { type: "number", description: "Spin angle in degrees", default: 360.0 },
        steps: { type: "number", description: "Number of steps", default: 16 },
        axis: { type: "array", items: { type: "number" }, description: "Spin axis [x, y, z]" },
        center: { type: "array", items: { type: "number" }, description: "Center point [x, y, z]" },
      },
      required: ["name"],
    },
  },
  {
    name: "split_edges",
    description: "Split edges to create hard normals for custom split normals workflow",
    category: "mesh_advanced",
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
    name: "triangulate",
    description: "Convert all faces to triangles for game engine export",
    category: "mesh_advanced",
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
      },
      required: ["name"],
    },
  },
  {
    name: "convert_to_quads",
    description: "Convert triangles to quads (tris-to-quads) for cleaner topology",
    category: "mesh_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        face_threshold: { type: "number", description: "Max angle between normals (degrees)", default: 40.0 },
        shape_threshold: { type: "number", description: "Max shape deviation (degrees)", default: 40.0 },
      },
      required: ["name"],
    },
  },
  {
    name: "select_non_manifold",
    description: "Select non-manifold geometry (holes, boundary edges, wire edges)",
    category: "mesh_advanced",
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
    name: "select_loose",
    description: "Select loose vertices and edges not connected to any face",
    category: "mesh_advanced",
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
    name: "proportional_edit",
    description: "Transform selected vertices with proportional editing falloff",
    category: "mesh_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        move: { type: "array", items: { type: "number" }, description: "Translation vector [x, y, z]" },
        proportional_size: { type: "number", description: "Radius of influence", default: 1.0 },
        falloff_type: {
          type: "string",
          enum: ["SMOOTH", "SPHERE", "ROOT", "INVERSE_SQUARE", "SHARP", "LINEAR", "CONSTANT", "RANDOM"],
          default: "SMOOTH",
        },
      },
      required: ["name"],
    },
  },
];

export default meshAdvancedTools;
