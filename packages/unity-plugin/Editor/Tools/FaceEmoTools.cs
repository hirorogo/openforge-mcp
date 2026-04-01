using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    /// <summary>
    /// FaceEmo integration tools using reflection.
    /// All access to FaceEmo types is done via reflection since it is an optional package.
    /// </summary>
    public static class FaceEmoTools
    {
        private static bool _faceEmoChecked;
        private static bool _faceEmoAvailable;
        private static string _faceEmoVersion;
        private static Assembly _faceEmoAssembly;

        // Cached types
        private static Type _faceEmoLauncherType;
        private static Type _expressionMenuType;
        private static Type _expressionItemType;
        private static Type _gestureExpressionType;

        public static void Register()
        {
            ToolExecutor.Register("setup_faceemo", SetupFaceEmo);
            ToolExecutor.Register("create_expression_menu", CreateExpressionMenu);
            ToolExecutor.Register("add_expression", AddExpression);
            ToolExecutor.Register("add_gesture_expression", AddGestureExpression);
            ToolExecutor.Register("create_expression_preset", CreateExpressionPreset);
            ToolExecutor.Register("list_expressions", ListExpressions);
            ToolExecutor.Register("remove_expression", RemoveExpression);
            ToolExecutor.Register("auto_detect_blendshapes", AutoDetectBlendshapes);
        }

        private static bool EnsureFaceEmo()
        {
            if (_faceEmoChecked) return _faceEmoAvailable;
            _faceEmoChecked = true;

            // FaceEmo namespace varies by version. Try known patterns.
            string[] knownAssemblyNames = {
                "Suzuryg.FaceEmo.Domain",
                "Suzuryg.FaceEmo",
                "FaceEmo",
                "com.suzuryg.face-emo",
                "Suzuryg.FaceEmo.UseCase",
                "Suzuryg.FaceEmo.Components"
            };

            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                string asmName = asm.GetName().Name;
                foreach (string known in knownAssemblyNames)
                {
                    if (asmName == known || asmName.Contains("FaceEmo") || asmName.Contains("face-emo"))
                    {
                        _faceEmoAssembly = asm;
                        var versionAttr = asm.GetName().Version;
                        _faceEmoVersion = versionAttr != null ? versionAttr.ToString() : "unknown";
                        break;
                    }
                }
                if (_faceEmoAssembly != null) break;
            }

            // Search for FaceEmo types across all assemblies
            if (_faceEmoAssembly == null)
            {
                foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
                {
                    try
                    {
                        foreach (Type t in asm.GetTypes())
                        {
                            string fullName = t.FullName ?? "";
                            if (fullName.Contains("FaceEmo") || fullName.Contains("Suzuryg"))
                            {
                                _faceEmoAssembly = asm;
                                var ver = asm.GetName().Version;
                                _faceEmoVersion = ver != null ? ver.ToString() : "unknown";
                                break;
                            }
                        }
                    }
                    catch { /* skip assemblies that fail to enumerate */ }
                    if (_faceEmoAssembly != null) break;
                }
            }

            if (_faceEmoAssembly != null)
            {
                // Discover known types
                DiscoverFaceEmoTypes();
            }

            _faceEmoAvailable = _faceEmoAssembly != null;
            return _faceEmoAvailable;
        }

        private static void DiscoverFaceEmoTypes()
        {
            // Search across all assemblies for FaceEmo types
            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                try
                {
                    foreach (Type t in asm.GetTypes())
                    {
                        string fullName = t.FullName ?? "";
                        if (_faceEmoLauncherType == null && fullName.Contains("FaceEmoLauncher"))
                            _faceEmoLauncherType = t;
                        if (_expressionMenuType == null &&
                            (fullName.Contains("ExpressionMenu") || fullName.Contains("FaceEmoMenu")))
                            _expressionMenuType = t;
                        if (_expressionItemType == null &&
                            (fullName.Contains("ExpressionItem") || fullName.Contains("Expression") && t.IsClass && !t.IsAbstract && fullName.Contains("FaceEmo")))
                            _expressionItemType = t;
                        if (_gestureExpressionType == null && fullName.Contains("GestureExpression"))
                            _gestureExpressionType = t;
                    }
                }
                catch { /* skip */ }
            }
        }

        private static string FaceEmoNotInstalledMessage()
        {
            return "FaceEmo is not installed. Install via VCC or add com.suzuryg.face-emo package.";
        }

        // --- Tool Implementations ---

        private static ToolResult SetupFaceEmo(Dictionary<string, string> p)
        {
            bool available = EnsureFaceEmo();
            var sb = new StringBuilder("{");
            sb.Append($"\"installed\":{(available ? "true" : "false")}");

            if (available)
            {
                sb.Append($",\"version\":\"{EscapeJson(_faceEmoVersion)}\"");
                sb.Append($",\"assembly\":\"{EscapeJson(_faceEmoAssembly.GetName().Name)}\"");

                var types = new List<string>();
                if (_faceEmoLauncherType != null) types.Add("FaceEmoLauncher");
                if (_expressionMenuType != null) types.Add("ExpressionMenu");
                if (_expressionItemType != null) types.Add("ExpressionItem");
                if (_gestureExpressionType != null) types.Add("GestureExpression");

                sb.Append(",\"discoveredTypes\":[");
                for (int i = 0; i < types.Count; i++)
                {
                    if (i > 0) sb.Append(",");
                    sb.Append($"\"{types[i]}\"");
                }
                sb.Append("]");
            }
            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = available
                    ? $"FaceEmo is installed (version {_faceEmoVersion})"
                    : FaceEmoNotInstalledMessage(),
                data = sb.ToString()
            };
        }

        private static ToolResult CreateExpressionMenu(Dictionary<string, string> p)
        {
            if (!EnsureFaceEmo())
                return Fail(FaceEmoNotInstalledMessage());

            string menuName = GetParam(p, "name", "FaceEmo_ExpressionMenu");
            string savePath = GetParam(p, "path", $"Assets/{menuName}.asset");

            // Try to create via FaceEmo API reflection
            if (_faceEmoLauncherType != null)
            {
                // Try to find a static Create or CreateMenu method
                MethodInfo createMethod = _faceEmoLauncherType.GetMethod("CreateMenu",
                    BindingFlags.Public | BindingFlags.Static);
                if (createMethod == null)
                    createMethod = _faceEmoLauncherType.GetMethod("Create",
                        BindingFlags.Public | BindingFlags.Static);

                if (createMethod != null)
                {
                    try
                    {
                        object result = createMethod.Invoke(null, new object[] { menuName });
                        if (result != null)
                        {
                            return new ToolResult
                            {
                                success = true,
                                message = $"Created FaceEmo expression menu '{menuName}'",
                                data = $"{{\"name\":\"{EscapeJson(menuName)}\",\"path\":\"{EscapeJson(savePath)}\"}}"
                            };
                        }
                    }
                    catch (Exception ex)
                    {
                        Debug.LogWarning($"FaceEmo CreateMenu failed: {ex.Message}");
                    }
                }
            }

            // Fallback: create a ScriptableObject asset if we found the menu type
            if (_expressionMenuType != null && typeof(ScriptableObject).IsAssignableFrom(_expressionMenuType))
            {
                ScriptableObject menuAsset = ScriptableObject.CreateInstance(_expressionMenuType);
                menuAsset.name = menuName;

                // Ensure directory exists
                string directory = System.IO.Path.GetDirectoryName(savePath);
                if (!string.IsNullOrEmpty(directory) && !AssetDatabase.IsValidFolder(directory))
                {
                    string[] folders = directory.Replace("\\", "/").Split('/');
                    string currentPath = folders[0];
                    for (int i = 1; i < folders.Length; i++)
                    {
                        string next = currentPath + "/" + folders[i];
                        if (!AssetDatabase.IsValidFolder(next))
                        {
                            AssetDatabase.CreateFolder(currentPath, folders[i]);
                        }
                        currentPath = next;
                    }
                }

                AssetDatabase.CreateAsset(menuAsset, savePath);
                AssetDatabase.SaveAssets();

                return new ToolResult
                {
                    success = true,
                    message = $"Created FaceEmo expression menu asset at '{savePath}'",
                    data = $"{{\"name\":\"{EscapeJson(menuName)}\",\"path\":\"{EscapeJson(savePath)}\"}}"
                };
            }

            // If we cannot create natively, instruct the user
            return new ToolResult
            {
                success = true,
                message = $"FaceEmo is installed but expression menu type could not be instantiated. Use FaceEmo editor window (Tools > FaceEmo) to create the menu manually.",
                data = $"{{\"name\":\"{EscapeJson(menuName)}\",\"manual\":true}}"
            };
        }

        private static ToolResult AddExpression(Dictionary<string, string> p)
        {
            if (!EnsureFaceEmo())
                return Fail(FaceEmoNotInstalledMessage());

            string targetName = GetRequiredParam(p, "target");
            string expressionName = GetRequiredParam(p, "expression_name");
            string blendshapes = GetRequiredParam(p, "blendshapes");

            GameObject target = FindByNameOrId(targetName);
            if (target == null)
                return Fail($"GameObject not found: {targetName}");

            // Parse blendshapes: "blendshapeName=value,blendshapeName=value"
            var blendshapeEntries = new List<KeyValuePair<string, float>>();
            string[] entries = blendshapes.Split(',');
            foreach (string entry in entries)
            {
                string trimmed = entry.Trim();
                if (string.IsNullOrEmpty(trimmed)) continue;

                string[] kv = trimmed.Split('=');
                if (kv.Length != 2) continue;

                string bsName = kv[0].Trim();
                if (float.TryParse(kv[1].Trim(), System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out float bsValue))
                {
                    blendshapeEntries.Add(new KeyValuePair<string, float>(bsName, bsValue));
                }
            }

            if (blendshapeEntries.Count == 0)
                return Fail("No valid blendshape entries. Format: blendshapeName=value,blendshapeName=value");

            // Apply blendshape values to create the expression on the target
            // FaceEmo works with animation clips that set blendshape values
            // Create an animation clip representing this expression
            string clipName = $"FaceEmo_{expressionName}";
            string clipPath = GetParam(p, "clip_path", $"Assets/FaceEmo/{clipName}.anim");

            // Ensure directory
            string dir = System.IO.Path.GetDirectoryName(clipPath);
            if (!string.IsNullOrEmpty(dir) && !AssetDatabase.IsValidFolder(dir))
            {
                string[] folders = dir.Replace("\\", "/").Split('/');
                string currentPath = folders[0];
                for (int i = 1; i < folders.Length; i++)
                {
                    string next = currentPath + "/" + folders[i];
                    if (!AssetDatabase.IsValidFolder(next))
                    {
                        AssetDatabase.CreateFolder(currentPath, folders[i]);
                    }
                    currentPath = next;
                }
            }

            AnimationClip clip = new AnimationClip();
            clip.name = clipName;

            // Find the SkinnedMeshRenderer path relative to the target
            SkinnedMeshRenderer smr = target.GetComponentInChildren<SkinnedMeshRenderer>();
            string meshPath = "";
            if (smr != null)
            {
                meshPath = GetRelativePath(target.transform, smr.transform);
            }

            foreach (var bsEntry in blendshapeEntries)
            {
                AnimationCurve curve = AnimationCurve.Constant(0f, 0f, bsEntry.Value);
                clip.SetCurve(meshPath, typeof(SkinnedMeshRenderer), $"blendShape.{bsEntry.Key}", curve);
            }

            AssetDatabase.CreateAsset(clip, clipPath);
            AssetDatabase.SaveAssets();

            // Build result
            var sb = new StringBuilder("{");
            sb.Append($"\"expressionName\":\"{EscapeJson(expressionName)}\",");
            sb.Append($"\"clipPath\":\"{EscapeJson(clipPath)}\",");
            sb.Append("\"blendshapes\":[");
            for (int i = 0; i < blendshapeEntries.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append($"{{\"name\":\"{EscapeJson(blendshapeEntries[i].Key)}\",\"value\":{blendshapeEntries[i].Value.ToString(System.Globalization.CultureInfo.InvariantCulture)}}}");
            }
            sb.Append("]}");

            return new ToolResult
            {
                success = true,
                message = $"Created expression '{expressionName}' with {blendshapeEntries.Count} blendshape(s), saved to '{clipPath}'",
                data = sb.ToString()
            };
        }

        private static ToolResult AddGestureExpression(Dictionary<string, string> p)
        {
            if (!EnsureFaceEmo())
                return Fail(FaceEmoNotInstalledMessage());

            string targetName = GetRequiredParam(p, "target");
            string gesture = GetRequiredParam(p, "gesture");
            string expressionClip = GetRequiredParam(p, "expression_clip");

            GameObject target = FindByNameOrId(targetName);
            if (target == null)
                return Fail($"GameObject not found: {targetName}");

            // Validate gesture name
            string[] validGestures = { "Neutral", "Fist", "HandOpen", "FingerPoint", "Victory", "RockNRoll", "HandGun", "ThumbsUp" };
            bool gestureValid = false;
            string normalizedGesture = "";
            foreach (string g in validGestures)
            {
                if (g.Equals(gesture, StringComparison.OrdinalIgnoreCase))
                {
                    gestureValid = true;
                    normalizedGesture = g;
                    break;
                }
            }

            if (!gestureValid)
                return Fail($"Invalid gesture: {gesture}. Valid gestures: {string.Join(", ", validGestures)}");

            // Load the expression clip
            AnimationClip clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(expressionClip);
            if (clip == null)
                return Fail($"Animation clip not found at path: {expressionClip}");

            string hand = GetParam(p, "hand", "Left");
            if (!hand.Equals("Left", StringComparison.OrdinalIgnoreCase) &&
                !hand.Equals("Right", StringComparison.OrdinalIgnoreCase))
            {
                hand = "Left";
            }

            // Try to configure via FaceEmo reflection
            bool configuredViaAPI = false;
            if (_gestureExpressionType != null)
            {
                try
                {
                    // Look for a method to set gesture mapping
                    MethodInfo setMethod = _gestureExpressionType.GetMethod("SetGesture",
                        BindingFlags.Public | BindingFlags.Static | BindingFlags.Instance);
                    if (setMethod != null)
                    {
                        // Try invoking
                        setMethod.Invoke(null, new object[] { normalizedGesture, clip });
                        configuredViaAPI = true;
                    }
                }
                catch { /* fallback below */ }
            }

            return new ToolResult
            {
                success = true,
                message = configuredViaAPI
                    ? $"Mapped {hand} hand gesture '{normalizedGesture}' to expression clip '{clip.name}'"
                    : $"Prepared gesture mapping: {hand} hand '{normalizedGesture}' -> '{clip.name}'. Apply in FaceEmo editor window for full integration.",
                data = $"{{\"gesture\":\"{EscapeJson(normalizedGesture)}\",\"hand\":\"{EscapeJson(hand)}\",\"clip\":\"{EscapeJson(expressionClip)}\",\"configuredViaAPI\":{(configuredViaAPI ? "true" : "false")}}}"
            };
        }

        private static ToolResult CreateExpressionPreset(Dictionary<string, string> p)
        {
            if (!EnsureFaceEmo())
                return Fail(FaceEmoNotInstalledMessage());

            string targetName = GetRequiredParam(p, "target");
            GameObject target = FindByNameOrId(targetName);
            if (target == null)
                return Fail($"GameObject not found: {targetName}");

            string outputDir = GetParam(p, "output_dir", "Assets/FaceEmo/Expressions");

            // Ensure directory
            if (!AssetDatabase.IsValidFolder(outputDir))
            {
                string[] folders = outputDir.Replace("\\", "/").Split('/');
                string currentPath = folders[0];
                for (int i = 1; i < folders.Length; i++)
                {
                    string next = currentPath + "/" + folders[i];
                    if (!AssetDatabase.IsValidFolder(next))
                    {
                        AssetDatabase.CreateFolder(currentPath, folders[i]);
                    }
                    currentPath = next;
                }
            }

            // Standard expression presets with typical blendshape mappings
            var presets = new Dictionary<string, Dictionary<string, float>>
            {
                { "smile", new Dictionary<string, float> {
                    { "mouth_smile", 100f }, { "mouth_smile_L", 100f }, { "mouth_smile_R", 100f },
                    { "eye_smile", 80f }, { "eye_smile_L", 80f }, { "eye_smile_R", 80f }
                }},
                { "sad", new Dictionary<string, float> {
                    { "mouth_sad", 100f }, { "brow_sad", 100f }, { "brow_sad_L", 100f }, { "brow_sad_R", 100f },
                    { "eye_sad", 60f }
                }},
                { "angry", new Dictionary<string, float> {
                    { "mouth_angry", 100f }, { "brow_angry", 100f }, { "brow_angry_L", 100f }, { "brow_angry_R", 100f },
                    { "eye_angry", 80f }
                }},
                { "surprised", new Dictionary<string, float> {
                    { "mouth_surprised", 100f }, { "mouth_open", 80f },
                    { "brow_surprised", 100f }, { "eye_wide", 100f }, { "eye_wide_L", 100f }, { "eye_wide_R", 100f }
                }},
                { "shy", new Dictionary<string, float> {
                    { "mouth_smile", 40f }, { "cheek_blush", 100f },
                    { "eye_shy", 80f }, { "brow_shy", 60f }
                }},
                { "wink", new Dictionary<string, float> {
                    { "mouth_smile", 60f }, { "eye_close_R", 100f },
                    { "mouth_smile_L", 60f }
                }},
                { "smug", new Dictionary<string, float> {
                    { "mouth_smug", 100f }, { "mouth_smile_L", 80f },
                    { "brow_up_R", 80f }, { "eye_narrow", 40f }
                }},
                { "neutral", new Dictionary<string, float>() }
            };

            // Scan available blendshapes on the target
            SkinnedMeshRenderer smr = target.GetComponentInChildren<SkinnedMeshRenderer>();
            HashSet<string> availableBS = new HashSet<string>();
            if (smr != null && smr.sharedMesh != null)
            {
                for (int i = 0; i < smr.sharedMesh.blendShapeCount; i++)
                {
                    availableBS.Add(smr.sharedMesh.GetBlendShapeName(i));
                }
            }

            string meshPath = "";
            if (smr != null)
            {
                meshPath = GetRelativePath(target.transform, smr.transform);
            }

            var createdClips = new List<string>();
            var skippedPresets = new List<string>();

            foreach (var preset in presets)
            {
                string clipPath = $"{outputDir}/{preset.Key}.anim";
                AnimationClip clip = new AnimationClip();
                clip.name = preset.Key;

                int appliedCount = 0;

                foreach (var bs in preset.Value)
                {
                    // Try exact name and common variations
                    string matchedName = FindMatchingBlendshape(bs.Key, availableBS);
                    if (matchedName != null)
                    {
                        AnimationCurve curve = AnimationCurve.Constant(0f, 0f, bs.Value);
                        clip.SetCurve(meshPath, typeof(SkinnedMeshRenderer), $"blendShape.{matchedName}", curve);
                        appliedCount++;
                    }
                }

                if (appliedCount > 0 || preset.Key == "neutral")
                {
                    AssetDatabase.CreateAsset(clip, clipPath);
                    createdClips.Add($"{{\"name\":\"{EscapeJson(preset.Key)}\",\"path\":\"{EscapeJson(clipPath)}\",\"blendshapeCount\":{appliedCount}}}");
                }
                else
                {
                    UnityEngine.Object.DestroyImmediate(clip);
                    skippedPresets.Add(preset.Key);
                }
            }

            AssetDatabase.SaveAssets();

            var sb = new StringBuilder("{");
            sb.Append("\"created\":[");
            sb.Append(string.Join(",", createdClips));
            sb.Append("],\"skipped\":[");
            for (int i = 0; i < skippedPresets.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append($"\"{EscapeJson(skippedPresets[i])}\"");
            }
            sb.Append($"],\"availableBlendshapes\":{availableBS.Count}");
            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Created {createdClips.Count} expression preset(s), skipped {skippedPresets.Count} (no matching blendshapes)",
                data = sb.ToString()
            };
        }

        private static ToolResult ListExpressions(Dictionary<string, string> p)
        {
            if (!EnsureFaceEmo())
                return Fail(FaceEmoNotInstalledMessage());

            string targetName = GetRequiredParam(p, "target");
            GameObject target = FindByNameOrId(targetName);
            if (target == null)
                return Fail($"GameObject not found: {targetName}");

            // Search for FaceEmo-related components on the target and its hierarchy
            var expressions = new List<string>();

            // Also check for animation clips in a FaceEmo directory
            string searchDir = GetParam(p, "search_dir", "Assets/FaceEmo");
            if (AssetDatabase.IsValidFolder(searchDir))
            {
                string[] guids = AssetDatabase.FindAssets("t:AnimationClip", new[] { searchDir });
                foreach (string guid in guids)
                {
                    string path = AssetDatabase.GUIDToAssetPath(guid);
                    AnimationClip clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(path);
                    if (clip == null) continue;

                    var bindings = AnimationUtility.GetCurveBindings(clip);
                    var blendshapes = new List<string>();
                    foreach (var binding in bindings)
                    {
                        if (binding.propertyName.StartsWith("blendShape."))
                        {
                            string bsName = binding.propertyName.Substring("blendShape.".Length);
                            AnimationCurve curve = AnimationUtility.GetEditorCurve(clip, binding);
                            float value = curve != null && curve.length > 0 ? curve[0].value : 0f;
                            blendshapes.Add($"{{\"name\":\"{EscapeJson(bsName)}\",\"value\":{value.ToString(System.Globalization.CultureInfo.InvariantCulture)}}}");
                        }
                    }

                    var entrySb = new StringBuilder("{");
                    entrySb.Append($"\"name\":\"{EscapeJson(clip.name)}\",");
                    entrySb.Append($"\"path\":\"{EscapeJson(path)}\",");
                    entrySb.Append("\"blendshapes\":[");
                    entrySb.Append(string.Join(",", blendshapes));
                    entrySb.Append("]}");
                    expressions.Add(entrySb.ToString());
                }
            }

            // Also scan FaceEmo components via reflection
            CollectFaceEmoExpressions(target, expressions);

            var sb = new StringBuilder("[");
            sb.Append(string.Join(",", expressions));
            sb.Append("]");

            return new ToolResult
            {
                success = true,
                message = $"Found {expressions.Count} expression(s)",
                data = sb.ToString()
            };
        }

        private static void CollectFaceEmoExpressions(GameObject root, List<string> expressions)
        {
            Component[] components = root.GetComponentsInChildren<Component>(true);
            foreach (Component c in components)
            {
                if (c == null) continue;
                string fullName = c.GetType().FullName ?? "";
                if (!fullName.Contains("FaceEmo") && !fullName.Contains("Suzuryg")) continue;

                var so = new SerializedObject(c);
                SerializedProperty prop = so.GetIterator();
                var propData = new StringBuilder("{");
                propData.Append($"\"type\":\"{EscapeJson(c.GetType().Name)}\",");
                propData.Append($"\"gameObject\":\"{EscapeJson(c.gameObject.name)}\",");
                propData.Append("\"properties\":{");
                bool firstProp = true;
                if (prop.NextVisible(true))
                {
                    do
                    {
                        if (prop.name == "m_Script") continue;
                        if (!firstProp) propData.Append(",");
                        firstProp = false;
                        propData.Append($"\"{EscapeJson(prop.name)}\":\"{EscapeJson(SerializedPropertyToString(prop))}\"");
                    }
                    while (prop.NextVisible(false));
                }
                propData.Append("}}");
                so.Dispose();
                expressions.Add(propData.ToString());
            }
        }

        private static ToolResult RemoveExpression(Dictionary<string, string> p)
        {
            if (!EnsureFaceEmo())
                return Fail(FaceEmoNotInstalledMessage());

            string expressionName = GetRequiredParam(p, "expression_name");

            // Try to remove by clip path
            string clipPath = GetParam(p, "clip_path", "");
            if (string.IsNullOrEmpty(clipPath))
            {
                // Search for the clip in default directory
                string searchDir = GetParam(p, "search_dir", "Assets/FaceEmo");
                if (AssetDatabase.IsValidFolder(searchDir))
                {
                    string[] guids = AssetDatabase.FindAssets($"{expressionName} t:AnimationClip", new[] { searchDir });
                    foreach (string guid in guids)
                    {
                        string path = AssetDatabase.GUIDToAssetPath(guid);
                        AnimationClip clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(path);
                        if (clip != null && clip.name.Equals(expressionName, StringComparison.OrdinalIgnoreCase))
                        {
                            clipPath = path;
                            break;
                        }
                    }
                }
            }

            if (!string.IsNullOrEmpty(clipPath))
            {
                bool deleted = AssetDatabase.DeleteAsset(clipPath);
                if (deleted)
                {
                    return new ToolResult
                    {
                        success = true,
                        message = $"Removed expression '{expressionName}' (deleted clip at '{clipPath}')"
                    };
                }
                else
                {
                    return Fail($"Failed to delete expression clip at '{clipPath}'");
                }
            }

            return Fail($"Expression '{expressionName}' not found. Specify clip_path or ensure the clip is in the search directory.");
        }

        private static ToolResult AutoDetectBlendshapes(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            GameObject target = FindByNameOrId(targetName);
            if (target == null)
                return Fail($"GameObject not found: {targetName}");

            SkinnedMeshRenderer[] smrs = target.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            if (smrs.Length == 0)
                return Fail($"No SkinnedMeshRenderers found on '{targetName}' or its children");

            var meshResults = new List<string>();

            foreach (SkinnedMeshRenderer smr in smrs)
            {
                if (smr.sharedMesh == null) continue;

                var categories = new Dictionary<string, List<string>>
                {
                    { "eye", new List<string>() },
                    { "mouth", new List<string>() },
                    { "brow", new List<string>() },
                    { "cheek", new List<string>() },
                    { "nose", new List<string>() },
                    { "tongue", new List<string>() },
                    { "emotion", new List<string>() },
                    { "other", new List<string>() }
                };

                for (int i = 0; i < smr.sharedMesh.blendShapeCount; i++)
                {
                    string bsName = smr.sharedMesh.GetBlendShapeName(i);
                    string lower = bsName.ToLower();

                    string category = "other";
                    if (lower.Contains("eye") || lower.Contains("blink") || lower.Contains("wink") ||
                        lower.Contains("iris") || lower.Contains("pupil") || lower.Contains("eyelid"))
                    {
                        category = "eye";
                    }
                    else if (lower.Contains("mouth") || lower.Contains("lip") || lower.Contains("jaw") ||
                             lower.Contains("teeth") || lower.Contains("smile") || lower.Contains("frown") ||
                             lower.Contains("vrc.v_"))
                    {
                        category = "mouth";
                    }
                    else if (lower.Contains("brow") || lower.Contains("forehead"))
                    {
                        category = "brow";
                    }
                    else if (lower.Contains("cheek") || lower.Contains("blush"))
                    {
                        category = "cheek";
                    }
                    else if (lower.Contains("nose"))
                    {
                        category = "nose";
                    }
                    else if (lower.Contains("tongue"))
                    {
                        category = "tongue";
                    }
                    else if (lower.Contains("happy") || lower.Contains("sad") || lower.Contains("angry") ||
                             lower.Contains("surprise") || lower.Contains("joy") || lower.Contains("fear") ||
                             lower.Contains("disgust") || lower.Contains("fun") || lower.Contains("sorrow"))
                    {
                        category = "emotion";
                    }

                    float currentValue = smr.GetBlendShapeWeight(i);
                    categories[category].Add($"{{\"name\":\"{EscapeJson(bsName)}\",\"index\":{i},\"currentValue\":{currentValue.ToString(System.Globalization.CultureInfo.InvariantCulture)}}}");
                }

                var meshSb = new StringBuilder("{");
                meshSb.Append($"\"mesh\":\"{EscapeJson(smr.gameObject.name)}\",");
                meshSb.Append($"\"path\":\"{EscapeJson(GetGameObjectPath(smr.gameObject))}\",");
                meshSb.Append($"\"totalBlendshapes\":{smr.sharedMesh.blendShapeCount},");
                meshSb.Append("\"categories\":{");

                bool firstCat = true;
                foreach (var cat in categories)
                {
                    if (cat.Value.Count == 0) continue;
                    if (!firstCat) meshSb.Append(",");
                    firstCat = false;
                    meshSb.Append($"\"{cat.Key}\":[{string.Join(",", cat.Value)}]");
                }

                meshSb.Append("}}");
                meshResults.Add(meshSb.ToString());
            }

            var resultSb = new StringBuilder("[");
            resultSb.Append(string.Join(",", meshResults));
            resultSb.Append("]");

            int totalBS = 0;
            foreach (var smr in smrs)
            {
                if (smr.sharedMesh != null) totalBS += smr.sharedMesh.blendShapeCount;
            }

            return new ToolResult
            {
                success = true,
                message = $"Scanned {smrs.Length} mesh(es), found {totalBS} blendshape(s) total",
                data = resultSb.ToString()
            };
        }

        // --- Internal Helpers ---

        private static string FindMatchingBlendshape(string desired, HashSet<string> available)
        {
            // Exact match
            if (available.Contains(desired)) return desired;

            // Case-insensitive match
            foreach (string bs in available)
            {
                if (bs.Equals(desired, StringComparison.OrdinalIgnoreCase))
                    return bs;
            }

            // Partial match (the desired name is contained in an available blendshape)
            foreach (string bs in available)
            {
                if (bs.IndexOf(desired, StringComparison.OrdinalIgnoreCase) >= 0)
                    return bs;
            }

            return null;
        }

        private static string GetRelativePath(Transform root, Transform target)
        {
            if (root == target) return "";

            string path = target.name;
            Transform current = target.parent;
            while (current != null && current != root)
            {
                path = current.name + "/" + path;
                current = current.parent;
            }
            return path;
        }

        private static string GetGameObjectPath(GameObject go)
        {
            string path = go.name;
            Transform parent = go.transform.parent;
            while (parent != null)
            {
                path = parent.name + "/" + path;
                parent = parent.parent;
            }
            return path;
        }

        private static string SerializedPropertyToString(SerializedProperty prop)
        {
            switch (prop.propertyType)
            {
                case SerializedPropertyType.Integer: return prop.intValue.ToString();
                case SerializedPropertyType.Boolean: return prop.boolValue.ToString();
                case SerializedPropertyType.Float: return prop.floatValue.ToString(System.Globalization.CultureInfo.InvariantCulture);
                case SerializedPropertyType.String: return prop.stringValue ?? "";
                case SerializedPropertyType.Enum:
                    return prop.enumDisplayNames.Length > prop.enumValueIndex && prop.enumValueIndex >= 0
                        ? prop.enumDisplayNames[prop.enumValueIndex] : prop.enumValueIndex.ToString();
                case SerializedPropertyType.ObjectReference:
                    return prop.objectReferenceValue != null ? prop.objectReferenceValue.name : "null";
                default: return prop.propertyType.ToString();
            }
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
                if (go.scene.isLoaded && go.name == nameOrId)
                    return go;
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
