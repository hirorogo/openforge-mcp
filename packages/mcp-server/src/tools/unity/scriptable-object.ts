import { ToolDefinition } from "../../registry.js";

const scriptableObjectTools: ToolDefinition[] = [
  {
    name: "create_scriptable_object",
    description: "Create a new ScriptableObject asset from a type name",
    category: "scriptable-object",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "ScriptableObject type name (must exist in project)",
        },
        name: { type: "string", description: "Asset name" },
        path: {
          type: "string",
          description: "Asset save path (e.g. Assets/Data/myAsset.asset)",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "set_so_field",
    description: "Set a field value on a ScriptableObject asset",
    category: "scriptable-object",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Asset path of the ScriptableObject" },
        field: { type: "string", description: "Field name to set" },
        value: { type: "string", description: "Value to set (strings, numbers, booleans, vectors)" },
      },
      required: ["path", "field", "value"],
    },
  },
  {
    name: "get_so_fields",
    description: "Get all serialized fields and their values from a ScriptableObject",
    category: "scriptable-object",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Asset path of the ScriptableObject" },
      },
      required: ["path"],
    },
  },
  {
    name: "find_scriptable_objects",
    description: "Find all ScriptableObject assets of a given type in the project",
    category: "scriptable-object",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "ScriptableObject type name to search for" },
        folder: {
          type: "string",
          description: "Folder to search in (default: Assets)",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "duplicate_so",
    description: "Duplicate a ScriptableObject asset to a new path",
    category: "scriptable-object",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        source_path: { type: "string", description: "Source asset path" },
        dest_path: {
          type: "string",
          description: "Destination path (auto-generated if omitted)",
        },
      },
      required: ["source_path"],
    },
  },
  {
    name: "create_so_script",
    description:
      "Generate a C# ScriptableObject class template with specified fields",
    category: "scriptable-object",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        class_name: { type: "string", description: "Class name for the ScriptableObject" },
        menu_name: { type: "string", description: "CreateAssetMenu name" },
        fields: {
          type: "string",
          description:
            "Field definitions as 'name:type,name2:type2' (e.g. 'health:int,speed:float,name:string')",
        },
        namespace: { type: "string", description: "C# namespace" },
        path: {
          type: "string",
          description: "Save path for the generated script",
        },
      },
      required: ["class_name"],
    },
  },
];

export default scriptableObjectTools;
