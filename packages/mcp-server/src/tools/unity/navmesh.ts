import { ToolDefinition } from "../../registry.js";

const navmeshTools: ToolDefinition[] = [
  {
    name: "bake_navmesh",
    description: "Bake the navigation mesh for AI pathfinding",
    category: "navmesh",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        agent_radius: { type: "number", description: "Agent radius for navigation" },
        agent_height: { type: "number", description: "Agent height" },
        max_slope: { type: "number", description: "Maximum walkable slope in degrees" },
        step_height: { type: "number", description: "Maximum step height the agent can climb" },
      },
      required: [],
    },
  },
  {
    name: "add_navmesh_agent",
    description: "Add a NavMeshAgent component for AI navigation",
    category: "navmesh",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        speed: { type: "number", description: "Agent movement speed" },
        angular_speed: { type: "number", description: "Agent turning speed" },
        acceleration: { type: "number", description: "Agent acceleration" },
        stopping_distance: { type: "number", description: "Distance to stop from destination" },
        radius: { type: "number", description: "Agent avoidance radius" },
        height: { type: "number", description: "Agent height" },
      },
      required: ["target"],
    },
  },
  {
    name: "set_navmesh_destination",
    description: "Set the navigation destination for a NavMeshAgent",
    category: "navmesh",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID with NavMeshAgent" },
        destination: { type: "string", description: "Destination as 'x,y,z' or a GameObject name" },
      },
      required: ["target", "destination"],
    },
  },
  {
    name: "add_navmesh_obstacle",
    description: "Add a NavMeshObstacle for dynamic navigation blocking",
    category: "navmesh",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        shape: { type: "string", enum: ["box", "capsule"], description: "Obstacle shape" },
        carve: { type: "boolean", description: "Whether the obstacle carves the navmesh" },
        size: { type: "string", description: "Obstacle size as 'x,y,z'" },
      },
      required: ["target"],
    },
  },
  {
    name: "add_navmesh_link",
    description: "Create an off-mesh link for jumping or special navigation connections",
    category: "navmesh",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Link name" },
        start: { type: "string", description: "Start position as 'x,y,z'" },
        end: { type: "string", description: "End position as 'x,y,z'" },
        bidirectional: { type: "boolean", description: "Allow travel in both directions", default: true },
      },
      required: ["start", "end"],
    },
  },
  {
    name: "set_navmesh_area",
    description: "Set the NavMesh area type of a GameObject for cost-based pathfinding",
    category: "navmesh",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        area: { type: "string", description: "Area index or name (e.g. Walkable, Not Walkable)" },
      },
      required: ["target", "area"],
    },
  },
  {
    name: "get_navmesh_path",
    description: "Calculate a navigation path between two points",
    category: "navmesh",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        start: { type: "string", description: "Start position as 'x,y,z' or GameObject name" },
        end: { type: "string", description: "End position as 'x,y,z' or GameObject name" },
      },
      required: ["start", "end"],
    },
  },
  {
    name: "set_agent_speed",
    description: "Update the speed, angular speed, and acceleration of a NavMeshAgent",
    category: "navmesh",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID with NavMeshAgent" },
        speed: { type: "number", description: "Movement speed" },
        angular_speed: { type: "number", description: "Turning speed" },
        acceleration: { type: "number", description: "Acceleration" },
      },
      required: ["target"],
    },
  },
];

export default navmeshTools;
