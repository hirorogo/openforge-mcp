using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class PhysBoneTools
    {
        private const string SDK_NOT_INSTALLED_MSG =
            "VRChat SDK is not installed. Use install_package to add com.vrchat.avatars or com.vrchat.worlds";

        private const string PHYSBONE_TYPE = "VRC.SDK3.Dynamics.PhysBone.Components.VRCPhysBone";
        private const string PHYSBONE_COLLIDER_TYPE = "VRC.SDK3.Dynamics.PhysBone.Components.VRCPhysBoneCollider";

        public static void Register()
        {
            ToolExecutor.Register("add_physbone", AddPhysBone);
            ToolExecutor.Register("configure_physbone", ConfigurePhysBone);
            ToolExecutor.Register("add_physbone_collider", AddPhysBoneCollider);
            ToolExecutor.Register("setup_hair_physbone", SetupHairPhysBone);
            ToolExecutor.Register("setup_skirt_physbone", SetupSkirtPhysBone);
            ToolExecutor.Register("setup_tail_physbone", SetupTailPhysBone);
            ToolExecutor.Register("setup_accessory_physbone", SetupAccessoryPhysBone);
            ToolExecutor.Register("list_physbones", ListPhysBones);
            ToolExecutor.Register("get_physbone_info", GetPhysBoneInfo);
            ToolExecutor.Register("copy_physbone_settings", CopyPhysBoneSettings);
        }

        // --- SDK Detection ---

        private static Type FindVrcType(string typeName)
        {
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                foreach (var type in assembly.GetTypes())
                {
                    if (type.FullName == typeName || type.Name == typeName)
                        return type;
                }
            }
            return null;
        }

        private static bool IsPhysBoneAvailable()
        {
            return FindVrcType(PHYSBONE_TYPE) != null;
        }

        private static ToolResult CheckSdk()
        {
            if (!IsPhysBoneAvailable())
                return Fail(SDK_NOT_INSTALLED_MSG);
            return null;
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

        private static void SetField(Component comp, string fieldName, object value)
        {
            if (comp == null) return;
            var field = comp.GetType().GetField(fieldName, BindingFlags.Public | BindingFlags.Instance);
            if (field != null)
            {
                field.SetValue(comp, value);
                return;
            }
            var prop = comp.GetType().GetProperty(fieldName, BindingFlags.Public | BindingFlags.Instance);
            if (prop != null)
            {
                prop.SetValue(comp, value);
            }
        }

        private static object GetField(Component comp, string fieldName)
        {
            if (comp == null) return null;
            var field = comp.GetType().GetField(fieldName, BindingFlags.Public | BindingFlags.Instance);
            if (field != null) return field.GetValue(comp);
            var prop = comp.GetType().GetProperty(fieldName, BindingFlags.Public | BindingFlags.Instance);
            if (prop != null) return prop.GetValue(comp);
            return null;
        }

        private static void SetFloatParam(Component comp, string fieldName, Dictionary<string, string> p, string paramKey)
        {
            string val = GetParam(p, paramKey, "");
            if (!string.IsNullOrEmpty(val) && float.TryParse(val,
                System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float f))
            {
                SetField(comp, fieldName, f);
            }
        }

        private static void ApplyPhysBoneParams(Component comp, Dictionary<string, string> p)
        {
            Undo.RecordObject(comp, "Configure PhysBone");

            SetFloatParam(comp, "pull", p, "pull");
            SetFloatParam(comp, "spring", p, "spring");
            SetFloatParam(comp, "stiffness", p, "stiffness");
            SetFloatParam(comp, "gravity", p, "gravity");
            SetFloatParam(comp, "immobile", p, "immobile");
            SetFloatParam(comp, "gravityFalloff", p, "gravity_falloff");
            SetFloatParam(comp, "maxStretch", p, "max_stretch");
            SetFloatParam(comp, "maxSquish", p, "max_squish");
            SetFloatParam(comp, "radiusFloat", p, "radius");
            SetFloatParam(comp, "radius", p, "radius");

            // Integration type
            string intType = GetParam(p, "integration_type", "");
            if (!string.IsNullOrEmpty(intType))
            {
                Type integrationEnum = FindVrcType("VRC.SDK3.Dynamics.PhysBone.Components.VRCPhysBone+IntegrationType");
                if (integrationEnum == null)
                    integrationEnum = FindVrcType("VRC.Dynamics.VRCPhysBoneBase+IntegrationType");
                if (integrationEnum != null)
                {
                    try
                    {
                        object enumVal = Enum.Parse(integrationEnum, intType, true);
                        SetField(comp, "integrationType", enumVal);
                    }
                    catch { }
                }
            }

            // Allow collision
            string allowCollision = GetParam(p, "allow_collision", "");
            if (!string.IsNullOrEmpty(allowCollision))
            {
                Type collisionFilterEnum = FindVrcType("VRC.SDK3.Dynamics.PhysBone.Components.VRCPhysBone+AdvancedBool");
                if (collisionFilterEnum == null)
                    collisionFilterEnum = FindVrcType("VRC.Dynamics.VRCPhysBoneBase+AdvancedBool");
                if (collisionFilterEnum != null)
                {
                    try
                    {
                        object enumVal = Enum.Parse(collisionFilterEnum, allowCollision, true);
                        SetField(comp, "allowCollision", enumVal);
                    }
                    catch { }
                }
            }

            // Allow grabbing
            string allowGrabbing = GetParam(p, "allow_grabbing", "");
            if (!string.IsNullOrEmpty(allowGrabbing))
            {
                Type advBoolEnum = FindVrcType("VRC.SDK3.Dynamics.PhysBone.Components.VRCPhysBone+AdvancedBool");
                if (advBoolEnum == null)
                    advBoolEnum = FindVrcType("VRC.Dynamics.VRCPhysBoneBase+AdvancedBool");
                if (advBoolEnum != null)
                {
                    try
                    {
                        object enumVal = Enum.Parse(advBoolEnum, allowGrabbing, true);
                        SetField(comp, "allowGrabbing", enumVal);
                    }
                    catch { }
                }
            }

            // Allow posing
            string allowPosing = GetParam(p, "allow_posing", "");
            if (!string.IsNullOrEmpty(allowPosing))
            {
                Type advBoolEnum = FindVrcType("VRC.SDK3.Dynamics.PhysBone.Components.VRCPhysBone+AdvancedBool");
                if (advBoolEnum == null)
                    advBoolEnum = FindVrcType("VRC.Dynamics.VRCPhysBoneBase+AdvancedBool");
                if (advBoolEnum != null)
                {
                    try
                    {
                        object enumVal = Enum.Parse(advBoolEnum, allowPosing, true);
                        SetField(comp, "allowPosing", enumVal);
                    }
                    catch { }
                }
            }

            // Limits
            string limitType = GetParam(p, "limit_type", "");
            if (!string.IsNullOrEmpty(limitType))
            {
                Type limitEnum = FindVrcType("VRC.SDK3.Dynamics.PhysBone.Components.VRCPhysBone+LimitType");
                if (limitEnum == null)
                    limitEnum = FindVrcType("VRC.Dynamics.VRCPhysBoneBase+LimitType");
                if (limitEnum != null)
                {
                    try
                    {
                        object enumVal = Enum.Parse(limitEnum, limitType, true);
                        SetField(comp, "limitType", enumVal);
                    }
                    catch { }
                }
            }

            SetFloatParam(comp, "maxAngleX", p, "max_angle_x");
            SetFloatParam(comp, "maxAngleZ", p, "max_angle_z");
        }

        private static void ApplyPresetValues(Component comp, float pull, float spring, float stiffness, float gravity, float immobile)
        {
            SetField(comp, "pull", pull);
            SetField(comp, "spring", spring);
            SetField(comp, "stiffness", stiffness);
            SetField(comp, "gravity", gravity);
            SetField(comp, "immobile", immobile);
        }

        private static string PhysBoneToJson(Component comp)
        {
            if (comp == null) return "null";
            StringBuilder sb = new StringBuilder("{");
            sb.Append($"\"gameObject\":\"{EscapeJson(comp.gameObject.name)}\",");
            sb.Append($"\"instanceId\":{comp.gameObject.GetInstanceID()},");
            sb.Append($"\"pull\":{FloatStr(GetField(comp, "pull"))},");
            sb.Append($"\"spring\":{FloatStr(GetField(comp, "spring"))},");
            sb.Append($"\"stiffness\":{FloatStr(GetField(comp, "stiffness"))},");
            sb.Append($"\"gravity\":{FloatStr(GetField(comp, "gravity"))},");
            sb.Append($"\"gravityFalloff\":{FloatStr(GetField(comp, "gravityFalloff"))},");
            sb.Append($"\"immobile\":{FloatStr(GetField(comp, "immobile"))},");
            sb.Append($"\"maxStretch\":{FloatStr(GetField(comp, "maxStretch"))},");
            sb.Append($"\"maxSquish\":{FloatStr(GetField(comp, "maxSquish"))},");
            sb.Append($"\"radius\":{FloatStr(GetField(comp, "radius") ?? GetField(comp, "radiusFloat"))},");

            // Root transform
            object rootTransform = GetField(comp, "rootTransform");
            string rootName = "null";
            if (rootTransform is Transform rt && rt != null)
                rootName = $"\"{EscapeJson(rt.gameObject.name)}\"";
            sb.Append($"\"rootTransform\":{rootName},");

            // Integration type
            object intType = GetField(comp, "integrationType");
            sb.Append($"\"integrationType\":\"{(intType != null ? intType.ToString() : "Simplified")}\"");
            sb.Append("}");
            return sb.ToString();
        }

        // --- Tool Implementations ---

        private static ToolResult AddPhysBone(Dictionary<string, string> p)
        {
            var sdkCheck = CheckSdk();
            if (sdkCheck != null) return sdkCheck;

            string targetName = GetRequiredParam(p, "name");
            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Type pbType = FindVrcType(PHYSBONE_TYPE);
            Component comp = Undo.AddComponent(go, pbType);
            if (comp == null)
                return Fail("Failed to add VRCPhysBone component.");

            // Set root transform if specified
            string rootName = GetParam(p, "root_transform", "");
            if (!string.IsNullOrEmpty(rootName))
            {
                GameObject rootGo = FindByNameOrId(rootName);
                if (rootGo != null)
                    SetField(comp, "rootTransform", rootGo.transform);
            }

            // Apply any additional params
            ApplyPhysBoneParams(comp, p);

            return new ToolResult
            {
                success = true,
                message = $"Added VRCPhysBone to '{go.name}'",
                data = PhysBoneToJson(comp)
            };
        }

        private static ToolResult ConfigurePhysBone(Dictionary<string, string> p)
        {
            var sdkCheck = CheckSdk();
            if (sdkCheck != null) return sdkCheck;

            string targetName = GetRequiredParam(p, "name");
            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Type pbType = FindVrcType(PHYSBONE_TYPE);
            Component comp = go.GetComponent(pbType);
            if (comp == null)
                return Fail($"No VRCPhysBone found on '{targetName}'. Use add_physbone first.");

            ApplyPhysBoneParams(comp, p);

            return new ToolResult
            {
                success = true,
                message = $"Configured VRCPhysBone on '{go.name}'",
                data = PhysBoneToJson(comp)
            };
        }

        private static ToolResult AddPhysBoneCollider(Dictionary<string, string> p)
        {
            var sdkCheck = CheckSdk();
            if (sdkCheck != null) return sdkCheck;

            string targetName = GetRequiredParam(p, "name");
            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Type colliderType = FindVrcType(PHYSBONE_COLLIDER_TYPE);
            if (colliderType == null)
                return Fail("VRCPhysBoneCollider type not found.");

            Component comp = Undo.AddComponent(go, colliderType);
            if (comp == null)
                return Fail("Failed to add VRCPhysBoneCollider.");

            // Shape type: Sphere, Capsule, Plane
            string shapeType = GetParam(p, "shape", "sphere").ToLower();
            Type shapeEnum = FindVrcType("VRC.SDK3.Dynamics.PhysBone.Components.VRCPhysBoneCollider+ShapeType");
            if (shapeEnum == null)
                shapeEnum = FindVrcType("VRC.Dynamics.VRCPhysBoneColliderBase+ShapeType");
            if (shapeEnum != null)
            {
                try
                {
                    object shapeVal;
                    if (shapeType == "capsule")
                        shapeVal = Enum.Parse(shapeEnum, "Capsule", true);
                    else if (shapeType == "plane")
                        shapeVal = Enum.Parse(shapeEnum, "Plane", true);
                    else
                        shapeVal = Enum.Parse(shapeEnum, "Sphere", true);
                    SetField(comp, "shapeType", shapeVal);
                }
                catch { }
            }

            // Radius
            string radiusStr = GetParam(p, "radius", "0.05");
            if (float.TryParse(radiusStr, System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out float radius))
            {
                SetField(comp, "radius", radius);
            }

            // Height (for capsule)
            string heightStr = GetParam(p, "height", "");
            if (!string.IsNullOrEmpty(heightStr) && float.TryParse(heightStr,
                System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float height))
            {
                SetField(comp, "height", height);
            }

            // Position offset
            string posStr = GetParam(p, "position", "");
            if (!string.IsNullOrEmpty(posStr) && TryParseVector3(posStr, out Vector3 pos))
            {
                SetField(comp, "position", pos);
            }

            // Rotation offset
            string rotStr = GetParam(p, "rotation", "");
            if (!string.IsNullOrEmpty(rotStr) && TryParseVector3(rotStr, out Vector3 rot))
            {
                SetField(comp, "rotation", Quaternion.Euler(rot));
            }

            // Inside bounds
            string insideBounds = GetParam(p, "inside_bounds", "");
            if (!string.IsNullOrEmpty(insideBounds))
            {
                SetField(comp, "insideBounds", insideBounds == "true");
            }

            return new ToolResult
            {
                success = true,
                message = $"Added VRCPhysBoneCollider ({shapeType}) to '{go.name}'",
                data = $"{{\"gameObject\":\"{EscapeJson(go.name)}\",\"shape\":\"{shapeType}\",\"radius\":{radius}}}"
            };
        }

        private static ToolResult SetupHairPhysBone(Dictionary<string, string> p)
        {
            return SetupPreset(p, "hair", 0.2f, 0.4f, 0.1f, 0.15f, 0.3f);
        }

        private static ToolResult SetupSkirtPhysBone(Dictionary<string, string> p)
        {
            return SetupPreset(p, "skirt", 0.2f, 0.3f, 0.05f, 0.2f, 0f);
        }

        private static ToolResult SetupTailPhysBone(Dictionary<string, string> p)
        {
            return SetupPreset(p, "tail", 0.2f, 0.5f, 0.2f, 0.1f, 0.2f);
        }

        private static ToolResult SetupAccessoryPhysBone(Dictionary<string, string> p)
        {
            return SetupPreset(p, "accessory", 0.2f, 0.8f, 0.3f, 0.5f, 0.5f);
        }

        private static ToolResult SetupPreset(Dictionary<string, string> p, string presetName,
            float pull, float spring, float stiffness, float gravity, float immobile)
        {
            var sdkCheck = CheckSdk();
            if (sdkCheck != null) return sdkCheck;

            string targetName = GetRequiredParam(p, "name");
            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Type pbType = FindVrcType(PHYSBONE_TYPE);

            // Add component if not present
            Component comp = go.GetComponent(pbType);
            bool isNew = comp == null;
            if (isNew)
            {
                comp = Undo.AddComponent(go, pbType);
                if (comp == null)
                    return Fail("Failed to add VRCPhysBone component.");
            }
            else
            {
                Undo.RecordObject(comp, $"Setup {presetName} PhysBone");
            }

            ApplyPresetValues(comp, pull, spring, stiffness, gravity, immobile);

            // Set root transform if specified
            string rootName = GetParam(p, "root_transform", "");
            if (!string.IsNullOrEmpty(rootName))
            {
                GameObject rootGo = FindByNameOrId(rootName);
                if (rootGo != null)
                    SetField(comp, "rootTransform", rootGo.transform);
            }

            // Allow overrides
            ApplyPhysBoneParams(comp, p);

            // Re-apply preset values for the core params that were not explicitly overridden
            if (!p.ContainsKey("pull")) SetField(comp, "pull", pull);
            if (!p.ContainsKey("spring")) SetField(comp, "spring", spring);
            if (!p.ContainsKey("stiffness")) SetField(comp, "stiffness", stiffness);
            if (!p.ContainsKey("gravity")) SetField(comp, "gravity", gravity);
            if (!p.ContainsKey("immobile")) SetField(comp, "immobile", immobile);

            return new ToolResult
            {
                success = true,
                message = $"{(isNew ? "Added" : "Configured")} VRCPhysBone on '{go.name}' with {presetName} preset (Pull={pull}, Spring={spring}, Stiffness={stiffness}, Gravity={gravity}, Immobile={immobile})",
                data = PhysBoneToJson(comp)
            };
        }

        private static ToolResult ListPhysBones(Dictionary<string, string> p)
        {
            var sdkCheck = CheckSdk();
            if (sdkCheck != null) return sdkCheck;

            Type pbType = FindVrcType(PHYSBONE_TYPE);
            Component[] physBones = UnityEngine.Object.FindObjectsOfType(pbType) as Component[];
            if (physBones == null || physBones.Length == 0)
            {
                return new ToolResult
                {
                    success = true,
                    message = "No VRCPhysBone components found in scene",
                    data = "[]"
                };
            }

            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < physBones.Length; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append(PhysBoneToJson(physBones[i]));
            }
            sb.Append("]");

            return new ToolResult
            {
                success = true,
                message = $"Found {physBones.Length} VRCPhysBone component(s)",
                data = sb.ToString()
            };
        }

        private static ToolResult GetPhysBoneInfo(Dictionary<string, string> p)
        {
            var sdkCheck = CheckSdk();
            if (sdkCheck != null) return sdkCheck;

            string targetName = GetRequiredParam(p, "name");
            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Type pbType = FindVrcType(PHYSBONE_TYPE);
            Component comp = go.GetComponent(pbType);
            if (comp == null)
                return Fail($"No VRCPhysBone found on '{targetName}'.");

            return new ToolResult
            {
                success = true,
                message = $"PhysBone info for '{go.name}'",
                data = PhysBoneToJson(comp)
            };
        }

        private static ToolResult CopyPhysBoneSettings(Dictionary<string, string> p)
        {
            var sdkCheck = CheckSdk();
            if (sdkCheck != null) return sdkCheck;

            string sourceName = GetRequiredParam(p, "source");
            string destName = GetRequiredParam(p, "destination");

            GameObject sourceGo = FindByNameOrId(sourceName);
            if (sourceGo == null)
                return Fail($"Source GameObject not found: {sourceName}");

            GameObject destGo = FindByNameOrId(destName);
            if (destGo == null)
                return Fail($"Destination GameObject not found: {destName}");

            Type pbType = FindVrcType(PHYSBONE_TYPE);
            Component sourceComp = sourceGo.GetComponent(pbType);
            if (sourceComp == null)
                return Fail($"No VRCPhysBone found on source '{sourceName}'.");

            Component destComp = destGo.GetComponent(pbType);
            bool isNew = destComp == null;
            if (isNew)
            {
                destComp = Undo.AddComponent(destGo, pbType);
                if (destComp == null)
                    return Fail("Failed to add VRCPhysBone to destination.");
            }
            else
            {
                Undo.RecordObject(destComp, "Copy PhysBone settings");
            }

            // Copy all float fields
            string[] floatFields = { "pull", "spring", "stiffness", "gravity", "gravityFalloff",
                "immobile", "maxStretch", "maxSquish", "radius", "radiusFloat",
                "maxAngleX", "maxAngleZ" };

            foreach (string fieldName in floatFields)
            {
                object val = GetField(sourceComp, fieldName);
                if (val != null)
                    SetField(destComp, fieldName, val);
            }

            // Copy enum fields
            string[] enumFields = { "integrationType", "limitType", "allowCollision", "allowGrabbing", "allowPosing" };
            foreach (string fieldName in enumFields)
            {
                object val = GetField(sourceComp, fieldName);
                if (val != null)
                    SetField(destComp, fieldName, val);
            }

            return new ToolResult
            {
                success = true,
                message = $"Copied PhysBone settings from '{sourceGo.name}' to '{destGo.name}'",
                data = PhysBoneToJson(destComp)
            };
        }

        // --- Utility ---

        private static bool TryParseVector3(string raw, out Vector3 v)
        {
            v = Vector3.zero;
            if (string.IsNullOrEmpty(raw)) return false;
            raw = raw.Trim().Trim('[', ']');
            string[] parts = raw.Split(',');
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

        private static string FloatStr(object val)
        {
            if (val is float f)
                return f.ToString(System.Globalization.CultureInfo.InvariantCulture);
            return "0";
        }
    }
}
