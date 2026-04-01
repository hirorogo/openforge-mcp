import { ToolDefinition } from "../../registry.js";

const gameObjectTools: ToolDefinition[] = [
  {
    name: "create_gameobject",
    description: "Create a new GameObject in the Unity scene with optional primitive mesh type",
    category: "gameobject",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the new GameObject",
        },
        primitive: {
          type: "string",
          enum: ["cube", "sphere", "cylinder", "capsule", "plane", "quad", "empty"],
          description: "Primitive mesh type. Use 'empty' for a blank GameObject.",
          default: "empty",
        },
        position: {
          type: "object",
          properties: {
            x: { type: "number", description: "X position in world space" },
            y: { type: "number", description: "Y position in world space" },
            z: { type: "number", description: "Z position in world space" },
          },
          required: ["x", "y", "z"],
          description: "Initial world position",
        },
        parent: {
          type: "string",
          description: "Instance ID or path of the parent GameObject",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "find_gameobject",
    description: "Find GameObjects in the scene by name, tag, or component type",
    category: "gameobject",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Exact name or path to search for (e.g. 'Player' or '/Environment/Tree')",
        },
        tag: {
          type: "string",
          description: "Tag to filter by (e.g. 'Player', 'Enemy')",
        },
        component: {
          type: "string",
          description: "Component type name to filter by (e.g. 'MeshRenderer', 'Rigidbody')",
        },
      },
      required: [],
    },
  },
  {
    name: "destroy_gameobject",
    description: "Destroy a GameObject and all its children from the Unity scene",
    category: "gameobject",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Instance ID or hierarchical path of the GameObject to destroy",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "set_transform",
    description: "Set the position, rotation, and/or scale of a GameObject",
    category: "gameobject",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Instance ID or path of the target GameObject",
        },
        position: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            z: { type: "number" },
          },
          required: ["x", "y", "z"],
          description: "World position to set",
        },
        rotation: {
          type: "object",
          properties: {
            x: { type: "number", description: "Euler angle X in degrees" },
            y: { type: "number", description: "Euler angle Y in degrees" },
            z: { type: "number", description: "Euler angle Z in degrees" },
          },
          required: ["x", "y", "z"],
          description: "Euler rotation in degrees",
        },
        scale: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            z: { type: "number" },
          },
          required: ["x", "y", "z"],
          description: "Local scale",
        },
        local: {
          type: "boolean",
          description: "If true, position and rotation are in local space rather than world space",
          default: false,
        },
      },
      required: ["id"],
    },
  },
  {
    name: "set_active",
    description: "Enable or disable a GameObject in the Unity scene",
    category: "gameobject",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Instance ID or path of the target GameObject",
        },
        active: {
          type: "boolean",
          description: "True to activate, false to deactivate",
        },
      },
      required: ["id", "active"],
    },
  },
  {
    name: "add_component",
    description: "Add a component to a GameObject by type name",
    category: "gameobject",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Instance ID or path of the target GameObject",
        },
        component: {
          type: "string",
          description: "Fully qualified component type name (e.g. 'Rigidbody', 'BoxCollider', 'AudioSource')",
        },
        properties: {
          type: "object",
          description: "Key-value pairs of initial property values to set on the component",
          additionalProperties: true,
        },
      },
      required: ["id", "component"],
    },
  },
  {
    name: "remove_component",
    description: "Remove a component from a GameObject by type name",
    category: "gameobject",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Instance ID or path of the target GameObject",
        },
        component: {
          type: "string",
          description: "Component type name to remove",
        },
        index: {
          type: "number",
          description: "If multiple components of this type exist, remove the one at this index (0-based)",
          default: 0,
        },
      },
      required: ["id", "component"],
    },
  },
  {
    name: "get_components",
    description: "List all components attached to a GameObject with their serialized properties",
    category: "gameobject",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Instance ID or path of the target GameObject",
        },
        includeProperties: {
          type: "boolean",
          description: "Whether to include serialized property values for each component",
          default: false,
        },
      },
      required: ["id"],
    },
  },
  {
    name: "set_parent",
    description: "Change the parent of a GameObject in the hierarchy",
    category: "gameobject",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Instance ID or path of the GameObject to re-parent",
        },
        parentId: {
          type: "string",
          description: "Instance ID or path of the new parent. Pass an empty string to move to root.",
        },
        worldPositionStays: {
          type: "boolean",
          description: "If true, the world position of the object is maintained after re-parenting",
          default: true,
        },
      },
      required: ["id", "parentId"],
    },
  },
  {
    name: "duplicate",
    description: "Duplicate a GameObject and all its children, components, and property values",
    category: "gameobject",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Instance ID or path of the GameObject to duplicate",
        },
        newName: {
          type: "string",
          description: "Name for the duplicated object. If omitted, uses the original name with a suffix.",
        },
        count: {
          type: "number",
          description: "Number of copies to create",
          default: 1,
        },
      },
      required: ["id"],
    },
  },
];

export default gameObjectTools;
