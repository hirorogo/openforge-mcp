import { ToolDefinition } from "../../registry.js";

const physboneTools: ToolDefinition[] = [
  {
    name: "add_physbone",
    description:
      "Add a VRCPhysBone component to a GameObject via reflection. Optionally set root transform and physics parameters",
    category: "physbone",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name or instance ID of the target GameObject",
        },
        root_transform: {
          type: "string",
          description:
            "Name or ID of the root bone transform (defaults to the component's GameObject)",
        },
        pull: { type: "number", description: "Pull force (0-1)" },
        spring: { type: "number", description: "Spring elasticity (0-1)" },
        stiffness: { type: "number", description: "Stiffness (0-1)" },
        gravity: { type: "number", description: "Gravity strength (0-1)" },
        immobile: {
          type: "number",
          description: "How much the bone stays in place when its root moves (0-1)",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "configure_physbone",
    description:
      "Configure parameters on an existing VRCPhysBone component including Pull, Spring, Stiffness, Gravity, Immobile, limits, and interaction settings",
    category: "physbone",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name or instance ID of the GameObject with VRCPhysBone",
        },
        pull: { type: "number", description: "Pull force (0-1)" },
        spring: { type: "number", description: "Spring elasticity (0-1)" },
        stiffness: { type: "number", description: "Stiffness (0-1)" },
        gravity: { type: "number", description: "Gravity strength (0-1)" },
        gravity_falloff: { type: "number", description: "Gravity falloff (0-1)" },
        immobile: { type: "number", description: "Immobile amount (0-1)" },
        max_stretch: { type: "number", description: "Maximum stretch distance" },
        max_squish: { type: "number", description: "Maximum squish distance" },
        radius: { type: "number", description: "Collision radius" },
        integration_type: {
          type: "string",
          description: "Integration type: 'Simplified' or 'Advanced'",
        },
        allow_collision: {
          type: "string",
          description: "Allow collision: 'True', 'False', or parameter name",
        },
        allow_grabbing: {
          type: "string",
          description: "Allow grabbing: 'True', 'False', or parameter name",
        },
        allow_posing: {
          type: "string",
          description: "Allow posing: 'True', 'False', or parameter name",
        },
        limit_type: {
          type: "string",
          description: "Limit type: 'None', 'Angle', 'Hinge', 'Polar'",
        },
        max_angle_x: { type: "number", description: "Max angle X for limits" },
        max_angle_z: { type: "number", description: "Max angle Z for limits" },
      },
      required: ["name"],
    },
  },
  {
    name: "add_physbone_collider",
    description:
      "Add a VRCPhysBoneCollider component (sphere, capsule, or plane) to a GameObject",
    category: "physbone",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name or instance ID of the target GameObject",
        },
        shape: {
          type: "string",
          description: "Collider shape: 'sphere', 'capsule', or 'plane' (default: sphere)",
        },
        radius: {
          type: "number",
          description: "Collider radius (default: 0.05)",
        },
        height: {
          type: "number",
          description: "Collider height for capsule shape",
        },
        position: {
          type: "string",
          description: "Position offset as 'x,y,z'",
        },
        rotation: {
          type: "string",
          description: "Rotation offset as 'x,y,z' (euler angles)",
        },
        inside_bounds: {
          type: "boolean",
          description: "Whether to keep bones inside the collider bounds",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "setup_hair_physbone",
    description:
      "Auto-setup VRCPhysBone with hair preset values: Pull=0.2, Spring=0.4, Stiffness=0.1, Gravity=0.15, Immobile=0.3",
    category: "physbone",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name or instance ID of the hair bone root GameObject",
        },
        root_transform: {
          type: "string",
          description: "Optional root bone transform name or ID",
        },
        pull: { type: "number", description: "Override pull (default: 0.2)" },
        spring: { type: "number", description: "Override spring (default: 0.4)" },
        stiffness: { type: "number", description: "Override stiffness (default: 0.1)" },
        gravity: { type: "number", description: "Override gravity (default: 0.15)" },
        immobile: { type: "number", description: "Override immobile (default: 0.3)" },
      },
      required: ["name"],
    },
  },
  {
    name: "setup_skirt_physbone",
    description:
      "Auto-setup VRCPhysBone with skirt preset values: Pull=0.2, Spring=0.3, Stiffness=0.05, Gravity=0.2, Immobile=0",
    category: "physbone",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name or instance ID of the skirt bone root GameObject",
        },
        root_transform: {
          type: "string",
          description: "Optional root bone transform name or ID",
        },
        pull: { type: "number", description: "Override pull (default: 0.2)" },
        spring: { type: "number", description: "Override spring (default: 0.3)" },
        stiffness: { type: "number", description: "Override stiffness (default: 0.05)" },
        gravity: { type: "number", description: "Override gravity (default: 0.2)" },
        immobile: { type: "number", description: "Override immobile (default: 0)" },
      },
      required: ["name"],
    },
  },
  {
    name: "setup_tail_physbone",
    description:
      "Auto-setup VRCPhysBone with tail/kemonomimi preset values: Pull=0.2, Spring=0.5, Stiffness=0.2, Gravity=0.1, Immobile=0.2",
    category: "physbone",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name or instance ID of the tail/ear bone root GameObject",
        },
        root_transform: {
          type: "string",
          description: "Optional root bone transform name or ID",
        },
        pull: { type: "number", description: "Override pull (default: 0.2)" },
        spring: { type: "number", description: "Override spring (default: 0.5)" },
        stiffness: { type: "number", description: "Override stiffness (default: 0.2)" },
        gravity: { type: "number", description: "Override gravity (default: 0.1)" },
        immobile: { type: "number", description: "Override immobile (default: 0.2)" },
      },
      required: ["name"],
    },
  },
  {
    name: "setup_accessory_physbone",
    description:
      "Auto-setup VRCPhysBone with accessory preset (earrings, ribbons, etc.): Pull=0.2, Spring=0.8, Stiffness=0.3, Gravity=0.5, Immobile=0.5",
    category: "physbone",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            "Name or instance ID of the accessory bone root GameObject",
        },
        root_transform: {
          type: "string",
          description: "Optional root bone transform name or ID",
        },
        pull: { type: "number", description: "Override pull (default: 0.2)" },
        spring: { type: "number", description: "Override spring (default: 0.8)" },
        stiffness: { type: "number", description: "Override stiffness (default: 0.3)" },
        gravity: { type: "number", description: "Override gravity (default: 0.5)" },
        immobile: { type: "number", description: "Override immobile (default: 0.5)" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_physbones",
    description:
      "List all VRCPhysBone components in the scene with their settings (pull, spring, stiffness, gravity, etc.)",
    category: "physbone",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_physbone_info",
    description:
      "Get detailed VRCPhysBone configuration for a specific GameObject including all physics parameters",
    category: "physbone",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name or instance ID of the GameObject with VRCPhysBone",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "copy_physbone_settings",
    description:
      "Copy all VRCPhysBone settings from one GameObject to another, creating the component on the destination if needed",
    category: "physbone",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        source: {
          type: "string",
          description: "Name or instance ID of the source GameObject",
        },
        destination: {
          type: "string",
          description: "Name or instance ID of the destination GameObject",
        },
      },
      required: ["source", "destination"],
    },
  },
];

export default physboneTools;
