using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

namespace OpenForge.Editor.Tools
{
    public static class VFXTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_particle_system", CreateParticleSystem);
            ToolExecutor.Register("set_particle_emission", SetParticleEmission);
            ToolExecutor.Register("set_particle_shape", SetParticleShape);
            ToolExecutor.Register("set_particle_color", SetParticleColor);
            ToolExecutor.Register("set_particle_size", SetParticleSize);
            ToolExecutor.Register("set_particle_lifetime", SetParticleLifetime);
            ToolExecutor.Register("set_particle_velocity", SetParticleVelocity);
            ToolExecutor.Register("add_post_processing", AddPostProcessing);
            ToolExecutor.Register("set_bloom", SetBloom);
            ToolExecutor.Register("set_depth_of_field", SetDepthOfField);
        }

        private static ToolResult CreateParticleSystem(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Particle System");

            GameObject psGo = new GameObject(name);
            ParticleSystem ps = psGo.AddComponent<ParticleSystem>();

            string posStr = GetParam(p, "position", "");
            if (!string.IsNullOrEmpty(posStr) && TryParseVector3(posStr, out Vector3 pos))
                psGo.transform.position = pos;

            var main = ps.main;

            string duration = GetParam(p, "duration", "");
            if (!string.IsNullOrEmpty(duration))
                main.duration = float.Parse(duration, System.Globalization.CultureInfo.InvariantCulture);

            string loop = GetParam(p, "loop", "");
            if (!string.IsNullOrEmpty(loop))
                main.loop = loop == "true";

            string startSpeed = GetParam(p, "start_speed", "");
            if (!string.IsNullOrEmpty(startSpeed))
                main.startSpeed = float.Parse(startSpeed, System.Globalization.CultureInfo.InvariantCulture);

            string startSize = GetParam(p, "start_size", "");
            if (!string.IsNullOrEmpty(startSize))
                main.startSize = float.Parse(startSize, System.Globalization.CultureInfo.InvariantCulture);

            string startLifetime = GetParam(p, "start_lifetime", "");
            if (!string.IsNullOrEmpty(startLifetime))
                main.startLifetime = float.Parse(startLifetime, System.Globalization.CultureInfo.InvariantCulture);

            string startColor = GetParam(p, "start_color", "");
            if (!string.IsNullOrEmpty(startColor) && TryParseColor(startColor, out Color color))
                main.startColor = color;

            string maxParticles = GetParam(p, "max_particles", "");
            if (!string.IsNullOrEmpty(maxParticles))
                main.maxParticles = int.Parse(maxParticles);

            string gravityModifier = GetParam(p, "gravity", "");
            if (!string.IsNullOrEmpty(gravityModifier))
                main.gravityModifier = float.Parse(gravityModifier, System.Globalization.CultureInfo.InvariantCulture);

            string simulationSpace = GetParam(p, "simulation_space", "");
            if (!string.IsNullOrEmpty(simulationSpace) && Enum.TryParse(simulationSpace, true, out ParticleSystemSimulationSpace space))
                main.simulationSpace = space;

            Undo.RegisterCreatedObjectUndo(psGo, "Create Particle System");

            return new ToolResult
            {
                success = true,
                message = $"Created particle system '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{psGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult SetParticleEmission(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            ParticleSystem ps = go.GetComponent<ParticleSystem>();
            if (ps == null) return Fail($"No ParticleSystem on '{targetName}'");

            Undo.RecordObject(ps, "Set particle emission");
            var emission = ps.emission;

            string enabled = GetParam(p, "enabled", "");
            if (!string.IsNullOrEmpty(enabled))
                emission.enabled = enabled == "true";

            string rateOverTime = GetParam(p, "rate_over_time", "");
            if (!string.IsNullOrEmpty(rateOverTime))
                emission.rateOverTime = float.Parse(rateOverTime, System.Globalization.CultureInfo.InvariantCulture);

            string rateOverDistance = GetParam(p, "rate_over_distance", "");
            if (!string.IsNullOrEmpty(rateOverDistance))
                emission.rateOverDistance = float.Parse(rateOverDistance, System.Globalization.CultureInfo.InvariantCulture);

            string burstCount = GetParam(p, "burst_count", "");
            string burstTime = GetParam(p, "burst_time", "0");
            if (!string.IsNullOrEmpty(burstCount))
            {
                short count = short.Parse(burstCount);
                float time = float.Parse(burstTime, System.Globalization.CultureInfo.InvariantCulture);
                emission.SetBurst(0, new ParticleSystem.Burst(time, count));
            }

            return new ToolResult
            {
                success = true,
                message = $"Updated emission settings on '{go.name}'"
            };
        }

        private static ToolResult SetParticleShape(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            ParticleSystem ps = go.GetComponent<ParticleSystem>();
            if (ps == null) return Fail($"No ParticleSystem on '{targetName}'");

            Undo.RecordObject(ps, "Set particle shape");
            var shape = ps.shape;

            string shapeType = GetParam(p, "shape", "");
            if (!string.IsNullOrEmpty(shapeType))
            {
                switch (shapeType.ToLower())
                {
                    case "sphere": shape.shapeType = ParticleSystemShapeType.Sphere; break;
                    case "hemisphere": shape.shapeType = ParticleSystemShapeType.Hemisphere; break;
                    case "cone": shape.shapeType = ParticleSystemShapeType.Cone; break;
                    case "box": shape.shapeType = ParticleSystemShapeType.Box; break;
                    case "circle": shape.shapeType = ParticleSystemShapeType.Circle; break;
                    case "edge": shape.shapeType = ParticleSystemShapeType.SingleSidedEdge; break;
                    case "donut": shape.shapeType = ParticleSystemShapeType.Donut; break;
                    case "rectangle": shape.shapeType = ParticleSystemShapeType.Rectangle; break;
                }
            }

            string radius = GetParam(p, "radius", "");
            if (!string.IsNullOrEmpty(radius))
                shape.radius = float.Parse(radius, System.Globalization.CultureInfo.InvariantCulture);

            string angle = GetParam(p, "angle", "");
            if (!string.IsNullOrEmpty(angle))
                shape.angle = float.Parse(angle, System.Globalization.CultureInfo.InvariantCulture);

            string scaleStr = GetParam(p, "scale", "");
            if (!string.IsNullOrEmpty(scaleStr) && TryParseVector3(scaleStr, out Vector3 scale))
                shape.scale = scale;

            return new ToolResult
            {
                success = true,
                message = $"Updated shape settings on '{go.name}' ({shape.shapeType})"
            };
        }

        private static ToolResult SetParticleColor(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            ParticleSystem ps = go.GetComponent<ParticleSystem>();
            if (ps == null) return Fail($"No ParticleSystem on '{targetName}'");

            Undo.RecordObject(ps, "Set particle color");

            string startColor = GetParam(p, "start_color", "");
            if (!string.IsNullOrEmpty(startColor) && TryParseColor(startColor, out Color sColor))
            {
                var main = ps.main;
                main.startColor = sColor;
            }

            string colorOverLifetime = GetParam(p, "color_over_lifetime", "");
            if (!string.IsNullOrEmpty(colorOverLifetime))
            {
                var col = ps.colorOverLifetime;
                col.enabled = true;

                string[] colorStops = colorOverLifetime.Split(';');
                if (colorStops.Length >= 2)
                {
                    Gradient gradient = new Gradient();
                    GradientColorKey[] colorKeys = new GradientColorKey[colorStops.Length];
                    GradientAlphaKey[] alphaKeys = new GradientAlphaKey[colorStops.Length];

                    for (int i = 0; i < colorStops.Length; i++)
                    {
                        float t = (float)i / (colorStops.Length - 1);
                        if (TryParseColor(colorStops[i].Trim(), out Color c))
                        {
                            colorKeys[i] = new GradientColorKey(c, t);
                            alphaKeys[i] = new GradientAlphaKey(c.a, t);
                        }
                    }

                    gradient.SetKeys(colorKeys, alphaKeys);
                    col.color = new ParticleSystem.MinMaxGradient(gradient);
                }
            }

            return new ToolResult
            {
                success = true,
                message = $"Updated color settings on '{go.name}'"
            };
        }

        private static ToolResult SetParticleSize(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            ParticleSystem ps = go.GetComponent<ParticleSystem>();
            if (ps == null) return Fail($"No ParticleSystem on '{targetName}'");

            Undo.RecordObject(ps, "Set particle size");

            string startSize = GetParam(p, "start_size", "");
            if (!string.IsNullOrEmpty(startSize))
            {
                var main = ps.main;
                main.startSize = float.Parse(startSize, System.Globalization.CultureInfo.InvariantCulture);
            }

            string sizeOverLifetime = GetParam(p, "size_over_lifetime", "");
            if (!string.IsNullOrEmpty(sizeOverLifetime))
            {
                var sol = ps.sizeOverLifetime;
                sol.enabled = true;

                string[] sizeStops = sizeOverLifetime.Split(';');
                Keyframe[] keys = new Keyframe[sizeStops.Length];
                for (int i = 0; i < sizeStops.Length; i++)
                {
                    float t = (float)i / Mathf.Max(1, sizeStops.Length - 1);
                    float v = float.Parse(sizeStops[i].Trim(), System.Globalization.CultureInfo.InvariantCulture);
                    keys[i] = new Keyframe(t, v);
                }
                AnimationCurve curve = new AnimationCurve(keys);
                sol.size = new ParticleSystem.MinMaxCurve(1f, curve);
            }

            return new ToolResult
            {
                success = true,
                message = $"Updated size settings on '{go.name}'"
            };
        }

        private static ToolResult SetParticleLifetime(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            ParticleSystem ps = go.GetComponent<ParticleSystem>();
            if (ps == null) return Fail($"No ParticleSystem on '{targetName}'");

            Undo.RecordObject(ps, "Set particle lifetime");
            var main = ps.main;

            string minLifetime = GetParam(p, "min", "");
            string maxLifetime = GetParam(p, "max", "");

            if (!string.IsNullOrEmpty(minLifetime) && !string.IsNullOrEmpty(maxLifetime))
            {
                float min = float.Parse(minLifetime, System.Globalization.CultureInfo.InvariantCulture);
                float max = float.Parse(maxLifetime, System.Globalization.CultureInfo.InvariantCulture);
                main.startLifetime = new ParticleSystem.MinMaxCurve(min, max);
            }
            else
            {
                string lifetime = GetParam(p, "lifetime", "5");
                main.startLifetime = float.Parse(lifetime, System.Globalization.CultureInfo.InvariantCulture);
            }

            return new ToolResult
            {
                success = true,
                message = $"Updated lifetime settings on '{go.name}'"
            };
        }

        private static ToolResult SetParticleVelocity(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            ParticleSystem ps = go.GetComponent<ParticleSystem>();
            if (ps == null) return Fail($"No ParticleSystem on '{targetName}'");

            Undo.RecordObject(ps, "Set particle velocity");

            string startSpeed = GetParam(p, "start_speed", "");
            if (!string.IsNullOrEmpty(startSpeed))
            {
                var main = ps.main;
                main.startSpeed = float.Parse(startSpeed, System.Globalization.CultureInfo.InvariantCulture);
            }

            string velocityStr = GetParam(p, "velocity", "");
            if (!string.IsNullOrEmpty(velocityStr) && TryParseVector3(velocityStr, out Vector3 vel))
            {
                var vol = ps.velocityOverLifetime;
                vol.enabled = true;
                vol.x = vel.x;
                vol.y = vel.y;
                vol.z = vel.z;
            }

            string gravity = GetParam(p, "gravity", "");
            if (!string.IsNullOrEmpty(gravity))
            {
                var main = ps.main;
                main.gravityModifier = float.Parse(gravity, System.Globalization.CultureInfo.InvariantCulture);
            }

            return new ToolResult
            {
                success = true,
                message = $"Updated velocity settings on '{go.name}'"
            };
        }

        private static ToolResult AddPostProcessing(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Post Processing Volume");

            Type volumeType = FindType("UnityEngine.Rendering.Volume");
            if (volumeType == null)
                volumeType = FindType("UnityEngine.Rendering.PostProcessing.PostProcessVolume");

            if (volumeType == null)
                return Fail("Post-processing package not found. Install com.unity.render-pipelines.universal or com.unity.postprocessing via Package Manager.");

            GameObject volumeGo = new GameObject(name);
            Component volume = volumeGo.AddComponent(volumeType);

            string isGlobal = GetParam(p, "is_global", "true");
            var globalProp = volumeType.GetProperty("isGlobal");
            if (globalProp != null)
                globalProp.SetValue(volume, isGlobal == "true");

            string priority = GetParam(p, "priority", "");
            if (!string.IsNullOrEmpty(priority))
            {
                var priorityProp = volumeType.GetProperty("priority");
                if (priorityProp != null)
                    priorityProp.SetValue(volume, float.Parse(priority, System.Globalization.CultureInfo.InvariantCulture));
            }

            Undo.RegisterCreatedObjectUndo(volumeGo, "Add Post Processing Volume");

            return new ToolResult
            {
                success = true,
                message = $"Created post-processing volume '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{volumeGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult SetBloom(Dictionary<string, string> p)
        {
            string targetName = GetParam(p, "target", "");

            Type volumeType = FindType("UnityEngine.Rendering.Volume");
            if (volumeType == null)
                return Fail("URP/HDRP Volume system not found. Install a render pipeline package.");

            GameObject volumeGo = null;
            if (!string.IsNullOrEmpty(targetName))
                volumeGo = FindByNameOrId(targetName);

            if (volumeGo == null)
            {
                Component[] volumes = UnityEngine.Object.FindObjectsOfType(volumeType) as Component[];
                if (volumes != null && volumes.Length > 0)
                    volumeGo = ((Component)volumes[0]).gameObject;
            }

            if (volumeGo == null)
                return Fail("No Volume found in scene. Create one first with add_post_processing.");

            Component volume = volumeGo.GetComponent(volumeType);
            var profileProp = volumeType.GetProperty("profile");
            if (profileProp == null)
                return Fail("Could not access Volume profile property");

            object profile = profileProp.GetValue(volume);
            if (profile == null)
            {
                Type profileType = FindType("UnityEngine.Rendering.VolumeProfile");
                if (profileType != null)
                {
                    profile = ScriptableObject.CreateInstance(profileType);
                    profileProp.SetValue(volume, profile);
                }
            }

            if (profile == null)
                return Fail("Could not get or create Volume profile");

            Type bloomType = FindType("UnityEngine.Rendering.Universal.Bloom");
            if (bloomType == null)
                bloomType = FindType("UnityEngine.Rendering.HighDefinition.Bloom");

            if (bloomType == null)
                return Fail("Bloom override type not found. Ensure URP or HDRP is installed.");

            var addMethod = profile.GetType().GetMethod("Add");
            if (addMethod != null)
            {
                var genericAdd = addMethod.MakeGenericMethod(bloomType);
                object bloom = genericAdd.Invoke(profile, new object[] { true });

                string intensity = GetParam(p, "intensity", "1");
                string threshold = GetParam(p, "threshold", "0.9");

                var intensityField = bloomType.GetField("intensity");
                if (intensityField != null)
                {
                    object intensityParam = intensityField.GetValue(bloom);
                    var overrideProp = intensityParam.GetType().GetProperty("value");
                    var overrideStateProp = intensityParam.GetType().GetProperty("overrideState");
                    if (overrideProp != null) overrideProp.SetValue(intensityParam, float.Parse(intensity, System.Globalization.CultureInfo.InvariantCulture));
                    if (overrideStateProp != null) overrideStateProp.SetValue(intensityParam, true);
                }

                var thresholdField = bloomType.GetField("threshold");
                if (thresholdField != null)
                {
                    object thresholdParam = thresholdField.GetValue(bloom);
                    var overrideProp = thresholdParam.GetType().GetProperty("value");
                    var overrideStateProp = thresholdParam.GetType().GetProperty("overrideState");
                    if (overrideProp != null) overrideProp.SetValue(thresholdParam, float.Parse(threshold, System.Globalization.CultureInfo.InvariantCulture));
                    if (overrideStateProp != null) overrideStateProp.SetValue(thresholdParam, true);
                }
            }

            return new ToolResult
            {
                success = true,
                message = "Configured bloom effect"
            };
        }

        private static ToolResult SetDepthOfField(Dictionary<string, string> p)
        {
            string targetName = GetParam(p, "target", "");

            Type volumeType = FindType("UnityEngine.Rendering.Volume");
            if (volumeType == null)
                return Fail("URP/HDRP Volume system not found.");

            GameObject volumeGo = null;
            if (!string.IsNullOrEmpty(targetName))
                volumeGo = FindByNameOrId(targetName);

            if (volumeGo == null)
            {
                Component[] volumes = UnityEngine.Object.FindObjectsOfType(volumeType) as Component[];
                if (volumes != null && volumes.Length > 0)
                    volumeGo = ((Component)volumes[0]).gameObject;
            }

            if (volumeGo == null)
                return Fail("No Volume found in scene.");

            Component volume = volumeGo.GetComponent(volumeType);
            var profileProp = volumeType.GetProperty("profile");
            object profile = profileProp?.GetValue(volume);

            if (profile == null)
                return Fail("No Volume profile found");

            Type dofType = FindType("UnityEngine.Rendering.Universal.DepthOfField");
            if (dofType == null)
                dofType = FindType("UnityEngine.Rendering.HighDefinition.DepthOfField");

            if (dofType == null)
                return Fail("DepthOfField override type not found.");

            var addMethod = profile.GetType().GetMethod("Add");
            if (addMethod != null)
            {
                var genericAdd = addMethod.MakeGenericMethod(dofType);
                object dof = genericAdd.Invoke(profile, new object[] { true });

                string focusDistance = GetParam(p, "focus_distance", "10");
                var focusDistField = dofType.GetField("focusDistance");
                if (focusDistField != null)
                {
                    object focusParam = focusDistField.GetValue(dof);
                    var valueProp = focusParam.GetType().GetProperty("value");
                    var stateProp = focusParam.GetType().GetProperty("overrideState");
                    if (valueProp != null) valueProp.SetValue(focusParam, float.Parse(focusDistance, System.Globalization.CultureInfo.InvariantCulture));
                    if (stateProp != null) stateProp.SetValue(focusParam, true);
                }

                string aperture = GetParam(p, "aperture", "");
                if (!string.IsNullOrEmpty(aperture))
                {
                    var apertureField = dofType.GetField("aperture");
                    if (apertureField != null)
                    {
                        object apertureParam = apertureField.GetValue(dof);
                        var valueProp = apertureParam.GetType().GetProperty("value");
                        var stateProp = apertureParam.GetType().GetProperty("overrideState");
                        if (valueProp != null) valueProp.SetValue(apertureParam, float.Parse(aperture, System.Globalization.CultureInfo.InvariantCulture));
                        if (stateProp != null) stateProp.SetValue(apertureParam, true);
                    }
                }
            }

            return new ToolResult
            {
                success = true,
                message = "Configured depth of field effect"
            };
        }

        // --- Helpers ---

        private static Type FindType(string typeName)
        {
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                Type t = assembly.GetType(typeName);
                if (t != null) return t;
            }
            return null;
        }

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
