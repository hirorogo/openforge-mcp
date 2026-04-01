import { ToolDefinition } from "../../registry.js";

const faceEmoTools: ToolDefinition[] = [
  {
    name: "setup_faceemo",
    description: "Check if FaceEmo is installed in the project and return status, version, and discovered types",
    category: "faceemo",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "create_expression_menu",
    description: "Create a FaceEmo expression menu asset for managing facial expressions",
    category: "faceemo",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the expression menu", default: "FaceEmo_ExpressionMenu" },
        path: { type: "string", description: "Asset path to save the menu (e.g., Assets/FaceEmo/Menu.asset)" },
      },
      required: [],
    },
  },
  {
    name: "add_expression",
    description: "Add a facial expression by specifying blendshape name and value pairs. Creates an animation clip representing the expression.",
    category: "faceemo",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID of the avatar" },
        expression_name: { type: "string", description: "Name for the expression (e.g., smile, angry)" },
        blendshapes: { type: "string", description: "Blendshape settings as comma-separated name=value pairs (e.g., mouth_smile=100,eye_smile=80)" },
        clip_path: { type: "string", description: "Optional asset path for the animation clip" },
      },
      required: ["target", "expression_name", "blendshapes"],
    },
  },
  {
    name: "add_gesture_expression",
    description: "Map a VRChat hand gesture (fist, open, point, peace, etc.) to a facial expression animation clip",
    category: "faceemo",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID of the avatar" },
        gesture: { type: "string", description: "Hand gesture: Neutral, Fist, HandOpen, FingerPoint, Victory, RockNRoll, HandGun, ThumbsUp" },
        expression_clip: { type: "string", description: "Asset path of the expression animation clip" },
        hand: { type: "string", description: "Which hand: Left or Right", default: "Left" },
      },
      required: ["target", "gesture", "expression_clip"],
    },
  },
  {
    name: "create_expression_preset",
    description: "Create a standard set of expression animation clips: smile, sad, angry, surprised, shy, wink, smug, neutral. Auto-matches blendshapes on the avatar.",
    category: "faceemo",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID of the avatar" },
        output_dir: { type: "string", description: "Directory to save expression clips", default: "Assets/FaceEmo/Expressions" },
      },
      required: ["target"],
    },
  },
  {
    name: "list_expressions",
    description: "List all configured FaceEmo expressions on an avatar, including blendshape settings for each",
    category: "faceemo",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID of the avatar" },
        search_dir: { type: "string", description: "Directory to search for expression clips", default: "Assets/FaceEmo" },
      },
      required: ["target"],
    },
  },
  {
    name: "remove_expression",
    description: "Remove an expression by deleting its animation clip asset",
    category: "faceemo",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        expression_name: { type: "string", description: "Name of the expression to remove" },
        clip_path: { type: "string", description: "Direct asset path of the clip to delete (optional, will search if not provided)" },
        search_dir: { type: "string", description: "Directory to search for the expression clip", default: "Assets/FaceEmo" },
      },
      required: ["expression_name"],
    },
  },
  {
    name: "auto_detect_blendshapes",
    description: "Scan all SkinnedMeshRenderers on an avatar and categorize blendshapes by facial region (eye, mouth, brow, cheek, nose, tongue, emotion, other)",
    category: "faceemo",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID of the avatar to scan" },
      },
      required: ["target"],
    },
  },
];

export default faceEmoTools;
