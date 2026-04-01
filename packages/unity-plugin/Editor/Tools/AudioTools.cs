using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.Audio;

namespace OpenForge.Editor.Tools
{
    public static class AudioTools
    {
        public static void Register()
        {
            ToolExecutor.Register("add_audio_source", AddAudioSource);
            ToolExecutor.Register("play_audio", PlayAudio);
            ToolExecutor.Register("stop_audio", StopAudio);
            ToolExecutor.Register("set_audio_clip", SetAudioClip);
            ToolExecutor.Register("set_audio_volume", SetAudioVolume);
            ToolExecutor.Register("set_audio_3d", SetAudio3D);
            ToolExecutor.Register("create_audio_mixer", CreateAudioMixer);
            ToolExecutor.Register("add_audio_reverb_zone", AddAudioReverbZone);
            ToolExecutor.Register("set_audio_listener", SetAudioListener);
            ToolExecutor.Register("create_ambient_sound", CreateAmbientSound);
        }

        private static ToolResult AddAudioSource(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            AudioSource source = Undo.AddComponent<AudioSource>(go);

            string clipPath = GetParam(p, "clip", "");
            if (!string.IsNullOrEmpty(clipPath))
            {
                AudioClip clip = AssetDatabase.LoadAssetAtPath<AudioClip>(clipPath);
                if (clip != null) source.clip = clip;
            }

            string volume = GetParam(p, "volume", "");
            if (!string.IsNullOrEmpty(volume))
                source.volume = float.Parse(volume, System.Globalization.CultureInfo.InvariantCulture);

            string pitch = GetParam(p, "pitch", "");
            if (!string.IsNullOrEmpty(pitch))
                source.pitch = float.Parse(pitch, System.Globalization.CultureInfo.InvariantCulture);

            string loop = GetParam(p, "loop", "");
            if (!string.IsNullOrEmpty(loop))
                source.loop = loop == "true";

            string playOnAwake = GetParam(p, "play_on_awake", "");
            if (!string.IsNullOrEmpty(playOnAwake))
                source.playOnAwake = playOnAwake == "true";

            string spatialBlend = GetParam(p, "spatial_blend", "");
            if (!string.IsNullOrEmpty(spatialBlend))
                source.spatialBlend = float.Parse(spatialBlend, System.Globalization.CultureInfo.InvariantCulture);

            return new ToolResult
            {
                success = true,
                message = $"Added AudioSource to '{go.name}'",
                data = $"{{\"target\":\"{EscapeJson(go.name)}\",\"clip\":\"{EscapeJson(source.clip != null ? source.clip.name : "none")}\"}}"
            };
        }

        private static ToolResult PlayAudio(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            AudioSource source = go.GetComponent<AudioSource>();
            if (source == null)
                return Fail($"No AudioSource on '{targetName}'");

            string clipPath = GetParam(p, "clip", "");
            if (!string.IsNullOrEmpty(clipPath))
            {
                AudioClip clip = AssetDatabase.LoadAssetAtPath<AudioClip>(clipPath);
                if (clip != null)
                {
                    source.clip = clip;
                }
            }

            if (source.clip == null)
                return Fail("No audio clip assigned to the AudioSource");

            source.Play();

            return new ToolResult
            {
                success = true,
                message = $"Playing audio on '{go.name}' (clip: {source.clip.name})"
            };
        }

        private static ToolResult StopAudio(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            AudioSource source = go.GetComponent<AudioSource>();
            if (source == null)
                return Fail($"No AudioSource on '{targetName}'");

            source.Stop();

            return new ToolResult
            {
                success = true,
                message = $"Stopped audio on '{go.name}'"
            };
        }

        private static ToolResult SetAudioClip(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string clipPath = GetRequiredParam(p, "clip");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            AudioSource source = go.GetComponent<AudioSource>();
            if (source == null)
                return Fail($"No AudioSource on '{targetName}'");

            AudioClip clip = AssetDatabase.LoadAssetAtPath<AudioClip>(clipPath);
            if (clip == null)
            {
                string[] guids = AssetDatabase.FindAssets($"t:AudioClip {clipPath}");
                if (guids.Length > 0)
                {
                    string assetPath = AssetDatabase.GUIDToAssetPath(guids[0]);
                    clip = AssetDatabase.LoadAssetAtPath<AudioClip>(assetPath);
                }
            }

            if (clip == null)
                return Fail($"Audio clip not found: {clipPath}");

            Undo.RecordObject(source, "Set audio clip");
            source.clip = clip;

            return new ToolResult
            {
                success = true,
                message = $"Set audio clip on '{go.name}' to '{clip.name}'"
            };
        }

        private static ToolResult SetAudioVolume(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            float volume = float.Parse(GetRequiredParam(p, "volume"), System.Globalization.CultureInfo.InvariantCulture);

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            AudioSource source = go.GetComponent<AudioSource>();
            if (source == null)
                return Fail($"No AudioSource on '{targetName}'");

            Undo.RecordObject(source, "Set audio volume");
            source.volume = Mathf.Clamp01(volume);

            string pitch = GetParam(p, "pitch", "");
            if (!string.IsNullOrEmpty(pitch))
                source.pitch = float.Parse(pitch, System.Globalization.CultureInfo.InvariantCulture);

            return new ToolResult
            {
                success = true,
                message = $"Set audio volume on '{go.name}' to {source.volume}"
            };
        }

