using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.Profiling;

namespace OpenForge.Editor.Tools
{
    [InitializeOnLoad]
    public static class PlaytestTools
    {
        private static readonly List<LogEntry> _capturedLogs = new List<LogEntry>();
        private static bool _capturing;

        [Serializable]
        private class LogEntry
        {
            public string message;
            public string stackTrace;
            public string type;
            public double timestamp;
        }

        static PlaytestTools()
        {
            Application.logMessageReceived += OnLogMessageReceived;
            EditorApplication.playModeStateChanged += OnPlayModeStateChanged;
        }

        private static void OnPlayModeStateChanged(PlayModeStateChange state)
        {
            if (state == PlayModeStateChange.EnteredPlayMode)
            {
                _capturedLogs.Clear();
                _capturing = true;
            }
            else if (state == PlayModeStateChange.ExitingPlayMode)
            {
                _capturing = false;
            }
        }

        private static void OnLogMessageReceived(string condition, string stackTrace, LogType type)
        {
            if (!_capturing) return;

            _capturedLogs.Add(new LogEntry
            {
                message = condition,
                stackTrace = stackTrace,
                type = type.ToString(),
                timestamp = EditorApplication.timeSinceStartup
            });
        }

        public static void Register()
        {
            ToolExecutor.Register("enter_playmode", EnterPlaymode);
            ToolExecutor.Register("exit_playmode", ExitPlaymode);
            ToolExecutor.Register("is_playing", IsPlaying);
            ToolExecutor.Register("simulate_input", SimulateInput);
            ToolExecutor.Register("get_console_logs", GetConsoleLogs);
            ToolExecutor.Register("get_performance_stats", GetPerformanceStats);
            ToolExecutor.Register("wait_frames", WaitFrames);
            ToolExecutor.Register("run_playtest", RunPlaytest);
        }

        // ---- Tool Implementations ----

        private static ToolResult EnterPlaymode(Dictionary<string, string> p)
        {
            if (EditorApplication.isPlaying)
                return Fail("Editor is already in play mode.");

            _capturedLogs.Clear();
            _capturing = true;
            EditorApplication.EnterPlaymode();

            return new ToolResult
            {
                success = true,
                message = "Entering play mode. Log capture started."
            };
        }

        private static ToolResult ExitPlaymode(Dictionary<string, string> p)
        {
            if (!EditorApplication.isPlaying)
                return Fail("Editor is not in play mode.");

            _capturing = false;
            EditorApplication.ExitPlaymode();

            return new ToolResult
            {
                success = true,
                message = "Exiting play mode. Log capture stopped."
            };
        }

        private static ToolResult IsPlaying(Dictionary<string, string> p)
        {
            bool playing = EditorApplication.isPlaying;
            bool paused = EditorApplication.isPaused;
            bool compiling = EditorApplication.isCompiling;

            string data = $"{{\"isPlaying\":{BoolStr(playing)},\"isPaused\":{BoolStr(paused)},\"isCompiling\":{BoolStr(compiling)}}}";

            return new ToolResult
            {
                success = true,
                message = playing ? "Editor is in play mode." : "Editor is not in play mode.",
                data = data
            };
        }

