using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.Playables;
using UnityEngine.Timeline;

namespace OpenForge.Editor.Tools
{
    public static class TimelineTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_timeline", CreateTimeline);
            ToolExecutor.Register("add_animation_track", AddAnimationTrack);
            ToolExecutor.Register("add_activation_track", AddActivationTrack);
            ToolExecutor.Register("add_audio_track", AddAudioTrack);
            ToolExecutor.Register("add_signal_track", AddSignalTrack);
            ToolExecutor.Register("set_timeline_clip", SetTimelineClip);
            ToolExecutor.Register("play_timeline", PlayTimeline);
            ToolExecutor.Register("get_timeline_info", GetTimelineInfo);
        }

        private static ToolResult CreateTimeline(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "NewTimeline");
            string targetName = GetParam(p, "target", "");
            string folder = GetParam(p, "folder", "Assets/Timelines");
            float duration = ParseFloat(p, "duration", 10f);

            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            // Create Timeline asset.
            string assetPath = Path.Combine(folder, name + ".playable");
            assetPath = AssetDatabase.GenerateUniqueAssetPath(assetPath);

            TimelineAsset timeline = ScriptableObject.CreateInstance<TimelineAsset>();
            AssetDatabase.CreateAsset(timeline, assetPath);

            // Create or find the director GameObject.
            GameObject directorObj;
            if (!string.IsNullOrEmpty(targetName))
            {
                directorObj = FindByNameOrId(targetName);
                if (directorObj == null)
                    return Fail($"GameObject not found: {targetName}");
            }
            else
            {
                directorObj = new GameObject(name + "_Director");
                Undo.RegisterCreatedObjectUndo(directorObj, "Create Timeline Director");
            }

            PlayableDirector director = directorObj.GetComponent<PlayableDirector>();
            if (director == null)
            {
                director = Undo.AddComponent<PlayableDirector>(directorObj);
            }
            else
            {
                Undo.RecordObject(director, "Assign Timeline");
            }

            director.playableAsset = timeline;
            director.time = 0;
            director.initialTime = 0;
            director.extrapolationMode = DirectorWrapMode.Hold;

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created timeline '{name}' at {assetPath}",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"asset\":\"{EscapeJson(assetPath)}\",\"director\":\"{EscapeJson(directorObj.name)}\"}}"
            };
        }

        private static ToolResult AddAnimationTrack(Dictionary<string, string> p)
        {
            string timelineName = GetRequiredParam(p, "timeline");
            string targetName = GetParam(p, "target", "");
            string trackName = GetParam(p, "track_name", "Animation Track");

            TimelineAsset timeline = FindTimeline(timelineName);
            if (timeline == null)
                return Fail($"Timeline not found: {timelineName}");

            AnimationTrack track = timeline.CreateTrack<AnimationTrack>(null, trackName);

            // Bind target if provided.
            if (!string.IsNullOrEmpty(targetName))
            {
                GameObject target = FindByNameOrId(targetName);
                if (target != null)
                {
                    BindTrackToDirector(timeline, track, target);
                }
            }

            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Added animation track '{trackName}' to timeline",
                data = $"{{\"track\":\"{EscapeJson(trackName)}\",\"type\":\"AnimationTrack\"}}"
            };
        }

        private static ToolResult AddActivationTrack(Dictionary<string, string> p)
        {
            string timelineName = GetRequiredParam(p, "timeline");
            string targetName = GetParam(p, "target", "");
            string trackName = GetParam(p, "track_name", "Activation Track");

            TimelineAsset timeline = FindTimeline(timelineName);
            if (timeline == null)
                return Fail($"Timeline not found: {timelineName}");

            ActivationTrack track = timeline.CreateTrack<ActivationTrack>(null, trackName);

            if (!string.IsNullOrEmpty(targetName))
            {
                GameObject target = FindByNameOrId(targetName);
                if (target != null)
                {
                    BindTrackToDirector(timeline, track, target);
                }
            }

            // Add a default clip spanning the timeline.
            TimelineClip clip = track.CreateDefaultClip();
            clip.displayName = "Active";
            clip.start = 0;
            clip.duration = timeline.duration > 0 ? timeline.duration : 5.0;

            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Added activation track '{trackName}' to timeline",
                data = $"{{\"track\":\"{EscapeJson(trackName)}\",\"type\":\"ActivationTrack\"}}"
            };
        }

        private static ToolResult AddAudioTrack(Dictionary<string, string> p)
        {
            string timelineName = GetRequiredParam(p, "timeline");
            string targetName = GetParam(p, "target", "");
            string trackName = GetParam(p, "track_name", "Audio Track");

            TimelineAsset timeline = FindTimeline(timelineName);
            if (timeline == null)
                return Fail($"Timeline not found: {timelineName}");

            AudioTrack track = timeline.CreateTrack<AudioTrack>(null, trackName);

            if (!string.IsNullOrEmpty(targetName))
            {
                GameObject target = FindByNameOrId(targetName);
                if (target != null)
                {
                    // Ensure target has AudioSource.
                    AudioSource src = target.GetComponent<AudioSource>();
                    if (src == null)
                        Undo.AddComponent<AudioSource>(target);
                    BindTrackToDirector(timeline, track, target);
                }
            }

            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Added audio track '{trackName}' to timeline",
                data = $"{{\"track\":\"{EscapeJson(trackName)}\",\"type\":\"AudioTrack\"}}"
            };
        }

        private static ToolResult AddSignalTrack(Dictionary<string, string> p)
        {
            string timelineName = GetRequiredParam(p, "timeline");
            string trackName = GetParam(p, "track_name", "Signal Track");

            TimelineAsset timeline = FindTimeline(timelineName);
            if (timeline == null)
                return Fail($"Timeline not found: {timelineName}");

            SignalTrack track = timeline.CreateTrack<SignalTrack>(null, trackName);

            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Added signal track '{trackName}' to timeline",
                data = $"{{\"track\":\"{EscapeJson(trackName)}\",\"type\":\"SignalTrack\"}}"
            };
        }

        private static ToolResult SetTimelineClip(Dictionary<string, string> p)
        {
            string timelineName = GetRequiredParam(p, "timeline");
            string trackName = GetRequiredParam(p, "track");
            double start = double.TryParse(GetParam(p, "start", "0"), System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out double s) ? s : 0.0;
            double duration = double.TryParse(GetParam(p, "duration", "1"), System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out double d) ? d : 1.0;
            string clipName = GetParam(p, "clip_name", "Clip");
            int clipIndex = int.TryParse(GetParam(p, "clip_index", "0"), out int ci) ? ci : 0;

            TimelineAsset timeline = FindTimeline(timelineName);
            if (timeline == null)
                return Fail($"Timeline not found: {timelineName}");

            TrackAsset targetTrack = null;
            foreach (TrackAsset track in timeline.GetOutputTracks())
            {
                if (track.name == trackName)
                {
                    targetTrack = track;
                    break;
                }
            }

            if (targetTrack == null)
                return Fail($"Track not found: {trackName}");

            IEnumerable<TimelineClip> clips = targetTrack.GetClips();
            TimelineClip targetClip = null;
            int idx = 0;
            foreach (TimelineClip c in clips)
            {
                if (idx == clipIndex)
                {
                    targetClip = c;
                    break;
                }
                idx++;
            }

            if (targetClip == null)
            {
                targetClip = targetTrack.CreateDefaultClip();
            }

            targetClip.displayName = clipName;
            targetClip.start = start;
            targetClip.duration = duration;

            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Set clip '{clipName}' on track '{trackName}' (start={start}, duration={duration})",
                data = $"{{\"clip\":\"{EscapeJson(clipName)}\",\"start\":{start},\"duration\":{duration}}}"
            };
        }

        private static ToolResult PlayTimeline(Dictionary<string, string> p)
        {
            string timelineName = GetParam(p, "timeline", "");
            string directorName = GetParam(p, "director", "");

            PlayableDirector director = null;

            if (!string.IsNullOrEmpty(directorName))
            {
                GameObject go = FindByNameOrId(directorName);
                if (go != null)
                    director = go.GetComponent<PlayableDirector>();
            }

            if (director == null)
            {
                PlayableDirector[] directors = UnityEngine.Object.FindObjectsOfType<PlayableDirector>();
                foreach (PlayableDirector pd in directors)
                {
                    if (!string.IsNullOrEmpty(timelineName) && pd.playableAsset != null && pd.playableAsset.name == timelineName)
                    {
                        director = pd;
                        break;
                    }
                }

                if (director == null && directors.Length > 0)
                    director = directors[0];
            }

            if (director == null)
                return Fail("No PlayableDirector found in scene");

            // Ensure we are in play mode for timeline playback; otherwise set to preview.
            if (!Application.isPlaying)
            {
                director.time = 0;
                director.Evaluate();
                return new ToolResult
                {
                    success = true,
                    message = $"Timeline '{director.playableAsset?.name ?? "unknown"}' evaluated at time 0 (enter Play mode for real-time playback)",
                    data = $"{{\"director\":\"{EscapeJson(director.gameObject.name)}\",\"duration\":{director.duration}}}"
                };
            }

            director.time = 0;
            director.Play();

            return new ToolResult
            {
                success = true,
                message = $"Playing timeline '{director.playableAsset?.name ?? "unknown"}'",
                data = $"{{\"director\":\"{EscapeJson(director.gameObject.name)}\",\"duration\":{director.duration}}}"
            };
        }

        private static ToolResult GetTimelineInfo(Dictionary<string, string> p)
        {
            string timelineName = GetParam(p, "timeline", "");
            string directorName = GetParam(p, "director", "");

            TimelineAsset timeline = null;
            PlayableDirector director = null;

            if (!string.IsNullOrEmpty(directorName))
            {
                GameObject go = FindByNameOrId(directorName);
                if (go != null)
                {
                    director = go.GetComponent<PlayableDirector>();
                    if (director != null)
                        timeline = director.playableAsset as TimelineAsset;
                }
            }

            if (timeline == null && !string.IsNullOrEmpty(timelineName))
            {
                timeline = FindTimeline(timelineName);
            }

            if (timeline == null)
            {
                // Find any timeline.
                PlayableDirector[] directors = UnityEngine.Object.FindObjectsOfType<PlayableDirector>();
                foreach (PlayableDirector pd in directors)
                {
                    if (pd.playableAsset is TimelineAsset ta)
                    {
                        timeline = ta;
                        director = pd;
                        break;
                    }
                }
            }

            if (timeline == null)
                return Fail("No timeline found");

            StringBuilder sb = new StringBuilder("{");
            sb.Append($"\"name\":\"{EscapeJson(timeline.name)}\",");
            sb.Append($"\"duration\":{timeline.duration},");
            sb.Append($"\"frameRate\":{timeline.editorSettings.frameRate},");

            sb.Append("\"tracks\":[");
            bool first = true;
            foreach (TrackAsset track in timeline.GetOutputTracks())
            {
                if (!first) sb.Append(",");
                first = false;

                sb.Append("{");
                sb.Append($"\"name\":\"{EscapeJson(track.name)}\",");
                sb.Append($"\"type\":\"{EscapeJson(track.GetType().Name)}\",");
                sb.Append($"\"muted\":{(track.muted ? "true" : "false")},");

                sb.Append("\"clips\":[");
                bool firstClip = true;
                foreach (TimelineClip clip in track.GetClips())
                {
                    if (!firstClip) sb.Append(",");
                    firstClip = false;
                    sb.Append($"{{\"name\":\"{EscapeJson(clip.displayName)}\",\"start\":{clip.start},\"duration\":{clip.duration},\"end\":{clip.end}}}");
                }
                sb.Append("]");

                sb.Append("}");
            }
            sb.Append("],");

            if (director != null)
            {
                sb.Append($"\"director\":{{\"gameObject\":\"{EscapeJson(director.gameObject.name)}\",\"time\":{director.time},\"state\":\"{director.state}\"}}");
            }
            else
            {
                sb.Append("\"director\":null");
            }

            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Timeline '{timeline.name}': {timeline.outputTrackCount} track(s), duration={timeline.duration}s",
                data = sb.ToString()
            };
        }

        // --- Helpers ---

        private static TimelineAsset FindTimeline(string nameOrPath)
        {
            // Try as asset path.
            TimelineAsset asset = AssetDatabase.LoadAssetAtPath<TimelineAsset>(nameOrPath);
            if (asset != null) return asset;

            // Search by name.
            string[] guids = AssetDatabase.FindAssets($"t:TimelineAsset {nameOrPath}");
            foreach (string guid in guids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                TimelineAsset ta = AssetDatabase.LoadAssetAtPath<TimelineAsset>(path);
                if (ta != null && (ta.name == nameOrPath || path.Contains(nameOrPath)))
                    return ta;
            }

            // Check PlayableDirectors in scene.
            PlayableDirector[] directors = UnityEngine.Object.FindObjectsOfType<PlayableDirector>();
            foreach (PlayableDirector pd in directors)
            {
                if (pd.playableAsset is TimelineAsset ta && ta.name == nameOrPath)
                    return ta;
            }

            return null;
        }

        private static void BindTrackToDirector(TimelineAsset timeline, TrackAsset track, GameObject target)
        {
            PlayableDirector[] directors = UnityEngine.Object.FindObjectsOfType<PlayableDirector>();
            foreach (PlayableDirector pd in directors)
            {
                if (pd.playableAsset == timeline)
                {
                    Undo.RecordObject(pd, "Bind Track");
                    if (track is AnimationTrack)
                        pd.SetGenericBinding(track, target.GetComponent<Animator>() ?? (UnityEngine.Object)target);
                    else if (track is AudioTrack)
                        pd.SetGenericBinding(track, target.GetComponent<AudioSource>());
                    else
                        pd.SetGenericBinding(track, target);
                    return;
                }
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

        private static float ParseFloat(Dictionary<string, string> p, string key, float defaultValue)
        {
            string val = GetParam(p, key, "");
            if (float.TryParse(val, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float result))
                return result;
            return defaultValue;
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
