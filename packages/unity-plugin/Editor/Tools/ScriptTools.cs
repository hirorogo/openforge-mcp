using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class ScriptTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_script", CreateScript);
            ToolExecutor.Register("edit_script", EditScript);
            ToolExecutor.Register("attach_script", AttachScript);
            ToolExecutor.Register("get_script", GetScript);
            ToolExecutor.Register("search_code", SearchCode);
        }

        private static ToolResult CreateScript(Dictionary<string, string> p)
        {
            string className = GetRequiredParam(p, "name");
            string baseClass = GetParam(p, "base_class", "MonoBehaviour");
            string namespaceName = GetParam(p, "namespace", "");
            string contents = GetParam(p, "contents", "");
            string directory = GetParam(p, "directory", "Assets/Scripts");

            // Sanitize class name.
            className = SanitizeClassName(className);
            if (string.IsNullOrEmpty(className))
                return Fail("Invalid class name");

            string filePath = Path.Combine(directory, $"{className}.cs");

            // Ensure directory exists.
            if (!Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            if (File.Exists(filePath))
                return Fail($"Script already exists: {filePath}. Use edit_script to modify it.");

            string code;
            if (!string.IsNullOrEmpty(contents))
            {
                code = contents;
            }
            else
            {
                code = GenerateScriptTemplate(className, baseClass, namespaceName);
            }

            File.WriteAllText(filePath, code, Encoding.UTF8);
            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created script '{className}' at {filePath}",
                data = $"{{\"path\":\"{EscapeJson(filePath)}\",\"className\":\"{EscapeJson(className)}\"}}"
            };
        }

        private static ToolResult EditScript(Dictionary<string, string> p)
        {
            string path = GetParam(p, "path", "");
            string name = GetParam(p, "name", "");

            string filePath = ResolveScriptPath(path, name);
            if (filePath == null)
                return Fail($"Script not found: {(string.IsNullOrEmpty(path) ? name : path)}");

            string currentContent = File.ReadAllText(filePath, Encoding.UTF8);

            // Full replace mode.
            if (p.TryGetValue("contents", out string newContents) && !string.IsNullOrEmpty(newContents))
            {
                File.WriteAllText(filePath, newContents, Encoding.UTF8);
                AssetDatabase.ImportAsset(filePath);
                return new ToolResult
                {
                    success = true,
                    message = $"Replaced contents of {filePath}",
                    data = $"{{\"path\":\"{EscapeJson(filePath)}\"}}"
                };
            }

            // Search-and-replace mode.
            if (p.TryGetValue("find", out string find) && p.TryGetValue("replace", out string replace))
            {
                if (!currentContent.Contains(find))
                    return Fail($"Text to find not found in {filePath}");

                string modified = currentContent.Replace(find, replace);
                File.WriteAllText(filePath, modified, Encoding.UTF8);
                AssetDatabase.ImportAsset(filePath);
                return new ToolResult
                {
                    success = true,
                    message = $"Applied find/replace in {filePath}",
                    data = $"{{\"path\":\"{EscapeJson(filePath)}\"}}"
                };
            }

            // Insert mode.
            if (p.TryGetValue("insert_after", out string insertAfter) && p.TryGetValue("text", out string text))
            {
                int idx = currentContent.IndexOf(insertAfter, StringComparison.Ordinal);
                if (idx < 0)
                    return Fail($"Insertion point not found in {filePath}");

                string modified = currentContent.Insert(idx + insertAfter.Length, "\n" + text);
                File.WriteAllText(filePath, modified, Encoding.UTF8);
                AssetDatabase.ImportAsset(filePath);
                return new ToolResult
                {
                    success = true,
                    message = $"Inserted text in {filePath}",
                    data = $"{{\"path\":\"{EscapeJson(filePath)}\"}}"
                };
            }

            return Fail("Specify one of: 'contents' (full replace), 'find'+'replace' (search-replace), or 'insert_after'+'text' (insert).");
        }

        private static ToolResult AttachScript(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string scriptName = GetRequiredParam(p, "script");

            GameObject go = GameObject.Find(targetName);
            if (go == null)
            {
                // Search inactive objects too.
                GameObject[] allObjects = Resources.FindObjectsOfTypeAll<GameObject>();
                foreach (GameObject obj in allObjects)
                {
                    if (obj.hideFlags != HideFlags.None) continue;
                    if (obj.scene.isLoaded && obj.name == targetName)
                    {
                        go = obj;
                        break;
                    }
                }
            }

            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            // Find the script type.
            Type scriptType = FindScriptType(scriptName);
            if (scriptType == null)
                return Fail($"Script type not found: {scriptName}. Make sure the script has been compiled (check for errors in the Console).");

            if (!typeof(Component).IsAssignableFrom(scriptType))
                return Fail($"'{scriptName}' is not a Component and cannot be attached to a GameObject.");

            Component existing = go.GetComponent(scriptType);
            if (existing != null)
                return Fail($"'{targetName}' already has a {scriptName} component.");

            Component comp = Undo.AddComponent(go, scriptType);
            if (comp == null)
                return Fail($"Failed to add {scriptName} to {targetName}");

            return new ToolResult
            {
                success = true,
                message = $"Attached '{scriptName}' to '{targetName}'",
                data = $"{{\"script\":\"{EscapeJson(scriptName)}\",\"target\":\"{EscapeJson(targetName)}\"}}"
            };
        }

        private static ToolResult GetScript(Dictionary<string, string> p)
        {
            string path = GetParam(p, "path", "");
            string name = GetParam(p, "name", "");

            string filePath = ResolveScriptPath(path, name);
            if (filePath == null)
                return Fail($"Script not found: {(string.IsNullOrEmpty(path) ? name : path)}");

            string content = File.ReadAllText(filePath, Encoding.UTF8);
            int lineCount = content.Split('\n').Length;

            return new ToolResult
            {
                success = true,
                message = $"Script at {filePath} ({lineCount} lines)",
                data = $"{{\"path\":\"{EscapeJson(filePath)}\",\"lineCount\":{lineCount},\"content\":\"{EscapeJson(content)}\"}}"
            };
        }

        private static ToolResult SearchCode(Dictionary<string, string> p)
        {
            string pattern = GetRequiredParam(p, "pattern");
            string directory = GetParam(p, "directory", "Assets");
            string filePattern = GetParam(p, "file_pattern", "*.cs");

            bool isRegex = GetParam(p, "regex", "false") == "true";

            List<SearchResult> results = new List<SearchResult>();
            int maxResults = 50;
            if (p.TryGetValue("max_results", out string maxStr) && int.TryParse(maxStr, out int max))
            {
                maxResults = Math.Max(1, Math.Min(max, 500));
            }

            string[] files;
            try
            {
                files = Directory.GetFiles(directory, filePattern, SearchOption.AllDirectories);
            }
            catch (Exception ex)
            {
                return Fail($"Failed to search directory: {ex.Message}");
            }

            Regex regex = null;
            if (isRegex)
            {
                try
                {
                    regex = new Regex(pattern, RegexOptions.Compiled | RegexOptions.Multiline);
                }
                catch (Exception ex)
                {
                    return Fail($"Invalid regex: {ex.Message}");
                }
            }

            foreach (string file in files)
            {
                if (results.Count >= maxResults) break;

                try
                {
                    string[] lines = File.ReadAllLines(file, Encoding.UTF8);
                    for (int i = 0; i < lines.Length; i++)
                    {
                        if (results.Count >= maxResults) break;

                        bool match;
                        if (isRegex)
                            match = regex.IsMatch(lines[i]);
                        else
                            match = lines[i].IndexOf(pattern, StringComparison.OrdinalIgnoreCase) >= 0;

                        if (match)
                        {
                            results.Add(new SearchResult
                            {
                                File = file.Replace("\\", "/"),
                                Line = i + 1,
                                Text = lines[i].Trim()
                            });
                        }
                    }
                }
                catch (Exception)
                {
                    // Skip files we cannot read.
                }
            }

            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < results.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append($"{{\"file\":\"{EscapeJson(results[i].File)}\",\"line\":{results[i].Line},\"text\":\"{EscapeJson(results[i].Text)}\"}}");
            }
            sb.Append("]");

            return new ToolResult
            {
                success = true,
                message = $"Found {results.Count} match(es) for '{pattern}'",
                data = sb.ToString()
            };
        }

        // --- Helpers ---

        private static string GenerateScriptTemplate(string className, string baseClass, string namespaceName)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendLine("using UnityEngine;");

            bool isMonoBehaviour = baseClass == "MonoBehaviour" || baseClass == "UnityEngine.MonoBehaviour";
            if (!isMonoBehaviour)
            {
                sb.AppendLine("using System;");
            }
            sb.AppendLine();

            bool hasNamespace = !string.IsNullOrEmpty(namespaceName);
            if (hasNamespace)
            {
                sb.AppendLine($"namespace {namespaceName}");
                sb.AppendLine("{");
            }

            string indent = hasNamespace ? "    " : "";

            if (string.IsNullOrEmpty(baseClass) || baseClass == "none")
            {
                sb.AppendLine($"{indent}public class {className}");
            }
            else
            {
                sb.AppendLine($"{indent}public class {className} : {baseClass}");
            }
            sb.AppendLine($"{indent}{{");

            if (isMonoBehaviour)
            {
                sb.AppendLine($"{indent}    private void Start()");
                sb.AppendLine($"{indent}    {{");
                sb.AppendLine($"{indent}    }}");
                sb.AppendLine();
                sb.AppendLine($"{indent}    private void Update()");
                sb.AppendLine($"{indent}    {{");
                sb.AppendLine($"{indent}    }}");
            }

            sb.AppendLine($"{indent}}}");

            if (hasNamespace)
            {
                sb.AppendLine("}");
            }

            return sb.ToString();
        }

        private static string SanitizeClassName(string name)
        {
            if (string.IsNullOrEmpty(name)) return null;

            // Remove .cs extension if present.
            if (name.EndsWith(".cs", StringComparison.OrdinalIgnoreCase))
                name = name.Substring(0, name.Length - 3);

            // Remove invalid characters.
            StringBuilder sb = new StringBuilder();
            foreach (char c in name)
            {
                if (char.IsLetterOrDigit(c) || c == '_')
                    sb.Append(c);
            }

            string result = sb.ToString();
            if (result.Length == 0) return null;
            if (char.IsDigit(result[0])) result = "_" + result;
            return result;
        }

        private static string ResolveScriptPath(string path, string name)
        {
            if (!string.IsNullOrEmpty(path) && File.Exists(path))
                return path;

            if (!string.IsNullOrEmpty(name))
            {
                // Clean up the name.
                if (!name.EndsWith(".cs")) name += ".cs";

                // Check common locations.
                string[] searchPaths = new[]
                {
                    $"Assets/Scripts/{name}",
                    $"Assets/{name}",
                };

                foreach (string sp in searchPaths)
                {
                    if (File.Exists(sp)) return sp;
                }

                // Search the entire Assets directory.
                string[] files = Directory.GetFiles("Assets", name, SearchOption.AllDirectories);
                if (files.Length > 0) return files[0];
            }

            return null;
        }

        private static Type FindScriptType(string scriptName)
        {
            // Remove .cs extension.
            if (scriptName.EndsWith(".cs", StringComparison.OrdinalIgnoreCase))
                scriptName = scriptName.Substring(0, scriptName.Length - 3);

            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                // Skip system assemblies for performance.
                string asmName = assembly.GetName().Name;
                if (asmName.StartsWith("System") || asmName.StartsWith("mscorlib") || asmName.StartsWith("Unity."))
                    continue;

                try
                {
                    foreach (Type type in assembly.GetTypes())
                    {
                        if (type.Name == scriptName || type.FullName == scriptName)
                            return type;
                    }
                }
                catch (System.Reflection.ReflectionTypeLoadException)
                {
                    // Skip assemblies with loading issues.
                }
            }

            // Also search Unity assemblies as a fallback.
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                try
                {
                    foreach (Type type in assembly.GetTypes())
                    {
                        if (type.Name == scriptName)
                            return type;
                    }
                }
                catch (System.Reflection.ReflectionTypeLoadException)
                {
                }
            }

            return null;
        }

        private struct SearchResult
        {
            public string File;
            public int Line;
            public string Text;
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