        private static ToolResult SimulateInput(Dictionary<string, string> p)
        {
            if (!EditorApplication.isPlaying)
                return Fail("Cannot simulate input outside of play mode.");

            string inputType = GetParam(p, "type", "key");
            string action = GetParam(p, "action", "press");

            if (inputType == "key")
            {
                string keyName = GetParam(p, "key", "");
                if (string.IsNullOrEmpty(keyName))
                    return Fail("Parameter 'key' is required for key input.");

                // Use SendMessage to notify all active GameObjects that accept input
                GameObject[] rootObjects = UnityEngine.SceneManagement.SceneManager.GetActiveScene().GetRootGameObjects();
                int notified = 0;
                foreach (var root in rootObjects)
                {
                    MonoBehaviour[] behaviours = root.GetComponentsInChildren<MonoBehaviour>(false);
                    foreach (var mb in behaviours)
                    {
                        try
                        {
                            mb.SendMessage("OnSimulatedKey", keyName + ":" + action, SendMessageOptions.DontRequireReceiver);
                            notified++;
                        }
                        catch
                        {
                            // Ignore objects that cannot receive the message.
                        }
                    }
                }

                return new ToolResult
                {
                    success = true,
                    message = $"Simulated key '{action}' for '{keyName}'. Notified {notified} behaviours.",
                    data = $"{{\"type\":\"key\",\"key\":\"{Escape(keyName)}\",\"action\":\"{Escape(action)}\",\"notifiedCount\":{notified}}}"
                };
            }
            else if (inputType == "mouse")
            {
                float x = 0f, y = 0f;
                int button = 0;
                if (p.TryGetValue("x", out string xStr)) float.TryParse(xStr, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out x);
                if (p.TryGetValue("y", out string yStr)) float.TryParse(yStr, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out y);
                if (p.TryGetValue("button", out string bStr)) int.TryParse(bStr, out button);

                // Broadcast mouse event to all active MonoBehaviours
                string mousePayload = $"{x},{y},{button},{action}";
                GameObject[] roots = UnityEngine.SceneManagement.SceneManager.GetActiveScene().GetRootGameObjects();
                int notified = 0;
                foreach (var root in roots)
                {
                    MonoBehaviour[] behaviours = root.GetComponentsInChildren<MonoBehaviour>(false);
                    foreach (var mb in behaviours)
                    {
                        try
                        {
                            mb.SendMessage("OnSimulatedMouse", mousePayload, SendMessageOptions.DontRequireReceiver);
                            notified++;
                        }
                        catch
                        {
                            // Ignore objects that cannot receive the message.
                        }
                    }
                }

                return new ToolResult
                {
                    success = true,
                    message = $"Simulated mouse '{action}' at ({x}, {y}) button {button}. Notified {notified} behaviours.",
                    data = $"{{\"type\":\"mouse\",\"x\":{x},\"y\":{y},\"button\":{button},\"action\":\"{Escape(action)}\",\"notifiedCount\":{notified}}}"
                };
            }

            return Fail($"Unknown input type: '{inputType}'. Use 'key' or 'mouse'.");
        }

        private static ToolResult GetConsoleLogs(Dictionary<string, string> p)
        {
            string filter = GetParam(p, "filter", "");
            int limit = 500;
            if (p.TryGetValue("limit", out string lStr)) int.TryParse(lStr, out limit);

            List<LogEntry> filtered;
            if (!string.IsNullOrEmpty(filter))
            {
                filtered = new List<LogEntry>();
                foreach (var entry in _capturedLogs)
                {
                    if (entry.type.Equals(filter, StringComparison.OrdinalIgnoreCase))
                        filtered.Add(entry);
                }
            }
            else
            {
                filtered = new List<LogEntry>(_capturedLogs);
            }

            // Apply limit from the end (most recent)
            if (filtered.Count > limit)
                filtered = filtered.GetRange(filtered.Count - limit, limit);

            // Build JSON array
            var sb = new StringBuilder();
            sb.Append("{\"totalCaptured\":");
            sb.Append(_capturedLogs.Count);
            sb.Append(",\"returned\":");
            sb.Append(filtered.Count);
            sb.Append(",\"logs\":[");
            for (int i = 0; i < filtered.Count; i++)
            {
                if (i > 0) sb.Append(",");
                var e = filtered[i];
                sb.Append("{\"message\":\"");
                sb.Append(Escape(e.message));
                sb.Append("\",\"type\":\"");
                sb.Append(Escape(e.type));
                sb.Append("\",\"timestamp\":");
                sb.Append(e.timestamp.ToString(System.Globalization.CultureInfo.InvariantCulture));
                sb.Append("}");
            }
            sb.Append("]}");

            return new ToolResult
            {
                success = true,
                message = $"Retrieved {filtered.Count} log entries (total captured: {_capturedLogs.Count}).",
                data = sb.ToString()
            };
        }

