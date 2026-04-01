using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

namespace OpenForge.Editor.Tools
{
    public static class OptimizationTools
    {
        public static void Register()
        {
            ToolExecutor.Register("analyze_draw_calls", AnalyzeDrawCalls);
            ToolExecutor.Register("create_lod_group", CreateLODGroup);
            ToolExecutor.Register("set_static_batching", SetStaticBatching);
            ToolExecutor.Register("set_occlusion_culling", SetOcclusionCulling);
            ToolExecutor.Register("optimize_textures", OptimizeTextures);
            ToolExecutor.Register("combine_meshes", CombineMeshes);
            ToolExecutor.Register("set_quality_settings", SetQualitySettings);
            ToolExecutor.Register("get_performance_stats", GetPerformanceStats);
        }

        private static ToolResult AnalyzeDrawCalls(Dictionary<string, string> p)
        {
            Renderer[] renderers = UnityEngine.Object.FindObjectsOfType<Renderer>();
            int totalRenderers = renderers.Length;
            int activeRenderers = 0;
            int totalMaterials = 0;
            int uniqueMaterials = 0;
            HashSet<Material> matSet = new HashSet<Material>();

            foreach (Renderer r in renderers)
            {
                if (r.enabled && r.gameObject.activeInHierarchy)
                {
                    activeRenderers++;
                    foreach (Material m in r.sharedMaterials)
                    {
                        if (m != null)
                        {
                            totalMaterials++;
                            matSet.Add(m);
                        }
                    }
                }
            }
            uniqueMaterials = matSet.Count;

            int totalTriangles = 0;
            int totalVertices = 0;
            MeshFilter[] meshFilters = UnityEngine.Object.FindObjectsOfType<MeshFilter>();
            foreach (MeshFilter mf in meshFilters)
            {
                if (mf.sharedMesh != null && mf.gameObject.activeInHierarchy)
                {
                    totalTriangles += mf.sharedMesh.triangles.Length / 3;
                    totalVertices += mf.sharedMesh.vertexCount;
                }
            }

            SkinnedMeshRenderer[] skinned = UnityEngine.Object.FindObjectsOfType<SkinnedMeshRenderer>();
            foreach (SkinnedMeshRenderer smr in skinned)
            {
                if (smr.sharedMesh != null && smr.gameObject.activeInHierarchy)
                {
                    totalTriangles += smr.sharedMesh.triangles.Length / 3;
                    totalVertices += smr.sharedMesh.vertexCount;
                }
            }

            int lightCount = UnityEngine.Object.FindObjectsOfType<Light>().Length;
            int particleCount = UnityEngine.Object.FindObjectsOfType<ParticleSystem>().Length;

            StringBuilder sb = new StringBuilder();
            sb.Append("{");
            sb.Append($"\"totalRenderers\":{totalRenderers},");
            sb.Append($"\"activeRenderers\":{activeRenderers},");
            sb.Append($"\"totalMaterials\":{totalMaterials},");
            sb.Append($"\"uniqueMaterials\":{uniqueMaterials},");
            sb.Append($"\"estimatedDrawCalls\":{activeRenderers + totalMaterials - uniqueMaterials},");
            sb.Append($"\"totalTriangles\":{totalTriangles},");
            sb.Append($"\"totalVertices\":{totalVertices},");
            sb.Append($"\"lightCount\":{lightCount},");
            sb.Append($"\"particleSystemCount\":{particleCount}");
            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Scene analysis: ~{activeRenderers} renderers, {totalTriangles} triangles, {uniqueMaterials} unique materials",
                data = sb.ToString()
            };
        }

        private static ToolResult CreateLODGroup(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            LODGroup lodGroup = go.GetComponent<LODGroup>();
            if (lodGroup == null)
                lodGroup = Undo.AddComponent<LODGroup>(go);

            string levelsStr = GetParam(p, "levels", "0.6,0.3,0.1");
            string[] levelParts = levelsStr.Split(',');

            LOD[] lods = new LOD[levelParts.Length + 1];

            Renderer[] renderers = go.GetComponentsInChildren<Renderer>();

            for (int i = 0; i < levelParts.Length; i++)
            {
                float threshold = float.Parse(levelParts[i].Trim(), System.Globalization.CultureInfo.InvariantCulture);
                if (i == 0)
                    lods[i] = new LOD(threshold, renderers);
                else
                    lods[i] = new LOD(threshold, new Renderer[0]);
            }
            lods[lods.Length - 1] = new LOD(0f, new Renderer[0]);

            Undo.RecordObject(lodGroup, "Set LOD levels");
            lodGroup.SetLODs(lods);
            lodGroup.RecalculateBounds();

            return new ToolResult
            {
                success = true,
                message = $"Created LOD group on '{go.name}' with {lods.Length} levels"
            };
        }

