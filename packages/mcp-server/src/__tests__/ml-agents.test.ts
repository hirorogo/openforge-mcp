import { describe, it, expect } from "vitest";
import mlAgentsTools from "../tools/unity/ml-agents.js";

describe("ML-Agents tool definitions", () => {
  const expectedTools = [
    "setup_ml_agents",
    "create_training_environment",
    "add_ml_agent",
    "configure_behavior",
    "add_observation",
    "add_reward_signal",
    "start_training",
    "stop_training",
    "load_trained_model",
    "get_training_status",
  ];

  it("should export exactly 10 tool definitions", () => {
    expect(mlAgentsTools.length).toBe(10);
  });

  it("should include all expected tool names", () => {
    const names = mlAgentsTools.map((t) => t.name);
    for (const expected of expectedTools) {
      expect(names).toContain(expected);
    }
  });

  it("should set target to unity for all tools", () => {
    for (const tool of mlAgentsTools) {
      expect(tool.target).toBe("unity");
    }
  });

  it("should set category to ml-agents for all tools", () => {
    for (const tool of mlAgentsTools) {
      expect(tool.category).toBe("ml-agents");
    }
  });

  it("should have valid JSON Schema parameters for all tools", () => {
    for (const tool of mlAgentsTools) {
      expect(tool.parameters).toBeDefined();
      expect(tool.parameters.type).toBe("object");
      expect(tool.parameters.properties).toBeDefined();
      expect(typeof tool.parameters.properties).toBe("object");
    }
  });

  it("should have non-empty descriptions for all tools", () => {
    for (const tool of mlAgentsTools) {
      expect(tool.description).toBeTruthy();
      expect(tool.description.length).toBeGreaterThan(10);
    }
  });

  describe("setup_ml_agents", () => {
    const tool = mlAgentsTools.find((t) => t.name === "setup_ml_agents")!;

    it("should have optional version parameter", () => {
      expect(tool.parameters.properties).toHaveProperty("version");
      expect(tool.parameters.required).toEqual([]);
    });
  });

  describe("create_training_environment", () => {
    const tool = mlAgentsTools.find((t) => t.name === "create_training_environment")!;

    it("should have groundSize, wallHeight, agentName, targetName parameters", () => {
      expect(tool.parameters.properties).toHaveProperty("groundSize");
      expect(tool.parameters.properties).toHaveProperty("wallHeight");
      expect(tool.parameters.properties).toHaveProperty("agentName");
      expect(tool.parameters.properties).toHaveProperty("targetName");
    });

    it("should have no required parameters", () => {
      expect(tool.parameters.required).toEqual([]);
    });
  });

  describe("add_ml_agent", () => {
    const tool = mlAgentsTools.find((t) => t.name === "add_ml_agent")!;

    it("should require gameObject parameter", () => {
      expect(tool.parameters.required).toContain("gameObject");
    });

    it("should have behaviorName and decisionInterval parameters", () => {
      expect(tool.parameters.properties).toHaveProperty("behaviorName");
      expect(tool.parameters.properties).toHaveProperty("decisionInterval");
    });
  });

  describe("configure_behavior", () => {
    const tool = mlAgentsTools.find((t) => t.name === "configure_behavior")!;

    it("should require gameObject and behaviorName", () => {
      expect(tool.parameters.required).toContain("gameObject");
      expect(tool.parameters.required).toContain("behaviorName");
    });

    it("should have observationSize, continuousActions, discreteBranches parameters", () => {
      expect(tool.parameters.properties).toHaveProperty("observationSize");
      expect(tool.parameters.properties).toHaveProperty("continuousActions");
      expect(tool.parameters.properties).toHaveProperty("discreteBranches");
    });
  });

  describe("add_observation", () => {
    const tool = mlAgentsTools.find((t) => t.name === "add_observation")!;

    it("should require gameObject and type", () => {
      expect(tool.parameters.required).toContain("gameObject");
      expect(tool.parameters.required).toContain("type");
    });

    it("should have ray perception and vector parameters", () => {
      expect(tool.parameters.properties).toHaveProperty("raysPerDirection");
      expect(tool.parameters.properties).toHaveProperty("maxRayDegrees");
      expect(tool.parameters.properties).toHaveProperty("rayLength");
      expect(tool.parameters.properties).toHaveProperty("detectableTags");
      expect(tool.parameters.properties).toHaveProperty("vectorSize");
    });

    it("should enumerate type as ray_perception or vector", () => {
      const typeParam = tool.parameters.properties.type as Record<string, unknown>;
      expect(typeParam.enum).toEqual(["ray_perception", "vector"]);
    });
  });

  describe("add_reward_signal", () => {
    const tool = mlAgentsTools.find((t) => t.name === "add_reward_signal")!;

    it("should require gameObject, signalName, value, and condition", () => {
      expect(tool.parameters.required).toContain("gameObject");
      expect(tool.parameters.required).toContain("signalName");
      expect(tool.parameters.required).toContain("value");
      expect(tool.parameters.required).toContain("condition");
    });

    it("should enumerate condition types", () => {
      const condParam = tool.parameters.properties.condition as Record<string, unknown>;
      expect(condParam.enum).toEqual(["on_trigger_enter", "on_collision_enter", "per_step", "custom"]);
    });
  });

  describe("start_training", () => {
    const tool = mlAgentsTools.find((t) => t.name === "start_training")!;

    it("should require configPath", () => {
      expect(tool.parameters.required).toContain("configPath");
    });

    it("should have runId, basePort, maxSteps, resume, force parameters", () => {
      expect(tool.parameters.properties).toHaveProperty("runId");
      expect(tool.parameters.properties).toHaveProperty("basePort");
      expect(tool.parameters.properties).toHaveProperty("maxSteps");
      expect(tool.parameters.properties).toHaveProperty("resume");
      expect(tool.parameters.properties).toHaveProperty("force");
    });
  });

  describe("stop_training", () => {
    const tool = mlAgentsTools.find((t) => t.name === "stop_training")!;

    it("should have optional runId parameter", () => {
      expect(tool.parameters.properties).toHaveProperty("runId");
      expect(tool.parameters.required).toEqual([]);
    });
  });

  describe("load_trained_model", () => {
    const tool = mlAgentsTools.find((t) => t.name === "load_trained_model")!;

    it("should require gameObject and modelPath", () => {
      expect(tool.parameters.required).toContain("gameObject");
      expect(tool.parameters.required).toContain("modelPath");
    });

    it("should have behaviorName parameter", () => {
      expect(tool.parameters.properties).toHaveProperty("behaviorName");
    });
  });

  describe("get_training_status", () => {
    const tool = mlAgentsTools.find((t) => t.name === "get_training_status")!;

    it("should have optional runId parameter", () => {
      expect(tool.parameters.properties).toHaveProperty("runId");
      expect(tool.parameters.required).toEqual([]);
    });
  });
});
