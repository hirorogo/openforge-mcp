using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEditor.AI;
using UnityEngine;
using UnityEngine.AI;

namespace OpenForge.Editor.Tools
{
    public static class NavMeshTools
    {
        public static void Register()
        {
            ToolExecutor.Register("bake_navmesh", BakeNavMesh);
            ToolExecutor.Register("add_navmesh_agent", AddNavMeshAgent);
            ToolExecutor.Register("set_navmesh_destination", SetNavMeshDestination);
            ToolExecutor.Register("add_navmesh_obstacle", AddNavMeshObstacle);
            ToolExecutor.Register("add_navmesh_link", AddNavMeshLink);
            ToolExecutor.Register("set_navmesh_area", SetNavMeshArea);
            ToolExecutor.Register("get_navmesh_path", GetNavMeshPath);
            ToolExecutor.Register("set_agent_speed", SetAgentSpeed);
        }

        private static ToolResult BakeNavMesh(Dictionary<string, string> p)
        {
            string agentRadius = GetParam(p, "agent_radius", "");
            string agentHeight = GetParam(p, "agent_height", "");
            string maxSlope = GetParam(p, "max_slope", "");
            string stepHeight = GetParam(p, "step_height", "");

            if (!string.IsNullOrEmpty(agentRadius))
                NavMeshBuilder.agentRadius = float.Parse(agentRadius, System.Globalization.CultureInfo.InvariantCulture);
            if (!string.IsNullOrEmpty(agentHeight))
                NavMeshBuilder.agentHeight = float.Parse(agentHeight, System.Globalization.CultureInfo.InvariantCulture);
            if (!string.IsNullOrEmpty(maxSlope))
                NavMeshBuilder.agentSlope = float.Parse(maxSlope, System.Globalization.CultureInfo.InvariantCulture);
            if (!string.IsNullOrEmpty(stepHeight))
                NavMeshBuilder.agentClimb = float.Parse(stepHeight, System.Globalization.CultureInfo.InvariantCulture);

            NavMeshBuilder.BuildNavMesh();

            return new ToolResult
            {
                success = true,
                message = "NavMesh bake completed"
            };
        }

        private static ToolResult AddNavMeshAgent(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            NavMeshAgent agent = go.GetComponent<NavMeshAgent>();
            if (agent == null)
                agent = Undo.AddComponent<NavMeshAgent>(go);

            string speed = GetParam(p, "speed", "");
            if (!string.IsNullOrEmpty(speed))
                agent.speed = float.Parse(speed, System.Globalization.CultureInfo.InvariantCulture);

            string angularSpeed = GetParam(p, "angular_speed", "");
            if (!string.IsNullOrEmpty(angularSpeed))
                agent.angularSpeed = float.Parse(angularSpeed, System.Globalization.CultureInfo.InvariantCulture);

            string acceleration = GetParam(p, "acceleration", "");
            if (!string.IsNullOrEmpty(acceleration))
                agent.acceleration = float.Parse(acceleration, System.Globalization.CultureInfo.InvariantCulture);

            string stoppingDistance = GetParam(p, "stopping_distance", "");
            if (!string.IsNullOrEmpty(stoppingDistance))
                agent.stoppingDistance = float.Parse(stoppingDistance, System.Globalization.CultureInfo.InvariantCulture);

            string radius = GetParam(p, "radius", "");
            if (!string.IsNullOrEmpty(radius))
                agent.radius = float.Parse(radius, System.Globalization.CultureInfo.InvariantCulture);

            string height = GetParam(p, "height", "");
            if (!string.IsNullOrEmpty(height))
                agent.height = float.Parse(height, System.Globalization.CultureInfo.InvariantCulture);

            return new ToolResult
            {
                success = true,
                message = $"Added NavMeshAgent to '{go.name}' (speed: {agent.speed})",
                data = $"{{\"target\":\"{EscapeJson(go.name)}\",\"speed\":{agent.speed}}}"
            };
        }

        private static ToolResult SetNavMeshDestination(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string destinationStr = GetRequiredParam(p, "destination");

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            NavMeshAgent agent = go.GetComponent<NavMeshAgent>();
            if (agent == null) return Fail($"No NavMeshAgent on '{targetName}'");

            if (!TryParseVector3(destinationStr, out Vector3 destination))
            {
                GameObject destGo = FindByNameOrId(destinationStr);
                if (destGo != null)
                    destination = destGo.transform.position;
                else
                    return Fail($"Invalid destination: {destinationStr}");
            }

            agent.SetDestination(destination);

            return new ToolResult
            {
                success = true,
                message = $"Set destination for '{go.name}' to ({destination.x}, {destination.y}, {destination.z})"
            };
        }

        private static ToolResult AddNavMeshObstacle(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            NavMeshObstacle obstacle = go.GetComponent<NavMeshObstacle>();
            if (obstacle == null)
                obstacle = Undo.AddComponent<NavMeshObstacle>(go);

            string shape = GetParam(p, "shape", "box");
            switch (shape.ToLower())
            {
                case "box":
                    obstacle.shape = NavMeshObstacleShape.Box;
                    break;
                case "capsule":
                    obstacle.shape = NavMeshObstacleShape.Capsule;
                    break;
            }

            string carve = GetParam(p, "carve", "");
            if (!string.IsNullOrEmpty(carve))
                obstacle.carving = carve == "true";

            string sizeStr = GetParam(p, "size", "");
            if (!string.IsNullOrEmpty(sizeStr) && TryParseVector3(sizeStr, out Vector3 size))
                obstacle.size = size;

            return new ToolResult
            {
                success = true,
                message = $"Added NavMeshObstacle to '{go.name}' ({shape}, carve: {obstacle.carving})"
            };
        }

