using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace OpenForge.Editor.Tools
{
    public static class UITools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_canvas", CreateCanvas);
            ToolExecutor.Register("create_button", CreateButton);
            ToolExecutor.Register("create_text", CreateText);
            ToolExecutor.Register("create_image", CreateImage);
            ToolExecutor.Register("create_slider", CreateSlider);
            ToolExecutor.Register("create_toggle", CreateToggle);
            ToolExecutor.Register("create_input_field", CreateInputField);
            ToolExecutor.Register("create_dropdown", CreateDropdown);
            ToolExecutor.Register("create_scroll_view", CreateScrollView);
            ToolExecutor.Register("create_panel", CreatePanel);
            ToolExecutor.Register("set_ui_text", SetUIText);
            ToolExecutor.Register("set_ui_image", SetUIImage);
            ToolExecutor.Register("set_ui_color", SetUIColor);
            ToolExecutor.Register("set_ui_anchor", SetUIAnchor);
            ToolExecutor.Register("set_ui_layout", SetUILayout);
        }

        private static Canvas EnsureCanvas()
        {
            Canvas canvas = UnityEngine.Object.FindObjectOfType<Canvas>();
            if (canvas != null) return canvas;

            GameObject canvasGo = new GameObject("Canvas");
            canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasGo.AddComponent<CanvasScaler>();
            canvasGo.AddComponent<GraphicRaycaster>();
            Undo.RegisterCreatedObjectUndo(canvasGo, "Create Canvas");

            if (UnityEngine.Object.FindObjectOfType<EventSystem>() == null)
            {
                GameObject eventSystem = new GameObject("EventSystem");
                eventSystem.AddComponent<EventSystem>();
                eventSystem.AddComponent<StandaloneInputModule>();
                Undo.RegisterCreatedObjectUndo(eventSystem, "Create EventSystem");
            }

            return canvas;
        }

        private static ToolResult CreateCanvas(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Canvas");
            string renderMode = GetParam(p, "render_mode", "screen_space_overlay");

            GameObject canvasGo = new GameObject(name);
            Canvas canvas = canvasGo.AddComponent<Canvas>();

            switch (renderMode.ToLower().Replace(" ", "_"))
            {
                case "screen_space_overlay":
                    canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                    break;
                case "screen_space_camera":
                    canvas.renderMode = RenderMode.ScreenSpaceCamera;
                    string cameraName = GetParam(p, "camera", "");
                    if (!string.IsNullOrEmpty(cameraName))
                    {
                        GameObject camGo = FindByNameOrId(cameraName);
                        if (camGo != null)
                        {
                            Camera cam = camGo.GetComponent<Camera>();
                            if (cam != null) canvas.worldCamera = cam;
                        }
                    }
                    break;
                case "world_space":
                    canvas.renderMode = RenderMode.WorldSpace;
                    break;
            }

            CanvasScaler scaler = canvasGo.AddComponent<CanvasScaler>();
            string scaleMode = GetParam(p, "scale_mode", "");
            if (scaleMode.ToLower() == "scale_with_screen_size")
            {
                scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                string refResolution = GetParam(p, "reference_resolution", "");
                if (!string.IsNullOrEmpty(refResolution))
                {
                    string[] parts = refResolution.Split(',');
                    if (parts.Length >= 2
                        && float.TryParse(parts[0].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float w)
                        && float.TryParse(parts[1].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float h))
                    {
                        scaler.referenceResolution = new Vector2(w, h);
                    }
                }
            }

            canvasGo.AddComponent<GraphicRaycaster>();
            Undo.RegisterCreatedObjectUndo(canvasGo, "Create Canvas");

            if (UnityEngine.Object.FindObjectOfType<EventSystem>() == null)
            {
                GameObject eventSystem = new GameObject("EventSystem");
                eventSystem.AddComponent<EventSystem>();
                eventSystem.AddComponent<StandaloneInputModule>();
                Undo.RegisterCreatedObjectUndo(eventSystem, "Create EventSystem");
            }

            return new ToolResult
            {
                success = true,
                message = $"Created canvas '{name}' ({renderMode})",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"renderMode\":\"{renderMode}\"}}"
            };
        }

        private static ToolResult CreateButton(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Button");
            string text = GetParam(p, "text", "Button");

            Canvas canvas = EnsureCanvas();

            GameObject buttonGo = new GameObject(name);
            buttonGo.transform.SetParent(canvas.transform, false);

            RectTransform rt = buttonGo.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(160, 30);

            Image image = buttonGo.AddComponent<Image>();
            image.color = new Color(0.2f, 0.2f, 0.2f, 1f);

            Button button = buttonGo.AddComponent<Button>();
            ColorBlock colors = button.colors;
            colors.normalColor = new Color(0.9f, 0.9f, 0.9f, 1f);
            colors.highlightedColor = new Color(0.95f, 0.95f, 0.95f, 1f);
            colors.pressedColor = new Color(0.8f, 0.8f, 0.8f, 1f);
            button.colors = colors;

            GameObject textGo = new GameObject("Text");
            textGo.transform.SetParent(buttonGo.transform, false);
            RectTransform textRt = textGo.AddComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.sizeDelta = Vector2.zero;
            Text textComp = textGo.AddComponent<Text>();
            textComp.text = text;
            textComp.alignment = TextAnchor.MiddleCenter;
            textComp.color = Color.black;
            textComp.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

            ApplyRectTransformParams(rt, p);
            Undo.RegisterCreatedObjectUndo(buttonGo, "Create Button");

            return new ToolResult
            {
                success = true,
                message = $"Created button '{name}' with text '{text}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{buttonGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult CreateText(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Text");
            string text = GetParam(p, "text", "New Text");
            int fontSize = int.Parse(GetParam(p, "font_size", "14"));
            string colorStr = GetParam(p, "color", "");

            Canvas canvas = EnsureCanvas();

            GameObject textGo = new GameObject(name);
            textGo.transform.SetParent(canvas.transform, false);

            RectTransform rt = textGo.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(200, 50);

            Text textComp = textGo.AddComponent<Text>();
            textComp.text = text;
            textComp.fontSize = fontSize;
            textComp.alignment = TextAnchor.MiddleCenter;
            textComp.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

            if (!string.IsNullOrEmpty(colorStr) && TryParseColor(colorStr, out Color color))
                textComp.color = color;

            string alignment = GetParam(p, "alignment", "");
            if (!string.IsNullOrEmpty(alignment) && Enum.TryParse(alignment, true, out TextAnchor anchor))
                textComp.alignment = anchor;

            ApplyRectTransformParams(rt, p);
            Undo.RegisterCreatedObjectUndo(textGo, "Create Text");

            return new ToolResult
            {
                success = true,
                message = $"Created text '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{textGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult CreateImage(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Image");

            Canvas canvas = EnsureCanvas();

            GameObject imageGo = new GameObject(name);
            imageGo.transform.SetParent(canvas.transform, false);

            RectTransform rt = imageGo.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(100, 100);

            Image image = imageGo.AddComponent<Image>();

            string colorStr = GetParam(p, "color", "");
            if (!string.IsNullOrEmpty(colorStr) && TryParseColor(colorStr, out Color color))
                image.color = color;

            string spritePath = GetParam(p, "sprite", "");
            if (!string.IsNullOrEmpty(spritePath))
            {
                Sprite sprite = AssetDatabase.LoadAssetAtPath<Sprite>(spritePath);
                if (sprite != null) image.sprite = sprite;
            }

            string imageType = GetParam(p, "image_type", "");
            if (!string.IsNullOrEmpty(imageType) && Enum.TryParse(imageType, true, out Image.Type iType))
                image.type = iType;

            ApplyRectTransformParams(rt, p);
            Undo.RegisterCreatedObjectUndo(imageGo, "Create Image");

            return new ToolResult
            {
                success = true,
                message = $"Created image '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{imageGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult CreateSlider(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Slider");
            Canvas canvas = EnsureCanvas();

            GameObject sliderGo = DefaultControls.CreateSlider(GetUIResources());
            sliderGo.name = name;
            sliderGo.transform.SetParent(canvas.transform, false);

            Slider slider = sliderGo.GetComponent<Slider>();
            string minValue = GetParam(p, "min_value", "");
            if (!string.IsNullOrEmpty(minValue))
                slider.minValue = float.Parse(minValue, System.Globalization.CultureInfo.InvariantCulture);
            string maxValue = GetParam(p, "max_value", "");
            if (!string.IsNullOrEmpty(maxValue))
                slider.maxValue = float.Parse(maxValue, System.Globalization.CultureInfo.InvariantCulture);
            string value = GetParam(p, "value", "");
            if (!string.IsNullOrEmpty(value))
                slider.value = float.Parse(value, System.Globalization.CultureInfo.InvariantCulture);
            string wholeNumbers = GetParam(p, "whole_numbers", "");
            if (!string.IsNullOrEmpty(wholeNumbers))
                slider.wholeNumbers = wholeNumbers == "true";

            ApplyRectTransformParams(sliderGo.GetComponent<RectTransform>(), p);
            Undo.RegisterCreatedObjectUndo(sliderGo, "Create Slider");

            return new ToolResult
            {
                success = true,
                message = $"Created slider '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{sliderGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult CreateToggle(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Toggle");
            string label = GetParam(p, "label", "Toggle");
            Canvas canvas = EnsureCanvas();

            GameObject toggleGo = DefaultControls.CreateToggle(GetUIResources());
            toggleGo.name = name;
            toggleGo.transform.SetParent(canvas.transform, false);

            Toggle toggle = toggleGo.GetComponent<Toggle>();
            string isOn = GetParam(p, "is_on", "");
            if (!string.IsNullOrEmpty(isOn))
                toggle.isOn = isOn == "true";

            Text labelText = toggleGo.GetComponentInChildren<Text>();
            if (labelText != null)
                labelText.text = label;

            ApplyRectTransformParams(toggleGo.GetComponent<RectTransform>(), p);
            Undo.RegisterCreatedObjectUndo(toggleGo, "Create Toggle");

            return new ToolResult
            {
                success = true,
                message = $"Created toggle '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{toggleGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult CreateInputField(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "InputField");
            string placeholder = GetParam(p, "placeholder", "Enter text...");
            Canvas canvas = EnsureCanvas();

            GameObject inputGo = DefaultControls.CreateInputField(GetUIResources());
            inputGo.name = name;
            inputGo.transform.SetParent(canvas.transform, false);

            InputField inputField = inputGo.GetComponent<InputField>();
            string contentType = GetParam(p, "content_type", "");
            if (!string.IsNullOrEmpty(contentType) && Enum.TryParse(contentType, true, out InputField.ContentType ct))
                inputField.contentType = ct;

            Text placeholderText = inputGo.transform.Find("Placeholder")?.GetComponent<Text>();
            if (placeholderText != null)
                placeholderText.text = placeholder;

            ApplyRectTransformParams(inputGo.GetComponent<RectTransform>(), p);
            Undo.RegisterCreatedObjectUndo(inputGo, "Create InputField");

            return new ToolResult
            {
                success = true,
                message = $"Created input field '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{inputGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult CreateDropdown(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Dropdown");
            string optionsStr = GetParam(p, "options", "");
            Canvas canvas = EnsureCanvas();

            GameObject dropdownGo = DefaultControls.CreateDropdown(GetUIResources());
            dropdownGo.name = name;
            dropdownGo.transform.SetParent(canvas.transform, false);

            Dropdown dropdown = dropdownGo.GetComponent<Dropdown>();

            if (!string.IsNullOrEmpty(optionsStr))
            {
                dropdown.ClearOptions();
                string[] options = optionsStr.Split(',');
                List<string> optionList = new List<string>();
                foreach (string opt in options)
                    optionList.Add(opt.Trim());
                dropdown.AddOptions(optionList);
            }

            ApplyRectTransformParams(dropdownGo.GetComponent<RectTransform>(), p);
            Undo.RegisterCreatedObjectUndo(dropdownGo, "Create Dropdown");

            return new ToolResult
            {
                success = true,
                message = $"Created dropdown '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{dropdownGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult CreateScrollView(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Scroll View");
            Canvas canvas = EnsureCanvas();

            GameObject scrollGo = DefaultControls.CreateScrollView(GetUIResources());
            scrollGo.name = name;
            scrollGo.transform.SetParent(canvas.transform, false);

            ScrollRect scrollRect = scrollGo.GetComponent<ScrollRect>();
            string horizontal = GetParam(p, "horizontal", "");
            if (!string.IsNullOrEmpty(horizontal))
                scrollRect.horizontal = horizontal == "true";
            string vertical = GetParam(p, "vertical", "");
            if (!string.IsNullOrEmpty(vertical))
                scrollRect.vertical = vertical == "true";

            ApplyRectTransformParams(scrollGo.GetComponent<RectTransform>(), p);
            Undo.RegisterCreatedObjectUndo(scrollGo, "Create ScrollView");

            return new ToolResult
            {
                success = true,
                message = $"Created scroll view '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{scrollGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult CreatePanel(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "Panel");
            Canvas canvas = EnsureCanvas();

            GameObject panelGo = DefaultControls.CreatePanel(GetUIResources());
            panelGo.name = name;
            panelGo.transform.SetParent(canvas.transform, false);

            string colorStr = GetParam(p, "color", "");
            if (!string.IsNullOrEmpty(colorStr))
            {
                Image image = panelGo.GetComponent<Image>();
                if (image != null && TryParseColor(colorStr, out Color color))
                    image.color = color;
            }

            ApplyRectTransformParams(panelGo.GetComponent<RectTransform>(), p);
            Undo.RegisterCreatedObjectUndo(panelGo, "Create Panel");

            return new ToolResult
            {
                success = true,
                message = $"Created panel '{name}'",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"instanceId\":{panelGo.GetInstanceID()}}}"
            };
        }

        private static ToolResult SetUIText(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string text = GetRequiredParam(p, "text");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Text textComp = go.GetComponent<Text>();
            if (textComp == null)
                textComp = go.GetComponentInChildren<Text>();
            if (textComp == null)
                return Fail($"No Text component found on '{targetName}'");

            Undo.RecordObject(textComp, "Set UI text");
            textComp.text = text;

            string fontSize = GetParam(p, "font_size", "");
            if (!string.IsNullOrEmpty(fontSize))
                textComp.fontSize = int.Parse(fontSize);

            string colorStr = GetParam(p, "color", "");
            if (!string.IsNullOrEmpty(colorStr) && TryParseColor(colorStr, out Color color))
                textComp.color = color;

            string alignment = GetParam(p, "alignment", "");
            if (!string.IsNullOrEmpty(alignment) && Enum.TryParse(alignment, true, out TextAnchor anchor))
                textComp.alignment = anchor;

            return new ToolResult
            {
                success = true,
                message = $"Set text on '{go.name}'"
            };
        }

        private static ToolResult SetUIImage(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            Image image = go.GetComponent<Image>();
            if (image == null)
                return Fail($"No Image component found on '{targetName}'");

            Undo.RecordObject(image, "Set UI image");

            string spritePath = GetParam(p, "sprite", "");
            if (!string.IsNullOrEmpty(spritePath))
            {
                Sprite sprite = AssetDatabase.LoadAssetAtPath<Sprite>(spritePath);
                if (sprite != null) image.sprite = sprite;
            }

            string colorStr = GetParam(p, "color", "");
            if (!string.IsNullOrEmpty(colorStr) && TryParseColor(colorStr, out Color color))
                image.color = color;

            string imageType = GetParam(p, "image_type", "");
            if (!string.IsNullOrEmpty(imageType) && Enum.TryParse(imageType, true, out Image.Type iType))
                image.type = iType;

            string fillAmount = GetParam(p, "fill_amount", "");
            if (!string.IsNullOrEmpty(fillAmount))
                image.fillAmount = float.Parse(fillAmount, System.Globalization.CultureInfo.InvariantCulture);

            return new ToolResult
            {
                success = true,
                message = $"Updated image on '{go.name}'"
            };
        }

        private static ToolResult SetUIColor(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string colorStr = GetRequiredParam(p, "color");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            if (!TryParseColor(colorStr, out Color color))
                return Fail($"Invalid color: {colorStr}");

            Graphic graphic = go.GetComponent<Graphic>();
            if (graphic == null)
                return Fail($"No UI Graphic component found on '{targetName}'");

            Undo.RecordObject(graphic, "Set UI color");
            graphic.color = color;

            return new ToolResult
            {
                success = true,
                message = $"Set color on '{go.name}' to {color}"
            };
        }

        private static ToolResult SetUIAnchor(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            RectTransform rt = go.GetComponent<RectTransform>();
            if (rt == null)
                return Fail($"No RectTransform on '{targetName}'");

            Undo.RecordObject(rt, "Set UI anchor");

            string preset = GetParam(p, "preset", "");
            if (!string.IsNullOrEmpty(preset))
            {
                switch (preset.ToLower().Replace(" ", "_"))
                {
                    case "top_left":
                        rt.anchorMin = new Vector2(0, 1); rt.anchorMax = new Vector2(0, 1);
                        rt.pivot = new Vector2(0, 1); break;
                    case "top_center":
                        rt.anchorMin = new Vector2(0.5f, 1); rt.anchorMax = new Vector2(0.5f, 1);
                        rt.pivot = new Vector2(0.5f, 1); break;
                    case "top_right":
                        rt.anchorMin = new Vector2(1, 1); rt.anchorMax = new Vector2(1, 1);
                        rt.pivot = new Vector2(1, 1); break;
                    case "middle_left":
                        rt.anchorMin = new Vector2(0, 0.5f); rt.anchorMax = new Vector2(0, 0.5f);
                        rt.pivot = new Vector2(0, 0.5f); break;
                    case "middle_center": case "center":
                        rt.anchorMin = new Vector2(0.5f, 0.5f); rt.anchorMax = new Vector2(0.5f, 0.5f);
                        rt.pivot = new Vector2(0.5f, 0.5f); break;
                    case "middle_right":
                        rt.anchorMin = new Vector2(1, 0.5f); rt.anchorMax = new Vector2(1, 0.5f);
                        rt.pivot = new Vector2(1, 0.5f); break;
                    case "bottom_left":
                        rt.anchorMin = new Vector2(0, 0); rt.anchorMax = new Vector2(0, 0);
                        rt.pivot = new Vector2(0, 0); break;
                    case "bottom_center":
                        rt.anchorMin = new Vector2(0.5f, 0); rt.anchorMax = new Vector2(0.5f, 0);
                        rt.pivot = new Vector2(0.5f, 0); break;
                    case "bottom_right":
                        rt.anchorMin = new Vector2(1, 0); rt.anchorMax = new Vector2(1, 0);
                        rt.pivot = new Vector2(1, 0); break;
                    case "stretch_horizontal":
                        rt.anchorMin = new Vector2(0, 0.5f); rt.anchorMax = new Vector2(1, 0.5f);
                        rt.pivot = new Vector2(0.5f, 0.5f); break;
                    case "stretch_vertical":
                        rt.anchorMin = new Vector2(0.5f, 0); rt.anchorMax = new Vector2(0.5f, 1);
                        rt.pivot = new Vector2(0.5f, 0.5f); break;
                    case "stretch":
                        rt.anchorMin = Vector2.zero; rt.anchorMax = Vector2.one;
                        rt.pivot = new Vector2(0.5f, 0.5f);
                        rt.offsetMin = Vector2.zero; rt.offsetMax = Vector2.zero; break;
                    default:
                        return Fail($"Unknown anchor preset: {preset}");
                }
            }
            else
            {
                string anchorMin = GetParam(p, "anchor_min", "");
                if (!string.IsNullOrEmpty(anchorMin) && TryParseVector2(anchorMin, out Vector2 min))
                    rt.anchorMin = min;

                string anchorMax = GetParam(p, "anchor_max", "");
                if (!string.IsNullOrEmpty(anchorMax) && TryParseVector2(anchorMax, out Vector2 max))
                    rt.anchorMax = max;

                string pivot = GetParam(p, "pivot", "");
                if (!string.IsNullOrEmpty(pivot) && TryParseVector2(pivot, out Vector2 pv))
                    rt.pivot = pv;
            }

            return new ToolResult
            {
                success = true,
                message = $"Set anchor on '{go.name}'"
            };
        }

        private static ToolResult SetUILayout(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string layoutType = GetRequiredParam(p, "layout_type");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            switch (layoutType.ToLower())
            {
                case "horizontal":
                    HorizontalLayoutGroup hlg = go.GetComponent<HorizontalLayoutGroup>();
                    if (hlg == null) hlg = Undo.AddComponent<HorizontalLayoutGroup>(go);
                    Undo.RecordObject(hlg, "Set horizontal layout");
                    string hSpacing = GetParam(p, "spacing", "");
                    if (!string.IsNullOrEmpty(hSpacing))
                        hlg.spacing = float.Parse(hSpacing, System.Globalization.CultureInfo.InvariantCulture);
                    string hPadding = GetParam(p, "padding", "");
                    if (!string.IsNullOrEmpty(hPadding))
                    {
                        int pad = int.Parse(hPadding);
                        hlg.padding = new RectOffset(pad, pad, pad, pad);
                    }
                    string hChildAlign = GetParam(p, "child_alignment", "");
                    if (!string.IsNullOrEmpty(hChildAlign) && Enum.TryParse(hChildAlign, true, out TextAnchor hAlign))
                        hlg.childAlignment = hAlign;
                    break;

                case "vertical":
                    VerticalLayoutGroup vlg = go.GetComponent<VerticalLayoutGroup>();
                    if (vlg == null) vlg = Undo.AddComponent<VerticalLayoutGroup>(go);
                    Undo.RecordObject(vlg, "Set vertical layout");
                    string vSpacing = GetParam(p, "spacing", "");
                    if (!string.IsNullOrEmpty(vSpacing))
                        vlg.spacing = float.Parse(vSpacing, System.Globalization.CultureInfo.InvariantCulture);
                    string vPadding = GetParam(p, "padding", "");
                    if (!string.IsNullOrEmpty(vPadding))
                    {
                        int pad = int.Parse(vPadding);
                        vlg.padding = new RectOffset(pad, pad, pad, pad);
                    }
                    string vChildAlign = GetParam(p, "child_alignment", "");
                    if (!string.IsNullOrEmpty(vChildAlign) && Enum.TryParse(vChildAlign, true, out TextAnchor vAlign))
                        vlg.childAlignment = vAlign;
                    break;

                case "grid":
                    GridLayoutGroup glg = go.GetComponent<GridLayoutGroup>();
                    if (glg == null) glg = Undo.AddComponent<GridLayoutGroup>(go);
                    Undo.RecordObject(glg, "Set grid layout");
                    string cellSize = GetParam(p, "cell_size", "");
                    if (!string.IsNullOrEmpty(cellSize) && TryParseVector2(cellSize, out Vector2 cs))
                        glg.cellSize = cs;
                    string gSpacing = GetParam(p, "spacing", "");
                    if (!string.IsNullOrEmpty(gSpacing) && TryParseVector2(gSpacing, out Vector2 gs))
                        glg.spacing = gs;
                    string constraint = GetParam(p, "constraint", "");
                    if (!string.IsNullOrEmpty(constraint) && Enum.TryParse(constraint, true, out GridLayoutGroup.Constraint gc))
                        glg.constraint = gc;
                    string constraintCount = GetParam(p, "constraint_count", "");
                    if (!string.IsNullOrEmpty(constraintCount))
                        glg.constraintCount = int.Parse(constraintCount);
                    break;

                default:
                    return Fail($"Unknown layout type: {layoutType}. Valid: horizontal, vertical, grid");
            }

            return new ToolResult
            {
                success = true,
                message = $"Set {layoutType} layout on '{go.name}'"
            };
        }

        // --- Helpers ---

        private static DefaultControls.Resources GetUIResources()
        {
            DefaultControls.Resources resources = new DefaultControls.Resources();
            resources.standard = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/UISprite.psd");
            resources.background = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Background.psd");
            resources.inputField = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/InputFieldBackground.psd");
            resources.knob = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Knob.psd");
            resources.checkmark = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Checkmark.psd");
            resources.dropdown = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/DropdownArrow.psd");
            resources.mask = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/UIMask.psd");
            return resources;
        }

        private static void ApplyRectTransformParams(RectTransform rt, Dictionary<string, string> p)
        {
            string posX = GetParam(p, "pos_x", "");
            string posY = GetParam(p, "pos_y", "");
            if (!string.IsNullOrEmpty(posX) || !string.IsNullOrEmpty(posY))
            {
                Vector2 pos = rt.anchoredPosition;
                if (!string.IsNullOrEmpty(posX))
                    pos.x = float.Parse(posX, System.Globalization.CultureInfo.InvariantCulture);
                if (!string.IsNullOrEmpty(posY))
                    pos.y = float.Parse(posY, System.Globalization.CultureInfo.InvariantCulture);
                rt.anchoredPosition = pos;
            }

            string width = GetParam(p, "width", "");
            string height = GetParam(p, "height", "");
            if (!string.IsNullOrEmpty(width) || !string.IsNullOrEmpty(height))
            {
                Vector2 size = rt.sizeDelta;
                if (!string.IsNullOrEmpty(width))
                    size.x = float.Parse(width, System.Globalization.CultureInfo.InvariantCulture);
                if (!string.IsNullOrEmpty(height))
                    size.y = float.Parse(height, System.Globalization.CultureInfo.InvariantCulture);
                rt.sizeDelta = size;
            }
        }

        private static bool TryParseColor(string s, out Color color)
        {
            color = Color.white;
            if (string.IsNullOrEmpty(s)) return false;
            s = s.Trim();
            if (s.StartsWith("#")) return ColorUtility.TryParseHtmlString(s, out color);
            switch (s.ToLower())
            {
                case "red": color = Color.red; return true;
                case "green": color = Color.green; return true;
                case "blue": color = Color.blue; return true;
                case "white": color = Color.white; return true;
                case "black": color = Color.black; return true;
                case "yellow": color = Color.yellow; return true;
                case "cyan": color = Color.cyan; return true;
                case "magenta": color = Color.magenta; return true;
                case "gray": case "grey": color = Color.gray; return true;
            }
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

        private static bool TryParseVector2(string s, out Vector2 v)
        {
            v = Vector2.zero;
            if (string.IsNullOrEmpty(s)) return false;
            string cleaned = s.Trim('[', ']', '(', ')');
            string[] parts = cleaned.Split(',');
            if (parts.Length >= 2
                && float.TryParse(parts[0].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float x)
                && float.TryParse(parts[1].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float y))
            {
                v = new Vector2(x, y);
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
