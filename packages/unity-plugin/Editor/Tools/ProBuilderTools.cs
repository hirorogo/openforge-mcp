using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    /// <summary>
    /// ProBuilder mesh editing tools using reflection (ProBuilder is an optional package).
    /// </summary>
    public static class ProBuilderTools
    {
        private static Type _proBuilderMeshType;
        private static Type _shapeGeneratorType;
        private static Type _meshOperationsType;
        private static Type _booleanOpType;
        private static Type _faceType;
        private static bool _proBuilderChecked;
        private static bool _proBuilderAvailable;

        public static void Register()
        {
            ToolExecutor.Register("create_probuilder_shape", CreateProBuilderShape);
            ToolExecutor.Register("extrude_probuilder_faces", ExtrudeProBuilderFaces);
            ToolExecutor.Register("probuilder_boolean", ProBuilderBoolean);
            ToolExecutor.Register("set_probuilder_material", SetProBuilderMaterial);
            ToolExecutor.Register("merge_probuilder", MergeProBuilder);
            ToolExecutor.Register("subdivide_probuilder", SubdivideProBuilder);
            ToolExecutor.Register("probuilder_to_mesh", ProBuilderToMesh);
            ToolExecutor.Register("get_probuilder_info", GetProBuilderInfo);
        }

        private static bool EnsureProBuilder()
        {
            if (_proBuilderChecked) return _proBuilderAvailable;
            _proBuilderChecked = true;

            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                if (asm.GetName().Name == "Unity.ProBuilder")
                {
                    _proBuilderMeshType = asm.GetType("UnityEngine.ProBuilder.ProBuilderMesh");
                    _faceType = asm.GetType("UnityEngine.ProBuilder.Face");
                    break;
                }
                if (asm.GetName().Name == "Unity.ProBuilder.Editor")
                {
                    // Not needed currently but could be useful
                }
            }

            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                var sg = asm.GetType("UnityEngine.ProBuilder.ShapeGenerator");
                if (sg != null) _shapeGeneratorType = sg;

                var mo = asm.GetType("UnityEngine.ProBuilder.MeshOperations.ExtrudeElements");
                if (mo != null) _meshOperationsType = mo;

                var bo = asm.GetType("UnityEngine.ProBuilder.CSG.CSG");
                if (bo != null) _booleanOpType = bo;
            }

            _proBuilderAvailable = _proBuilderMeshType != null;
            return _proBuilderAvailable;
        }

        private static ToolResult CreateProBuilderShape(Dictionary<string, string> p)
        {
            if (!EnsureProBuilder())
                return Fail("ProBuilder package is not installed. Install com.unity.probuilder first.");

            string shape = GetParam(p, "shape", "cube").ToLower();
            string name = GetParam(p, "name", $"ProBuilder_{shape}");

            // Use ShapeGenerator via reflection
            MethodInfo method = null;
            object[] args = null;

            if (_shapeGeneratorType == null)
                return Fail("ProBuilder ShapeGenerator not found. Ensure com.unity.probuilder is installed.");

            switch (shape)
            {
                case "cube":
                    method = _shapeGeneratorType.GetMethod("GenerateCube", BindingFlags.Static | BindingFlags.Public);
                    if (method != null)
                    {
                        float sizeX = float.Parse(GetParam(p, "size_x", "1"), System.Globalization.CultureInfo.InvariantCulture);
                        float sizeY = float.Parse(GetParam(p, "size_y", "1"), System.Globalization.CultureInfo.InvariantCulture);
                        float sizeZ = float.Parse(GetParam(p, "size_z", "1"), System.Globalization.CultureInfo.InvariantCulture);
                        // GenerateCube(PivotLocation, Vector3)
                        Type pivotType = _shapeGeneratorType.Assembly.GetType("UnityEngine.ProBuilder.PivotLocation");
                        object pivotCenter = pivotType != null ? Enum.ToObject(pivotType, 0) : null;
                        args = new object[] { pivotCenter, new Vector3(sizeX, sizeY, sizeZ) };
                    }
                    break;
                case "cylinder":
                    method = _shapeGeneratorType.GetMethod("GenerateCylinder", BindingFlags.Static | BindingFlags.Public);
                    if (method != null)
                    {
                        Type pivotType = _shapeGeneratorType.Assembly.GetType("UnityEngine.ProBuilder.PivotLocation");
                        object pivotCenter = pivotType != null ? Enum.ToObject(pivotType, 0) : null;
                        int sides = int.Parse(GetParam(p, "sides", "12"));
                        float radius = float.Parse(GetParam(p, "radius", "0.5"), System.Globalization.CultureInfo.InvariantCulture);
                        float height = float.Parse(GetParam(p, "height", "1"), System.Globalization.CultureInfo.InvariantCulture);
                        int heightCuts = int.Parse(GetParam(p, "height_cuts", "0"));
                        args = new object[] { pivotCenter, sides, radius, height, heightCuts, -1 };
                    }
                    break;
                case "sphere":
                    method = _shapeGeneratorType.GetMethod("GenerateIcosahedron", BindingFlags.Static | BindingFlags.Public);
                    if (method != null)
                    {
                        Type pivotType = _shapeGeneratorType.Assembly.GetType("UnityEngine.ProBuilder.PivotLocation");
                        object pivotCenter = pivotType != null ? Enum.ToObject(pivotType, 0) : null;
                        float radius = float.Parse(GetParam(p, "radius", "0.5"), System.Globalization.CultureInfo.InvariantCulture);
                        int subdivisions = int.Parse(GetParam(p, "subdivisions", "2"));
                        args = new object[] { pivotCenter, radius, subdivisions };
                    }
                    break;
                case "plane":
                    method = _shapeGeneratorType.GetMethod("GeneratePlane", BindingFlags.Static | BindingFlags.Public);
                    if (method != null)
                    {
                        Type pivotType = _shapeGeneratorType.Assembly.GetType("UnityEngine.ProBuilder.PivotLocation");
                        object pivotCenter = pivotType != null ? Enum.ToObject(pivotType, 0) : null;
                        float width = float.Parse(GetParam(p, "width", "1"), System.Globalization.CultureInfo.InvariantCulture);
                        float heightV = float.Parse(GetParam(p, "height", "1"), System.Globalization.CultureInfo.InvariantCulture);
                        int widthCuts = int.Parse(GetParam(p, "width_cuts", "0"));
                        int heightCuts = int.Parse(GetParam(p, "height_cuts", "0"));
                        args = new object[] { pivotCenter, width, heightV, widthCuts, heightCuts, Quaternion.identity };
                    }
                    break;
                case "stairs":
                    method = _shapeGeneratorType.GetMethod("GenerateStair", BindingFlags.Static | BindingFlags.Public);
                    if (method != null)
                    {
                        Type pivotType = _shapeGeneratorType.Assembly.GetType("UnityEngine.ProBuilder.PivotLocation");
                        object pivotCenter = pivotType != null ? Enum.ToObject(pivotType, 0) : null;
                        float width = float.Parse(GetParam(p, "width", "2"), System.Globalization.CultureInfo.InvariantCulture);
                        float heightV = float.Parse(GetParam(p, "height", "2.5"), System.Globalization.CultureInfo.InvariantCulture);
                        float depth = float.Parse(GetParam(p, "depth", "4"), System.Globalization.CultureInfo.InvariantCulture);
                        int steps = int.Parse(GetParam(p, "steps", "10"));
                        args = new object[] { pivotCenter, new Vector3(width, heightV, depth), steps, true };
                    }
                    break;
                case "arch":
                    method = _shapeGeneratorType.GetMethod("GenerateArch", BindingFlags.Static | BindingFlags.Public);
                    if (method != null)
                    {
                        Type pivotType = _shapeGeneratorType.Assembly.GetType("UnityEngine.ProBuilder.PivotLocation");
                        object pivotCenter = pivotType != null ? Enum.ToObject(pivotType, 0) : null;
                        float angle = float.Parse(GetParam(p, "angle", "180"), System.Globalization.CultureInfo.InvariantCulture);
                        float radius = float.Parse(GetParam(p, "radius", "1"), System.Globalization.CultureInfo.InvariantCulture);
                        float width = float.Parse(GetParam(p, "width", "0.5"), System.Globalization.CultureInfo.InvariantCulture);
                        float depth = float.Parse(GetParam(p, "depth", "1"), System.Globalization.CultureInfo.InvariantCulture);
                        int segments = int.Parse(GetParam(p, "segments", "6"));
                        args = new object[] { pivotCenter, angle, radius, width, depth, segments, true, true, true, true, true };
                    }
                    break;
                default:
                    return Fail($"Unknown shape: {shape}. Valid shapes: cube, cylinder, sphere, plane, stairs, arch");
            }

            if (method == null)
                return Fail($"Could not find ProBuilder generator method for shape: {shape}");

            object pbMesh;
            try
            {
                pbMesh = method.Invoke(null, args);
            }
            catch (Exception ex)
            {
                return Fail($"Failed to create ProBuilder shape: {ex.InnerException?.Message ?? ex.Message}");
            }

            if (pbMesh == null)
                return Fail("ProBuilder returned null mesh");

            // Get the GameObject from the ProBuilderMesh component
            PropertyInfo goProperty = _proBuilderMeshType.GetProperty("gameObject");
            GameObject go = (GameObject)goProperty.GetValue(pbMesh);
            go.name = name;

            Undo.RegisterCreatedObjectUndo(go, $"Create ProBuilder {shape}");

            // Apply optional position
            if (TryParseVector3(p, "position", out Vector3 pos))
                go.transform.position = pos;

            return new ToolResult
            {
                success = true,
                message = $"Created ProBuilder {shape} '{name}'",
                data = $"{{\"name\":\"{EscapeJson(go.name)}\",\"instanceId\":{go.GetInstanceID()},\"shape\":\"{EscapeJson(shape)}\"}}"
            };
        }

        private static ToolResult ExtrudeProBuilderFaces(Dictionary<string, string> p)
        {
            if (!EnsureProBuilder())
                return Fail("ProBuilder package is not installed.");

            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            Component pbComp = go.GetComponent(_proBuilderMeshType);
            if (pbComp == null) return Fail($"'{targetName}' does not have a ProBuilderMesh component");

            float distance = float.Parse(GetParam(p, "distance", "0.5"), System.Globalization.CultureInfo.InvariantCulture);
            string faceIndices = GetParam(p, "face_indices", "");

            Undo.RecordObject(pbComp, "Extrude ProBuilder Faces");

            // Get faces
            PropertyInfo facesProperty = _proBuilderMeshType.GetProperty("faces");
            var allFaces = facesProperty.GetValue(pbComp) as System.Collections.IList;

            if (allFaces == null || allFaces.Count == 0)
                return Fail("No faces found on ProBuilder mesh");

            // Select faces to extrude
            var facesToExtrude = new List<object>();
            if (!string.IsNullOrEmpty(faceIndices))
            {
                string[] indices = faceIndices.Split(',');
                foreach (string idx in indices)
                {
                    if (int.TryParse(idx.Trim(), out int fi) && fi >= 0 && fi < allFaces.Count)
                        facesToExtrude.Add(allFaces[fi]);
                }
            }
            else
            {
                // Extrude all faces
                foreach (var face in allFaces)
                    facesToExtrude.Add(face);
            }

            // Use reflection to call ExtrudeElements.Extrude
            try
            {
                // Find the Extrude extension method
                Type extrudeType = null;
                foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
                {
                    extrudeType = asm.GetType("UnityEngine.ProBuilder.MeshOperations.ExtrudeElements");
                    if (extrudeType != null) break;
                }

                if (extrudeType == null)
                    return Fail("ExtrudeElements type not found in ProBuilder");

                // Look for the Extrude method
                MethodInfo extrudeMethod = null;
                foreach (var m in extrudeType.GetMethods(BindingFlags.Static | BindingFlags.Public))
                {
                    if (m.Name == "Extrude")
                    {
                        extrudeMethod = m;
                        break;
                    }
                }

                if (extrudeMethod == null)
                    return Fail("Extrude method not found");

                // Create typed list for faces
                Type faceListType = typeof(List<>).MakeGenericType(_faceType);
                var typedFaces = Activator.CreateInstance(faceListType) as System.Collections.IList;
                foreach (var f in facesToExtrude)
                    typedFaces.Add(f);

                extrudeMethod.Invoke(null, new object[] { pbComp, typedFaces, 0, distance });

                // Refresh mesh
                MethodInfo toMeshMethod = _proBuilderMeshType.GetMethod("ToMesh");
                toMeshMethod?.Invoke(pbComp, null);
                MethodInfo refreshMethod = _proBuilderMeshType.GetMethod("Refresh");
                refreshMethod?.Invoke(pbComp, null);
            }
            catch (Exception ex)
            {
                return Fail($"Extrude failed: {ex.InnerException?.Message ?? ex.Message}");
            }

            return new ToolResult
            {
                success = true,
                message = $"Extruded {facesToExtrude.Count} face(s) on '{targetName}' by {distance}"
            };
        }

        private static ToolResult ProBuilderBoolean(Dictionary<string, string> p)
        {
            if (!EnsureProBuilder())
                return Fail("ProBuilder package is not installed.");

            string targetA = GetRequiredParam(p, "target_a");
            string targetB = GetRequiredParam(p, "target_b");
            string operation = GetParam(p, "operation", "union").ToLower();

            GameObject goA = FindByNameOrId(targetA);
            if (goA == null) return Fail($"GameObject not found: {targetA}");
            GameObject goB = FindByNameOrId(targetB);
            if (goB == null) return Fail($"GameObject not found: {targetB}");

            Component pbA = goA.GetComponent(_proBuilderMeshType);
            if (pbA == null) return Fail($"'{targetA}' does not have ProBuilderMesh");
            Component pbB = goB.GetComponent(_proBuilderMeshType);
            if (pbB == null) return Fail($"'{targetB}' does not have ProBuilderMesh");

            try
            {
                // Find CSG Boolean class
                Type csgType = null;
                foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
                {
                    csgType = asm.GetType("UnityEngine.ProBuilder.CSG.CSG");
                    if (csgType != null) break;
                }

                if (csgType == null)
                    return Fail("ProBuilder CSG module not found. Ensure ProBuilder is installed.");

                // Map operation name
                string methodName;
                switch (operation)
                {
                    case "union": methodName = "Union"; break;
                    case "subtract": case "difference": methodName = "Subtract"; break;
                    case "intersect": case "intersection": methodName = "Intersect"; break;
                    default: return Fail($"Unknown boolean operation: {operation}. Valid: union, subtract, intersect");
                }

                MethodInfo boolMethod = csgType.GetMethod(methodName, BindingFlags.Static | BindingFlags.Public);
                if (boolMethod == null)
                    return Fail($"Boolean method '{methodName}' not found on CSG type");

                object result = boolMethod.Invoke(null, new object[] { goA, goB });

                if (result == null)
                    return Fail("Boolean operation returned null");

                // The result is a new GameObject
                PropertyInfo goProperty = result.GetType().GetProperty("gameObject");
                GameObject resultGo = null;
                if (goProperty != null)
                    resultGo = (GameObject)goProperty.GetValue(result);
                else if (result is GameObject rgo)
                    resultGo = rgo;

                if (resultGo != null)
                {
                    resultGo.name = GetParam(p, "name", $"Boolean_{operation}");
                    Undo.RegisterCreatedObjectUndo(resultGo, $"ProBuilder Boolean {operation}");
                }

                return new ToolResult
                {
                    success = true,
                    message = $"Boolean {operation} of '{targetA}' and '{targetB}' completed",
                    data = resultGo != null ? $"{{\"name\":\"{EscapeJson(resultGo.name)}\",\"instanceId\":{resultGo.GetInstanceID()}}}" : "{}"
                };
            }
            catch (Exception ex)
            {
                return Fail($"Boolean operation failed: {ex.InnerException?.Message ?? ex.Message}");
            }
        }

        private static ToolResult SetProBuilderMaterial(Dictionary<string, string> p)
        {
            if (!EnsureProBuilder())
                return Fail("ProBuilder package is not installed.");

            string targetName = GetRequiredParam(p, "target");
            string materialPath = GetRequiredParam(p, "material");

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            Component pbComp = go.GetComponent(_proBuilderMeshType);
            if (pbComp == null) return Fail($"'{targetName}' does not have ProBuilderMesh");

            Material mat = AssetDatabase.LoadAssetAtPath<Material>(materialPath);
            if (mat == null)
            {
                // Try finding by name
                string[] guids = AssetDatabase.FindAssets($"t:Material {materialPath}");
                if (guids.Length > 0)
                    mat = AssetDatabase.LoadAssetAtPath<Material>(AssetDatabase.GUIDToAssetPath(guids[0]));
            }
            if (mat == null)
                return Fail($"Material not found: {materialPath}");

            string faceIndices = GetParam(p, "face_indices", "");

            Undo.RecordObject(pbComp, "Set ProBuilder Material");

            PropertyInfo facesProperty = _proBuilderMeshType.GetProperty("faces");
            var allFaces = facesProperty.GetValue(pbComp) as System.Collections.IList;

            if (allFaces == null || allFaces.Count == 0)
                return Fail("No faces found on ProBuilder mesh");

            int count = 0;
            if (!string.IsNullOrEmpty(faceIndices))
            {
                string[] indices = faceIndices.Split(',');
                foreach (string idx in indices)
                {
                    if (int.TryParse(idx.Trim(), out int fi) && fi >= 0 && fi < allFaces.Count)
                    {
                        var face = allFaces[fi];
                        // Set submeshIndex on face
                        PropertyInfo subMeshProp = _faceType.GetProperty("submeshIndex");
                        if (subMeshProp != null) subMeshProp.SetValue(face, 0);
                        count++;
                    }
                }
            }
            else
            {
                count = allFaces.Count;
            }

            // Set material on renderer
            Renderer renderer = go.GetComponent<Renderer>();
            if (renderer != null)
            {
                Undo.RecordObject(renderer, "Set ProBuilder Material on Renderer");
                renderer.sharedMaterial = mat;
            }

            // Refresh
            MethodInfo toMeshMethod = _proBuilderMeshType.GetMethod("ToMesh");
            toMeshMethod?.Invoke(pbComp, null);
            MethodInfo refreshMethod = _proBuilderMeshType.GetMethod("Refresh");
            refreshMethod?.Invoke(pbComp, null);

            return new ToolResult
            {
                success = true,
                message = $"Set material '{mat.name}' on {count} face(s) of '{targetName}'"
            };
        }

        private static ToolResult MergeProBuilder(Dictionary<string, string> p)
        {
            if (!EnsureProBuilder())
                return Fail("ProBuilder package is not installed.");

            string targetsStr = GetRequiredParam(p, "targets");
            string[] targetNames = targetsStr.Split(',');

            List<Component> pbMeshes = new List<Component>();
            foreach (string tn in targetNames)
            {
                string trimmed = tn.Trim();
                GameObject go = FindByNameOrId(trimmed);
                if (go == null) return Fail($"GameObject not found: {trimmed}");
                Component pb = go.GetComponent(_proBuilderMeshType);
                if (pb == null) return Fail($"'{trimmed}' does not have ProBuilderMesh");
                pbMeshes.Add(pb);
            }

            try
            {
                // Find CombineMeshes type
                Type combineType = null;
                foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
                {
                    combineType = asm.GetType("UnityEngine.ProBuilder.MeshOperations.CombineMeshes");
                    if (combineType != null) break;
                }

                if (combineType == null)
                    return Fail("CombineMeshes type not found in ProBuilder");

                MethodInfo combineMethod = combineType.GetMethod("Combine", BindingFlags.Static | BindingFlags.Public);
                if (combineMethod == null)
                    return Fail("Combine method not found");

                // Create typed list
                Type listType = typeof(List<>).MakeGenericType(_proBuilderMeshType);
                var typedList = Activator.CreateInstance(listType) as System.Collections.IList;
                foreach (var pb in pbMeshes) typedList.Add(pb);

                var resultList = combineMethod.Invoke(null, new object[] { typedList, pbMeshes[0] });

                string resultName = GetParam(p, "name", "Merged_ProBuilder");
                GameObject resultGo = ((Component)pbMeshes[0]).gameObject;
                resultGo.name = resultName;

                Undo.RegisterCompleteObjectUndo(resultGo, "Merge ProBuilder Objects");

                return new ToolResult
                {
                    success = true,
                    message = $"Merged {pbMeshes.Count} ProBuilder objects into '{resultName}'"
                };
            }
            catch (Exception ex)
            {
                return Fail($"Merge failed: {ex.InnerException?.Message ?? ex.Message}");
            }
        }

        private static ToolResult SubdivideProBuilder(Dictionary<string, string> p)
        {
            if (!EnsureProBuilder())
                return Fail("ProBuilder package is not installed.");

            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            Component pbComp = go.GetComponent(_proBuilderMeshType);
            if (pbComp == null) return Fail($"'{targetName}' does not have ProBuilderMesh");

            Undo.RecordObject(pbComp, "Subdivide ProBuilder");

            try
            {
                Type subdivideType = null;
                foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
                {
                    subdivideType = asm.GetType("UnityEngine.ProBuilder.MeshOperations.Subdivision");
                    if (subdivideType != null) break;
                }

                // Try ConnectElements as an alternative
                if (subdivideType == null)
                {
                    foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
                    {
                        subdivideType = asm.GetType("UnityEngine.ProBuilder.MeshOperations.ConnectElements");
                        if (subdivideType != null) break;
                    }
                }

                if (subdivideType == null)
                    return Fail("Subdivision operations not found in ProBuilder");

                // Look for Subdivide method
                MethodInfo subdivideMethod = null;
                foreach (var m in subdivideType.GetMethods(BindingFlags.Static | BindingFlags.Public))
                {
                    if (m.Name == "Subdivide" || m.Name == "Connect")
                    {
                        subdivideMethod = m;
                        break;
                    }
                }

                if (subdivideMethod == null)
                    return Fail("Subdivide method not found");

                // Get faces to subdivide
                string faceIndices = GetParam(p, "face_indices", "");
                PropertyInfo facesProperty = _proBuilderMeshType.GetProperty("faces");
                var allFaces = facesProperty.GetValue(pbComp) as System.Collections.IList;

                Type faceListType = typeof(List<>).MakeGenericType(_faceType);
                var typedFaces = Activator.CreateInstance(faceListType) as System.Collections.IList;

                if (!string.IsNullOrEmpty(faceIndices))
                {
                    string[] indices = faceIndices.Split(',');
                    foreach (string idx in indices)
                    {
                        if (int.TryParse(idx.Trim(), out int fi) && fi >= 0 && fi < allFaces.Count)
                            typedFaces.Add(allFaces[fi]);
                    }
                }
                else
                {
                    foreach (var face in allFaces)
                        typedFaces.Add(face);
                }

                subdivideMethod.Invoke(null, new object[] { pbComp, typedFaces });

                // Refresh mesh
                MethodInfo toMeshMethod = _proBuilderMeshType.GetMethod("ToMesh");
                toMeshMethod?.Invoke(pbComp, null);
                MethodInfo refreshMethod = _proBuilderMeshType.GetMethod("Refresh");
                refreshMethod?.Invoke(pbComp, null);

                return new ToolResult
                {
                    success = true,
                    message = $"Subdivided {typedFaces.Count} face(s) on '{targetName}'"
                };
            }
            catch (Exception ex)
            {
                return Fail($"Subdivide failed: {ex.InnerException?.Message ?? ex.Message}");
            }
        }

        private static ToolResult ProBuilderToMesh(Dictionary<string, string> p)
        {
            if (!EnsureProBuilder())
                return Fail("ProBuilder package is not installed.");

            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            Component pbComp = go.GetComponent(_proBuilderMeshType);
            if (pbComp == null) return Fail($"'{targetName}' does not have ProBuilderMesh");

            Undo.RecordObject(go, "Convert ProBuilder to Mesh");

            try
            {
                // Ensure the mesh filter has the final mesh
                MethodInfo toMeshMethod = _proBuilderMeshType.GetMethod("ToMesh");
                toMeshMethod?.Invoke(pbComp, null);
                MethodInfo refreshMethod = _proBuilderMeshType.GetMethod("Refresh");
                refreshMethod?.Invoke(pbComp, null);

                // Copy mesh to a new asset if requested
                string savePath = GetParam(p, "save_path", "");
                MeshFilter mf = go.GetComponent<MeshFilter>();
                if (mf != null && mf.sharedMesh != null && !string.IsNullOrEmpty(savePath))
                {
                    Mesh meshCopy = UnityEngine.Object.Instantiate(mf.sharedMesh);
                    AssetDatabase.CreateAsset(meshCopy, savePath);
                    mf.sharedMesh = meshCopy;
                }

                // Remove ProBuilderMesh component
                Undo.DestroyObjectImmediate(pbComp);

                return new ToolResult
                {
                    success = true,
                    message = $"Converted '{targetName}' from ProBuilder to standard mesh"
                };
            }
            catch (Exception ex)
            {
                return Fail($"Conversion failed: {ex.InnerException?.Message ?? ex.Message}");
            }
        }

        private static ToolResult GetProBuilderInfo(Dictionary<string, string> p)
        {
            if (!EnsureProBuilder())
                return Fail("ProBuilder package is not installed.");

            string targetName = GetRequiredParam(p, "target");
            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            Component pbComp = go.GetComponent(_proBuilderMeshType);
            if (pbComp == null) return Fail($"'{targetName}' does not have ProBuilderMesh");

            try
            {
                PropertyInfo facesProperty = _proBuilderMeshType.GetProperty("faces");
                var faces = facesProperty.GetValue(pbComp) as System.Collections.IList;
                int faceCount = faces != null ? faces.Count : 0;

                PropertyInfo vertexCountProp = _proBuilderMeshType.GetProperty("vertexCount");
                int vertexCount = vertexCountProp != null ? (int)vertexCountProp.GetValue(pbComp) : 0;

                PropertyInfo edgesProperty = _proBuilderMeshType.GetProperty("faces");
                int edgeCount = 0;
                if (faces != null)
                {
                    foreach (var face in faces)
                    {
                        PropertyInfo edgesProp = _faceType.GetProperty("edges");
                        if (edgesProp != null)
                        {
                            var edges = edgesProp.GetValue(face) as System.Collections.ICollection;
                            if (edges != null) edgeCount += edges.Count;
                        }
                    }
                }

                StringBuilder sb = new StringBuilder("{");
                sb.Append($"\"name\":\"{EscapeJson(go.name)}\",");
                sb.Append($"\"instanceId\":{go.GetInstanceID()},");
                sb.Append($"\"vertexCount\":{vertexCount},");
                sb.Append($"\"faceCount\":{faceCount},");
                sb.Append($"\"edgeCount\":{edgeCount}");
                sb.Append("}");

                return new ToolResult
                {
                    success = true,
                    message = $"ProBuilder mesh '{targetName}': {vertexCount} vertices, {faceCount} faces, {edgeCount} edges",
                    data = sb.ToString()
                };
            }
            catch (Exception ex)
            {
                return Fail($"Failed to get info: {ex.InnerException?.Message ?? ex.Message}");
            }
        }

        // --- Helpers ---

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
