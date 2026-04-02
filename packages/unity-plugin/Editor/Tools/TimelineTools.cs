using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    /// <summary>
    /// Timeline tools using reflection so the plugin compiles even when
    /// com.unity.timeline is not installed.
    /// </summary>
    public static class TimelineTools
    {
        private const string TimelineNotInstalled =
            "Timeline package is not installed. Use install_package to add com.unity.timeline";

        // Cached types (null if Timeline package is absent).
        private static readonly Type TimelineAssetType =
            Type.GetType("UnityEngine.Timeline.TimelineAsset, Unity.Timeline");
        private static readonly Type TrackAssetType =
            Type.GetType("UnityEngine.Timeline.TrackAsset, Unity.Timeline");
        private static readonly Type AnimationTrackType =
            Type.GetType("UnityEngine.Timeline.AnimationTrack, Unity.Timeline");
        private static readonly Type ActivationTrackType =
            Type.GetType("UnityEngine.Timeline.ActivationTrack, Unity.Timeline");
        private static readonly Type AudioTrackType =
            Type.GetType("UnityEngine.Timeline.AudioTrack, Unity.Timeline");
        private static readonly Type SignalTrackType =
            Type.GetType("UnityEngine.Timeline.SignalTrack, Unity.Timeline");
        private static readonly Type TimelineClipType =
            Type.GetType("UnityEngine.Timeline.TimelineClip, Unity.Timeline");
        private static readonly Type PlayableDirectorType =
            Type.GetType("UnityEngine.Playables.PlayableDirector, UnityEngine.DirectorModule");

        private static bool IsTimelineAvailable => TimelineAssetType != null && PlayableDirectorType != null;

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

        // ----------------------------------------------------------------
        //  Tool implementations
        // ----------------------------------------------------------------

        private static ToolResult CreateTimeline(Dictionary<string, string> p)
        {
            if (!IsTimelineAvailable) return Fail(TimelineNotInstalled);

            string name = GetParam(p, "name", "NewTimeline");
            string targetName = GetParam(p, "target", "");
            string folder = GetParam(p, "folder", "Assets/Timelines");
            float duration = ParseFloat(p, "duration", 10f);

            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            string assetPath = Path.Combine(folder, name + ".playable");
            assetPath = AssetDatabase.GenerateUniqueAssetPath(assetPath);

            // ScriptableObject.CreateInstance<TimelineAsset>()
            var timeline = ScriptableObject.CreateInstance(TimelineAssetType);
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

            // Get or add PlayableDirector component.
            Component director = directorObj.GetComponent(PlayableDirectorType);
            if (director == null)
            {
                Undo.AddComponent(directorObj, PlayableDirectorType);
                director = directorObj.GetComponent(PlayableDirectorType);
            }
            else
            {
                Undo.RecordObject(director, "Assign Timeline");
            }

            // director.playableAsset = timeline
            SetProperty(director, "playableAsset", timeline);
            // director.time = 0
            SetProperty(director, "time", 0.0);
            // director.initialTime = 0
            SetProperty(director, "initialTime", 0.0);
            // director.extrapolationMode = DirectorWrapMode.Hold
            var wrapModeType = typeof(UnityEngine.Playables.DirectorWrapMode);
            SetProperty(director, "extrapolationMode", Enum.ToObject(wrapModeType, 0)); // Hold = 0

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
            if (!IsTimelineAvailable) return Fail(TimelineNotInstalled);

            string timelineName = GetRequiredParam(p, "timeline");
            string targetName = GetParam(p, "target", "");
            string trackName = GetParam(p, "track_name", "Animation Track");

            UnityEngine.Object timeline = FindTimeline(timelineName);
            if (timeline == null)
                return Fail($"Timeline not found: {timelineName}");

            object track = InvokeCreateTrack(timeline, AnimationTrackType, trackName);

            if (!string.IsNullOrEmpty(targetName))
            {
                GameObject target = FindByNameOrId(targetName);
                if (target != null)
                    BindTrackToDirector(timeline, track, target);
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
            if (!IsTimelineAvailable) return Fail(TimelineNotInstalled);

            string timelineName = GetRequiredParam(p, "timeline");
            string targetName = GetParam(p, "target", "");
            string trackName = GetParam(p, "track_name", "Activation Track");

            UnityEngine.Object timeline = FindTimeline(timelineName);
            if (timeline == null)
                return Fail($"Timeline not found: {timelineName}");

            object track = InvokeCreateTrack(timeline, ActivationTrackType, trackName);

            if (!string.IsNullOrEmpty(targetName))
            {
                GameObject target = FindByNameOrId(targetName);
                if (target != null)
                    BindTrackToDirector(timeline, track, target);
            }

            // Add a default clip spanning the timeline.
            object clip = InvokeMethod(track, "CreateDefaultClip");
            if (clip != null)
            {
                SetProperty(clip, "displayName", "Active");
                SetProperty(clip, "start", 0.0);
                double timelineDuration = (double)GetProperty(timeline, "duration");
                SetProperty(clip, "duration", timelineDuration > 0 ? timelineDuration : 5.0);
            }

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
            if (!IsTimelineAvailable) return Fail(TimelineNotInstalled);

            string timelineName = GetRequiredParam(p, "timeline");
            string targetName = GetParam(p, "target", "");
            string trackName = GetParam(p, "track_name", "Audio Track");

            UnityEngine.Object timeline = FindTimeline(timelineName);
            if (timeline == null)
                return Fail($"Timeline not found: {timelineName}");

            object track = InvokeCreateTrack(timeline, AudioTrackType, trackName);

            if (!string.IsNullOrEmpty(targetName))
            {
                GameObject target = FindByNameOrId(targetName);
                if (target != null)
                {
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
            if (!IsTimelineAvailable) return Fail(TimelineNotInstalled);

            string timelineName = GetRequiredParam(p, "timeline");
            string trackName = GetParam(p, "track_name", "Signal Track");

            UnityEngine.Object timeline = FindTimeline(timelineName);
            if (timeline == null)
                return Fail($"Timeline not found: {timelineName}");

            InvokeCreateTrack(timeline, SignalTrackType, trackName);

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
            if (!IsTimelineAvailable) return Fail(TimelineNotInstalled);

            string timelineName = GetRequiredParam(p, "timeline");
            string trackName = GetRequiredParam(p, "track");
            double start = double.TryParse(GetParam(p, "start", "0"), System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out double s) ? s : 0.0;
            double duration = double.TryParse(GetParam(p, "duration", "1"), System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out double d) ? d : 1.0;
            string clipName = GetParam(p, "clip_name", "Clip");
            int clipIndex = int.TryParse(GetParam(p, "clip_index", "0"), out int ci) ? ci : 0;

            UnityEngine.Object timeline = FindTimeline(timelineName);
            if (timeline == null)
                return Fail($"Timeline not found: {timelineName}");

            // Find target track via GetOutputTracks().
            object targetTrack = null;
            IEnumerable outputTracks = (IEnumerable)InvokeMethod(timeline, "GetOutputTracks");
            if (outputTracks != null)
            {
                foreach (object track in outputTracks)
                {
                    string tName = (string)GetProperty(track, "name");
                    if (tName == trackName)
                    {
                        targetTrack = track;
                        break;
                    }
                }
            }

            if (targetTrack == null)
                return Fail($"Track not found: {trackName}");

            // Find or create clip.
            IEnumerable clips = (IEnumerable)InvokeMethod(targetTrack, "GetClips");
            object targetClip = null;
            int idx = 0;
            if (clips != null)
            {
                foreach (object c in clips)
                {
                    if (idx == clipIndex)
                    {
                        targetClip = c;
                        break;
                    }
                    idx++;
                }
            }

            if (targetClip == null)
                targetClip = InvokeMethod(targetTrack, "CreateDefaultClip");

            SetProperty(targetClip, "displayName", clipName);
            SetProperty(targetClip, "start", start);
            SetProperty(targetClip, "duration", duration);

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
            if (!IsTimelineAvailable) return Fail(TimelineNotInstalled);

            string timelineName = GetParam(p, "timeline", "");
            string directorName = GetParam(p, "director", "");

            Component director = null;

            if (!string.IsNullOrEmpty(directorName))
            {
                GameObject go = FindByNameOrId(directorName);
                if (go != null)
                    director = go.GetComponent(PlayableDirectorType);
            }

            if (director == null)
            {
                Component[] directors = UnityEngine.Object.FindObjectsOfType(PlayableDirectorType) as Component[];
                if (directors != null)
                {
                    foreach (Component pd in directors)
                    {
                        if (!string.IsNullOrEmpty(timelineName))
                        {
                            var asset = GetProperty(pd, "playableAsset") as UnityEngine.Object;
                            if (asset != null && asset.name == timelineName)
                            {
                                director = pd;
                                break;
                            }
                        }
                    }

                    if (director == null && directors.Length > 0)
                        director = directors[0];
                }
            }

            if (director == null)
                return Fail("No PlayableDirector found in scene");

            var playableAsset = GetProperty(director, "playableAsset") as UnityEngine.Object;
            string assetName = playableAsset != null ? playableAsset.name : "unknown";
            double dur = (double)GetProperty(director, "duration");

            if (!Application.isPlaying)
            {
                SetProperty(director, "time", 0.0);
                InvokeMethod(director, "Evaluate");
                return new ToolResult
                {
                    success = true,
                    message = $"Timeline '{assetName}' evaluated at time 0 (enter Play mode for real-time playback)",
                    data = $"{{\"director\":\"{EscapeJson(director.gameObject.name)}\",\"duration\":{dur}}}"
                };
            }

            SetProperty(director, "time", 0.0);
            InvokeMethod(director, "Play");

            return new ToolResult
            {
                success = true,
                message = $"Playing timeline '{assetName}'",
                data = $"{{\"director\":\"{EscapeJson(director.gameObject.name)}\",\"duration\":{dur}}}"
            };
        }

        private static ToolResult GetTimelineInfo(Dictionary<string, string> p)
        {
            if (!IsTimelineAvailable) return Fail(TimelineNotInstalled);

            string timelineName = GetParam(p, "timeline", "");
            string directorName = GetParam(p, "director", "");

            UnityEngine.Object timeline = null;
            Component director = null;

            if (!string.IsNullOrEmpty(directorName))
            {
                GameObject go = FindByNameOrId(directorName);
                if (go != null)
                {
                    director = go.GetComponent(PlayableDirectorType);
                    if (director != null)
                    {
                        var asset = GetProperty(director, "playableAsset") as UnityEngine.Object;
                        if (asset != null && TimelineAssetType.IsInstanceOfType(asset))
                            timeline = asset;
                    }
                }
            }

            if (timeline == null && !string.IsNullOrEmpty(timelineName))
                timeline = FindTimeline(timelineName);

            if (timeline == null)
            {
                Component[] directors = UnityEngine.Object.FindObjectsOfType(PlayableDirectorType) as Component[];
                if (directors != null)
                {
                    foreach (Component pd in directors)
                    {
                        var asset = GetProperty(pd, "playableAsset") as UnityEngine.Object;
                        if (asset != null && TimelineAssetType.IsInstanceOfType(asset))
                        {
                            timeline = asset;
                            director = pd;
                            break;
                        }
                    }
                }
            }

            if (timeline == null)
                return Fail("No timeline found");

            double tlDuration = (double)GetProperty(timeline, "duration");

            // editorSettings.frameRate
            object editorSettings = GetProperty(timeline, "editorSettings");
            double frameRate = 0;
            if (editorSettings != null)
                frameRate = Convert.ToDouble(GetProperty(editorSettings, "frameRate"));

            StringBuilder sb = new StringBuilder("{");
            sb.Append($"\"name\":\"{EscapeJson(timeline.name)}\",");
            sb.Append($"\"duration\":{tlDuration},");
            sb.Append($"\"frameRate\":{frameRate},");

            sb.Append("\"tracks\":[");
            bool first = true;
            IEnumerable outputTracks = (IEnumerable)InvokeMethod(timeline, "GetOutputTracks");
            if (outputTracks != null)
            {
                foreach (object track in outputTracks)
                {
                    if (!first) sb.Append(",");
                    first = false;

                    string tName = (string)GetProperty(track, "name");
                    string tType = track.GetType().Name;
                    bool muted = (bool)GetProperty(track, "muted");

                    sb.Append("{");
                    sb.Append($"\"name\":\"{EscapeJson(tName)}\",");
                    sb.Append($"\"type\":\"{EscapeJson(tType)}\",");
                    sb.Append($"\"muted\":{(muted ? "true" : "false")},");

                    sb.Append("\"clips\":[");
                    bool firstClip = true;
                    IEnumerable clips = (IEnumerable)InvokeMethod(track, "GetClips");
                    if (clips != null)
                    {
                        foreach (object clip in clips)
                        {
                            if (!firstClip) sb.Append(",");
                            firstClip = false;
                            string cName = (string)GetProperty(clip, "displayName");
                            double cStart = (double)GetProperty(clip, "start");
                            double cDuration = (double)GetProperty(clip, "duration");
                            double cEnd = (double)GetProperty(clip, "end");
                            sb.Append($"{{\"name\":\"{EscapeJson(cName)}\",\"start\":{cStart},\"duration\":{cDuration},\"end\":{cEnd}}}");
                        }
                    }
                    sb.Append("]");
                    sb.Append("}");
                }
            }
            sb.Append("],");

            if (director != null)
            {
                double dirTime = (double)GetProperty(director, "time");
                object dirState = GetProperty(director, "state");
                sb.Append($"\"director\":{{\"gameObject\":\"{EscapeJson(director.gameObject.name)}\",\"time\":{dirTime},\"state\":\"{dirState}\"}}");
            }
            else
            {
                sb.Append("\"director\":null");
            }

            sb.Append("}");

            int trackCount = 0;
            var countProp = TimelineAssetType.GetProperty("outputTrackCount");
            if (countProp != null)
                trackCount = (int)countProp.GetValue(timeline);

            return new ToolResult
            {
                success = true,
                message = $"Timeline '{timeline.name}': {trackCount} track(s), duration={tlDuration}s",
                data = sb.ToString()
            };
        }

        // ----------------------------------------------------------------
        //  Reflection helpers
        // ----------------------------------------------------------------

        private static object InvokeCreateTrack(UnityEngine.Object timeline, Type trackType, string trackName)
        {
            // TimelineAsset.CreateTrack<T>(TrackAsset parent, string name)
            // We use the non-generic overload: CreateTrack(Type type, TrackAsset parent, string name)
            MethodInfo method = TimelineAssetType.GetMethod("CreateTrack",
                new Type[] { typeof(Type), TrackAssetType, typeof(string) });
            if (method != null)
                return method.Invoke(timeline, new object[] { trackType, null, trackName });

            // Fallback: try generic version via MakeGenericMethod.
            MethodInfo[] methods = TimelineAssetType.GetMethods();
            foreach (MethodInfo m in methods)
            {
                if (m.Name == "CreateTrack" && m.IsGenericMethod)
                {
                    var parms = m.GetParameters();
                    if (parms.Length == 2) // (TrackAsset parent, string name)
                    {
                        MethodInfo generic = m.MakeGenericMethod(trackType);
                        return generic.Invoke(timeline, new object[] { null, trackName });
                    }
                }
            }
            return null;
        }

        private static object InvokeMethod(object obj, string methodName, params object[] args)
        {
            if (obj == null) return null;
            MethodInfo method = obj.GetType().GetMethod(methodName,
                BindingFlags.Public | BindingFlags.Instance);
            if (method != null)
                return method.Invoke(obj, args);
            return null;
        }

        private static object GetProperty(object obj, string propertyName)
        {
            if (obj == null) return null;
            PropertyInfo prop = obj.GetType().GetProperty(propertyName,
                BindingFlags.Public | BindingFlags.Instance);
            if (prop != null)
                return prop.GetValue(obj);
            return null;
        }

        private static void SetProperty(object obj, string propertyName, object value)
        {
            if (obj == null) return;
            PropertyInfo prop = obj.GetType().GetProperty(propertyName,
                BindingFlags.Public | BindingFlags.Instance);
            if (prop != null && prop.CanWrite)
                prop.SetValue(obj, value);
        }

        // ----------------------------------------------------------------
        //  Find helpers
        // ----------------------------------------------------------------

        private static UnityEngine.Object FindTimeline(string nameOrPath)
        {
            // Try as asset path.
            UnityEngine.Object asset = AssetDatabase.LoadAssetAtPath(nameOrPath, TimelineAssetType);
            if (asset != null) return asset;

            // Search by name.
            string[] guids = AssetDatabase.FindAssets($"t:TimelineAsset {nameOrPath}");
            foreach (string guid in guids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                UnityEngine.Object ta = AssetDatabase.LoadAssetAtPath(path, TimelineAssetType);
                if (ta != null && (ta.name == nameOrPath || path.Contains(nameOrPath)))
                    return ta;
            }

            // Check PlayableDirectors in scene.
            Component[] directors = UnityEngine.Object.FindObjectsOfType(PlayableDirectorType) as Component[];
            if (directors != null)
            {
                foreach (Component pd in directors)
                {
                    var pa = GetProperty(pd, "playableAsset") as UnityEngine.Object;
                    if (pa != null && TimelineAssetType.IsInstanceOfType(pa) && pa.name == nameOrPath)
                        return pa;
                }
            }

            return null;
        }

        private static void BindTrackToDirector(UnityEngine.Object timeline, object track, GameObject target)
        {
            Component[] directors = UnityEngine.Object.FindObjectsOfType(PlayableDirectorType) as Component[];
            if (directors == null) return;

            foreach (Component pd in directors)
            {
                var pa = GetProperty(pd, "playableAsset");
                if (pa == (object)timeline)
                {
                    Undo.RecordObject(pd, "Bind Track");

                    UnityEngine.Object binding;
                    if (AnimationTrackType != null && AnimationTrackType.IsInstanceOfType(track))
                    {
                        var animator = target.GetComponent<Animator>();
                        binding = animator != null ? (UnityEngine.Object)animator : target;
                    }
                    else if (AudioTrackType != null && AudioTrackType.IsInstanceOfType(track))
                    {
                        binding = target.GetComponent<AudioSource>();
                    }
                    else
                    {
                        binding = target;
                    }

                    // director.SetGenericBinding(track, binding)
                    MethodInfo setBinding = PlayableDirectorType.GetMethod("SetGenericBinding",
                        new Type[] { typeof(UnityEngine.Object), typeof(UnityEngine.Object) });
                    if (setBinding != null)
                        setBinding.Invoke(pd, new object[] { track as UnityEngine.Object, binding });

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
