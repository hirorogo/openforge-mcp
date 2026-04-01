using System;
using System.Collections.Generic;
using System.Reflection;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class ScreenshotTools
    {
        public static void Register()
        {
            ToolExecutor.Register("get_viewport_screenshot", GetViewportScreenshot);
        }

        private static ToolResult GetViewportScreenshot(Dictionary<string, string> p)
        {
            string source = GetParam(p, "source", "scene");
            int width = 0;
            int height = 0;

            if (p.TryGetValue("width", out string wStr)) int.TryParse(wStr, out width);
            if (p.TryGetValue("height", out string hStr)) int.TryParse(hStr, out height);

            try
            {
                Texture2D screenshot = null;

                if (source.ToLower() == "game")
                {
                    screenshot = CaptureGameView(width, height);
                }
                else
                {
                    screenshot = CaptureSceneView(width, height);
                }

                if (screenshot == null)
                    return Fail("Failed to capture screenshot. Ensure a Scene or Game view is open.");

                byte[] png = screenshot.EncodeToPNG();
                UnityEngine.Object.DestroyImmediate(screenshot);

                string base64 = Convert.ToBase64String(png);

                return new ToolResult
                {
                    success = true,
                    message = $"Captured {source} view screenshot ({png.Length} bytes)",
                    data = $"{{\"format\":\"png\",\"encoding\":\"base64\",\"size\":{png.Length},\"image\":\"{base64}\"}}"
                };
            }
            catch (Exception ex)
            {
                return Fail($"Screenshot failed: {ex.Message}");
            }
        }

        private static Texture2D CaptureSceneView(int width, int height)
        {
            SceneView sceneView = SceneView.lastActiveSceneView;
            if (sceneView == null)
            {
                // Try to get any scene view.
                SceneView[] views = Resources.FindObjectsOfTypeAll<SceneView>();
                if (views.Length > 0) sceneView = views[0];
            }

            if (sceneView == null) return null;

            sceneView.Repaint();

            Camera cam = sceneView.camera;
            if (cam == null) return null;

            if (width <= 0) width = (int)sceneView.position.width;
            if (height <= 0) height = (int)sceneView.position.height;

            width = Mathf.Clamp(width, 64, 4096);
            height = Mathf.Clamp(height, 64, 4096);

            RenderTexture rt = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32);
            RenderTexture oldTarget = cam.targetTexture;
            RenderTexture oldActive = RenderTexture.active;

            cam.targetTexture = rt;
            cam.Render();

            RenderTexture.active = rt;
            Texture2D tex = new Texture2D(width, height, TextureFormat.RGB24, false);
            tex.ReadPixels(new Rect(0, 0, width, height), 0, 0);
            tex.Apply();

            cam.targetTexture = oldTarget;
            RenderTexture.active = oldActive;
            UnityEngine.Object.DestroyImmediate(rt);

            return tex;
        }

        private static Texture2D CaptureGameView(int width, int height)
        {
            // Try to find an open Game view window and read its render texture.
            Type gameViewType = Type.GetType("UnityEditor.GameView, UnityEditor");
            if (gameViewType == null) return null;

            EditorWindow gameView = EditorWindow.GetWindow(gameViewType, false, null, false);
            if (gameView == null) return null;

            gameView.Repaint();

            // Use reflection to get the render texture from GameView.
            MethodInfo getMainPlayModeView = gameViewType.GetMethod(
                "GetMainPlayModeView",
                BindingFlags.NonPublic | BindingFlags.Static);

            // Fallback: use ScreenCapture for game view.
            if (width <= 0) width = (int)gameView.position.width;
            if (height <= 0) height = (int)gameView.position.height;

            width = Mathf.Clamp(width, 64, 4096);
            height = Mathf.Clamp(height, 64, 4096);

            // Try to capture via Camera.main if available.
            Camera mainCam = Camera.main;
            if (mainCam != null)
            {
                RenderTexture rt = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32);
                RenderTexture oldTarget = mainCam.targetTexture;
                RenderTexture oldActive = RenderTexture.active;

                mainCam.targetTexture = rt;
                mainCam.Render();

                RenderTexture.active = rt;
                Texture2D tex = new Texture2D(width, height, TextureFormat.RGB24, false);
                tex.ReadPixels(new Rect(0, 0, width, height), 0, 0);
                tex.Apply();

                mainCam.targetTexture = oldTarget;
                RenderTexture.active = oldActive;
                UnityEngine.Object.DestroyImmediate(rt);

                return tex;
            }

            // Final fallback: capture whatever is on screen.
            Texture2D screenTex = new Texture2D(width, height, TextureFormat.RGB24, false);
            screenTex.ReadPixels(new Rect(0, 0, width, height), 0, 0);
            screenTex.Apply();
            return screenTex;
        }

        private static string GetParam(Dictionary<string, string> p, string key, string defaultValue = "")
        {
            return p.TryGetValue(key, out string value) ? value : defaultValue;
        }

        private static ToolResult Fail(string message)
        {
            return new ToolResult { success = false, message = message };
        }
    }
}