        private static ToolResult SetAudio3D(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            AudioSource source = go.GetComponent<AudioSource>();
            if (source == null)
                return Fail($"No AudioSource on '{targetName}'");

            Undo.RecordObject(source, "Set audio 3D settings");

            string spatialBlend = GetParam(p, "spatial_blend", "");
            if (!string.IsNullOrEmpty(spatialBlend))
                source.spatialBlend = float.Parse(spatialBlend, System.Globalization.CultureInfo.InvariantCulture);

            string minDistance = GetParam(p, "min_distance", "");
            if (!string.IsNullOrEmpty(minDistance))
                source.minDistance = float.Parse(minDistance, System.Globalization.CultureInfo.InvariantCulture);

            string maxDistance = GetParam(p, "max_distance", "");
            if (!string.IsNullOrEmpty(maxDistance))
                source.maxDistance = float.Parse(maxDistance, System.Globalization.CultureInfo.InvariantCulture);

            string rolloffMode = GetParam(p, "rolloff_mode", "");
            if (!string.IsNullOrEmpty(rolloffMode))
            {
                switch (rolloffMode.ToLower())
                {
                    case "logarithmic": source.rolloffMode = AudioRolloffMode.Logarithmic; break;
                    case "linear": source.rolloffMode = AudioRolloffMode.Linear; break;
                    case "custom": source.rolloffMode = AudioRolloffMode.Custom; break;
                }
            }

            string dopplerLevel = GetParam(p, "doppler_level", "");
            if (!string.IsNullOrEmpty(dopplerLevel))
                source.dopplerLevel = float.Parse(dopplerLevel, System.Globalization.CultureInfo.InvariantCulture);

            string spread = GetParam(p, "spread", "");
            if (!string.IsNullOrEmpty(spread))
                source.spread = float.Parse(spread, System.Globalization.CultureInfo.InvariantCulture);

            return new ToolResult
            {
                success = true,
                message = $"Updated 3D audio settings on '{go.name}'"
            };
        }

        private static ToolResult CreateAudioMixer(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "AudioMixer");
            string path = GetParam(p, "path", $"Assets/{name}.mixer");

            EnsureDirectoryExists(path);

            AudioMixer mixer = UnityEngine.Audio.AudioMixer.CreateAsset(path) as AudioMixer;
            if (mixer == null)
            {
                var mixerAsset = new UnityEngine.ScriptableObject();
                return Fail("AudioMixer.CreateAsset is not available. Create the mixer manually via Assets > Create > Audio Mixer.");
            }

            return new ToolResult
            {
                success = true,
                message = $"Created audio mixer '{name}' at {path}",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"path\":\"{EscapeJson(path)}\"}}"
            };
        }

        private static ToolResult AddAudioReverbZone(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Audio Reverb Zone");

            GameObject zoneGo = new GameObject(name);
            AudioReverbZone zone = zoneGo.AddComponent<AudioReverbZone>();

            string posStr = GetParam(p, "position", "");
            if (!string.IsNullOrEmpty(posStr) && TryParseVector3(posStr, out Vector3 pos))
                zoneGo.transform.position = pos;

            string minDistance = GetParam(p, "min_distance", "");
            if (!string.IsNullOrEmpty(minDistance))
                zone.minDistance = float.Parse(minDistance, System.Globalization.CultureInfo.InvariantCulture);

            string maxDistance = GetParam(p, "max_distance", "");
            if (!string.IsNullOrEmpty(maxDistance))
                zone.maxDistance = float.Parse(maxDistance, System.Globalization.CultureInfo.InvariantCulture);

            string preset = GetParam(p, "preset", "");
            if (!string.IsNullOrEmpty(preset) && Enum.TryParse(preset, true, out AudioReverbPreset reverbPreset))
                zone.reverbPreset = reverbPreset;

            Undo.RegisterCreatedObjectUndo(zoneGo, "Create Audio Reverb Zone");

            return new ToolResult
            {
                success = true,
                message = $"Created audio reverb zone '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{zoneGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult SetAudioListener(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            AudioListener[] allListeners = UnityEngine.Object.FindObjectsOfType<AudioListener>();
            foreach (AudioListener listener in allListeners)
            {
                Undo.DestroyObjectImmediate(listener);
            }

            AudioListener newListener = go.GetComponent<AudioListener>();
            if (newListener == null)
                newListener = Undo.AddComponent<AudioListener>(go);

            return new ToolResult
            {
                success = true,
                message = $"Set AudioListener on '{go.name}' (removed {allListeners.Length} existing listener(s))"
            };
        }

        private static ToolResult CreateAmbientSound(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Ambient Sound");
            string clipPath = GetParam(p, "clip", "");

            GameObject soundGo = new GameObject(name);
            AudioSource source = soundGo.AddComponent<AudioSource>();

            source.loop = true;
            source.playOnAwake = true;
            source.spatialBlend = 0f;

            string volume = GetParam(p, "volume", "0.5");
            source.volume = float.Parse(volume, System.Globalization.CultureInfo.InvariantCulture);

            if (!string.IsNullOrEmpty(clipPath))
            {
                AudioClip clip = AssetDatabase.LoadAssetAtPath<AudioClip>(clipPath);
                if (clip != null) source.clip = clip;
            }

            string posStr = GetParam(p, "position", "");
            if (!string.IsNullOrEmpty(posStr) && TryParseVector3(posStr, out Vector3 pos))
            {
                soundGo.transform.position = pos;
                source.spatialBlend = 1f;

                string minDist = GetParam(p, "min_distance", "5");
                source.minDistance = float.Parse(minDist, System.Globalization.CultureInfo.InvariantCulture);

                string maxDist = GetParam(p, "max_distance", "50");
                source.maxDistance = float.Parse(maxDist, System.Globalization.CultureInfo.InvariantCulture);
            }

            Undo.RegisterCreatedObjectUndo(soundGo, "Create Ambient Sound");

            return new ToolResult
            {
                success = true,
                message = $"Created ambient sound '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{soundGo.GetInstanceID()},\"loop\":true,\"volume\":{source.volume}}}"
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
