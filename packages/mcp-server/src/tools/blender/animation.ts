import { ToolDefinition } from "../../registry.js";

const animationTools: ToolDefinition[] = [
  {
    name: "insert_keyframe",
    description: "Insert a keyframe on an object property at a specified frame",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the object to keyframe",
        },
        data_path: {
          type: "string",
          description: "Property path (e.g. 'location', 'rotation_euler', 'scale')",
          default: "location",
        },
        frame: {
          type: "number",
          description: "Frame number to insert the keyframe at",
          default: 1,
        },
        index: {
          type: "number",
          description: "Array index (-1 for all channels)",
          default: -1,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "delete_keyframe",
    description: "Delete a keyframe on an object property at a specified frame",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the object",
        },
        data_path: {
          type: "string",
          description: "Property path",
          default: "location",
        },
        frame: {
          type: "number",
          description: "Frame number of the keyframe to delete",
          default: 1,
        },
        index: {
          type: "number",
          description: "Array index (-1 for all channels)",
          default: -1,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "create_action",
    description: "Create a new animation action and assign it to an object",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        action_name: {
          type: "string",
          description: "Name for the new action",
        },
      },
      required: ["name", "action_name"],
    },
  },
  {
    name: "set_frame_range_anim",
    description: "Set the animation playback frame range",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        start: {
          type: "number",
          description: "Start frame",
          default: 1,
        },
        end: {
          type: "number",
          description: "End frame",
          default: 250,
        },
      },
    },
  },
  {
    name: "set_interpolation",
    description: "Set interpolation type for all keyframes of an object's action",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        interpolation: {
          type: "string",
          enum: ["CONSTANT", "LINEAR", "BEZIER", "SINE", "QUAD", "CUBIC", "QUART", "QUINT", "EXPO", "CIRC", "BACK", "BOUNCE", "ELASTIC"],
          description: "Interpolation type",
          default: "BEZIER",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "create_walk_cycle",
    description: "Create a procedural walk cycle animation using location keyframes",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        stride_length: {
          type: "number",
          description: "Distance per step",
          default: 1.0,
        },
        cycle_frames: {
          type: "number",
          description: "Frames for one full walk cycle",
          default: 24,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "create_run_cycle",
    description: "Create a procedural run cycle animation using location keyframes",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        stride_length: {
          type: "number",
          description: "Distance per step",
          default: 2.0,
        },
        cycle_frames: {
          type: "number",
          description: "Frames for one full run cycle",
          default: 16,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "create_idle_animation",
    description: "Create a subtle idle breathing/bobbing animation",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        amplitude: {
          type: "number",
          description: "Vertical bob amount",
          default: 0.05,
        },
        cycle_frames: {
          type: "number",
          description: "Frames for one idle cycle",
          default: 60,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "set_animation_speed",
    description: "Scale the timing of all keyframes on an object's action",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        speed_factor: {
          type: "number",
          description: "Speed multiplier (>1 faster, <1 slower)",
          default: 1.0,
        },
      },
      required: ["name", "speed_factor"],
    },
  },
  {
    name: "bake_animation",
    description: "Bake object animation to keyframes for the given frame range",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        frame_start: {
          type: "number",
          description: "Start frame",
          default: 1,
        },
        frame_end: {
          type: "number",
          description: "End frame",
          default: 250,
        },
        step: {
          type: "number",
          description: "Sample every N frames",
          default: 1,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "create_nla_track",
    description: "Push the current action onto a new NLA track",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
        track_name: {
          type: "string",
          description: "Name for the NLA track",
          default: "NLATrack",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "loop_animation",
    description: "Add cyclic modifiers to all F-Curves to make the animation loop",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Object name",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "set_fps",
    description: "Set the scene frames-per-second value",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        fps: {
          type: "number",
          description: "Frames per second",
          default: 24,
        },
      },
    },
  },
  {
    name: "retarget_animation",
    description: "Copy animation from one object to another via action duplication",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        source_name: {
          type: "string",
          description: "Source object name (must have an action)",
        },
        target_name: {
          type: "string",
          description: "Target object name",
        },
      },
      required: ["source_name", "target_name"],
    },
  },
  {
    name: "import_mixamo_animation",
    description: "Import a Mixamo FBX animation file and optionally retarget to an armature",
    category: "animation",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        filepath: {
          type: "string",
          description: "Path to the Mixamo FBX file",
        },
        target_name: {
          type: "string",
          description: "Name of the armature to retarget the animation to",
        },
      },
      required: ["filepath"],
    },
  },
];

export default animationTools;