        private static ToolResult SetStaticBatching(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            bool isStatic = GetParam(p, "static", "true") != "false";
            bool includeChildren = GetParam(p, "include_children", "true") != "false";

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            StaticEditorFlags flags = isStatic
                ? StaticEditorFlags.BatchingStatic | StaticEditorFlags.OccludeeStatic | StaticEditorFlags.OccluderStatic
                : 0;

            Undo.RecordObject(go, "Set static batching");
            GameObjectUtility.SetStaticEditorFlags(go, flags);

            int count = 1;
            if (includeChildren)
            {
                Transform[] children = go.GetComponentsInChildren<Transform>(true);
                foreach (Transform child in children)
                {
                    if (child.gameObject == go) continue;
                    Undo.RecordObject(child.gameObject, "Set static batching");
                    GameObjectUtility.SetStaticEditorFlags(child.gameObject, flags);
                    count++;
                }
            }

            return new ToolResult
            {
                success = true,
                message = $"Set static batching on '{go.name}' ({count} objects, static={isStatic})"
            };
        }

        private static ToolResult SetOcclusionCulling(Dictionary<string, string> p)
        {
            string targetName = GetParam(p, "target", "");

            if (!string.IsNullOrEmpty(targetName))
            {
                GameObject go = FindByNameOrId(targetName);
                if (go == null) return Fail($"GameObject not found: {targetName}");

                string type = GetParam(p, "type", "both");
                StaticEditorFlags currentFlags = GameObjectUtility.GetStaticEditorFlags(go);

                Undo.RecordObject(go, "Set occlusion culling");

                switch (type.ToLower())
                {
                    case "occluder":
                        currentFlags |= StaticEditorFlags.OccluderStatic;
                        break;
                    case "occludee":
                        currentFlags |= StaticEditorFlags.OccludeeStatic;
                        break;
                    case "both":
                        currentFlags |= StaticEditorFlags.OccluderStatic | StaticEditorFlags.OccludeeStatic;
                        break;
                    case "none":
                        currentFlags &= ~(StaticEditorFlags.OccluderStatic | StaticEditorFlags.OccludeeStatic);
                        break;
                }

                GameObjectUtility.SetStaticEditorFlags(go, currentFlags);

                return new ToolResult
                {
                    success = true,
                    message = $"Set occlusion culling on '{go.name}' ({type})"
                };
            }

            string bake = GetParam(p, "bake", "false");
            if (bake == "true")
            {
                StaticOcclusionCulling.Compute();
                return new ToolResult
                {
                    success = true,
                    message = "Started occlusion culling bake"
                };
            }

            string clear = GetParam(p, "clear", "false");
            if (clear == "true")
            {
                StaticOcclusionCulling.Clear();
                return new ToolResult
                {
                    success = true,
                    message = "Cleared occlusion culling data"
                };
            }

            return new ToolResult
            {
                success = true,
                message = $"Occlusion culling data size: {StaticOcclusionCulling.umbraDataSize} bytes",
                data = $"{{\"dataSize\":{StaticOcclusionCulling.umbraDataSize}}}"
            };
        }

