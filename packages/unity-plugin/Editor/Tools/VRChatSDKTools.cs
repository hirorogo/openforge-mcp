using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class VRChatSDKTools
    {
        private const string SDK_NOT_INSTALLED_MSG =
            "VRChat SDK is not installed. Use install_package to add com.vrchat.avatars or com.vrchat.worlds";

        public static void Register()
        {
            ToolExecutor.Register("check_sdk_installed", CheckSdkInstalled);
            ToolExecutor.Register("setup_vrc_world", SetupVrcWorld);
            ToolExecutor.Register("add_spawn_point", AddSpawnPoint);
            ToolExecutor.Register("set_spawn_order", SetSpawnOrder);
            ToolExecutor.Register("add_mirror", AddMirror);
            ToolExecutor.Register("add_pickup", AddPickup);
            ToolExecutor.Register("add_portal", AddPortal);
            ToolExecutor.Register("set_world_capacity", SetWorldCapacity);
            ToolExecutor.Register("add_video_player", AddVideoPlayer);
            ToolExecutor.Register("add_chair", AddChair);
            ToolExecutor.Register("setup_vrc_avatar", SetupVrcAvatar);
            ToolExecutor.Register("set_viewpoint", SetViewpoint);
            ToolExecutor.Register("validate_for_upload", ValidateForUpload);
            ToolExecutor.Register("get_vrc_components", GetVrcComponents);
            ToolExecutor.Register("estimate_performance", EstimatePerformance);
        }

        // --- SDK Detection Helpers ---

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

        private static bool IsWorldsSdkInstalled()
        {
            return FindVrcType("VRC.SDK3.Components.VRCSceneDescriptor") != null;
        }

        private static bool IsAvatarsSdkInstalled()
        {
            return FindVrcType("VRC.SDK3.Avatars.Components.VRCAvatarDescriptor") != null;
        }

        private static bool IsAnySdkInstalled()
        {
            return IsWorldsSdkInstalled() || IsAvatarsSdkInstalled();
        }

        private static string GetSdkVersion()
        {
            // Try to find version from the SDK settings type
            Type settingsType = FindVrcType("VRC.Core.SDKClientUtilities");
            if (settingsType != null)
            {
                var versionMethod = settingsType.GetMethod("GetVersion", BindingFlags.Static | BindingFlags.Public);
                if (versionMethod != null)
                {
                    try { return versionMethod.Invoke(null, null) as string ?? "unknown"; }
                    catch { }
                }
            }

            // Fallback: check package info
            var request = UnityEditor.PackageManager.Client.List(true);
            while (!request.IsCompleted) { }
            if (request.Status == UnityEditor.PackageManager.StatusCode.Success)
            {
                foreach (var pkg in request.Result)
                {
                    if (pkg.name == "com.vrchat.worlds" || pkg.name == "com.vrchat.avatars")
                        return pkg.version;
                }
            }
            return "unknown";
        }

        private static Component AddVrcComponent(GameObject go, string fullTypeName)
        {
            Type type = FindVrcType(fullTypeName);
            if (type == null) return null;
            return Undo.AddComponent(go, type);
        }

        private static void SetComponentProperty(Component comp, string propertyName, object value)
        {
            if (comp == null) return;
            var prop = comp.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);
            if (prop != null)
            {
                prop.SetValue(comp, value);
                return;
            }
            var field = comp.GetType().GetField(propertyName, BindingFlags.Public | BindingFlags.Instance);
            if (field != null)
            {
                field.SetValue(comp, value);
            }
        }

        private static object GetComponentProperty(Component comp, string propertyName)
        {
            if (comp == null) return null;
            var prop = comp.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);
            if (prop != null) return prop.GetValue(comp);
            var field = comp.GetType().GetField(propertyName, BindingFlags.Public | BindingFlags.Instance);
            if (field != null) return field.GetValue(comp);
            return null;
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

        // --- Tool Implementations ---

        private static ToolResult CheckSdkInstalled(Dictionary<string, string> p)
        {
            bool worldsSdk = IsWorldsSdkInstalled();
            bool avatarsSdk = IsAvatarsSdkInstalled();

            if (!worldsSdk && !avatarsSdk)
            {
                return new ToolResult
                {
                    success = true,
                    message = "VRChat SDK is not installed",
                    data = "{\"installed\":false,\"worlds\":false,\"avatars\":false}"
                };
            }

            string version = GetSdkVersion();
            return new ToolResult
            {
                success = true,
                message = $"VRChat SDK installed (worlds={worldsSdk}, avatars={avatarsSdk}, version={version})",
                data = $"{{\"installed\":true,\"worlds\":{BoolStr(worldsSdk)},\"avatars\":{BoolStr(avatarsSdk)},\"version\":\"{EscapeJson(version)}\"}}"
            };
        }

        private static ToolResult SetupVrcWorld(Dictionary<string, string> p)
        {
            if (!IsWorldsSdkInstalled())
                return Fail(SDK_NOT_INSTALLED_MSG);

            Type descriptorType = FindVrcType("VRC.SDK3.Components.VRCSceneDescriptor");
            if (descriptorType == null)
                return Fail("VRCSceneDescriptor type not found in SDK.");

            // Find existing or create new
            UnityEngine.Object existing = UnityEngine.Object.FindObjectOfType(descriptorType);
            GameObject go;
            Component descriptor;

            if (existing != null)
            {
                descriptor = existing as Component;
                go = descriptor.gameObject;
            }
            else
            {
                go = new GameObject("VRCWorld");
                Undo.RegisterCreatedObjectUndo(go, "Create VRCWorld");
                descriptor = Undo.AddComponent(go, descriptorType);
            }

            // Configure spawn position
            string spawnPos = GetParam(p, "spawn_position", "");
            if (!string.IsNullOrEmpty(spawnPos) && TryParseVector3(spawnPos, out Vector3 pos))
            {
                go.transform.position = pos;
            }

            // Configure respawn height
            string respawnHeight = GetParam(p, "respawn_height", "");
            if (!string.IsNullOrEmpty(respawnHeight) && float.TryParse(respawnHeight,
                System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float height))
            {
                SetComponentProperty(descriptor, "RespawnHeightY", height);
            }

            // Configure reference camera
            string refCamera = GetParam(p, "reference_camera", "");
            if (!string.IsNullOrEmpty(refCamera))
            {
                GameObject camGo = FindByNameOrId(refCamera);
                if (camGo != null)
                {
                    Camera cam = camGo.GetComponent<Camera>();
                    if (cam != null)
                        SetComponentProperty(descriptor, "ReferenceCamera", camGo);
                }
            }

            return new ToolResult
            {
                success = true,
                message = existing != null
                    ? $"Updated existing VRCSceneDescriptor on '{go.name}'"
                    : $"Created VRCWorld with VRCSceneDescriptor",
                data = $"{{\"gameObject\":\"{EscapeJson(go.name)}\",\"instanceId\":{go.GetInstanceID()}}}"
            };
        }

        private static ToolResult AddSpawnPoint(Dictionary<string, string> p)
        {
            if (!IsWorldsSdkInstalled())
                return Fail(SDK_NOT_INSTALLED_MSG);

            string posStr = GetParam(p, "position", "0,0,0");
            string name = GetParam(p, "name", "SpawnPoint");

            if (!TryParseVector3(posStr, out Vector3 position))
                return Fail("Invalid position format. Use 'x,y,z' or '[x,y,z]'");

            GameObject spawnGo = new GameObject(name);
            spawnGo.transform.position = position;
            Undo.RegisterCreatedObjectUndo(spawnGo, $"Create spawn point {name}");

            // Find VRCSceneDescriptor and add to spawns list
            Type descriptorType = FindVrcType("VRC.SDK3.Components.VRCSceneDescriptor");
            if (descriptorType != null)
            {
                UnityEngine.Object descriptorObj = UnityEngine.Object.FindObjectOfType(descriptorType);
                if (descriptorObj != null)
                {
                    Component descriptor = descriptorObj as Component;
                    Undo.RecordObject(descriptor, "Add spawn point");
                    var spawnsField = descriptorType.GetField("spawns", BindingFlags.Public | BindingFlags.Instance);
                    if (spawnsField != null)
                    {
                        var spawns = spawnsField.GetValue(descriptor) as Transform[];
                        if (spawns == null) spawns = new Transform[0];
                        var newSpawns = new Transform[spawns.Length + 1];
                        Array.Copy(spawns, newSpawns, spawns.Length);
                        newSpawns[spawns.Length] = spawnGo.transform;
                        spawnsField.SetValue(descriptor, newSpawns);
                    }
                }
                else
                {
                    return new ToolResult
                    {
                        success = true,
                        message = $"Created spawn point '{name}' but no VRCSceneDescriptor found in scene. Run setup_vrc_world first.",
                        data = $"{{\"name\":\"{EscapeJson(name)}\",\"position\":[{position.x},{position.y},{position.z}]}}"
                    };
                }
            }

            return new ToolResult
            {
                success = true,
                message = $"Created spawn point '{name}' at ({position.x}, {position.y}, {position.z})",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{spawnGo.GetInstanceID()},\"position\":[{position.x},{position.y},{position.z}]}}"
            };
        }

        private static ToolResult SetSpawnOrder(Dictionary<string, string> p)
        {
            if (!IsWorldsSdkInstalled())
                return Fail(SDK_NOT_INSTALLED_MSG);

            string order = GetParam(p, "order", "sequential").ToLower();
            string rotation = GetParam(p, "rotation", "");

            Type descriptorType = FindVrcType("VRC.SDK3.Components.VRCSceneDescriptor");
            if (descriptorType == null)
                return Fail("VRCSceneDescriptor type not found.");

            UnityEngine.Object descriptorObj = UnityEngine.Object.FindObjectOfType(descriptorType);
            if (descriptorObj == null)
                return Fail("No VRCSceneDescriptor found in scene. Run setup_vrc_world first.");

            Component descriptor = descriptorObj as Component;
            Undo.RecordObject(descriptor, "Set spawn order");

            // Set spawn order via reflection on the enum
            Type spawnOrderType = FindVrcType("VRC.SDK3.Components.VRCSceneDescriptor+SpawnOrder");
            if (spawnOrderType == null)
                spawnOrderType = FindVrcType("VRC.SDKBase.VRCSceneDescriptor+SpawnOrder");

            if (spawnOrderType != null)
            {
                object orderValue = null;
                if (order == "random")
                    orderValue = Enum.Parse(spawnOrderType, "Random");
                else if (order == "sequential" || order == "default")
                    orderValue = Enum.Parse(spawnOrderType, "Sequential");
                else if (order == "first")
                    orderValue = Enum.Parse(spawnOrderType, "First");

                if (orderValue != null)
                    SetComponentProperty(descriptor, "spawnOrder", orderValue);
            }

            // Set spawn orientation
            if (!string.IsNullOrEmpty(rotation))
            {
                Type orientationType = FindVrcType("VRC.SDK3.Components.VRCSceneDescriptor+SpawnOrientation");
                if (orientationType == null)
                    orientationType = FindVrcType("VRC.SDKBase.VRCSceneDescriptor+SpawnOrientation");

                if (orientationType != null)
                {
                    try
                    {
                        object orientValue = Enum.Parse(orientationType, rotation, true);
                        SetComponentProperty(descriptor, "spawnOrientation", orientValue);
                    }
                    catch { }
                }
            }

            return new ToolResult
            {
                success = true,
                message = $"Set spawn order to '{order}'" + (string.IsNullOrEmpty(rotation) ? "" : $" with rotation '{rotation}'")
            };
        }

        private static ToolResult AddMirror(Dictionary<string, string> p)
        {
            if (!IsWorldsSdkInstalled())
                return Fail(SDK_NOT_INSTALLED_MSG);

            string name = GetParam(p, "name", "VRCMirror");
            string posStr = GetParam(p, "position", "0,1.5,0");
            string scaleStr = GetParam(p, "scale", "3,3,1");

            TryParseVector3(posStr, out Vector3 position);
            TryParseVector3(scaleStr, out Vector3 scale);

            GameObject mirrorGo = GameObject.CreatePrimitive(PrimitiveType.Quad);
            mirrorGo.name = name;
            mirrorGo.transform.position = position;
            mirrorGo.transform.localScale = scale;
            Undo.RegisterCreatedObjectUndo(mirrorGo, $"Create mirror {name}");

            Component mirrorComp = AddVrcComponent(mirrorGo, "VRC.SDK3.Components.VRCMirrorReflection");
            if (mirrorComp == null)
                mirrorComp = AddVrcComponent(mirrorGo, "VRC.SDKBase.VRC_MirrorReflection");

            if (mirrorComp != null)
            {
                // Set default mirror layers to reflect everything
                SetComponentProperty(mirrorComp, "m_ReflectLayers", ~0);
            }

            return new ToolResult
            {
                success = true,
                message = $"Created mirror '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{mirrorGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult AddPickup(Dictionary<string, string> p)
        {
            if (!IsWorldsSdkInstalled())
                return Fail(SDK_NOT_INSTALLED_MSG);

            string targetName = GetRequiredParam(p, "name");
            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Undo.RecordObject(go, $"Add VRC_Pickup to {targetName}");

            // Ensure Rigidbody exists
            if (go.GetComponent<Rigidbody>() == null)
            {
                Undo.AddComponent<Rigidbody>(go);
            }

            Component pickupComp = AddVrcComponent(go, "VRC.SDK3.Components.VRCPickup");
            if (pickupComp == null)
                pickupComp = AddVrcComponent(go, "VRC.SDKBase.VRC_Pickup");

            if (pickupComp == null)
                return Fail("Failed to add VRC_Pickup component. Is VRChat Worlds SDK installed?");

            // Configure pickup properties
            string allowType = GetParam(p, "allow_manipulation_when_equipped", "");
            string orientation = GetParam(p, "orientation", "");
            string proximity = GetParam(p, "proximity", "");

            if (!string.IsNullOrEmpty(proximity) && float.TryParse(proximity,
                System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float prox))
            {
                SetComponentProperty(pickupComp, "proximity", prox);
            }

            return new ToolResult
            {
                success = true,
                message = $"Added VRC_Pickup to '{go.name}' (Rigidbody added if missing)",
                data = $"{{\"gameObject\":\"{EscapeJson(go.name)}\",\"instanceId\":{go.GetInstanceID()}}}"
            };
        }

        private static ToolResult AddPortal(Dictionary<string, string> p)
        {
            if (!IsWorldsSdkInstalled())
                return Fail(SDK_NOT_INSTALLED_MSG);

            string worldId = GetRequiredParam(p, "world_id");
            string name = GetParam(p, "name", "VRCPortal");
            string posStr = GetParam(p, "position", "0,0,0");

            TryParseVector3(posStr, out Vector3 position);

            GameObject portalGo = new GameObject(name);
            portalGo.transform.position = position;
            Undo.RegisterCreatedObjectUndo(portalGo, $"Create portal {name}");

            Component portalComp = AddVrcComponent(portalGo, "VRC.SDK3.Components.VRCPortalMarker");
            if (portalComp == null)
                portalComp = AddVrcComponent(portalGo, "VRC.SDKBase.VRC_PortalMarker");

            if (portalComp != null)
            {
                SetComponentProperty(portalComp, "roomId", worldId);
            }
            else
            {
                return Fail("Failed to add VRCPortalMarker component.");
            }

            return new ToolResult
            {
                success = true,
                message = $"Created portal '{name}' to world '{worldId}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"worldId\":\"{EscapeJson(worldId)}\",\"instanceId\":{portalGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult SetWorldCapacity(Dictionary<string, string> p)
        {
            if (!IsWorldsSdkInstalled())
                return Fail(SDK_NOT_INSTALLED_MSG);

            string recommendedStr = GetParam(p, "recommended", "");
            string maxStr = GetParam(p, "max", "");

            if (string.IsNullOrEmpty(recommendedStr) && string.IsNullOrEmpty(maxStr))
                return Fail("Specify at least 'recommended' or 'max' capacity.");

            Type descriptorType = FindVrcType("VRC.SDK3.Components.VRCSceneDescriptor");
            if (descriptorType == null)
                return Fail("VRCSceneDescriptor type not found.");

            UnityEngine.Object descriptorObj = UnityEngine.Object.FindObjectOfType(descriptorType);
            if (descriptorObj == null)
                return Fail("No VRCSceneDescriptor found in scene. Run setup_vrc_world first.");

            Component descriptor = descriptorObj as Component;
            Undo.RecordObject(descriptor, "Set world capacity");

            int recommended = -1, max = -1;
            if (!string.IsNullOrEmpty(recommendedStr) && int.TryParse(recommendedStr, out recommended))
                SetComponentProperty(descriptor, "capacity", recommended);

            if (!string.IsNullOrEmpty(maxStr) && int.TryParse(maxStr, out max))
                SetComponentProperty(descriptor, "maxCapacity", max);

            return new ToolResult
            {
                success = true,
                message = $"Set world capacity (recommended={recommended}, max={max})"
            };
        }

        private static ToolResult AddVideoPlayer(Dictionary<string, string> p)
        {
            if (!IsWorldsSdkInstalled())
                return Fail(SDK_NOT_INSTALLED_MSG);

            string name = GetParam(p, "name", "VideoPlayer");
            string playerType = GetParam(p, "type", "avpro").ToLower();
            string posStr = GetParam(p, "position", "0,2,0");
            string url = GetParam(p, "url", "");

            TryParseVector3(posStr, out Vector3 position);

            GameObject videoGo = new GameObject(name);
            videoGo.transform.position = position;
            Undo.RegisterCreatedObjectUndo(videoGo, $"Create video player {name}");

            // Create a screen quad as child
            GameObject screen = GameObject.CreatePrimitive(PrimitiveType.Quad);
            screen.name = "Screen";
            screen.transform.SetParent(videoGo.transform);
            screen.transform.localPosition = Vector3.zero;
            screen.transform.localScale = new Vector3(16f / 9f * 2f, 2f, 1f);

            Component videoComp;
            if (playerType == "unity")
            {
                videoComp = AddVrcComponent(videoGo, "VRC.SDK3.Video.Components.VRCUnityVideoPlayer");
                if (videoComp == null)
                    videoComp = AddVrcComponent(videoGo, "VRC.SDKBase.VRC_UnityVideoPlayer");
            }
            else
            {
                videoComp = AddVrcComponent(videoGo, "VRC.SDK3.Video.Components.AVPro.VRCAVProVideoPlayer");
                if (videoComp == null)
                    videoComp = AddVrcComponent(videoGo, "VRC.SDKBase.VRC_AVProVideoPlayer");
            }

            if (videoComp != null && !string.IsNullOrEmpty(url))
            {
                // Try to set the URL via VRCUrl type
                Type vrcUrlType = FindVrcType("VRC.SDKBase.VRCUrl");
                if (vrcUrlType != null)
                {
                    try
                    {
                        object vrcUrl = Activator.CreateInstance(vrcUrlType, url);
                        SetComponentProperty(videoComp, "url", vrcUrl);
                    }
                    catch { }
                }
            }

            string typeLabel = playerType == "unity" ? "UnityVideoPlayer" : "AVProVideoPlayer";
            return new ToolResult
            {
                success = true,
                message = $"Created video player '{name}' ({typeLabel})",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"type\":\"{typeLabel}\",\"instanceId\":{videoGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult AddChair(Dictionary<string, string> p)
        {
            if (!IsWorldsSdkInstalled())
                return Fail(SDK_NOT_INSTALLED_MSG);

            string name = GetParam(p, "name", "VRCChair");
            string posStr = GetParam(p, "position", "0,0,0");
            string rotStr = GetParam(p, "rotation", "0,0,0");

            TryParseVector3(posStr, out Vector3 position);
            TryParseVector3(rotStr, out Vector3 rotation);

            // Create chair object
            GameObject chairGo = new GameObject(name);
            chairGo.transform.position = position;
            chairGo.transform.eulerAngles = rotation;
            Undo.RegisterCreatedObjectUndo(chairGo, $"Create chair {name}");

            // Create enter/exit collider
            BoxCollider collider = Undo.AddComponent<BoxCollider>(chairGo);
            collider.size = new Vector3(0.5f, 0.8f, 0.5f);
            collider.center = new Vector3(0, 0.4f, 0);
            collider.isTrigger = true;

            // Add VRCStation component
            Component stationComp = AddVrcComponent(chairGo, "VRC.SDK3.Components.VRCStation");
            if (stationComp == null)
                stationComp = AddVrcComponent(chairGo, "VRC.SDKBase.VRC_Station");

            if (stationComp == null)
                return Fail("Failed to add VRCStation component.");

            // Create player position marker
            GameObject playerPos = new GameObject("PlayerPosition");
            playerPos.transform.SetParent(chairGo.transform);
            playerPos.transform.localPosition = new Vector3(0, 0.45f, 0);
            playerPos.transform.localRotation = Quaternion.identity;

            SetComponentProperty(stationComp, "PlayerMobility",
                GetEnumValue("VRC.SDKBase.VRCStation+Mobility", "Immobilize"));
            SetComponentProperty(stationComp, "stationEnterPlayerLocation", playerPos.transform);
            SetComponentProperty(stationComp, "stationExitPlayerLocation", chairGo.transform);

            // Configure disableStationExit
            string canExit = GetParam(p, "can_exit", "true");
            if (canExit == "false")
                SetComponentProperty(stationComp, "disableStationExit", true);

            return new ToolResult
            {
                success = true,
                message = $"Created chair '{name}' with VRCStation",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{chairGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult SetupVrcAvatar(Dictionary<string, string> p)
        {
            if (!IsAvatarsSdkInstalled())
                return Fail(SDK_NOT_INSTALLED_MSG);

            string targetName = GetRequiredParam(p, "name");
            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Type avatarDescType = FindVrcType("VRC.SDK3.Avatars.Components.VRCAvatarDescriptor");
            if (avatarDescType == null)
                return Fail("VRCAvatarDescriptor type not found.");

            // Check if already has descriptor
            Component existing = go.GetComponent(avatarDescType);
            Component descriptor;
            if (existing != null)
            {
                descriptor = existing;
                Undo.RecordObject(descriptor, "Update VRCAvatarDescriptor");
            }
            else
            {
                descriptor = Undo.AddComponent(go, avatarDescType);
            }

            if (descriptor == null)
                return Fail("Failed to add VRCAvatarDescriptor.");

            // Auto-detect viewpoint from head bone
            Animator animator = go.GetComponent<Animator>();
            if (animator != null && animator.isHuman)
            {
                Transform headBone = animator.GetBoneTransform(HumanBodyBones.Head);
                if (headBone != null)
                {
                    // Set viewpoint slightly above and forward of head
                    Vector3 viewPos = go.transform.InverseTransformPoint(headBone.position);
                    viewPos.y += 0.08f;
                    viewPos.z += 0.06f;
                    SetComponentProperty(descriptor, "ViewPosition", viewPos);
                }
            }

            // Set lip sync mode if specified
            string lipSyncMode = GetParam(p, "lip_sync", "");
            if (!string.IsNullOrEmpty(lipSyncMode))
            {
                Type lipSyncType = FindVrcType("VRC.SDK3.Avatars.Components.VRCAvatarDescriptor+LipSyncStyle");
                if (lipSyncType != null)
                {
                    try
                    {
                        object lipSyncValue = Enum.Parse(lipSyncType, lipSyncMode, true);
                        SetComponentProperty(descriptor, "lipSync", lipSyncValue);
                    }
                    catch { }
                }
            }

            return new ToolResult
            {
                success = true,
                message = existing != null
                    ? $"Updated VRCAvatarDescriptor on '{go.name}'"
                    : $"Added VRCAvatarDescriptor to '{go.name}'",
                data = $"{{\"gameObject\":\"{EscapeJson(go.name)}\",\"instanceId\":{go.GetInstanceID()}}}"
            };
        }

        private static ToolResult SetViewpoint(Dictionary<string, string> p)
        {
            if (!IsAvatarsSdkInstalled())
                return Fail(SDK_NOT_INSTALLED_MSG);

            string targetName = GetRequiredParam(p, "name");
            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Type avatarDescType = FindVrcType("VRC.SDK3.Avatars.Components.VRCAvatarDescriptor");
            if (avatarDescType == null)
                return Fail("VRCAvatarDescriptor type not found.");

            Component descriptor = go.GetComponent(avatarDescType);
            if (descriptor == null)
                return Fail($"'{targetName}' does not have a VRCAvatarDescriptor. Run setup_vrc_avatar first.");

            Undo.RecordObject(descriptor, "Set viewpoint");

            string posStr = GetParam(p, "position", "");
            bool autoDetect = GetParam(p, "auto_detect", "false") == "true";

            Vector3 viewPos;

            if (autoDetect)
            {
                Animator animator = go.GetComponent<Animator>();
                if (animator == null || !animator.isHuman)
                    return Fail("Auto-detect requires a humanoid Animator on the avatar.");

                Transform headBone = animator.GetBoneTransform(HumanBodyBones.Head);
                if (headBone == null)
                    return Fail("Could not find head bone for auto-detection.");

                viewPos = go.transform.InverseTransformPoint(headBone.position);
                viewPos.y += 0.08f;
                viewPos.z += 0.06f;
            }
            else if (!string.IsNullOrEmpty(posStr) && TryParseVector3(posStr, out viewPos))
            {
                // viewPos already set
            }
            else
            {
                return Fail("Specify 'position' (x,y,z) or set 'auto_detect' to 'true'.");
            }

            SetComponentProperty(descriptor, "ViewPosition", viewPos);

            return new ToolResult
            {
                success = true,
                message = $"Set viewpoint of '{go.name}' to ({viewPos.x:F3}, {viewPos.y:F3}, {viewPos.z:F3})",
                data = $"{{\"viewPosition\":[{viewPos.x},{viewPos.y},{viewPos.z}]}}"
            };
        }

        private static ToolResult ValidateForUpload(Dictionary<string, string> p)
        {
            if (!IsAnySdkInstalled())
                return Fail(SDK_NOT_INSTALLED_MSG);

            List<string> errors = new List<string>();
            List<string> warnings = new List<string>();
            string contentType = "unknown";

            // Check for world descriptor
            Type worldDescType = FindVrcType("VRC.SDK3.Components.VRCSceneDescriptor");
            Type avatarDescType = FindVrcType("VRC.SDK3.Avatars.Components.VRCAvatarDescriptor");

            bool hasWorldDesc = worldDescType != null && UnityEngine.Object.FindObjectOfType(worldDescType) != null;
            bool hasAvatarDesc = avatarDescType != null && UnityEngine.Object.FindObjectOfType(avatarDescType) != null;

            if (hasWorldDesc && hasAvatarDesc)
                errors.Add("Scene contains both VRCSceneDescriptor and VRCAvatarDescriptor. Remove one.");
            else if (hasWorldDesc)
                contentType = "world";
            else if (hasAvatarDesc)
                contentType = "avatar";
            else
                errors.Add("No VRCSceneDescriptor or VRCAvatarDescriptor found. Run setup_vrc_world or setup_vrc_avatar.");

            if (contentType == "world")
            {
                // World validation
                Component worldDesc = UnityEngine.Object.FindObjectOfType(worldDescType) as Component;
                var spawnsField = worldDescType.GetField("spawns", BindingFlags.Public | BindingFlags.Instance);
                if (spawnsField != null)
                {
                    var spawns = spawnsField.GetValue(worldDesc) as Transform[];
                    if (spawns == null || spawns.Length == 0)
                        warnings.Add("No spawn points configured. Players will spawn at the descriptor position.");
                }
            }

            if (contentType == "avatar")
            {
                // Avatar validation
                Component avatarDesc = UnityEngine.Object.FindObjectOfType(avatarDescType) as Component;
                GameObject avatarGo = avatarDesc.gameObject;

                Animator animator = avatarGo.GetComponent<Animator>();
                if (animator == null)
                    errors.Add("Avatar has no Animator component.");
                else if (!animator.isHuman)
                    warnings.Add("Avatar is not configured as Humanoid. Most features require a humanoid rig.");

                // Check poly count
                MeshFilter[] meshFilters = avatarGo.GetComponentsInChildren<MeshFilter>(true);
                SkinnedMeshRenderer[] skinnedMeshes = avatarGo.GetComponentsInChildren<SkinnedMeshRenderer>(true);
                int totalPolys = 0;
                foreach (var mf in meshFilters)
                    if (mf.sharedMesh != null) totalPolys += mf.sharedMesh.triangles.Length / 3;
                foreach (var smr in skinnedMeshes)
                    if (smr.sharedMesh != null) totalPolys += smr.sharedMesh.triangles.Length / 3;

                if (totalPolys > 70000)
                    warnings.Add($"Avatar has {totalPolys} polygons. Recommended limit is 70,000 for Good performance rank.");
                if (totalPolys > 70000 * 2)
                    errors.Add($"Avatar has {totalPolys} polygons which is very high and may cause performance issues.");
            }

            bool valid = errors.Count == 0;
            StringBuilder dataSb = new StringBuilder();
            dataSb.Append("{");
            dataSb.Append($"\"valid\":{BoolStr(valid)},");
            dataSb.Append($"\"contentType\":\"{contentType}\",");
            dataSb.Append("\"errors\":[");
            for (int i = 0; i < errors.Count; i++)
            {
                if (i > 0) dataSb.Append(",");
                dataSb.Append($"\"{EscapeJson(errors[i])}\"");
            }
            dataSb.Append("],\"warnings\":[");
            for (int i = 0; i < warnings.Count; i++)
            {
                if (i > 0) dataSb.Append(",");
                dataSb.Append($"\"{EscapeJson(warnings[i])}\"");
            }
            dataSb.Append("]}");

            return new ToolResult
            {
                success = true,
                message = valid
                    ? $"Validation passed for {contentType} ({warnings.Count} warning(s))"
                    : $"Validation failed: {errors.Count} error(s), {warnings.Count} warning(s)",
                data = dataSb.ToString()
            };
        }

        private static ToolResult GetVrcComponents(Dictionary<string, string> p)
        {
            if (!IsAnySdkInstalled())
                return Fail(SDK_NOT_INSTALLED_MSG);

            List<Component> vrcComponents = new List<Component>();
            Component[] allComponents = UnityEngine.Object.FindObjectsOfType<Component>();

            foreach (var comp in allComponents)
            {
                if (comp == null) continue;
                string ns = comp.GetType().Namespace ?? "";
                if (ns.StartsWith("VRC.") || ns.StartsWith("VRC_"))
                {
                    vrcComponents.Add(comp);
                }
            }

            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < vrcComponents.Count; i++)
            {
                if (i > 0) sb.Append(",");
                Component c = vrcComponents[i];
                sb.Append("{");
                sb.Append($"\"type\":\"{EscapeJson(c.GetType().Name)}\",");
                sb.Append($"\"fullType\":\"{EscapeJson(c.GetType().FullName)}\",");
                sb.Append($"\"gameObject\":\"{EscapeJson(c.gameObject.name)}\",");
                sb.Append($"\"instanceId\":{c.gameObject.GetInstanceID()}");
                sb.Append("}");
            }
            sb.Append("]");

            return new ToolResult
            {
                success = true,
                message = $"Found {vrcComponents.Count} VRC component(s) in scene",
                data = sb.ToString()
            };
        }

        private static ToolResult EstimatePerformance(Dictionary<string, string> p)
        {
            if (!IsAnySdkInstalled())
                return Fail(SDK_NOT_INSTALLED_MSG);

            string targetName = GetParam(p, "name", "");
            GameObject root = null;

            // Determine if we are evaluating an avatar or a world
            Type avatarDescType = FindVrcType("VRC.SDK3.Avatars.Components.VRCAvatarDescriptor");
            Type worldDescType = FindVrcType("VRC.SDK3.Components.VRCSceneDescriptor");

            bool isAvatar = false;
            if (!string.IsNullOrEmpty(targetName))
            {
                root = FindByNameOrId(targetName);
                if (root == null)
                    return Fail($"GameObject not found: {targetName}");
                if (avatarDescType != null && root.GetComponent(avatarDescType) != null)
                    isAvatar = true;
            }
            else
            {
                // Auto-detect
                if (avatarDescType != null)
                {
                    UnityEngine.Object avatarObj = UnityEngine.Object.FindObjectOfType(avatarDescType);
                    if (avatarObj != null)
                    {
                        root = (avatarObj as Component).gameObject;
                        isAvatar = true;
                    }
                }
                if (root == null && worldDescType != null)
                {
                    UnityEngine.Object worldObj = UnityEngine.Object.FindObjectOfType(worldDescType);
                    if (worldObj != null)
                        root = (worldObj as Component).gameObject;
                }
                if (root == null)
                    return Fail("No VRC descriptor found in scene.");
            }

            // Gather stats
            MeshFilter[] meshFilters = isAvatar
                ? root.GetComponentsInChildren<MeshFilter>(true)
                : UnityEngine.Object.FindObjectsOfType<MeshFilter>();
            SkinnedMeshRenderer[] skinnedMeshes = isAvatar
                ? root.GetComponentsInChildren<SkinnedMeshRenderer>(true)
                : UnityEngine.Object.FindObjectsOfType<SkinnedMeshRenderer>();

            int totalPolys = 0;
            foreach (var mf in meshFilters)
                if (mf.sharedMesh != null) totalPolys += mf.sharedMesh.triangles.Length / 3;
            foreach (var smr in skinnedMeshes)
                if (smr.sharedMesh != null) totalPolys += smr.sharedMesh.triangles.Length / 3;

            int meshCount = meshFilters.Length + skinnedMeshes.Length;
            int materialCount = 0;
            HashSet<Material> uniqueMats = new HashSet<Material>();
            foreach (var mf in meshFilters)
            {
                Renderer r = mf.GetComponent<Renderer>();
                if (r != null)
                    foreach (var mat in r.sharedMaterials)
                        if (mat != null) uniqueMats.Add(mat);
            }
            foreach (var smr in skinnedMeshes)
                foreach (var mat in smr.sharedMaterials)
                    if (mat != null) uniqueMats.Add(mat);
            materialCount = uniqueMats.Count;

            // PhysBone count
            int physBoneCount = 0;
            Type physBoneType = FindVrcType("VRC.SDK3.Dynamics.PhysBone.Components.VRCPhysBone");
            if (physBoneType != null)
            {
                Component[] pbs = isAvatar
                    ? root.GetComponentsInChildren(physBoneType, true)
                    : UnityEngine.Object.FindObjectsOfType(physBoneType) as Component[];
                physBoneCount = pbs != null ? pbs.Length : 0;
            }

            // Estimate rank for avatars
            string rank = "Excellent";
            if (isAvatar)
            {
                if (totalPolys > 70000 || materialCount > 32 || physBoneCount > 32) rank = "Poor";
                else if (totalPolys > 32000 || materialCount > 16 || physBoneCount > 16) rank = "Medium";
                else if (totalPolys > 10000 || materialCount > 8 || physBoneCount > 8) rank = "Good";
            }

            StringBuilder dataSb = new StringBuilder("{");
            dataSb.Append($"\"type\":\"{(isAvatar ? "avatar" : "world")}\",");
            dataSb.Append($"\"polygons\":{totalPolys},");
            dataSb.Append($"\"meshes\":{meshCount},");
            dataSb.Append($"\"materials\":{materialCount},");
            dataSb.Append($"\"physBones\":{physBoneCount},");
            dataSb.Append($"\"estimatedRank\":\"{rank}\"");
            dataSb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Performance estimate: {rank} ({totalPolys} polys, {materialCount} materials, {physBoneCount} PhysBones)",
                data = dataSb.ToString()
            };
        }

        // --- Utility Helpers ---

        private static object GetEnumValue(string enumTypeName, string valueName)
        {
            Type enumType = FindVrcType(enumTypeName);
            if (enumType == null) return null;
            try { return Enum.Parse(enumType, valueName, true); }
            catch { return null; }
        }

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

        private static string BoolStr(bool b) => b ? "true" : "false";
    }
}
