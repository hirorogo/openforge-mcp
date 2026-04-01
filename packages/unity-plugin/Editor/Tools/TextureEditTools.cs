using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    /// <summary>
    /// Direct texture manipulation tools using Texture2D API.
    /// All modifications create backups and support undo.
    /// </summary>
    public static class TextureEditTools
    {
        public static void Register()
        {
            ToolExecutor.Register("adjust_hsv", AdjustHSV);
            ToolExecutor.Register("apply_gradient", ApplyGradient);
            ToolExecutor.Register("tint_region", TintRegion);
            ToolExecutor.Register("generate_pattern", GeneratePattern);
            ToolExecutor.Register("overlay_decal", OverlayDecal);
            ToolExecutor.Register("adjust_brightness_contrast", AdjustBrightnessContrast);
            ToolExecutor.Register("create_color_mask", CreateColorMask);
            ToolExecutor.Register("swap_color", SwapColor);
            ToolExecutor.Register("export_texture", ExportTexture);
            ToolExecutor.Register("batch_recolor", BatchRecolor);
        }

        // --- Tool Implementations ---

        private static ToolResult AdjustHSV(Dictionary<string, string> p)
        {
            string texturePath = GetRequiredParam(p, "texture");
            Texture2D source = LoadAndPrepareTexture(texturePath, out string error);
            if (source == null) return Fail(error);

            float hueShift = ParseFloat(p, "hue_shift", 0f);       // -180 to 180
            float satMult = ParseFloat(p, "saturation_mult", 1f);   // multiplier
            float valMult = ParseFloat(p, "value_mult", 1f);        // multiplier

            // Clamp hue_shift
            hueShift = Mathf.Clamp(hueShift, -180f, 180f);

            // Create backup
            string backupPath = CreateBackup(texturePath);

            Color32[] pixels = source.GetPixels32();
            for (int i = 0; i < pixels.Length; i++)
            {
                Color c = pixels[i];
                Color.RGBToHSV(c, out float h, out float s, out float v);

                h += hueShift / 360f;
                if (h > 1f) h -= 1f;
                if (h < 0f) h += 1f;

                s = Mathf.Clamp01(s * satMult);
                v = Mathf.Clamp01(v * valMult);

                Color result = Color.HSVToRGB(h, s, v);
                result.a = c.a;
                pixels[i] = result;
            }

            source.SetPixels32(pixels);
            source.Apply();
            SaveTexture(source, texturePath);

            return new ToolResult
            {
                success = true,
                message = $"Adjusted HSV on '{texturePath}' (hue: {hueShift}, sat: {satMult}x, val: {valMult}x)",
                data = $"{{\"texture\":\"{EscapeJson(texturePath)}\",\"backup\":\"{EscapeJson(backupPath)}\",\"hueShift\":{hueShift},\"saturationMult\":{satMult},\"valueMult\":{valMult}}}"
            };
        }

        private static ToolResult ApplyGradient(Dictionary<string, string> p)
        {
            string texturePath = GetRequiredParam(p, "texture");
            Texture2D source = LoadAndPrepareTexture(texturePath, out string error);
            if (source == null) return Fail(error);

            Color topColor = ParseColor(p, "top_color", Color.white);
            Color bottomColor = ParseColor(p, "bottom_color", Color.black);
            string direction = GetParam(p, "direction", "vertical").ToLower();
            float opacity = ParseFloat(p, "opacity", 0.5f);
            string blendMode = GetParam(p, "blend_mode", "multiply").ToLower();

            string backupPath = CreateBackup(texturePath);

            Color32[] pixels = source.GetPixels32();
            int w = source.width;
            int h = source.height;

            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    float t;
                    if (direction == "horizontal")
                        t = (float)x / (w - 1);
                    else
                        t = (float)y / (h - 1);

                    Color gradColor = Color.Lerp(bottomColor, topColor, t);
                    int idx = y * w + x;
                    Color original = (Color)pixels[idx];
                    Color blended;

                    switch (blendMode)
                    {
                        case "overlay":
                            blended = OverlayBlend(original, gradColor);
                            break;
                        case "add":
                            blended = new Color(
                                Mathf.Clamp01(original.r + gradColor.r),
                                Mathf.Clamp01(original.g + gradColor.g),
                                Mathf.Clamp01(original.b + gradColor.b),
                                original.a);
                            break;
                        case "multiply":
                        default:
                            blended = original * gradColor;
                            blended.a = original.a;
                            break;
                    }

                    pixels[idx] = Color.Lerp(original, blended, opacity);
                }
            }

            source.SetPixels32(pixels);
            source.Apply();
            SaveTexture(source, texturePath);

            return new ToolResult
            {
                success = true,
                message = $"Applied {direction} gradient to '{texturePath}'",
                data = $"{{\"texture\":\"{EscapeJson(texturePath)}\",\"backup\":\"{EscapeJson(backupPath)}\",\"direction\":\"{EscapeJson(direction)}\"}}"
            };
        }

        private static ToolResult TintRegion(Dictionary<string, string> p)
        {
            string texturePath = GetRequiredParam(p, "texture");
            Texture2D source = LoadAndPrepareTexture(texturePath, out string error);
            if (source == null) return Fail(error);

            Color sourceColor = ParseColor(p, "source_color", Color.white);
            Color targetColor = ParseColor(p, "target_color", Color.red);
            float tolerance = ParseFloat(p, "tolerance", 0.3f);

            string backupPath = CreateBackup(texturePath);

            Color32[] pixels = source.GetPixels32();
            int tintedCount = 0;

            Color.RGBToHSV(sourceColor, out float srcH, out float srcS, out float srcV);

            for (int i = 0; i < pixels.Length; i++)
            {
                Color c = pixels[i];
                Color.RGBToHSV(c, out float h, out float s, out float v);

                float hueDiff = Mathf.Abs(h - srcH);
                if (hueDiff > 0.5f) hueDiff = 1f - hueDiff;
                float satDiff = Mathf.Abs(s - srcS);
                float valDiff = Mathf.Abs(v - srcV);

                float distance = hueDiff * 2f + satDiff + valDiff;

                if (distance <= tolerance)
                {
                    float blend = 1f - (distance / tolerance);
                    Color result = Color.Lerp(c, targetColor, blend);
                    result.a = c.a;
                    pixels[i] = result;
                    tintedCount++;
                }
            }

            source.SetPixels32(pixels);
            source.Apply();
            SaveTexture(source, texturePath);

            return new ToolResult
            {
                success = true,
                message = $"Tinted {tintedCount} pixels in '{texturePath}'",
                data = $"{{\"texture\":\"{EscapeJson(texturePath)}\",\"backup\":\"{EscapeJson(backupPath)}\",\"tintedPixels\":{tintedCount},\"totalPixels\":{pixels.Length}}}"
            };
        }

        private static ToolResult GeneratePattern(Dictionary<string, string> p)
        {
            string patternType = GetParam(p, "type", "checker").ToLower();
            Color color1 = ParseColor(p, "color1", Color.white);
            Color color2 = ParseColor(p, "color2", Color.black);
            int width = (int)ParseFloat(p, "width", 256);
            int height = (int)ParseFloat(p, "height", 256);
            float scale = ParseFloat(p, "scale", 8f);
            string savePath = GetParam(p, "path", $"Assets/Patterns/{patternType}_pattern.png");

            // Ensure directory
            string dir = Path.GetDirectoryName(savePath);
            if (!string.IsNullOrEmpty(dir) && !AssetDatabase.IsValidFolder(dir))
            {
                string[] folders = dir.Replace("\\", "/").Split('/');
                string currentPath = folders[0];
                for (int i = 1; i < folders.Length; i++)
                {
                    string next = currentPath + "/" + folders[i];
                    if (!AssetDatabase.IsValidFolder(next))
                    {
                        AssetDatabase.CreateFolder(currentPath, folders[i]);
                    }
                    currentPath = next;
                }
            }

            Texture2D texture = new Texture2D(width, height, TextureFormat.RGBA32, false);
            Color32[] pixels = new Color32[width * height];

            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    float u = (float)x / width * scale;
                    float v = (float)y / height * scale;
                    Color c;

                    switch (patternType)
                    {
                        case "stripe":
                            c = (Mathf.FloorToInt(u) % 2 == 0) ? color1 : color2;
                            break;

                        case "checker":
                            c = ((Mathf.FloorToInt(u) + Mathf.FloorToInt(v)) % 2 == 0) ? color1 : color2;
                            break;

                        case "dots":
                            float cx = u - Mathf.Floor(u) - 0.5f;
                            float cy = v - Mathf.Floor(v) - 0.5f;
                            float dist = Mathf.Sqrt(cx * cx + cy * cy);
                            c = (dist < 0.3f) ? color1 : color2;
                            break;

                        case "noise":
                            float noise = Mathf.PerlinNoise(u, v);
                            c = Color.Lerp(color1, color2, noise);
                            break;

                        case "diagonal":
                            c = (Mathf.FloorToInt(u + v) % 2 == 0) ? color1 : color2;
                            break;

                        default:
                            c = ((Mathf.FloorToInt(u) + Mathf.FloorToInt(v)) % 2 == 0) ? color1 : color2;
                            break;
                    }

                    pixels[y * width + x] = c;
                }
            }

            texture.SetPixels32(pixels);
            texture.Apply();

            byte[] pngData = texture.EncodeToPNG();
            string fullPath = Path.Combine(Path.GetDirectoryName(Application.dataPath), savePath);
            File.WriteAllBytes(fullPath, pngData);
            UnityEngine.Object.DestroyImmediate(texture);

            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Generated {patternType} pattern ({width}x{height}) at '{savePath}'",
                data = $"{{\"path\":\"{EscapeJson(savePath)}\",\"type\":\"{EscapeJson(patternType)}\",\"width\":{width},\"height\":{height},\"scale\":{scale}}}"
            };
        }

        private static ToolResult OverlayDecal(Dictionary<string, string> p)
        {
            string texturePath = GetRequiredParam(p, "texture");
            string decalPath = GetRequiredParam(p, "decal");

            Texture2D source = LoadAndPrepareTexture(texturePath, out string error);
            if (source == null) return Fail(error);

            Texture2D decal = LoadAndPrepareTexture(decalPath, out string decalError);
            if (decal == null) return Fail($"Decal: {decalError}");

            float uvX = ParseFloat(p, "uv_x", 0.5f);
            float uvY = ParseFloat(p, "uv_y", 0.5f);
            float scaleX = ParseFloat(p, "scale_x", 1f);
            float scaleY = ParseFloat(p, "scale_y", 1f);
            float opacity = ParseFloat(p, "opacity", 1f);

            string backupPath = CreateBackup(texturePath);

            int sw = source.width;
            int sh = source.height;
            int dw = Mathf.RoundToInt(decal.width * scaleX);
            int dh = Mathf.RoundToInt(decal.height * scaleY);

            // Calculate placement position (UV center)
            int startX = Mathf.RoundToInt(uvX * sw - dw * 0.5f);
            int startY = Mathf.RoundToInt(uvY * sh - dh * 0.5f);

            Color32[] sourcePixels = source.GetPixels32();
            Color[] decalPixels = decal.GetPixels();

            for (int dy = 0; dy < dh; dy++)
            {
                for (int dx = 0; dx < dw; dx++)
                {
                    int sx = startX + dx;
                    int sy = startY + dy;
                    if (sx < 0 || sx >= sw || sy < 0 || sy >= sh) continue;

                    // Sample decal with scaling
                    float du = (float)dx / dw;
                    float dv = (float)dy / dh;
                    int decalSrcX = Mathf.Clamp(Mathf.RoundToInt(du * (decal.width - 1)), 0, decal.width - 1);
                    int decalSrcY = Mathf.Clamp(Mathf.RoundToInt(dv * (decal.height - 1)), 0, decal.height - 1);

                    Color decalColor = decalPixels[decalSrcY * decal.width + decalSrcX];
                    float alpha = decalColor.a * opacity;

                    if (alpha <= 0f) continue;

                    int idx = sy * sw + sx;
                    Color original = (Color)sourcePixels[idx];
                    Color blended = Color.Lerp(original, decalColor, alpha);
                    blended.a = Mathf.Max(original.a, alpha);
                    sourcePixels[idx] = blended;
                }
            }

            source.SetPixels32(sourcePixels);
            source.Apply();
            SaveTexture(source, texturePath);

            return new ToolResult
            {
                success = true,
                message = $"Overlaid decal '{decalPath}' onto '{texturePath}' at UV ({uvX}, {uvY})",
                data = $"{{\"texture\":\"{EscapeJson(texturePath)}\",\"decal\":\"{EscapeJson(decalPath)}\",\"backup\":\"{EscapeJson(backupPath)}\"}}"
            };
        }

        private static ToolResult AdjustBrightnessContrast(Dictionary<string, string> p)
        {
            string texturePath = GetRequiredParam(p, "texture");
            Texture2D source = LoadAndPrepareTexture(texturePath, out string error);
            if (source == null) return Fail(error);

            float brightness = ParseFloat(p, "brightness", 0f);  // -1 to 1
            float contrast = ParseFloat(p, "contrast", 0f);      // -1 to 1

            brightness = Mathf.Clamp(brightness, -1f, 1f);
            contrast = Mathf.Clamp(contrast, -1f, 1f);

            string backupPath = CreateBackup(texturePath);

            Color32[] pixels = source.GetPixels32();
            float contrastFactor = (1f + contrast) / (1f - contrast + 0.001f);

            for (int i = 0; i < pixels.Length; i++)
            {
                Color c = (Color)pixels[i];

                // Apply brightness
                c.r = Mathf.Clamp01(c.r + brightness);
                c.g = Mathf.Clamp01(c.g + brightness);
                c.b = Mathf.Clamp01(c.b + brightness);

                // Apply contrast
                c.r = Mathf.Clamp01((c.r - 0.5f) * contrastFactor + 0.5f);
                c.g = Mathf.Clamp01((c.g - 0.5f) * contrastFactor + 0.5f);
                c.b = Mathf.Clamp01((c.b - 0.5f) * contrastFactor + 0.5f);

                pixels[i] = c;
            }

            source.SetPixels32(pixels);
            source.Apply();
            SaveTexture(source, texturePath);

            return new ToolResult
            {
                success = true,
                message = $"Adjusted brightness ({brightness}) and contrast ({contrast}) on '{texturePath}'",
                data = $"{{\"texture\":\"{EscapeJson(texturePath)}\",\"backup\":\"{EscapeJson(backupPath)}\",\"brightness\":{brightness},\"contrast\":{contrast}}}"
            };
        }

        private static ToolResult CreateColorMask(Dictionary<string, string> p)
        {
            string texturePath = GetRequiredParam(p, "texture");
            Texture2D source = LoadAndPrepareTexture(texturePath, out string error);
            if (source == null) return Fail(error);

            Color selectColor = ParseColor(p, "color", Color.red);
            float tolerance = ParseFloat(p, "tolerance", 0.3f);
            string maskPath = GetParam(p, "mask_path", texturePath.Replace(".png", "_mask.png").Replace(".jpg", "_mask.png"));
            bool invertMask = GetParam(p, "invert", "false") == "true";

            Color.RGBToHSV(selectColor, out float srcH, out float srcS, out float srcV);

            Color32[] pixels = source.GetPixels32();
            int w = source.width;
            int h = source.height;

            Texture2D mask = new Texture2D(w, h, TextureFormat.RGBA32, false);
            Color32[] maskPixels = new Color32[pixels.Length];
            int selectedCount = 0;

            for (int i = 0; i < pixels.Length; i++)
            {
                Color c = (Color)pixels[i];
                Color.RGBToHSV(c, out float ph, out float ps, out float pv);

                float hueDiff = Mathf.Abs(ph - srcH);
                if (hueDiff > 0.5f) hueDiff = 1f - hueDiff;
                float satDiff = Mathf.Abs(ps - srcS);
                float valDiff = Mathf.Abs(pv - srcV);

                float distance = hueDiff * 2f + satDiff + valDiff;
                bool selected = distance <= tolerance;
                if (invertMask) selected = !selected;

                if (selected)
                {
                    float strength = invertMask ? 1f : (1f - distance / tolerance);
                    byte val = (byte)(Mathf.Clamp01(strength) * 255);
                    maskPixels[i] = new Color32(val, val, val, 255);
                    selectedCount++;
                }
                else
                {
                    maskPixels[i] = new Color32(0, 0, 0, 255);
                }
            }

            mask.SetPixels32(maskPixels);
            mask.Apply();

            byte[] pngData = mask.EncodeToPNG();
            string fullPath = Path.Combine(Path.GetDirectoryName(Application.dataPath), maskPath);
            File.WriteAllBytes(fullPath, pngData);
            UnityEngine.Object.DestroyImmediate(mask);

            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created color mask at '{maskPath}' ({selectedCount}/{pixels.Length} pixels selected)",
                data = $"{{\"maskPath\":\"{EscapeJson(maskPath)}\",\"sourceTexture\":\"{EscapeJson(texturePath)}\",\"selectedPixels\":{selectedCount},\"totalPixels\":{pixels.Length}}}"
            };
        }

        private static ToolResult SwapColor(Dictionary<string, string> p)
        {
            string texturePath = GetRequiredParam(p, "texture");
            Texture2D source = LoadAndPrepareTexture(texturePath, out string error);
            if (source == null) return Fail(error);

            Color fromColor = ParseColor(p, "from_color", Color.red);
            Color toColor = ParseColor(p, "to_color", Color.blue);
            float tolerance = ParseFloat(p, "tolerance", 0.2f);
            bool preserveLuminance = GetParam(p, "preserve_luminance", "false") == "true";

            string backupPath = CreateBackup(texturePath);

            Color.RGBToHSV(fromColor, out float fromH, out float fromS, out float fromV);
            Color.RGBToHSV(toColor, out float toH, out float toS, out float toV);

            Color32[] pixels = source.GetPixels32();
            int swappedCount = 0;

            for (int i = 0; i < pixels.Length; i++)
            {
                Color c = (Color)pixels[i];
                Color.RGBToHSV(c, out float h, out float s, out float v);

                float hueDiff = Mathf.Abs(h - fromH);
                if (hueDiff > 0.5f) hueDiff = 1f - hueDiff;
                float satDiff = Mathf.Abs(s - fromS);
                float valDiff = Mathf.Abs(v - fromV);

                float distance = hueDiff * 2f + satDiff + valDiff;

                if (distance <= tolerance)
                {
                    float blend = 1f - (distance / tolerance);

                    float newH = Mathf.LerpUnclamped(h, toH, blend);
                    float newS = Mathf.LerpUnclamped(s, toS, blend);
                    float newV = preserveLuminance ? v : Mathf.LerpUnclamped(v, toV, blend);

                    if (newH > 1f) newH -= 1f;
                    if (newH < 0f) newH += 1f;
                    newS = Mathf.Clamp01(newS);
                    newV = Mathf.Clamp01(newV);

                    Color result = Color.HSVToRGB(newH, newS, newV);
                    result.a = c.a;
                    pixels[i] = result;
                    swappedCount++;
                }
            }

            source.SetPixels32(pixels);
            source.Apply();
            SaveTexture(source, texturePath);

            return new ToolResult
            {
                success = true,
                message = $"Swapped color in {swappedCount} pixels on '{texturePath}'",
                data = $"{{\"texture\":\"{EscapeJson(texturePath)}\",\"backup\":\"{EscapeJson(backupPath)}\",\"swappedPixels\":{swappedCount},\"totalPixels\":{pixels.Length}}}"
            };
        }

        private static ToolResult ExportTexture(Dictionary<string, string> p)
        {
            string texturePath = GetRequiredParam(p, "texture");
            Texture2D source = LoadAndPrepareTexture(texturePath, out string error);
            if (source == null) return Fail(error);

            string format = GetParam(p, "format", "png").ToLower();
            string outputPath = GetParam(p, "output_path", "");
            int jpgQuality = (int)ParseFloat(p, "quality", 90);

            if (string.IsNullOrEmpty(outputPath))
            {
                string ext = format == "jpg" ? ".jpg" : ".png";
                outputPath = texturePath.Replace(Path.GetExtension(texturePath), $"_export{ext}");
            }

            byte[] data;
            if (format == "jpg" || format == "jpeg")
            {
                data = source.EncodeToJPG(jpgQuality);
            }
            else
            {
                data = source.EncodeToPNG();
            }

            string fullPath = outputPath;
            if (!Path.IsPathRooted(outputPath))
            {
                fullPath = Path.Combine(Path.GetDirectoryName(Application.dataPath), outputPath);
            }

            // Ensure directory exists
            string dir = Path.GetDirectoryName(fullPath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            File.WriteAllBytes(fullPath, data);

            // Refresh if inside Assets
            if (outputPath.StartsWith("Assets"))
            {
                AssetDatabase.Refresh();
            }

            return new ToolResult
            {
                success = true,
                message = $"Exported texture to '{outputPath}' ({format.ToUpper()}, {data.Length} bytes)",
                data = $"{{\"outputPath\":\"{EscapeJson(outputPath)}\",\"format\":\"{EscapeJson(format)}\",\"sizeBytes\":{data.Length},\"width\":{source.width},\"height\":{source.height}}}"
            };
        }

        private static ToolResult BatchRecolor(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            GameObject target = FindByNameOrId(targetName);
            if (target == null)
                return Fail($"GameObject not found: {targetName}");

            Color fromColor = ParseColor(p, "from_color", Color.white);
            Color toColor = ParseColor(p, "to_color", Color.red);
            float tolerance = ParseFloat(p, "tolerance", 0.3f);

            Renderer[] renderers = target.GetComponentsInChildren<Renderer>(true);
            if (renderers.Length == 0)
                return Fail($"No renderers found on '{targetName}' or its children");

            int materialsProcessed = 0;
            int texturesProcessed = 0;
            var processedTextures = new HashSet<string>();
            var backups = new List<string>();

            foreach (Renderer renderer in renderers)
            {
                Material[] materials = renderer.sharedMaterials;
                foreach (Material mat in materials)
                {
                    if (mat == null) continue;
                    materialsProcessed++;

                    // Find main texture
                    Texture mainTex = mat.mainTexture;
                    if (mainTex == null || !(mainTex is Texture2D)) continue;

                    string texPath = AssetDatabase.GetAssetPath(mainTex);
                    if (string.IsNullOrEmpty(texPath) || processedTextures.Contains(texPath)) continue;
                    processedTextures.Add(texPath);

                    Texture2D tex = LoadAndPrepareTexture(texPath, out string texError);
                    if (tex == null) continue;

                    string backupPath = CreateBackup(texPath);
                    if (!string.IsNullOrEmpty(backupPath)) backups.Add(backupPath);

                    Color.RGBToHSV(fromColor, out float fromH, out float fromS, out float fromV);
                    Color.RGBToHSV(toColor, out float toH, out float toS, out float toV);

                    Color32[] pixels = tex.GetPixels32();
                    for (int i = 0; i < pixels.Length; i++)
                    {
                        Color c = (Color)pixels[i];
                        Color.RGBToHSV(c, out float h, out float s, out float v);

                        float hueDiff = Mathf.Abs(h - fromH);
                        if (hueDiff > 0.5f) hueDiff = 1f - hueDiff;
                        float satDiff = Mathf.Abs(s - fromS);
                        float valDiff = Mathf.Abs(v - fromV);

                        float distance = hueDiff * 2f + satDiff + valDiff;

                        if (distance <= tolerance)
                        {
                            float blend = 1f - (distance / tolerance);
                            float newH = Mathf.LerpUnclamped(h, toH, blend);
                            float newS = Mathf.LerpUnclamped(s, toS, blend);
                            float newV = v; // preserve luminance

                            if (newH > 1f) newH -= 1f;
                            if (newH < 0f) newH += 1f;
                            newS = Mathf.Clamp01(newS);

                            Color result = Color.HSVToRGB(newH, newS, newV);
                            result.a = c.a;
                            pixels[i] = result;
                        }
                    }

                    tex.SetPixels32(pixels);
                    tex.Apply();
                    SaveTexture(tex, texPath);
                    texturesProcessed++;
                }
            }

            var sb = new StringBuilder("{");
            sb.Append($"\"target\":\"{EscapeJson(target.name)}\",");
            sb.Append($"\"materialsProcessed\":{materialsProcessed},");
            sb.Append($"\"texturesProcessed\":{texturesProcessed},");
            sb.Append("\"backups\":[");
            for (int i = 0; i < backups.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append($"\"{EscapeJson(backups[i])}\"");
            }
            sb.Append("]}");

            return new ToolResult
            {
                success = true,
                message = $"Batch recolored {texturesProcessed} texture(s) across {materialsProcessed} material(s) on '{target.name}'",
                data = sb.ToString()
            };
        }

        // --- Internal Helpers ---

        private static Texture2D LoadAndPrepareTexture(string assetPath, out string error)
        {
            error = null;

            Texture2D tex = AssetDatabase.LoadAssetAtPath<Texture2D>(assetPath);
            if (tex == null)
            {
                error = $"Texture not found at path: {assetPath}";
                return null;
            }

            // Ensure texture is readable
            string fullPath = AssetDatabase.GetAssetPath(tex);
            TextureImporter importer = AssetImporter.GetAtPath(fullPath) as TextureImporter;
            if (importer != null && !importer.isReadable)
            {
                importer.isReadable = true;
                importer.SaveAndReimport();

                // Reload after reimport
                tex = AssetDatabase.LoadAssetAtPath<Texture2D>(assetPath);
                if (tex == null)
                {
                    error = $"Failed to reload texture after enabling readability: {assetPath}";
                    return null;
                }
            }

            return tex;
        }

        private static string CreateBackup(string assetPath)
        {
            string ext = Path.GetExtension(assetPath);
            string nameWithoutExt = assetPath.Substring(0, assetPath.Length - ext.Length);
            string backupPath = $"{nameWithoutExt}_backup_{DateTime.Now:yyyyMMdd_HHmmss}{ext}";

            try
            {
                string srcFull = Path.Combine(Path.GetDirectoryName(Application.dataPath), assetPath);
                string dstFull = Path.Combine(Path.GetDirectoryName(Application.dataPath), backupPath);

                if (File.Exists(srcFull))
                {
                    File.Copy(srcFull, dstFull, true);
                    AssetDatabase.Refresh();
                    return backupPath;
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"Failed to create texture backup: {ex.Message}");
            }

            return "";
        }

        private static void SaveTexture(Texture2D tex, string assetPath)
        {
            string ext = Path.GetExtension(assetPath).ToLower();
            byte[] data;

            if (ext == ".jpg" || ext == ".jpeg")
            {
                data = tex.EncodeToJPG(90);
            }
            else
            {
                data = tex.EncodeToPNG();
            }

            string fullPath = Path.Combine(Path.GetDirectoryName(Application.dataPath), assetPath);
            File.WriteAllBytes(fullPath, data);
            AssetDatabase.Refresh();
            AssetDatabase.ImportAsset(assetPath);
        }

        private static Color OverlayBlend(Color a, Color b)
        {
            return new Color(
                a.r < 0.5f ? 2f * a.r * b.r : 1f - 2f * (1f - a.r) * (1f - b.r),
                a.g < 0.5f ? 2f * a.g * b.g : 1f - 2f * (1f - a.g) * (1f - b.g),
                a.b < 0.5f ? 2f * a.b * b.b : 1f - 2f * (1f - a.b) * (1f - b.b),
                a.a
            );
        }

        private static Color ParseColor(Dictionary<string, string> p, string key, Color defaultColor)
        {
            string raw = GetParam(p, key, "");
            if (string.IsNullOrEmpty(raw)) return defaultColor;

            raw = raw.Trim();

            // Try hex color (#RRGGBB or #RRGGBBAA)
            if (raw.StartsWith("#"))
            {
                if (ColorUtility.TryParseHtmlString(raw, out Color parsed))
                    return parsed;
            }

            // Try "r,g,b" or "r,g,b,a" format (0-1 floats)
            string[] parts = raw.Split(',');
            if (parts.Length >= 3)
            {
                if (float.TryParse(parts[0].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float r)
                    && float.TryParse(parts[1].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float g)
                    && float.TryParse(parts[2].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float b))
                {
                    float a = 1f;
                    if (parts.Length >= 4)
                        float.TryParse(parts[3].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out a);

                    // If values are > 1, assume 0-255 range
                    if (r > 1f || g > 1f || b > 1f)
                    {
                        r /= 255f;
                        g /= 255f;
                        b /= 255f;
                        if (a > 1f) a /= 255f;
                    }

                    return new Color(r, g, b, a);
                }
            }

            // Try named colors
            switch (raw.ToLower())
            {
                case "red": return Color.red;
                case "green": return Color.green;
                case "blue": return Color.blue;
                case "white": return Color.white;
                case "black": return Color.black;
                case "yellow": return Color.yellow;
                case "cyan": return Color.cyan;
                case "magenta": return Color.magenta;
                case "gray": case "grey": return Color.gray;
            }

            return defaultColor;
        }

        private static float ParseFloat(Dictionary<string, string> p, string key, float defaultValue)
        {
            string raw = GetParam(p, key, "");
            if (string.IsNullOrEmpty(raw)) return defaultValue;
            if (float.TryParse(raw, System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out float val))
                return val;
            return defaultValue;
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
