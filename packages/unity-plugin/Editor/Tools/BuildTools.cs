using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class BuildTools
    {
        public static void Register()
        {
            ToolExecutor.Register("set_build_platform", SetBuildPlatform);
            ToolExecutor.Register("build_project", BuildProject);
            ToolExecutor.Register("set_player_settings", SetPlayerSettings);
            ToolExecutor.Register("add_scene_to_build", AddSceneToBuild);
            ToolExecutor.Register("get_build_settings", GetBuildSettings);
            ToolExecutor.Register("set_scripting_backend", SetScriptingBackend);
        }

        private static ToolResult SetBuildPlatform(Dictionary<string, string> p)
        {
            string platform = GetRequiredParam(p, "platform");

            BuildTargetGroup targetGroup;
            BuildTarget target;

            switch (platform.ToLower())
            {
                case "windows": case "win": case "pc":
                    targetGroup = BuildTargetGroup.Standalone;
                    target = BuildTarget.StandaloneWindows64;
                    break;
                case "mac": case "macos": case "osx":
                    targetGroup = BuildTargetGroup.Standalone;
                    target = BuildTarget.StandaloneOSX;
                    break;
                case "linux":
                    targetGroup = BuildTargetGroup.Standalone;
                    target = BuildTarget.StandaloneLinux64;
                    break;
                case "android":
                    targetGroup = BuildTargetGroup.Android;
                    target = BuildTarget.Android;
                    break;
                case "ios":
                    targetGroup = BuildTargetGroup.iOS;
                    target = BuildTarget.iOS;
                    break;
                case "webgl":
                    targetGroup = BuildTargetGroup.WebGL;
                    target = BuildTarget.WebGL;
                    break;
                default:
                    return Fail($"Unknown platform: {platform}. Valid: windows, mac, linux, android, ios, webgl");
            }

            bool success = EditorUserBuildSettings.SwitchActiveBuildTarget(targetGroup, target);

            if (!success)
                return Fail($"Failed to switch to {platform}. The platform module may not be installed.");

            return new ToolResult
            {
                success = true,
                message = $"Switched build platform to {platform} ({target})",
                data = $"{{\"platform\":\"{platform}\",\"target\":\"{target}\",\"targetGroup\":\"{targetGroup}\"}}"
            };
        }

        private static ToolResult BuildProject(Dictionary<string, string> p)
        {
            string outputPath = GetRequiredParam(p, "output_path");
            string buildOptions = GetParam(p, "options", "none");

            BuildOptions options = BuildOptions.None;
            if (!string.IsNullOrEmpty(buildOptions) && buildOptions != "none")
            {
                string[] optParts = buildOptions.Split(',');
                foreach (string opt in optParts)
                {
                    switch (opt.Trim().ToLower())
                    {
                        case "development": options |= BuildOptions.Development; break;
                        case "autorun": options |= BuildOptions.AutoRunPlayer; break;
                        case "allowdebugging": options |= BuildOptions.AllowDebugging; break;
                        case "compresswithlz4": options |= BuildOptions.CompressWithLz4; break;
                        case "compresswithlz4hc": options |= BuildOptions.CompressWithLz4HC; break;
                        case "strictmode": options |= BuildOptions.StrictMode; break;
                    }
                }
            }

            EditorBuildSettingsScene[] scenes = EditorBuildSettings.scenes;
            string[] scenePaths = scenes.Where(s => s.enabled).Select(s => s.path).ToArray();

            if (scenePaths.Length == 0)
                return Fail("No scenes in build settings. Use add_scene_to_build first.");

            BuildReport report = BuildPipeline.BuildPlayer(scenePaths, outputPath, EditorUserBuildSettings.activeBuildTarget, options);

            if (report.summary.result == BuildResult.Succeeded)
            {
                return new ToolResult
                {
                    success = true,
                    message = $"Build succeeded! Output: {outputPath} (size: {report.summary.totalSize} bytes, time: {report.summary.totalTime.TotalSeconds:F1}s)",
                    data = $"{{\"result\":\"succeeded\",\"outputPath\":\"{EscapeJson(outputPath)}\",\"totalSize\":{report.summary.totalSize},\"totalTime\":{report.summary.totalTime.TotalSeconds:F1},\"errors\":{report.summary.totalErrors},\"warnings\":{report.summary.totalWarnings}}}"
                };
            }
            else
            {
                return Fail($"Build failed: {report.summary.result} ({report.summary.totalErrors} error(s))");
            }
        }

        private static ToolResult SetPlayerSettings(Dictionary<string, string> p)
        {
            string companyName = GetParam(p, "company_name", "");
            if (!string.IsNullOrEmpty(companyName))
                PlayerSettings.companyName = companyName;

            string productName = GetParam(p, "product_name", "");
            if (!string.IsNullOrEmpty(productName))
                PlayerSettings.productName = productName;

            string version = GetParam(p, "version", "");
            if (!string.IsNullOrEmpty(version))
                PlayerSettings.bundleVersion = version;

            string bundleId = GetParam(p, "bundle_identifier", "");
            if (!string.IsNullOrEmpty(bundleId))
                PlayerSettings.SetApplicationIdentifier(EditorUserBuildSettings.selectedBuildTargetGroup, bundleId);

            string defaultScreenWidth = GetParam(p, "screen_width", "");
            if (!string.IsNullOrEmpty(defaultScreenWidth))
                PlayerSettings.defaultScreenWidth = int.Parse(defaultScreenWidth);

            string defaultScreenHeight = GetParam(p, "screen_height", "");
            if (!string.IsNullOrEmpty(defaultScreenHeight))
                PlayerSettings.defaultScreenHeight = int.Parse(defaultScreenHeight);

            string fullscreen = GetParam(p, "fullscreen", "");
            if (!string.IsNullOrEmpty(fullscreen))
                PlayerSettings.fullScreenMode = fullscreen == "true" ? FullScreenMode.ExclusiveFullScreen : FullScreenMode.Windowed;

            string runInBackground = GetParam(p, "run_in_background", "");
            if (!string.IsNullOrEmpty(runInBackground))
                PlayerSettings.runInBackground = runInBackground == "true";

            string iconPath = GetParam(p, "icon", "");
            if (!string.IsNullOrEmpty(iconPath))
            {
                Texture2D icon = AssetDatabase.LoadAssetAtPath<Texture2D>(iconPath);
                if (icon != null)
                {
                    int[] iconSizes = PlayerSettings.GetIconSizesForTargetGroup(BuildTargetGroup.Unknown);
                    Texture2D[] icons = new Texture2D[iconSizes.Length];
                    for (int i = 0; i < icons.Length; i++) icons[i] = icon;
                    PlayerSettings.SetIconsForTargetGroup(BuildTargetGroup.Unknown, icons);
                }
            }

            return new ToolResult
            {
                success = true,
                message = $"Updated player settings (product: {PlayerSettings.productName}, version: {PlayerSettings.bundleVersion})"
            };
        }

        private static ToolResult AddSceneToBuild(Dictionary<string, string> p)
        {
            string scenePath = GetRequiredParam(p, "path");

            if (!scenePath.EndsWith(".unity"))
                scenePath += ".unity";

            if (!System.IO.File.Exists(scenePath))
            {
                if (System.IO.File.Exists($"Assets/{scenePath}"))
                    scenePath = $"Assets/{scenePath}";
                else
                    return Fail($"Scene file not found: {scenePath}");
            }

            List<EditorBuildSettingsScene> scenes = new List<EditorBuildSettingsScene>(EditorBuildSettings.scenes);

            bool exists = scenes.Any(s => s.path == scenePath);
            if (exists)
            {
                foreach (var s in scenes)
                {
                    if (s.path == scenePath) s.enabled = true;
                }
                EditorBuildSettings.scenes = scenes.ToArray();
                return new ToolResult
                {
                    success = true,
                    message = $"Scene '{scenePath}' is already in build settings (enabled)"
                };
            }

            scenes.Add(new EditorBuildSettingsScene(scenePath, true));
            EditorBuildSettings.scenes = scenes.ToArray();

            return new ToolResult
            {
                success = true,
                message = $"Added '{scenePath}' to build settings (index: {scenes.Count - 1})",
                data = $"{{\"path\":\"{EscapeJson(scenePath)}\",\"index\":{scenes.Count - 1}}}"
            };
        }

        private static ToolResult GetBuildSettings(Dictionary<string, string> p)
        {
            BuildTarget target = EditorUserBuildSettings.activeBuildTarget;
            BuildTargetGroup targetGroup = EditorUserBuildSettings.selectedBuildTargetGroup;

            EditorBuildSettingsScene[] scenes = EditorBuildSettings.scenes;

            StringBuilder sb = new StringBuilder();
            sb.Append("{");
            sb.Append($"\"activeBuildTarget\":\"{target}\",");
            sb.Append($"\"buildTargetGroup\":\"{targetGroup}\",");
            sb.Append($"\"productName\":\"{EscapeJson(PlayerSettings.productName)}\",");
            sb.Append($"\"companyName\":\"{EscapeJson(PlayerSettings.companyName)}\",");
            sb.Append($"\"version\":\"{EscapeJson(PlayerSettings.bundleVersion)}\",");
            sb.Append($"\"scriptingBackend\":\"{PlayerSettings.GetScriptingBackend(targetGroup)}\",");
            sb.Append("\"scenes\":[");
            for (int i = 0; i < scenes.Length; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append($"{{\"path\":\"{EscapeJson(scenes[i].path)}\",\"enabled\":{(scenes[i].enabled ? "true" : "false")},\"index\":{i}}}");
            }
            sb.Append("]");
            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Build settings: {target} ({targetGroup}), {scenes.Length} scene(s)",
                data = sb.ToString()
            };
        }

        private static ToolResult SetScriptingBackend(Dictionary<string, string> p)
        {
            string backend = GetRequiredParam(p, "backend");

            ScriptingImplementation implementation;
            switch (backend.ToLower())
            {
                case "mono": case "mono2x":
                    implementation = ScriptingImplementation.Mono2x;
                    break;
                case "il2cpp":
                    implementation = ScriptingImplementation.IL2CPP;
                    break;
                default:
                    return Fail($"Unknown scripting backend: {backend}. Valid: mono, il2cpp");
            }

            BuildTargetGroup targetGroup = EditorUserBuildSettings.selectedBuildTargetGroup;
            PlayerSettings.SetScriptingBackend(targetGroup, implementation);

            string apiCompatibility = GetParam(p, "api_compatibility", "");
            if (!string.IsNullOrEmpty(apiCompatibility))
            {
                switch (apiCompatibility.ToLower())
                {
                    case "net_standard_2_0": case "netstandard2.0":
                        PlayerSettings.SetApiCompatibilityLevel(targetGroup, ApiCompatibilityLevel.NET_Standard_2_0);
                        break;
                    case "net_4_6": case "net4.6": case "net_framework":
                        PlayerSettings.SetApiCompatibilityLevel(targetGroup, ApiCompatibilityLevel.NET_Unity_4_8);
                        break;
                }
            }

            return new ToolResult
            {
                success = true,
                message = $"Set scripting backend to {implementation} for {targetGroup}"
            };
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
