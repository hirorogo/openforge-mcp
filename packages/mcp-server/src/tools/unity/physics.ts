import { ToolDefinition } from "../../registry.js";

const physicsTools: ToolDefinition[] = [
  {
    name: "add_rigidbody",
    description: "Add a Rigidbody component to a GameObject for physics simulation",
    category: "physics",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        mass: { type: "number", description: "Mass in kilograms", default: 1 },
        drag: { type: "number", description: "Drag coefficient" },
        angular_drag: { type: "number", description: "Angular drag coefficient" },
        use_gravity: { type: "boolean", description: "Whether gravity affects this body", default: true },
        is_kinematic: { type: "boolean", description: "If true, not affected by physics forces", default: false },
      },
      required: ["target"],
    },
  },
  {
    name: "add_collider",
    description: "Add a collider component (box, sphere, capsule, or mesh) to a GameObject",
    category: "physics",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        type: { type: "string", enum: ["box", "sphere", "capsule", "mesh"], description: "Collider type" },
        is_trigger: { type: "boolean", description: "Set as trigger collider", default: false },
        size: { type: "string", description: "Box collider size as 'x,y,z'" },
        center: { type: "string", description: "Collider center offset as 'x,y,z'" },
        radius: { type: "number", description: "Sphere/capsule radius" },
        height: { type: "number", description: "Capsule height" },
        convex: { type: "boolean", description: "Mesh collider convex flag", default: false },
      },
      required: ["target"],
    },
  },
  {
    name: "set_physics_material",
    description: "Create or assign a physics material to a collider for friction and bounce control",
    category: "physics",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        path: { type: "string", description: "Path to existing physics material asset" },
        name: { type: "string", description: "Name for a new physics material" },
        dynamic_friction: { type: "number", description: "Dynamic friction (0-1)" },
        static_friction: { type: "number", description: "Static friction (0-1)" },
        bounciness: { type: "number", description: "Bounciness (0-1)" },
      },
      required: ["target"],
    },
  },
  {
    name: "add_joint",
    description: "Add a physics joint (fixed, hinge, spring, configurable) between objects",
    category: "physics",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        type: { type: "string", enum: ["fixed", "hinge", "spring", "configurable"], description: "Joint type" },
        connected_body: { type: "string", description: "Connected Rigidbody GameObject name" },
        break_force: { type: "number", description: "Force needed to break the joint" },
        break_torque: { type: "number", description: "Torque needed to break the joint" },
        axis: { type: "string", description: "Hinge axis as 'x,y,z'" },
        spring_force: { type: "number", description: "Spring force" },
        damper: { type: "number", description: "Spring damper" },
      },
      required: ["target"],
    },
  },
  {
    name: "set_gravity",
    description: "Set the global physics gravity vector",
    category: "physics",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        gravity: { type: "string", description: "Gravity vector as 'x,y,z' (default: 0,-9.81,0)" },
      },
      required: ["gravity"],
    },
  },
  {
    name: "raycast",
    description: "Cast a ray in the physics world and return hit information",
    category: "physics",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        origin: { type: "string", description: "Ray origin as 'x,y,z'" },
        direction: { type: "string", description: "Ray direction as 'x,y,z'" },
        max_distance: { type: "number", description: "Maximum ray distance", default: 1000 },
        layer_mask: { type: "number", description: "Layer mask for filtering" },
        all: { type: "boolean", description: "Return all hits instead of just the first", default: false },
      },
      required: ["origin", "direction"],
    },
  },
  {
    name: "add_trigger",
    description: "Add a trigger collider to a GameObject for overlap detection",
    category: "physics",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        type: { type: "string", enum: ["box", "sphere", "capsule"], description: "Trigger shape" },
        size: { type: "string", description: "Box size as 'x,y,z'" },
        radius: { type: "number", description: "Sphere/capsule radius" },
      },
      required: ["target"],
    },
  },
  {
    name: "set_collision_layer",
    description: "Set the physics collision layer of a GameObject",
    category: "physics",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        layer: { type: "string", description: "Layer index (0-31) or layer name" },
        include_children: { type: "boolean", description: "Apply to all children too", default: false },
      },
      required: ["target", "layer"],
    },
  },
  {
    name: "get_physics_info",
    description: "Get physics component information for a GameObject (rigidbody, colliders, joints)",
    category: "physics",
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
    name: "add_constant_force",
    description: "Add a constant force component to continuously push a Rigidbody",
    category: "physics",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        force: { type: "string", description: "World-space force as 'x,y,z'" },
        relative_force: { type: "string", description: "Local-space force as 'x,y,z'" },
        torque: { type: "string", description: "World-space torque as 'x,y,z'" },
        relative_torque: { type: "string", description: "Local-space torque as 'x,y,z'" },
      },
      required: ["target"],
    },
  },
  {
    name: "set_rigidbody_constraints",
    description: "Set movement and rotation constraints on a Rigidbody",
    category: "physics",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        constraints: { type: "string", description: "Comma-separated constraints: freeze_position_x, freeze_position_y, freeze_position_z, freeze_rotation_x, freeze_rotation_y, freeze_rotation_z, freeze_position, freeze_rotation, freeze_all, none" },
      },
      required: ["target", "constraints"],
    },
  },
];

export default physicsTools;
