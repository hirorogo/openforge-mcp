using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

namespace OpenForge.Editor.Tools
{
    public static class LightingTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_light", CreateLight);
            ToolExecutor.Register("set_light_color", SetLightColor);
            ToolExecutor.Register("set_light_intensity", SetLightIntensity);
            ToolExecutor.Register("set_light_range", SetLightRange);
            ToolExecutor.Register("bake_lighting", BakeLighting);
            ToolExecutor.Register("create_reflection_probe", CreateReflectionProbe);
            ToolExecutor.Register("create_light_probe_group", CreateLightProbeGroup);
            ToolExecutor.Register("set_ambient_light", SetAmbientLight);
            ToolExecutor.Register("set_skybox", SetSkybox);
            ToolExecutor.Register("set_fog", SetFog);
            ToolExecutor.Register("set_shadow_settings", SetShadowSettings);
            ToolExecutor.Register("set_render_pipeline_settings", SetRenderPipelineSettings);
        }

        private static ToolResult CreateLight(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "");
            string lightType = GetParam(p, "type", "directional");

            LightType type;
            switch (lightType.ToLower())
            {
                case "directional": type = LightType.Directional; break;
                case "point": type = LightType.Point; break;
                case "spot": type = LightType.Spot; break;
                case "area": type = LightType.Rectangle; break;
                default: return Fail($"Unknown light type: {lightType}. Valid: directional, point, spot, area");
            }

            if (string.IsNullOrEmpty(name))
                name = $"{lightType.Substring(0, 1).ToUpper()}{lightType.Substring(1)} Light";

            GameObject lightGo = new GameObject(name);
            Light light = lightGo.AddComponent<Light>();
            light.type = type;

            string colorStr = GetParam(p, "color", "");
            if (!string.IsNullOrEmpty(colorStr) && TryParseColor(colorStr, out Color color))
                light.color = color;

            string intensity = GetParam(p, "intensity", "");
            if (!string.IsNullOrEmpty(intensity))
                light.intensity = float.Parse(intensity, System.Globalization.CultureInfo.InvariantCulture);

            string range = GetParam(p, "range", "");
            if (!string.IsNullOrEmpty(range))
                light.range = float.Parse(range, System.Globalization.CultureInfo.InvariantCulture);

            string spotAngle = GetParam(p, "spot_angle", "");
            if (!string.IsNullOrEmpty(spotAngle) && type == LightType.Spot)
                light.spotAngle = float.Parse(spotAngle, System.Globalization.CultureInfo.InvariantCulture);

            string shadows = GetParam(p, "shadows", "");
            if (!string.IsNullOrEmpty(shadows) && Enum.TryParse(shadows, true, out LightShadows shadowType))
                light.shadows = shadowType;

            string posStr = GetParam(p, "position", "");
            if (!string.IsNullOrEmpty(posStr) && TryParseVector3(posStr, out Vector3 pos))
                lightGo.transform.position = pos;

            string rotStr = GetParam(p, "rotation", "");
            if (!string.IsNullOrEmpty(rotStr) && TryParseVector3(rotStr, out Vector3 rot))
                lightGo.transform.eulerAngles = rot;

            Undo.RegisterCreatedObjectUndo(lightGo, $"Create {lightType} light");

            return new ToolResult
            {
                success = true,
                message = $"Created {lightType} light '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"type\":\"{lightType}\",\"instanceId\":{lightGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult SetLightColor(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string colorStr = GetRequiredParam(p, "color");

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            Light light = go.GetComponent<Light>();
            if (light == null) return Fail($"No Light component on '{targetName}'");

            if (!TryParseColor(colorStr, out Color color))
                return Fail($"Invalid color: {colorStr}");

            Undo.RecordObject(light, "Set light color");
            light.color = color;

            return new ToolResult
            {
                success = true,
                message = $"Set light color on '{go.name}' to {color}"
            };
        }

        private static ToolResult SetLightIntensity(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            float intensity = float.Parse(GetRequiredParam(p, "intensity"), System.Globalization.CultureInfo.InvariantCulture);

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            Light light = go.GetComponent<Light>();
            if (light == null) return Fail($"No Light component on '{targetName}'");

            Undo.RecordObject(light, "Set light intensity");
            light.intensity = intensity;

            return new ToolResult
            {
                success = true,
                message = $"Set light intensity on '{go.name}' to {intensity}"
            };
        }

        private static ToolResult SetLightRange(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            float range = float.Parse(GetRequiredParam(p, "range"), System.Globalization.CultureInfo.InvariantCulture);

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            Light light = go.GetComponent<Light>();
            if (light == null) return Fail($"No Light component on '{targetName}'");

            Undo.RecordObject(light, "Set light range");
            light.range = range;

            return new ToolResult
            {
                success = true,
                message = $"Set light range on '{go.name}' to {range}"
            };
        }

        private static ToolResult BakeLighting(Dictionary<string, string> p)
        {
            string mode = GetParam(p, "mode", "bake");

            switch (mode.ToLower())
            {
                case "bake":
                    Lightmapping.BakeAsync();
                    break;
                case "clear":
                    Lightmapping.Clear();
                    break;
                case "cancel":
                    Lightmapping.Cancel();
                    break;
                default:
                    return Fail($"Unknown bake mode: {mode}. Valid: bake, clear, cancel");
            }

            return new ToolResult
            {
                success = true,
                message = $"Lighting {mode} operation started"
            };
        }

        private static ToolResult CreateReflectionProbe(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Reflection Probe");

            GameObject probeGo = new GameObject(name);
            ReflectionProbe probe = probeGo.AddComponent<ReflectionProbe>();

            string posStr = GetParam(p, "position", "");
            if (!string.IsNullOrEmpty(posStr) && TryParseVector3(posStr, out Vector3 pos))
                probeGo.transform.position = pos;

            string sizeStr = GetParam(p, "size", "");
            if (!string.IsNullOrEmpty(sizeStr) && TryParseVector3(sizeStr, out Vector3 size))
                probe.size = size;

            string resolution = GetParam(p, "resolution", "");
            if (!string.IsNullOrEmpty(resolution))
                probe.resolution = int.Parse(resolution);

            string modeStr = GetParam(p, "mode", "baked");
            switch (modeStr.ToLower())
            {
                case "baked": probe.mode = ReflectionProbeMode.Baked; break;
                case "realtime": probe.mode = ReflectionProbeMode.Realtime; break;
                case "custom": probe.mode = ReflectionProbeMode.Custom; break;
            }

            string intensity = GetParam(p, "intensity", "");
            if (!string.IsNullOrEmpty(intensity))
                probe.intensity = float.Parse(intensity, System.Globalization.CultureInfo.InvariantCulture);

            Undo.RegisterCreatedObjectUndo(probeGo, "Create Reflection Probe");

            return new ToolResult
            {
                success = true,
                message = $"Created reflection probe '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{probeGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult CreateLightProbeGroup(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Light Probe Group");

            GameObject probeGroupGo = new GameObject(name);
            LightProbeGroup group = probeGroupGo.AddComponent<LightProbeGroup>();

            string posStr = GetParam(p, "position", "");
            if (!string.IsNullOrEmpty(posStr) && TryParseVector3(posStr, out Vector3 pos))
                probeGroupGo.transform.position = pos;

            string pattern = GetParam(p, "pattern", "");
            if (pattern.ToLower() == "grid")
            {
                int countX = int.Parse(GetParam(p, "count_x", "3"));
                int countY = int.Parse(GetParam(p, "count_y", "2"));
                int countZ = int.Parse(GetParam(p, "count_z", "3"));
                float spacing = float.Parse(GetParam(p, "spacing", "2"), System.Globalization.CultureInfo.InvariantCulture);

                List<Vector3> positions = new List<Vector3>();
                for (int x = 0; x < countX; x++)
                    for (int y = 0; y < countY; y++)
                        for (int z = 0; z < countZ; z++)
                            positions.Add(new Vector3(x * spacing, y * spacing, z * spacing));
                group.probePositions = positions.ToArray();
            }

            Undo.RegisterCreatedObjectUndo(probeGroupGo, "Create Light Probe Group");

            return new ToolResult
            {
                success = true,
                message = $"Created light probe group '{name}' ({group.probePositions.Length} probes)",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"probeCount\":{group.probePositions.Length}}}"
            };
        }

        private static ToolResult SetAmbientLight(Dictionary<string, string> p)
        {
            string mode = GetParam(p, "mode", "");
            if (!string.IsNullOrEmpty(mode))
            {
                switch (mode.ToLower())
                {
                    case "skybox":
                        RenderSettings.ambientMode = AmbientMode.Skybox;
                        break;
                    case "trilight":
                        RenderSettings.ambientMode = AmbientMode.Trilight;
                        break;
                    case "flat": case "color":
                        RenderSettings.ambientMode = AmbientMode.Flat;
                        break;
                }
            }

            string colorStr = GetParam(p, "color", "");
            if (!string.IsNullOrEmpty(colorStr) && TryParseColor(colorStr, out Color color))
                RenderSettings.ambientLight = color;

            string skyColor = GetParam(p, "sky_color", "");
            if (!string.IsNullOrEmpty(skyColor) && TryParseColor(skyColor, out Color sky))
                RenderSettings.ambientSkyColor = sky;

            string equatorColor = GetParam(p, "equator_color", "");
            if (!string.IsNullOrEmpty(equatorColor) && TryParseColor(equatorColor, out Color equator))
                RenderSettings.ambientEquatorColor = equator;

            string groundColor = GetParam(p, "ground_color", "");
            if (!string.IsNullOrEmpty(groundColor) && TryParseColor(groundColor, out Color ground))
                RenderSettings.ambientGroundColor = ground;

            string intensity = GetParam(p, "intensity", "");
            if (!string.IsNullOrEmpty(intensity))
                RenderSettings.ambientIntensity = float.Parse(intensity, System.Globalization.CultureInfo.InvariantCulture);

            return new ToolResult
            {
                success = true,
                message = $"Updated ambient light settings (mode: {RenderSettings.ambientMode})"
            };
        }

        private static ToolResult SetSkybox(Dictionary<string, string> p)
        {
            string materialPath = GetParam(p, "material", "");

            if (!string.IsNullOrEmpty(materialPath))
            {
                Material mat = AssetDatabase.LoadAssetAtPath<Material>(materialPath);
                if (mat == null)
                    return Fail($"Skybox material not found at: {materialPath}");
                RenderSettings.skybox = mat;
            }
            else
            {
                string shaderName = GetParam(p, "shader", "Skybox/Procedural");
                Shader shader = Shader.Find(shaderName);
                if (shader == null)
                    return Fail($"Shader not found: {shaderName}");

                Material skyMat = new Material(shader);

                string tint = GetParam(p, "tint", "");
                if (!string.IsNullOrEmpty(tint) && TryParseColor(tint, out Color tintColor))
                    skyMat.SetColor("_Tint", tintColor);

                string exposure = GetParam(p, "exposure", "");
                if (!string.IsNullOrEmpty(exposure))
                    skyMat.SetFloat("_Exposure", float.Parse(exposure, System.Globalization.CultureInfo.InvariantCulture));

                RenderSettings.skybox = skyMat;
            }

            return new ToolResult
            {
                success = true,
                message = "Updated skybox settings"
            };
        }

        private static ToolResult SetFog(Dictionary<string, string> p)
        {
            string enabled = GetParam(p, "enabled", "");
            if (!string.IsNullOrEmpty(enabled))
                RenderSettings.fog = enabled.ToLower() == "true";

            string colorStr = GetParam(p, "color", "");
            if (!string.IsNullOrEmpty(colorStr) && TryParseColor(colorStr, out Color color))
                RenderSettings.fogColor = color;

            string modeStr = GetParam(p, "mode", "");
            if (!string.IsNullOrEmpty(modeStr))
            {
                switch (modeStr.ToLower())
                {
                    case "linear": RenderSettings.fogMode = FogMode.Linear; break;
                    case "exponential": RenderSettings.fogMode = FogMode.Exponential; break;
                    case "exponential_squared": RenderSettings.fogMode = FogMode.ExponentialSquared; break;
                }
            }

            string density = GetParam(p, "density", "");
            if (!string.IsNullOrEmpty(density))
                RenderSettings.fogDensity = float.Parse(density, System.Globalization.CultureInfo.InvariantCulture);

            string startDistance = GetParam(p, "start_distance", "");
            if (!string.IsNullOrEmpty(startDistance))
                RenderSettings.fogStartDistance = float.Parse(startDistance, System.Globalization.CultureInfo.InvariantCulture);

            string endDistance = GetParam(p, "end_distance", "");
            if (!string.IsNullOrEmpty(endDistance))
                RenderSettings.fogEndDistance = float.Parse(endDistance, System.Globalization.CultureInfo.InvariantCulture);

            return new ToolResult
            {
                success = true,
                message = $"Updated fog settings (enabled: {RenderSettings.fog}, mode: {RenderSettings.fogMode})"
            };
        }

        private static ToolResult SetShadowSettings(Dictionary<string, string> p)
        {
            string distance = GetParam(p, "distance", "");
            if (!string.IsNullOrEmpty(distance))
                QualitySettings.shadowDistance = float.Parse(distance, System.Globalization.CultureInfo.InvariantCulture);

            string resolution = GetParam(p, "resolution", "");
            if (!string.IsNullOrEmpty(resolution) && Enum.TryParse(resolution, true, out ShadowResolution sr))
                QualitySettings.shadowResolution = sr;

            string cascades = GetParam(p, "cascades", "");
            if (!string.IsNullOrEmpty(cascades))
                QualitySettings.shadowCascades = int.Parse(cascades);

            string projection = GetParam(p, "projection", "");
            if (!string.IsNullOrEmpty(projection) && Enum.TryParse(projection, true, out ShadowProjection sp))
                QualitySettings.shadowProjection = sp;

            return new ToolResult
            {
                success = true,
                message = $"Updated shadow settings (distance: {QualitySettings.shadowDistance}, cascades: {QualitySettings.shadowCascades})"
            };
        }

        private static ToolResult SetRenderPipelineSettings(Dictionary<string, string> p)
        {
            string pipelinePath = GetParam(p, "pipeline_asset", "");

            if (!string.IsNullOrEmpty(pipelinePath))
            {
                RenderPipelineAsset pipelineAsset = AssetDatabase.LoadAssetAtPath<RenderPipelineAsset>(pipelinePath);
                if (pipelineAsset == null)
                    return Fail($"Render pipeline asset not found at: {pipelinePath}");

                GraphicsSettings.defaultRenderPipeline = pipelineAsset;
                QualitySettings.renderPipeline = pipelineAsset;

                return new ToolResult
                {
                    success = true,
                    message = $"Set render pipeline to '{pipelineAsset.name}'"
                };
            }

            string clear = GetParam(p, "clear", "");
            if (clear == "true")
            {
                GraphicsSettings.defaultRenderPipeline = null;
                QualitySettings.renderPipeline = null;

                return new ToolResult
                {
                    success = true,
                    message = "Cleared render pipeline (using built-in)"
                };
            }

            RenderPipelineAsset currentPipeline = GraphicsSettings.defaultRenderPipeline;
            string pipelineName = currentPipeline != null ? currentPipeline.name : "Built-in";

            return new ToolResult
            {
                success = true,
                message = $"Current render pipeline: {pipelineName}",
                data = $"{{\"pipeline\":\"{EscapeJson(pipelineName)}\"}}"
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

        private static bool TryParseColor(string s, out Color color)
        {
            color = Color.white;
            if (string.IsNullOrEmpty(s)) return false;
            s = s.Trim();
            if (s.StartsWith("#")) return ColorUtility.TryParseHtmlString(s, out color);
            switch (s.ToLower())
            {
                case "red": color = Color.red; return true;
                case "green": color = Color.green; return true;
                case "blue": color = Color.blue; return true;
                case "white": color = Color.white; return true;
                case "black": color = Color.black; return true;
                case "yellow": color = Color.yellow; return true;
            }
            string cleaned = s.Trim('(', ')', '[', ']');
            string[] parts = cleaned.Split(',');
            if (parts.Length >= 3
                && float.TryParse(parts[0].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float r)
                && float.TryParse(parts[1].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float g)
                && float.TryParse(parts[2].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float b))
            {
                float a = 1f;
                if (parts.Length >= 4) float.TryParse(parts[3].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out a);
                color = new Color(r, g, b, a);
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
