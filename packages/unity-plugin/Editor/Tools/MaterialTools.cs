using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class MaterialTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_material", CreateMaterial);
            ToolExecutor.Register("set_material_color", SetMaterialColor);
            ToolExecutor.Register("set_material_shader", SetMaterialShader);
            ToolExecutor.Register("set_material_texture", SetMaterialTexture);
            ToolExecutor.Register("set_material_property", SetMaterialProperty);
            ToolExecutor.Register("get_material_info", GetMaterialInfo);
        }

        private static ToolResult CreateMaterial(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "New Material");
            string shaderName = GetParam(p, "shader", "Standard");

            Shader shader = Shader.Find(shaderName);
            if (shader == null)
                return Fail($"Shader not found: {shaderName}");

            Material mat = new Material(shader);
            mat.name = name;

            string path = GetParam(p, "path", $"Assets/{name}.mat");
            if (!path.EndsWith(".mat")) path += ".mat";

            EnsureDirectoryExists(path);
            AssetDatabase.CreateAsset(mat, path);
            AssetDatabase.SaveAssets();

            // Assign to target object if specified.
            string target = GetParam(p, "target", "");
            if (!string.IsNullOrEmpty(target))
            {
                AssignMaterialToObject(mat, target);
            }

            return new ToolResult
            {
                success = true,
                message = $"Created material '{name}' with shader '{shaderName}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"path\":\"{EscapeJson(path)}\",\"shader\":\"{EscapeJson(shaderName)}\"}}"
            };
        }

        private static ToolResult SetMaterialColor(Dictionary<string, string> p)
        {
            Material mat = FindMaterial(p);
            if (mat == null)
                return Fail("Material not found. Specify 'name' (asset name), 'path' (asset path), or 'target' (GameObject name).");

            string property = GetParam(p, "property", "_Color");
            string colorStr = GetRequiredParam(p, "color");

            Color color;
            if (!TryParseColor(colorStr, out color))
                return Fail($"Invalid color: {colorStr}. Use hex (#FF0000), rgba (1,0,0,1), or named color (red, blue, etc.).");

            Undo.RecordObject(mat, $"Set color {property}");
            mat.SetColor(property, color);
            EditorUtility.SetDirty(mat);

            return new ToolResult
            {
                success = true,
                message = $"Set {property} to {color} on '{mat.name}'"
            };
        }

        private static ToolResult SetMaterialShader(Dictionary<string, string> p)
        {
            Material mat = FindMaterial(p);
            if (mat == null)
                return Fail("Material not found");

            string shaderName = GetRequiredParam(p, "shader");
            Shader shader = Shader.Find(shaderName);
            if (shader == null)
                return Fail($"Shader not found: {shaderName}");

            Undo.RecordObject(mat, $"Set shader to {shaderName}");
            mat.shader = shader;
            EditorUtility.SetDirty(mat);

            return new ToolResult
            {
                success = true,
                message = $"Set shader of '{mat.name}' to '{shaderName}'"
            };
        }

        private static ToolResult SetMaterialTexture(Dictionary<string, string> p)
        {
            Material mat = FindMaterial(p);
            if (mat == null)
                return Fail("Material not found");

            string property = GetParam(p, "property", "_MainTex");
            string texturePath = GetRequiredParam(p, "texture");

            Texture texture = AssetDatabase.LoadAssetAtPath<Texture>(texturePath);
            if (texture == null)
            {
                // Try searching by name.
                string[] guids = AssetDatabase.FindAssets($"t:Texture {texturePath}");
                if (guids.Length > 0)
                {
                    string assetPath = AssetDatabase.GUIDToAssetPath(guids[0]);
                    texture = AssetDatabase.LoadAssetAtPath<Texture>(assetPath);
                }
            }

            if (texture == null)
                return Fail($"Texture not found: {texturePath}");

            Undo.RecordObject(mat, $"Set texture {property}");
            mat.SetTexture(property, texture);
            EditorUtility.SetDirty(mat);

            return new ToolResult
            {
                success = true,
                message = $"Set {property} on '{mat.name}' to '{texture.name}'"
            };
        }

        private static ToolResult SetMaterialProperty(Dictionary<string, string> p)
        {
            Material mat = FindMaterial(p);
            if (mat == null)
                return Fail("Material not found");

            string property = GetRequiredParam(p, "property");
            string value = GetRequiredParam(p, "value");
            string type = GetParam(p, "type", "auto");

            Undo.RecordObject(mat, $"Set property {property}");

            if (type == "auto")
            {
                // Try to detect the type.
                if (mat.HasProperty(property))
                {
                    // Try float first.
                    if (float.TryParse(value, System.Globalization.NumberStyles.Float,
                        System.Globalization.CultureInfo.InvariantCulture, out float f))
                    {
                        mat.SetFloat(property, f);
                    }
                    else if (TryParseColor(value, out Color c))
                    {
                        mat.SetColor(property, c);
                    }
                    else if (TryParseVector4(value, out Vector4 v))
                    {
                        mat.SetVector(property, v);
                    }
                    else
                    {
                        return Fail($"Could not determine type for value: {value}");
                    }
                }
                else
                {
                    return Fail($"Material does not have property: {property}");
                }
            }
            else
            {
                switch (type.ToLower())
                {
                    case "float":
                        if (!float.TryParse(value, System.Globalization.NumberStyles.Float,
                            System.Globalization.CultureInfo.InvariantCulture, out float fv))
                            return Fail($"Invalid float value: {value}");
                        mat.SetFloat(property, fv);
                        break;

                    case "int":
                        if (!int.TryParse(value, out int iv))
                            return Fail($"Invalid int value: {value}");
                        mat.SetInt(property, iv);
                        break;

                    case "color":
                        if (!TryParseColor(value, out Color cv))
                            return Fail($"Invalid color value: {value}");
                        mat.SetColor(property, cv);
                        break;

                    case "vector":
                        if (!TryParseVector4(value, out Vector4 vv))
                            return Fail($"Invalid vector value: {value}");
                        mat.SetVector(property, vv);
                        break;

                    default:
                        return Fail($"Unknown property type: {type}. Use float, int, color, or vector.");
                }
            }

            EditorUtility.SetDirty(mat);

            return new ToolResult
            {
                success = true,
                message = $"Set {property} = {value} on '{mat.name}'"
            };
        }

        private static ToolResult GetMaterialInfo(Dictionary<string, string> p)
        {
            Material mat = FindMaterial(p);
            if (mat == null)
                return Fail("Material not found");

            StringBuilder sb = new StringBuilder();
            sb.Append("{");
            sb.Append($"\"name\":\"{EscapeJson(mat.name)}\",");
            sb.Append($"\"shader\":\"{EscapeJson(mat.shader.name)}\",");
            sb.Append($"\"renderQueue\":{mat.renderQueue},");

            // Keywords
            sb.Append("\"keywords\":[");
            string[] keywords = mat.shaderKeywords;
            for (int i = 0; i < keywords.Length; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append($"\"{EscapeJson(keywords[i])}\"");
            }
            sb.Append("],");

            // Properties
            sb.Append("\"properties\":[");
            Shader shader = mat.shader;
            int propCount = ShaderUtil.GetPropertyCount(shader);
            for (int i = 0; i < propCount; i++)
            {
                if (i > 0) sb.Append(",");
                string propName = ShaderUtil.GetPropertyName(shader, i);
                string propDesc = ShaderUtil.GetPropertyDescription(shader, i);
                ShaderUtil.ShaderPropertyType propType = ShaderUtil.GetPropertyType(shader, i);

                sb.Append("{");
                sb.Append($"\"name\":\"{EscapeJson(propName)}\",");
                sb.Append($"\"description\":\"{EscapeJson(propDesc)}\",");
                sb.Append($"\"type\":\"{propType}\",");
                sb.Append($"\"value\":");

                switch (propType)
                {
                    case ShaderUtil.ShaderPropertyType.Color:
                        Color c = mat.GetColor(propName);
                        sb.Append($"\"({c.r:F3},{c.g:F3},{c.b:F3},{c.a:F3})\"");
                        break;
                    case ShaderUtil.ShaderPropertyType.Float:
                    case ShaderUtil.ShaderPropertyType.Range:
                        sb.Append(mat.GetFloat(propName).ToString(System.Globalization.CultureInfo.InvariantCulture));
                        break;
                    case ShaderUtil.ShaderPropertyType.Vector:
                        Vector4 v = mat.GetVector(propName);
                        sb.Append($"\"({v.x:F3},{v.y:F3},{v.z:F3},{v.w:F3})\"");
                        break;
                    case ShaderUtil.ShaderPropertyType.TexEnv:
                        Texture tex = mat.GetTexture(propName);
                        sb.Append($"\"{EscapeJson(tex != null ? tex.name : "none")}\"");
                        break;
                    default:
                        sb.Append("\"unknown\"");
                        break;
                }
                sb.Append("}");
            }
            sb.Append("]");

            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Material '{mat.name}' using shader '{mat.shader.name}'",
                data = sb.ToString()
            };
        }

        // --- Helpers ---

        private static Material FindMaterial(Dictionary<string, string> p)
        {
            // By asset path.
            if (p.TryGetValue("path", out string path) && !string.IsNullOrEmpty(path))
            {
                Material mat = AssetDatabase.LoadAssetAtPath<Material>(path);
                if (mat != null) return mat;
            }

            // By name (search assets).
            if (p.TryGetValue("name", out string name) && !string.IsNullOrEmpty(name))
            {
                string[] guids = AssetDatabase.FindAssets($"t:Material {name}");
                foreach (string guid in guids)
                {
                    string assetPath = AssetDatabase.GUIDToAssetPath(guid);
                    Material mat = AssetDatabase.LoadAssetAtPath<Material>(assetPath);
                    if (mat != null && mat.name == name)
                        return mat;
                }

                // Partial match fallback.
                if (guids.Length > 0)
                {
                    string assetPath = AssetDatabase.GUIDToAssetPath(guids[0]);
                    return AssetDatabase.LoadAssetAtPath<Material>(assetPath);
                }
            }

            // By target GameObject (get from renderer).
            if (p.TryGetValue("target", out string target) && !string.IsNullOrEmpty(target))
            {
                GameObject go = GameObject.Find(target);
                if (go != null)
                {
                    Renderer renderer = go.GetComponent<Renderer>();
                    if (renderer != null && renderer.sharedMaterial != null)
                        return renderer.sharedMaterial;
                }
            }

            return null;
        }

        private static void AssignMaterialToObject(Material mat, string targetName)
        {
            GameObject go = GameObject.Find(targetName);
            if (go == null) return;

            Renderer renderer = go.GetComponent<Renderer>();
            if (renderer == null) return;

            Undo.RecordObject(renderer, $"Assign material to {targetName}");
            renderer.sharedMaterial = mat;
        }

        private static bool TryParseColor(string s, out Color color)
        {
            color = Color.white;
            if (string.IsNullOrEmpty(s)) return false;

            s = s.Trim();

            // Hex format.
            if (s.StartsWith("#"))
            {
                return ColorUtility.TryParseHtmlString(s, out color);
            }

            // Named colors.
            switch (s.ToLower())
            {
                case "red": color = Color.red; return true;
                case "green": color = Color.green; return true;
                case "blue": color = Color.blue; return true;
                case "white": color = Color.white; return true;
                case "black": color = Color.black; return true;
                case "yellow": color = Color.yellow; return true;
                case "cyan": color = Color.cyan; return true;
                case "magenta": color = Color.magenta; return true;
                case "gray": case "grey": color = Color.gray; return true;
            }

            // RGBA format: "r,g,b" or "r,g,b,a"
            string cleaned = s.Trim('(', ')', '[', ']');
            string[] parts = cleaned.Split(',');
            if (parts.Length >= 3)
            {
                var style = System.Globalization.NumberStyles.Float;
                var culture = System.Globalization.CultureInfo.InvariantCulture;
                if (float.TryParse(parts[0].Trim(), style, culture, out float r)
                    && float.TryParse(parts[1].Trim(), style, culture, out float g)
                    && float.TryParse(parts[2].Trim(), style, culture, out float b))
                {
                    float a = 1f;
                    if (parts.Length >= 4)
                        float.TryParse(parts[3].Trim(), style, culture, out a);
                    color = new Color(r, g, b, a);
                    return true;
                }
            }

            return false;
        }

        private static bool TryParseVector4(string s, out Vector4 v)
        {
            v = Vector4.zero;
            if (string.IsNullOrEmpty(s)) return false;

            string cleaned = s.Trim('(', ')', '[', ']');
            string[] parts = cleaned.Split(',');
            var style = System.Globalization.NumberStyles.Float;
            var culture = System.Globalization.CultureInfo.InvariantCulture;

            if (parts.Length >= 4
                && float.TryParse(parts[0].Trim(), style, culture, out float x)
                && float.TryParse(parts[1].Trim(), style, culture, out float y)
                && float.TryParse(parts[2].Trim(), style, culture, out float z)
                && float.TryParse(parts[3].Trim(), style, culture, out float w))
            {
                v = new Vector4(x, y, z, w);
                return true;
            }

            if (parts.Length >= 3
                && float.TryParse(parts[0].Trim(), style, culture, out float x3)
                && float.TryParse(parts[1].Trim(), style, culture, out float y3)
                && float.TryParse(parts[2].Trim(), style, culture, out float z3))
            {
                v = new Vector4(x3, y3, z3, 0);
                return true;
            }

            return false;
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