        private static ToolResult GetPerformanceStats(Dictionary<string, string> p)
        {
            var sb = new StringBuilder();
            sb.Append("{");

            // Frame rate
            float fps = 1.0f / Mathf.Max(Time.unscaledDeltaTime, 0.0001f);
            sb.Append("\"fps\":");
            sb.Append(fps.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));

            sb.Append(",\"deltaTime\":");
            sb.Append(Time.unscaledDeltaTime.ToString("F4", System.Globalization.CultureInfo.InvariantCulture));

            // Memory from Profiler API
            long totalAllocated = Profiler.GetTotalAllocatedMemoryLong();
            long totalReserved = Profiler.GetTotalReservedMemoryLong();
            long totalUnused = Profiler.GetTotalUnusedReservedMemoryLong();
            long monoUsed = Profiler.GetMonoUsedSizeLong();
            long monoHeap = Profiler.GetMonoHeapSizeLong();

            sb.Append(",\"memory\":{");
            sb.Append("\"totalAllocatedMB\":");
            sb.Append((totalAllocated / (1024.0 * 1024.0)).ToString("F2", System.Globalization.CultureInfo.InvariantCulture));
            sb.Append(",\"totalReservedMB\":");
            sb.Append((totalReserved / (1024.0 * 1024.0)).ToString("F2", System.Globalization.CultureInfo.InvariantCulture));
            sb.Append(",\"totalUnusedMB\":");
            sb.Append((totalUnused / (1024.0 * 1024.0)).ToString("F2", System.Globalization.CultureInfo.InvariantCulture));
            sb.Append(",\"monoUsedMB\":");
            sb.Append((monoUsed / (1024.0 * 1024.0)).ToString("F2", System.Globalization.CultureInfo.InvariantCulture));
            sb.Append(",\"monoHeapMB\":");
            sb.Append((monoHeap / (1024.0 * 1024.0)).ToString("F2", System.Globalization.CultureInfo.InvariantCulture));
            sb.Append("}");

            // Rendering stats via UnityStats (editor only, requires play mode for some values)
            try
            {
                var statsType = typeof(UnityEditor.EditorWindow).Assembly.GetType("UnityEditor.UnityStats");
                if (statsType != null)
                {
                    var drawCallsProp = statsType.GetProperty("drawCalls", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);
                    var trianglesProp = statsType.GetProperty("triangles", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);
                    var verticesProp = statsType.GetProperty("vertices", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);
                    var batchesProp = statsType.GetProperty("batches", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);
                    var setPassCallsProp = statsType.GetProperty("setPassCalls", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);

                    sb.Append(",\"rendering\":{");
                    bool first = true;

                    if (drawCallsProp != null)
                    {
                        sb.Append("\"drawCalls\":");
                        sb.Append(drawCallsProp.GetValue(null));
                        first = false;
                    }
                    if (trianglesProp != null)
                    {
                        if (!first) sb.Append(",");
                        sb.Append("\"triangles\":");
                        sb.Append(trianglesProp.GetValue(null));
                        first = false;
                    }
                    if (verticesProp != null)
                    {
                        if (!first) sb.Append(",");
                        sb.Append("\"vertices\":");
                        sb.Append(verticesProp.GetValue(null));
                        first = false;
                    }
                    if (batchesProp != null)
                    {
                        if (!first) sb.Append(",");
                        sb.Append("\"batches\":");
                        sb.Append(batchesProp.GetValue(null));
                        first = false;
                    }
                    if (setPassCallsProp != null)
                    {
                        if (!first) sb.Append(",");
                        sb.Append("\"setPassCalls\":");
                        sb.Append(setPassCallsProp.GetValue(null));
                    }
                    sb.Append("}");
                }
            }
            catch
            {
                // UnityStats may not be available in all versions; skip rendering stats.
            }

            // Object counts
            int gameObjectCount = UnityEngine.Object.FindObjectsOfType<GameObject>().Length;
            int rendererCount = UnityEngine.Object.FindObjectsOfType<Renderer>().Length;
            int lightCount = UnityEngine.Object.FindObjectsOfType<Light>().Length;

