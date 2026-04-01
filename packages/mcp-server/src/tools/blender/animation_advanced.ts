import { ToolDefinition } from "../../registry.js";

const animationAdvancedTools: ToolDefinition[] = [
  {
    name: "copy_bone_pose",
    description: "Copy pose (location, rotation, scale) from one bone to another",
    category: "animation_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature object name" },
        source_bone: { type: "string", description: "Source pose bone name" },
        target_bone: { type: "string", description: "Target pose bone name" },
      },
      required: ["armature_name", "source_bone", "target_bone"],
    },
  },
  {
    name: "get_all_poses",
    description: "Get all bone poses (location, rotation, scale) in an armature",
    category: "animation_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature object name" },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "get_bone_keyframes",
    description: "Get all keyframes for a specific bone in the active action",
    category: "animation_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature object name" },
        bone_name: { type: "string", description: "Bone name" },
      },
      required: ["armature_name", "bone_name"],
    },
  },
  {
    name: "animate_location",
    description: "Create a location animation between two points",
    category: "animation_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        start_frame: { type: "number", description: "Start frame", default: 1 },
        end_frame: { type: "number", description: "End frame", default: 60 },
        start_location: { type: "array", items: { type: "number" }, description: "Starting [x, y, z]" },
        end_location: { type: "array", items: { type: "number" }, description: "Ending [x, y, z]" },
      },
      required: ["name"],
    },
  },
  {
    name: "animate_rotation",
    description: "Create a rotation animation between two euler angles",
    category: "animation_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        start_frame: { type: "number", description: "Start frame", default: 1 },
        end_frame: { type: "number", description: "End frame", default: 60 },
        start_rotation: { type: "array", items: { type: "number" }, description: "Starting euler [x, y, z] in degrees" },
        end_rotation: { type: "array", items: { type: "number" }, description: "Ending euler [x, y, z] in degrees" },
      },
      required: ["name"],
    },
  },
  {
    name: "animate_scale",
    description: "Create a scale animation between two scale values",
    category: "animation_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        start_frame: { type: "number", description: "Start frame", default: 1 },
        end_frame: { type: "number", description: "End frame", default: 60 },
        start_scale: { type: "array", items: { type: "number" }, description: "Starting [x, y, z] scale" },
        end_scale: { type: "array", items: { type: "number" }, description: "Ending [x, y, z] scale" },
      },
      required: ["name"],
    },
  },
  {
    name: "clear_animation",
    description: "Remove all animation data from an object",
    category: "animation_advanced",
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
    name: "get_animation_info",
    description: "Get animation data information including action, fcurves, and NLA tracks",
    category: "animation_advanced",
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
    name: "split_animation",
    description: "Split an animation action into multiple clip actions by frame ranges",
    category: "animation_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        splits: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Clip name" },
              start: { type: "number", description: "Start frame" },
              end: { type: "number", description: "End frame" },
            },
            required: ["name", "start", "end"],
          },
          description: "List of clip definitions",
        },
      },
      required: ["name", "splits"],
    },
  },
  {
    name: "mirror_animation",
    description: "Mirror animation data left/right by swapping .L/.R bone channels",
    category: "animation_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        armature_name: { type: "string", description: "Armature object name" },
      },
      required: ["armature_name"],
    },
  },
  {
    name: "export_animation",
    description: "Export animation only as FBX file",
    category: "animation_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name (typically armature)" },
        filepath: { type: "string", description: "Output FBX file path" },
      },
      required: ["name", "filepath"],
    },
  },
  {
    name: "add_follow_path",
    description: "Add a Follow Path constraint for animating an object along a curve",
    category: "animation_advanced",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        curve_name: { type: "string", description: "Curve object to follow" },
        use_fixed_location: { type: "boolean", description: "Use fixed position along path", default: false },
        forward_axis: { type: "string", enum: ["FORWARD_X", "FORWARD_Y", "FORWARD_Z", "TRACK_NEGATIVE_X", "TRACK_NEGATIVE_Y", "TRACK_NEGATIVE_Z"], default: "FORWARD_Y" },
        up_axis: { type: "string", enum: ["UP_X", "UP_Y", "UP_Z"], default: "UP_Z" },
        animate: { type: "boolean", description: "Set up path animation", default: true },
        frame_start: { type: "number", description: "Start frame", default: 1 },
        frame_end: { type: "number", description: "End frame", default: 100 },
      },
      required: ["name", "curve_name"],
    },
  },
];

export default animationAdvancedTools;
