import { ToolDefinition } from "../../registry.js";

const cameraTools: ToolDefinition[] = [
  {
    name: "create_camera",
    description: "Create a new camera object with configurable lens and position",
    category: "camera",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Camera name", default: "Camera" },
        location: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" }, z: { type: "number" } },
          required: ["x", "y", "z"],
        },
        rotation: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" }, z: { type: "number" } },
          required: ["x", "y", "z"],
          description: "Euler rotation in radians",
        },
        focal_length: { type: "number", description: "Focal length in mm", default: 50.0 },
        set_active: { type: "boolean", description: "Set as active camera", default: true },
      },
    },
  },
  {
    name: "set_camera_focal_length",
    description: "Set the focal length of a camera lens",
    category: "camera",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Camera object name" },
        focal_length: { type: "number", description: "Focal length in mm", default: 50.0 },
      },
      required: ["name"],
    },
  },
  {
    name: "point_camera_at",
    description: "Point a camera at a specific location or object",
    category: "camera",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        camera_name: { type: "string", description: "Camera object name" },
        target: {
          type: "array",
          items: { type: "number" },
          description: "XYZ world position to look at",
        },
        target_object: { type: "string", description: "Object name to look at" },
      },
      required: ["camera_name"],
    },
  },
  {
    name: "set_active_camera",
    description: "Set a camera as the active scene camera for rendering",
    category: "camera",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Camera object name" },
      },
      required: ["name"],
    },
  },
  {
    name: "create_turntable",
    description: "Create a turntable camera animation orbiting around a center point",
    category: "camera",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        camera_name: { type: "string", description: "Existing camera to use" },
        target: {
          type: "array",
          items: { type: "number" },
          description: "Center point [x, y, z]",
        },
        radius: { type: "number", description: "Orbit radius", default: 10.0 },
        height: { type: "number", description: "Camera height", default: 5.0 },
        frames: { type: "number", description: "Frames for one revolution", default: 120 },
      },
    },
  },
  {
    name: "set_camera_dof",
    description: "Configure depth of field settings for a camera",
    category: "camera",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Camera object name" },
        use_dof: { type: "boolean", description: "Enable DOF", default: true },
        focus_distance: { type: "number", description: "Focus distance", default: 10.0 },
        fstop: { type: "number", description: "F-stop value", default: 2.8 },
        focus_object: { type: "string", description: "Object to auto-focus on" },
      },
      required: ["name"],
    },
  },
  {
    name: "track_to_constraint",
    description: "Add a Track To constraint so an object always points at a target",
    category: "camera",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name (typically camera)" },
        target_name: { type: "string", description: "Target object to track" },
        track_axis: { type: "string", description: "Axis pointing at target", default: "TRACK_NEGATIVE_Z" },
        up_axis: { type: "string", description: "Axis pointing up", default: "UP_Y" },
      },
      required: ["name", "target_name"],
    },
  },
  {
    name: "set_camera_resolution",
    description: "Set render resolution used by the active camera",
    category: "camera",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        x: { type: "number", description: "Horizontal resolution", default: 1920 },
        y: { type: "number", description: "Vertical resolution", default: 1080 },
        percentage: { type: "number", description: "Resolution scale %", default: 100 },
      },
    },
  },
];

export default cameraTools;
