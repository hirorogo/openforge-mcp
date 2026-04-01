import { ToolDefinition } from "../../registry.js";

const cameraTools: ToolDefinition[] = [
  {
    name: "create_camera",
    description: "Create a new Camera in the scene",
    category: "camera",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Camera name" },
        position: { type: "string", description: "Position as 'x,y,z'" },
        rotation: { type: "string", description: "Rotation as 'x,y,z' euler angles" },
        fov: { type: "number", description: "Field of view in degrees" },
        orthographic: { type: "boolean", description: "Use orthographic projection" },
        orthographic_size: { type: "number", description: "Orthographic camera size" },
        depth: { type: "number", description: "Camera render depth" },
        culling_mask: { type: "number", description: "Culling mask as layer bitmask" },
      },
      required: [],
    },
  },
  {
    name: "set_camera_fov",
    description: "Set the field of view of a Camera",
    category: "camera",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID with a Camera" },
        fov: { type: "number", description: "Field of view in degrees" },
      },
      required: ["target", "fov"],
    },
  },
  {
    name: "set_camera_clipping",
    description: "Set the near and far clipping planes of a Camera",
    category: "camera",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID with a Camera" },
        near: { type: "number", description: "Near clipping plane distance" },
        far: { type: "number", description: "Far clipping plane distance" },
      },
      required: ["target"],
    },
  },
  {
    name: "set_camera_clear_flags",
    description: "Set how the Camera clears the background",
    category: "camera",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID with a Camera" },
        clear_flags: { type: "string", enum: ["skybox", "solid_color", "depth", "nothing"], description: "Clear mode" },
        background_color: { type: "string", description: "Background color for solid_color mode" },
      },
      required: ["target", "clear_flags"],
    },
  },
  {
    name: "set_camera_target",
    description: "Point a Camera to look at a target GameObject",
    category: "camera",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Camera GameObject name or ID" },
        look_at: { type: "string", description: "Target GameObject to look at" },
      },
      required: ["target", "look_at"],
    },
  },
  {
    name: "create_cinemachine_vcam",
    description: "Create a Cinemachine Virtual Camera (requires Cinemachine package)",
    category: "camera",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Virtual camera name" },
        position: { type: "string", description: "Position as 'x,y,z'" },
        follow: { type: "string", description: "GameObject to follow" },
        look_at: { type: "string", description: "GameObject to look at" },
        priority: { type: "number", description: "Camera priority (higher = more important)" },
      },
      required: [],
    },
  },
  {
    name: "create_cinemachine_freelook",
    description: "Create a Cinemachine FreeLook camera for orbit-style third person (requires Cinemachine)",
    category: "camera",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "FreeLook camera name" },
        follow: { type: "string", description: "GameObject to follow" },
        look_at: { type: "string", description: "GameObject to look at" },
      },
      required: [],
    },
  },
  {
    name: "create_dolly_track",
    description: "Create a Cinemachine dolly track with waypoints (requires Cinemachine)",
    category: "camera",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Track name" },
        waypoints: { type: "string", description: "Semicolon-separated waypoints as 'x,y,z;x,y,z;...'" },
      },
      required: [],
    },
  },
  {
    name: "set_cinemachine_follow",
    description: "Set the follow target of a Cinemachine virtual camera",
    category: "camera",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        vcam: { type: "string", description: "Virtual camera name or ID" },
        follow: { type: "string", description: "Target GameObject to follow" },
      },
      required: ["vcam", "follow"],
    },
  },
  {
    name: "set_cinemachine_look_at",
    description: "Set the look-at target of a Cinemachine virtual camera",
    category: "camera",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        vcam: { type: "string", description: "Virtual camera name or ID" },
        look_at: { type: "string", description: "Target GameObject to look at" },
      },
      required: ["vcam", "look_at"],
    },
  },
  {
    name: "create_camera_shake",
    description: "Create a camera shake effect via Cinemachine noise or a custom script",
    category: "camera",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Virtual camera to add noise to" },
        name: { type: "string", description: "Script name for custom shake" },
        amplitude: { type: "number", description: "Shake amplitude", default: 0.5 },
        frequency: { type: "number", description: "Shake frequency", default: 10 },
      },
      required: [],
    },
  },
  {
    name: "set_camera_depth",
    description: "Set the render depth/order of a Camera",
    category: "camera",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID with a Camera" },
        depth: { type: "number", description: "Camera depth value (higher renders on top)" },
      },
      required: ["target", "depth"],
    },
  },
];

export default cameraTools;
