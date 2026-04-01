using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class AnimationTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_animator_controller", CreateAnimatorController);
            ToolExecutor.Register("add_animation_state", AddAnimationState);
            ToolExecutor.Register("set_transition", SetTransition);
            ToolExecutor.Register("create_blend_tree", CreateBlendTree);
            ToolExecutor.Register("add_animation_event", AddAnimationEvent);
            ToolExecutor.Register("set_animation_clip", SetAnimationClip);
            ToolExecutor.Register("play_animation", PlayAnimation);
            ToolExecutor.Register("stop_animation", StopAnimation);
            ToolExecutor.Register("get_animator_info", GetAnimatorInfo);
            ToolExecutor.Register("set_animator_parameter", SetAnimatorParameter);
            ToolExecutor.Register("create_animation_clip", CreateAnimationClip);
            ToolExecutor.Register("set_animation_curve", SetAnimationCurve);
            ToolExecutor.Register("set_avatar_mask", SetAvatarMask);
            ToolExecutor.Register("retarget_animation", RetargetAnimation);
            ToolExecutor.Register("import_mixamo", ImportMixamo);
        }

        private static ToolResult CreateAnimatorController(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "New Animator Controller");
            string path = GetParam(p, "path", $"Assets/{name}.controller");
            if (!path.EndsWith(".controller")) path += ".controller";

            EnsureDirectoryExists(path);
            AnimatorController controller = AnimatorController.CreateAnimatorControllerAtPath(path);
            controller.name = name;

            string target = GetParam(p, "target", "");
            if (!string.IsNullOrEmpty(target))
            {
                GameObject go = FindByNameOrId(target);
                if (go != null)
                {
                    Animator animator = go.GetComponent<Animator>();
                    if (animator == null)
                        animator = Undo.AddComponent<Animator>(go);
                    Undo.RecordObject(animator, "Assign animator controller");
                    animator.runtimeAnimatorController = controller;
                }
            }

            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Created animator controller '{name}' at {path}",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"path\":\"{EscapeJson(path)}\"}}"
            };
        }

        private static ToolResult AddAnimationState(Dictionary<string, string> p)
        {
            string controllerPath = GetRequiredParam(p, "controller");
            string stateName = GetRequiredParam(p, "state_name");
            string clipPath = GetParam(p, "clip", "");
            int layerIndex = int.Parse(GetParam(p, "layer", "0"));

            AnimatorController controller = AssetDatabase.LoadAssetAtPath<AnimatorController>(controllerPath);
            if (controller == null)
                return Fail($"Animator controller not found at: {controllerPath}");

            if (layerIndex < 0 || layerIndex >= controller.layers.Length)
                return Fail($"Layer index {layerIndex} out of range. Controller has {controller.layers.Length} layer(s).");

            AnimatorStateMachine stateMachine = controller.layers[layerIndex].stateMachine;

            AnimatorState state = stateMachine.AddState(stateName);

            if (!string.IsNullOrEmpty(clipPath))
            {
                AnimationClip clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(clipPath);
                if (clip != null)
                {
                    state.motion = clip;
                }
            }

            bool isDefault = GetParam(p, "is_default", "false") == "true";
            if (isDefault)
            {
                stateMachine.defaultState = state;
            }

            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Added state '{stateName}' to layer {layerIndex}",
                data = $"{{\"state\":\"{EscapeJson(stateName)}\",\"layer\":{layerIndex}}}"
            };
        }

        private static ToolResult SetTransition(Dictionary<string, string> p)
        {
            string controllerPath = GetRequiredParam(p, "controller");
            string fromState = GetRequiredParam(p, "from");
            string toState = GetRequiredParam(p, "to");
            int layerIndex = int.Parse(GetParam(p, "layer", "0"));
            bool hasExitTime = GetParam(p, "has_exit_time", "true") != "false";
            float exitTime = float.Parse(GetParam(p, "exit_time", "1"), System.Globalization.CultureInfo.InvariantCulture);
            float duration = float.Parse(GetParam(p, "duration", "0.25"), System.Globalization.CultureInfo.InvariantCulture);

            AnimatorController controller = AssetDatabase.LoadAssetAtPath<AnimatorController>(controllerPath);
            if (controller == null)
                return Fail($"Animator controller not found at: {controllerPath}");

            if (layerIndex < 0 || layerIndex >= controller.layers.Length)
                return Fail($"Layer index {layerIndex} out of range.");

            AnimatorStateMachine sm = controller.layers[layerIndex].stateMachine;

            AnimatorState srcState = null;
            AnimatorState dstState = null;

            foreach (ChildAnimatorState child in sm.states)
            {
                if (child.state.name == fromState) srcState = child.state;
                if (child.state.name == toState) dstState = child.state;
            }

            if (srcState == null)
                return Fail($"Source state '{fromState}' not found");
            if (dstState == null)
                return Fail($"Destination state '{toState}' not found");

            AnimatorStateTransition transition = srcState.AddTransition(dstState);
            transition.hasExitTime = hasExitTime;
            transition.exitTime = exitTime;
            transition.duration = duration;
            transition.hasFixedDuration = true;

            string conditionParam = GetParam(p, "condition_param", "");
            if (!string.IsNullOrEmpty(conditionParam))
            {
                string conditionMode = GetParam(p, "condition_mode", "If");
                AnimatorConditionMode mode = AnimatorConditionMode.If;
                Enum.TryParse(conditionMode, true, out mode);
                float threshold = float.Parse(GetParam(p, "condition_threshold", "0"), System.Globalization.CultureInfo.InvariantCulture);
                transition.AddCondition(mode, threshold, conditionParam);
            }

            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Created transition from '{fromState}' to '{toState}'"
            };
        }

        private static ToolResult CreateBlendTree(Dictionary<string, string> p)
        {
            string controllerPath = GetRequiredParam(p, "controller");
            string treeName = GetParam(p, "name", "Blend Tree");
            string blendParam = GetParam(p, "parameter", "Speed");
            string blendType = GetParam(p, "blend_type", "Simple1D");
            int layerIndex = int.Parse(GetParam(p, "layer", "0"));

            AnimatorController controller = AssetDatabase.LoadAssetAtPath<AnimatorController>(controllerPath);
            if (controller == null)
                return Fail($"Animator controller not found at: {controllerPath}");

            if (layerIndex < 0 || layerIndex >= controller.layers.Length)
                return Fail($"Layer index {layerIndex} out of range.");

            bool paramExists = false;
            foreach (var param in controller.parameters)
            {
                if (param.name == blendParam) { paramExists = true; break; }
            }
            if (!paramExists)
            {
                controller.AddParameter(blendParam, AnimatorControllerParameterType.Float);
            }

            BlendTree tree;
            AnimatorState state = controller.CreateBlendTreeInController(treeName, out tree, layerIndex);

            BlendTreeType btType = BlendTreeType.Simple1D;
            Enum.TryParse(blendType, true, out btType);
            tree.blendType = btType;
            tree.blendParameter = blendParam;

            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Created blend tree '{treeName}' with parameter '{blendParam}'",
                data = $"{{\"name\":\"{EscapeJson(treeName)}\",\"parameter\":\"{EscapeJson(blendParam)}\",\"blendType\":\"{blendType}\"}}"
            };
        }

        private static ToolResult AddAnimationEvent(Dictionary<string, string> p)
        {
            string clipPath = GetRequiredParam(p, "clip");
            string functionName = GetRequiredParam(p, "function");
            float time = float.Parse(GetParam(p, "time", "0"), System.Globalization.CultureInfo.InvariantCulture);

            AnimationClip clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(clipPath);
            if (clip == null)
                return Fail($"Animation clip not found at: {clipPath}");

            AnimationEvent evt = new AnimationEvent();
            evt.functionName = functionName;
            evt.time = time;

            string stringParam = GetParam(p, "string_param", "");
            if (!string.IsNullOrEmpty(stringParam))
                evt.stringParameter = stringParam;

            string floatParam = GetParam(p, "float_param", "");
            if (!string.IsNullOrEmpty(floatParam))
                evt.floatParameter = float.Parse(floatParam, System.Globalization.CultureInfo.InvariantCulture);

            string intParam = GetParam(p, "int_param", "");
            if (!string.IsNullOrEmpty(intParam))
                evt.intParameter = int.Parse(intParam);

            AnimationEvent[] existingEvents = AnimationUtility.GetAnimationEvents(clip);
            AnimationEvent[] newEvents = new AnimationEvent[existingEvents.Length + 1];
            Array.Copy(existingEvents, newEvents, existingEvents.Length);
            newEvents[newEvents.Length - 1] = evt;

            AnimationUtility.SetAnimationEvents(clip, newEvents);
            EditorUtility.SetDirty(clip);
            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Added animation event '{functionName}' at time {time}s to '{clip.name}'"
            };
        }

        private static ToolResult SetAnimationClip(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string clipPath = GetRequiredParam(p, "clip");
            string stateName = GetParam(p, "state", "");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Animator animator = go.GetComponent<Animator>();
            if (animator == null)
                return Fail($"No Animator component on '{targetName}'");

            AnimationClip clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(clipPath);
            if (clip == null)
                return Fail($"Animation clip not found at: {clipPath}");

            AnimatorController controller = animator.runtimeAnimatorController as AnimatorController;
            if (controller == null)
                return Fail("Animator does not have an AnimatorController assigned");

            AnimatorStateMachine sm = controller.layers[0].stateMachine;
            bool found = false;

            foreach (ChildAnimatorState child in sm.states)
            {
                if (string.IsNullOrEmpty(stateName) || child.state.name == stateName)
                {
                    child.state.motion = clip;
                    found = true;
                    break;
                }
            }

            if (!found)
                return Fail($"State '{stateName}' not found in animator controller");

            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Set animation clip '{clip.name}' on '{targetName}'"
            };
        }

        private static ToolResult PlayAnimation(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string stateName = GetRequiredParam(p, "state");
            int layer = int.Parse(GetParam(p, "layer", "0"));

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Animator animator = go.GetComponent<Animator>();
            if (animator == null)
                return Fail($"No Animator component on '{targetName}'");

            animator.Play(stateName, layer);

            return new ToolResult
            {
                success = true,
                message = $"Playing state '{stateName}' on '{targetName}'"
            };
        }

        private static ToolResult StopAnimation(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Animator animator = go.GetComponent<Animator>();
            if (animator == null)
                return Fail($"No Animator component on '{targetName}'");

            animator.enabled = false;
            animator.enabled = true;

            return new ToolResult
            {
                success = true,
                message = $"Stopped animation on '{targetName}'"
            };
        }

        private static ToolResult GetAnimatorInfo(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Animator animator = go.GetComponent<Animator>();
            if (animator == null)
                return Fail($"No Animator component on '{targetName}'");

            StringBuilder sb = new StringBuilder();
            sb.Append("{");
            sb.Append($"\"gameObject\":\"{EscapeJson(go.name)}\",");
            sb.Append($"\"hasController\":{(animator.runtimeAnimatorController != null ? "true" : "false")},");
            sb.Append($"\"isHuman\":{(animator.isHuman ? "true" : "false")},");
            sb.Append($"\"layerCount\":{animator.layerCount},");

            AnimatorController controller = animator.runtimeAnimatorController as AnimatorController;
            if (controller != null)
            {
                sb.Append($"\"controllerName\":\"{EscapeJson(controller.name)}\",");

                sb.Append("\"parameters\":[");
                for (int i = 0; i < controller.parameters.Length; i++)
                {
                    if (i > 0) sb.Append(",");
                    var param = controller.parameters[i];
                    sb.Append($"{{\"name\":\"{EscapeJson(param.name)}\",\"type\":\"{param.type}\"}}");
                }
                sb.Append("],");

                sb.Append("\"layers\":[");
                for (int i = 0; i < controller.layers.Length; i++)
                {
                    if (i > 0) sb.Append(",");
                    var layer = controller.layers[i];
                    sb.Append($"{{\"name\":\"{EscapeJson(layer.name)}\",\"states\":[");
                    var states = layer.stateMachine.states;
                    for (int j = 0; j < states.Length; j++)
                    {
                        if (j > 0) sb.Append(",");
                        sb.Append($"\"{EscapeJson(states[j].state.name)}\"");
                    }
                    sb.Append("]}");
                }
                sb.Append("]");
            }
            else
            {
                sb.Append("\"controllerName\":\"none\",\"parameters\":[],\"layers\":[]");
            }

            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Animator info for '{go.name}'",
                data = sb.ToString()
            };
        }

        private static ToolResult SetAnimatorParameter(Dictionary<string, string> p)
        {
            string controllerPath = GetParam(p, "controller", "");
            string paramName = GetRequiredParam(p, "param_name");
            string paramType = GetRequiredParam(p, "param_type");
            string defaultValue = GetParam(p, "default_value", "");

            AnimatorController controller = null;

            if (!string.IsNullOrEmpty(controllerPath))
            {
                controller = AssetDatabase.LoadAssetAtPath<AnimatorController>(controllerPath);
            }
            else
            {
                string targetName = GetParam(p, "target", "");
                if (!string.IsNullOrEmpty(targetName))
                {
                    GameObject go = FindByNameOrId(targetName);
                    if (go != null)
                    {
                        Animator animator = go.GetComponent<Animator>();
                        if (animator != null)
                            controller = animator.runtimeAnimatorController as AnimatorController;
                    }
                }
            }

            if (controller == null)
                return Fail("Animator controller not found. Specify 'controller' path or 'target' GameObject.");

            AnimatorControllerParameterType type;
            switch (paramType.ToLower())
            {
                case "float": type = AnimatorControllerParameterType.Float; break;
                case "int": type = AnimatorControllerParameterType.Int; break;
                case "bool": type = AnimatorControllerParameterType.Bool; break;
                case "trigger": type = AnimatorControllerParameterType.Trigger; break;
                default: return Fail($"Unknown parameter type: {paramType}. Use float, int, bool, or trigger.");
            }

            foreach (var existing in controller.parameters)
            {
                if (existing.name == paramName)
                {
                    return Fail($"Parameter '{paramName}' already exists in the controller.");
                }
            }

            controller.AddParameter(paramName, type);

            if (!string.IsNullOrEmpty(defaultValue))
            {
                var parameters = controller.parameters;
                var param = parameters[parameters.Length - 1];
                switch (type)
                {
                    case AnimatorControllerParameterType.Float:
                        param.defaultFloat = float.Parse(defaultValue, System.Globalization.CultureInfo.InvariantCulture);
                        break;
                    case AnimatorControllerParameterType.Int:
                        param.defaultInt = int.Parse(defaultValue);
                        break;
                    case AnimatorControllerParameterType.Bool:
                        param.defaultBool = defaultValue.ToLower() == "true";
                        break;
                }
                controller.parameters = parameters;
            }

            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Added parameter '{paramName}' ({paramType}) to animator controller"
            };
        }

        private static ToolResult CreateAnimationClip(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "New Clip");
            string path = GetParam(p, "path", $"Assets/{name}.anim");
            if (!path.EndsWith(".anim")) path += ".anim";
            bool loop = GetParam(p, "loop", "false") == "true";
            float length = float.Parse(GetParam(p, "length", "1"), System.Globalization.CultureInfo.InvariantCulture);

            EnsureDirectoryExists(path);

            AnimationClip clip = new AnimationClip();
            clip.name = name;

            if (loop)
            {
                AnimationClipSettings settings = AnimationUtility.GetAnimationClipSettings(clip);
                settings.loopTime = true;
                AnimationUtility.SetAnimationClipSettings(clip, settings);
            }

            AssetDatabase.CreateAsset(clip, path);
            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Created animation clip '{name}' at {path} (length: {length}s, loop: {loop})",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"path\":\"{EscapeJson(path)}\",\"loop\":{(loop ? "true" : "false")}}}"
            };
        }

        private static ToolResult SetAnimationCurve(Dictionary<string, string> p)
        {
            string clipPath = GetRequiredParam(p, "clip");
            string propertyName = GetRequiredParam(p, "property");
            string typeName = GetParam(p, "type", "Transform");
            string relativePath = GetParam(p, "relative_path", "");
            string keysStr = GetRequiredParam(p, "keys");

            AnimationClip clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(clipPath);
            if (clip == null)
                return Fail($"Animation clip not found at: {clipPath}");

            string[] keyPairs = keysStr.Split(';');
            Keyframe[] keyframes = new Keyframe[keyPairs.Length];
            for (int i = 0; i < keyPairs.Length; i++)
            {
                string[] kv = keyPairs[i].Trim().Split(',');
                if (kv.Length < 2)
                    return Fail($"Invalid key format at index {i}. Expected 'time,value' pairs separated by semicolons.");
                float time = float.Parse(kv[0].Trim(), System.Globalization.CultureInfo.InvariantCulture);
                float value = float.Parse(kv[1].Trim(), System.Globalization.CultureInfo.InvariantCulture);
                keyframes[i] = new Keyframe(time, value);
            }

            AnimationCurve curve = new AnimationCurve(keyframes);

            Type compType = FindType(typeName);
            if (compType == null)
                return Fail($"Type not found: {typeName}");

            clip.SetCurve(relativePath, compType, propertyName, curve);
            EditorUtility.SetDirty(clip);
            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Set animation curve for '{propertyName}' on clip '{clip.name}' ({keyframes.Length} keyframes)"
            };
        }

        private static ToolResult SetAvatarMask(Dictionary<string, string> p)
        {
            string controllerPath = GetRequiredParam(p, "controller");
            int layerIndex = int.Parse(GetParam(p, "layer", "0"));
            string maskPath = GetParam(p, "mask_path", "");

            AnimatorController controller = AssetDatabase.LoadAssetAtPath<AnimatorController>(controllerPath);
            if (controller == null)
                return Fail($"Animator controller not found at: {controllerPath}");

            if (layerIndex < 0 || layerIndex >= controller.layers.Length)
                return Fail($"Layer index {layerIndex} out of range.");

            AvatarMask mask = null;

            if (!string.IsNullOrEmpty(maskPath))
            {
                mask = AssetDatabase.LoadAssetAtPath<AvatarMask>(maskPath);
                if (mask == null)
                    return Fail($"Avatar mask not found at: {maskPath}");
            }
            else
            {
                string maskName = GetParam(p, "name", "New Avatar Mask");
                string newPath = GetParam(p, "path", $"Assets/{maskName}.mask");
                EnsureDirectoryExists(newPath);
                mask = new AvatarMask();
                mask.name = maskName;
                AssetDatabase.CreateAsset(mask, newPath);
            }

            var layers = controller.layers;
            layers[layerIndex].avatarMask = mask;
            controller.layers = layers;

            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Set avatar mask on layer {layerIndex} of '{controller.name}'"
            };
        }

        private static ToolResult RetargetAnimation(Dictionary<string, string> p)
        {
            string clipPath = GetRequiredParam(p, "clip");
            string targetPath = GetRequiredParam(p, "target_avatar");

            AnimationClip clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(clipPath);
            if (clip == null)
                return Fail($"Animation clip not found at: {clipPath}");

            Avatar targetAvatar = AssetDatabase.LoadAssetAtPath<Avatar>(targetPath);
            if (targetAvatar == null)
            {
                GameObject model = AssetDatabase.LoadAssetAtPath<GameObject>(targetPath);
                if (model != null)
                {
                    Animator anim = model.GetComponent<Animator>();
                    if (anim != null)
                        targetAvatar = anim.avatar;
                }
            }

            if (targetAvatar == null)
                return Fail($"Target avatar not found at: {targetPath}");

            ModelImporter importer = AssetImporter.GetAtPath(clipPath) as ModelImporter;
            if (importer != null)
            {
                importer.sourceAvatar = targetAvatar;
                importer.SaveAndReimport();
            }

            return new ToolResult
            {
                success = true,
                message = $"Retargeted clip '{clip.name}' to avatar '{targetAvatar.name}'"
            };
        }

        private static ToolResult ImportMixamo(Dictionary<string, string> p)
        {
            string fbxPath = GetRequiredParam(p, "path");

            if (!System.IO.File.Exists(fbxPath))
                return Fail($"FBX file not found at: {fbxPath}");

            ModelImporter importer = AssetImporter.GetAtPath(fbxPath) as ModelImporter;
            if (importer == null)
                return Fail($"Could not get importer for: {fbxPath}");

            importer.animationType = ModelImporterAnimationType.Human;
            importer.importAnimation = true;

            bool convertToLoop = GetParam(p, "loop", "false") == "true";

            ModelImporterClipAnimation[] clipAnimations = importer.defaultClipAnimations;
            if (clipAnimations.Length > 0 && convertToLoop)
            {
                for (int i = 0; i < clipAnimations.Length; i++)
                {
                    clipAnimations[i].loopTime = true;
                }
                importer.clipAnimations = clipAnimations;
            }

            string renameClip = GetParam(p, "rename", "");
            if (!string.IsNullOrEmpty(renameClip) && clipAnimations.Length > 0)
            {
                clipAnimations[0].name = renameClip;
                importer.clipAnimations = clipAnimations;
            }

            importer.SaveAndReimport();

            return new ToolResult
            {
                success = true,
                message = $"Imported Mixamo animation from '{fbxPath}' (humanoid, loop={convertToLoop})",
                data = $"{{\"path\":\"{EscapeJson(fbxPath)}\",\"clips\":{clipAnimations.Length}}}"
            };
        }

        // --- Helpers ---

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

        private static Type FindType(string typeName)
        {
            Type t = Type.GetType($"UnityEngine.{typeName}, UnityEngine");
            if (t != null) return t;
            t = Type.GetType($"UnityEngine.{typeName}, UnityEngine.AnimationModule");
            if (t != null) return t;
            t = Type.GetType(typeName);
            if (t != null) return t;
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