            sb.Append(",\"scene\":{");
            sb.Append("\"gameObjects\":");
            sb.Append(gameObjectCount);
            sb.Append(",\"renderers\":");
            sb.Append(rendererCount);
            sb.Append(",\"lights\":");
            sb.Append(lightCount);
            sb.Append("}");

            sb.Append(",\"isPlaying\":");
            sb.Append(BoolStr(EditorApplication.isPlaying));

            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Performance stats collected. FPS: {fps:F1}, Memory: {totalAllocated / (1024.0 * 1024.0):F1}MB, GameObjects: {gameObjectCount}.",
                data = sb.ToString()
            };
        }

        private static ToolResult WaitFrames(Dictionary<string, string> p)
        {
            if (!EditorApplication.isPlaying)
                return Fail("Cannot wait frames outside of play mode.");

            int frameCount = 1;
            if (p.TryGetValue("count", out string cStr)) int.TryParse(cStr, out frameCount);
            if (frameCount < 1) frameCount = 1;
            if (frameCount > 10000) frameCount = 10000;

            // We cannot truly block and wait N frames from a synchronous tool call.
            // Instead we step the editor forward by the requested number of frames.
            int startFrame = Time.frameCount;
            for (int i = 0; i < frameCount; i++)
            {
                EditorApplication.Step();
            }
            int endFrame = Time.frameCount;

            return new ToolResult
            {
                success = true,
                message = $"Stepped {frameCount} frame(s). Frame counter: {startFrame} -> {endFrame}.",
                data = $"{{\"requestedFrames\":{frameCount},\"startFrame\":{startFrame},\"endFrame\":{endFrame}}}"
            };
        }

        private static ToolResult RunPlaytest(Dictionary<string, string> p)
        {
            float durationSeconds = 5f;
            if (p.TryGetValue("duration", out string dStr))
                float.TryParse(dStr, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out durationSeconds);
            if (durationSeconds < 0.1f) durationSeconds = 0.1f;
            if (durationSeconds > 300f) durationSeconds = 300f;

            int waitFrames = Mathf.Max(1, Mathf.RoundToInt(durationSeconds * 60f));
            if (p.TryGetValue("frames", out string fStr))
            {
                int parsed;
                if (int.TryParse(fStr, out parsed) && parsed > 0)
                    waitFrames = Mathf.Min(parsed, 18000);
            }

            bool wasPlaying = EditorApplication.isPlaying;

            var report = new StringBuilder();
            report.Append("{");

            // Step 1: Pre-playtest screenshot
            string preScreenshot = "null";
            try
            {
                var screenshotResult = ScreenshotTools_Capture("scene");
                if (screenshotResult.success && !string.IsNullOrEmpty(screenshotResult.data))
                    preScreenshot = screenshotResult.data;
            }
            catch { }
            report.Append("\"preScreenshot\":");
            report.Append(preScreenshot);

            // Step 2: Enter play mode if not already playing
            if (!wasPlaying)
            {
                _capturedLogs.Clear();
                _capturing = true;
                EditorApplication.EnterPlaymode();
            }

            report.Append(",\"enteredPlayMode\":");
            report.Append(BoolStr(!wasPlaying));

            // Step 3: Simulate inputs if provided
            string inputSequence = GetParam(p, "inputs", "");
            int inputsSimulated = 0;
            if (!string.IsNullOrEmpty(inputSequence))
            {
                // Format: "key:Space:press,key:W:hold,mouse:100:200:0:click"
                string[] inputs = inputSequence.Split(',');
                foreach (string input in inputs)
                {
                    string[] parts = input.Trim().Split(':');
                    if (parts.Length < 2) continue;

                    var inputParams = new Dictionary<string, string>();
                    if (parts[0] == "key" && parts.Length >= 2)
                    {
                        inputParams["type"] = "key";
                        inputParams["key"] = parts[1];
                        inputParams["action"] = parts.Length >= 3 ? parts[2] : "press";
                    }
                    else if (parts[0] == "mouse" && parts.Length >= 4)
                    {
                        inputParams["type"] = "mouse";
                        inputParams["x"] = parts[1];
                        inputParams["y"] = parts[2];
                        inputParams["button"] = parts.Length >= 4 ? parts[3] : "0";
                        inputParams["action"] = parts.Length >= 5 ? parts[4] : "click";
                    }
                    else
                    {
                        continue;
                    }

                    SimulateInput(inputParams);
                    inputsSimulated++;
                }
            }
            report.Append(",\"inputsSimulated\":");
            report.Append(inputsSimulated);

            // Step 4: Wait frames
            int startFrame = Time.frameCount;
            for (int i = 0; i < waitFrames; i++)
            {
                EditorApplication.Step();
            }
            int endFrame = Time.frameCount;

            report.Append(",\"framesWaited\":");
            report.Append(waitFrames);
            report.Append(",\"startFrame\":");
            report.Append(startFrame);
            report.Append(",\"endFrame\":");
            report.Append(endFrame);

            // Step 5: Collect console logs
            var logParams = new Dictionary<string, string>();
            logParams["limit"] = "200";
            var logResult = GetConsoleLogs(logParams);
            report.Append(",\"consoleLogs\":");
            report.Append(logResult.data ?? "null");

            // Step 6: Collect performance stats
            var statsResult = GetPerformanceStats(new Dictionary<string, string>());
            report.Append(",\"performanceStats\":");
            report.Append(statsResult.data ?? "null");

            // Step 7: Post-playtest screenshot
            string postScreenshot = "null";
            try
            {
                var screenshotResult = ScreenshotTools_Capture("game");
                if (screenshotResult.success && !string.IsNullOrEmpty(screenshotResult.data))
                    postScreenshot = screenshotResult.data;
            }
            catch { }
            report.Append(",\"postScreenshot\":");
            report.Append(postScreenshot);

            // Step 8: Exit play mode
            if (!wasPlaying)
            {
                _capturing = false;
                EditorApplication.ExitPlaymode();
            }

            report.Append(",\"exitedPlayMode\":");
            report.Append(BoolStr(!wasPlaying));

            // Summary
            int errorCount = 0;
            int warningCount = 0;
            foreach (var log in _capturedLogs)
            {
                if (log.type == "Error" || log.type == "Exception" || log.type == "Assert")
                    errorCount++;
                else if (log.type == "Warning")
                    warningCount++;
            }
            report.Append(",\"summary\":{");
            report.Append("\"totalLogs\":");
            report.Append(_capturedLogs.Count);
            report.Append(",\"errors\":");
            report.Append(errorCount);
            report.Append(",\"warnings\":");
            report.Append(warningCount);
            report.Append(",\"durationSeconds\":");
            report.Append(durationSeconds.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
            report.Append(",\"framesProcessed\":");
            report.Append(waitFrames);
            report.Append(",\"passed\":");
            report.Append(BoolStr(errorCount == 0));
            report.Append("}");

            report.Append("}");

            string passedStr = errorCount == 0 ? "PASSED" : "FAILED";

            return new ToolResult
            {
                success = true,
                message = $"Playtest {passedStr}: {waitFrames} frames, {_capturedLogs.Count} logs ({errorCount} errors, {warningCount} warnings).",
                data = report.ToString()
            };
        }

        // ---- Helpers ----

        private static ToolResult ScreenshotTools_Capture(string source)
        {
            var p = new Dictionary<string, string> { { "source", source } };

            // Invoke the screenshot tool via ToolExecutor to reuse existing logic.
            return ToolExecutor.Execute("get_viewport_screenshot",
                $"{{\"source\":\"{source}\"}}");
        }

        private static string GetParam(Dictionary<string, string> p, string key, string defaultValue = "")
        {
            return p.TryGetValue(key, out string value) ? value : defaultValue;
        }

        private static string BoolStr(bool value)
        {
            return value ? "true" : "false";
        }

        private static string Escape(string s)
        {
            if (s == null) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r").Replace("\t", "\\t");
        }

        private static ToolResult Fail(string message)
        {
            return new ToolResult { success = false, message = message };
        }
    }
}
