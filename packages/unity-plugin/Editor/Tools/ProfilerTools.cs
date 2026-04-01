using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.Profiling;

namespace OpenForge.Editor.Tools
{
    public static class ProfilerTools
    {
        public static void Register()
        {
            ToolExecutor.Register("start_profiling", StartProfiling);
            ToolExecutor.Register("stop_profiling", StopProfiling);
            ToolExecutor.Register("get_cpu_usage", GetCPUUsage);
            ToolExecutor.Register("get_memory_stats", GetMemoryStats);
            ToolExecutor.Register("get_rendering_stats", GetRenderingStats);
            ToolExecutor.Register("get_gc_stats", GetGCStats);
            ToolExecutor.Register("save_profiler_data", SaveProfilerData);
            ToolExecutor.Register("analyze_performance", AnalyzePerformance);
        }

        private static ToolResult StartProfiling(Dictionary<string, string> p)
        {
            bool deepProfile = GetParam(p, "deep_profile", "false") == "true";
            string logFile = GetParam(p, "log_file", "");

            try
            {
                // Use reflection to access UnityEditorInternal.ProfilerDriver
                var profilerDriverType = Type.GetType("UnityEditorInternal.ProfilerDriver, UnityEditor");

                if (profilerDriverType != null)
                {
                    var enabledProp = profilerDriverType.GetProperty("enabled",
                        System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
                    enabledProp?.SetValue(null, true);

                    if (deepProfile)
                    {
                        var deepProfileProp = profilerDriverType.GetProperty("deepProfiling",
                            System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
                        deepProfileProp?.SetValue(null, true);
                    }
                }

                Profiler.enabled = true;

                if (!string.IsNullOrEmpty(logFile))
                {
                    Profiler.logFile = logFile;
                    Profiler.enableBinaryLog = true;
                }

                return new ToolResult
                {
                    success = true,
                    message = $"Profiler recording started{(deepProfile ? " (deep profiling)" : "")}{(!string.IsNullOrEmpty(logFile) ? $", logging to {logFile}" : "")}"
                };
            }
            catch (Exception ex)
            {
                return Fail($"Failed to start profiling: {ex.Message}");
            }
        }

        private static ToolResult StopProfiling(Dictionary<string, string> p)
        {
            try
            {
                var profilerDriverType = Type.GetType("UnityEditorInternal.ProfilerDriver, UnityEditor");
                if (profilerDriverType != null)
                {
                    var enabledProp = profilerDriverType.GetProperty("enabled",
                        System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
                    enabledProp?.SetValue(null, false);
                }

                Profiler.enabled = false;
                Profiler.enableBinaryLog = false;

                return new ToolResult
                {
                    success = true,
                    message = "Profiler recording stopped"
                };
            }
            catch (Exception ex)
            {
                return Fail($"Failed to stop profiling: {ex.Message}");
            }
        }

        private static ToolResult GetCPUUsage(Dictionary<string, string> p)
        {
            try
            {
                // Use reflection to access profiler frame data
                var profilerDriverType = Type.GetType("UnityEditorInternal.ProfilerDriver, UnityEditor");
                var frameDataType = Type.GetType("UnityEditorInternal.ProfilerFrameDataIterator, UnityEditor");

                StringBuilder sb = new StringBuilder("{");

                // Basic timing information from Profiler API
                float realtimeSinceStartup = Time.realtimeSinceStartup;

                // Try to get frame timing via reflection
                if (profilerDriverType != null)
                {
                    var lastFrameIndex = profilerDriverType.GetMethod("GetPreviousFrameIndex",
                        System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);

                    if (lastFrameIndex != null)
                    {
                        int frameIdx = (int)lastFrameIndex.Invoke(null, new object[] { -1 });
                        sb.Append($"\"frameIndex\":{frameIdx},");
                    }
                }

                // Get system memory info
                long totalReserved = Profiler.GetTotalReservedMemoryLong();
                long totalAllocated = Profiler.GetTotalAllocatedMemoryLong();

                sb.Append($"\"totalReservedMemoryMB\":{totalReserved / (1024f * 1024f):F2},");
                sb.Append($"\"totalAllocatedMemoryMB\":{totalAllocated / (1024f * 1024f):F2},");
                sb.Append($"\"realtimeSinceStartup\":{realtimeSinceStartup:F4},");
                sb.Append($"\"targetFrameRate\":{Application.targetFrameRate},");
                sb.Append($"\"currentFPS\":{1f / Time.unscaledDeltaTime:F1}");

                sb.Append("}");

                return new ToolResult
                {
                    success = true,
                    message = $"CPU usage: {1f / Time.unscaledDeltaTime:F1} FPS, {totalAllocated / (1024f * 1024f):F2} MB allocated",
                    data = sb.ToString()
                };
            }
            catch (Exception ex)
            {
                return Fail($"Failed to get CPU usage: {ex.Message}");
            }
        }

        private static ToolResult GetMemoryStats(Dictionary<string, string> p)
        {
            try
            {
                long totalReserved = Profiler.GetTotalReservedMemoryLong();
                long totalAllocated = Profiler.GetTotalAllocatedMemoryLong();
                long totalUnused = Profiler.GetTotalUnusedReservedMemoryLong();
                long monoHeap = Profiler.GetMonoHeapSizeLong();
                long monoUsed = Profiler.GetMonoUsedSizeLong();
                long tempAllocator = Profiler.GetTempAllocatorSize();
                long gfxDriverMem = Profiler.GetAllocatedMemoryForGraphicsDriver();

                StringBuilder sb = new StringBuilder("{");
                sb.Append($"\"totalReservedMB\":{totalReserved / (1024f * 1024f):F2},");
                sb.Append($"\"totalAllocatedMB\":{totalAllocated / (1024f * 1024f):F2},");
                sb.Append($"\"totalUnusedMB\":{totalUnused / (1024f * 1024f):F2},");
                sb.Append($"\"monoHeapMB\":{monoHeap / (1024f * 1024f):F2},");
                sb.Append($"\"monoUsedMB\":{monoUsed / (1024f * 1024f):F2},");
                sb.Append($"\"tempAllocatorMB\":{tempAllocator / (1024f * 1024f):F2},");
                sb.Append($"\"gfxDriverMemMB\":{gfxDriverMem / (1024f * 1024f):F2},");
                sb.Append($"\"systemMemoryMB\":{SystemInfo.systemMemorySize},");
                sb.Append($"\"graphicsMemoryMB\":{SystemInfo.graphicsMemorySize}");
                sb.Append("}");

                return new ToolResult
                {
                    success = true,
                    message = $"Memory: {totalAllocated / (1024f * 1024f):F2} MB allocated, {monoUsed / (1024f * 1024f):F2} MB Mono used, {gfxDriverMem / (1024f * 1024f):F2} MB GFX",
                    data = sb.ToString()
                };
            }
            catch (Exception ex)
            {
                return Fail($"Failed to get memory stats: {ex.Message}");
            }
        }

        private static ToolResult GetRenderingStats(Dictionary<string, string> p)
        {
            try
            {
                StringBuilder sb = new StringBuilder("{");

                // Use UnityStats via reflection (editor-only stats)
                var unityStatsType = Type.GetType("UnityEditor.UnityStats, UnityEditor");
                if (unityStatsType != null)
                {
                    var drawCallsProp = unityStatsType.GetProperty("drawCalls", System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
                    var batchesProp = unityStatsType.GetProperty("batches", System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
                    var trianglesProp = unityStatsType.GetProperty("triangles", System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
                    var verticesProp = unityStatsType.GetProperty("vertices", System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
                    var setPassProp = unityStatsType.GetProperty("setPassCalls", System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
                    var shadowCastersProp = unityStatsType.GetProperty("shadowCasters", System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
                    var screenResProp = unityStatsType.GetProperty("screenRes", System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);

                    if (drawCallsProp != null) sb.Append($"\"drawCalls\":{drawCallsProp.GetValue(null)},");
                    if (batchesProp != null) sb.Append($"\"batches\":{batchesProp.GetValue(null)},");
                    if (trianglesProp != null) sb.Append($"\"triangles\":{trianglesProp.GetValue(null)},");
                    if (verticesProp != null) sb.Append($"\"vertices\":{verticesProp.GetValue(null)},");
                    if (setPassProp != null) sb.Append($"\"setPassCalls\":{setPassProp.GetValue(null)},");
                    if (shadowCastersProp != null) sb.Append($"\"shadowCasters\":{shadowCastersProp.GetValue(null)},");
                    if (screenResProp != null) sb.Append($"\"screenResolution\":\"{EscapeJson(screenResProp.GetValue(null)?.ToString())}\",");
                }

                // Static system info
                sb.Append($"\"graphicsDeviceName\":\"{EscapeJson(SystemInfo.graphicsDeviceName)}\",");
                sb.Append($"\"graphicsDeviceType\":\"{SystemInfo.graphicsDeviceType}\",");
                sb.Append($"\"graphicsMemorySize\":{SystemInfo.graphicsMemorySize},");
                sb.Append($"\"maxTextureSize\":{SystemInfo.maxTextureSize},");
                sb.Append($"\"supportedRenderTargetCount\":{SystemInfo.supportedRenderTargetCount}");
                sb.Append("}");

                return new ToolResult
                {
                    success = true,
                    message = "Rendering statistics retrieved",
                    data = sb.ToString()
                };
            }
            catch (Exception ex)
            {
                return Fail($"Failed to get rendering stats: {ex.Message}");
            }
        }

        private static ToolResult GetGCStats(Dictionary<string, string> p)
        {
            try
            {
                long monoHeap = Profiler.GetMonoHeapSizeLong();
                long monoUsed = Profiler.GetMonoUsedSizeLong();
                long monoFree = monoHeap - monoUsed;

                int gcCollectionCount0 = GC.CollectionCount(0);
                int gcCollectionCount1 = GC.CollectionCount(1);
                int gcCollectionCount2 = GC.CollectionCount(2);
                long gcTotalMemory = GC.GetTotalMemory(false);

                StringBuilder sb = new StringBuilder("{");
                sb.Append($"\"monoHeapMB\":{monoHeap / (1024f * 1024f):F2},");
                sb.Append($"\"monoUsedMB\":{monoUsed / (1024f * 1024f):F2},");
                sb.Append($"\"monoFreeMB\":{monoFree / (1024f * 1024f):F2},");
                sb.Append($"\"gcGen0Collections\":{gcCollectionCount0},");
                sb.Append($"\"gcGen1Collections\":{gcCollectionCount1},");
                sb.Append($"\"gcGen2Collections\":{gcCollectionCount2},");
                sb.Append($"\"gcTotalMemoryMB\":{gcTotalMemory / (1024f * 1024f):F2}");
                sb.Append("}");

                return new ToolResult
                {
                    success = true,
                    message = $"GC: {gcCollectionCount0}/{gcCollectionCount1}/{gcCollectionCount2} collections (gen0/1/2), {monoUsed / (1024f * 1024f):F2} MB in use",
                    data = sb.ToString()
                };
            }
            catch (Exception ex)
            {
                return Fail($"Failed to get GC stats: {ex.Message}");
            }
        }

        private static ToolResult SaveProfilerData(Dictionary<string, string> p)
        {
            string filePath = GetParam(p, "path", "Assets/ProfilerData/profiler_capture.raw");

            try
            {
                string dir = Path.GetDirectoryName(filePath);
                if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                    Directory.CreateDirectory(dir);

                // Use ProfilerDriver.SaveProfile via reflection
                var profilerDriverType = Type.GetType("UnityEditorInternal.ProfilerDriver, UnityEditor");
                if (profilerDriverType != null)
                {
                    var saveMethod = profilerDriverType.GetMethod("SaveProfile",
                        System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
                    if (saveMethod != null)
                    {
                        saveMethod.Invoke(null, new object[] { filePath });
                        return new ToolResult
                        {
                            success = true,
                            message = $"Profiler data saved to '{filePath}'"
                        };
                    }
                }

                // Fallback: just note the log file location
                if (!string.IsNullOrEmpty(Profiler.logFile))
                {
                    return new ToolResult
                    {
                        success = true,
                        message = $"Profiler binary log is being written to '{Profiler.logFile}'"
                    };
                }

                return Fail("Could not save profiler data. Enable profiler logging first with start_profiling and a log_file parameter.");
            }
            catch (Exception ex)
            {
                return Fail($"Failed to save profiler data: {ex.Message}");
            }
        }

        private static ToolResult AnalyzePerformance(Dictionary<string, string> p)
        {
            try
            {
                StringBuilder sb = new StringBuilder("{");

                // Memory
                long totalAllocated = Profiler.GetTotalAllocatedMemoryLong();
                long monoHeap = Profiler.GetMonoHeapSizeLong();
                long monoUsed = Profiler.GetMonoUsedSizeLong();
                long gfxDriverMem = Profiler.GetAllocatedMemoryForGraphicsDriver();

                sb.Append("\"memory\":{");
                sb.Append($"\"totalAllocatedMB\":{totalAllocated / (1024f * 1024f):F2},");
                sb.Append($"\"monoHeapMB\":{monoHeap / (1024f * 1024f):F2},");
                sb.Append($"\"monoUsedMB\":{monoUsed / (1024f * 1024f):F2},");
                sb.Append($"\"gfxDriverMemMB\":{gfxDriverMem / (1024f * 1024f):F2}");
                sb.Append("},");

                // FPS
                float fps = 1f / Time.unscaledDeltaTime;
                float frameTime = Time.unscaledDeltaTime * 1000f;
                sb.Append("\"timing\":{");
                sb.Append($"\"currentFPS\":{fps:F1},");
                sb.Append($"\"frameTimeMs\":{frameTime:F2},");
                sb.Append($"\"targetFrameRate\":{Application.targetFrameRate},");
                sb.Append($"\"vSyncCount\":{QualitySettings.vSyncCount}");
                sb.Append("},");

                // GC
                sb.Append("\"gc\":{");
                sb.Append($"\"gen0\":{GC.CollectionCount(0)},");
                sb.Append($"\"gen1\":{GC.CollectionCount(1)},");
                sb.Append($"\"gen2\":{GC.CollectionCount(2)},");
                sb.Append($"\"totalMemoryMB\":{GC.GetTotalMemory(false) / (1024f * 1024f):F2}");
                sb.Append("},");

                // Scene stats
                int totalGameObjects = UnityEngine.Object.FindObjectsOfType<GameObject>().Length;
                int totalRenderers = UnityEngine.Object.FindObjectsOfType<Renderer>().Length;
                int totalLights = UnityEngine.Object.FindObjectsOfType<Light>().Length;
                int totalColliders = UnityEngine.Object.FindObjectsOfType<Collider>().Length;

                sb.Append("\"scene\":{");
                sb.Append($"\"gameObjects\":{totalGameObjects},");
                sb.Append($"\"renderers\":{totalRenderers},");
                sb.Append($"\"lights\":{totalLights},");
                sb.Append($"\"colliders\":{totalColliders}");
                sb.Append("},");

                // Rendering
                var unityStatsType = Type.GetType("UnityEditor.UnityStats, UnityEditor");
                if (unityStatsType != null)
                {
                    sb.Append("\"rendering\":{");
                    var drawCallsProp = unityStatsType.GetProperty("drawCalls", System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
                    var batchesProp = unityStatsType.GetProperty("batches", System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
                    var trianglesProp = unityStatsType.GetProperty("triangles", System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
                    if (drawCallsProp != null) sb.Append($"\"drawCalls\":{drawCallsProp.GetValue(null)},");
                    if (batchesProp != null) sb.Append($"\"batches\":{batchesProp.GetValue(null)},");
                    if (trianglesProp != null) sb.Append($"\"triangles\":{trianglesProp.GetValue(null)},");
                    // Remove trailing comma if needed
                    sb.Append($"\"graphicsDevice\":\"{EscapeJson(SystemInfo.graphicsDeviceName)}\"");
                    sb.Append("},");
                }

                // Quality settings
                sb.Append("\"quality\":{");
                sb.Append($"\"level\":{QualitySettings.GetQualityLevel()},");
                sb.Append($"\"name\":\"{EscapeJson(QualitySettings.names[QualitySettings.GetQualityLevel()])}\",");
                sb.Append($"\"shadowResolution\":\"{QualitySettings.shadowResolution}\",");
                sb.Append($"\"antiAliasing\":{QualitySettings.antiAliasing},");
                sb.Append($"\"pixelLightCount\":{QualitySettings.pixelLightCount}");
                sb.Append("},");

                // Recommendations
                sb.Append("\"recommendations\":[");
                List<string> recs = new List<string>();
                if (fps < 30) recs.Add("FPS is below 30. Consider reducing draw calls, triangle count, or quality settings.");
                if (monoUsed > 256 * 1024 * 1024L) recs.Add("Mono memory usage is high. Check for memory leaks or excessive allocations.");
                if (totalLights > 8) recs.Add($"Scene has {totalLights} lights. Consider baking lighting or reducing light count.");
                if (totalGameObjects > 10000) recs.Add($"Scene has {totalGameObjects} GameObjects. Consider using object pooling or LOD groups.");
                if (GC.CollectionCount(0) > 100) recs.Add("High GC collection count. Reduce per-frame allocations.");

                for (int i = 0; i < recs.Count; i++)
                {
                    if (i > 0) sb.Append(",");
                    sb.Append($"\"{EscapeJson(recs[i])}\"");
                }
                sb.Append("]");

                sb.Append("}");

                return new ToolResult
                {
                    success = true,
                    message = $"Performance analysis: {fps:F1} FPS, {totalAllocated / (1024f * 1024f):F0} MB allocated, {totalGameObjects} objects, {totalRenderers} renderers",
                    data = sb.ToString()
                };
            }
            catch (Exception ex)
            {
                return Fail($"Performance analysis failed: {ex.Message}");
            }
        }

        // --- Helpers ---

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