        private static ToolResult OptimizeTextures(Dictionary<string, string> p)
        {
            string targetPath = GetParam(p, "path", "Assets");
            int maxSize = int.Parse(GetParam(p, "max_size", "2048"));
            string format = GetParam(p, "format", "");
            bool generateMipmaps = GetParam(p, "mipmaps", "true") != "false";

            string[] guids = AssetDatabase.FindAssets("t:Texture2D", new[] { targetPath });
            int optimized = 0;

            foreach (string guid in guids)
            {
                string assetPath = AssetDatabase.GUIDToAssetPath(guid);
                TextureImporter importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;
                if (importer == null) continue;

                bool changed = false;

                if (importer.maxTextureSize > maxSize)
                {
                    importer.maxTextureSize = maxSize;
                    changed = true;
                }

                if (importer.mipmapEnabled != generateMipmaps)
                {
                    importer.mipmapEnabled = generateMipmaps;
                    changed = true;
                }

                if (!string.IsNullOrEmpty(format))
                {
                    TextureImporterCompression compression;
                    switch (format.ToLower())
                    {
                        case "compressed": compression = TextureImporterCompression.Compressed; break;
                        case "uncompressed": compression = TextureImporterCompression.Uncompressed; break;
                        case "high_quality": compression = TextureImporterCompression.CompressedHQ; break;
                        case "low_quality": compression = TextureImporterCompression.CompressedLQ; break;
                        default: continue;
                    }
                    if (importer.textureCompression != compression)
                    {
                        importer.textureCompression = compression;
                        changed = true;
                    }
                }

                if (changed)
                {
                    importer.SaveAndReimport();
                    optimized++;
                }
            }

            return new ToolResult
            {
                success = true,
                message = $"Optimized {optimized} of {guids.Length} texture(s) in '{targetPath}' (maxSize={maxSize})",
                data = $"{{\"totalTextures\":{guids.Length},\"optimized\":{optimized}}}"
            };
        }

        private static ToolResult CombineMeshes(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null) return Fail($"GameObject not found: {targetName}");

            MeshFilter[] meshFilters = go.GetComponentsInChildren<MeshFilter>();
            if (meshFilters.Length < 2)
                return Fail($"Need at least 2 meshes to combine. Found {meshFilters.Length}.");

            List<CombineInstance> combines = new List<CombineInstance>();
            List<Material> materials = new List<Material>();

            bool mergeSubMeshes = GetParam(p, "merge_submeshes", "true") == "true";

            foreach (MeshFilter mf in meshFilters)
            {
                if (mf.sharedMesh == null) continue;

                Renderer renderer = mf.GetComponent<Renderer>();
                if (renderer != null)
                {
                    foreach (Material mat in renderer.sharedMaterials)
                    {
                        if (!materials.Contains(mat)) materials.Add(mat);
                    }
                }

                CombineInstance ci = new CombineInstance();
                ci.mesh = mf.sharedMesh;
                ci.transform = mf.transform.localToWorldMatrix;
                combines.Add(ci);
            }

            string combinedName = GetParam(p, "name", go.name + "_Combined");
            GameObject combinedGo = new GameObject(combinedName);
            MeshFilter combinedFilter = combinedGo.AddComponent<MeshFilter>();
            MeshRenderer combinedRenderer = combinedGo.AddComponent<MeshRenderer>();

            Mesh combinedMesh = new Mesh();
            combinedMesh.name = combinedName;
            combinedMesh.CombineMeshes(combines.ToArray(), mergeSubMeshes, true);

            combinedFilter.sharedMesh = combinedMesh;
            combinedRenderer.sharedMaterials = materials.ToArray();

            string savePath = GetParam(p, "save_path", "");
            if (!string.IsNullOrEmpty(savePath))
            {
                EnsureDirectoryExists(savePath);
                AssetDatabase.CreateAsset(combinedMesh, savePath);
                AssetDatabase.SaveAssets();
            }

            bool disableOriginals = GetParam(p, "disable_originals", "false") == "true";
            if (disableOriginals)
            {
                foreach (MeshFilter mf in meshFilters)
                {
                    Undo.RecordObject(mf.gameObject, "Disable original mesh");
                    mf.gameObject.SetActive(false);
                }
            }

            Undo.RegisterCreatedObjectUndo(combinedGo, "Combine Meshes");

