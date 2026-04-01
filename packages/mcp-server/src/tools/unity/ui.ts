import { ToolDefinition } from "../../registry.js";

const uiTools: ToolDefinition[] = [
  {
    name: "create_canvas",
    description: "Create a UI Canvas with optional render mode and scaler settings",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Canvas name" },
        render_mode: { type: "string", enum: ["screen_space_overlay", "screen_space_camera", "world_space"], description: "Canvas render mode" },
        camera: { type: "string", description: "Camera name for screen_space_camera mode" },
        scale_mode: { type: "string", description: "Canvas scaler mode (e.g. scale_with_screen_size)" },
        reference_resolution: { type: "string", description: "Reference resolution as 'width,height'" },
      },
      required: [],
    },
  },
  {
    name: "create_button",
    description: "Create a UI Button element with text",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Button name" },
        text: { type: "string", description: "Button label text" },
        pos_x: { type: "number", description: "X position" },
        pos_y: { type: "number", description: "Y position" },
        width: { type: "number", description: "Button width" },
        height: { type: "number", description: "Button height" },
      },
      required: [],
    },
  },
  {
    name: "create_text",
    description: "Create a UI Text element",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Text element name" },
        text: { type: "string", description: "Text content" },
        font_size: { type: "number", description: "Font size", default: 14 },
        color: { type: "string", description: "Text color (hex, rgba, or named)" },
        alignment: { type: "string", description: "Text alignment (e.g. MiddleCenter, UpperLeft)" },
        pos_x: { type: "number", description: "X position" },
        pos_y: { type: "number", description: "Y position" },
      },
      required: [],
    },
  },
  {
    name: "create_image",
    description: "Create a UI Image element",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Image element name" },
        sprite: { type: "string", description: "Sprite asset path" },
        color: { type: "string", description: "Image tint color" },
        image_type: { type: "string", description: "Image type: Simple, Sliced, Tiled, Filled" },
        width: { type: "number", description: "Image width" },
        height: { type: "number", description: "Image height" },
      },
      required: [],
    },
  },
  {
    name: "create_slider",
    description: "Create a UI Slider element",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Slider name" },
        min_value: { type: "number", description: "Minimum value", default: 0 },
        max_value: { type: "number", description: "Maximum value", default: 1 },
        value: { type: "number", description: "Initial value" },
        whole_numbers: { type: "boolean", description: "Restrict to whole numbers" },
      },
      required: [],
    },
  },
  {
    name: "create_toggle",
    description: "Create a UI Toggle (checkbox) element",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Toggle name" },
        label: { type: "string", description: "Toggle label text" },
        is_on: { type: "boolean", description: "Initial toggle state" },
      },
      required: [],
    },
  },
  {
    name: "create_input_field",
    description: "Create a UI Input Field for text entry",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Input field name" },
        placeholder: { type: "string", description: "Placeholder text" },
        content_type: { type: "string", description: "Content type: Standard, IntegerNumber, DecimalNumber, Password, EmailAddress" },
      },
      required: [],
    },
  },
  {
    name: "create_dropdown",
    description: "Create a UI Dropdown selection element",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Dropdown name" },
        options: { type: "string", description: "Comma-separated list of options" },
      },
      required: [],
    },
  },
  {
    name: "create_scroll_view",
    description: "Create a scrollable UI container",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Scroll view name" },
        horizontal: { type: "boolean", description: "Enable horizontal scrolling" },
        vertical: { type: "boolean", description: "Enable vertical scrolling" },
        width: { type: "number", description: "Scroll view width" },
        height: { type: "number", description: "Scroll view height" },
      },
      required: [],
    },
  },
  {
    name: "create_panel",
    description: "Create a UI Panel background element",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Panel name" },
        color: { type: "string", description: "Panel background color" },
        width: { type: "number", description: "Panel width" },
        height: { type: "number", description: "Panel height" },
      },
      required: [],
    },
  },
  {
    name: "set_ui_text",
    description: "Set the text content and properties of a UI Text component",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID with a Text component" },
        text: { type: "string", description: "New text content" },
        font_size: { type: "number", description: "Font size" },
        color: { type: "string", description: "Text color" },
        alignment: { type: "string", description: "Text alignment" },
      },
      required: ["target", "text"],
    },
  },
  {
    name: "set_ui_image",
    description: "Set sprite and properties of a UI Image component",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID with an Image component" },
        sprite: { type: "string", description: "Sprite asset path" },
        color: { type: "string", description: "Image tint color" },
        image_type: { type: "string", description: "Image type" },
        fill_amount: { type: "number", description: "Fill amount (0-1) for filled images" },
      },
      required: ["target"],
    },
  },
  {
    name: "set_ui_color",
    description: "Set the color of any UI Graphic component",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        color: { type: "string", description: "Color (hex, rgba, or named)" },
      },
      required: ["target", "color"],
    },
  },
  {
    name: "set_ui_anchor",
    description: "Set the anchor preset or custom anchors of a UI RectTransform",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        preset: { type: "string", description: "Anchor preset: top_left, top_center, top_right, middle_left, center, middle_right, bottom_left, bottom_center, bottom_right, stretch_horizontal, stretch_vertical, stretch" },
        anchor_min: { type: "string", description: "Custom anchor min as 'x,y'" },
        anchor_max: { type: "string", description: "Custom anchor max as 'x,y'" },
        pivot: { type: "string", description: "Pivot point as 'x,y'" },
      },
      required: ["target"],
    },
  },
  {
    name: "set_ui_layout",
    description: "Add a layout group (horizontal, vertical, or grid) to organize child UI elements",
    category: "ui",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        layout_type: { type: "string", enum: ["horizontal", "vertical", "grid"], description: "Layout type" },
        spacing: { type: "string", description: "Spacing between elements" },
        padding: { type: "string", description: "Uniform padding value" },
        child_alignment: { type: "string", description: "Child alignment (e.g. MiddleCenter)" },
        cell_size: { type: "string", description: "Grid cell size as 'width,height'" },
      },
      required: ["target", "layout_type"],
    },
  },
];

export default uiTools;
