using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    /// <summary>
    /// Goal-Oriented Action Planning (GOAP) AI system tools.
    /// Manages GOAP agents, goals, actions, and planning entirely within the editor.
    /// </summary>
    public static class GOAPTools
    {
        // In-memory GOAP data storage keyed by agent name
        private static readonly Dictionary<string, GOAPAgentData> _agents = new Dictionary<string, GOAPAgentData>();

        public static void Register()
        {
            ToolExecutor.Register("create_goap_agent", CreateGOAPAgent);
            ToolExecutor.Register("add_goap_goal", AddGOAPGoal);
            ToolExecutor.Register("add_goap_action", AddGOAPAction);
            ToolExecutor.Register("plan_goap", PlanGOAP);
            ToolExecutor.Register("execute_goap_plan", ExecuteGOAPPlan);
            ToolExecutor.Register("get_goap_state", GetGOAPState);
            ToolExecutor.Register("set_goap_state", SetGOAPState);
            ToolExecutor.Register("create_goap_script", CreateGOAPScript);
        }

        private class GOAPAgentData
        {
            public string Name;
            public Dictionary<string, bool> WorldState = new Dictionary<string, bool>();
            public List<GOAPGoal> Goals = new List<GOAPGoal>();
            public List<GOAPAction> Actions = new List<GOAPAction>();
            public List<string> CurrentPlan;
            public GameObject GameObject;
        }

        private class GOAPGoal
        {
            public string Name;
            public int Priority;
            public Dictionary<string, bool> DesiredState = new Dictionary<string, bool>();
        }

        private class GOAPAction
        {
            public string Name;
            public float Cost;
            public Dictionary<string, bool> Preconditions = new Dictionary<string, bool>();
            public Dictionary<string, bool> Effects = new Dictionary<string, bool>();
        }

        private static ToolResult CreateGOAPAgent(Dictionary<string, string> p)
        {
            string agentName = GetRequiredParam(p, "name");
            string gameObjectName = GetParam(p, "game_object", "");
            string initialState = GetParam(p, "initial_state", "");

            var agent = new GOAPAgentData { Name = agentName };

            // Parse initial world state: "key1:true,key2:false"
            if (!string.IsNullOrEmpty(initialState))
            {
                foreach (string pair in initialState.Split(','))
                {
                    string[] kv = pair.Trim().Split(':');
                    if (kv.Length >= 2)
                    {
                        agent.WorldState[kv[0].Trim()] = kv[1].Trim().ToLower() == "true";
                    }
                }
            }

            // Optionally attach to a GameObject
            if (!string.IsNullOrEmpty(gameObjectName))
            {
                agent.GameObject = FindByNameOrId(gameObjectName);
                if (agent.GameObject == null)
                {
                    // Create one
                    agent.GameObject = new GameObject(agentName + "_Agent");
                    Undo.RegisterCreatedObjectUndo(agent.GameObject, $"Create GOAP Agent {agentName}");
                }
            }

            _agents[agentName] = agent;

            StringBuilder sb = new StringBuilder("{");
            sb.Append($"\"name\":\"{EscapeJson(agentName)}\",");
            sb.Append("\"worldState\":{");
            bool first = true;
            foreach (var kv in agent.WorldState)
            {
                if (!first) sb.Append(",");
                first = false;
                sb.Append($"\"{EscapeJson(kv.Key)}\":{(kv.Value ? "true" : "false")}");
            }
            sb.Append("}}");

            return new ToolResult
            {
                success = true,
                message = $"Created GOAP agent '{agentName}' with {agent.WorldState.Count} state variable(s)",
                data = sb.ToString()
            };
        }

        private static ToolResult AddGOAPGoal(Dictionary<string, string> p)
        {
            string agentName = GetRequiredParam(p, "agent");
            string goalName = GetRequiredParam(p, "goal_name");
            int priority = int.Parse(GetParam(p, "priority", "1"));
            string desiredState = GetRequiredParam(p, "desired_state");

            if (!_agents.TryGetValue(agentName, out GOAPAgentData agent))
                return Fail($"GOAP agent not found: {agentName}");

            var goal = new GOAPGoal { Name = goalName, Priority = priority };

            foreach (string pair in desiredState.Split(','))
            {
                string[] kv = pair.Trim().Split(':');
                if (kv.Length >= 2)
                    goal.DesiredState[kv[0].Trim()] = kv[1].Trim().ToLower() == "true";
            }

            agent.Goals.Add(goal);

            return new ToolResult
            {
                success = true,
                message = $"Added goal '{goalName}' (priority {priority}) to agent '{agentName}' with {goal.DesiredState.Count} desired state(s)",
                data = $"{{\"agent\":\"{EscapeJson(agentName)}\",\"goal\":\"{EscapeJson(goalName)}\",\"priority\":{priority}}}"
            };
        }

        private static ToolResult AddGOAPAction(Dictionary<string, string> p)
        {
            string agentName = GetRequiredParam(p, "agent");
            string actionName = GetRequiredParam(p, "action_name");
            float cost = float.Parse(GetParam(p, "cost", "1"), System.Globalization.CultureInfo.InvariantCulture);
            string preconditions = GetParam(p, "preconditions", "");
            string effects = GetRequiredParam(p, "effects");

            if (!_agents.TryGetValue(agentName, out GOAPAgentData agent))
                return Fail($"GOAP agent not found: {agentName}");

            var action = new GOAPAction { Name = actionName, Cost = cost };

            if (!string.IsNullOrEmpty(preconditions))
            {
                foreach (string pair in preconditions.Split(','))
                {
                    string[] kv = pair.Trim().Split(':');
                    if (kv.Length >= 2)
                        action.Preconditions[kv[0].Trim()] = kv[1].Trim().ToLower() == "true";
                }
            }

            foreach (string pair in effects.Split(','))
            {
                string[] kv = pair.Trim().Split(':');
                if (kv.Length >= 2)
                    action.Effects[kv[0].Trim()] = kv[1].Trim().ToLower() == "true";
            }

            agent.Actions.Add(action);

            return new ToolResult
            {
                success = true,
                message = $"Added action '{actionName}' (cost {cost}) to agent '{agentName}' with {action.Preconditions.Count} precondition(s) and {action.Effects.Count} effect(s)",
                data = $"{{\"agent\":\"{EscapeJson(agentName)}\",\"action\":\"{EscapeJson(actionName)}\",\"cost\":{cost}}}"
            };
        }

        private static ToolResult PlanGOAP(Dictionary<string, string> p)
        {
            string agentName = GetRequiredParam(p, "agent");
            string goalName = GetParam(p, "goal", "");

            if (!_agents.TryGetValue(agentName, out GOAPAgentData agent))
                return Fail($"GOAP agent not found: {agentName}");

            if (agent.Actions.Count == 0)
                return Fail($"Agent '{agentName}' has no actions defined");

            // Select the goal to plan for
            GOAPGoal targetGoal = null;
            if (!string.IsNullOrEmpty(goalName))
            {
                targetGoal = agent.Goals.Find(g => g.Name == goalName);
                if (targetGoal == null)
                    return Fail($"Goal '{goalName}' not found on agent '{agentName}'");
            }
            else
            {
                // Pick highest priority goal
                targetGoal = agent.Goals.OrderByDescending(g => g.Priority).FirstOrDefault();
                if (targetGoal == null)
                    return Fail($"Agent '{agentName}' has no goals defined");
            }

            // A* planning
            List<string> plan = RunPlanner(agent, targetGoal);

            if (plan == null || plan.Count == 0)
                return Fail($"No valid plan found for goal '{targetGoal.Name}'");

            agent.CurrentPlan = plan;

            // Calculate total cost
            float totalCost = 0;
            foreach (string actionName in plan)
            {
                var action = agent.Actions.Find(a => a.Name == actionName);
                if (action != null) totalCost += action.Cost;
            }

            StringBuilder sb = new StringBuilder("{");
            sb.Append($"\"agent\":\"{EscapeJson(agentName)}\",");
            sb.Append($"\"goal\":\"{EscapeJson(targetGoal.Name)}\",");
            sb.Append($"\"totalCost\":{totalCost:F2},");
            sb.Append("\"plan\":[");
            for (int i = 0; i < plan.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append($"\"{EscapeJson(plan[i])}\"");
            }
            sb.Append("]}");

            return new ToolResult
            {
                success = true,
                message = $"Plan for '{targetGoal.Name}': {string.Join(" -> ", plan)} (cost: {totalCost:F2})",
                data = sb.ToString()
            };
        }

        private static List<string> RunPlanner(GOAPAgentData agent, GOAPGoal goal)
        {
            // A* search through state space
            var openList = new List<PlanNode>();
            var closedSet = new HashSet<string>();

            var startNode = new PlanNode
            {
                State = new Dictionary<string, bool>(agent.WorldState),
                Actions = new List<string>(),
                Cost = 0
            };
            openList.Add(startNode);

            int maxIterations = 10000;
            int iterations = 0;

            while (openList.Count > 0 && iterations < maxIterations)
            {
                iterations++;

                // Find lowest cost node
                openList.Sort((a, b) => a.Cost.CompareTo(b.Cost));
                PlanNode current = openList[0];
                openList.RemoveAt(0);

                // Check if goal is satisfied
                if (IsGoalSatisfied(current.State, goal.DesiredState))
                    return current.Actions;

                string stateKey = StateToKey(current.State);
                if (closedSet.Contains(stateKey)) continue;
                closedSet.Add(stateKey);

                // Expand neighbors
                foreach (var action in agent.Actions)
                {
                    if (!ArePreconditionsMet(current.State, action.Preconditions))
                        continue;

                    var newState = new Dictionary<string, bool>(current.State);
                    foreach (var effect in action.Effects)
                        newState[effect.Key] = effect.Value;

                    var newActions = new List<string>(current.Actions) { action.Name };

                    openList.Add(new PlanNode
                    {
                        State = newState,
                        Actions = newActions,
                        Cost = current.Cost + action.Cost
                    });
                }
            }

            return null;
        }

        private class PlanNode
        {
            public Dictionary<string, bool> State;
            public List<string> Actions;
            public float Cost;
        }

        private static bool IsGoalSatisfied(Dictionary<string, bool> state, Dictionary<string, bool> desiredState)
        {
            foreach (var kv in desiredState)
            {
                if (!state.TryGetValue(kv.Key, out bool val) || val != kv.Value)
                    return false;
            }
            return true;
        }

        private static bool ArePreconditionsMet(Dictionary<string, bool> state, Dictionary<string, bool> preconditions)
        {
            foreach (var kv in preconditions)
            {
                if (!state.TryGetValue(kv.Key, out bool val) || val != kv.Value)
                    return false;
            }
            return true;
        }

        private static string StateToKey(Dictionary<string, bool> state)
        {
            var sorted = state.OrderBy(kv => kv.Key);
            StringBuilder sb = new StringBuilder();
            foreach (var kv in sorted)
                sb.Append($"{kv.Key}={kv.Value};");
            return sb.ToString();
        }

        private static ToolResult ExecuteGOAPPlan(Dictionary<string, string> p)
        {
            string agentName = GetRequiredParam(p, "agent");

            if (!_agents.TryGetValue(agentName, out GOAPAgentData agent))
                return Fail($"GOAP agent not found: {agentName}");

            if (agent.CurrentPlan == null || agent.CurrentPlan.Count == 0)
                return Fail($"Agent '{agentName}' has no current plan. Run plan_goap first.");

            StringBuilder log = new StringBuilder();
            int step = 0;

            foreach (string actionName in agent.CurrentPlan)
            {
                step++;
                var action = agent.Actions.Find(a => a.Name == actionName);
                if (action == null)
                {
                    log.AppendLine($"Step {step}: Action '{actionName}' not found - skipped");
                    continue;
                }

                // Check preconditions
                if (!ArePreconditionsMet(agent.WorldState, action.Preconditions))
                {
                    log.AppendLine($"Step {step}: Preconditions not met for '{actionName}' - plan failed");
                    return new ToolResult
                    {
                        success = false,
                        message = $"Plan execution failed at step {step}: preconditions not met for '{actionName}'",
                        data = $"{{\"failedAt\":{step},\"action\":\"{EscapeJson(actionName)}\",\"log\":\"{EscapeJson(log.ToString())}\"}}"
                    };
                }

                // Apply effects
                foreach (var effect in action.Effects)
                    agent.WorldState[effect.Key] = effect.Value;

                log.AppendLine($"Step {step}: Executed '{actionName}' (cost: {action.Cost})");
            }

            agent.CurrentPlan = null;

            return new ToolResult
            {
                success = true,
                message = $"Executed {step} action(s) for agent '{agentName}'",
                data = $"{{\"stepsExecuted\":{step},\"log\":\"{EscapeJson(log.ToString())}\"}}"
            };
        }

        private static ToolResult GetGOAPState(Dictionary<string, string> p)
        {
            string agentName = GetRequiredParam(p, "agent");

            if (!_agents.TryGetValue(agentName, out GOAPAgentData agent))
                return Fail($"GOAP agent not found: {agentName}");

            StringBuilder sb = new StringBuilder("{");
            sb.Append($"\"agent\":\"{EscapeJson(agentName)}\",");

            sb.Append("\"worldState\":{");
            bool first = true;
            foreach (var kv in agent.WorldState)
            {
                if (!first) sb.Append(",");
                first = false;
                sb.Append($"\"{EscapeJson(kv.Key)}\":{(kv.Value ? "true" : "false")}");
            }
            sb.Append("},");

            sb.Append("\"goals\":[");
            for (int i = 0; i < agent.Goals.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append($"{{\"name\":\"{EscapeJson(agent.Goals[i].Name)}\",\"priority\":{agent.Goals[i].Priority}}}");
            }
            sb.Append("],");

            sb.Append("\"actions\":[");
            for (int i = 0; i < agent.Actions.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append($"{{\"name\":\"{EscapeJson(agent.Actions[i].Name)}\",\"cost\":{agent.Actions[i].Cost}}}");
            }
            sb.Append("],");

            sb.Append($"\"hasPlan\":{(agent.CurrentPlan != null && agent.CurrentPlan.Count > 0 ? "true" : "false")}");
            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Agent '{agentName}': {agent.WorldState.Count} state vars, {agent.Goals.Count} goals, {agent.Actions.Count} actions",
                data = sb.ToString()
            };
        }

        private static ToolResult SetGOAPState(Dictionary<string, string> p)
        {
            string agentName = GetRequiredParam(p, "agent");
            string stateChanges = GetRequiredParam(p, "state");

            if (!_agents.TryGetValue(agentName, out GOAPAgentData agent))
                return Fail($"GOAP agent not found: {agentName}");

            int changed = 0;
            foreach (string pair in stateChanges.Split(','))
            {
                string[] kv = pair.Trim().Split(':');
                if (kv.Length >= 2)
                {
                    agent.WorldState[kv[0].Trim()] = kv[1].Trim().ToLower() == "true";
                    changed++;
                }
            }

            return new ToolResult
            {
                success = true,
                message = $"Updated {changed} state variable(s) on agent '{agentName}'"
            };
        }

        private static ToolResult CreateGOAPScript(Dictionary<string, string> p)
        {
            string agentName = GetParam(p, "agent", "");
            string savePath = GetParam(p, "path", "Assets/Scripts/GOAP");
            string namespaceName = GetParam(p, "namespace", "GOAP");

            // Ensure directory
            if (!Directory.Exists(savePath))
                Directory.CreateDirectory(savePath);

            // Generate WorldState.cs
            string worldStatePath = Path.Combine(savePath, "WorldState.cs");
            StringBuilder wsb = new StringBuilder();
            wsb.AppendLine("using System.Collections.Generic;");
            wsb.AppendLine();
            wsb.AppendLine($"namespace {namespaceName}");
            wsb.AppendLine("{");
            wsb.AppendLine("    [System.Serializable]");
            wsb.AppendLine("    public class WorldState");
            wsb.AppendLine("    {");
            wsb.AppendLine("        private Dictionary<string, bool> _states = new Dictionary<string, bool>();");
            wsb.AppendLine();
            wsb.AppendLine("        public bool GetState(string key, bool defaultValue = false)");
            wsb.AppendLine("        {");
            wsb.AppendLine("            return _states.TryGetValue(key, out bool val) ? val : defaultValue;");
            wsb.AppendLine("        }");
            wsb.AppendLine();
            wsb.AppendLine("        public void SetState(string key, bool value) => _states[key] = value;");
            wsb.AppendLine();
            wsb.AppendLine("        public Dictionary<string, bool> GetAllStates() => new Dictionary<string, bool>(_states);");
            wsb.AppendLine();
            wsb.AppendLine("        public WorldState Clone()");
            wsb.AppendLine("        {");
            wsb.AppendLine("            var clone = new WorldState();");
            wsb.AppendLine("            foreach (var kv in _states) clone._states[kv.Key] = kv.Value;");
            wsb.AppendLine("            return clone;");
            wsb.AppendLine("        }");
            wsb.AppendLine("    }");
            wsb.AppendLine("}");
            File.WriteAllText(worldStatePath, wsb.ToString());

            // Generate GOAPAction.cs
            string actionPath = Path.Combine(savePath, "GOAPAction.cs");
            StringBuilder ab = new StringBuilder();
            ab.AppendLine("using System.Collections.Generic;");
            ab.AppendLine("using UnityEngine;");
            ab.AppendLine();
            ab.AppendLine($"namespace {namespaceName}");
            ab.AppendLine("{");
            ab.AppendLine("    public abstract class GOAPAction : MonoBehaviour");
            ab.AppendLine("    {");
            ab.AppendLine("        [SerializeField] private string actionName;");
            ab.AppendLine("        [SerializeField] private float cost = 1f;");
            ab.AppendLine();
            ab.AppendLine("        public string ActionName => actionName;");
            ab.AppendLine("        public float Cost => cost;");
            ab.AppendLine();
            ab.AppendLine("        public abstract Dictionary<string, bool> GetPreconditions();");
            ab.AppendLine("        public abstract Dictionary<string, bool> GetEffects();");
            ab.AppendLine("        public abstract bool IsValid(WorldState state);");
            ab.AppendLine("        public abstract bool Execute(GOAPAgent agent);");
            ab.AppendLine("        public virtual void Reset() { }");
            ab.AppendLine("    }");
            ab.AppendLine("}");
            File.WriteAllText(actionPath, ab.ToString());

            // Generate GOAPGoal.cs
            string goalPath = Path.Combine(savePath, "GOAPGoal.cs");
            StringBuilder gb = new StringBuilder();
            gb.AppendLine("using System.Collections.Generic;");
            gb.AppendLine("using UnityEngine;");
            gb.AppendLine();
            gb.AppendLine($"namespace {namespaceName}");
            gb.AppendLine("{");
            gb.AppendLine("    [System.Serializable]");
            gb.AppendLine("    public class GOAPGoal");
            gb.AppendLine("    {");
            gb.AppendLine("        [SerializeField] private string goalName;");
            gb.AppendLine("        [SerializeField] private int priority;");
            gb.AppendLine();
            gb.AppendLine("        public string GoalName => goalName;");
            gb.AppendLine("        public int Priority => priority;");
            gb.AppendLine();
            gb.AppendLine("        private Dictionary<string, bool> _desiredState = new Dictionary<string, bool>();");
            gb.AppendLine("        public Dictionary<string, bool> DesiredState => _desiredState;");
            gb.AppendLine();
            gb.AppendLine("        public GOAPGoal(string name, int priority)");
            gb.AppendLine("        {");
            gb.AppendLine("            goalName = name;");
            gb.AppendLine("            this.priority = priority;");
            gb.AppendLine("        }");
            gb.AppendLine();
            gb.AppendLine("        public void AddDesiredState(string key, bool value) => _desiredState[key] = value;");
            gb.AppendLine("    }");
            gb.AppendLine("}");
            File.WriteAllText(goalPath, gb.ToString());

            // Generate GOAPPlanner.cs
            string plannerPath = Path.Combine(savePath, "GOAPPlanner.cs");
            StringBuilder pb = new StringBuilder();
            pb.AppendLine("using System.Collections.Generic;");
            pb.AppendLine("using System.Linq;");
            pb.AppendLine();
            pb.AppendLine($"namespace {namespaceName}");
            pb.AppendLine("{");
            pb.AppendLine("    public static class GOAPPlanner");
            pb.AppendLine("    {");
            pb.AppendLine("        private class PlanNode");
            pb.AppendLine("        {");
            pb.AppendLine("            public WorldState State;");
            pb.AppendLine("            public List<GOAPAction> Actions;");
            pb.AppendLine("            public float Cost;");
            pb.AppendLine("        }");
            pb.AppendLine();
            pb.AppendLine("        public static List<GOAPAction> Plan(WorldState currentState, GOAPGoal goal, List<GOAPAction> availableActions, int maxIterations = 10000)");
            pb.AppendLine("        {");
            pb.AppendLine("            var openList = new List<PlanNode> { new PlanNode { State = currentState.Clone(), Actions = new List<GOAPAction>(), Cost = 0 } };");
            pb.AppendLine("            var closedSet = new HashSet<string>();");
            pb.AppendLine("            int iterations = 0;");
            pb.AppendLine();
            pb.AppendLine("            while (openList.Count > 0 && iterations < maxIterations)");
            pb.AppendLine("            {");
            pb.AppendLine("                iterations++;");
            pb.AppendLine("                openList.Sort((a, b) => a.Cost.CompareTo(b.Cost));");
            pb.AppendLine("                var current = openList[0];");
            pb.AppendLine("                openList.RemoveAt(0);");
            pb.AppendLine();
            pb.AppendLine("                if (IsGoalSatisfied(current.State, goal))");
            pb.AppendLine("                    return current.Actions;");
            pb.AppendLine();
            pb.AppendLine("                string stateKey = current.State.GetAllStates().OrderBy(kv => kv.Key).Aggregate(\"\", (s, kv) => s + kv.Key + \"=\" + kv.Value + \";\");");
            pb.AppendLine("                if (closedSet.Contains(stateKey)) continue;");
            pb.AppendLine("                closedSet.Add(stateKey);");
            pb.AppendLine();
            pb.AppendLine("                foreach (var action in availableActions)");
            pb.AppendLine("                {");
            pb.AppendLine("                    if (!action.IsValid(current.State)) continue;");
            pb.AppendLine("                    var newState = current.State.Clone();");
            pb.AppendLine("                    foreach (var effect in action.GetEffects())");
            pb.AppendLine("                        newState.SetState(effect.Key, effect.Value);");
            pb.AppendLine("                    var newActions = new List<GOAPAction>(current.Actions) { action };");
            pb.AppendLine("                    openList.Add(new PlanNode { State = newState, Actions = newActions, Cost = current.Cost + action.Cost });");
            pb.AppendLine("                }");
            pb.AppendLine("            }");
            pb.AppendLine("            return null;");
            pb.AppendLine("        }");
            pb.AppendLine();
            pb.AppendLine("        private static bool IsGoalSatisfied(WorldState state, GOAPGoal goal)");
            pb.AppendLine("        {");
            pb.AppendLine("            foreach (var kv in goal.DesiredState)");
            pb.AppendLine("            {");
            pb.AppendLine("                if (state.GetState(kv.Key) != kv.Value) return false;");
            pb.AppendLine("            }");
            pb.AppendLine("            return true;");
            pb.AppendLine("        }");
            pb.AppendLine("    }");
            pb.AppendLine("}");
            File.WriteAllText(plannerPath, pb.ToString());

            // Generate GOAPAgent.cs
            string agentPath = Path.Combine(savePath, "GOAPAgent.cs");
            StringBuilder agb = new StringBuilder();
            agb.AppendLine("using System.Collections.Generic;");
            agb.AppendLine("using System.Linq;");
            agb.AppendLine("using UnityEngine;");
            agb.AppendLine();
            agb.AppendLine($"namespace {namespaceName}");
            agb.AppendLine("{");
            agb.AppendLine("    public class GOAPAgent : MonoBehaviour");
            agb.AppendLine("    {");
            agb.AppendLine("        public WorldState WorldState { get; private set; } = new WorldState();");
            agb.AppendLine("        public List<GOAPGoal> Goals { get; private set; } = new List<GOAPGoal>();");
            agb.AppendLine("        private List<GOAPAction> _currentPlan;");
            agb.AppendLine("        private int _currentActionIndex;");
            agb.AppendLine();
            agb.AppendLine("        private void Start()");
            agb.AppendLine("        {");
            agb.AppendLine("            Replan();");
            agb.AppendLine("        }");
            agb.AppendLine();
            agb.AppendLine("        private void Update()");
            agb.AppendLine("        {");
            agb.AppendLine("            if (_currentPlan == null || _currentActionIndex >= _currentPlan.Count)");
            agb.AppendLine("            {");
            agb.AppendLine("                Replan();");
            agb.AppendLine("                return;");
            agb.AppendLine("            }");
            agb.AppendLine();
            agb.AppendLine("            var action = _currentPlan[_currentActionIndex];");
            agb.AppendLine("            if (action.Execute(this))");
            agb.AppendLine("            {");
            agb.AppendLine("                foreach (var effect in action.GetEffects())");
            agb.AppendLine("                    WorldState.SetState(effect.Key, effect.Value);");
            agb.AppendLine("                _currentActionIndex++;");
            agb.AppendLine("            }");
            agb.AppendLine("        }");
            agb.AppendLine();
            agb.AppendLine("        public void Replan()");
            agb.AppendLine("        {");
            agb.AppendLine("            var actions = GetComponents<GOAPAction>().ToList();");
            agb.AppendLine("            var topGoal = Goals.OrderByDescending(g => g.Priority).FirstOrDefault();");
            agb.AppendLine("            if (topGoal == null) return;");
            agb.AppendLine("            _currentPlan = GOAPPlanner.Plan(WorldState, topGoal, actions);");
            agb.AppendLine("            _currentActionIndex = 0;");
            agb.AppendLine("        }");
            agb.AppendLine("    }");
            agb.AppendLine("}");
            File.WriteAllText(agentPath, agb.ToString());

            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created GOAP system scripts at '{savePath}': WorldState.cs, GOAPAction.cs, GOAPGoal.cs, GOAPPlanner.cs, GOAPAgent.cs",
                data = $"{{\"path\":\"{EscapeJson(savePath)}\",\"files\":[\"WorldState.cs\",\"GOAPAction.cs\",\"GOAPGoal.cs\",\"GOAPPlanner.cs\",\"GOAPAgent.cs\"]}}"
            };
        }

        // --- Helpers ---

        private static GameObject FindByNameOrId(string nameOrId)
        {
            if (int.TryParse(nameOrId, out int id))
            {
                UnityEngine.Object obj = EditorUtility.InstanceIDToObject(id);
                if (obj is GameObject go) return go;
            }
            GameObject found = GameObject.Find(nameOrId);
            if (found != null) return found;
            GameObject[] allObjects = Resources.FindObjectsOfTypeAll<GameObject>();
            foreach (GameObject go in allObjects)
            {
                if (go.hideFlags != HideFlags.None) continue;
                if (go.scene.isLoaded && go.name == nameOrId) return go;
            }
            return null;
        }

        private static string GetParam(Dictionary<string, string> p, string key, string defaultValue = "")
        {
            return p.TryGetValue(key, out string value) ? value : defaultValue;
        }

        private static string GetRequiredParam(Dictionary<string, string> p, string key)
        {
            if (!p.TryGetValue(key, out string value) || string.IsNullOrEmpty(value))
                throw new ArgumentException($"Missing required parameter: {key}");
            return value;
        }

        private static ToolResult Fail(string message)
        {
            return new ToolResult { success = false, message = message };
        }

        private static string EscapeJson(string s)
        {
            if (s == null) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r").Replace("\t", "\\t");
        }
    }
}
