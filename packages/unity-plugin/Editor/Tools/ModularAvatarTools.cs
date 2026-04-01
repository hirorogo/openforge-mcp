using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    /// <summary>
    /// Modular Avatar integration tools using reflection.
    /// All access to Modular Avatar types is done via reflection since it is an optional package.
    /// </summary>
    public static class ModularAvatarTools
    {
        private static bool _maChecked;
        private static bool _maAvailable;
        private static string _maVersion;

        // Cached types from nadena.dev.modular_avatar.core
        private static Type _maMergeArmatureType;
        private static Type _maBoneProxyType;
        private static Type _maMenuItemType;
        private static Type _maObjectToggleType;
        private static Type _maBlendshapeSyncType;
        private static Type _maParametersType;
        private static Type _maMenuInstallerType;
        private static Assembly _maAssembly;

        public static void Register()
        {
            ToolExecutor.Register("setup_modular_avatar", SetupModularAvatar);
            ToolExecutor.Register("add_ma_merge_armature", AddMAMergeArmature);
            ToolExecutor.Register("add_ma_bone_proxy", AddMABoneProxy);
            ToolExecutor.Register("add_ma_menu_item", AddMAMenuItem);
            ToolExecutor.Register("add_ma_toggle", AddMAToggle);
            ToolExecutor.Register("add_ma_blendshape_sync", AddMABlendshapeSync);
            ToolExecutor.Register("add_ma_parameters", AddMAParameters);
            ToolExecutor.Register("remove_ma_component", RemoveMAComponent);
            ToolExecutor.Register("list_ma_components", ListMAComponents);
            ToolExecutor.Register("auto_setup_outfit", AutoSetupOutfit);
        }

        private static bool EnsureMA()
        {
            if (_maChecked) return _maAvailable;
            _maChecked = true;

            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                string asmName = asm.GetName().Name;
                if (asmName == "nadena.dev.modular-avatar.core" || asmName == "nadena.dev.modular_avatar.core")
                {
                    _maAssembly = asm;
                    _maMergeArmatureType = asm.GetType("nadena.dev.modular_avatar.core.ModularAvatarMergeArmature");
                    _maBoneProxyType = asm.GetType("nadena.dev.modular_avatar.core.ModularAvatarBoneProxy");
                    _maMenuItemType = asm.GetType("nadena.dev.modular_avatar.core.ModularAvatarMenuItem");
                    _maObjectToggleType = asm.GetType("nadena.dev.modular_avatar.core.ModularAvatarObjectToggle");
                    _maBlendshapeSyncType = asm.GetType("nadena.dev.modular_avatar.core.ModularAvatarBlendshapeSync");
                    _maParametersType = asm.GetType("nadena.dev.modular_avatar.core.ModularAvatarParameters");
                    _maMenuInstallerType = asm.GetType("nadena.dev.modular_avatar.core.ModularAvatarMenuInstaller");

                    // Try to get version from assembly info
                    var versionAttr = asm.GetName().Version;
                    _maVersion = versionAttr != null ? versionAttr.ToString() : "unknown";

                    break;
                }
            }

            // Fallback: search all assemblies for the merge armature type
            if (_maMergeArmatureType == null)
            {
                foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
                {
                    try
                    {
                        var t = asm.GetType("nadena.dev.modular_avatar.core.ModularAvatarMergeArmature");
                        if (t != null)
                        {
                            _maAssembly = asm;
                            _maMergeArmatureType = t;
                            _maBoneProxyType = asm.GetType("nadena.dev.modular_avatar.core.ModularAvatarBoneProxy");
                            _maMenuItemType = asm.GetType("nadena.dev.modular_avatar.core.ModularAvatarMenuItem");
                            _maObjectToggleType = asm.GetType("nadena.dev.modular_avatar.core.ModularAvatarObjectToggle");
                            _maBlendshapeSyncType = asm.GetType("nadena.dev.modular_avatar.core.ModularAvatarBlendshapeSync");
                            _maParametersType = asm.GetType("nadena.dev.modular_avatar.core.ModularAvatarParameters");
                            _maMenuInstallerType = asm.GetType("nadena.dev.modular_avatar.core.ModularAvatarMenuInstaller");
                            var versionAttr = asm.GetName().Version;
                            _maVersion = versionAttr != null ? versionAttr.ToString() : "unknown";
                            break;
                        }
                    }
                    catch { /* skip assemblies that fail to enumerate */ }
                }
            }

            _maAvailable = _maMergeArmatureType != null;
            return _maAvailable;
        }

        private static string MANotInstalledMessage()
        {
            return "Modular Avatar is not installed. Install via VCC or add nadena.dev.modular-avatar";
        }

        // --- Tool Implementations ---

        private static ToolResult SetupModularAvatar(Dictionary<string, string> p)
        {
            bool available = EnsureMA();
            var sb = new StringBuilder("{");
            sb.Append($"\"installed\":{(available ? "true" : "false")}");

            if (available)
            {
                sb.Append($",\"version\":\"{EscapeJson(_maVersion)}\"");

                // List discovered types
                var types = new List<string>();
                if (_maMergeArmatureType != null) types.Add("MergeArmature");
                if (_maBoneProxyType != null) types.Add("BoneProxy");
                if (_maMenuItemType != null) types.Add("MenuItem");
                if (_maObjectToggleType != null) types.Add("ObjectToggle");
                if (_maBlendshapeSyncType != null) types.Add("BlendshapeSync");
                if (_maParametersType != null) types.Add("Parameters");
                if (_maMenuInstallerType != null) types.Add("MenuInstaller");

                sb.Append(",\"availableComponents\":[");
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
                    ? $"Modular Avatar is installed (version {_maVersion})"
                    : MANotInstalledMessage(),
                data = sb.ToString()
            };
        }

        private static ToolResult AddMAMergeArmature(Dictionary<string, string> p)
        {
            if (!EnsureMA())
                return Fail(MANotInstalledMessage());

            if (_maMergeArmatureType == null)
                return Fail("ModularAvatarMergeArmature type not found in assembly");

            string targetName = GetRequiredParam(p, "target");
            GameObject target = FindByNameOrId(targetName);
            if (target == null)
                return Fail($"GameObject not found: {targetName}");

            // Check if component already exists
            Component existing = target.GetComponent(_maMergeArmatureType);
            if (existing != null)
                return Fail($"'{targetName}' already has a MAMergeArmature component");

            Component comp = Undo.AddComponent(target, _maMergeArmatureType);
            if (comp == null)
                return Fail("Failed to add MAMergeArmature component");

            // Set merge target if specified
            string mergeTargetName = GetParam(p, "merge_target", "");
            if (!string.IsNullOrEmpty(mergeTargetName))
            {
                GameObject mergeTarget = FindByNameOrId(mergeTargetName);
                if (mergeTarget != null)
                {
                    // Try to set mergeTarget field via reflection
                    var field = _maMergeArmatureType.GetField("mergeTarget",
                        BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
                    if (field != null)
                    {
                        field.SetValue(comp, mergeTarget.transform);
                    }
                    else
                    {
                        // Try property
                        var prop = _maMergeArmatureType.GetProperty("mergeTarget",
                            BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
                        if (prop != null && prop.CanWrite)
                        {
                            prop.SetValue(comp, mergeTarget.transform);
                        }
                    }
                }
            }

            // Set prefix if specified
            string prefix = GetParam(p, "prefix", "");
            if (!string.IsNullOrEmpty(prefix))
            {
                SetFieldOrProperty(comp, "prefix", prefix);
            }

            // Set locked flag
            string locked = GetParam(p, "locked", "");
            if (!string.IsNullOrEmpty(locked))
            {
                SetFieldOrProperty(comp, "locked", locked == "true");
            }

            EditorUtility.SetDirty(comp);

            return new ToolResult
            {
                success = true,
                message = $"Added MAMergeArmature to '{target.name}'",
                data = $"{{\"gameObject\":\"{EscapeJson(target.name)}\",\"component\":\"ModularAvatarMergeArmature\"}}"
            };
        }

        private static ToolResult AddMABoneProxy(Dictionary<string, string> p)
        {
            if (!EnsureMA())
                return Fail(MANotInstalledMessage());

            if (_maBoneProxyType == null)
                return Fail("ModularAvatarBoneProxy type not found in assembly");

            string targetName = GetRequiredParam(p, "target");
            GameObject target = FindByNameOrId(targetName);
            if (target == null)
                return Fail($"GameObject not found: {targetName}");

            Component comp = Undo.AddComponent(target, _maBoneProxyType);
            if (comp == null)
                return Fail("Failed to add MABoneProxy component");

            // Set the bone reference target
            string boneName = GetParam(p, "bone_target", "");
            if (!string.IsNullOrEmpty(boneName))
            {
                GameObject boneObj = FindByNameOrId(boneName);
                if (boneObj != null)
                {
                    // Try to set the target via reflection
                    SetFieldOrProperty(comp, "target", boneObj.transform);
                }
            }

            EditorUtility.SetDirty(comp);

            return new ToolResult
            {
                success = true,
                message = $"Added MABoneProxy to '{target.name}'",
                data = $"{{\"gameObject\":\"{EscapeJson(target.name)}\",\"component\":\"ModularAvatarBoneProxy\",\"boneTarget\":\"{EscapeJson(boneName)}\"}}"
            };
        }

        private static ToolResult AddMAMenuItem(Dictionary<string, string> p)
        {
            if (!EnsureMA())
                return Fail(MANotInstalledMessage());

            if (_maMenuItemType == null)
                return Fail("ModularAvatarMenuItem type not found in assembly");

            string targetName = GetRequiredParam(p, "target");
            GameObject target = FindByNameOrId(targetName);
            if (target == null)
                return Fail($"GameObject not found: {targetName}");

            Component comp = Undo.AddComponent(target, _maMenuItemType);
            if (comp == null)
                return Fail("Failed to add MAMenuItem component");

            // Configure the menu item via serialized property for safety
            var so = new SerializedObject(comp);

            // Set menu item name/label
            string label = GetParam(p, "label", target.name);
            var labelProp = so.FindProperty("label");
            if (labelProp != null)
            {
                labelProp.stringValue = label;
            }

            // Set type: Toggle, Button, SubMenu, TwoAxis, FourAxis, Radial
            string menuType = GetParam(p, "menu_type", "Toggle");
            var typeProp = so.FindProperty("type");
            if (typeProp == null) typeProp = so.FindProperty("menuType");
            if (typeProp == null) typeProp = so.FindProperty("controlType");

            // Also try via reflection for the Control field
            string paramName = GetParam(p, "parameter", "");
            if (!string.IsNullOrEmpty(paramName))
            {
                var paramProp = so.FindProperty("parameter");
                if (paramProp == null) paramProp = so.FindProperty("parameterName");
                if (paramProp != null)
                {
                    paramProp.stringValue = paramName;
                }
            }

            string paramValue = GetParam(p, "value", "");
            if (!string.IsNullOrEmpty(paramValue))
            {
                var valueProp = so.FindProperty("value");
                if (valueProp != null && float.TryParse(paramValue,
                    System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out float fVal))
                {
                    valueProp.floatValue = fVal;
                }
            }

            so.ApplyModifiedProperties();
            so.Dispose();
            EditorUtility.SetDirty(comp);

            return new ToolResult
            {
                success = true,
                message = $"Added MAMenuItem to '{target.name}'",
                data = $"{{\"gameObject\":\"{EscapeJson(target.name)}\",\"component\":\"ModularAvatarMenuItem\",\"label\":\"{EscapeJson(label)}\",\"menuType\":\"{EscapeJson(menuType)}\"}}"
            };
        }

        private static ToolResult AddMAToggle(Dictionary<string, string> p)
        {
            if (!EnsureMA())
                return Fail(MANotInstalledMessage());

            if (_maObjectToggleType == null)
                return Fail("ModularAvatarObjectToggle type not found in assembly. This component may not be available in your MA version.");

            string targetName = GetRequiredParam(p, "target");
            GameObject target = FindByNameOrId(targetName);
            if (target == null)
                return Fail($"GameObject not found: {targetName}");

            Component comp = Undo.AddComponent(target, _maObjectToggleType);
            if (comp == null)
                return Fail("Failed to add MAObjectToggle component");

            // Set the objects to toggle
            string objectsJson = GetParam(p, "objects", "");
            if (!string.IsNullOrEmpty(objectsJson))
            {
                // objects is expected as comma-separated list of GameObject names
                string[] objectNames = objectsJson.Split(',');
                var so = new SerializedObject(comp);

                // Try to find the objects list property
                var objectsProp = so.FindProperty("Objects");
                if (objectsProp == null) objectsProp = so.FindProperty("objects");
                if (objectsProp == null) objectsProp = so.FindProperty("m_Objects");

                if (objectsProp != null && objectsProp.isArray)
                {
                    objectsProp.ClearArray();
                    foreach (string objName in objectNames)
                    {
                        string trimmed = objName.Trim();
                        if (string.IsNullOrEmpty(trimmed)) continue;

                        GameObject toggleObj = FindByNameOrId(trimmed);
                        if (toggleObj != null)
                        {
                            int idx = objectsProp.arraySize;
                            objectsProp.InsertArrayElementAtIndex(idx);
                            var element = objectsProp.GetArrayElementAtIndex(idx);

                            // The element structure depends on MA version
                            var objRef = element.FindPropertyRelative("Object");
                            if (objRef == null) objRef = element.FindPropertyRelative("target");
                            if (objRef == null) objRef = element.FindPropertyRelative("gameObject");
                            if (objRef != null)
                            {
                                objRef.objectReferenceValue = toggleObj;
                            }
                        }
                    }
                }

                so.ApplyModifiedProperties();
                so.Dispose();
            }

            EditorUtility.SetDirty(comp);

            return new ToolResult
            {
                success = true,
                message = $"Added MAObjectToggle to '{target.name}'",
                data = $"{{\"gameObject\":\"{EscapeJson(target.name)}\",\"component\":\"ModularAvatarObjectToggle\"}}"
            };
        }

        private static ToolResult AddMABlendshapeSync(Dictionary<string, string> p)
        {
            if (!EnsureMA())
                return Fail(MANotInstalledMessage());

            if (_maBlendshapeSyncType == null)
                return Fail("ModularAvatarBlendshapeSync type not found in assembly");

            string targetName = GetRequiredParam(p, "target");
            GameObject target = FindByNameOrId(targetName);
            if (target == null)
                return Fail($"GameObject not found: {targetName}");

            Component comp = Undo.AddComponent(target, _maBlendshapeSyncType);
            if (comp == null)
                return Fail("Failed to add MABlendshapeSync component");

            // Configure bindings via serialized object
            string bindings = GetParam(p, "bindings", "");
            if (!string.IsNullOrEmpty(bindings))
            {
                // bindings format: "sourceMesh:sourceBlendshape=targetBlendshape,..."
                var so = new SerializedObject(comp);
                var bindingsProp = so.FindProperty("Bindings");
                if (bindingsProp == null) bindingsProp = so.FindProperty("bindings");
                if (bindingsProp == null) bindingsProp = so.FindProperty("m_bindings");

                if (bindingsProp != null && bindingsProp.isArray)
                {
                    string[] bindingEntries = bindings.Split(',');
                    foreach (string entry in bindingEntries)
                    {
                        string trimmed = entry.Trim();
                        if (string.IsNullOrEmpty(trimmed)) continue;

                        // Parse format: meshName:blendshapeName or meshName:source=target
                        string[] parts = trimmed.Split(':');
                        if (parts.Length < 2) continue;

                        string meshName = parts[0].Trim();
                        string blendshapePart = parts[1].Trim();
                        string sourceBlendshape = blendshapePart;
                        string targetBlendshape = blendshapePart;

                        if (blendshapePart.Contains("="))
                        {
                            string[] bsParts = blendshapePart.Split('=');
                            sourceBlendshape = bsParts[0].Trim();
                            targetBlendshape = bsParts[1].Trim();
                        }

                        int idx = bindingsProp.arraySize;
                        bindingsProp.InsertArrayElementAtIndex(idx);
                        var element = bindingsProp.GetArrayElementAtIndex(idx);

                        // Set mesh reference
                        var meshRef = element.FindPropertyRelative("Mesh");
                        if (meshRef == null) meshRef = element.FindPropertyRelative("mesh");
                        if (meshRef != null)
                        {
                            GameObject meshObj = FindByNameOrId(meshName);
                            if (meshObj != null)
                            {
                                SkinnedMeshRenderer smr = meshObj.GetComponent<SkinnedMeshRenderer>();
                                if (smr != null)
                                {
                                    meshRef.objectReferenceValue = smr;
                                }
                            }
                        }

                        // Set blendshape names
                        var localName = element.FindPropertyRelative("LocalBlendshape");
                        if (localName == null) localName = element.FindPropertyRelative("localBlendshape");
                        if (localName != null) localName.stringValue = targetBlendshape;

                        var remoteName = element.FindPropertyRelative("Blendshape");
                        if (remoteName == null) remoteName = element.FindPropertyRelative("blendshape");
                        if (remoteName != null) remoteName.stringValue = sourceBlendshape;
                    }
                }

                so.ApplyModifiedProperties();
                so.Dispose();
            }

            EditorUtility.SetDirty(comp);

            return new ToolResult
            {
                success = true,
                message = $"Added MABlendshapeSync to '{target.name}'",
                data = $"{{\"gameObject\":\"{EscapeJson(target.name)}\",\"component\":\"ModularAvatarBlendshapeSync\"}}"
            };
        }

        private static ToolResult AddMAParameters(Dictionary<string, string> p)
        {
            if (!EnsureMA())
                return Fail(MANotInstalledMessage());

            if (_maParametersType == null)
                return Fail("ModularAvatarParameters type not found in assembly");

            string targetName = GetRequiredParam(p, "target");
            GameObject target = FindByNameOrId(targetName);
            if (target == null)
                return Fail($"GameObject not found: {targetName}");

            Component comp = Undo.AddComponent(target, _maParametersType);
            if (comp == null)
                return Fail("Failed to add MAParameters component");

            // Configure parameters via serialized object
            string paramsJson = GetParam(p, "parameters", "");
            if (!string.IsNullOrEmpty(paramsJson))
            {
                var so = new SerializedObject(comp);
                var paramsProp = so.FindProperty("parameters");
                if (paramsProp == null) paramsProp = so.FindProperty("Parameters");

                if (paramsProp != null && paramsProp.isArray)
                {
                    // Parameters format: "name:type:default:saved,..."
                    // type: Bool, Int, Float
                    string[] paramEntries = paramsJson.Split(',');
                    foreach (string entry in paramEntries)
                    {
                        string trimmed = entry.Trim();
                        if (string.IsNullOrEmpty(trimmed)) continue;

                        string[] parts = trimmed.Split(':');
                        if (parts.Length < 2) continue;

                        string paramName = parts[0].Trim();
                        string paramType = parts.Length > 1 ? parts[1].Trim() : "Bool";
                        string defaultVal = parts.Length > 2 ? parts[2].Trim() : "0";
                        bool saved = parts.Length > 3 && parts[3].Trim().ToLower() == "true";

                        int idx = paramsProp.arraySize;
                        paramsProp.InsertArrayElementAtIndex(idx);
                        var element = paramsProp.GetArrayElementAtIndex(idx);

                        var nameProp = element.FindPropertyRelative("nameOrPrefix");
                        if (nameProp == null) nameProp = element.FindPropertyRelative("name");
                        if (nameProp != null) nameProp.stringValue = paramName;

                        var syncTypeProp = element.FindPropertyRelative("syncType");
                        if (syncTypeProp != null)
                        {
                            // Map type string to enum value
                            switch (paramType.ToLower())
                            {
                                case "bool": syncTypeProp.enumValueIndex = 0; break;
                                case "int": syncTypeProp.enumValueIndex = 1; break;
                                case "float": syncTypeProp.enumValueIndex = 2; break;
                            }
                        }

                        var defaultProp = element.FindPropertyRelative("defaultValue");
                        if (defaultProp != null && float.TryParse(defaultVal,
                            System.Globalization.NumberStyles.Float,
                            System.Globalization.CultureInfo.InvariantCulture, out float dv))
                        {
                            defaultProp.floatValue = dv;
                        }

                        var savedProp = element.FindPropertyRelative("saved");
                        if (savedProp != null) savedProp.boolValue = saved;
                    }
                }

                so.ApplyModifiedProperties();
                so.Dispose();
            }

            EditorUtility.SetDirty(comp);

            return new ToolResult
            {
                success = true,
                message = $"Added MAParameters to '{target.name}'",
                data = $"{{\"gameObject\":\"{EscapeJson(target.name)}\",\"component\":\"ModularAvatarParameters\"}}"
            };
        }

        private static ToolResult RemoveMAComponent(Dictionary<string, string> p)
        {
            if (!EnsureMA())
                return Fail(MANotInstalledMessage());

            string targetName = GetRequiredParam(p, "target");
            GameObject target = FindByNameOrId(targetName);
            if (target == null)
                return Fail($"GameObject not found: {targetName}");

            string componentType = GetParam(p, "component_type", "");

            if (string.IsNullOrEmpty(componentType))
            {
                // Remove all MA components
                int removed = 0;
                Component[] allComponents = target.GetComponents<Component>();
                foreach (Component c in allComponents)
                {
                    if (c == null) continue;
                    string fullName = c.GetType().FullName ?? "";
                    if (fullName.StartsWith("nadena.dev.modular_avatar"))
                    {
                        Undo.DestroyObjectImmediate(c);
                        removed++;
                    }
                }
                return new ToolResult
                {
                    success = true,
                    message = $"Removed {removed} MA component(s) from '{target.name}'"
                };
            }

            // Find the specific MA type
            Type maType = FindMAType(componentType);
            if (maType == null)
                return Fail($"MA component type not found: {componentType}");

            Component comp = target.GetComponent(maType);
            if (comp == null)
                return Fail($"Component '{componentType}' not found on '{target.name}'");

            Undo.DestroyObjectImmediate(comp);

            return new ToolResult
            {
                success = true,
                message = $"Removed {maType.Name} from '{target.name}'"
            };
        }

        private static ToolResult ListMAComponents(Dictionary<string, string> p)
        {
            if (!EnsureMA())
                return Fail(MANotInstalledMessage());

            string targetName = GetRequiredParam(p, "target");
            GameObject target = FindByNameOrId(targetName);
            if (target == null)
                return Fail($"GameObject not found: {targetName}");

            bool recursive = GetParam(p, "recursive", "true") != "false";

            var results = new List<string>();
            CollectMAComponents(target, results, recursive);

            var sb = new StringBuilder("[");
            for (int i = 0; i < results.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append(results[i]);
            }
            sb.Append("]");

            return new ToolResult
            {
                success = true,
                message = $"Found {results.Count} MA component(s)",
                data = sb.ToString()
            };
        }

        private static void CollectMAComponents(GameObject go, List<string> results, bool recursive)
        {
            Component[] components = go.GetComponents<Component>();
            foreach (Component c in components)
            {
                if (c == null) continue;
                string fullName = c.GetType().FullName ?? "";
                if (fullName.StartsWith("nadena.dev.modular_avatar"))
                {
                    var sb = new StringBuilder("{");
                    sb.Append($"\"gameObject\":\"{EscapeJson(go.name)}\",");
                    sb.Append($"\"path\":\"{EscapeJson(GetGameObjectPath(go))}\",");
                    sb.Append($"\"component\":\"{EscapeJson(c.GetType().Name)}\",");
                    sb.Append($"\"fullType\":\"{EscapeJson(fullName)}\"");

                    // Serialize properties via SerializedObject
                    var so = new SerializedObject(c);
                    SerializedProperty prop = so.GetIterator();
                    sb.Append(",\"properties\":{");
                    bool firstProp = true;
                    if (prop.NextVisible(true))
                    {
                        do
                        {
                            if (prop.name == "m_Script") continue;
                            if (!firstProp) sb.Append(",");
                            firstProp = false;
                            sb.Append($"\"{EscapeJson(prop.name)}\":\"{EscapeJson(SerializedPropertyToString(prop))}\"");
                        }
                        while (prop.NextVisible(false));
                    }
                    sb.Append("}");
                    so.Dispose();

                    sb.Append("}");
                    results.Add(sb.ToString());
                }
            }

            if (recursive)
            {
                for (int i = 0; i < go.transform.childCount; i++)
                {
                    CollectMAComponents(go.transform.GetChild(i).gameObject, results, true);
                }
            }
        }

        private static ToolResult AutoSetupOutfit(Dictionary<string, string> p)
        {
            if (!EnsureMA())
                return Fail(MANotInstalledMessage());

            if (_maMergeArmatureType == null)
                return Fail("ModularAvatarMergeArmature type not found in assembly");

            string outfitName = GetRequiredParam(p, "outfit");
            GameObject outfit = FindByNameOrId(outfitName);
            if (outfit == null)
                return Fail($"Outfit GameObject not found: {outfitName}");

            string avatarName = GetParam(p, "avatar", "");
            GameObject avatar = null;
            if (!string.IsNullOrEmpty(avatarName))
            {
                avatar = FindByNameOrId(avatarName);
                if (avatar == null)
                    return Fail($"Avatar GameObject not found: {avatarName}");
            }

            var actions = new List<string>();

            // Step 1: Find or detect the armature in the outfit
            Transform outfitArmature = FindArmatureInHierarchy(outfit.transform);
            if (outfitArmature == null)
                return Fail("Could not find an armature in the outfit hierarchy. Expected a child named 'Armature' or containing bone objects.");

            // Step 2: Add MAMergeArmature to the outfit armature
            Component existingMerge = outfitArmature.gameObject.GetComponent(_maMergeArmatureType);
            if (existingMerge == null)
            {
                Component mergeComp = Undo.AddComponent(outfitArmature.gameObject, _maMergeArmatureType);
                if (mergeComp != null)
                {
                    // Try to set merge target to avatar armature
                    if (avatar != null)
                    {
                        Transform avatarArmature = FindArmatureInHierarchy(avatar.transform);
                        if (avatarArmature != null)
                        {
                            SetFieldOrProperty(mergeComp, "mergeTarget", avatarArmature);
                            SetFieldOrProperty(mergeComp, "mergeTargetObject", avatarArmature.gameObject);
                        }
                    }
                    EditorUtility.SetDirty(mergeComp);
                    actions.Add("Added MAMergeArmature to outfit armature");
                }
            }
            else
            {
                actions.Add("MAMergeArmature already exists on outfit armature");
            }

            // Step 3: Detect SkinnedMeshRenderers and check for blendshape sync needs
            SkinnedMeshRenderer[] outfitMeshes = outfit.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            int blendshapeSyncCount = 0;

            if (avatar != null && _maBlendshapeSyncType != null)
            {
                SkinnedMeshRenderer[] avatarMeshes = avatar.GetComponentsInChildren<SkinnedMeshRenderer>(true);

                foreach (SkinnedMeshRenderer outfitSMR in outfitMeshes)
                {
                    if (outfitSMR.sharedMesh == null) continue;

                    // Find matching blendshapes between outfit and avatar meshes
                    var matchingBlendshapes = new List<string>();
                    for (int bs = 0; bs < outfitSMR.sharedMesh.blendShapeCount; bs++)
                    {
                        string bsName = outfitSMR.sharedMesh.GetBlendShapeName(bs);
                        foreach (SkinnedMeshRenderer avatarSMR in avatarMeshes)
                        {
                            if (avatarSMR.sharedMesh == null) continue;
                            int avatarBsIndex = avatarSMR.sharedMesh.GetBlendShapeIndex(bsName);
                            if (avatarBsIndex >= 0)
                            {
                                matchingBlendshapes.Add(bsName);
                                break;
                            }
                        }
                    }

                    if (matchingBlendshapes.Count > 0)
                    {
                        // Add BlendshapeSync if not present
                        Component existingSync = outfitSMR.gameObject.GetComponent(_maBlendshapeSyncType);
                        if (existingSync == null)
                        {
                            Undo.AddComponent(outfitSMR.gameObject, _maBlendshapeSyncType);
                            blendshapeSyncCount++;
                        }
                    }
                }
            }

            if (blendshapeSyncCount > 0)
            {
                actions.Add($"Added MABlendshapeSync to {blendshapeSyncCount} mesh(es) with matching blendshapes");
            }

            // Step 4: Report bone mappings detected
            int boneCount = CountBonesInHierarchy(outfitArmature);
            actions.Add($"Detected {boneCount} bones in outfit armature");
            actions.Add($"Found {outfitMeshes.Length} SkinnedMeshRenderer(s) in outfit");

            var resultSb = new StringBuilder("{");
            resultSb.Append($"\"outfit\":\"{EscapeJson(outfit.name)}\",");
            resultSb.Append($"\"armature\":\"{EscapeJson(outfitArmature.name)}\",");
            resultSb.Append($"\"boneCount\":{boneCount},");
            resultSb.Append($"\"meshCount\":{outfitMeshes.Length},");
            resultSb.Append("\"actions\":[");
            for (int i = 0; i < actions.Count; i++)
            {
                if (i > 0) resultSb.Append(",");
                resultSb.Append($"\"{EscapeJson(actions[i])}\"");
            }
            resultSb.Append("]}");

            return new ToolResult
            {
                success = true,
                message = $"Auto-setup complete for outfit '{outfit.name}': {actions.Count} action(s) performed",
                data = resultSb.ToString()
            };
        }

        // --- Internal Helpers ---

        private static Transform FindArmatureInHierarchy(Transform root)
        {
            // Look for a child named "Armature" (case-insensitive)
            for (int i = 0; i < root.childCount; i++)
            {
                Transform child = root.GetChild(i);
                if (child.name.Equals("Armature", StringComparison.OrdinalIgnoreCase))
                    return child;
            }

            // Look for any child that contains "armature" in its name
            for (int i = 0; i < root.childCount; i++)
            {
                Transform child = root.GetChild(i);
                if (child.name.IndexOf("armature", StringComparison.OrdinalIgnoreCase) >= 0)
                    return child;
            }

            // Look for a child that has typical bone children (Hips, Spine, etc.)
            string[] boneNames = { "Hips", "hips", "Spine", "spine", "Root", "root" };
            for (int i = 0; i < root.childCount; i++)
            {
                Transform child = root.GetChild(i);
                for (int j = 0; j < child.childCount; j++)
                {
                    string childName = child.GetChild(j).name;
                    foreach (string bone in boneNames)
                    {
                        if (childName.IndexOf(bone, StringComparison.OrdinalIgnoreCase) >= 0)
                            return child;
                    }
                }
            }

            return null;
        }

        private static int CountBonesInHierarchy(Transform root)
        {
            int count = 1; // count root itself
            for (int i = 0; i < root.childCount; i++)
            {
                count += CountBonesInHierarchy(root.GetChild(i));
            }
            return count;
        }

        private static Type FindMAType(string shortName)
        {
            if (_maAssembly == null) return null;

            // Try common MA type names
            string[] prefixes = {
                "nadena.dev.modular_avatar.core.ModularAvatar",
                "nadena.dev.modular_avatar.core.MA",
                "nadena.dev.modular_avatar.core."
            };

            foreach (string prefix in prefixes)
            {
                Type t = _maAssembly.GetType(prefix + shortName);
                if (t != null) return t;
            }

            // Search by short name
            try
            {
                foreach (Type t in _maAssembly.GetTypes())
                {
                    if (t.Name.Equals(shortName, StringComparison.OrdinalIgnoreCase)
                        || t.Name.Equals("ModularAvatar" + shortName, StringComparison.OrdinalIgnoreCase))
                    {
                        return t;
                    }
                }
            }
            catch { /* ignore reflection errors */ }

            return null;
        }

        private static void SetFieldOrProperty(object obj, string name, object value)
        {
            Type type = obj.GetType();
            var field = type.GetField(name, BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
            if (field != null)
            {
                field.SetValue(obj, value);
                return;
            }

            var prop = type.GetProperty(name, BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
            if (prop != null && prop.CanWrite)
            {
                prop.SetValue(obj, value);
            }
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
