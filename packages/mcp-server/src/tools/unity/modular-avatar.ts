import { ToolDefinition } from "../../registry.js";

const modularAvatarTools: ToolDefinition[] = [
  {
    name: "setup_modular_avatar",
    description: "Check if Modular Avatar is installed in the project and return status, version, and available component types",
    category: "modular-avatar",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "add_ma_merge_armature",
    description: "Add a ModularAvatarMergeArmature component to an outfit root GameObject for clothing integration with an avatar",
    category: "modular-avatar",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID of the outfit root to add the component to" },
        merge_target: { type: "string", description: "GameObject name or ID of the avatar armature to merge into" },
        prefix: { type: "string", description: "Prefix for merged bones (optional)" },
        locked: { type: "boolean", description: "Whether the merge armature is locked" },
      },
      required: ["target"],
    },
  },
  {
    name: "add_ma_bone_proxy",
    description: "Add a ModularAvatarBoneProxy component for referencing bones across different outfits or avatar hierarchies",
    category: "modular-avatar",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID to add the bone proxy to" },
        bone_target: { type: "string", description: "GameObject name or ID of the bone to reference" },
      },
      required: ["target"],
    },
  },
  {
    name: "add_ma_menu_item",
    description: "Add a ModularAvatarMenuItem component for creating VRChat expression menu entries",
    category: "modular-avatar",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID to add the menu item to" },
        label: { type: "string", description: "Display label for the menu item" },
        menu_type: { type: "string", description: "Menu control type: Toggle, Button, SubMenu, TwoAxis, FourAxis, Radial", default: "Toggle" },
        parameter: { type: "string", description: "Parameter name for the menu control" },
        value: { type: "number", description: "Parameter value when activated" },
      },
      required: ["target"],
    },
  },
  {
    name: "add_ma_toggle",
    description: "Add a ModularAvatarObjectToggle component for ON/OFF switching of GameObjects via expressions",
    category: "modular-avatar",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID to add the toggle to" },
        objects: { type: "string", description: "Comma-separated list of GameObject names to toggle" },
      },
      required: ["target"],
    },
  },
  {
    name: "add_ma_blendshape_sync",
    description: "Add a ModularAvatarBlendshapeSync component for syncing blendshapes between meshes (e.g., outfit to body)",
    category: "modular-avatar",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID to add the sync to" },
        bindings: { type: "string", description: "Blendshape bindings in format: meshName:sourceBlendshape=targetBlendshape,..." },
      },
      required: ["target"],
    },
  },
  {
    name: "add_ma_parameters",
    description: "Add a ModularAvatarParameters component for defining synced expression parameters",
    category: "modular-avatar",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID to add parameters to" },
        parameters: { type: "string", description: "Parameter definitions in format: name:type:default:saved,... (type: Bool, Int, Float)" },
      },
      required: ["target"],
    },
  },
  {
    name: "remove_ma_component",
    description: "Remove a Modular Avatar component from a GameObject. If no component_type specified, removes all MA components.",
    category: "modular-avatar",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "GameObject name or ID" },
        component_type: { type: "string", description: "Specific MA component type to remove (e.g., MergeArmature, BoneProxy). Omit to remove all." },
      },
      required: ["target"],
    },
  },
  {
    name: "list_ma_components",
    description: "List all Modular Avatar components in a GameObject hierarchy with their properties",
    category: "modular-avatar",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Root GameObject name or ID to search from" },
        recursive: { type: "boolean", description: "Search child objects recursively", default: true },
      },
      required: ["target"],
    },
  },
  {
    name: "auto_setup_outfit",
    description: "One-click outfit setup: automatically adds MAMergeArmature to outfit root, detects bone mappings, and configures blendshape sync between outfit and avatar meshes",
    category: "modular-avatar",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        outfit: { type: "string", description: "GameObject name or ID of the outfit root" },
        avatar: { type: "string", description: "GameObject name or ID of the avatar root (for bone matching and blendshape sync)" },
      },
      required: ["outfit"],
    },
  },
];

export default modularAvatarTools;
