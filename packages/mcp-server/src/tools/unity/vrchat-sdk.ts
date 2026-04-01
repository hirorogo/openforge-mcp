import { ToolDefinition } from "../../registry.js";

const vrchatSdkTools: ToolDefinition[] = [
  {
    name: "check_sdk_installed",
    description:
      "Check if VRChat SDK is installed in the Unity project and return version information",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "setup_vrc_world",
    description:
      "Find or create a VRCSceneDescriptor in the scene and configure basic world settings such as spawn position, respawn height, and reference camera",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        spawn_position: {
          type: "string",
          description: "Initial spawn position as 'x,y,z' (default: 0,0,0)",
        },
        respawn_height: {
          type: "number",
          description:
            "Y position below which players respawn (default: -100)",
        },
        reference_camera: {
          type: "string",
          description:
            "Name or ID of a GameObject with Camera to use as reference camera",
        },
      },
      required: [],
    },
  },
  {
    name: "add_spawn_point",
    description:
      "Create an empty GameObject at the specified position and add it to the VRCSceneDescriptor spawn list",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        position: {
          type: "string",
          description: "Spawn position as 'x,y,z' (default: 0,0,0)",
        },
        name: {
          type: "string",
          description: "Name of the spawn point GameObject (default: SpawnPoint)",
        },
      },
      required: [],
    },
  },
  {
    name: "set_spawn_order",
    description:
      "Configure spawn order (sequential, random, first) and spawn orientation on the VRCSceneDescriptor",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        order: {
          type: "string",
          description:
            "Spawn order mode: 'sequential', 'random', or 'first' (default: sequential)",
        },
        rotation: {
          type: "string",
          description:
            "Spawn orientation: 'AlignPlayerWithSpawnPoint' or 'AlignRoomWithSpawnPoint'",
        },
      },
      required: [],
    },
  },
  {
    name: "add_mirror",
    description:
      "Create a plane with VRC_MirrorReflection component for in-world mirrors",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the mirror GameObject (default: VRCMirror)",
        },
        position: {
          type: "string",
          description: "Position as 'x,y,z' (default: 0,1.5,0)",
        },
        scale: {
          type: "string",
          description: "Scale as 'x,y,z' (default: 3,3,1)",
        },
      },
      required: [],
    },
  },
  {
    name: "add_pickup",
    description:
      "Add a VRC_Pickup component to an existing GameObject, automatically adding a Rigidbody if missing",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name or instance ID of the target GameObject",
        },
        proximity: {
          type: "number",
          description: "Pickup proximity distance",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "add_portal",
    description:
      "Create a portal GameObject with VRCPortalMarker that links to another VRChat world",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        world_id: {
          type: "string",
          description: "Target VRChat world ID (e.g. wrld_xxx)",
        },
        name: {
          type: "string",
          description: "Name of the portal GameObject (default: VRCPortal)",
        },
        position: {
          type: "string",
          description: "Position as 'x,y,z' (default: 0,0,0)",
        },
      },
      required: ["world_id"],
    },
  },
  {
    name: "set_world_capacity",
    description:
      "Set the recommended and maximum player capacity on the VRCSceneDescriptor",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        recommended: {
          type: "number",
          description: "Recommended player capacity",
        },
        max: {
          type: "number",
          description: "Maximum player capacity",
        },
      },
      required: [],
    },
  },
  {
    name: "add_video_player",
    description:
      "Create a GameObject with a VRC video player component (AVPro or Unity) and a screen quad",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the video player GameObject (default: VideoPlayer)",
        },
        type: {
          type: "string",
          description:
            "Video player type: 'avpro' or 'unity' (default: avpro)",
        },
        position: {
          type: "string",
          description: "Position as 'x,y,z' (default: 0,2,0)",
        },
        url: {
          type: "string",
          description: "Default video URL to set",
        },
      },
      required: [],
    },
  },
  {
    name: "add_chair",
    description:
      "Create a sittable object with VRCStation component, trigger collider, and player position marker",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the chair GameObject (default: VRCChair)",
        },
        position: {
          type: "string",
          description: "Position as 'x,y,z' (default: 0,0,0)",
        },
        rotation: {
          type: "string",
          description: "Rotation as 'x,y,z' (default: 0,0,0)",
        },
        can_exit: {
          type: "boolean",
          description: "Whether players can exit the station (default: true)",
        },
      },
      required: [],
    },
  },
  {
    name: "setup_vrc_avatar",
    description:
      "Add VRCAvatarDescriptor to a GameObject and configure basic avatar settings. Auto-detects viewpoint from head bone if available",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name or instance ID of the avatar root GameObject",
        },
        lip_sync: {
          type: "string",
          description:
            "Lip sync mode: 'Default', 'JawFlapBone', 'JawFlapBlendShape', 'VisemeBlendShape', 'VisemeParameterOnly'",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "set_viewpoint",
    description:
      "Set the avatar viewpoint position on VRCAvatarDescriptor, either manually or auto-detected from head bone",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name or instance ID of the avatar root GameObject",
        },
        position: {
          type: "string",
          description:
            "Viewpoint position in local space as 'x,y,z' (relative to avatar root)",
        },
        auto_detect: {
          type: "boolean",
          description:
            "Auto-detect viewpoint from head bone (requires humanoid rig, default: false)",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "validate_for_upload",
    description:
      "Check all VRChat requirements for uploading: SDK presence, descriptor, performance stats, and common issues",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_vrc_components",
    description:
      "List all VRChat SDK components found in the current scene with their types and attached GameObjects",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "estimate_performance",
    description:
      "Estimate avatar or world performance rank based on polygon count, material count, PhysBone count, and other metrics",
    category: "vrchat",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            "Name or instance ID of a specific avatar/object to evaluate (auto-detects if omitted)",
        },
      },
      required: [],
    },
  },
];

export default vrchatSdkTools;
