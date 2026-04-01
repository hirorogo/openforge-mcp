import { ToolDefinition } from "../../registry.js";

const animationTools: ToolDefinition[] = [
  {
    name: "create_animator_controller",
    description: "Create a new Animator Controller asset and optionally assign it to a GameObject",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the animator controller" },
        path: { type: "string", description: "Asset path to save the controller (e.g. Assets/Animations/MyController.controller)" },
        target: { type: "string", description: "GameObject name or ID to assign the controller to" },
      },
      required: [],
    },
  },
  {
    name: "add_animation_state",
    description: "Add a new animation state to an Animator Controller layer",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        controller: { type: "string", description: "Asset path of the animator controller" },
        state_name: { type: "string", description: "Name of the new state" },
        clip: { type: "string", description: "Asset path of the animation clip to assign" },
        layer: { type: "number", description: "Layer index (default: 0)", default: 0 },
        is_default: { type: "boolean", description: "Set as the default state", default: false },
      },
      required: ["controller", "state_name"],
    },
  },
  {
    name: "set_transition",
    description: "Create a transition between two animation states with optional conditions",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        controller: { type: "string", description: "Asset path of the animator controller" },
        from: { type: "string", description: "Source state name" },
        to: { type: "string", description: "Destination state name" },
        layer: { type: "number", description: "Layer index", default: 0 },
        has_exit_time: { type: "boolean", description: "Whether the transition waits for exit time", default: true },
        exit_time: { type: "number", description: "Normalized exit time (0-1)", default: 1 },
        duration: { type: "number", description: "Transition duration in seconds", default: 0.25 },
        condition_param: { type: "string", description: "Parameter name for transition condition" },
        condition_mode: { type: "string", description: "Condition mode: If, IfNot, Greater, Less, Equals, NotEqual" },
        condition_threshold: { type: "number", description: "Threshold value for the condition" },
      },
      required: ["controller", "from", "to"],
    },
  },
  {
    name: "create_blend_tree",
    description: "Create a blend tree in an Animator Controller for smooth animation blending",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        controller: { type: "string", description: "Asset path of the animator controller" },
        name: { type: "string", description: "Name of the blend tree" },
        parameter: { type: "string", description: "Blend parameter name (auto-created if not existing)" },
        blend_type: { type: "string", description: "Blend type: Simple1D, SimpleDirectional2D, FreeformDirectional2D, FreeformCartesian2D" },
        layer: { type: "number", description: "Layer index", default: 0 },
      },
      required: ["controller"],
    },
  },
  {
    name: "add_animation_event",
    description: "Add an animation event to a clip that calls a function at a specific time",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        clip: { type: "string", description: "Asset path of the animation clip" },
        function: { type: "string", description: "Name of the function to call" },
        time: { type: "number", description: "Time in seconds when the event fires", default: 0 },
        string_param: { type: "string", description: "String parameter to pass to the function" },
        float_param: { type: "number", description: "Float parameter to pass to the function" },
        int_param: { type: "number", description: "Integer parameter to pass to the function" },
      },
      required: ["clip", "function"],
    },
  },
  {
    name: "set_animation_clip",
    description: "Assign an animation clip to a state in a GameObject's Animator",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID with an Animator" },
        clip: { type: "string", description: "Asset path of the animation clip" },
        state: { type: "string", description: "State name to assign the clip to (first state if empty)" },
      },
      required: ["target", "clip"],
    },
  },
  {
    name: "play_animation",
    description: "Play an animation state on a GameObject's Animator",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        state: { type: "string", description: "State name to play" },
        layer: { type: "number", description: "Layer index", default: 0 },
      },
      required: ["target", "state"],
    },
  },
  {
    name: "stop_animation",
    description: "Stop all animations on a GameObject's Animator",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
      },
      required: ["target"],
    },
  },
  {
    name: "get_animator_info",
    description: "Get detailed information about a GameObject's Animator including parameters, layers, and states",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
      },
      required: ["target"],
    },
  },
  {
    name: "set_animator_parameter",
    description: "Add a parameter to an Animator Controller",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        controller: { type: "string", description: "Asset path of the animator controller" },
        target: { type: "string", description: "Alternative: GameObject name with an Animator" },
        param_name: { type: "string", description: "Parameter name" },
        param_type: { type: "string", enum: ["float", "int", "bool", "trigger"], description: "Parameter type" },
        default_value: { type: "string", description: "Default value for the parameter" },
      },
      required: ["param_name", "param_type"],
    },
  },
  {
    name: "create_animation_clip",
    description: "Create a new empty animation clip asset",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Clip name" },
        path: { type: "string", description: "Asset save path" },
        loop: { type: "boolean", description: "Enable looping", default: false },
        length: { type: "number", description: "Clip length in seconds", default: 1 },
      },
      required: [],
    },
  },
  {
    name: "set_animation_curve",
    description: "Set an animation curve on a clip with keyframes",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        clip: { type: "string", description: "Asset path of the animation clip" },
        property: { type: "string", description: "Property name to animate (e.g. localPosition.x)" },
        type: { type: "string", description: "Component type name (e.g. Transform)", default: "Transform" },
        relative_path: { type: "string", description: "Relative path to the target object" },
        keys: { type: "string", description: "Keyframes as semicolon-separated time,value pairs (e.g. '0,0;0.5,1;1,0')" },
      },
      required: ["clip", "property", "keys"],
    },
  },
  {
    name: "set_avatar_mask",
    description: "Set an avatar mask on an Animator Controller layer",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        controller: { type: "string", description: "Asset path of the animator controller" },
        layer: { type: "number", description: "Layer index", default: 0 },
        mask_path: { type: "string", description: "Asset path of existing avatar mask" },
        name: { type: "string", description: "Name for a new avatar mask (if mask_path not provided)" },
      },
      required: ["controller"],
    },
  },
  {
    name: "retarget_animation",
    description: "Retarget a humanoid animation clip to a different avatar",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        clip: { type: "string", description: "Asset path of the animation clip or FBX" },
        target_avatar: { type: "string", description: "Asset path of the target avatar or model" },
      },
      required: ["clip", "target_avatar"],
    },
  },
  {
    name: "import_mixamo",
    description: "Import and configure a Mixamo FBX animation with humanoid settings",
    category: "animation",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Asset path of the Mixamo FBX file" },
        loop: { type: "boolean", description: "Enable animation looping", default: false },
        rename: { type: "string", description: "Rename the animation clip" },
      },
      required: ["path"],
    },
  },
];

export default animationTools;
