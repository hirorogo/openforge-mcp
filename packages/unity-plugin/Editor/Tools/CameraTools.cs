using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class CameraTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_camera", CreateCamera);
            ToolExecutor.Register("set_camera_fov", SetCameraFov);
            ToolExecutor.Register("set_camera_clipping", SetCameraClipping);
            ToolExecutor.Register("set_camera_clear_flags", SetCameraClearFlags);
            ToolExecutor.Register("set_camera_target", SetCameraTarget);
            ToolExecutor.Register("create_cinemachine_vcam", CreateCinemachineVcam);
            ToolExecutor.Register("create_cinemachine_freelook", CreateCinemachineFreelook);
            ToolExecutor.Register("create_dolly_track", CreateDollyTrack);
            ToolExecutor.Register("set_cinemachine_follow", SetCinemachineFollow);
            ToolExecutor.Register("set_cinemachine_look_at", SetCinemachineLookAt);
            ToolExecutor.Register("create_camera_shake", CreateCameraShake);
            ToolExecutor.Register("set_camera_depth", SetCameraDepth);
        }

        private static ToolResult CreateCamera(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Camera");

            GameObject camGo = new GameObject(name);
            Camera cam = camGo.AddComponent<Camera>();
            camGo.AddComponent<AudioListener>();

            string posStr = GetParam(p, "position", "");
            if (!string.IsNullOrEmpty(posStr) && TryParseVector3(posStr, out Vector3 pos))
                camGo.transform.position = pos;

            string rotStr = GetParam(p, "rotation", "");
            if (!string.IsNullOrEmpty(rotStr) && TryParseVector3(rotStr, out Vector3 rot))
                camGo.transform.eulerAngles = rot;

            string fov = GetParam(p, "fov", "");
            if (!string.IsNullOrEmpty(fov))
                cam.fieldOfView = float.Parse(fov, System.Globalization.CultureInfo.InvariantCulture);

            string orthographic = GetParam(p, "orthographic", "");
            if (orthographic == "true")
            {
                cam.orthographic = true;
                string orthoSize = GetParam(p, "orthographic_size", "");
                if (!string.IsNullOrEmpty(orthoSize))
                    cam.orthographicSize = float.Parse(orthoSize, System.Globalization.CultureInfo.InvariantCulture);
            }

            string depth = GetParam(p, "depth", "");
            if (!string.IsNullOrEmpty(depth))
                cam.depth = float.Parse(depth, System.Globalization.CultureInfo.InvariantCulture);

            string cullingMask = GetParam(p, "culling_mask", "");
            if (!string.IsNullOrEmpty(cullingMask))
                cam.cullingMask = int.Parse(cullingMask);

            Undo.RegisterCreatedObjectUndo(camGo, "Create Camera");

            return new ToolResult
            {
                success = true,
                message = $"Created camera '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{camGo.GetInstanceID()},\"fov\":{cam.fieldOfView}}}"
            };
        }

        private static ToolResult SetCameraFov(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            float fov = float.Parse(GetRequiredParam(p, "fov"), System.Globalization.CultureInfo.InvariantCulture);

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            Camera cam = go.GetComponent<Camera>();
            if (cam == null) return Fail($"No Camera component on '{targetName}'");

            Undo.RecordObject(cam, "Set camera FOV");
            cam.fieldOfView = fov;

            return new ToolResult
            {
                success = true,
                message = $"Set FOV of '{go.name}' to {fov}"
            };
        }

        private static ToolResult SetCameraClipping(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            Camera cam = go.GetComponent<Camera>();
            if (cam == null) return Fail($"No Camera component on '{targetName}'");

            Undo.RecordObject(cam, "Set camera clipping");

            string near = GetParam(p, "near", "");
            if (!string.IsNullOrEmpty(near))
                cam.nearClipPlane = float.Parse(near, System.Globalization.CultureInfo.InvariantCulture);

            string far = GetParam(p, "far", "");
            if (!string.IsNullOrEmpty(far))
                cam.farClipPlane = float.Parse(far, System.Globalization.CultureInfo.InvariantCulture);

            return new ToolResult
            {
                success = true,
                message = $"Set clipping planes of '{go.name}' (near: {cam.nearClipPlane}, far: {cam.farClipPlane})"
            };
        }

        private static ToolResult SetCameraClearFlags(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string flags = GetRequiredParam(p, "clear_flags");

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            Camera cam = go.GetComponent<Camera>();
            if (cam == null) return Fail($"No Camera component on '{targetName}'");

            CameraClearFlags clearFlags;
            switch (flags.ToLower().Replace(" ", "_"))
            {
                case "skybox": clearFlags = CameraClearFlags.Skybox; break;
                case "solid_color": case "color": clearFlags = CameraClearFlags.SolidColor; break;
                case "depth": case "depth_only": clearFlags = CameraClearFlags.Depth; break;
                case "nothing": case "none": clearFlags = CameraClearFlags.Nothing; break;
                default: return Fail($"Unknown clear flags: {flags}. Valid: skybox, solid_color, depth, nothing");
            }

            Undo.RecordObject(cam, "Set camera clear flags");
            cam.clearFlags = clearFlags;

            string bgColor = GetParam(p, "background_color", "");
            if (!string.IsNullOrEmpty(bgColor) && TryParseColor(bgColor, out Color color))
                cam.backgroundColor = color;

            return new ToolResult
            {
                success = true,
                message = $"Set clear flags of '{go.name}' to {clearFlags}"
            };
        }

        private static ToolResult SetCameraTarget(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string lookAtName = GetRequiredParam(p, "look_at");

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            Camera cam = go.GetComponent<Camera>();
            if (cam == null) return Fail($"No Camera component on '{targetName}'");

            GameObject lookAtGo = FindByNameOrId(lookAtName);
            if (lookAtGo == null) return Fail($"Look-at target not found: {lookAtName}");

            Undo.RecordObject(go.transform, "Set camera target");
            go.transform.LookAt(lookAtGo.transform);

            return new ToolResult
            {
                success = true,
                message = $"Camera '{go.name}' now looking at '{lookAtGo.name}'"
            };
        }

        private static ToolResult CreateCinemachineVcam(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "CM vcam");

            Type vcamType = FindType("Cinemachine.CinemachineVirtualCamera");
            if (vcamType == null)
                return Fail("Cinemachine package not found. Install com.unity.cinemachine via Package Manager.");

            GameObject vcamGo = new GameObject(name);
            Component vcam = vcamGo.AddComponent(vcamType);

            string posStr = GetParam(p, "position", "");
            if (!string.IsNullOrEmpty(posStr) && TryParseVector3(posStr, out Vector3 pos))
                vcamGo.transform.position = pos;

            string followName = GetParam(p, "follow", "");
            if (!string.IsNullOrEmpty(followName))
            {
                GameObject followGo = FindByNameOrId(followName);
                if (followGo != null)
                {
                    var followProp = vcamType.GetProperty("Follow");
                    if (followProp != null) followProp.SetValue(vcam, followGo.transform);
                }
            }

            string lookAtName = GetParam(p, "look_at", "");
            if (!string.IsNullOrEmpty(lookAtName))
            {
                GameObject lookAtGo = FindByNameOrId(lookAtName);
                if (lookAtGo != null)
                {
                    var lookAtProp = vcamType.GetProperty("LookAt");
                    if (lookAtProp != null) lookAtProp.SetValue(vcam, lookAtGo.transform);
                }
            }

            string priority = GetParam(p, "priority", "");
            if (!string.IsNullOrEmpty(priority))
            {
                var priorityProp = vcamType.GetProperty("Priority");
                if (priorityProp != null) priorityProp.SetValue(vcam, int.Parse(priority));
            }

            Undo.RegisterCreatedObjectUndo(vcamGo, "Create Cinemachine Virtual Camera");

            return new ToolResult
            {
                success = true,
                message = $"Created Cinemachine virtual camera '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{vcamGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult CreateCinemachineFreelook(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "CM FreeLook");

            Type freelookType = FindType("Cinemachine.CinemachineFreeLook");
            if (freelookType == null)
                return Fail("Cinemachine package not found. Install com.unity.cinemachine via Package Manager.");

            GameObject freelookGo = new GameObject(name);
            Component freelook = freelookGo.AddComponent(freelookType);

            string followName = GetParam(p, "follow", "");
            if (!string.IsNullOrEmpty(followName))
            {
                GameObject followGo = FindByNameOrId(followName);
                if (followGo != null)
                {
                    var followProp = freelookType.GetProperty("Follow");
                    if (followProp != null) followProp.SetValue(freelook, followGo.transform);
                }
            }

            string lookAtName = GetParam(p, "look_at", "");
            if (!string.IsNullOrEmpty(lookAtName))
            {
                GameObject lookAtGo = FindByNameOrId(lookAtName);
                if (lookAtGo != null)
                {
                    var lookAtProp = freelookType.GetProperty("LookAt");
                    if (lookAtProp != null) lookAtProp.SetValue(freelook, lookAtGo.transform);
                }
            }

            Undo.RegisterCreatedObjectUndo(freelookGo, "Create Cinemachine FreeLook");

            return new ToolResult
            {
                success = true,
                message = $"Created Cinemachine FreeLook camera '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{freelookGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult CreateDollyTrack(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "DollyTrack");
            string waypointsStr = GetParam(p, "waypoints", "");

            Type pathType = FindType("Cinemachine.CinemachineSmoothPath");
            if (pathType == null)
                return Fail("Cinemachine package not found. Install com.unity.cinemachine via Package Manager.");

            GameObject trackGo = new GameObject(name);
            Component path = trackGo.AddComponent(pathType);

            if (!string.IsNullOrEmpty(waypointsStr))
            {
                string[] wpStrings = waypointsStr.Split(';');
                var waypointsField = pathType.GetField("m_Waypoints");
                if (waypointsField != null)
                {
                    Type waypointType = waypointsField.FieldType.GetElementType();
                    var waypointsArray = Array.CreateInstance(waypointType, wpStrings.Length);
                    var posField = waypointType.GetField("position");

                    for (int i = 0; i < wpStrings.Length; i++)
                    {
                        if (TryParseVector3(wpStrings[i].Trim(), out Vector3 wp))
                        {
                            var waypoint = Activator.CreateInstance(waypointType);
                            if (posField != null) posField.SetValue(waypoint, wp);
                            waypointsArray.SetValue(waypoint, i);
                        }
                    }
                    waypointsField.SetValue(path, waypointsArray);
                }
            }

            Undo.RegisterCreatedObjectUndo(trackGo, "Create Dolly Track");

            return new ToolResult
            {
                success = true,
                message = $"Created dolly track '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{trackGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult SetCinemachineFollow(Dictionary<string, string> p)
        {
            string vcamName = GetRequiredParam(p, "vcam");
            string followName = GetRequiredParam(p, "follow");

            GameObject vcamGo = FindByNameOrId(vcamName);
            if (vcamGo == null) return Fail($"Virtual camera not found: {vcamName}");

            GameObject followGo = FindByNameOrId(followName);
            if (followGo == null) return Fail($"Follow target not found: {followName}");

            Component vcam = vcamGo.GetComponent("CinemachineVirtualCamera");
            if (vcam == null) vcam = vcamGo.GetComponent("CinemachineFreeLook");
            if (vcam == null) return Fail($"No Cinemachine component found on '{vcamName}'");

            Undo.RecordObject(vcam, "Set Cinemachine follow");
            var followProp = vcam.GetType().GetProperty("Follow");
            if (followProp != null)
                followProp.SetValue(vcam, followGo.transform);

            return new ToolResult
            {
                success = true,
                message = $"Set '{vcamName}' to follow '{followName}'"
            };
        }

        private static ToolResult SetCinemachineLookAt(Dictionary<string, string> p)
        {
            string vcamName = GetRequiredParam(p, "vcam");
            string lookAtName = GetRequiredParam(p, "look_at");

            GameObject vcamGo = FindByNameOrId(vcamName);
            if (vcamGo == null) return Fail($"Virtual camera not found: {vcamName}");

            GameObject lookAtGo = FindByNameOrId(lookAtName);
            if (lookAtGo == null) return Fail($"Look-at target not found: {lookAtName}");

            Component vcam = vcamGo.GetComponent("CinemachineVirtualCamera");
            if (vcam == null) vcam = vcamGo.GetComponent("CinemachineFreeLook");
            if (vcam == null) return Fail($"No Cinemachine component found on '{vcamName}'");

            Undo.RecordObject(vcam, "Set Cinemachine look-at");
            var lookAtProp = vcam.GetType().GetProperty("LookAt");
            if (lookAtProp != null)
                lookAtProp.SetValue(vcam, lookAtGo.transform);

            return new ToolResult
            {
                success = true,
                message = $"Set '{vcamName}' to look at '{lookAtName}'"
            };
        }

        private static ToolResult CreateCameraShake(Dictionary<string, string> p)
        {
            string targetName = GetParam(p, "target", "");

            Type noiseType = FindType("Cinemachine.CinemachineBasicMultiChannelPerlin");

            if (noiseType != null && !string.IsNullOrEmpty(targetName))
            {
                GameObject vcamGo = FindByNameOrId(targetName);
                if (vcamGo == null) return Fail($"Virtual camera not found: {targetName}");

                Component vcam = vcamGo.GetComponent("CinemachineVirtualCamera");
                if (vcam != null)
                {
                    var getPipeline = vcam.GetType().GetMethod("GetCinemachineComponent", new Type[] { typeof(int) });
                    if (getPipeline == null)
                    {
                        var addPipeline = vcam.GetType().GetMethod("AddCinemachineComponent");
                        if (addPipeline != null)
                        {
                            var genericMethod = addPipeline.MakeGenericMethod(noiseType);
                            var noise = genericMethod.Invoke(vcam, null);

                            string ampStr = GetParam(p, "amplitude", "1");
                            string freqStr = GetParam(p, "frequency", "1");

                            var ampField = noiseType.GetField("m_AmplitudeGain");
                            if (ampField != null) ampField.SetValue(noise, float.Parse(ampStr, System.Globalization.CultureInfo.InvariantCulture));

                            var freqField = noiseType.GetField("m_FrequencyGain");
                            if (freqField != null) freqField.SetValue(noise, float.Parse(freqStr, System.Globalization.CultureInfo.InvariantCulture));

                            return new ToolResult
                            {
                                success = true,
                                message = $"Added camera shake to '{targetName}'"
                            };
                        }
                    }
                }
            }

            string name = GetParam(p, "name", "CameraShake");
            float amplitude = float.Parse(GetParam(p, "amplitude", "0.5"), System.Globalization.CultureInfo.InvariantCulture);
            float frequency = float.Parse(GetParam(p, "frequency", "10"), System.Globalization.CultureInfo.InvariantCulture);

            string scriptContent = $@"using UnityEngine;

public class {name} : MonoBehaviour
{{
    public float amplitude = {amplitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}f;
    public float frequency = {frequency.ToString(System.Globalization.CultureInfo.InvariantCulture)}f;
    public float duration = 0.5f;

    private Vector3 _originalPosition;
    private float _elapsed;
    private bool _isShaking;

    private void Awake()
    {{
        _originalPosition = transform.localPosition;
    }}

    public void Shake()
    {{
        _isShaking = true;
        _elapsed = 0f;
    }}

    private void Update()
    {{
        if (!_isShaking) return;
        _elapsed += Time.deltaTime;
        if (_elapsed >= duration)
        {{
            _isShaking = false;
            transform.localPosition = _originalPosition;
            return;
        }}
        float dampingFactor = 1f - (_elapsed / duration);
        float x = (Mathf.PerlinNoise(Time.time * frequency, 0f) * 2f - 1f) * amplitude * dampingFactor;
        float y = (Mathf.PerlinNoise(0f, Time.time * frequency) * 2f - 1f) * amplitude * dampingFactor;
        transform.localPosition = _originalPosition + new Vector3(x, y, 0f);
    }}
}}";
            string directory = "Assets/Scripts";
            if (!System.IO.Directory.Exists(directory))
                System.IO.Directory.CreateDirectory(directory);

            string filePath = $"{directory}/{name}.cs";
            System.IO.File.WriteAllText(filePath, scriptContent);
            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created camera shake script '{name}' at {filePath}",
                data = $"{{\"path\":\"{EscapeJson(filePath)}\"}}"
            };
        }

        private static ToolResult SetCameraDepth(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            float depth = float.Parse(GetRequiredParam(p, "depth"), System.Globalization.CultureInfo.InvariantCulture);

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            Camera cam = go.GetComponent<Camera>();
            if (cam == null) return Fail($"No Camera component on '{targetName}'");

            Undo.RecordObject(cam, "Set camera depth");
            cam.depth = depth;

            return new ToolResult
            {
                success = true,
                message = $"Set depth of '{go.name}' to {depth}"
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
