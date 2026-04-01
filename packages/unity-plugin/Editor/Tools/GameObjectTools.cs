using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class GameObjectTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_gameobject", CreateGameObject);
            ToolExecutor.Register("find_gameobject", FindGameObject);
            ToolExecutor.Register("destroy_gameobject", DestroyGameObject);
            ToolExecutor.Register("set_transform", SetTransform);
            ToolExecutor.Register("set_active", SetActive);
            ToolExecutor.Register("add_component", AddComponent);
            ToolExecutor.Register("remove_component", RemoveComponent);
            ToolExecutor.Register("get_components", GetComponents);
            ToolExecutor.Register("set_parent", SetParent);
            ToolExecutor.Register("duplicate", Duplicate);
        }

        private static ToolResult CreateGameObject(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "New GameObject");
            string primitiveType = GetParam(p, "primitive", "");

            GameObject go;

            if (!string.IsNullOrEmpty(primitiveType))
            {
                if (Enum.TryParse(primitiveType, true, out PrimitiveType pType))
                {
                    go = GameObject.CreatePrimitive(pType);
                    go.name = name;
                }
                else
                {
                    return Fail($"Unknown primitive type: {primitiveType}. Valid: Sphere, Capsule, Cylinder, Cube, Plane, Quad");
                }
            }
            else
            {
                go = new GameObject(name);
            }

            Undo.RegisterCreatedObjectUndo(go, $"Create {name}");

            // Apply optional transform.
            ApplyTransformParams(go.transform, p);

            // Set parent if specified.
            if (p.TryGetValue("parent", out string parentName) && !string.IsNullOrEmpty(parentName))
            {
                GameObject parent = FindByNameOrId(parentName);
                if (parent != null)
                {
                    Undo.SetTransformParent(go.transform, parent.transform, $"Set parent of {name}");
                }
            }

            return new ToolResult
            {
                success = true,
                message = $"Created GameObject '{go.name}'",
                data = GameObjectToJson(go)
            };
        }

        private static ToolResult FindGameObject(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "");
            string tag = GetParam(p, "tag", "");
            string layer = GetParam(p, "layer", "");
            string component = GetParam(p, "component", "");

            List<GameObject> results = new List<GameObject>();

            if (!string.IsNullOrEmpty(name))
            {
                // Find by name - search all objects including inactive.
                GameObject[] allObjects = Resources.FindObjectsOfTypeAll<GameObject>();
                foreach (GameObject go in allObjects)
                {
                    if (go.hideFlags != HideFlags.None) continue;
                    if (go.scene.isLoaded && go.name.IndexOf(name, StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        results.Add(go);
                    }
                }
            }
            else if (!string.IsNullOrEmpty(tag))
            {
                try
                {
                    GameObject[] tagged = GameObject.FindGameObjectsWithTag(tag);
                    results.AddRange(tagged);
                }
                catch (UnityException)
                {
                    return Fail($"Tag '{tag}' is not defined");
                }
            }
            else if (!string.IsNullOrEmpty(component))
            {
                Type t = FindType(component);
                if (t == null)
                    return Fail($"Component type not found: {component}");

                UnityEngine.Object[] found = UnityEngine.Object.FindObjectsOfType(t);
                foreach (UnityEngine.Object obj in found)
                {
                    Component c = obj as Component;
                    if (c != null && !results.Contains(c.gameObject))
                        results.Add(c.gameObject);
                }
            }
            else
            {
                return Fail("Specify at least one of: name, tag, component");
            }

            // Filter by layer if specified.
            if (!string.IsNullOrEmpty(layer) && int.TryParse(layer, out int layerIndex))
            {
                results.RemoveAll(go => go.layer != layerIndex);
            }

            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < results.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append(GameObjectToJson(results[i]));
            }
            sb.Append("]");

            return new ToolResult
            {
                success = true,
                message = $"Found {results.Count} object(s)",
                data = sb.ToString()
            };
        }

        private static ToolResult DestroyGameObject(Dictionary<string, string> p)
        {
            string name = GetRequiredParam(p, "name");
            GameObject go = FindByNameOrId(name);
            if (go == null)
                return Fail($"GameObject not found: {name}");

            Undo.DestroyObjectImmediate(go);

            return new ToolResult
            {
                success = true,
                message = $"Destroyed GameObject '{name}'"
            };
        }

        private static ToolResult SetTransform(Dictionary<string, string> p)
        {
            string name = GetRequiredParam(p, "name");
            GameObject go = FindByNameOrId(name);
            if (go == null)
                return Fail($"GameObject not found: {name}");

            Undo.RecordObject(go.transform, $"Set transform of {name}");

            bool world = GetParam(p, "space", "local").ToLower() == "world";

            ApplyTransformParams(go.transform, p, world);

            return new ToolResult
            {
                success = true,
                message = $"Updated transform of '{go.name}'",
                data = TransformToJson(go.transform)
            };
        }

        private static ToolResult SetActive(Dictionary<string, string> p)
        {
            string name = GetRequiredParam(p, "name");
            GameObject go = FindByNameOrId(name);
            if (go == null)
                return Fail($"GameObject not found: {name}");

            bool active = GetParam(p, "active", "true") != "false";

            Undo.RecordObject(go, $"Set active {name}");
            go.SetActive(active);

            return new ToolResult
            {
                success = true,
                message = $"Set '{go.name}' active = {active}"
            };
        }

        private static ToolResult AddComponent(Dictionary<string, string> p)
        {
            string name = GetRequiredParam(p, "name");
            string typeName = GetRequiredParam(p, "component");

            GameObject go = FindByNameOrId(name);
            if (go == null)
                return Fail($"GameObject not found: {name}");

            Type type = FindType(typeName);
            if (type == null)
                return Fail($"Component type not found: {typeName}. Try the fully qualified name (e.g. UnityEngine.Rigidbody).");

            Component comp = Undo.AddComponent(go, type);
            if (comp == null)
                return Fail($"Failed to add component '{typeName}' to '{name}'");

            return new ToolResult
            {
                success = true,
                message = $"Added {type.Name} to '{go.name}'",
                data = $"{{\"component\":\"{EscapeJson(type.Name)}\",\"gameObject\":\"{EscapeJson(go.name)}\"}}"
            };
        }

        private static ToolResult RemoveComponent(Dictionary<string, string> p)
        {
            string name = GetRequiredParam(p, "name");
            string typeName = GetRequiredParam(p, "component");

            GameObject go = FindByNameOrId(name);
            if (go == null)
                return Fail($"GameObject not found: {name}");

            Type type = FindType(typeName);
            if (type == null)
                return Fail($"Component type not found: {typeName}");

            Component comp = go.GetComponent(type);
            if (comp == null)
                return Fail($"Component '{typeName}' not found on '{name}'");

            if (comp is Transform)
                return Fail("Cannot remove Transform component");

            Undo.DestroyObjectImmediate(comp);

            return new ToolResult
            {
                success = true,
                message = $"Removed {type.Name} from '{go.name}'"
            };
        }

        private static ToolResult GetComponents(Dictionary<string, string> p)
        {
            string name = GetRequiredParam(p, "name");
            GameObject go = FindByNameOrId(name);
            if (go == null)
                return Fail($"GameObject not found: {name}");

            Component[] components = go.GetComponents<Component>();
            StringBuilder sb = new StringBuilder("[");
            bool first = true;
            foreach (Component c in components)
            {
                if (c == null) continue;
                if (!first) sb.Append(",");
                first = false;

                sb.Append("{");
                sb.Append($"\"type\":\"{EscapeJson(c.GetType().Name)}\",");
                sb.Append($"\"fullType\":\"{EscapeJson(c.GetType().FullName)}\",");
                sb.Append("\"properties\":{");

                // Serialize editable properties via SerializedObject.
                SerializedObject so = new SerializedObject(c);
                SerializedProperty prop = so.GetIterator();
                bool firstProp = true;
                if (prop.NextVisible(true))
                {
                    do
                    {
                        if (!firstProp) sb.Append(",");
                        firstProp = false;
                        sb.Append($"\"{EscapeJson(prop.name)}\":\"{EscapeJson(SerializedPropertyToString(prop))}\"");
                    }
                    while (prop.NextVisible(false));
                }
                so.Dispose();

                sb.Append("}}");
            }
            sb.Append("]");

            return new ToolResult
            {
                success = true,
                message = $"'{go.name}' has {components.Length} component(s)",
                data = sb.ToString()
            };
        }

        private static ToolResult SetParent(Dictionary<string, string> p)
        {
            string childName = GetRequiredParam(p, "name");
            string parentName = GetParam(p, "parent", "");

            GameObject child = FindByNameOrId(childName);
            if (child == null)
                return Fail($"Child GameObject not found: {childName}");

            bool worldPositionStays = GetParam(p, "world_position_stays", "true") != "false";

            if (string.IsNullOrEmpty(parentName))
            {
                Undo.SetTransformParent(child.transform, null, $"Unparent {childName}");
                return new ToolResult
                {
                    success = true,
                    message = $"Unparented '{child.name}'"
                };
            }

            GameObject parent = FindByNameOrId(parentName);
            if (parent == null)
                return Fail($"Parent GameObject not found: {parentName}");

            Undo.SetTransformParent(child.transform, parent.transform, $"Set parent of {childName}");
            if (!worldPositionStays)
            {
                child.transform.localPosition = Vector3.zero;
                child.transform.localRotation = Quaternion.identity;
                child.transform.localScale = Vector3.one;
            }

            return new ToolResult
            {
                success = true,
                message = $"Set parent of '{child.name}' to '{parent.name}'"
            };
        }

        private static ToolResult Duplicate(Dictionary<string, string> p)
        {
            string name = GetRequiredParam(p, "name");
            GameObject go = FindByNameOrId(name);
            if (go == null)
                return Fail($"GameObject not found: {name}");

            GameObject clone = UnityEngine.Object.Instantiate(go, go.transform.parent);
            clone.name = GetParam(p, "new_name", go.name + " (Copy)");
            Undo.RegisterCreatedObjectUndo(clone, $"Duplicate {name}");

            return new ToolResult
            {
                success = true,
                message = $"Duplicated '{name}' as '{clone.name}'",
                data = GameObjectToJson(clone)
            };
        }

        // --- Helpers ---

        private static GameObject FindByNameOrId(string nameOrId)
        {
            // Try instance ID first.
            if (int.TryParse(nameOrId, out int id))
            {
                UnityEngine.Object obj = EditorUtility.InstanceIDToObject(id);
                if (obj is GameObject go) return go;
            }

            // Then try exact name via Find (active objects).
            GameObject found = GameObject.Find(nameOrId);
            if (found != null) return found;

            // Search all including inactive.
            GameObject[] allObjects = Resources.FindObjectsOfTypeAll<GameObject>();
            foreach (GameObject go in allObjects)
            {
                if (go.hideFlags != HideFlags.None) continue;
                if (go.scene.isLoaded && go.name == nameOrId)
                    return go;
            }

            return null;
        }

        private static void ApplyTransformParams(Transform t, Dictionary<string, string> p, bool world = false)
        {
            if (TryParseVector3(p, "position", out Vector3 pos))
            {
                if (world) t.position = pos;
                else t.localPosition = pos;
            }

            if (TryParseVector3(p, "rotation", out Vector3 rot))
            {
                if (world) t.eulerAngles = rot;
                else t.localEulerAngles = rot;
            }

            if (TryParseVector3(p, "scale", out Vector3 scale))
            {
                t.localScale = scale;
            }
        }

        private static bool TryParseVector3(Dictionary<string, string> p, string key, out Vector3 v)
        {
            v = Vector3.zero;

            // Try "position" as JSON array or "position_x", "position_y", "position_z".
            if (p.TryGetValue(key, out string raw) && !string.IsNullOrEmpty(raw))
            {
                raw = raw.Trim();
                // Parse [x, y, z] format.
                if (raw.StartsWith("["))
                {
                    raw = raw.Trim('[', ']');
                    string[] parts = raw.Split(',');
                    if (parts.Length >= 3
                        && float.TryParse(parts[0].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float x)
                        && float.TryParse(parts[1].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float y)
                        && float.TryParse(parts[2].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float z))
                    {
                        v = new Vector3(x, y, z);
                        return true;
                    }
                }

                // Parse "x,y,z" format.
                string[] csv = raw.Split(',');
                if (csv.Length >= 3
                    && float.TryParse(csv[0].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float cx)
                    && float.TryParse(csv[1].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float cy)
                    && float.TryParse(csv[2].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float cz))
                {
                    v = new Vector3(cx, cy, cz);
                    return true;
                }
            }

            // Try individual components.
            bool hasAny = false;
            if (p.TryGetValue($"{key}_x", out string xs) && float.TryParse(xs, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float vx))
            { v.x = vx; hasAny = true; }
            if (p.TryGetValue($"{key}_y", out string ys) && float.TryParse(ys, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float vy))
            { v.y = vy; hasAny = true; }
            if (p.TryGetValue($"{key}_z", out string zs) && float.TryParse(zs, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float vz))
            { v.z = vz; hasAny = true; }

            return hasAny;
        }

        private static string GameObjectToJson(GameObject go)
        {
            Transform t = go.transform;
            return $"{{\"name\":\"{EscapeJson(go.name)}\","
                + $"\"instanceId\":{go.GetInstanceID()},"
                + $"\"active\":{(go.activeSelf ? "true" : "false")},"
                + $"\"tag\":\"{EscapeJson(go.tag)}\","
                + $"\"layer\":{go.layer},"
                + $"\"position\":[{t.localPosition.x},{t.localPosition.y},{t.localPosition.z}],"
                + $"\"rotation\":[{t.localEulerAngles.x},{t.localEulerAngles.y},{t.localEulerAngles.z}],"
                + $"\"scale\":[{t.localScale.x},{t.localScale.y},{t.localScale.z}]}}";
        }

        private static string TransformToJson(Transform t)
        {
            return $"{{\"localPosition\":[{t.localPosition.x},{t.localPosition.y},{t.localPosition.z}],"
                + $"\"localRotation\":[{t.localEulerAngles.x},{t.localEulerAngles.y},{t.localEulerAngles.z}],"
                + $"\"localScale\":[{t.localScale.x},{t.localScale.y},{t.localScale.z}],"
                + $"\"worldPosition\":[{t.position.x},{t.position.y},{t.position.z}],"
                + $"\"worldRotation\":[{t.eulerAngles.x},{t.eulerAngles.y},{t.eulerAngles.z}]}}";
        }

        private static string SerializedPropertyToString(SerializedProperty prop)
        {
            switch (prop.propertyType)
            {
                case SerializedPropertyType.Integer: return prop.intValue.ToString();
                case SerializedPropertyType.Boolean: return prop.boolValue.ToString();
                case SerializedPropertyType.Float: return prop.floatValue.ToString(System.Globalization.CultureInfo.InvariantCulture);
                case SerializedPropertyType.String: return prop.stringValue ?? "";
                case SerializedPropertyType.Color: return prop.colorValue.ToString();
                case SerializedPropertyType.Vector2: return prop.vector2Value.ToString();
                case SerializedPropertyType.Vector3: return prop.vector3Value.ToString();
                case SerializedPropertyType.Vector4: return prop.vector4Value.ToString();
                case SerializedPropertyType.Enum: return prop.enumDisplayNames.Length > prop.enumValueIndex && prop.enumValueIndex >= 0
                    ? prop.enumDisplayNames[prop.enumValueIndex] : prop.enumValueIndex.ToString();
                case SerializedPropertyType.ObjectReference:
                    return prop.objectReferenceValue != null ? prop.objectReferenceValue.name : "null";
                default: return prop.propertyType.ToString();
            }
        }

        private static Type FindType(string typeName)
        {
            // Try common Unity types first.
            Type t = Type.GetType($"UnityEngine.{typeName}, UnityEngine");
            if (t != null) return t;

            t = Type.GetType($"UnityEngine.{typeName}, UnityEngine.PhysicsModule");
            if (t != null) return t;

            t = Type.GetType($"UnityEngine.{typeName}, UnityEngine.AudioModule");
            if (t != null) return t;

            t = Type.GetType($"UnityEngine.{typeName}, UnityEngine.AnimationModule");
            if (t != null) return t;

            t = Type.GetType($"UnityEngine.{typeName}, UnityEngine.UIModule");
            if (t != null) return t;

            t = Type.GetType($"UnityEngine.UI.{typeName}, UnityEngine.UI");
            if (t != null) return t;

            // Try exact name.
            t = Type.GetType(typeName);
            if (t != null) return t;

            // Search all loaded assemblies.
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
