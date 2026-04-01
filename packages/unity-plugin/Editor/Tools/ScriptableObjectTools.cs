using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class ScriptableObjectTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_scriptable_object", CreateScriptableObject);
            ToolExecutor.Register("set_so_field", SetSOField);
            ToolExecutor.Register("get_so_fields", GetSOFields);
            ToolExecutor.Register("find_scriptable_objects", FindScriptableObjects);
            ToolExecutor.Register("duplicate_so", DuplicateSO);
            ToolExecutor.Register("create_so_script", CreateSOScript);
        }

        private static ToolResult CreateScriptableObject(Dictionary<string, string> p)
        {
            string typeName = GetRequiredParam(p, "type");
            string assetPath = GetParam(p, "path", "");
            string assetName = GetParam(p, "name", typeName);

            Type soType = FindSOType(typeName);
            if (soType == null)
                return Fail($"ScriptableObject type not found: {typeName}");

            if (!typeof(ScriptableObject).IsAssignableFrom(soType))
                return Fail($"Type '{typeName}' is not a ScriptableObject");

            ScriptableObject so = ScriptableObject.CreateInstance(soType);
            if (so == null)
                return Fail($"Failed to create instance of '{typeName}'");

            so.name = assetName;

            if (string.IsNullOrEmpty(assetPath))
                assetPath = $"Assets/{assetName}.asset";

            // Ensure directory exists
            string dir = Path.GetDirectoryName(assetPath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                Directory.CreateDirectory(dir);

            AssetDatabase.CreateAsset(so, assetPath);
            AssetDatabase.SaveAssets();

            Undo.RegisterCreatedObjectUndo(so, $"Create ScriptableObject {typeName}");

            return new ToolResult
            {
                success = true,
                message = $"Created ScriptableObject '{assetName}' of type '{typeName}' at '{assetPath}'",
                data = $"{{\"name\":\"{EscapeJson(assetName)}\",\"type\":\"{EscapeJson(typeName)}\",\"path\":\"{EscapeJson(assetPath)}\",\"instanceId\":{so.GetInstanceID()}}}"
            };
        }

        private static ToolResult SetSOField(Dictionary<string, string> p)
        {
            string assetPath = GetRequiredParam(p, "path");
            string fieldName = GetRequiredParam(p, "field");
            string fieldValue = GetRequiredParam(p, "value");

            ScriptableObject so = AssetDatabase.LoadAssetAtPath<ScriptableObject>(assetPath);
            if (so == null)
                return Fail($"ScriptableObject not found at path: {assetPath}");

            Undo.RecordObject(so, $"Set SO field {fieldName}");

            SerializedObject serializedObj = new SerializedObject(so);
            SerializedProperty prop = serializedObj.FindProperty(fieldName);

            if (prop == null)
                return Fail($"Field '{fieldName}' not found on ScriptableObject at '{assetPath}'");

            bool success = SetSerializedProperty(prop, fieldValue);
            if (!success)
                return Fail($"Failed to set field '{fieldName}' to '{fieldValue}' (type: {prop.propertyType})");

            serializedObj.ApplyModifiedProperties();
            EditorUtility.SetDirty(so);
            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Set '{fieldName}' = '{fieldValue}' on '{so.name}'"
            };
        }

        private static ToolResult GetSOFields(Dictionary<string, string> p)
        {
            string assetPath = GetRequiredParam(p, "path");

            ScriptableObject so = AssetDatabase.LoadAssetAtPath<ScriptableObject>(assetPath);
            if (so == null)
                return Fail($"ScriptableObject not found at path: {assetPath}");

            SerializedObject serializedObj = new SerializedObject(so);
            SerializedProperty prop = serializedObj.GetIterator();

            StringBuilder sb = new StringBuilder("{");
            sb.Append($"\"name\":\"{EscapeJson(so.name)}\",");
            sb.Append($"\"type\":\"{EscapeJson(so.GetType().Name)}\",");
            sb.Append($"\"path\":\"{EscapeJson(assetPath)}\",");
            sb.Append("\"fields\":{");

            bool first = true;
            if (prop.NextVisible(true))
            {
                do
                {
                    // Skip the m_Script field
                    if (prop.name == "m_Script") continue;

                    if (!first) sb.Append(",");
                    first = false;
                    sb.Append($"\"{EscapeJson(prop.name)}\":{{");
                    sb.Append($"\"type\":\"{prop.propertyType}\",");
                    sb.Append($"\"value\":\"{EscapeJson(SerializedPropertyToString(prop))}\"");
                    sb.Append("}");
                }
                while (prop.NextVisible(false));
            }

            sb.Append("}}");
            serializedObj.Dispose();

            return new ToolResult
            {
                success = true,
                message = $"Fields of '{so.name}' ({so.GetType().Name})",
                data = sb.ToString()
            };
        }

        private static ToolResult FindScriptableObjects(Dictionary<string, string> p)
        {
            string typeName = GetRequiredParam(p, "type");
            string searchFolder = GetParam(p, "folder", "Assets");

            string[] guids = AssetDatabase.FindAssets($"t:{typeName}", new[] { searchFolder });

            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < guids.Length; i++)
            {
                if (i > 0) sb.Append(",");
                string path = AssetDatabase.GUIDToAssetPath(guids[i]);
                ScriptableObject so = AssetDatabase.LoadAssetAtPath<ScriptableObject>(path);
                sb.Append("{");
                sb.Append($"\"name\":\"{EscapeJson(so != null ? so.name : "")}\",");
                sb.Append($"\"type\":\"{EscapeJson(so != null ? so.GetType().Name : typeName)}\",");
                sb.Append($"\"path\":\"{EscapeJson(path)}\",");
                sb.Append($"\"guid\":\"{EscapeJson(guids[i])}\"");
                sb.Append("}");
            }
            sb.Append("]");

            return new ToolResult
            {
                success = true,
                message = $"Found {guids.Length} ScriptableObject(s) of type '{typeName}'",
                data = sb.ToString()
            };
        }

        private static ToolResult DuplicateSO(Dictionary<string, string> p)
        {
            string sourcePath = GetRequiredParam(p, "source_path");
            string destPath = GetParam(p, "dest_path", "");

            ScriptableObject source = AssetDatabase.LoadAssetAtPath<ScriptableObject>(sourcePath);
            if (source == null)
                return Fail($"ScriptableObject not found at path: {sourcePath}");

            if (string.IsNullOrEmpty(destPath))
            {
                string dir = Path.GetDirectoryName(sourcePath);
                string name = Path.GetFileNameWithoutExtension(sourcePath);
                string ext = Path.GetExtension(sourcePath);
                destPath = Path.Combine(dir, $"{name}_Copy{ext}");
            }

            if (!AssetDatabase.CopyAsset(sourcePath, destPath))
                return Fail($"Failed to duplicate asset from '{sourcePath}' to '{destPath}'");

            AssetDatabase.Refresh();

            ScriptableObject duplicate = AssetDatabase.LoadAssetAtPath<ScriptableObject>(destPath);

            return new ToolResult
            {
                success = true,
                message = $"Duplicated '{source.name}' to '{destPath}'",
                data = $"{{\"sourcePath\":\"{EscapeJson(sourcePath)}\",\"destPath\":\"{EscapeJson(destPath)}\",\"name\":\"{EscapeJson(duplicate != null ? duplicate.name : "")}\"}}"
            };
        }

        private static ToolResult CreateSOScript(Dictionary<string, string> p)
        {
            string className = GetRequiredParam(p, "class_name");
            string menuName = GetParam(p, "menu_name", className);
            string fileName = GetParam(p, "file_name", className);
            string fieldsJson = GetParam(p, "fields", "");
            string namespaceName = GetParam(p, "namespace", "");
            string savePath = GetParam(p, "path", $"Assets/Scripts/{fileName}.cs");

            StringBuilder sb = new StringBuilder();
            sb.AppendLine("using UnityEngine;");
            sb.AppendLine();

            if (!string.IsNullOrEmpty(namespaceName))
            {
                sb.AppendLine($"namespace {namespaceName}");
                sb.AppendLine("{");
            }

            sb.AppendLine($"    [CreateAssetMenu(menuName = \"ScriptableObjects/{menuName}\", fileName = \"{className}\")]");
            sb.AppendLine($"    public class {className} : ScriptableObject");
            sb.AppendLine("    {");

            // Parse fields: "name:type,name2:type2" format
            if (!string.IsNullOrEmpty(fieldsJson))
            {
                string[] fieldDefs = fieldsJson.Split(',');
                foreach (string fieldDef in fieldDefs)
                {
                    string[] parts = fieldDef.Trim().Split(':');
                    if (parts.Length >= 2)
                    {
                        string fName = parts[0].Trim();
                        string fType = parts[1].Trim();
                        string defaultVal = parts.Length >= 3 ? parts[2].Trim() : "";

                        sb.AppendLine($"        [SerializeField]");
                        if (!string.IsNullOrEmpty(defaultVal))
                            sb.AppendLine($"        private {fType} {fName} = {defaultVal};");
                        else
                            sb.AppendLine($"        private {fType} {fName};");

                        // Generate public property
                        string propName = char.ToUpper(fName[0]) + fName.Substring(1);
                        if (fName.StartsWith("_"))
                            propName = char.ToUpper(fName[1]) + fName.Substring(2);

                        sb.AppendLine($"        public {fType} {propName} => {fName};");
                        sb.AppendLine();
                    }
                }
            }
            else
            {
                sb.AppendLine("        // Add your fields here");
                sb.AppendLine("        [SerializeField] private string displayName;");
                sb.AppendLine("        [SerializeField] private string description;");
                sb.AppendLine();
                sb.AppendLine("        public string DisplayName => displayName;");
                sb.AppendLine("        public string Description => description;");
            }

            sb.AppendLine("    }");

            if (!string.IsNullOrEmpty(namespaceName))
            {
                sb.AppendLine("}");
            }

            // Ensure directory exists
            string dir = Path.GetDirectoryName(savePath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                Directory.CreateDirectory(dir);

            File.WriteAllText(savePath, sb.ToString());
            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created ScriptableObject script '{className}' at '{savePath}'",
                data = $"{{\"className\":\"{EscapeJson(className)}\",\"path\":\"{EscapeJson(savePath)}\"}}"
            };
        }

        // --- Helpers ---

        private static Type FindSOType(string typeName)
        {
            // Try common paths
            Type t = Type.GetType(typeName);
            if (t != null) return t;

            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                foreach (var type in assembly.GetTypes())
                {
                    if ((type.Name == typeName || type.FullName == typeName) && typeof(ScriptableObject).IsAssignableFrom(type))
                        return type;
                }
            }
            return null;
        }

        private static bool SetSerializedProperty(SerializedProperty prop, string value)
        {
            switch (prop.propertyType)
            {
                case SerializedPropertyType.Integer:
                    if (int.TryParse(value, out int intVal)) { prop.intValue = intVal; return true; }
                    break;
                case SerializedPropertyType.Boolean:
                    prop.boolValue = value.ToLower() == "true" || value == "1";
                    return true;
                case SerializedPropertyType.Float:
                    if (float.TryParse(value, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float floatVal))
                    { prop.floatValue = floatVal; return true; }
                    break;
                case SerializedPropertyType.String:
                    prop.stringValue = value;
                    return true;
                case SerializedPropertyType.Color:
                    if (ColorUtility.TryParseHtmlString(value, out Color color)) { prop.colorValue = color; return true; }
                    break;
                case SerializedPropertyType.Enum:
                    if (int.TryParse(value, out int enumVal)) { prop.enumValueIndex = enumVal; return true; }
                    // Try by name
                    for (int i = 0; i < prop.enumDisplayNames.Length; i++)
                    {
                        if (string.Equals(prop.enumDisplayNames[i], value, StringComparison.OrdinalIgnoreCase))
                        { prop.enumValueIndex = i; return true; }
                    }
                    break;
                case SerializedPropertyType.Vector3:
                    string[] v3Parts = value.Trim('[', ']', '(', ')').Split(',');
                    if (v3Parts.Length >= 3
                        && float.TryParse(v3Parts[0].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float v3x)
                        && float.TryParse(v3Parts[1].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float v3y)
                        && float.TryParse(v3Parts[2].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float v3z))
                    { prop.vector3Value = new Vector3(v3x, v3y, v3z); return true; }
                    break;
                case SerializedPropertyType.Vector2:
                    string[] v2Parts = value.Trim('[', ']', '(', ')').Split(',');
                    if (v2Parts.Length >= 2
                        && float.TryParse(v2Parts[0].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float v2x)
                        && float.TryParse(v2Parts[1].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float v2y))
                    { prop.vector2Value = new Vector2(v2x, v2y); return true; }
                    break;
                case SerializedPropertyType.ObjectReference:
                    UnityEngine.Object obj = AssetDatabase.LoadAssetAtPath<UnityEngine.Object>(value);
                    if (obj != null) { prop.objectReferenceValue = obj; return true; }
                    break;
            }
            return false;
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
                case SerializedPropertyType.Enum:
                    return prop.enumDisplayNames.Length > prop.enumValueIndex && prop.enumValueIndex >= 0
                        ? prop.enumDisplayNames[prop.enumValueIndex] : prop.enumValueIndex.ToString();
                case SerializedPropertyType.ObjectReference:
                    return prop.objectReferenceValue != null ? prop.objectReferenceValue.name : "null";
                default: return prop.propertyType.ToString();
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
