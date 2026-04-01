using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace OpenForge.Editor.Tools
{
    public static class SceneTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_scene", CreateScene);
            ToolExecutor.Register("load_scene", LoadScene);
            ToolExecutor.Register("save_scene", SaveScene);
            ToolExecutor.Register("get_scene_info", GetSceneInfo);
            ToolExecutor.Register("get_hierarchy", GetHierarchy);
        }

        private static ToolResult CreateScene(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "New Scene");

            NewSceneSetup setup = NewSceneSetup.DefaultGameObjects;
            if (p.TryGetValue("empty", out string emptyStr) && emptyStr == "true")
            {
                setup = NewSceneSetup.EmptyScene;
            }

            Scene scene = EditorSceneManager.NewScene(setup, NewSceneMode.Single);

            if (!string.IsNullOrEmpty(name) && name != "New Scene")
            {
                // Save immediately so the scene gets the desired name.
                string path = $"Assets/{name}.unity";
                EditorSceneManager.SaveScene(scene, path);
            }

            return new ToolResult
            {
                success = true,
                message = $"Created scene '{scene.name}'",
                data = $"{{\"name\":\"{scene.name}\",\"path\":\"{EscapeJson(scene.path)}\"}}"
            };
        }

        private static ToolResult LoadScene(Dictionary<string, string> p)
        {
            string path = GetRequiredParam(p, "path");

            if (!System.IO.File.Exists(path))
            {
                // Try prepending Assets/ if not found.
                if (System.IO.File.Exists($"Assets/{path}"))
                    path = $"Assets/{path}";
                else
                    return Fail($"Scene file not found: {path}");
            }

            OpenSceneMode mode = OpenSceneMode.Single;
            if (p.TryGetValue("mode", out string modeStr))
            {
                if (modeStr.ToLower() == "additive") mode = OpenSceneMode.Additive;
            }

            bool saveModified = true;
            if (p.TryGetValue("save_modified", out string saveStr) && saveStr == "false")
                saveModified = false;

            if (saveModified)
            {
                EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo();
            }

            Scene scene = EditorSceneManager.OpenScene(path, mode);

            return new ToolResult
            {
                success = true,
                message = $"Loaded scene '{scene.name}'",
                data = $"{{\"name\":\"{scene.name}\",\"path\":\"{EscapeJson(scene.path)}\"}}"
            };
        }

        private static ToolResult SaveScene(Dictionary<string, string> p)
        {
            Scene scene = SceneManager.GetActiveScene();

            string path = null;
            p.TryGetValue("path", out path);

            if (string.IsNullOrEmpty(path))
                path = scene.path;

            if (string.IsNullOrEmpty(path))
            {
                path = $"Assets/{scene.name}.unity";
            }

            bool result = EditorSceneManager.SaveScene(scene, path);

            if (!result)
                return Fail("Failed to save scene");

            return new ToolResult
            {
                success = true,
                message = $"Saved scene to '{path}'",
                data = $"{{\"path\":\"{EscapeJson(path)}\"}}"
            };
        }

        private static ToolResult GetSceneInfo(Dictionary<string, string> p)
        {
            Scene scene = SceneManager.GetActiveScene();
            GameObject[] roots = scene.GetRootGameObjects();

            int totalObjects = 0;
            foreach (GameObject root in roots)
            {
                totalObjects += CountGameObjects(root.transform);
            }

            string data = $"{{\"name\":\"{EscapeJson(scene.name)}\","
                + $"\"path\":\"{EscapeJson(scene.path)}\","
                + $"\"isDirty\":{(scene.isDirty ? "true" : "false")},"
                + $"\"isLoaded\":{(scene.isLoaded ? "true" : "false")},"
                + $"\"rootCount\":{roots.Length},"
                + $"\"totalObjectCount\":{totalObjects},"
                + $"\"buildIndex\":{scene.buildIndex}}}";

            return new ToolResult
            {
                success = true,
                message = $"Scene: {scene.name} ({totalObjects} objects)",
                data = data
            };
        }

        private static ToolResult GetHierarchy(Dictionary<string, string> p)
        {
            Scene scene = SceneManager.GetActiveScene();
            GameObject[] roots = scene.GetRootGameObjects();

            int maxDepth = 10;
            if (p.TryGetValue("max_depth", out string depthStr) && int.TryParse(depthStr, out int d))
            {
                maxDepth = d;
            }

            StringBuilder sb = new StringBuilder();
            sb.Append("[");
            for (int i = 0; i < roots.Length; i++)
            {
                if (i > 0) sb.Append(",");
                BuildHierarchyJson(roots[i].transform, sb, 0, maxDepth);
            }
            sb.Append("]");

            return new ToolResult
            {
                success = true,
                message = $"Hierarchy: {roots.Length} root objects",
                data = sb.ToString()
            };
        }

        private static void BuildHierarchyJson(Transform t, StringBuilder sb, int depth, int maxDepth)
        {
            GameObject go = t.gameObject;
            sb.Append("{");
            sb.Append($"\"name\":\"{EscapeJson(go.name)}\",");
            sb.Append($"\"instanceId\":{go.GetInstanceID()},");
            sb.Append($"\"active\":{(go.activeSelf ? "true" : "false")},");
            sb.Append($"\"tag\":\"{EscapeJson(go.tag)}\",");
            sb.Append($"\"layer\":{go.layer},");

            // Components
            Component[] components = go.GetComponents<Component>();
            sb.Append("\"components\":[");
            bool first = true;
            foreach (Component c in components)
            {
                if (c == null) continue;
                if (!first) sb.Append(",");
                sb.Append($"\"{EscapeJson(c.GetType().Name)}\"");
                first = false;
            }
            sb.Append("],");

            // Children
            sb.Append("\"children\":[");
            if (depth < maxDepth)
            {
                for (int i = 0; i < t.childCount; i++)
                {
                    if (i > 0) sb.Append(",");
                    BuildHierarchyJson(t.GetChild(i), sb, depth + 1, maxDepth);
                }
            }
            sb.Append("]");

            sb.Append("}");
        }

        private static int CountGameObjects(Transform t)
        {
            int count = 1;
            for (int i = 0; i < t.childCount; i++)
            {
                count += CountGameObjects(t.GetChild(i));
            }
            return count;
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
