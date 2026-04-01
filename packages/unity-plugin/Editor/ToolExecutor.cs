using System;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor
{
    public static class ToolExecutor
    {
        private static readonly Dictionary<string, Func<Dictionary<string, string>, ToolResult>> _handlers =
            new Dictionary<string, Func<Dictionary<string, string>, ToolResult>>();

        private static bool _initialized;

        public static IReadOnlyDictionary<string, Func<Dictionary<string, string>, ToolResult>> Handlers => _handlers;

        public static void Register(string toolName, Func<Dictionary<string, string>, ToolResult> handler)
        {
            _handlers[toolName] = handler;
        }

        public static ToolResult Execute(string method, string paramsJson)
        {
            EnsureInitialized();

            if (!_handlers.TryGetValue(method, out var handler))
            {
                return new ToolResult
                {
                    success = false,
                    message = $"Unknown tool: {method}. Available tools: {string.Join(", ", _handlers.Keys)}"
                };
            }

            Dictionary<string, string> parameters = ParseParams(paramsJson);

            int undoGroup = Undo.GetCurrentGroup();
            Undo.IncrementCurrentGroup();
            Undo.SetCurrentGroupName($"OpenForge: {method}");

            try
            {
                ToolResult result = handler(parameters);
                Undo.CollapseUndoOperations(undoGroup);
                return result;
            }
            catch (Exception ex)
            {
                Undo.CollapseUndoOperations(undoGroup);
                return new ToolResult
                {
                    success = false,
                    message = $"Error executing '{method}': {ex.Message}\n{ex.StackTrace}"
                };
            }
        }

        private static void EnsureInitialized()
        {
            if (_initialized) return;
            _initialized = true;

            OpenForge.Editor.Tools.SceneTools.Register();
            OpenForge.Editor.Tools.GameObjectTools.Register();
            OpenForge.Editor.Tools.MaterialTools.Register();
            OpenForge.Editor.Tools.ScriptTools.Register();
            OpenForge.Editor.Tools.ScreenshotTools.Register();
            OpenForge.Editor.Tools.AnimationTools.Register();
            OpenForge.Editor.Tools.PhysicsTools.Register();
            OpenForge.Editor.Tools.UITools.Register();
            OpenForge.Editor.Tools.LightingTools.Register();
            OpenForge.Editor.Tools.CameraTools.Register();
            OpenForge.Editor.Tools.PrefabTools.Register();
            OpenForge.Editor.Tools.AudioTools.Register();
            OpenForge.Editor.Tools.TerrainTools.Register();
            OpenForge.Editor.Tools.NavMeshTools.Register();
            OpenForge.Editor.Tools.VFXTools.Register();
            OpenForge.Editor.Tools.OptimizationTools.Register();
            OpenForge.Editor.Tools.BuildTools.Register();
            OpenForge.Editor.Tools.PlaytestTools.Register();
            OpenForge.Editor.Tools.InputTools.Register();
            OpenForge.Editor.Tools.TemplateTools.Register();
            OpenForge.Editor.Tools.WeatherTools.Register();
            OpenForge.Editor.Tools.TimelineTools.Register();
            OpenForge.Editor.Tools.MLAgentsTools.Register();
            OpenForge.Editor.Tools.ProBuilderTools.Register();
            OpenForge.Editor.Tools.PackageManagerTools.Register();
            OpenForge.Editor.Tools.ScriptableObjectTools.Register();
            OpenForge.Editor.Tools.ProfilerTools.Register();
            OpenForge.Editor.Tools.GOAPTools.Register();
            OpenForge.Editor.Tools.RuntimeTools.Register();
            OpenForge.Editor.Tools.AdvancedAudioTools.Register();
            OpenForge.Editor.Tools.VRCPerformanceTools.Register();
            OpenForge.Editor.Tools.VRChatSDKTools.Register();
            OpenForge.Editor.Tools.PhysBoneTools.Register();
            OpenForge.Editor.Tools.ModularAvatarTools.Register();
            OpenForge.Editor.Tools.FaceEmoTools.Register();
            OpenForge.Editor.Tools.TextureEditTools.Register();
        }

        private static Dictionary<string, string> ParseParams(string json)
        {
            var result = new Dictionary<string, string>();
            if (string.IsNullOrEmpty(json)) return result;

            json = json.Trim();
            if (!json.StartsWith("{")) return result;

            // Simple JSON object parser for flat key-value pairs.
            // Handles strings, numbers, booleans, and null values.
            int i = 1; // skip opening brace
            while (i < json.Length)
            {
                SkipWhitespace(json, ref i);
                if (i >= json.Length || json[i] == '}') break;

                // Read key
                if (json[i] == ',') { i++; continue; }
                string key = ReadJsonString(json, ref i);
                if (key == null) break;

                SkipWhitespace(json, ref i);
                if (i >= json.Length || json[i] != ':') break;
                i++; // skip colon
                SkipWhitespace(json, ref i);

                // Read value
                string value = ReadJsonValue(json, ref i);
                if (key.Length > 0)
                {
                    result[key] = value;
                }
            }

            return result;
        }

        private static void SkipWhitespace(string json, ref int i)
        {
            while (i < json.Length && char.IsWhiteSpace(json[i])) i++;
        }

        private static string ReadJsonString(string json, ref int i)
        {
            if (i >= json.Length || json[i] != '"') return null;
            i++; // skip opening quote
            var sb = new System.Text.StringBuilder();
            while (i < json.Length && json[i] != '"')
            {
                if (json[i] == '\\' && i + 1 < json.Length)
                {
                    i++;
                    switch (json[i])
                    {
                        case '"': sb.Append('"'); break;
                        case '\\': sb.Append('\\'); break;
                        case 'n': sb.Append('\n'); break;
                        case 'r': sb.Append('\r'); break;
                        case 't': sb.Append('\t'); break;
                        default: sb.Append(json[i]); break;
                    }
                }
                else
                {
                    sb.Append(json[i]);
                }
                i++;
            }
            if (i < json.Length) i++; // skip closing quote
            return sb.ToString();
        }

        private static string ReadJsonValue(string json, ref int i)
        {
            if (i >= json.Length) return "";

            // String value
            if (json[i] == '"')
            {
                return ReadJsonString(json, ref i);
            }

            // Nested object or array - read until matching closing bracket.
            if (json[i] == '{' || json[i] == '[')
            {
                char open = json[i];
                char close = open == '{' ? '}' : ']';
                int depth = 1;
                int start = i;
                i++;
                bool inString = false;
                while (i < json.Length && depth > 0)
                {
                    if (json[i] == '"' && (i == 0 || json[i - 1] != '\\'))
                        inString = !inString;
                    if (!inString)
                    {
                        if (json[i] == open) depth++;
                        else if (json[i] == close) depth--;
                    }
                    i++;
                }
                return json.Substring(start, i - start);
            }

            // Number, boolean, or null
            int valStart = i;
            while (i < json.Length && json[i] != ',' && json[i] != '}' && json[i] != ']' && !char.IsWhiteSpace(json[i]))
            {
                i++;
            }
            return json.Substring(valStart, i - valStart);
        }
    }
}
