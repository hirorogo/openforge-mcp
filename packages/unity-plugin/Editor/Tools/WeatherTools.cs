using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class WeatherTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_weather_system", CreateWeatherSystem);
            ToolExecutor.Register("set_rain", SetRain);
            ToolExecutor.Register("set_snow", SetSnow);
            ToolExecutor.Register("set_fog_weather", SetFogWeather);
            ToolExecutor.Register("set_thunderstorm", SetThunderstorm);
            ToolExecutor.Register("create_day_night_cycle", CreateDayNightCycle);
            ToolExecutor.Register("set_time_of_day", SetTimeOfDay);
            ToolExecutor.Register("set_wind", SetWind);
            ToolExecutor.Register("create_cloud_system", CreateCloudSystem);
            ToolExecutor.Register("get_weather_info", GetWeatherInfo);
        }

        private static ToolResult CreateWeatherSystem(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "WeatherSystem");

            GameObject existing = GameObject.Find(name);
            if (existing != null)
                return Fail($"Weather system '{name}' already exists");

            GameObject root = new GameObject(name);
            Undo.RegisterCreatedObjectUndo(root, "Create Weather System");

            // Rain child (disabled by default).
            GameObject rainObj = CreateParticleChild(root, "Rain", CreateRainSystem, false);
            // Snow child (disabled by default).
            GameObject snowObj = CreateParticleChild(root, "Snow", CreateSnowSystem, false);
            // Wind zone.
            GameObject windObj = new GameObject("WindZone");
            Undo.RegisterCreatedObjectUndo(windObj, "Create Wind Zone");
            windObj.transform.SetParent(root.transform);
            WindZone wz = Undo.AddComponent<WindZone>(windObj);
            wz.windMain = 1f;
            wz.windTurbulence = 0.5f;
            wz.mode = WindZoneMode.Directional;

            return new ToolResult
            {
                success = true,
                message = $"Created weather system '{name}' with rain, snow, and wind children",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"children\":[\"Rain\",\"Snow\",\"WindZone\"]}}"
            };
        }

        private static ToolResult SetRain(Dictionary<string, string> p)
        {
            bool enable = GetParam(p, "enabled", "true") != "false";
            float intensity = ParseFloat(p, "intensity", 1f);
            float areaSize = ParseFloat(p, "area_size", 30f);

            GameObject rainObj = FindOrCreateWeatherChild("Rain");

            ParticleSystem ps = rainObj.GetComponent<ParticleSystem>();
            if (ps == null)
            {
                ps = Undo.AddComponent<ParticleSystem>(rainObj);
                ConfigureRain(ps, intensity, areaSize);
            }
            else
            {
                Undo.RecordObject(ps, "Set Rain");
                ConfigureRain(ps, intensity, areaSize);
            }

            Undo.RecordObject(rainObj, "Toggle Rain");
            rainObj.SetActive(enable);

            // Add rain audio if available.
            AudioSource audio = rainObj.GetComponent<AudioSource>();
            if (audio == null && enable)
            {
                audio = Undo.AddComponent<AudioSource>(rainObj);
                audio.loop = true;
                audio.spatialBlend = 0f;
                audio.volume = Mathf.Clamp01(intensity * 0.5f);
            }
            else if (audio != null)
            {
                Undo.RecordObject(audio, "Set Rain Audio");
                audio.volume = Mathf.Clamp01(intensity * 0.5f);
                audio.enabled = enable;
            }

            return new ToolResult
            {
                success = true,
                message = $"Rain {(enable ? "enabled" : "disabled")} (intensity={intensity})",
                data = $"{{\"enabled\":{(enable ? "true" : "false")},\"intensity\":{F(intensity)},\"areaSize\":{F(areaSize)}}}"
            };
        }

        private static ToolResult SetSnow(Dictionary<string, string> p)
        {
            bool enable = GetParam(p, "enabled", "true") != "false";
            float intensity = ParseFloat(p, "intensity", 1f);
            float areaSize = ParseFloat(p, "area_size", 30f);

            GameObject snowObj = FindOrCreateWeatherChild("Snow");

            ParticleSystem ps = snowObj.GetComponent<ParticleSystem>();
            if (ps == null)
            {
                ps = Undo.AddComponent<ParticleSystem>(snowObj);
                ConfigureSnow(ps, intensity, areaSize);
            }
            else
            {
                Undo.RecordObject(ps, "Set Snow");
                ConfigureSnow(ps, intensity, areaSize);
            }

            Undo.RecordObject(snowObj, "Toggle Snow");
            snowObj.SetActive(enable);

            return new ToolResult
            {
                success = true,
                message = $"Snow {(enable ? "enabled" : "disabled")} (intensity={intensity})",
                data = $"{{\"enabled\":{(enable ? "true" : "false")},\"intensity\":{F(intensity)},\"areaSize\":{F(areaSize)}}}"
            };
        }

        private static ToolResult SetFogWeather(Dictionary<string, string> p)
        {
            bool enable = GetParam(p, "enabled", "true") != "false";
            float density = ParseFloat(p, "density", 0.05f);
            string colorStr = GetParam(p, "color", "");

            Undo.RecordObject(UnityEngine.Object.FindObjectOfType<RenderSettings>() as UnityEngine.Object ?? RenderSettings.defaultReflectionMode as UnityEngine.Object, "Set Fog");

            RenderSettings.fog = enable;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogDensity = density;

            if (!string.IsNullOrEmpty(colorStr))
            {
                if (ColorUtility.TryParseHtmlString(colorStr, out Color col))
                {
                    RenderSettings.fogColor = col;
                }
                else if (TryParseColorRGB(colorStr, out Color rgbCol))
                {
                    RenderSettings.fogColor = rgbCol;
                }
            }
            else if (enable)
            {
                RenderSettings.fogColor = new Color(0.75f, 0.75f, 0.78f, 1f);
            }

            return new ToolResult
            {
                success = true,
                message = $"Fog {(enable ? "enabled" : "disabled")} (density={density})",
                data = $"{{\"enabled\":{(enable ? "true" : "false")},\"density\":{F(density)},\"color\":\"{RenderSettings.fogColor}\"}}"
            };
        }

        private static ToolResult SetThunderstorm(Dictionary<string, string> p)
        {
            bool enable = GetParam(p, "enabled", "true") != "false";
            float rainIntensity = ParseFloat(p, "rain_intensity", 1.5f);
            float lightningInterval = ParseFloat(p, "lightning_interval", 5f);

            // Set up heavy rain.
            GameObject rainObj = FindOrCreateWeatherChild("Rain");
            ParticleSystem rainPs = rainObj.GetComponent<ParticleSystem>();
            if (rainPs == null)
                rainPs = Undo.AddComponent<ParticleSystem>(rainObj);
            ConfigureRain(rainPs, rainIntensity, 40f);
            rainObj.SetActive(enable);

            // Create lightning light.
            GameObject lightningObj = FindOrCreateWeatherChild("Lightning");
            Light lightningLight = lightningObj.GetComponent<Light>();
            if (lightningLight == null)
            {
                lightningLight = Undo.AddComponent<Light>(lightningObj);
            }
            else
            {
                Undo.RecordObject(lightningLight, "Set Lightning Light");
            }

            lightningLight.type = LightType.Directional;
            lightningLight.color = new Color(0.8f, 0.85f, 1f);
            lightningLight.intensity = 3f;
            lightningLight.enabled = false;
            lightningObj.SetActive(enable);

            // Set dark fog.
            RenderSettings.fog = enable;
            if (enable)
            {
                RenderSettings.fogMode = FogMode.ExponentialSquared;
                RenderSettings.fogDensity = 0.02f;
                RenderSettings.fogColor = new Color(0.3f, 0.3f, 0.35f, 1f);
            }

            // Darken ambient.
            if (enable)
            {
                RenderSettings.ambientIntensity = 0.4f;
            }
            else
            {
                RenderSettings.ambientIntensity = 1f;
            }

            return new ToolResult
            {
                success = true,
                message = $"Thunderstorm {(enable ? "enabled" : "disabled")} (rain={rainIntensity}, lightning interval={lightningInterval}s)",
                data = $"{{\"enabled\":{(enable ? "true" : "false")},\"rainIntensity\":{F(rainIntensity)},\"lightningInterval\":{F(lightningInterval)}}}"
            };
        }

        private static ToolResult CreateDayNightCycle(Dictionary<string, string> p)
        {
            float cycleDuration = ParseFloat(p, "cycle_duration", 120f);
            float startTime = ParseFloat(p, "start_time", 12f);

            GameObject existing = GameObject.Find("DayNightCycle");
            if (existing != null)
            {
                Undo.DestroyObjectImmediate(existing);
            }

            GameObject root = new GameObject("DayNightCycle");
            Undo.RegisterCreatedObjectUndo(root, "Create Day Night Cycle");

            // Directional light (sun).
            GameObject sunObj = new GameObject("Sun");
            Undo.RegisterCreatedObjectUndo(sunObj, "Create Sun");
            sunObj.transform.SetParent(root.transform);
            Light sunLight = sunObj.AddComponent<Light>();
            sunLight.type = LightType.Directional;
            sunLight.color = new Color(1f, 0.96f, 0.84f);
            sunLight.intensity = 1.2f;
            sunLight.shadows = LightShadows.Soft;

            // Moon light.
            GameObject moonObj = new GameObject("Moon");
            Undo.RegisterCreatedObjectUndo(moonObj, "Create Moon");
            moonObj.transform.SetParent(root.transform);
            Light moonLight = moonObj.AddComponent<Light>();
            moonLight.type = LightType.Directional;
            moonLight.color = new Color(0.4f, 0.45f, 0.65f);
            moonLight.intensity = 0.1f;
            moonLight.shadows = LightShadows.Soft;
            moonLight.enabled = false;

            // Set initial sun rotation based on start time.
            float sunAngle = (startTime / 24f) * 360f - 90f;
            sunObj.transform.rotation = Quaternion.Euler(sunAngle, -30f, 0f);
            moonObj.transform.rotation = Quaternion.Euler(sunAngle + 180f, -30f, 0f);

            // Write the cycle controller script.
            string folder = GetParam(p, "folder", "Assets/Scripts/Environment");
            if (!System.IO.Directory.Exists(folder))
                System.IO.Directory.CreateDirectory(folder);

            string scriptPath = System.IO.Path.Combine(folder, "DayNightController.cs");
            string script = $@"using UnityEngine;

/// <summary>
/// Rotates the sun and moon directional lights over a configurable cycle.
/// Adjusts ambient color, fog color, and light intensity/color based on
/// time of day. Time range is 0-24 where 12 = noon.
/// </summary>
public class DayNightController : MonoBehaviour
{{
    [Header(""Lights"")]
    public Light sunLight;
    public Light moonLight;

    [Header(""Timing"")]
    public float cycleDurationSeconds = {F(cycleDuration)};
    public float currentTime = {F(startTime)};
    public bool paused;

    [Header(""Colors"")]
    public Gradient sunColorGradient;
    public Gradient ambientGradient;
    public Gradient fogGradient;
    public AnimationCurve sunIntensityCurve = AnimationCurve.EaseInOut(0f, 0f, 1f, 1.2f);

    public float TimeOfDay => currentTime;
    public float NormalizedTime => currentTime / 24f;
    public bool IsDay => currentTime >= 6f && currentTime < 18f;

    public event System.Action<float> OnTimeChanged;
    public event System.Action OnSunrise;
    public event System.Action OnSunset;

    private bool _wasDay;

    private void Awake()
    {{
        if (sunColorGradient == null || sunColorGradient.colorKeys.Length < 2)
        {{
            sunColorGradient = new Gradient();
            sunColorGradient.SetKeys(
                new GradientColorKey[] {{
                    new GradientColorKey(new Color(0.4f, 0.2f, 0.1f), 0f),
                    new GradientColorKey(new Color(1f, 0.6f, 0.3f), 0.25f),
                    new GradientColorKey(new Color(1f, 0.96f, 0.84f), 0.5f),
                    new GradientColorKey(new Color(1f, 0.5f, 0.2f), 0.75f),
                    new GradientColorKey(new Color(0.2f, 0.1f, 0.3f), 1f)
                }},
                new GradientAlphaKey[] {{ new GradientAlphaKey(1f, 0f), new GradientAlphaKey(1f, 1f) }}
            );
        }}

        if (ambientGradient == null || ambientGradient.colorKeys.Length < 2)
        {{
            ambientGradient = new Gradient();
            ambientGradient.SetKeys(
                new GradientColorKey[] {{
                    new GradientColorKey(new Color(0.05f, 0.05f, 0.1f), 0f),
                    new GradientColorKey(new Color(0.5f, 0.4f, 0.35f), 0.25f),
                    new GradientColorKey(new Color(0.7f, 0.75f, 0.8f), 0.5f),
                    new GradientColorKey(new Color(0.5f, 0.35f, 0.3f), 0.75f),
                    new GradientColorKey(new Color(0.05f, 0.05f, 0.1f), 1f)
                }},
                new GradientAlphaKey[] {{ new GradientAlphaKey(1f, 0f), new GradientAlphaKey(1f, 1f) }}
            );
        }}

        _wasDay = IsDay;
    }}

    private void Update()
    {{
        if (paused) return;

        float hoursPerSecond = 24f / cycleDurationSeconds;
        currentTime += hoursPerSecond * Time.deltaTime;
        if (currentTime >= 24f) currentTime -= 24f;

        UpdateLighting();
        CheckDayNightTransition();
        OnTimeChanged?.Invoke(currentTime);
    }}

    private void UpdateLighting()
    {{
        float t = NormalizedTime;
        float sunAngle = t * 360f - 90f;

        if (sunLight != null)
        {{
            sunLight.transform.rotation = Quaternion.Euler(sunAngle, -30f, 0f);
            sunLight.color = sunColorGradient.Evaluate(t);
            sunLight.intensity = sunIntensityCurve.Evaluate(t);
            sunLight.enabled = sunAngle > -10f && sunAngle < 190f;
        }}

        if (moonLight != null)
        {{
            moonLight.transform.rotation = Quaternion.Euler(sunAngle + 180f, -30f, 0f);
            moonLight.enabled = !IsDay;
            moonLight.intensity = IsDay ? 0f : 0.15f;
        }}

        RenderSettings.ambientLight = ambientGradient.Evaluate(t);

        if (fogGradient != null && fogGradient.colorKeys.Length > 1)
            RenderSettings.fogColor = fogGradient.Evaluate(t);
    }}

    private void CheckDayNightTransition()
    {{
        bool isNowDay = IsDay;
        if (isNowDay && !_wasDay) OnSunrise?.Invoke();
        if (!isNowDay && _wasDay) OnSunset?.Invoke();
        _wasDay = isNowDay;
    }}

    public void SetTime(float hour)
    {{
        currentTime = Mathf.Repeat(hour, 24f);
        UpdateLighting();
        OnTimeChanged?.Invoke(currentTime);
    }}
}}
";
            System.IO.File.WriteAllText(scriptPath, script);
            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created day/night cycle (duration={cycleDuration}s, start={startTime}h)",
                data = $"{{\"cycleDuration\":{F(cycleDuration)},\"startTime\":{F(startTime)},\"script\":\"{EscapeJson(scriptPath)}\"}}"
            };
        }

        private static ToolResult SetTimeOfDay(Dictionary<string, string> p)
        {
            float hour = ParseFloat(p, "hour", 12f);
            hour = Mathf.Repeat(hour, 24f);

            // Update sun rotation directly.
            float sunAngle = (hour / 24f) * 360f - 90f;

            Light[] lights = UnityEngine.Object.FindObjectsOfType<Light>();
            Light sunLight = null;
            foreach (Light l in lights)
            {
                if (l.type == LightType.Directional && l.gameObject.name.Contains("Sun"))
                {
                    sunLight = l;
                    break;
                }
            }

            // Fall back to any directional light.
            if (sunLight == null)
            {
                foreach (Light l in lights)
                {
                    if (l.type == LightType.Directional)
                    {
                        sunLight = l;
                        break;
                    }
                }
            }

            if (sunLight != null)
            {
                Undo.RecordObject(sunLight.transform, "Set Time Of Day");
                sunLight.transform.rotation = Quaternion.Euler(sunAngle, sunLight.transform.eulerAngles.y, 0f);

                // Adjust intensity based on time.
                Undo.RecordObject(sunLight, "Set Sun Intensity");
                if (hour >= 6f && hour <= 18f)
                {
                    float t = (hour - 6f) / 12f;
                    sunLight.intensity = Mathf.Sin(t * Mathf.PI) * 1.2f;
                    sunLight.enabled = true;
                }
                else
                {
                    sunLight.intensity = 0f;
                    sunLight.enabled = false;
                }
            }

            // Adjust ambient based on time.
            bool isDay = hour >= 6f && hour < 18f;
            if (isDay)
            {
                float t = (hour - 6f) / 12f;
                float brightness = Mathf.Sin(t * Mathf.PI);
                RenderSettings.ambientIntensity = 0.3f + brightness * 0.7f;
            }
            else
            {
                RenderSettings.ambientIntensity = 0.15f;
            }

            return new ToolResult
            {
                success = true,
                message = $"Set time of day to {hour:F1}h ({(isDay ? "day" : "night")})",
                data = $"{{\"hour\":{F(hour)},\"isDay\":{(isDay ? "true" : "false")},\"sunAngle\":{F(sunAngle)}}}"
            };
        }

        private static ToolResult SetWind(Dictionary<string, string> p)
        {
            float main = ParseFloat(p, "main", 1f);
            float turbulence = ParseFloat(p, "turbulence", 0.5f);
            float pulseFrequency = ParseFloat(p, "pulse_frequency", 0.5f);
            string mode = GetParam(p, "mode", "directional");

            // Find existing wind zone or create one.
            WindZone wz = UnityEngine.Object.FindObjectOfType<WindZone>();
            if (wz == null)
            {
                GameObject windObj = new GameObject("WindZone");
                Undo.RegisterCreatedObjectUndo(windObj, "Create Wind Zone");
                wz = Undo.AddComponent<WindZone>(windObj);
            }
            else
            {
                Undo.RecordObject(wz, "Set Wind");
            }

            wz.windMain = main;
            wz.windTurbulence = turbulence;
            wz.windPulseFrequency = pulseFrequency;
            wz.mode = mode.ToLower() == "spherical" ? WindZoneMode.Spherical : WindZoneMode.Directional;

            if (TryParseVector3(p, "direction", out Vector3 dir))
            {
                Undo.RecordObject(wz.transform, "Set Wind Direction");
                wz.transform.rotation = Quaternion.LookRotation(dir.normalized);
            }

            return new ToolResult
            {
                success = true,
                message = $"Set wind (main={main}, turbulence={turbulence}, mode={mode})",
                data = $"{{\"main\":{F(main)},\"turbulence\":{F(turbulence)},\"mode\":\"{EscapeJson(mode)}\"}}"
            };
        }

        private static ToolResult CreateCloudSystem(Dictionary<string, string> p)
        {
            float height = ParseFloat(p, "height", 50f);
            float areaSize = ParseFloat(p, "area_size", 100f);
            int count = int.TryParse(GetParam(p, "count", "200"), out int c) ? c : 200;

            GameObject cloudObj = FindOrCreateWeatherChild("Clouds");
            cloudObj.transform.localPosition = new Vector3(0f, height, 0f);

            ParticleSystem ps = cloudObj.GetComponent<ParticleSystem>();
            if (ps == null)
                ps = Undo.AddComponent<ParticleSystem>(cloudObj);
            else
                Undo.RecordObject(ps, "Create Cloud System");

            // Stop to modify.
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);

            var main = ps.main;
            main.maxParticles = count;
            main.startLifetime = 60f;
            main.startSpeed = 0.5f;
            main.startSize = new ParticleSystem.MinMaxCurve(8f, 20f);
            main.startColor = new Color(1f, 1f, 1f, 0.6f);
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.loop = true;
            main.gravityModifier = 0f;

            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Box;
            shape.scale = new Vector3(areaSize, 2f, areaSize);

            var emission = ps.emission;
            emission.rateOverTime = count / 30f;

            var colorOverLifetime = ps.colorOverLifetime;
            colorOverLifetime.enabled = true;
            Gradient grad = new Gradient();
            grad.SetKeys(
                new GradientColorKey[] {
                    new GradientColorKey(Color.white, 0f),
                    new GradientColorKey(Color.white, 1f)
                },
                new GradientAlphaKey[] {
                    new GradientAlphaKey(0f, 0f),
                    new GradientAlphaKey(0.5f, 0.2f),
                    new GradientAlphaKey(0.5f, 0.8f),
                    new GradientAlphaKey(0f, 1f)
                }
            );
            colorOverLifetime.color = grad;

            var velocityOverLifetime = ps.velocityOverLifetime;
            velocityOverLifetime.enabled = true;
            velocityOverLifetime.x = new ParticleSystem.MinMaxCurve(0.2f, 1f);
            velocityOverLifetime.y = 0f;
            velocityOverLifetime.z = new ParticleSystem.MinMaxCurve(-0.3f, 0.3f);

            var renderer = cloudObj.GetComponent<ParticleSystemRenderer>();
            if (renderer != null)
            {
                renderer.renderMode = ParticleSystemRenderMode.Billboard;
                renderer.material = new Material(Shader.Find("Particles/Standard Unlit"));
                renderer.material.color = new Color(1f, 1f, 1f, 0.4f);
            }

            ps.Play();

            return new ToolResult
            {
                success = true,
                message = $"Created cloud system at height {height} with {count} particles",
                data = $"{{\"height\":{F(height)},\"areaSize\":{F(areaSize)},\"count\":{count}}}"
            };
        }

        private static ToolResult GetWeatherInfo(Dictionary<string, string> p)
        {
            StringBuilder sb = new StringBuilder("{");

            // Rain status.
            GameObject rain = GameObject.Find("Rain");
            sb.Append($"\"rain\":{{\"active\":{(rain != null && rain.activeSelf ? "true" : "false")}");
            if (rain != null)
            {
                ParticleSystem ps = rain.GetComponent<ParticleSystem>();
                if (ps != null)
                {
                    var em = ps.emission;
                    sb.Append($",\"rate\":{F(em.rateOverTime.constant)}");
                }
            }
            sb.Append("},");

            // Snow status.
            GameObject snow = GameObject.Find("Snow");
            sb.Append($"\"snow\":{{\"active\":{(snow != null && snow.activeSelf ? "true" : "false")}");
            if (snow != null)
            {
                ParticleSystem ps = snow.GetComponent<ParticleSystem>();
                if (ps != null)
                {
                    var em = ps.emission;
                    sb.Append($",\"rate\":{F(em.rateOverTime.constant)}");
                }
            }
            sb.Append("},");

            // Fog.
            sb.Append($"\"fog\":{{\"enabled\":{(RenderSettings.fog ? "true" : "false")},\"density\":{F(RenderSettings.fogDensity)},\"color\":\"{RenderSettings.fogColor}\"}},");

            // Wind.
            WindZone wz = UnityEngine.Object.FindObjectOfType<WindZone>();
            if (wz != null)
            {
                sb.Append($"\"wind\":{{\"main\":{F(wz.windMain)},\"turbulence\":{F(wz.windTurbulence)},\"mode\":\"{wz.mode}\"}},");
            }
            else
            {
                sb.Append("\"wind\":null,");
            }

            // Clouds.
            GameObject clouds = GameObject.Find("Clouds");
            sb.Append($"\"clouds\":{{\"active\":{(clouds != null && clouds.activeSelf ? "true" : "false")}");
            if (clouds != null)
            {
                sb.Append($",\"height\":{F(clouds.transform.position.y)}");
            }
            sb.Append("},");

            // Ambient.
            sb.Append($"\"ambientIntensity\":{F(RenderSettings.ambientIntensity)},");
            sb.Append($"\"ambientColor\":\"{RenderSettings.ambientLight}\"");

            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = "Retrieved weather state",
                data = sb.ToString()
            };
        }

        // --- Particle Helpers ---

        private static void ConfigureRain(ParticleSystem ps, float intensity, float areaSize)
        {
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);

            var main = ps.main;
            main.maxParticles = Mathf.RoundToInt(5000 * intensity);
            main.startLifetime = 1.5f;
            main.startSpeed = new ParticleSystem.MinMaxCurve(15f, 25f);
            main.startSize = new ParticleSystem.MinMaxCurve(0.02f, 0.05f);
            main.startColor = new Color(0.7f, 0.75f, 0.85f, 0.7f);
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.loop = true;
            main.gravityModifier = 1.5f;

            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Box;
            shape.scale = new Vector3(areaSize, 0.5f, areaSize);
            shape.position = new Vector3(0f, 20f, 0f);

            var emission = ps.emission;
            emission.rateOverTime = 500f * intensity;

            var renderer = ps.GetComponent<ParticleSystemRenderer>();
            if (renderer != null)
            {
                renderer.renderMode = ParticleSystemRenderMode.Stretch;
                renderer.lengthScale = 5f;
                if (renderer.material == null || renderer.material.shader.name == "Standard")
                    renderer.material = new Material(Shader.Find("Particles/Standard Unlit"));
            }

            ps.Play();
        }

        private static void ConfigureSnow(ParticleSystem ps, float intensity, float areaSize)
        {
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);

            var main = ps.main;
            main.maxParticles = Mathf.RoundToInt(3000 * intensity);
            main.startLifetime = new ParticleSystem.MinMaxCurve(4f, 8f);
            main.startSpeed = new ParticleSystem.MinMaxCurve(0.5f, 2f);
            main.startSize = new ParticleSystem.MinMaxCurve(0.05f, 0.15f);
            main.startColor = new Color(1f, 1f, 1f, 0.9f);
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.loop = true;
            main.gravityModifier = 0.1f;

            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Box;
            shape.scale = new Vector3(areaSize, 0.5f, areaSize);
            shape.position = new Vector3(0f, 15f, 0f);

            var emission = ps.emission;
            emission.rateOverTime = 200f * intensity;

            var noise = ps.noise;
            noise.enabled = true;
            noise.strength = 1f;
            noise.frequency = 0.3f;
            noise.scrollSpeed = 0.2f;

            var renderer = ps.GetComponent<ParticleSystemRenderer>();
            if (renderer != null)
            {
                renderer.renderMode = ParticleSystemRenderMode.Billboard;
                if (renderer.material == null || renderer.material.shader.name == "Standard")
                    renderer.material = new Material(Shader.Find("Particles/Standard Unlit"));
            }

            ps.Play();
        }

        private static GameObject CreateParticleChild(GameObject parent, string childName, System.Action<ParticleSystem, float, float> configFunc, bool active)
        {
            GameObject child = new GameObject(childName);
            Undo.RegisterCreatedObjectUndo(child, $"Create {childName}");
            child.transform.SetParent(parent.transform);
            ParticleSystem ps = child.AddComponent<ParticleSystem>();
            configFunc(ps, 1f, 30f);
            child.SetActive(active);
            return child;
        }

        private static void CreateRainSystem(ParticleSystem ps, float intensity, float area)
        {
            ConfigureRain(ps, intensity, area);
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
        }

        private static void CreateSnowSystem(ParticleSystem ps, float intensity, float area)
        {
            ConfigureSnow(ps, intensity, area);
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
        }

        private static GameObject FindOrCreateWeatherChild(string childName)
        {
            GameObject weatherRoot = GameObject.Find("WeatherSystem");
            if (weatherRoot == null)
            {
                weatherRoot = new GameObject("WeatherSystem");
                Undo.RegisterCreatedObjectUndo(weatherRoot, "Create Weather System");
            }

            Transform child = weatherRoot.transform.Find(childName);
            if (child != null) return child.gameObject;

            GameObject childObj = new GameObject(childName);
            Undo.RegisterCreatedObjectUndo(childObj, $"Create {childName}");
            childObj.transform.SetParent(weatherRoot.transform);
            return childObj;
        }

        // --- Helpers ---

        private static bool TryParseVector3(Dictionary<string, string> p, string key, out Vector3 v)
        {
            v = Vector3.zero;
            if (p.TryGetValue(key, out string raw) && !string.IsNullOrEmpty(raw))
            {
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
            }
            return false;
        }

        private static bool TryParseColorRGB(string raw, out Color c)
        {
            c = Color.white;
            raw = raw.Trim().Trim('[', ']', '(', ')');
            string[] parts = raw.Split(',');
            if (parts.Length >= 3
                && float.TryParse(parts[0].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float r)
                && float.TryParse(parts[1].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float g)
                && float.TryParse(parts[2].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float b))
            {
                float a = 1f;
                if (parts.Length >= 4)
                    float.TryParse(parts[3].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out a);
                c = new Color(r, g, b, a);
                return true;
            }
            return false;
        }

        private static float ParseFloat(Dictionary<string, string> p, string key, float defaultValue)
        {
            string val = GetParam(p, key, "");
            if (float.TryParse(val, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float result))
                return result;
            return defaultValue;
        }

        private static string F(float v)
        {
            return v.ToString(System.Globalization.CultureInfo.InvariantCulture);
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