            return new ToolResult
            {
                success = true,
                message = $"Combined {combines.Count} meshes into '{combinedName}' ({combinedMesh.vertexCount} vertices, {combinedMesh.triangles.Length / 3} triangles)",
                data = $"{{\"name\":\"{EscapeJson(combinedName)}\",\"vertices\":{combinedMesh.vertexCount},\"triangles\":{combinedMesh.triangles.Length / 3}}}"
            };
        }

        private static ToolResult SetQualitySettings(Dictionary<string, string> p)
        {
            string level = GetParam(p, "level", "");
            if (!string.IsNullOrEmpty(level))
            {
                if (int.TryParse(level, out int levelIndex))
                    QualitySettings.SetQualityLevel(levelIndex);
                else
                {
                    string[] names = QualitySettings.names;
                    for (int i = 0; i < names.Length; i++)
                    {
                        if (names[i].Equals(level, StringComparison.OrdinalIgnoreCase))
                        {
                            QualitySettings.SetQualityLevel(i);
                            break;
                        }
                    }
                }
            }

            string vsync = GetParam(p, "vsync", "");
            if (!string.IsNullOrEmpty(vsync))
                QualitySettings.vSyncCount = int.Parse(vsync);

            string antiAliasing = GetParam(p, "anti_aliasing", "");
            if (!string.IsNullOrEmpty(antiAliasing))
                QualitySettings.antiAliasing = int.Parse(antiAliasing);

            string anisotropic = GetParam(p, "anisotropic_filtering", "");
            if (!string.IsNullOrEmpty(anisotropic) && Enum.TryParse(anisotropic, true, out AnisotropicFiltering af))
                QualitySettings.anisotropicFiltering = af;

            string lodBias = GetParam(p, "lod_bias", "");
            if (!string.IsNullOrEmpty(lodBias))
                QualitySettings.lodBias = float.Parse(lodBias, System.Globalization.CultureInfo.InvariantCulture);

            string pixelLightCount = GetParam(p, "pixel_light_count", "");
            if (!string.IsNullOrEmpty(pixelLightCount))
                QualitySettings.pixelLightCount = int.Parse(pixelLightCount);

            string textureQuality = GetParam(p, "texture_quality", "");
            if (!string.IsNullOrEmpty(textureQuality))
                QualitySettings.globalTextureMipmapLimit = int.Parse(textureQuality);

            return new ToolResult
            {
                success = true,
                message = $"Quality settings updated (level: {QualitySettings.names[QualitySettings.GetQualityLevel()]})",
                data = $"{{\"level\":\"{EscapeJson(QualitySettings.names[QualitySettings.GetQualityLevel()])}\",\"vsync\":{QualitySettings.vSyncCount},\"antiAliasing\":{QualitySettings.antiAliasing}}}"
            };
        }

        private static ToolResult GetPerformanceStats(Dictionary<string, string> p)
        {
            int totalGameObjects = UnityEngine.Object.FindObjectsOfType<GameObject>().Length;
            int totalComponents = UnityEngine.Object.FindObjectsOfType<Component>().Length;
            int rendererCount = UnityEngine.Object.FindObjectsOfType<Renderer>().Length;
            int meshFilterCount = UnityEngine.Object.FindObjectsOfType<MeshFilter>().Length;
            int skinnedMeshCount = UnityEngine.Object.FindObjectsOfType<SkinnedMeshRenderer>().Length;
            int lightCount = UnityEngine.Object.FindObjectsOfType<Light>().Length;
            int cameraCount = UnityEngine.Object.FindObjectsOfType<Camera>().Length;
            int audioSourceCount = UnityEngine.Object.FindObjectsOfType<AudioSource>().Length;
            int particleCount = UnityEngine.Object.FindObjectsOfType<ParticleSystem>().Length;

            long totalTextureMemory = 0;
            string[] texGuids = AssetDatabase.FindAssets("t:Texture2D");
            int textureCount = texGuids.Length;

            string qualityLevel = QualitySettings.names[QualitySettings.GetQualityLevel()];

            StringBuilder sb = new StringBuilder();
            sb.Append("{");
            sb.Append($"\"totalGameObjects\":{totalGameObjects},");
            sb.Append($"\"totalComponents\":{totalComponents},");
            sb.Append($"\"renderers\":{rendererCount},");
            sb.Append($"\"meshFilters\":{meshFilterCount},");
            sb.Append($"\"skinnedMeshRenderers\":{skinnedMeshCount},");
            sb.Append($"\"lights\":{lightCount},");
            sb.Append($"\"cameras\":{cameraCount},");
            sb.Append($"\"audioSources\":{audioSourceCount},");
            sb.Append($"\"particleSystems\":{particleCount},");
            sb.Append($"\"textureCount\":{textureCount},");
            sb.Append($"\"qualityLevel\":\"{EscapeJson(qualityLevel)}\",");
            sb.Append($"\"systemMemory\":{SystemInfo.systemMemorySize},");
            sb.Append($"\"graphicsMemory\":{SystemInfo.graphicsMemorySize},");
            sb.Append($"\"graphicsDevice\":\"{EscapeJson(SystemInfo.graphicsDeviceName)}\"");
            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Performance stats: {totalGameObjects} objects, {rendererCount} renderers, {lightCount} lights",
                data = sb.ToString()
            };
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
