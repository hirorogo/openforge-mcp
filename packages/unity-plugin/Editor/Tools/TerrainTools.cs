using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class TerrainTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_terrain", CreateTerrain);
            ToolExecutor.Register("set_terrain_height", SetTerrainHeight);
            ToolExecutor.Register("paint_terrain_texture", PaintTerrainTexture);
            ToolExecutor.Register("add_terrain_tree", AddTerrainTree);
            ToolExecutor.Register("add_terrain_detail", AddTerrainDetail);
            ToolExecutor.Register("set_terrain_size", SetTerrainSize);
            ToolExecutor.Register("smooth_terrain", SmoothTerrain);
            ToolExecutor.Register("flatten_terrain", FlattenTerrain);
            ToolExecutor.Register("create_terrain_layer", CreateTerrainLayer);
            ToolExecutor.Register("get_terrain_info", GetTerrainInfo);
            ToolExecutor.Register("set_terrain_material", SetTerrainMaterial);
            ToolExecutor.Register("raise_lower_terrain", RaiseLowerTerrain);
        }

        private static ToolResult CreateTerrain(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Terrain");
            int heightmapRes = int.Parse(GetParam(p, "heightmap_resolution", "513"));
            float width = float.Parse(GetParam(p, "width", "1000"), System.Globalization.CultureInfo.InvariantCulture);
            float height = float.Parse(GetParam(p, "height", "600"), System.Globalization.CultureInfo.InvariantCulture);
            float length = float.Parse(GetParam(p, "length", "1000"), System.Globalization.CultureInfo.InvariantCulture);

            TerrainData terrainData = new TerrainData();
            terrainData.heightmapResolution = heightmapRes;
            terrainData.size = new Vector3(width, height, length);

            string dataPath = GetParam(p, "path", $"Assets/{name}.asset");
            EnsureDirectoryExists(dataPath);
            AssetDatabase.CreateAsset(terrainData, dataPath);

            GameObject terrainGo = Terrain.CreateTerrainGameObject(terrainData);
            terrainGo.name = name;

            string posStr = GetParam(p, "position", "");
            if (!string.IsNullOrEmpty(posStr) && TryParseVector3(posStr, out Vector3 pos))
                terrainGo.transform.position = pos;

            Undo.RegisterCreatedObjectUndo(terrainGo, "Create Terrain");
            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Created terrain '{name}' ({width}x{length}, height={height})",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"dataPath\":\"{EscapeJson(dataPath)}\",\"instanceId\":{terrainGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult SetTerrainHeight(Dictionary<string, string> p)
        {
            Terrain terrain = FindTerrain(p);
            if (terrain == null) return Fail("Terrain not found");

            int x = int.Parse(GetRequiredParam(p, "x"));
            int y = int.Parse(GetRequiredParam(p, "y"));
            float heightValue = float.Parse(GetRequiredParam(p, "height"), System.Globalization.CultureInfo.InvariantCulture);
            int radius = int.Parse(GetParam(p, "radius", "1"));

            TerrainData data = terrain.terrainData;
            int resolution = data.heightmapResolution;

            Undo.RecordObject(data, "Set terrain height");

            int startX = Mathf.Clamp(x - radius, 0, resolution - 1);
            int startY = Mathf.Clamp(y - radius, 0, resolution - 1);
            int endX = Mathf.Clamp(x + radius, 0, resolution - 1);
            int endY = Mathf.Clamp(y + radius, 0, resolution - 1);
            int sizeX = endX - startX + 1;
            int sizeY = endY - startY + 1;

            float[,] heights = data.GetHeights(startX, startY, sizeX, sizeY);

            for (int iy = 0; iy < sizeY; iy++)
            {
                for (int ix = 0; ix < sizeX; ix++)
                {
                    float dist = Vector2.Distance(new Vector2(startX + ix, startY + iy), new Vector2(x, y));
                    if (dist <= radius)
                    {
                        float falloff = 1f - (dist / radius);
                        heights[iy, ix] = Mathf.Lerp(heights[iy, ix], heightValue, falloff);
                    }
                }
            }

            data.SetHeights(startX, startY, heights);

            return new ToolResult
            {
                success = true,
                message = $"Set terrain height at ({x},{y}) to {heightValue} with radius {radius}"
            };
        }

        private static ToolResult PaintTerrainTexture(Dictionary<string, string> p)
        {
            Terrain terrain = FindTerrain(p);
            if (terrain == null) return Fail("Terrain not found");

            int layerIndex = int.Parse(GetRequiredParam(p, "layer_index"));
            int x = int.Parse(GetRequiredParam(p, "x"));
            int y = int.Parse(GetRequiredParam(p, "y"));
            int radius = int.Parse(GetParam(p, "radius", "5"));
            float strength = float.Parse(GetParam(p, "strength", "1"), System.Globalization.CultureInfo.InvariantCulture);

            TerrainData data = terrain.terrainData;

            if (layerIndex >= data.terrainLayers.Length)
                return Fail($"Layer index {layerIndex} out of range. Terrain has {data.terrainLayers.Length} layer(s).");

            int alphamapRes = data.alphamapResolution;
            int startX = Mathf.Clamp(x - radius, 0, alphamapRes - 1);
            int startY = Mathf.Clamp(y - radius, 0, alphamapRes - 1);
            int endX = Mathf.Clamp(x + radius, 0, alphamapRes - 1);
            int endY = Mathf.Clamp(y + radius, 0, alphamapRes - 1);
            int sizeX = endX - startX + 1;
            int sizeY = endY - startY + 1;

            Undo.RecordObject(data, "Paint terrain texture");

            float[,,] alphamaps = data.GetAlphamaps(startX, startY, sizeX, sizeY);
            int layerCount = data.terrainLayers.Length;

            for (int iy = 0; iy < sizeY; iy++)
            {
                for (int ix = 0; ix < sizeX; ix++)
                {
                    float dist = Vector2.Distance(new Vector2(startX + ix, startY + iy), new Vector2(x, y));
                    if (dist <= radius)
                    {
                        float falloff = (1f - (dist / radius)) * strength;
                        alphamaps[iy, ix, layerIndex] = Mathf.Clamp01(alphamaps[iy, ix, layerIndex] + falloff);

                        float total = 0f;
                        for (int l = 0; l < layerCount; l++) total += alphamaps[iy, ix, l];
                        if (total > 0f)
                        {
                            for (int l = 0; l < layerCount; l++) alphamaps[iy, ix, l] /= total;
                        }
                    }
                }
            }

            data.SetAlphamaps(startX, startY, alphamaps);

            return new ToolResult
            {
                success = true,
                message = $"Painted texture layer {layerIndex} at ({x},{y}) with radius {radius}"
            };
        }

        private static ToolResult AddTerrainTree(Dictionary<string, string> p)
        {
            Terrain terrain = FindTerrain(p);
            if (terrain == null) return Fail("Terrain not found");

            string prefabPath = GetRequiredParam(p, "prefab");

            GameObject treePrefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
            if (treePrefab == null)
                return Fail($"Tree prefab not found at: {prefabPath}");

            TerrainData data = terrain.terrainData;
            Undo.RecordObject(data, "Add terrain tree");

            TreePrototype proto = new TreePrototype();
            proto.prefab = treePrefab;

            TreePrototype[] protos = data.treePrototypes;
            int protoIndex = -1;
            for (int i = 0; i < protos.Length; i++)
            {
                if (protos[i].prefab == treePrefab) { protoIndex = i; break; }
            }

            if (protoIndex < 0)
            {
                TreePrototype[] newProtos = new TreePrototype[protos.Length + 1];
                Array.Copy(protos, newProtos, protos.Length);
                newProtos[newProtos.Length - 1] = proto;
                data.treePrototypes = newProtos;
                protoIndex = newProtos.Length - 1;
            }

            float posX = float.Parse(GetParam(p, "x", "0.5"), System.Globalization.CultureInfo.InvariantCulture);
            float posZ = float.Parse(GetParam(p, "z", "0.5"), System.Globalization.CultureInfo.InvariantCulture);
            float heightScale = float.Parse(GetParam(p, "height_scale", "1"), System.Globalization.CultureInfo.InvariantCulture);
            float widthScale = float.Parse(GetParam(p, "width_scale", "1"), System.Globalization.CultureInfo.InvariantCulture);

            int count = int.Parse(GetParam(p, "count", "1"));

            for (int i = 0; i < count; i++)
            {
                TreeInstance tree = new TreeInstance();
                tree.prototypeIndex = protoIndex;
                tree.heightScale = heightScale;
                tree.widthScale = widthScale;
                tree.color = Color.white;
                tree.lightmapColor = Color.white;

                if (count > 1)
                {
                    tree.position = new Vector3(
                        posX + UnityEngine.Random.Range(-0.1f, 0.1f),
                        0f,
                        posZ + UnityEngine.Random.Range(-0.1f, 0.1f)
                    );
                }
                else
                {
                    tree.position = new Vector3(posX, 0f, posZ);
                }

                data.SetTreeInstance(data.treeInstanceCount, tree);
            }

            terrain.Flush();

            return new ToolResult
            {
                success = true,
                message = $"Added {count} tree(s) to terrain"
            };
        }

        private static ToolResult AddTerrainDetail(Dictionary<string, string> p)
        {
            Terrain terrain = FindTerrain(p);
            if (terrain == null) return Fail("Terrain not found");

            string texturePath = GetParam(p, "texture", "");
            string prefabPath = GetParam(p, "prefab", "");

            TerrainData data = terrain.terrainData;
            Undo.RecordObject(data, "Add terrain detail");

            DetailPrototype detail = new DetailPrototype();

            if (!string.IsNullOrEmpty(texturePath))
            {
                Texture2D tex = AssetDatabase.LoadAssetAtPath<Texture2D>(texturePath);
                if (tex != null) detail.prototypeTexture = tex;
                detail.renderMode = DetailRenderMode.GrassBillboard;
            }
            else if (!string.IsNullOrEmpty(prefabPath))
            {
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
                if (prefab != null) detail.prototype = prefab;
                detail.renderMode = DetailRenderMode.VertexLit;
                detail.usePrototypeMesh = true;
            }
            else
            {
                return Fail("Specify either 'texture' or 'prefab' for the detail prototype.");
            }

            string minWidth = GetParam(p, "min_width", "");
            if (!string.IsNullOrEmpty(minWidth))
                detail.minWidth = float.Parse(minWidth, System.Globalization.CultureInfo.InvariantCulture);
            string maxWidth = GetParam(p, "max_width", "");
            if (!string.IsNullOrEmpty(maxWidth))
                detail.maxWidth = float.Parse(maxWidth, System.Globalization.CultureInfo.InvariantCulture);
            string minHeight = GetParam(p, "min_height", "");
            if (!string.IsNullOrEmpty(minHeight))
                detail.minHeight = float.Parse(minHeight, System.Globalization.CultureInfo.InvariantCulture);
            string maxHeight = GetParam(p, "max_height", "");
            if (!string.IsNullOrEmpty(maxHeight))
                detail.maxHeight = float.Parse(maxHeight, System.Globalization.CultureInfo.InvariantCulture);

            DetailPrototype[] protos = data.detailPrototypes;
            DetailPrototype[] newProtos = new DetailPrototype[protos.Length + 1];
            Array.Copy(protos, newProtos, protos.Length);
            newProtos[newProtos.Length - 1] = detail;
            data.detailPrototypes = newProtos;

            return new ToolResult
            {
                success = true,
                message = $"Added detail prototype (index: {newProtos.Length - 1})"
            };
        }

        private static ToolResult SetTerrainSize(Dictionary<string, string> p)
        {
            Terrain terrain = FindTerrain(p);
            if (terrain == null) return Fail("Terrain not found");

            TerrainData data = terrain.terrainData;
            Undo.RecordObject(data, "Set terrain size");

            Vector3 size = data.size;
            string width = GetParam(p, "width", "");
            if (!string.IsNullOrEmpty(width))
                size.x = float.Parse(width, System.Globalization.CultureInfo.InvariantCulture);
            string height = GetParam(p, "height", "");
            if (!string.IsNullOrEmpty(height))
                size.y = float.Parse(height, System.Globalization.CultureInfo.InvariantCulture);
            string length = GetParam(p, "length", "");
            if (!string.IsNullOrEmpty(length))
                size.z = float.Parse(length, System.Globalization.CultureInfo.InvariantCulture);

            data.size = size;

            return new ToolResult
            {
                success = true,
                message = $"Set terrain size to ({size.x}, {size.y}, {size.z})"
            };
        }

        private static ToolResult SmoothTerrain(Dictionary<string, string> p)
        {
            Terrain terrain = FindTerrain(p);
            if (terrain == null) return Fail("Terrain not found");

            int iterations = int.Parse(GetParam(p, "iterations", "1"));

            TerrainData data = terrain.terrainData;
            int resolution = data.heightmapResolution;

            Undo.RecordObject(data, "Smooth terrain");

            float[,] heights = data.GetHeights(0, 0, resolution, resolution);

            for (int iter = 0; iter < iterations; iter++)
            {
                float[,] smoothed = new float[resolution, resolution];
                for (int y = 0; y < resolution; y++)
                {
                    for (int x = 0; x < resolution; x++)
                    {
                        float sum = 0;
                        int count = 0;
                        for (int dy = -1; dy <= 1; dy++)
                        {
                            for (int dx = -1; dx <= 1; dx++)
                            {
                                int nx = Mathf.Clamp(x + dx, 0, resolution - 1);
                                int ny = Mathf.Clamp(y + dy, 0, resolution - 1);
                                sum += heights[ny, nx];
                                count++;
                            }
                        }
                        smoothed[y, x] = sum / count;
                    }
                }
                heights = smoothed;
            }

            data.SetHeights(0, 0, heights);

            return new ToolResult
            {
                success = true,
                message = $"Smoothed terrain ({iterations} iteration(s))"
            };
        }

        private static ToolResult FlattenTerrain(Dictionary<string, string> p)
        {
            Terrain terrain = FindTerrain(p);
            if (terrain == null) return Fail("Terrain not found");

            float targetHeight = float.Parse(GetParam(p, "height", "0"), System.Globalization.CultureInfo.InvariantCulture);

            TerrainData data = terrain.terrainData;
            int resolution = data.heightmapResolution;

            Undo.RecordObject(data, "Flatten terrain");

            float[,] heights = new float[resolution, resolution];
            for (int y = 0; y < resolution; y++)
                for (int x = 0; x < resolution; x++)
                    heights[y, x] = targetHeight;

            data.SetHeights(0, 0, heights);

            return new ToolResult
            {
                success = true,
                message = $"Flattened terrain to height {targetHeight}"
            };
        }

        private static ToolResult CreateTerrainLayer(Dictionary<string, string> p)
        {
            string texturePath = GetRequiredParam(p, "texture");
            string name = GetParam(p, "name", "Terrain Layer");

            Texture2D texture = AssetDatabase.LoadAssetAtPath<Texture2D>(texturePath);
            if (texture == null)
                return Fail($"Texture not found at: {texturePath}");

            TerrainLayer layer = new TerrainLayer();
            layer.diffuseTexture = texture;
            layer.name = name;

            string tileSize = GetParam(p, "tile_size", "");
            if (!string.IsNullOrEmpty(tileSize))
            {
                string[] parts = tileSize.Split(',');
                if (parts.Length >= 2
                    && float.TryParse(parts[0].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float tw)
                    && float.TryParse(parts[1].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float th))
                {
                    layer.tileSize = new Vector2(tw, th);
                }
            }

            string normalPath = GetParam(p, "normal_map", "");
            if (!string.IsNullOrEmpty(normalPath))
            {
                Texture2D normalTex = AssetDatabase.LoadAssetAtPath<Texture2D>(normalPath);
                if (normalTex != null) layer.normalMapTexture = normalTex;
            }

            string layerPath = GetParam(p, "path", $"Assets/{name}.terrainlayer");
            EnsureDirectoryExists(layerPath);
            AssetDatabase.CreateAsset(layer, layerPath);

            Terrain terrain = FindTerrain(p);
            if (terrain != null)
            {
                TerrainData data = terrain.terrainData;
                Undo.RecordObject(data, "Add terrain layer");
                TerrainLayer[] layers = data.terrainLayers;
                TerrainLayer[] newLayers = new TerrainLayer[layers.Length + 1];
                Array.Copy(layers, newLayers, layers.Length);
                newLayers[newLayers.Length - 1] = layer;
                data.terrainLayers = newLayers;
            }

            AssetDatabase.SaveAssets();

            return new ToolResult
            {
                success = true,
                message = $"Created terrain layer '{name}' with texture '{texture.name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"path\":\"{EscapeJson(layerPath)}\"}}"
            };
        }

        private static ToolResult GetTerrainInfo(Dictionary<string, string> p)
        {
            Terrain terrain = FindTerrain(p);
            if (terrain == null) return Fail("Terrain not found");

            TerrainData data = terrain.terrainData;
            StringBuilder sb = new StringBuilder();
            sb.Append("{");
            sb.Append($"\"name\":\"{EscapeJson(terrain.name)}\",");
            sb.Append($"\"size\":[{data.size.x},{data.size.y},{data.size.z}],");
            sb.Append($"\"heightmapResolution\":{data.heightmapResolution},");
            sb.Append($"\"alphamapResolution\":{data.alphamapResolution},");
            sb.Append($"\"layerCount\":{data.terrainLayers.Length},");
            sb.Append($"\"treePrototypeCount\":{data.treePrototypes.Length},");
            sb.Append($"\"treeInstanceCount\":{data.treeInstanceCount},");
            sb.Append($"\"detailPrototypeCount\":{data.detailPrototypes.Length},");
            sb.Append("\"layers\":[");
            for (int i = 0; i < data.terrainLayers.Length; i++)
            {
                if (i > 0) sb.Append(",");
                var layer = data.terrainLayers[i];
                string texName = layer.diffuseTexture != null ? layer.diffuseTexture.name : "none";
                sb.Append($"{{\"index\":{i},\"name\":\"{EscapeJson(layer.name)}\",\"texture\":\"{EscapeJson(texName)}\"}}");
            }
            sb.Append("]");
            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Terrain info: {data.size.x}x{data.size.z}, {data.terrainLayers.Length} layers, {data.treeInstanceCount} trees",
                data = sb.ToString()
            };
        }

        private static ToolResult SetTerrainMaterial(Dictionary<string, string> p)
        {
            Terrain terrain = FindTerrain(p);
            if (terrain == null) return Fail("Terrain not found");

            string materialPath = GetRequiredParam(p, "material");
            Material mat = AssetDatabase.LoadAssetAtPath<Material>(materialPath);
            if (mat == null)
                return Fail($"Material not found at: {materialPath}");

            Undo.RecordObject(terrain, "Set terrain material");
            terrain.materialTemplate = mat;

            return new ToolResult
            {
                success = true,
                message = $"Set terrain material to '{mat.name}'"
            };
        }

        private static ToolResult RaiseLowerTerrain(Dictionary<string, string> p)
        {
            Terrain terrain = FindTerrain(p);
            if (terrain == null) return Fail("Terrain not found");

            int x = int.Parse(GetRequiredParam(p, "x"));
            int y = int.Parse(GetRequiredParam(p, "y"));
            float amount = float.Parse(GetRequiredParam(p, "amount"), System.Globalization.CultureInfo.InvariantCulture);
            int radius = int.Parse(GetParam(p, "radius", "5"));

            TerrainData data = terrain.terrainData;
            int resolution = data.heightmapResolution;

            int startX = Mathf.Clamp(x - radius, 0, resolution - 1);
            int startY = Mathf.Clamp(y - radius, 0, resolution - 1);
            int endX = Mathf.Clamp(x + radius, 0, resolution - 1);
            int endY = Mathf.Clamp(y + radius, 0, resolution - 1);
            int sizeX = endX - startX + 1;
            int sizeY = endY - startY + 1;

            Undo.RecordObject(data, "Raise/Lower terrain");

            float[,] heights = data.GetHeights(startX, startY, sizeX, sizeY);

            for (int iy = 0; iy < sizeY; iy++)
            {
                for (int ix = 0; ix < sizeX; ix++)
                {
                    float dist = Vector2.Distance(new Vector2(startX + ix, startY + iy), new Vector2(x, y));
                    if (dist <= radius)
                    {
                        float falloff = 1f - (dist / radius);
                        heights[iy, ix] = Mathf.Clamp01(heights[iy, ix] + amount * falloff);
                    }
                }
            }

            data.SetHeights(startX, startY, heights);

            return new ToolResult
            {
                success = true,
                message = $"Raised/lowered terrain at ({x},{y}) by {amount} with radius {radius}"
            };
        }

        // --- Helpers ---

        private static Terrain FindTerrain(Dictionary<string, string> p)
        {
            string targetName = GetParam(p, "target", "");
            if (!string.IsNullOrEmpty(targetName))
            {
                GameObject go = FindByNameOrId(targetName);
                if (go != null) return go.GetComponent<Terrain>();
            }
            return Terrain.activeTerrain;
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
