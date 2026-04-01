using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class PrefabTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_prefab", CreatePrefab);
            ToolExecutor.Register("instantiate_prefab", InstantiatePrefab);
            ToolExecutor.Register("apply_prefab_overrides", ApplyPrefabOverrides);
            ToolExecutor.Register("revert_prefab", RevertPrefab);
            ToolExecutor.Register("unpack_prefab", UnpackPrefab);
            ToolExecutor.Register("get_prefab_info", GetPrefabInfo);
            ToolExecutor.Register("create_prefab_variant", CreatePrefabVariant);
            ToolExecutor.Register("save_prefab", SavePrefab);
        }

        private static ToolResult CreatePrefab(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string path = GetParam(p, "path", "");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            if (string.IsNullOrEmpty(path))
                path = $"Assets/Prefabs/{go.name}.prefab";

            if (!path.EndsWith(".prefab"))
                path += ".prefab";

            EnsureDirectoryExists(path);

            GameObject prefab = PrefabUtility.SaveAsPrefabAssetAndConnect(go, path, InteractionMode.UserAction);

            if (prefab == null)
                return Fail("Failed to create prefab");

            return new ToolResult
            {
                success = true,
                message = $"Created prefab '{prefab.name}' at {path}",
                data = $"{{\"name\":\"{EscapeJson(prefab.name)}\",\"path\":\"{EscapeJson(path)}\"}}"
            };
        }

        private static ToolResult InstantiatePrefab(Dictionary<string, string> p)
        {
            string prefabPath = GetRequiredParam(p, "path");

            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
            if (prefab == null)
            {
                string[] guids = AssetDatabase.FindAssets($"t:Prefab {prefabPath}");
                if (guids.Length > 0)
                {
                    string assetPath = AssetDatabase.GUIDToAssetPath(guids[0]);
                    prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
                }
            }

            if (prefab == null)
                return Fail($"Prefab not found: {prefabPath}");

            GameObject instance = (GameObject)PrefabUtility.InstantiatePrefab(prefab);

            string newName = GetParam(p, "name", "");
            if (!string.IsNullOrEmpty(newName))
                instance.name = newName;

            string posStr = GetParam(p, "position", "");
            if (!string.IsNullOrEmpty(posStr) && TryParseVector3(posStr, out Vector3 pos))
                instance.transform.position = pos;

            string rotStr = GetParam(p, "rotation", "");
            if (!string.IsNullOrEmpty(rotStr) && TryParseVector3(rotStr, out Vector3 rot))
                instance.transform.eulerAngles = rot;

            string scaleStr = GetParam(p, "scale", "");
            if (!string.IsNullOrEmpty(scaleStr) && TryParseVector3(scaleStr, out Vector3 scale))
                instance.transform.localScale = scale;

            string parentName = GetParam(p, "parent", "");
            if (!string.IsNullOrEmpty(parentName))
            {
                GameObject parent = FindByNameOrId(parentName);
                if (parent != null)
                    instance.transform.SetParent(parent.transform, true);
            }

            Undo.RegisterCreatedObjectUndo(instance, $"Instantiate {prefab.name}");

            return new ToolResult
            {
                success = true,
                message = $"Instantiated prefab '{prefab.name}' as '{instance.name}'",
                data = $"{{\"name\":\"{EscapeJson(instance.name)}\",\"instanceId\":{instance.GetInstanceID()},\"prefab\":\"{EscapeJson(prefabPath)}\"}}"
            };
        }

        private static ToolResult ApplyPrefabOverrides(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            if (!PrefabUtility.IsPartOfPrefabInstance(go))
                return Fail($"'{targetName}' is not a prefab instance");

            GameObject root = PrefabUtility.GetOutermostPrefabInstanceRoot(go);
            string prefabPath = PrefabUtility.GetPrefabAssetPathOfNearestInstanceRoot(root);

            PrefabUtility.ApplyPrefabInstance(root, InteractionMode.UserAction);

            return new ToolResult
            {
                success = true,
                message = $"Applied overrides from '{root.name}' to prefab at '{prefabPath}'",
                data = $"{{\"target\":\"{EscapeJson(root.name)}\",\"prefabPath\":\"{EscapeJson(prefabPath)}\"}}"
            };
        }

        private static ToolResult RevertPrefab(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            if (!PrefabUtility.IsPartOfPrefabInstance(go))
                return Fail($"'{targetName}' is not a prefab instance");

            GameObject root = PrefabUtility.GetOutermostPrefabInstanceRoot(go);

            PrefabUtility.RevertPrefabInstance(root, InteractionMode.UserAction);

            return new ToolResult
            {
                success = true,
                message = $"Reverted prefab instance '{root.name}'"
            };
        }

        private static ToolResult UnpackPrefab(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string mode = GetParam(p, "mode", "root");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            if (!PrefabUtility.IsPartOfPrefabInstance(go))
                return Fail($"'{targetName}' is not a prefab instance");

            GameObject root = PrefabUtility.GetOutermostPrefabInstanceRoot(go);

            PrefabUnpackMode unpackMode = mode.ToLower() == "completely"
                ? PrefabUnpackMode.Completely
                : PrefabUnpackMode.OutermostRoot;

            PrefabUtility.UnpackPrefabInstance(root, unpackMode, InteractionMode.UserAction);

            return new ToolResult
            {
                success = true,
                message = $"Unpacked prefab instance '{root.name}' ({unpackMode})"
            };
        }

        private static ToolResult GetPrefabInfo(Dictionary<string, string> p)
        {
            string targetName = GetParam(p, "target", "");
            string path = GetParam(p, "path", "");

            StringBuilder sb = new StringBuilder();
            sb.Append("{");

            if (!string.IsNullOrEmpty(targetName))
            {
                GameObject go = FindByNameOrId(targetName);
                if (go == null)
                    return Fail($"GameObject not found: {targetName}");

                bool isPrefabInstance = PrefabUtility.IsPartOfPrefabInstance(go);
                bool isPrefabAsset = PrefabUtility.IsPartOfPrefabAsset(go);
                PrefabAssetType assetType = PrefabUtility.GetPrefabAssetType(go);
                PrefabInstanceStatus instanceStatus = PrefabUtility.GetPrefabInstanceStatus(go);

                sb.Append($"\"gameObject\":\"{EscapeJson(go.name)}\",");
                sb.Append($"\"isPrefabInstance\":{(isPrefabInstance ? "true" : "false")},");
                sb.Append($"\"isPrefabAsset\":{(isPrefabAsset ? "true" : "false")},");
                sb.Append($"\"assetType\":\"{assetType}\",");
                sb.Append($"\"instanceStatus\":\"{instanceStatus}\",");

                if (isPrefabInstance)
                {
                    string prefabPath = PrefabUtility.GetPrefabAssetPathOfNearestInstanceRoot(go);
                    sb.Append($"\"prefabPath\":\"{EscapeJson(prefabPath)}\",");

                    PropertyModification[] mods = PrefabUtility.GetPropertyModifications(go);
                    sb.Append($"\"overrideCount\":{(mods != null ? mods.Length : 0)},");
                }

                sb.Append($"\"hasOverrides\":{(isPrefabInstance && PrefabUtility.HasPrefabInstanceAnyOverrides(go, false) ? "true" : "false")}");
            }
            else if (!string.IsNullOrEmpty(path))
            {
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                if (prefab == null)
                    return Fail($"Prefab not found at: {path}");

                sb.Append($"\"name\":\"{EscapeJson(prefab.name)}\",");
                sb.Append($"\"path\":\"{EscapeJson(path)}\",");

                int childCount = prefab.transform.childCount;
                Component[] components = prefab.GetComponents<Component>();
                sb.Append($"\"childCount\":{childCount},");
                sb.Append("\"components\":[");
                for (int i = 0; i < components.Length; i++)
                {
                    if (components[i] == null) continue;
                    if (i > 0) sb.Append(",");
                    sb.Append($"\"{EscapeJson(components[i].GetType().Name)}\"");
                }
                sb.Append("]");
            }
            else
            {
                return Fail("Specify either 'target' (scene object) or 'path' (prefab asset).");
            }

            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = "Prefab info retrieved",
                data = sb.ToString()
            };
        }

        private static ToolResult CreatePrefabVariant(Dictionary<string, string> p)
        {
            string basePrefabPath = GetRequiredParam(p, "base_prefab");
            string variantPath = GetRequiredParam(p, "path");

            GameObject basePrefab = AssetDatabase.LoadAssetAtPath<GameObject>(basePrefabPath);
            if (basePrefab == null)
                return Fail($"Base prefab not found at: {basePrefabPath}");

            if (!variantPath.EndsWith(".prefab"))
                variantPath += ".prefab";

            EnsureDirectoryExists(variantPath);

            GameObject instance = (GameObject)PrefabUtility.InstantiatePrefab(basePrefab);
            GameObject variant = PrefabUtility.SaveAsPrefabAsset(instance, variantPath);
            UnityEngine.Object.DestroyImmediate(instance);

            if (variant == null)
                return Fail("Failed to create prefab variant");

            return new ToolResult
            {
                success = true,
                message = $"Created prefab variant at '{variantPath}' from '{basePrefabPath}'",
                data = $"{{\"path\":\"{EscapeJson(variantPath)}\",\"basePrefab\":\"{EscapeJson(basePrefabPath)}\"}}"
            };
        }

        private static ToolResult SavePrefab(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            string path = GetParam(p, "path", "");

            if (PrefabUtility.IsPartOfPrefabInstance(go))
            {
                PrefabUtility.ApplyPrefabInstance(PrefabUtility.GetOutermostPrefabInstanceRoot(go), InteractionMode.UserAction);
                string prefabPath = PrefabUtility.GetPrefabAssetPathOfNearestInstanceRoot(go);
                return new ToolResult
                {
                    success = true,
                    message = $"Saved prefab overrides for '{go.name}' to '{prefabPath}'",
                    data = $"{{\"path\":\"{EscapeJson(prefabPath)}\"}}"
                };
            }

            if (string.IsNullOrEmpty(path))
                path = $"Assets/Prefabs/{go.name}.prefab";

            if (!path.EndsWith(".prefab"))
                path += ".prefab";

            EnsureDirectoryExists(path);

            GameObject prefab = PrefabUtility.SaveAsPrefabAssetAndConnect(go, path, InteractionMode.UserAction);

            return new ToolResult
            {
                success = true,
                message = $"Saved '{go.name}' as prefab at '{path}'",
                data = $"{{\"name\":\"{EscapeJson(go.name)}\",\"path\":\"{EscapeJson(path)}\"}}"
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

        private static void EnsureDirectoryExists(string assetPath)
        {
            string dir = System.IO.Path.GetDirectoryName(assetPath);
            if (!string.IsNullOrEmpty(dir) && !System.IO.Directory.Exists(dir))
            {
                System.IO.Directory.CreateDirectory(dir);
                AssetDatabase.Refresh();
            }
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
