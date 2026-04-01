import { ToolDefinition } from "../../registry.js";

const nodeTools: ToolDefinition[] = [
  {
    name: "create_node",
    description: "Create a new node in the Godot scene tree. Supports Node2D, Node3D, Sprite2D, MeshInstance3D, CharacterBody2D, CharacterBody3D, RigidBody2D, RigidBody3D, Area2D, Area3D, Camera2D, Camera3D, DirectionalLight3D, and more.",
    category: "node",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "The class name of the node to create (e.g. Node2D, Node3D, Sprite2D, MeshInstance3D, CharacterBody3D)",
        },
        name: {
          type: "string",
          description: "Name for the new node. If omitted, the type name is used.",
        },
        parentPath: {
          type: "string",
          description: "Node path of the parent to add this node to. Defaults to the scene root.",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "find_node",
    description: "Search the Godot scene tree for nodes matching a name pattern or class type",
    category: "node",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Name pattern to search for. Supports * wildcard.",
        },
        type: {
          type: "string",
          description: "Filter results to nodes of this class type (e.g. MeshInstance3D, Sprite2D)",
        },
        recursive: {
          type: "boolean",
          description: "Whether to search recursively through all descendants. Defaults to true.",
        },
      },
      required: [],
    },
  },
  {
    name: "delete_node",
    description: "Remove a node and all its children from the Godot scene tree",
    category: "node",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        nodePath: {
          type: "string",
          description: "Path to the node to delete (e.g. /root/Main/Player)",
        },
      },
      required: ["nodePath"],
    },
  },
  {
    name: "set_transform_2d",
    description: "Set position, rotation, and/or scale for a 2D node in Godot",
    category: "node",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        nodePath: {
          type: "string",
          description: "Path to the Node2D-derived node",
        },
        position: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
          },
          required: ["x", "y"],
          description: "Position in 2D space",
        },
        rotation: {
          type: "number",
          description: "Rotation in degrees",
        },
        scale: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
          },
          required: ["x", "y"],
          description: "Scale factors",
        },
      },
      required: ["nodePath"],
    },
  },
  {
    name: "set_transform_3d",
    description: "Set position, rotation, and/or scale for a 3D node in Godot",
    category: "node",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        nodePath: {
          type: "string",
          description: "Path to the Node3D-derived node",
        },
        position: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            z: { type: "number" },
          },
          required: ["x", "y", "z"],
          description: "Position in 3D space",
        },
        rotation: {
          type: "object",
          properties: {
            x: { type: "number", description: "Rotation around X axis in degrees" },
            y: { type: "number", description: "Rotation around Y axis in degrees" },
            z: { type: "number", description: "Rotation around Z axis in degrees" },
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
          description: "Scale factors",
        },
      },
      required: ["nodePath"],
    },
  },
  {
    name: "add_child",
    description: "Reparent a node by moving it under a new parent in the Godot scene tree",
    category: "node",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        nodePath: {
          type: "string",
          description: "Path to the node to reparent",
        },
        newParentPath: {
          type: "string",
          description: "Path to the new parent node",
        },
      },
      required: ["nodePath", "newParentPath"],
    },
  },
  {
    name: "duplicate_node",
    description: "Duplicate a node and its children in the Godot scene tree",
    category: "node",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        nodePath: {
          type: "string",
          description: "Path to the node to duplicate",
        },
        newName: {
          type: "string",
          description: "Name for the duplicated node. If omitted, Godot appends a numeric suffix.",
        },
      },
      required: ["nodePath"],
    },
  },
  {
    name: "set_property",
    description: "Set any property on a Godot node by property name. Works with all built-in and custom properties.",
    category: "node",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        nodePath: {
          type: "string",
          description: "Path to the target node",
        },
        property: {
          type: "string",
          description: "Property name (e.g. visible, modulate, text, mesh)",
        },
        value: {
          description: "Value to set. Type depends on the property (string, number, boolean, object for Vector/Color, etc.)",
        },
      },
      required: ["nodePath", "property", "value"],
    },
  },
  {
    name: "get_node_info",
    description: "Get detailed information about a specific node including its type, properties, children, and signals",
    category: "node",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        nodePath: {
          type: "string",
          description: "Path to the node to inspect",
        },
        includeProperties: {
          type: "boolean",
          description: "Include all property values. Defaults to true.",
        },
      },
      required: ["nodePath"],
    },
  },
  {
    name: "get_scene_tree",
    description: "Return the full Godot scene tree structure as a nested hierarchy",
    category: "node",
    target: "godot",
    parameters: {
      type: "object",
      properties: {
        maxDepth: {
          type: "number",
          description: "Maximum depth to traverse. -1 for unlimited. Defaults to -1.",
        },
        rootPath: {
          type: "string",
          description: "Path to start traversal from. Defaults to the scene root.",
        },
      },
      required: [],
    },
  },
];

export default nodeTools;
