using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class RuntimeTools
    {
        private static readonly List<string> _capturedLogs = new List<string>();
        private static bool _logCaptureActive;

        public static void Register()
        {
            ToolExecutor.Register("inject_runtime_command", InjectRuntimeCommand);
            ToolExecutor.Register("get_runtime_objects", GetRuntimeObjects);
            ToolExecutor.Register("modify_runtime_value", ModifyRuntimeValue);
            ToolExecutor.Register("call_runtime_method", CallRuntimeMethod);
            ToolExecutor.Register("get_runtime_logs", GetRuntimeLogs);
            ToolExecutor.Register("toggle_pause", TogglePause);
        }

        private static ToolResult InjectRuntimeCommand(Dictionary<string, string> p)
        {
            if (!EditorApplication.isPlaying)
                return Fail("Editor is not in Play mode. Enter Play mode first.");

            string targetName = GetRequiredParam(p, "target");
            string componentName = GetRequiredParam(p, "component");
            string methodName = GetRequiredParam(p, "method");
            string argsStr = GetParam(p, "args", "");

            GameObject go = GameObject.Find(targetName);
            if (go == null)
                return Fail($"Runtime GameObject not found: {targetName}");

            Component comp = null;
            foreach (var c in go.GetComponents<Component>())
            {
                if (c != null && (c.GetType().Name == componentName || c.GetType().FullName == componentName))
                {
                    comp = c;
                    break;
                }
            }

            if (comp == null)
                return Fail($"Component '{componentName}' not found on '{targetName}'");

            MethodInfo method = comp.GetType().GetMethod(methodName,
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);

            if (method == null)
                return Fail($"Method '{methodName}' not found on '{componentName}'");

            try
            {
                object[] args = ParseMethodArgs(method, argsStr);
                object result = method.Invoke(comp, args);

                return new ToolResult
                {
                    success = true,
                    message = $"Invoked {componentName}.{methodName} on '{targetName}'",
                    data = $"{{\"result\":\"{EscapeJson(result?.ToString() ?? "void")}\"}}"
                };
            }
            catch (Exception ex)
            {
                return Fail($"Method invocation failed: {ex.InnerException?.Message ?? ex.Message}");
            }
        }

        private static ToolResult GetRuntimeObjects(Dictionary<string, string> p)
        {
            if (!EditorApplication.isPlaying)
                return Fail("Editor is not in Play mode.");

            string filter = GetParam(p, "filter", "");
            string componentFilter = GetParam(p, "component", "");
            int maxResults = int.Parse(GetParam(p, "max_results", "100"));

            GameObject[] allObjects;
            if (!string.IsNullOrEmpty(componentFilter))
            {
                Type compType = FindType(componentFilter);
                if (compType == null)
                    return Fail($"Component type not found: {componentFilter}");

                var found = UnityEngine.Object.FindObjectsOfType(compType);
                var goList = new List<GameObject>();
                foreach (var obj in found)
                {
                    if (obj is Component c && !goList.Contains(c.gameObject))
                        goList.Add(c.gameObject);
                }
                allObjects = goList.ToArray();
            }
            else
            {
                allObjects = UnityEngine.Object.FindObjectsOfType<GameObject>();
            }

            StringBuilder sb = new StringBuilder("[");
            int count = 0;
            foreach (var go in allObjects)
            {
                if (count >= maxResults) break;

                if (!string.IsNullOrEmpty(filter) &&
                    go.name.IndexOf(filter, StringComparison.OrdinalIgnoreCase) < 0)
                    continue;

                if (count > 0) sb.Append(",");

                sb.Append("{");
                sb.Append($"\"name\":\"{EscapeJson(go.name)}\",");
                sb.Append($"\"instanceId\":{go.GetInstanceID()},");
                sb.Append($"\"active\":{(go.activeSelf ? "true" : "false")},");
                sb.Append($"\"layer\":{go.layer},");
                sb.Append($"\"tag\":\"{EscapeJson(go.tag)}\",");
                sb.Append("\"components\":[");
                var comps = go.GetComponents<Component>();
                for (int i = 0; i < comps.Length; i++)
                {
                    if (comps[i] == null) continue;
                    if (i > 0) sb.Append(",");
                    sb.Append($"\"{EscapeJson(comps[i].GetType().Name)}\"");
                }
                sb.Append("]}");
                count++;
            }
            sb.Append("]");

            return new ToolResult
            {
                success = true,
                message = $"Found {count} active runtime object(s)",
                data = sb.ToString()
            };
        }

        private static ToolResult ModifyRuntimeValue(Dictionary<string, string> p)
        {
            if (!EditorApplication.isPlaying)
                return Fail("Editor is not in Play mode.");

            string targetName = GetRequiredParam(p, "target");
            string componentName = GetRequiredParam(p, "component");
            string fieldName = GetRequiredParam(p, "field");
            string value = GetRequiredParam(p, "value");

            GameObject go = GameObject.Find(targetName);
            if (go == null)
                return Fail($"Runtime GameObject not found: {targetName}");

            Component comp = null;
            foreach (var c in go.GetComponents<Component>())
            {
                if (c != null && (c.GetType().Name == componentName || c.GetType().FullName == componentName))
                {
                    comp = c;
                    break;
                }
            }

            if (comp == null)
                return Fail($"Component '{componentName}' not found on '{targetName}'");

            // Try field first, then property
            Type compType = comp.GetType();
            FieldInfo field = compType.GetField(fieldName,
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
            PropertyInfo prop = compType.GetProperty(fieldName,
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);

            try
            {
                if (field != null)
                {
                    object converted = ConvertValue(value, field.FieldType);
                    field.SetValue(comp, converted);
                    return new ToolResult
                    {
                        success = true,
                        message = $"Set field '{fieldName}' = '{value}' on {componentName} of '{targetName}'"
                    };
                }
                else if (prop != null && prop.CanWrite)
                {
                    object converted = ConvertValue(value, prop.PropertyType);
                    prop.SetValue(comp, converted);
                    return new ToolResult
                    {
                        success = true,
                        message = $"Set property '{fieldName}' = '{value}' on {componentName} of '{targetName}'"
                    };
                }
                else
                {
                    return Fail($"Field or writable property '{fieldName}' not found on '{componentName}'");
                }
            }
            catch (Exception ex)
            {
                return Fail($"Failed to set value: {ex.InnerException?.Message ?? ex.Message}");
            }
        }

        private static ToolResult CallRuntimeMethod(Dictionary<string, string> p)
        {
            if (!EditorApplication.isPlaying)
                return Fail("Editor is not in Play mode.");

            string targetName = GetRequiredParam(p, "target");
            string componentName = GetRequiredParam(p, "component");
            string methodName = GetRequiredParam(p, "method");
            string argsStr = GetParam(p, "args", "");

            GameObject go = GameObject.Find(targetName);
            if (go == null)
                return Fail($"Runtime GameObject not found: {targetName}");

            Component comp = null;
            foreach (var c in go.GetComponents<Component>())
            {
                if (c != null && (c.GetType().Name == componentName || c.GetType().FullName == componentName))
                {
                    comp = c;
                    break;
                }
            }

            if (comp == null)
                return Fail($"Component '{componentName}' not found on '{targetName}'");

            MethodInfo method = comp.GetType().GetMethod(methodName,
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);

            if (method == null)
                return Fail($"Method '{methodName}' not found on '{componentName}'");

            try
            {
                object[] args = ParseMethodArgs(method, argsStr);
                object result = method.Invoke(comp, args);

                string resultStr = result?.ToString() ?? "void";

                return new ToolResult
                {
                    success = true,
                    message = $"Called {componentName}.{methodName}() on '{targetName}' => {resultStr}",
                    data = $"{{\"result\":\"{EscapeJson(resultStr)}\",\"returnType\":\"{EscapeJson(method.ReturnType.Name)}\"}}"
                };
            }
            catch (Exception ex)
            {
                return Fail($"Method call failed: {ex.InnerException?.Message ?? ex.Message}");
            }
        }

        private static ToolResult GetRuntimeLogs(Dictionary<string, string> p)
        {
            int maxLines = int.Parse(GetParam(p, "max_lines", "50"));
            string filter = GetParam(p, "filter", "");
            bool startCapture = GetParam(p, "start_capture", "false") == "true";

            if (startCapture && !_logCaptureActive)
            {
                _capturedLogs.Clear();
                Application.logMessageReceived += OnLogMessage;
                _logCaptureActive = true;
                return new ToolResult
                {
                    success = true,
                    message = "Log capture started. Call get_runtime_logs again to retrieve captured logs."
                };
            }

            bool stopCapture = GetParam(p, "stop_capture", "false") == "true";
            if (stopCapture && _logCaptureActive)
            {
                Application.logMessageReceived -= OnLogMessage;
                _logCaptureActive = false;
            }

            List<string> logs;
            lock (_capturedLogs)
            {
                logs = new List<string>(_capturedLogs);
            }

            if (!string.IsNullOrEmpty(filter))
            {
                logs = logs.FindAll(l => l.IndexOf(filter, StringComparison.OrdinalIgnoreCase) >= 0);
            }

            // Limit results
            if (logs.Count > maxLines)
                logs = logs.GetRange(logs.Count - maxLines, maxLines);

            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < logs.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append($"\"{EscapeJson(logs[i])}\"");
            }
            sb.Append("]");

            return new ToolResult
            {
                success = true,
                message = $"Retrieved {logs.Count} log line(s){(_logCaptureActive ? " (capture active)" : "")}",
                data = sb.ToString()
            };
        }

        private static void OnLogMessage(string condition, string stackTrace, LogType type)
        {
            lock (_capturedLogs)
            {
                string prefix;
                switch (type)
                {
                    case LogType.Error: prefix = "[ERROR]"; break;
                    case LogType.Warning: prefix = "[WARN]"; break;
                    case LogType.Exception: prefix = "[EXCEPTION]"; break;
                    default: prefix = "[LOG]"; break;
                }
                _capturedLogs.Add($"{prefix} {condition}");

                // Cap at 1000 lines
                if (_capturedLogs.Count > 1000)
                    _capturedLogs.RemoveAt(0);
            }
        }

        private static ToolResult TogglePause(Dictionary<string, string> p)
        {
            string action = GetParam(p, "action", "toggle").ToLower();

            switch (action)
            {
                case "pause":
                    EditorApplication.isPaused = true;
                    return new ToolResult
                    {
                        success = true,
                        message = "Play mode paused"
                    };
                case "resume":
                case "unpause":
                    EditorApplication.isPaused = false;
                    return new ToolResult
                    {
                        success = true,
                        message = "Play mode resumed"
                    };
                case "step":
                    EditorApplication.Step();
                    return new ToolResult
                    {
                        success = true,
                        message = "Stepped one frame"
                    };
                case "toggle":
                default:
                    EditorApplication.isPaused = !EditorApplication.isPaused;
                    return new ToolResult
                    {
                        success = true,
                        message = $"Play mode {(EditorApplication.isPaused ? "paused" : "resumed")}"
                    };
            }
        }

        // --- Helpers ---

        private static object[] ParseMethodArgs(MethodInfo method, string argsStr)
        {
            if (string.IsNullOrEmpty(argsStr))
                return new object[0];

            ParameterInfo[] parameters = method.GetParameters();
            string[] argParts = argsStr.Split(',');
            object[] args = new object[parameters.Length];

            for (int i = 0; i < parameters.Length && i < argParts.Length; i++)
            {
                args[i] = ConvertValue(argParts[i].Trim(), parameters[i].ParameterType);
            }

            return args;
        }

        private static object ConvertValue(string value, Type targetType)
        {
            if (targetType == typeof(string)) return value;
            if (targetType == typeof(int)) return int.Parse(value);
            if (targetType == typeof(float)) return float.Parse(value, System.Globalization.CultureInfo.InvariantCulture);
            if (targetType == typeof(double)) return double.Parse(value, System.Globalization.CultureInfo.InvariantCulture);
            if (targetType == typeof(bool)) return value.ToLower() == "true" || value == "1";
            if (targetType == typeof(long)) return long.Parse(value);

            if (targetType == typeof(Vector3))
            {
                string[] parts = value.Trim('[', ']', '(', ')').Split(',');
                if (parts.Length >= 3)
                    return new Vector3(
                        float.Parse(parts[0].Trim(), System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(parts[1].Trim(), System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(parts[2].Trim(), System.Globalization.CultureInfo.InvariantCulture));
            }

            if (targetType == typeof(Vector2))
            {
                string[] parts = value.Trim('[', ']', '(', ')').Split(',');
                if (parts.Length >= 2)
                    return new Vector2(
                        float.Parse(parts[0].Trim(), System.Globalization.CultureInfo.InvariantCulture),
                        float.Parse(parts[1].Trim(), System.Globalization.CultureInfo.InvariantCulture));
            }

            if (targetType.IsEnum)
                return Enum.Parse(targetType, value, true);

            return Convert.ChangeType(value, targetType, System.Globalization.CultureInfo.InvariantCulture);
        }

        private static Type FindType(string typeName)
        {
            Type t = Type.GetType($"UnityEngine.{typeName}, UnityEngine");
            if (t != null) return t;
            t = Type.GetType(typeName);
            if (t != null) return t;
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                foreach (var type in assembly.GetTypes())
                {
                    if (type.Name == typeName || type.FullName == typeName)
                        return type;
                }
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
