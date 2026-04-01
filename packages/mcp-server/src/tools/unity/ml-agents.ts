import { ToolDefinition } from "../../registry.js";

const mlAgentsTools: ToolDefinition[] = [
  {
    name: "setup_ml_agents",
    description:
      "Check if the Unity ML-Agents package is installed and install it via the Package Manager if not. Returns the current installation status and version.",
    category: "ml-agents",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        version: {
          type: "string",
          description:
            "Specific ML-Agents package version to install (e.g. '2.0.1'). If omitted, installs the latest compatible version.",
        },
      },
      required: [],
    },
  },
  {
    name: "create_training_environment",
    description:
      "Create a basic ML-Agents training environment in the current scene. Sets up a ground plane, boundary walls, an agent GameObject, and a target object.",
    category: "ml-agents",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        groundSize: {
          type: "number",
          description: "Size of the ground plane in world units. Defaults to 20.",
          default: 20,
        },
        wallHeight: {
          type: "number",
          description: "Height of the boundary walls. Defaults to 2.",
          default: 2,
        },
        agentName: {
          type: "string",
          description: "Name for the agent GameObject. Defaults to 'TrainingAgent'.",
          default: "TrainingAgent",
        },
        targetName: {
          type: "string",
          description: "Name for the target GameObject. Defaults to 'Target'.",
          default: "Target",
        },
      },
      required: [],
    },
  },
  {
    name: "add_ml_agent",
    description:
      "Add ML-Agent components (Agent, BehaviorParameters, DecisionRequester) to an existing GameObject. The GameObject must exist in the current scene.",
    category: "ml-agents",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        gameObject: {
          type: "string",
          description: "Name or path of the GameObject to add ML-Agent components to.",
        },
        behaviorName: {
          type: "string",
          description: "Name for the agent behavior. Used to identify this agent type during training.",
          default: "DefaultBehavior",
        },
        decisionInterval: {
          type: "number",
          description: "Number of Academy steps between decisions. Defaults to 5.",
          default: 5,
        },
      },
      required: ["gameObject"],
    },
  },
  {
    name: "configure_behavior",
    description:
      "Configure the BehaviorParameters on an ML-Agent including behavior name, observation space size, and action space (continuous or discrete).",
    category: "ml-agents",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        gameObject: {
          type: "string",
          description: "Name or path of the GameObject with BehaviorParameters.",
        },
        behaviorName: {
          type: "string",
          description: "Name for the behavior, used to match with training configuration.",
        },
        observationSize: {
          type: "number",
          description: "Size of the vector observation space.",
        },
        continuousActions: {
          type: "number",
          description: "Number of continuous action branches. Set to 0 if using only discrete actions.",
          default: 0,
        },
        discreteBranches: {
          type: "string",
          description:
            "Comma-separated list of discrete branch sizes (e.g. '3,2,5'). Each number is the count of possible values for that branch.",
        },
      },
      required: ["gameObject", "behaviorName"],
    },
  },
  {
    name: "add_observation",
    description:
      "Add an observation source to an ML-Agent. Supports ray perception sensors and vector observations.",
    category: "ml-agents",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        gameObject: {
          type: "string",
          description: "Name or path of the agent GameObject.",
        },
        type: {
          type: "string",
          enum: ["ray_perception", "vector"],
          description: "Type of observation to add.",
        },
        raysPerDirection: {
          type: "number",
          description: "Number of rays per direction for ray perception. Defaults to 3.",
          default: 3,
        },
        maxRayDegrees: {
          type: "number",
          description: "Maximum angle in degrees for the ray spread. Defaults to 70.",
          default: 70,
        },
        rayLength: {
          type: "number",
          description: "Length of each ray. Defaults to 20.",
          default: 20,
        },
        detectableTags: {
          type: "string",
          description:
            "Comma-separated list of tags that rays can detect (e.g. 'Target,Wall,Obstacle').",
        },
        vectorSize: {
          type: "number",
          description: "Size of the vector observation. Required when type is 'vector'.",
        },
      },
      required: ["gameObject", "type"],
    },
  },
  {
    name: "add_reward_signal",
    description:
      "Add a reward or penalty signal definition to the agent script. Creates or updates the reward logic in the agent's C# script.",
    category: "ml-agents",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        gameObject: {
          type: "string",
          description: "Name or path of the agent GameObject.",
        },
        signalName: {
          type: "string",
          description: "Descriptive name for this reward signal (e.g. 'reach_target', 'time_penalty').",
        },
        value: {
          type: "number",
          description: "Reward value. Positive for rewards, negative for penalties.",
        },
        condition: {
          type: "string",
          enum: ["on_trigger_enter", "on_collision_enter", "per_step", "custom"],
          description: "When to apply this reward signal.",
        },
        triggerTag: {
          type: "string",
          description:
            "Tag of the object that triggers the reward (used with on_trigger_enter and on_collision_enter).",
        },
        endEpisode: {
          type: "boolean",
          description: "Whether to end the training episode when this reward is triggered. Defaults to false.",
          default: false,
        },
      },
      required: ["gameObject", "signalName", "value", "condition"],
    },
  },
  {
    name: "start_training",
    description:
      "Launch ML-Agents training by running mlagents-learn via the command line. Requires Python and the mlagents package to be installed.",
    category: "ml-agents",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        configPath: {
          type: "string",
          description: "Path to the training configuration YAML file.",
        },
        runId: {
          type: "string",
          description: "Unique identifier for this training run. Defaults to a timestamp-based ID.",
        },
        basePort: {
          type: "number",
          description: "Base port for communication between trainer and Unity. Defaults to 5004.",
          default: 5004,
        },
        maxSteps: {
          type: "number",
          description: "Maximum number of training steps. Overrides the config file value if set.",
        },
        resume: {
          type: "boolean",
          description: "Whether to resume a previous training run with the same run-id. Defaults to false.",
          default: false,
        },
        force: {
          type: "boolean",
          description: "Whether to overwrite existing results for the given run-id. Defaults to false.",
          default: false,
        },
      },
      required: ["configPath"],
    },
  },
  {
    name: "stop_training",
    description:
      "Stop a running ML-Agents training process. Sends a termination signal to the training process.",
    category: "ml-agents",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        runId: {
          type: "string",
          description: "The run-id of the training process to stop. If omitted, stops the most recent training process.",
        },
      },
      required: [],
    },
  },
  {
    name: "load_trained_model",
    description:
      "Load a trained ONNX model file and assign it to an agent's BehaviorParameters for inference.",
    category: "ml-agents",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        gameObject: {
          type: "string",
          description: "Name or path of the agent GameObject.",
        },
        modelPath: {
          type: "string",
          description: "Path to the .onnx model file, relative to the Assets folder or absolute.",
        },
        behaviorName: {
          type: "string",
          description: "Behavior name to assign the model to. Must match the agent's BehaviorParameters.",
        },
      },
      required: ["gameObject", "modelPath"],
    },
  },
  {
    name: "get_training_status",
    description:
      "Check the status of ML-Agents training. Returns whether training is running, the current step count, mean reward, and elapsed time.",
    category: "ml-agents",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        runId: {
          type: "string",
          description: "The run-id to check status for. If omitted, checks the most recent training run.",
        },
      },
      required: [],
    },
  },
];

export default mlAgentsTools;
