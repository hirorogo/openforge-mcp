import { ToolDefinition } from "../../registry.js";

const goapTools: ToolDefinition[] = [
  {
    name: "create_goap_agent",
    description:
      "Create a GOAP (Goal-Oriented Action Planning) AI agent with an initial world state",
    category: "goap",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Agent name (unique identifier)" },
        game_object: {
          type: "string",
          description: "Optional GameObject to attach to (creates new if not found)",
        },
        initial_state: {
          type: "string",
          description:
            "Initial world state as 'key1:true,key2:false' (e.g. 'has_weapon:false,is_hungry:true')",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "add_goap_goal",
    description: "Add a goal to a GOAP agent with desired world state conditions",
    category: "goap",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        agent: { type: "string", description: "Agent name" },
        goal_name: {
          type: "string",
          description: "Goal name (e.g. 'kill_enemy', 'find_food')",
        },
        priority: {
          type: "number",
          description: "Goal priority (higher = more important, default 1)",
        },
        desired_state: {
          type: "string",
          description:
            "Desired world state as 'key:value' pairs (e.g. 'enemy_dead:true')",
        },
      },
      required: ["agent", "goal_name", "desired_state"],
    },
  },
  {
    name: "add_goap_action",
    description:
      "Add an action to a GOAP agent with preconditions, effects, and cost",
    category: "goap",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        agent: { type: "string", description: "Agent name" },
        action_name: {
          type: "string",
          description: "Action name (e.g. 'attack', 'pick_up_weapon')",
        },
        cost: { type: "number", description: "Action cost (default 1)" },
        preconditions: {
          type: "string",
          description:
            "Required state before action as 'key:value' pairs (e.g. 'has_weapon:true')",
        },
        effects: {
          type: "string",
          description:
            "State changes after action as 'key:value' pairs (e.g. 'enemy_dead:true')",
        },
      },
      required: ["agent", "action_name", "effects"],
    },
  },
  {
    name: "plan_goap",
    description:
      "Run the GOAP planner using A* search to find an optimal action sequence for a goal",
    category: "goap",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        agent: { type: "string", description: "Agent name" },
        goal: {
          type: "string",
          description: "Goal name to plan for (omit for highest priority goal)",
        },
      },
      required: ["agent"],
    },
  },
  {
    name: "execute_goap_plan",
    description:
      "Execute the current planned action sequence, updating the agent world state",
    category: "goap",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        agent: { type: "string", description: "Agent name" },
      },
      required: ["agent"],
    },
  },
  {
    name: "get_goap_state",
    description:
      "Get the current world state, goals, actions, and plan status for a GOAP agent",
    category: "goap",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        agent: { type: "string", description: "Agent name" },
      },
      required: ["agent"],
    },
  },
  {
    name: "set_goap_state",
    description: "Modify world state variables on a GOAP agent",
    category: "goap",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        agent: { type: "string", description: "Agent name" },
        state: {
          type: "string",
          description:
            "State changes as 'key:value' pairs (e.g. 'has_weapon:true,is_hungry:false')",
        },
      },
      required: ["agent", "state"],
    },
  },
  {
    name: "create_goap_script",
    description:
      "Generate complete GOAP system C# scripts (WorldState, GOAPAction, GOAPGoal, GOAPPlanner, GOAPAgent)",
    category: "goap",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        agent: {
          type: "string",
          description: "Optional agent name to base script generation on",
        },
        path: {
          type: "string",
          description: "Save directory (default: Assets/Scripts/GOAP)",
        },
        namespace: {
          type: "string",
          description: "C# namespace (default: GOAP)",
        },
      },
      required: [],
    },
  },
];

export default goapTools;
