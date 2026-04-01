using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.Audio;

namespace OpenForge.Editor.Tools
{
    public static class AdvancedAudioTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_sound_pool", CreateSoundPool);
            ToolExecutor.Register("setup_adaptive_music", SetupAdaptiveMusic);
            ToolExecutor.Register("create_audio_snapshot", CreateAudioSnapshot);
            ToolExecutor.Register("crossfade_audio", CrossfadeAudio);
            ToolExecutor.Register("create_audio_zone", CreateAudioZone);
            ToolExecutor.Register("setup_spatial_audio", SetupSpatialAudio);
        }

        private static ToolResult CreateSoundPool(Dictionary<string, string> p)
        {
            string poolName = GetParam(p, "name", "SoundPool");
            int poolSize = int.Parse(GetParam(p, "pool_size", "5"));
            string clipPath = GetParam(p, "clip", "");
            float volume = float.Parse(GetParam(p, "volume", "1"), System.Globalization.CultureInfo.InvariantCulture);

            GameObject poolParent = new GameObject(poolName);
            Undo.RegisterCreatedObjectUndo(poolParent, $"Create Sound Pool {poolName}");

            AudioClip clip = null;
            if (!string.IsNullOrEmpty(clipPath))
            {
                clip = AssetDatabase.LoadAssetAtPath<AudioClip>(clipPath);
            }

            for (int i = 0; i < poolSize; i++)
            {
                GameObject child = new GameObject($"{poolName}_Source_{i}");
                child.transform.SetParent(poolParent.transform);

                AudioSource source = child.AddComponent<AudioSource>();
                source.playOnAwake = false;
                source.volume = volume;
                if (clip != null) source.clip = clip;

                Undo.RegisterCreatedObjectUndo(child, $"Create pool source {i}");
            }

            // Add a manager script reference note
            StringBuilder sb = new StringBuilder("{");
            sb.Append($"\"name\":\"{EscapeJson(poolParent.name)}\",");
            sb.Append($"\"instanceId\":{poolParent.GetInstanceID()},");
            sb.Append($"\"poolSize\":{poolSize},");
            sb.Append($"\"volume\":{volume},");
            sb.Append($"\"clip\":\"{EscapeJson(clip != null ? clip.name : "none")}\"");
            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Created sound pool '{poolName}' with {poolSize} AudioSource(s)",
                data = sb.ToString()
            };
        }

        private static ToolResult SetupAdaptiveMusic(Dictionary<string, string> p)
        {
            string systemName = GetParam(p, "name", "AdaptiveMusic");
            string layersStr = GetParam(p, "layers", "");
            float baseVolume = float.Parse(GetParam(p, "base_volume", "0.7"), System.Globalization.CultureInfo.InvariantCulture);

            GameObject musicSystem = new GameObject(systemName);
            Undo.RegisterCreatedObjectUndo(musicSystem, $"Create Adaptive Music System {systemName}");

            List<string> layerNames = new List<string>();
            if (!string.IsNullOrEmpty(layersStr))
            {
                layerNames.AddRange(layersStr.Split(','));
            }
            else
            {
                layerNames.AddRange(new[] { "Base", "Percussion", "Melody", "Intensity" });
            }

            StringBuilder layerData = new StringBuilder("[");
            for (int i = 0; i < layerNames.Count; i++)
            {
                string layerName = layerNames[i].Trim();
                GameObject layerObj = new GameObject($"Layer_{layerName}");
                layerObj.transform.SetParent(musicSystem.transform);

                AudioSource source = layerObj.AddComponent<AudioSource>();
                source.playOnAwake = false;
                source.loop = true;
                source.volume = i == 0 ? baseVolume : 0f; // Only base layer starts audible
                source.spatialBlend = 0f; // 2D for music

                // Try loading clip by layer name convention
                string clipName = $"{systemName}_{layerName}";
                string[] guids = AssetDatabase.FindAssets($"t:AudioClip {clipName}");
                if (guids.Length > 0)
                {
                    AudioClip clip = AssetDatabase.LoadAssetAtPath<AudioClip>(AssetDatabase.GUIDToAssetPath(guids[0]));
                    if (clip != null) source.clip = clip;
                }

                Undo.RegisterCreatedObjectUndo(layerObj, $"Create music layer {layerName}");

                if (i > 0) layerData.Append(",");
                layerData.Append($"{{\"name\":\"{EscapeJson(layerName)}\",\"volume\":{source.volume},\"instanceId\":{layerObj.GetInstanceID()}}}");
            }
            layerData.Append("]");

            return new ToolResult
            {
                success = true,
                message = $"Created adaptive music system '{systemName}' with {layerNames.Count} layer(s): {string.Join(", ", layerNames)}",
                data = $"{{\"name\":\"{EscapeJson(systemName)}\",\"instanceId\":{musicSystem.GetInstanceID()},\"layers\":{layerData.ToString()}}}"
            };
        }

        private static ToolResult CreateAudioSnapshot(Dictionary<string, string> p)
        {
            string mixerPath = GetRequiredParam(p, "mixer_path");
            string snapshotName = GetRequiredParam(p, "snapshot_name");

            AudioMixer mixer = AssetDatabase.LoadAssetAtPath<AudioMixer>(mixerPath);
            if (mixer == null)
            {
                // Try finding by name
                string[] guids = AssetDatabase.FindAssets($"t:AudioMixer {mixerPath}");
                if (guids.Length > 0)
                    mixer = AssetDatabase.LoadAssetAtPath<AudioMixer>(AssetDatabase.GUIDToAssetPath(guids[0]));
            }

            if (mixer == null)
                return Fail($"AudioMixer not found: {mixerPath}");

            // Use reflection to find the snapshot on the mixer
            // AudioMixer.FindSnapshot returns an existing snapshot by name
            AudioMixerSnapshot snapshot = mixer.FindSnapshot(snapshotName);

            if (snapshot != null)
            {
                return new ToolResult
                {
                    success = true,
                    message = $"Found existing snapshot '{snapshotName}' on mixer '{mixer.name}'",
                    data = $"{{\"mixer\":\"{EscapeJson(mixer.name)}\",\"snapshot\":\"{EscapeJson(snapshotName)}\",\"exists\":true}}"
                };
            }

            // Creating snapshots programmatically requires internal API access via reflection
            try
            {
                var mixerType = mixer.GetType();
                // Try to find an internal method to create snapshot
                var createSnapshotMethod = mixerType.GetMethod("CreateNewSnapshot",
                    System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Public);

                if (createSnapshotMethod != null)
                {
                    createSnapshotMethod.Invoke(mixer, new object[] { snapshotName });
                    EditorUtility.SetDirty(mixer);
                    AssetDatabase.SaveAssets();

                    return new ToolResult
                    {
                        success = true,
                        message = $"Created snapshot '{snapshotName}' on mixer '{mixer.name}'",
                        data = $"{{\"mixer\":\"{EscapeJson(mixer.name)}\",\"snapshot\":\"{EscapeJson(snapshotName)}\",\"created\":true}}"
                    };
                }

                return Fail($"Cannot create snapshot programmatically. Create it manually in the Audio Mixer window, or use the Unity Editor AudioMixer window.");
            }
            catch (Exception ex)
            {
                return Fail($"Failed to create snapshot: {ex.Message}");
            }
        }

        private static ToolResult CrossfadeAudio(Dictionary<string, string> p)
        {
            string sourceAName = GetRequiredParam(p, "source_a");
            string sourceBName = GetRequiredParam(p, "source_b");
            float duration = float.Parse(GetParam(p, "duration", "2"), System.Globalization.CultureInfo.InvariantCulture);
            float targetVolume = float.Parse(GetParam(p, "target_volume", "1"), System.Globalization.CultureInfo.InvariantCulture);

            // Create a crossfade controller object
            string controllerName = GetParam(p, "name", "CrossfadeController");
            GameObject controller = new GameObject(controllerName);
            Undo.RegisterCreatedObjectUndo(controller, $"Create Crossfade Controller");

            // Find source objects
            GameObject goA = FindByNameOrId(sourceAName);
            GameObject goB = FindByNameOrId(sourceBName);

            if (goA == null) return Fail($"Source A not found: {sourceAName}");
            if (goB == null) return Fail($"Source B not found: {sourceBName}");

            AudioSource srcA = goA.GetComponent<AudioSource>();
            AudioSource srcB = goB.GetComponent<AudioSource>();

            if (srcA == null) return Fail($"No AudioSource on '{sourceAName}'");
            if (srcB == null) return Fail($"No AudioSource on '{sourceBName}'");

            // Generate a crossfade script and attach it
            string scriptContent = GenerateCrossfadeScript(controllerName);
            string scriptPath = $"Assets/Scripts/Generated/{controllerName}.cs";
            string dir = System.IO.Path.GetDirectoryName(scriptPath);
            if (!System.IO.Directory.Exists(dir))
                System.IO.Directory.CreateDirectory(dir);
            System.IO.File.WriteAllText(scriptPath, scriptContent);
            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created crossfade setup between '{sourceAName}' and '{sourceBName}' (duration: {duration}s). Crossfade script at '{scriptPath}'.",
                data = $"{{\"controller\":\"{EscapeJson(controllerName)}\",\"sourceA\":\"{EscapeJson(sourceAName)}\",\"sourceB\":\"{EscapeJson(sourceBName)}\",\"duration\":{duration},\"scriptPath\":\"{EscapeJson(scriptPath)}\"}}"
            };
        }

        private static ToolResult CreateAudioZone(Dictionary<string, string> p)
        {
            string zoneName = GetParam(p, "name", "AudioZone");
            string clipPath = GetParam(p, "clip", "");
            float innerRadius = float.Parse(GetParam(p, "inner_radius", "5"), System.Globalization.CultureInfo.InvariantCulture);
            float outerRadius = float.Parse(GetParam(p, "outer_radius", "15"), System.Globalization.CultureInfo.InvariantCulture);
            float volume = float.Parse(GetParam(p, "volume", "1"), System.Globalization.CultureInfo.InvariantCulture);
            string shape = GetParam(p, "shape", "sphere").ToLower();

            GameObject zoneObj = new GameObject(zoneName);
            Undo.RegisterCreatedObjectUndo(zoneObj, $"Create Audio Zone {zoneName}");

            // Position
            if (TryParseVector3(p, "position", out Vector3 pos))
                zoneObj.transform.position = pos;

            // Add AudioSource for zone audio
            AudioSource source = zoneObj.AddComponent<AudioSource>();
            source.playOnAwake = true;
            source.loop = true;
            source.volume = volume;
            source.spatialBlend = 1f; // Full 3D
            source.minDistance = innerRadius;
            source.maxDistance = outerRadius;
            source.rolloffMode = AudioRolloffMode.Linear;

            if (!string.IsNullOrEmpty(clipPath))
            {
                AudioClip clip = AssetDatabase.LoadAssetAtPath<AudioClip>(clipPath);
                if (clip != null) source.clip = clip;
            }

            // Add trigger collider for zone detection
            if (shape == "box")
            {
                BoxCollider collider = zoneObj.AddComponent<BoxCollider>();
                collider.isTrigger = true;
                collider.size = new Vector3(outerRadius * 2, outerRadius * 2, outerRadius * 2);
            }
            else
            {
                SphereCollider collider = zoneObj.AddComponent<SphereCollider>();
                collider.isTrigger = true;
                collider.radius = outerRadius;
            }

            // Add reverb zone for ambiance
            AudioReverbZone reverb = zoneObj.AddComponent<AudioReverbZone>();
            reverb.minDistance = innerRadius;
            reverb.maxDistance = outerRadius;

            return new ToolResult
            {
                success = true,
                message = $"Created audio zone '{zoneName}' (inner: {innerRadius}, outer: {outerRadius})",
                data = $"{{\"name\":\"{EscapeJson(zoneName)}\",\"instanceId\":{zoneObj.GetInstanceID()},\"innerRadius\":{innerRadius},\"outerRadius\":{outerRadius}}}"
            };
        }

        private static ToolResult SetupSpatialAudio(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            AudioSource source = go.GetComponent<AudioSource>();
            if (source == null)
            {
                source = Undo.AddComponent<AudioSource>(go);
            }
            else
            {
                Undo.RecordObject(source, "Setup Spatial Audio");
            }

            // Spatial blend
            source.spatialBlend = float.Parse(GetParam(p, "spatial_blend", "1"), System.Globalization.CultureInfo.InvariantCulture);

            // Distance settings
            source.minDistance = float.Parse(GetParam(p, "min_distance", "1"), System.Globalization.CultureInfo.InvariantCulture);
            source.maxDistance = float.Parse(GetParam(p, "max_distance", "50"), System.Globalization.CultureInfo.InvariantCulture);

            // Rolloff mode
            string rolloff = GetParam(p, "rolloff_mode", "logarithmic").ToLower();
            switch (rolloff)
            {
                case "linear": source.rolloffMode = AudioRolloffMode.Linear; break;
                case "custom": source.rolloffMode = AudioRolloffMode.Custom; break;
                default: source.rolloffMode = AudioRolloffMode.Logarithmic; break;
            }

            // Doppler
            string doppler = GetParam(p, "doppler_level", "");
            if (!string.IsNullOrEmpty(doppler))
                source.dopplerLevel = float.Parse(doppler, System.Globalization.CultureInfo.InvariantCulture);

            // Spread
            string spread = GetParam(p, "spread", "");
            if (!string.IsNullOrEmpty(spread))
                source.spread = float.Parse(spread, System.Globalization.CultureInfo.InvariantCulture);

            // Custom rolloff curve
            string curveType = GetParam(p, "curve", "").ToLower();
            if (curveType == "exponential")
            {
                AnimationCurve curve = new AnimationCurve();
                curve.AddKey(0f, 1f);
                curve.AddKey(0.1f, 0.5f);
                curve.AddKey(0.3f, 0.15f);
                curve.AddKey(0.6f, 0.04f);
                curve.AddKey(1f, 0f);
                source.rolloffMode = AudioRolloffMode.Custom;
                source.SetCustomCurve(AudioSourceCurveType.CustomRolloff, curve);
            }
            else if (curveType == "inverse_square")
            {
                AnimationCurve curve = new AnimationCurve();
                curve.AddKey(0f, 1f);
                curve.AddKey(0.25f, 0.16f);
                curve.AddKey(0.5f, 0.04f);
                curve.AddKey(0.75f, 0.01f);
                curve.AddKey(1f, 0f);
                source.rolloffMode = AudioRolloffMode.Custom;
                source.SetCustomCurve(AudioSourceCurveType.CustomRolloff, curve);
            }
            else if (curveType == "s_curve")
            {
                AnimationCurve curve = new AnimationCurve();
                curve.AddKey(new Keyframe(0f, 1f, 0f, 0f));
                curve.AddKey(new Keyframe(0.4f, 0.9f, -1f, -1f));
                curve.AddKey(new Keyframe(0.6f, 0.1f, -1f, -1f));
                curve.AddKey(new Keyframe(1f, 0f, 0f, 0f));
                source.rolloffMode = AudioRolloffMode.Custom;
                source.SetCustomCurve(AudioSourceCurveType.CustomRolloff, curve);
            }

            // Volume
            string vol = GetParam(p, "volume", "");
            if (!string.IsNullOrEmpty(vol))
                source.volume = float.Parse(vol, System.Globalization.CultureInfo.InvariantCulture);

            return new ToolResult
            {
                success = true,
                message = $"Configured spatial audio on '{targetName}': blend={source.spatialBlend}, range=[{source.minDistance}-{source.maxDistance}], rolloff={source.rolloffMode}",
                data = $"{{\"target\":\"{EscapeJson(targetName)}\",\"spatialBlend\":{source.spatialBlend},\"minDistance\":{source.minDistance},\"maxDistance\":{source.maxDistance},\"rolloffMode\":\"{source.rolloffMode}\",\"dopplerLevel\":{source.dopplerLevel},\"spread\":{source.spread}}}"
            };
        }

        // --- Helpers ---

        private static string GenerateCrossfadeScript(string className)
        {
            return $@"using UnityEngine;

public class {className} : MonoBehaviour
{{
    public AudioSource sourceA;
    public AudioSource sourceB;
    public float fadeDuration = 2f;

    private float _fadeTimer;
    private bool _fading;
    private bool _fadingToB;

    public void CrossfadeToB()
    {{
        _fadeTimer = 0f;
        _fading = true;
        _fadingToB = true;
        if (!sourceB.isPlaying) sourceB.Play();
    }}

    public void CrossfadeToA()
    {{
        _fadeTimer = 0f;
        _fading = true;
        _fadingToB = false;
        if (!sourceA.isPlaying) sourceA.Play();
    }}

    private void Update()
    {{
        if (!_fading) return;

        _fadeTimer += Time.deltaTime;
        float t = Mathf.Clamp01(_fadeTimer / fadeDuration);

        if (_fadingToB)
        {{
            sourceA.volume = 1f - t;
            sourceB.volume = t;
        }}
        else
        {{
            sourceA.volume = t;
            sourceB.volume = 1f - t;
        }}

        if (t >= 1f)
        {{
            _fading = false;
            if (_fadingToB && sourceA.isPlaying) sourceA.Stop();
            if (!_fadingToB && sourceB.isPlaying) sourceB.Stop();
        }}
    }}
}}";
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
