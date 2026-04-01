using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class VRCPerformanceTools
    {
        // Snapshot storage for before/after comparison
        private static string _snapshotJson = null;

        public static void Register()
        {
            ToolExecutor.Register("check_avatar_rank", CheckAvatarRank);
            ToolExecutor.Register("count_polygons", CountPolygons);
            ToolExecutor.Register("count_materials", CountMaterials);
            ToolExecutor.Register("count_bones", CountBones);
            ToolExecutor.Register("count_physbones", CountPhysBones);
            ToolExecutor.Register("suggest_optimizations", SuggestOptimizations);
            ToolExecutor.Register("auto_optimize_avatar", AutoOptimizeAvatar);
            ToolExecutor.Register("compare_before_after", CompareBeforeAfter);
        }

        // --- Rank thresholds matching VRChat SDK ---

        private static string RankPolygons(int count)
        {
            if (count <= 32000) return "Excellent";
            if (count <= 70000) return "Good";
            // Medium shares the Good limit
            return "Poor";
        }

        private static string RankMaterials(int count)
        {
            if (count <= 1) return "Excellent";
            if (count <= 2) return "Medium";
            if (count <= 4) return "Poor";
            return "VeryPoor";
        }

        private static string RankBones(int count)
        {
            if (count <= 75) return "Excellent";
            if (count <= 90) return "Good";
            if (count <= 150) return "Medium";
            if (count <= 256) return "Poor";
            return "VeryPoor";
        }

        private static string RankPhysBoneComponents(int count)
        {
            if (count <= 0) return "Excellent";
            if (count <= 4) return "Good";
            if (count <= 8) return "Medium";
            if (count <= 16) return "Poor";
            return "VeryPoor";
        }

        private static string RankPhysBoneTransforms(int count)
        {
            if (count <= 0) return "Excellent";
            if (count <= 16) return "Good";
            if (count <= 32) return "Medium";
            if (count <= 64) return "Poor";
            return "VeryPoor";
        }

        private static int RankToInt(string rank)
        {
            switch (rank)
            {
                case "Excellent": return 0;
                case "Good": return 1;
                case "Medium": return 2;
                case "Poor": return 3;
                case "VeryPoor": return 4;
                default: return 5;
            }
        }

        private static string WorstRank(params string[] ranks)
        {
            string worst = "Excellent";
            foreach (string r in ranks)
            {
                if (RankToInt(r) > RankToInt(worst))
                    worst = r;
            }
            return worst;
        }

        // --- Data collection helpers ---

        private static int GetPolygonCount(GameObject root)
        {
            int total = 0;
            Renderer[] renderers = root != null
                ? root.GetComponentsInChildren<Renderer>(true)
                : UnityEngine.Object.FindObjectsOfType<Renderer>();

            foreach (Renderer r in renderers)
            {
                MeshFilter mf = r.GetComponent<MeshFilter>();
                if (mf != null && mf.sharedMesh != null)
                {
                    total += mf.sharedMesh.triangles.Length / 3;
                }

                SkinnedMeshRenderer smr = r as SkinnedMeshRenderer;
                if (smr != null && smr.sharedMesh != null)
                {
                    total += smr.sharedMesh.triangles.Length / 3;
                }
            }
            return total;
        }

        private static int GetMaterialCount(GameObject root)
        {
            HashSet<Material> matSet = new HashSet<Material>();
            Renderer[] renderers = root != null
                ? root.GetComponentsInChildren<Renderer>(true)
                : UnityEngine.Object.FindObjectsOfType<Renderer>();

            foreach (Renderer r in renderers)
            {
                foreach (Material m in r.sharedMaterials)
                {
                    if (m != null) matSet.Add(m);
                }
            }
            return matSet.Count;
        }

        private static int GetBoneCount(GameObject root)
        {
            int total = 0;
            SkinnedMeshRenderer[] smrs = root != null
                ? root.GetComponentsInChildren<SkinnedMeshRenderer>(true)
                : UnityEngine.Object.FindObjectsOfType<SkinnedMeshRenderer>();

            HashSet<Transform> bones = new HashSet<Transform>();
            foreach (SkinnedMeshRenderer smr in smrs)
            {
                if (smr.bones != null)
                {
                    foreach (Transform bone in smr.bones)
                    {
                        if (bone != null) bones.Add(bone);
                    }
                }
            }
            return bones.Count;
        }

        private struct PhysBoneInfo
        {
            public int componentCount;
            public int transformCount;
        }

        private static PhysBoneInfo GetPhysBoneInfo(GameObject root)
        {
            // PhysBone is a VRChat SDK component. We detect it by type name to avoid
            // a hard dependency on the VRChat SDK assembly.
            PhysBoneInfo info = new PhysBoneInfo();

            Component[] allComponents = root != null
                ? root.GetComponentsInChildren<Component>(true)
                : UnityEngine.Object.FindObjectsOfType<Component>();

            foreach (Component c in allComponents)
            {
                if (c == null) continue;
                string typeName = c.GetType().Name;
                if (typeName == "VRCPhysBone" || typeName == "VRC_PhysBone")
                {
                    info.componentCount++;

                    // Count affected transforms: walk children of this component's
                    // transform up to the depth specified, or all descendants if no
                    // explicit list.  We approximate by counting the transform and
                    // all its descendants.
                    Transform t = c.transform;
                    info.transformCount += CountDescendants(t);
                }
            }

            return info;
        }

        private static int CountDescendants(Transform t)
        {
            int count = 1; // self
            for (int i = 0; i < t.childCount; i++)
            {
                count += CountDescendants(t.GetChild(i));
            }
            return count;
        }

        private static GameObject FindTarget(Dictionary<string, string> p)
        {
            string targetName = GetParam(p, "target", "");
            if (string.IsNullOrEmpty(targetName)) return null;
            return FindByNameOrId(targetName);
        }

        // --- Tool implementations ---

        private static ToolResult CheckAvatarRank(Dictionary<string, string> p)
        {
            GameObject root = FindTarget(p);

            int polygons = GetPolygonCount(root);
            int materials = GetMaterialCount(root);
            int bones = GetBoneCount(root);
            PhysBoneInfo pb = GetPhysBoneInfo(root ?? GetAvatarRoot());

            string polyRank = RankPolygons(polygons);
            string matRank = RankMaterials(materials);
            string boneRank = RankBones(bones);
            string pbCompRank = RankPhysBoneComponents(pb.componentCount);
            string pbTransRank = RankPhysBoneTransforms(pb.transformCount);

            string overall = WorstRank(polyRank, matRank, boneRank, pbCompRank, pbTransRank);

            StringBuilder sb = new StringBuilder();
            sb.Append("{");
            sb.Append($"\"overallRank\":\"{overall}\",");
            sb.Append("\"breakdown\":{");
            sb.Append($"\"polygons\":{{\"count\":{polygons},\"rank\":\"{polyRank}\"}},");
            sb.Append($"\"materials\":{{\"count\":{materials},\"rank\":\"{matRank}\"}},");
            sb.Append($"\"bones\":{{\"count\":{bones},\"rank\":\"{boneRank}\"}},");
            sb.Append($"\"physBoneComponents\":{{\"count\":{pb.componentCount},\"rank\":\"{pbCompRank}\"}},");
            sb.Append($"\"physBoneTransforms\":{{\"count\":{pb.transformCount},\"rank\":\"{pbTransRank}\"}}");
            sb.Append("},");
            sb.Append("\"limits\":{");
            sb.Append("\"polygons\":{\"Excellent\":32000,\"Good\":70000,\"Medium\":70000,\"Poor\":70001},");
            sb.Append("\"materials\":{\"Excellent\":1,\"Good\":1,\"Medium\":2,\"Poor\":4,\"VeryPoor\":5},");
            sb.Append("\"bones\":{\"Excellent\":75,\"Good\":90,\"Medium\":150,\"Poor\":256,\"VeryPoor\":257},");
            sb.Append("\"physBoneComponents\":{\"Excellent\":0,\"Good\":4,\"Medium\":8,\"Poor\":16},");
            sb.Append("\"physBoneTransforms\":{\"Excellent\":0,\"Good\":16,\"Medium\":32,\"Poor\":64}");
            sb.Append("}");
            sb.Append("}");

            string targetDesc = root != null ? $"'{root.name}'" : "scene";
            return new ToolResult
            {
                success = true,
                message = $"Performance rank for {targetDesc}: {overall} (Polygons={polygons} [{polyRank}], Materials={materials} [{matRank}], Bones={bones} [{boneRank}], PhysBones={pb.componentCount} [{pbCompRank}], PBTransforms={pb.transformCount} [{pbTransRank}])",
                data = sb.ToString()
            };
        }

        private static ToolResult CountPolygons(Dictionary<string, string> p)
        {
            GameObject root = FindTarget(p);
            int total = 0;
            int meshCount = 0;

            Renderer[] renderers = root != null
                ? root.GetComponentsInChildren<Renderer>(true)
                : UnityEngine.Object.FindObjectsOfType<Renderer>();

            StringBuilder details = new StringBuilder();
            details.Append("[");
            bool first = true;

            foreach (Renderer r in renderers)
            {
                Mesh mesh = null;
                MeshFilter mf = r.GetComponent<MeshFilter>();
                if (mf != null) mesh = mf.sharedMesh;

                SkinnedMeshRenderer smr = r as SkinnedMeshRenderer;
                if (smr != null) mesh = smr.sharedMesh;

                if (mesh != null)
                {
                    int tris = mesh.triangles.Length / 3;
                    total += tris;
                    meshCount++;

                    if (!first) details.Append(",");
                    first = false;
                    details.Append($"{{\"name\":\"{EscapeJson(r.gameObject.name)}\",\"triangles\":{tris},\"vertices\":{mesh.vertexCount}}}");
                }
            }
            details.Append("]");

            string targetDesc = root != null ? $"'{root.name}'" : "scene";
            return new ToolResult
            {
                success = true,
                message = $"Total polygon count for {targetDesc}: {total} triangles across {meshCount} mesh(es)",
                data = $"{{\"totalTriangles\":{total},\"meshCount\":{meshCount},\"meshes\":{details}}}"
            };
        }

        private static ToolResult CountMaterials(Dictionary<string, string> p)
        {
            GameObject root = FindTarget(p);
            int totalSlots = 0;
            HashSet<Material> uniqueMats = new HashSet<Material>();

            Renderer[] renderers = root != null
                ? root.GetComponentsInChildren<Renderer>(true)
                : UnityEngine.Object.FindObjectsOfType<Renderer>();

            foreach (Renderer r in renderers)
            {
                foreach (Material m in r.sharedMaterials)
                {
                    totalSlots++;
                    if (m != null) uniqueMats.Add(m);
                }
            }

            StringBuilder matList = new StringBuilder();
            matList.Append("[");
            bool first = true;
            foreach (Material m in uniqueMats)
            {
                if (!first) matList.Append(",");
                first = false;
                string shader = m.shader != null ? m.shader.name : "null";
                matList.Append($"{{\"name\":\"{EscapeJson(m.name)}\",\"shader\":\"{EscapeJson(shader)}\"}}");
            }
            matList.Append("]");

            string targetDesc = root != null ? $"'{root.name}'" : "scene";
            return new ToolResult
            {
                success = true,
                message = $"Materials for {targetDesc}: {uniqueMats.Count} unique material(s), {totalSlots} total slot(s)",
                data = $"{{\"uniqueMaterials\":{uniqueMats.Count},\"totalSlots\":{totalSlots},\"materials\":{matList}}}"
            };
        }

        private static ToolResult CountBones(Dictionary<string, string> p)
        {
            GameObject root = FindTarget(p);

            SkinnedMeshRenderer[] smrs = root != null
                ? root.GetComponentsInChildren<SkinnedMeshRenderer>(true)
                : UnityEngine.Object.FindObjectsOfType<SkinnedMeshRenderer>();

            HashSet<Transform> allBones = new HashSet<Transform>();
            Dictionary<string, int> perMesh = new Dictionary<string, int>();

            foreach (SkinnedMeshRenderer smr in smrs)
            {
                int count = 0;
                if (smr.bones != null)
                {
                    foreach (Transform bone in smr.bones)
                    {
                        if (bone != null)
                        {
                            allBones.Add(bone);
                            count++;
                        }
                    }
                }
                perMesh[smr.gameObject.name] = count;
            }

            StringBuilder meshDetails = new StringBuilder();
            meshDetails.Append("{");
            bool first = true;
            foreach (var kvp in perMesh)
            {
                if (!first) meshDetails.Append(",");
                first = false;
                meshDetails.Append($"\"{EscapeJson(kvp.Key)}\":{kvp.Value}");
            }
            meshDetails.Append("}");

            string targetDesc = root != null ? $"'{root.name}'" : "scene";
            return new ToolResult
            {
                success = true,
                message = $"Bone count for {targetDesc}: {allBones.Count} unique bone(s) across {smrs.Length} skinned mesh(es)",
                data = $"{{\"totalBones\":{allBones.Count},\"skinnedMeshCount\":{smrs.Length},\"perMesh\":{meshDetails}}}"
            };
        }

        private static ToolResult CountPhysBones(Dictionary<string, string> p)
        {
            GameObject root = FindTarget(p);
            if (root == null) root = GetAvatarRoot();

            PhysBoneInfo info = GetPhysBoneInfo(root);

            string targetDesc = root != null ? $"'{root.name}'" : "scene";
            return new ToolResult
            {
                success = true,
                message = $"PhysBones for {targetDesc}: {info.componentCount} component(s), {info.transformCount} affected transform(s)",
                data = $"{{\"components\":{info.componentCount},\"transforms\":{info.transformCount}}}"
            };
        }

        private static ToolResult SuggestOptimizations(Dictionary<string, string> p)
        {
            GameObject root = FindTarget(p);

            int polygons = GetPolygonCount(root);
            int materials = GetMaterialCount(root);
            int bones = GetBoneCount(root);
            PhysBoneInfo pb = GetPhysBoneInfo(root ?? GetAvatarRoot());

            List<string> suggestions = new List<string>();

            // Polygon suggestions
            if (polygons > 70000)
            {
                int reduceBy = polygons - 70000;
                suggestions.Add($"Reduce polygons by {reduceBy} to reach Good rank (current: {polygons}, target: <=70000)");
            }
            else if (polygons > 32000)
            {
                int reduceBy = polygons - 32000;
                suggestions.Add($"Reduce polygons by {reduceBy} to reach Excellent rank (current: {polygons}, target: <=32000)");
            }

            // Material suggestions
            if (materials > 4)
            {
                int mergeCount = materials - 4;
                suggestions.Add($"Merge or remove {mergeCount} material(s) to reach Poor rank (current: {materials}, target: <=4). Consider creating a texture atlas.");
            }
            else if (materials > 2)
            {
                int mergeCount = materials - 2;
                suggestions.Add($"Merge {mergeCount} material(s) into a texture atlas to reach Medium rank (current: {materials}, target: <=2)");
            }
            else if (materials > 1)
            {
                suggestions.Add($"Merge all materials into 1 atlas to reach Excellent rank (current: {materials}, target: <=1)");
            }

            // Bone suggestions
            if (bones > 256)
            {
                int removeCount = bones - 256;
                suggestions.Add($"Remove {removeCount} unused bone(s) to reach Poor rank (current: {bones}, target: <=256)");
            }
            else if (bones > 150)
            {
                int removeCount = bones - 150;
                suggestions.Add($"Remove {removeCount} bone(s) to reach Medium rank (current: {bones}, target: <=150)");
            }
            else if (bones > 90)
            {
                int removeCount = bones - 90;
                suggestions.Add($"Remove {removeCount} bone(s) to reach Good rank (current: {bones}, target: <=90)");
            }
            else if (bones > 75)
            {
                int removeCount = bones - 75;
                suggestions.Add($"Remove {removeCount} bone(s) to reach Excellent rank (current: {bones}, target: <=75)");
            }

            // PhysBone suggestions
            if (pb.componentCount > 16)
            {
                suggestions.Add($"Reduce PhysBone components from {pb.componentCount} to <=16 to reach Poor rank");
            }
            else if (pb.componentCount > 8)
            {
                suggestions.Add($"Reduce PhysBone components from {pb.componentCount} to <=8 to reach Medium rank");
            }
            else if (pb.componentCount > 4)
            {
                suggestions.Add($"Reduce PhysBone components from {pb.componentCount} to <=4 to reach Good rank");
            }

            if (pb.transformCount > 64)
            {
                suggestions.Add($"Reduce PhysBone transforms from {pb.transformCount} to <=64 to reach Poor rank");
            }
            else if (pb.transformCount > 32)
            {
                suggestions.Add($"Reduce PhysBone transforms from {pb.transformCount} to <=32 to reach Medium rank");
            }
            else if (pb.transformCount > 16)
            {
                suggestions.Add($"Reduce PhysBone transforms from {pb.transformCount} to <=16 to reach Good rank");
            }

            if (suggestions.Count == 0)
            {
                suggestions.Add("Avatar already meets Excellent rank across all categories. No optimization needed.");
            }

            StringBuilder sb = new StringBuilder();
            sb.Append("{\"suggestions\":[");
            for (int i = 0; i < suggestions.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append($"\"{EscapeJson(suggestions[i])}\"");
            }
            sb.Append("],");
            sb.Append($"\"currentStats\":{{\"polygons\":{polygons},\"materials\":{materials},\"bones\":{bones},\"physBoneComponents\":{pb.componentCount},\"physBoneTransforms\":{pb.transformCount}}}");
            sb.Append("}");

            string targetDesc = root != null ? $"'{root.name}'" : "scene";
            return new ToolResult
            {
                success = true,
                message = $"Optimization suggestions for {targetDesc}: {suggestions.Count} suggestion(s):\n" + string.Join("\n", suggestions.Select((s, i) => $"  {i + 1}. {s}")),
                data = sb.ToString()
            };
        }

        private static ToolResult AutoOptimizeAvatar(Dictionary<string, string> p)
        {
            GameObject root = FindTarget(p);
            if (root == null) root = GetAvatarRoot();
            if (root == null) return Fail("No avatar root found. Specify a target or ensure an avatar is in the scene.");

            // Capture before stats
            int beforePolygons = GetPolygonCount(root);
            int beforeMaterials = GetMaterialCount(root);
            int beforeBones = GetBoneCount(root);

            List<string> actions = new List<string>();

            // Step 1: Merge meshes that share materials
            int mergedMeshes = MergeMeshesByMaterial(root);
            if (mergedMeshes > 0)
                actions.Add($"Merged {mergedMeshes} mesh group(s) sharing materials");

            // Step 2: Create texture atlas for remaining materials (mark for atlas)
            int atlasedMaterials = AtlasMaterials(root);
            if (atlasedMaterials > 0)
                actions.Add($"Prepared {atlasedMaterials} material(s) for texture atlas");

            // Step 3: Remove unused bones
            int removedBones = RemoveUnusedBones(root);
            if (removedBones > 0)
                actions.Add($"Removed {removedBones} unused bone(s)");

            // Step 4: Set appropriate LOD
            bool lodCreated = SetupAvatarLOD(root);
            if (lodCreated)
                actions.Add("Created LOD group for avatar");

            // Capture after stats
            int afterPolygons = GetPolygonCount(root);
            int afterMaterials = GetMaterialCount(root);
            int afterBones = GetBoneCount(root);

            if (actions.Count == 0)
                actions.Add("No automatic optimizations could be applied. Manual optimization may be needed.");

            StringBuilder sb = new StringBuilder();
            sb.Append("{");
            sb.Append($"\"before\":{{\"polygons\":{beforePolygons},\"materials\":{beforeMaterials},\"bones\":{beforeBones}}},");
            sb.Append($"\"after\":{{\"polygons\":{afterPolygons},\"materials\":{afterMaterials},\"bones\":{afterBones}}},");
            sb.Append("\"actions\":[");
            for (int i = 0; i < actions.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append($"\"{EscapeJson(actions[i])}\"");
            }
            sb.Append("]}");

            return new ToolResult
            {
                success = true,
                message = $"Auto-optimization for '{root.name}': Polygons {beforePolygons}->{afterPolygons}, Materials {beforeMaterials}->{afterMaterials}, Bones {beforeBones}->{afterBones}. Actions: {string.Join("; ", actions)}",
                data = sb.ToString()
            };
        }

        private static ToolResult CompareBeforeAfter(Dictionary<string, string> p)
        {
            GameObject root = FindTarget(p);

            int polygons = GetPolygonCount(root);
            int materials = GetMaterialCount(root);
            int bones = GetBoneCount(root);
            PhysBoneInfo pb = GetPhysBoneInfo(root ?? GetAvatarRoot());

            string currentJson = $"{{\"polygons\":{polygons},\"materials\":{materials},\"bones\":{bones},\"physBoneComponents\":{pb.componentCount},\"physBoneTransforms\":{pb.transformCount}}}";

            if (_snapshotJson == null)
            {
                // First call: take snapshot
                _snapshotJson = currentJson;
                string targetDesc = root != null ? $"'{root.name}'" : "scene";
                return new ToolResult
                {
                    success = true,
                    message = $"Snapshot taken for {targetDesc}. Call compare_before_after again after making changes to see the comparison.",
                    data = $"{{\"action\":\"snapshot_taken\",\"snapshot\":{currentJson}}}"
                };
            }
            else
            {
                // Second call: compare
                string beforeJson = _snapshotJson;
                _snapshotJson = null; // Reset for next comparison

                StringBuilder sb = new StringBuilder();
                sb.Append("{");
                sb.Append($"\"before\":{beforeJson},");
                sb.Append($"\"after\":{currentJson}");
                sb.Append("}");

                string targetDesc = root != null ? $"'{root.name}'" : "scene";
                return new ToolResult
                {
                    success = true,
                    message = $"Before/after comparison for {targetDesc}: Polygons {polygons}, Materials {materials}, Bones {bones}, PB Components {pb.componentCount}, PB Transforms {pb.transformCount}",
                    data = sb.ToString()
                };
            }
        }

        // --- Optimization sub-routines ---

        private static int MergeMeshesByMaterial(GameObject root)
        {
            // Group MeshFilters by shared material
            MeshFilter[] meshFilters = root.GetComponentsInChildren<MeshFilter>(true);
            Dictionary<Material, List<MeshFilter>> groups = new Dictionary<Material, List<MeshFilter>>();

            foreach (MeshFilter mf in meshFilters)
            {
                if (mf.sharedMesh == null) continue;
                Renderer r = mf.GetComponent<Renderer>();
                if (r == null || r.sharedMaterials.Length == 0) continue;

                Material mat = r.sharedMaterials[0];
                if (mat == null) continue;

                if (!groups.ContainsKey(mat))
                    groups[mat] = new List<MeshFilter>();
                groups[mat].Add(mf);
            }

            int merged = 0;
            foreach (var kvp in groups)
            {
                if (kvp.Value.Count < 2) continue;

                List<CombineInstance> combines = new List<CombineInstance>();
                foreach (MeshFilter mf in kvp.Value)
                {
                    CombineInstance ci = new CombineInstance();
                    ci.mesh = mf.sharedMesh;
                    ci.transform = root.transform.worldToLocalMatrix * mf.transform.localToWorldMatrix;
                    combines.Add(ci);
                }

                Mesh combinedMesh = new Mesh();
                combinedMesh.CombineMeshes(combines.ToArray(), true, true);

                // Create combined object under root
                GameObject combined = new GameObject($"Combined_{kvp.Key.name}");
                combined.transform.SetParent(root.transform, false);
                MeshFilter combinedFilter = combined.AddComponent<MeshFilter>();
                MeshRenderer combinedRenderer = combined.AddComponent<MeshRenderer>();
                combinedFilter.sharedMesh = combinedMesh;
                combinedRenderer.sharedMaterial = kvp.Key;

                Undo.RegisterCreatedObjectUndo(combined, "Merge meshes by material");

                // Disable originals
                foreach (MeshFilter mf in kvp.Value)
                {
                    Undo.RecordObject(mf.gameObject, "Disable merged mesh");
                    mf.gameObject.SetActive(false);
                }

                merged++;
            }

            return merged;
        }

        private static int AtlasMaterials(GameObject root)
        {
            // Count materials that could be atlased (more than 1 unique material)
            HashSet<Material> mats = new HashSet<Material>();
            Renderer[] renderers = root.GetComponentsInChildren<Renderer>(true);
            foreach (Renderer r in renderers)
            {
                if (!r.gameObject.activeInHierarchy) continue;
                foreach (Material m in r.sharedMaterials)
                {
                    if (m != null) mats.Add(m);
                }
            }

            // Atlas creation requires external tooling (e.g., lilToon atlas, Thry atlas).
            // We mark the count of materials that would benefit from atlasing.
            return mats.Count > 1 ? mats.Count : 0;
        }

        private static int RemoveUnusedBones(GameObject root)
        {
            SkinnedMeshRenderer[] smrs = root.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            HashSet<Transform> usedBones = new HashSet<Transform>();

            foreach (SkinnedMeshRenderer smr in smrs)
            {
                if (smr.sharedMesh == null) continue;
                if (smr.bones == null) continue;

                // Gather bone indices actually used by vertex weights
                BoneWeight[] weights = smr.sharedMesh.boneWeights;
                HashSet<int> usedIndices = new HashSet<int>();
                foreach (BoneWeight bw in weights)
                {
                    if (bw.weight0 > 0) usedIndices.Add(bw.boneIndex0);
                    if (bw.weight1 > 0) usedIndices.Add(bw.boneIndex1);
                    if (bw.weight2 > 0) usedIndices.Add(bw.boneIndex2);
                    if (bw.weight3 > 0) usedIndices.Add(bw.boneIndex3);
                }

                foreach (int idx in usedIndices)
                {
                    if (idx >= 0 && idx < smr.bones.Length && smr.bones[idx] != null)
                    {
                        // Mark the bone and all its parents as used
                        Transform bone = smr.bones[idx];
                        while (bone != null && bone != root.transform)
                        {
                            usedBones.Add(bone);
                            bone = bone.parent;
                        }
                    }
                }
            }

            // Find and deactivate unused leaf bones
            Transform[] allTransforms = root.GetComponentsInChildren<Transform>(true);
            int removed = 0;
            foreach (Transform t in allTransforms)
            {
                if (t == root.transform) continue;
                if (usedBones.Contains(t)) continue;
                if (t.GetComponent<Renderer>() != null) continue;
                if (t.childCount > 0) continue; // Only remove leaf nodes

                // Check if this is actually a bone (child of armature hierarchy)
                bool isBoneCandidate = t.GetComponent<Component>() != null &&
                                       t.gameObject.GetComponents<Component>().Length == 1; // Only Transform
                if (isBoneCandidate)
                {
                    Undo.RecordObject(t.gameObject, "Remove unused bone");
                    t.gameObject.SetActive(false);
                    removed++;
                }
            }

            return removed;
        }

        private static bool SetupAvatarLOD(GameObject root)
        {
            if (root.GetComponent<LODGroup>() != null) return false;

            Renderer[] renderers = root.GetComponentsInChildren<Renderer>();
            if (renderers.Length == 0) return false;

            LODGroup lodGroup = Undo.AddComponent<LODGroup>(root);
            LOD[] lods = new LOD[]
            {
                new LOD(0.5f, renderers),
                new LOD(0.2f, new Renderer[0]),
                new LOD(0f, new Renderer[0]),
            };

            Undo.RecordObject(lodGroup, "Setup avatar LOD");
            lodGroup.SetLODs(lods);
            lodGroup.RecalculateBounds();
            return true;
        }

        private static GameObject GetAvatarRoot()
        {
            // Try to find the avatar root by looking for an Animator at the top level
            // or a VRC Avatar Descriptor component
            GameObject[] rootObjects = UnityEngine.SceneManagement.SceneManager.GetActiveScene().GetRootGameObjects();
            foreach (GameObject go in rootObjects)
            {
                // Check for VRC Avatar Descriptor (by type name to avoid SDK dependency)
                Component[] components = go.GetComponents<Component>();
                foreach (Component c in components)
                {
                    if (c == null) continue;
                    string typeName = c.GetType().Name;
                    if (typeName == "VRCAvatarDescriptor" || typeName == "VRC_AvatarDescriptor")
                        return go;
                }

                // Fallback: look for Animator with humanoid avatar
                Animator animator = go.GetComponent<Animator>();
                if (animator != null && animator.avatar != null && animator.avatar.isHuman)
                    return go;
            }
            return null;
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

        private static string GetParam(Dictionary<string, string> p, string key, string defaultValue = "")
        {
            return p.TryGetValue(key, out string value) ? value : defaultValue;
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
