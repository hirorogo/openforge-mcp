using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class PhysicsTools
    {
        public static void Register()
        {
            ToolExecutor.Register("add_rigidbody", AddRigidbody);
            ToolExecutor.Register("add_collider", AddCollider);
            ToolExecutor.Register("set_physics_material", SetPhysicsMaterial);
            ToolExecutor.Register("add_joint", AddJoint);
            ToolExecutor.Register("set_gravity", SetGravity);
            ToolExecutor.Register("raycast", Raycast);
            ToolExecutor.Register("add_trigger", AddTrigger);
            ToolExecutor.Register("set_collision_layer", SetCollisionLayer);
            ToolExecutor.Register("get_physics_info", GetPhysicsInfo);
            ToolExecutor.Register("add_constant_force", AddConstantForce);
            ToolExecutor.Register("set_rigidbody_constraints", SetRigidbodyConstraints);
        }

        private static ToolResult AddRigidbody(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Rigidbody existing = go.GetComponent<Rigidbody>();
            if (existing != null)
                return Fail($"'{targetName}' already has a Rigidbody");

            Rigidbody rb = Undo.AddComponent<Rigidbody>(go);

            string mass = GetParam(p, "mass", "");
            if (!string.IsNullOrEmpty(mass))
                rb.mass = float.Parse(mass, System.Globalization.CultureInfo.InvariantCulture);

            string drag = GetParam(p, "drag", "");
            if (!string.IsNullOrEmpty(drag))
                rb.linearDamping = float.Parse(drag, System.Globalization.CultureInfo.InvariantCulture);

            string angularDrag = GetParam(p, "angular_drag", "");
            if (!string.IsNullOrEmpty(angularDrag))
                rb.angularDamping = float.Parse(angularDrag, System.Globalization.CultureInfo.InvariantCulture);

            string useGravity = GetParam(p, "use_gravity", "");
            if (!string.IsNullOrEmpty(useGravity))
                rb.useGravity = useGravity.ToLower() != "false";

            string isKinematic = GetParam(p, "is_kinematic", "");
            if (!string.IsNullOrEmpty(isKinematic))
                rb.isKinematic = isKinematic.ToLower() == "true";

            return new ToolResult
            {
                success = true,
                message = $"Added Rigidbody to '{go.name}' (mass={rb.mass})",
                data = $"{{\"target\":\"{EscapeJson(go.name)}\",\"mass\":{rb.mass},\"useGravity\":{(rb.useGravity ? "true" : "false")},\"isKinematic\":{(rb.isKinematic ? "true" : "false")}}}"
            };
        }

        private static ToolResult AddCollider(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string colliderType = GetParam(p, "type", "box");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Collider collider = null;

            switch (colliderType.ToLower())
            {
                case "box":
                    BoxCollider box = Undo.AddComponent<BoxCollider>(go);
                    string sizeStr = GetParam(p, "size", "");
                    if (!string.IsNullOrEmpty(sizeStr) && TryParseVector3(sizeStr, out Vector3 size))
                        box.size = size;
                    string centerStr = GetParam(p, "center", "");
                    if (!string.IsNullOrEmpty(centerStr) && TryParseVector3(centerStr, out Vector3 center))
                        box.center = center;
                    collider = box;
                    break;

                case "sphere":
                    SphereCollider sphere = Undo.AddComponent<SphereCollider>(go);
                    string radius = GetParam(p, "radius", "");
                    if (!string.IsNullOrEmpty(radius))
                        sphere.radius = float.Parse(radius, System.Globalization.CultureInfo.InvariantCulture);
                    collider = sphere;
                    break;

                case "capsule":
                    CapsuleCollider capsule = Undo.AddComponent<CapsuleCollider>(go);
                    string capRadius = GetParam(p, "radius", "");
                    if (!string.IsNullOrEmpty(capRadius))
                        capsule.radius = float.Parse(capRadius, System.Globalization.CultureInfo.InvariantCulture);
                    string height = GetParam(p, "height", "");
                    if (!string.IsNullOrEmpty(height))
                        capsule.height = float.Parse(height, System.Globalization.CultureInfo.InvariantCulture);
                    string direction = GetParam(p, "direction", "");
                    if (!string.IsNullOrEmpty(direction))
                        capsule.direction = int.Parse(direction);
                    collider = capsule;
                    break;

                case "mesh":
                    MeshCollider mesh = Undo.AddComponent<MeshCollider>(go);
                    string convex = GetParam(p, "convex", "false");
                    mesh.convex = convex.ToLower() == "true";
                    collider = mesh;
                    break;

                default:
                    return Fail($"Unknown collider type: {colliderType}. Valid: box, sphere, capsule, mesh");
            }

            string isTrigger = GetParam(p, "is_trigger", "");
            if (!string.IsNullOrEmpty(isTrigger))
                collider.isTrigger = isTrigger.ToLower() == "true";

            return new ToolResult
            {
                success = true,
                message = $"Added {colliderType} collider to '{go.name}'",
                data = $"{{\"target\":\"{EscapeJson(go.name)}\",\"type\":\"{colliderType}\"}}"
            };
        }

        private static ToolResult SetPhysicsMaterial(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Collider collider = go.GetComponent<Collider>();
            if (collider == null)
                return Fail($"No collider on '{targetName}'");

            string materialPath = GetParam(p, "path", "");
            PhysicsMaterial mat;

            if (!string.IsNullOrEmpty(materialPath))
            {
                mat = AssetDatabase.LoadAssetAtPath<PhysicsMaterial>(materialPath);
                if (mat == null)
                    return Fail($"Physics material not found at: {materialPath}");
            }
            else
            {
                string matName = GetParam(p, "name", "New Physics Material");
                string savePath = GetParam(p, "save_path", $"Assets/{matName}.physicMaterial");
                EnsureDirectoryExists(savePath);

                mat = new PhysicsMaterial(matName);

                string dynamicFriction = GetParam(p, "dynamic_friction", "");
                if (!string.IsNullOrEmpty(dynamicFriction))
                    mat.dynamicFriction = float.Parse(dynamicFriction, System.Globalization.CultureInfo.InvariantCulture);

                string staticFriction = GetParam(p, "static_friction", "");
                if (!string.IsNullOrEmpty(staticFriction))
                    mat.staticFriction = float.Parse(staticFriction, System.Globalization.CultureInfo.InvariantCulture);

                string bounciness = GetParam(p, "bounciness", "");
                if (!string.IsNullOrEmpty(bounciness))
                    mat.bounciness = float.Parse(bounciness, System.Globalization.CultureInfo.InvariantCulture);

                AssetDatabase.CreateAsset(mat, savePath);
                AssetDatabase.SaveAssets();
            }

            Undo.RecordObject(collider, "Set physics material");
            collider.sharedMaterial = mat;

            return new ToolResult
            {
                success = true,
                message = $"Set physics material '{mat.name}' on '{go.name}'"
            };
        }

        private static ToolResult AddJoint(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string jointType = GetParam(p, "type", "fixed");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Joint joint = null;

            switch (jointType.ToLower())
            {
                case "fixed":
                    joint = Undo.AddComponent<FixedJoint>(go);
                    break;

                case "hinge":
                    HingeJoint hinge = Undo.AddComponent<HingeJoint>(go);
                    string axisStr = GetParam(p, "axis", "");
                    if (!string.IsNullOrEmpty(axisStr) && TryParseVector3(axisStr, out Vector3 axis))
                        hinge.axis = axis;
                    string useLimits = GetParam(p, "use_limits", "");
                    if (useLimits == "true")
                    {
                        hinge.useLimits = true;
                        JointLimits limits = hinge.limits;
                        string minAngle = GetParam(p, "min_angle", "");
                        if (!string.IsNullOrEmpty(minAngle))
                            limits.min = float.Parse(minAngle, System.Globalization.CultureInfo.InvariantCulture);
                        string maxAngle = GetParam(p, "max_angle", "");
                        if (!string.IsNullOrEmpty(maxAngle))
                            limits.max = float.Parse(maxAngle, System.Globalization.CultureInfo.InvariantCulture);
                        hinge.limits = limits;
                    }
                    joint = hinge;
                    break;

                case "spring":
                    SpringJoint spring = Undo.AddComponent<SpringJoint>(go);
                    string springForce = GetParam(p, "spring_force", "");
                    if (!string.IsNullOrEmpty(springForce))
                        spring.spring = float.Parse(springForce, System.Globalization.CultureInfo.InvariantCulture);
                    string damper = GetParam(p, "damper", "");
                    if (!string.IsNullOrEmpty(damper))
                        spring.damper = float.Parse(damper, System.Globalization.CultureInfo.InvariantCulture);
                    joint = spring;
                    break;

                case "configurable":
                    ConfigurableJoint configurable = Undo.AddComponent<ConfigurableJoint>(go);
                    string xMotion = GetParam(p, "x_motion", "");
                    if (!string.IsNullOrEmpty(xMotion) && Enum.TryParse(xMotion, true, out ConfigurableJointMotion xm))
                        configurable.xMotion = xm;
                    string yMotion = GetParam(p, "y_motion", "");
                    if (!string.IsNullOrEmpty(yMotion) && Enum.TryParse(yMotion, true, out ConfigurableJointMotion ym))
                        configurable.yMotion = ym;
                    string zMotion = GetParam(p, "z_motion", "");
                    if (!string.IsNullOrEmpty(zMotion) && Enum.TryParse(zMotion, true, out ConfigurableJointMotion zm))
                        configurable.zMotion = zm;
                    joint = configurable;
                    break;

                default:
                    return Fail($"Unknown joint type: {jointType}. Valid: fixed, hinge, spring, configurable");
            }

            string connectedBody = GetParam(p, "connected_body", "");
            if (!string.IsNullOrEmpty(connectedBody))
            {
                GameObject connectedGo = FindByNameOrId(connectedBody);
                if (connectedGo != null)
                {
                    Rigidbody connectedRb = connectedGo.GetComponent<Rigidbody>();
                    if (connectedRb != null)
                        joint.connectedBody = connectedRb;
                }
            }

            string breakForce = GetParam(p, "break_force", "");
            if (!string.IsNullOrEmpty(breakForce))
                joint.breakForce = float.Parse(breakForce, System.Globalization.CultureInfo.InvariantCulture);

            string breakTorque = GetParam(p, "break_torque", "");
            if (!string.IsNullOrEmpty(breakTorque))
                joint.breakTorque = float.Parse(breakTorque, System.Globalization.CultureInfo.InvariantCulture);

            return new ToolResult
            {
                success = true,
                message = $"Added {jointType} joint to '{go.name}'",
                data = $"{{\"target\":\"{EscapeJson(go.name)}\",\"type\":\"{jointType}\"}}"
            };
        }

        private static ToolResult SetGravity(Dictionary<string, string> p)
        {
            string gravityStr = GetRequiredParam(p, "gravity");

            if (!TryParseVector3(gravityStr, out Vector3 gravity))
                return Fail($"Invalid gravity vector: {gravityStr}. Use format 'x,y,z' (e.g. '0,-9.81,0').");

            Physics.gravity = gravity;

            return new ToolResult
            {
                success = true,
                message = $"Set gravity to ({gravity.x}, {gravity.y}, {gravity.z})",
                data = $"{{\"gravity\":[{gravity.x},{gravity.y},{gravity.z}]}}"
            };
        }

        private static ToolResult Raycast(Dictionary<string, string> p)
        {
            string originStr = GetRequiredParam(p, "origin");
            string directionStr = GetRequiredParam(p, "direction");
            float maxDistance = float.Parse(GetParam(p, "max_distance", "1000"), System.Globalization.CultureInfo.InvariantCulture);

            if (!TryParseVector3(originStr, out Vector3 origin))
                return Fail($"Invalid origin: {originStr}");
            if (!TryParseVector3(directionStr, out Vector3 direction))
                return Fail($"Invalid direction: {directionStr}");

            string layerMaskStr = GetParam(p, "layer_mask", "");
            int layerMask = string.IsNullOrEmpty(layerMaskStr) ? Physics.DefaultRaycastLayers : int.Parse(layerMaskStr);

            bool allHits = GetParam(p, "all", "false") == "true";

            if (allHits)
            {
                RaycastHit[] hits = Physics.RaycastAll(origin, direction, maxDistance, layerMask);
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < hits.Length; i++)
                {
                    if (i > 0) sb.Append(",");
                    sb.Append(RaycastHitToJson(hits[i]));
                }
                sb.Append("]");

                return new ToolResult
                {
                    success = true,
                    message = $"Raycast hit {hits.Length} object(s)",
                    data = sb.ToString()
                };
            }
            else
            {
                if (Physics.Raycast(origin, direction, out RaycastHit hit, maxDistance, layerMask))
                {
                    return new ToolResult
                    {
                        success = true,
                        message = $"Raycast hit '{hit.collider.gameObject.name}'",
                        data = RaycastHitToJson(hit)
                    };
                }
                else
                {
                    return new ToolResult
                    {
                        success = true,
                        message = "Raycast did not hit anything",
                        data = "null"
                    };
                }
            }
        }

        private static ToolResult AddTrigger(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string colliderType = GetParam(p, "type", "box");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Collider collider = null;

            switch (colliderType.ToLower())
            {
                case "box":
                    BoxCollider box = Undo.AddComponent<BoxCollider>(go);
                    string sizeStr = GetParam(p, "size", "");
                    if (!string.IsNullOrEmpty(sizeStr) && TryParseVector3(sizeStr, out Vector3 size))
                        box.size = size;
                    collider = box;
                    break;
                case "sphere":
                    SphereCollider sphere = Undo.AddComponent<SphereCollider>(go);
                    string radius = GetParam(p, "radius", "");
                    if (!string.IsNullOrEmpty(radius))
                        sphere.radius = float.Parse(radius, System.Globalization.CultureInfo.InvariantCulture);
                    collider = sphere;
                    break;
                case "capsule":
                    CapsuleCollider capsule = Undo.AddComponent<CapsuleCollider>(go);
                    collider = capsule;
                    break;
                default:
                    return Fail($"Unknown collider type: {colliderType}. Valid: box, sphere, capsule");
            }

            collider.isTrigger = true;

            return new ToolResult
            {
                success = true,
                message = $"Added {colliderType} trigger to '{go.name}'",
                data = $"{{\"target\":\"{EscapeJson(go.name)}\",\"type\":\"{colliderType}\",\"isTrigger\":true}}"
            };
        }

        private static ToolResult SetCollisionLayer(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string layerStr = GetRequiredParam(p, "layer");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            int layer;
            if (int.TryParse(layerStr, out layer))
            {
                if (layer < 0 || layer > 31)
                    return Fail("Layer must be between 0 and 31");
            }
            else
            {
                layer = LayerMask.NameToLayer(layerStr);
                if (layer < 0)
                    return Fail($"Layer not found: {layerStr}");
            }

            bool includeChildren = GetParam(p, "include_children", "false") == "true";

            Undo.RecordObject(go, $"Set layer of {targetName}");
            go.layer = layer;

            if (includeChildren)
            {
                Transform[] children = go.GetComponentsInChildren<Transform>(true);
                foreach (Transform child in children)
                {
                    Undo.RecordObject(child.gameObject, $"Set layer of {child.name}");
                    child.gameObject.layer = layer;
                }
            }

            return new ToolResult
            {
                success = true,
                message = $"Set layer of '{go.name}' to {layer} ({LayerMask.LayerToName(layer)})"
            };
        }

        private static ToolResult GetPhysicsInfo(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            StringBuilder sb = new StringBuilder();
            sb.Append("{");
            sb.Append($"\"gameObject\":\"{EscapeJson(go.name)}\",");
            sb.Append($"\"layer\":{go.layer},");
            sb.Append($"\"layerName\":\"{EscapeJson(LayerMask.LayerToName(go.layer))}\",");

            Rigidbody rb = go.GetComponent<Rigidbody>();
            if (rb != null)
            {
                sb.Append("\"rigidbody\":{");
                sb.Append($"\"mass\":{rb.mass},");
                sb.Append($"\"drag\":{rb.linearDamping},");
                sb.Append($"\"angularDrag\":{rb.angularDamping},");
                sb.Append($"\"useGravity\":{(rb.useGravity ? "true" : "false")},");
                sb.Append($"\"isKinematic\":{(rb.isKinematic ? "true" : "false")},");
                sb.Append($"\"constraints\":\"{rb.constraints}\"");
                sb.Append("},");
            }
            else
            {
                sb.Append("\"rigidbody\":null,");
            }

            Collider[] colliders = go.GetComponents<Collider>();
            sb.Append("\"colliders\":[");
            for (int i = 0; i < colliders.Length; i++)
            {
                if (i > 0) sb.Append(",");
                Collider col = colliders[i];
                sb.Append($"{{\"type\":\"{EscapeJson(col.GetType().Name)}\",\"isTrigger\":{(col.isTrigger ? "true" : "false")}}}");
            }
            sb.Append("],");

            Joint[] joints = go.GetComponents<Joint>();
            sb.Append("\"joints\":[");
            for (int i = 0; i < joints.Length; i++)
            {
                if (i > 0) sb.Append(",");
                Joint j = joints[i];
                string connectedName = j.connectedBody != null ? j.connectedBody.gameObject.name : "none";
                sb.Append($"{{\"type\":\"{EscapeJson(j.GetType().Name)}\",\"connectedBody\":\"{EscapeJson(connectedName)}\"}}");
            }
            sb.Append("]");

            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Physics info for '{go.name}'",
                data = sb.ToString()
            };
        }

        private static ToolResult AddConstantForce(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            if (go.GetComponent<Rigidbody>() == null)
                Undo.AddComponent<Rigidbody>(go);

            ConstantForce cf = go.GetComponent<ConstantForce>();
            if (cf == null)
                cf = Undo.AddComponent<ConstantForce>(go);

            Undo.RecordObject(cf, "Set constant force");

            string forceStr = GetParam(p, "force", "");
            if (!string.IsNullOrEmpty(forceStr) && TryParseVector3(forceStr, out Vector3 force))
                cf.force = force;

            string relForceStr = GetParam(p, "relative_force", "");
            if (!string.IsNullOrEmpty(relForceStr) && TryParseVector3(relForceStr, out Vector3 relForce))
                cf.relativeForce = relForce;

            string torqueStr = GetParam(p, "torque", "");
            if (!string.IsNullOrEmpty(torqueStr) && TryParseVector3(torqueStr, out Vector3 torque))
                cf.torque = torque;

            string relTorqueStr = GetParam(p, "relative_torque", "");
            if (!string.IsNullOrEmpty(relTorqueStr) && TryParseVector3(relTorqueStr, out Vector3 relTorque))
                cf.relativeTorque = relTorque;

            return new ToolResult
            {
                success = true,
                message = $"Set constant force on '{go.name}'"
            };
        }

        private static ToolResult SetRigidbodyConstraints(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string constraintsStr = GetRequiredParam(p, "constraints");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Rigidbody rb = go.GetComponent<Rigidbody>();
            if (rb == null)
                return Fail($"No Rigidbody on '{targetName}'");

            RigidbodyConstraints constraints = RigidbodyConstraints.None;

            string[] parts = constraintsStr.Split(',');
            foreach (string part in parts)
            {
                string trimmed = part.Trim();
                if (string.IsNullOrEmpty(trimmed)) continue;

                switch (trimmed.ToLower())
                {
                    case "none": constraints = RigidbodyConstraints.None; break;
                    case "freeze_position_x": constraints |= RigidbodyConstraints.FreezePositionX; break;
                    case "freeze_position_y": constraints |= RigidbodyConstraints.FreezePositionY; break;
                    case "freeze_position_z": constraints |= RigidbodyConstraints.FreezePositionZ; break;
                    case "freeze_rotation_x": constraints |= RigidbodyConstraints.FreezeRotationX; break;
                    case "freeze_rotation_y": constraints |= RigidbodyConstraints.FreezeRotationY; break;
                    case "freeze_rotation_z": constraints |= RigidbodyConstraints.FreezeRotationZ; break;
                    case "freeze_position": constraints |= RigidbodyConstraints.FreezePosition; break;
                    case "freeze_rotation": constraints |= RigidbodyConstraints.FreezeRotation; break;
                    case "freeze_all": constraints |= RigidbodyConstraints.FreezeAll; break;
                    default: return Fail($"Unknown constraint: {trimmed}");
                }
            }

            Undo.RecordObject(rb, "Set rigidbody constraints");
            rb.constraints = constraints;

            return new ToolResult
            {
                success = true,
                message = $"Set rigidbody constraints on '{go.name}' to {constraints}"
            };
        }

        // --- Helpers ---

        private static string RaycastHitToJson(RaycastHit hit)
        {
            return $"{{\"gameObject\":\"{EscapeJson(hit.collider.gameObject.name)}\","
                + $"\"point\":[{hit.point.x},{hit.point.y},{hit.point.z}],"
                + $"\"normal\":[{hit.normal.x},{hit.normal.y},{hit.normal.z}],"
                + $"\"distance\":{hit.distance}}}";
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