        private static ToolResult AddNavMeshLink(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "NavMesh Link");
            string startStr = GetRequiredParam(p, "start");
            string endStr = GetRequiredParam(p, "end");

            if (!TryParseVector3(startStr, out Vector3 startPos))
                return Fail($"Invalid start position: {startStr}");
            if (!TryParseVector3(endStr, out Vector3 endPos))
                return Fail($"Invalid end position: {endStr}");

            GameObject linkGo = new GameObject(name);
            OffMeshLink link = linkGo.AddComponent<OffMeshLink>();

            GameObject startPoint = new GameObject("Start");
            startPoint.transform.SetParent(linkGo.transform);
            startPoint.transform.position = startPos;

            GameObject endPoint = new GameObject("End");
            endPoint.transform.SetParent(linkGo.transform);
            endPoint.transform.position = endPos;

            link.startTransform = startPoint.transform;
            link.endTransform = endPoint.transform;

            string bidirectional = GetParam(p, "bidirectional", "true");
            link.biDirectional = bidirectional != "false";

            string width = GetParam(p, "width", "");
            if (!string.IsNullOrEmpty(width))
                link.costOverride = float.Parse(width, System.Globalization.CultureInfo.InvariantCulture);

            Undo.RegisterCreatedObjectUndo(linkGo, "Create NavMesh Link");

            return new ToolResult
            {
                success = true,
                message = $"Created NavMesh link '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{linkGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult SetNavMeshArea(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string area = GetRequiredParam(p, "area");

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            int areaIndex;
            if (!int.TryParse(area, out areaIndex))
            {
                areaIndex = NavMesh.GetAreaFromName(area);
                if (areaIndex < 0)
                    return Fail($"NavMesh area not found: {area}");
            }

            GameObjectUtility.SetNavMeshArea(go, areaIndex);

            return new ToolResult
            {
                success = true,
                message = $"Set NavMesh area of '{go.name}' to {areaIndex}"
            };
        }

        private static ToolResult GetNavMeshPath(Dictionary<string, string> p)
        {
            string startStr = GetRequiredParam(p, "start");
            string endStr = GetRequiredParam(p, "end");

            if (!TryParseVector3(startStr, out Vector3 start))
            {
                GameObject startGo = FindByNameOrId(startStr);
                if (startGo != null)
                    start = startGo.transform.position;
                else
                    return Fail($"Invalid start: {startStr}");
            }

            if (!TryParseVector3(endStr, out Vector3 end))
            {
                GameObject endGo = FindByNameOrId(endStr);
                if (endGo != null)
                    end = endGo.transform.position;
                else
                    return Fail($"Invalid end: {endStr}");
            }

            NavMeshPath path = new NavMeshPath();
            bool found = NavMesh.CalculatePath(start, end, NavMesh.AllAreas, path);

            StringBuilder sb = new StringBuilder();
            sb.Append("{");
            sb.Append($"\"found\":{(found ? "true" : "false")},");
            sb.Append($"\"status\":\"{path.status}\",");
            sb.Append("\"corners\":[");
            for (int i = 0; i < path.corners.Length; i++)
            {
                if (i > 0) sb.Append(",");
                Vector3 c = path.corners[i];
                sb.Append($"[{c.x},{c.y},{c.z}]");
            }
            sb.Append("],");
            sb.Append($"\"cornerCount\":{path.corners.Length}");
            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"NavMesh path: {path.status} ({path.corners.Length} corners)",
                data = sb.ToString()
            };
        }

        private static ToolResult SetAgentSpeed(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            NavMeshAgent agent = go.GetComponent<NavMeshAgent>();
            if (agent == null) return Fail($"No NavMeshAgent on '{targetName}'");

            Undo.RecordObject(agent, "Set agent speed");

            string speed = GetParam(p, "speed", "");
            if (!string.IsNullOrEmpty(speed))
                agent.speed = float.Parse(speed, System.Globalization.CultureInfo.InvariantCulture);

            string angularSpeed = GetParam(p, "angular_speed", "");
            if (!string.IsNullOrEmpty(angularSpeed))
                agent.angularSpeed = float.Parse(angularSpeed, System.Globalization.CultureInfo.InvariantCulture);

            string acceleration = GetParam(p, "acceleration", "");
            if (!string.IsNullOrEmpty(acceleration))
                agent.acceleration = float.Parse(acceleration, System.Globalization.CultureInfo.InvariantCulture);

            return new ToolResult
            {
                success = true,
                message = $"Updated agent speed on '{go.name}' (speed: {agent.speed}, angular: {agent.angularSpeed})"
            };
        }

        // --- Helpers ---

        private static bool TryParseVector3(string s, out Vector3 v)
        {
            v = Vector3.zero;
            if (string.IsNullOrEmpty(s)) return false;
            string cleaned = s.Trim('[', ']', '(', ')');
            string[] parts = cleaned.Split(',');
            if (parts.Length >= 3
                && float.TryParse(parts[0].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float x)
                && float.TryParse(parts[1].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float y)
                && float.TryParse(parts[2].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float z))
            {
                v = new Vector3(x, y, z);
                return true;
            }
            return false;
        }

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
