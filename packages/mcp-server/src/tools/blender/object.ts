import { ToolDefinition } from "../../registry.js";

const objectTools: ToolDefinition[] = [
  {
    name: "create_mesh",
    description: "Create a new mesh primitive object in the Blender scene",
    category: "object",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["cube", "sphere", "cylinder", "cone", "torus", "plane", "circle", "icosphere", "monkey"],
          description: "Type of mesh primitive to create",
        },
        name: {
          type: "string",
          description: "Name for the new object",
        },
        location: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            z: { type: "number" },
          },
          required: ["x", "y", "z"],
          description: "World location for the new object",
        },
        size: {
          type: "number",
          description: "Scale factor applied to the primitive at creation",
          default: 1.0,
        },
        segments: {
          type: "number",
          description: "Segment count for curved primitives (sphere, cylinder, etc.)",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "transform_object",
    description: "Set the location, rotation, and/or scale of a Blender object",
    category: "object",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the object to transform",
        },
        location: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            z: { type: "number" },
          },
          required: ["x", "y", "z"],
          description: "New world location",
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
      required: ["name"],
    },
  },
  {
    name: "duplicate_object",
    description: "Create a duplicate of an existing Blender object with optional linked data",
    category: "object",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the object to duplicate",
        },
        linked: {
          type: "boolean",
          description: "If true, create a linked duplicate sharing mesh data",
          default: false,
        },
        newName: {
          type: "string",
          description: "Name for the duplicate. If omitted, Blender assigns an auto-incremented name.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "delete_object",
    description: "Delete an object from the Blender scene",
    category: "object",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the object to delete",
        },
        deleteData: {
          type: "boolean",
          description: "If true, also remove the object's data block (mesh, curve, etc.) if no other users remain",
          default: true,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "set_origin",
    description: "Set the origin point of an object (pivot point for transformations)",
    category: "object",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the object",
        },
        type: {
          type: "string",
          enum: [
            "GEOMETRY_ORIGIN",
            "ORIGIN_GEOMETRY",
            "ORIGIN_CURSOR",
            "ORIGIN_CENTER_OF_MASS",
            "ORIGIN_CENTER_OF_VOLUME",
          ],
          description: "Origin calculation method",
        },
      },
      required: ["name", "type"],
    },
  },
  {
    name: "join_objects",
    description: "Join multiple objects into a single object by merging their mesh data",
    category: "object",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        targetName: {
          type: "string",
          description: "Name of the object that will receive the joined geometry (becomes the active object)",
        },
        sourceNames: {
          type: "array",
          items: { type: "string" },
          description: "Names of the objects to merge into the target",
        },
      },
      required: ["targetName", "sourceNames"],
    },
  },
  {
    name: "separate_mesh",
    description: "Separate parts of a mesh object into individual objects",
    category: "object",
    target: "blender",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the object to separate",
        },
        mode: {
          type: "string",
          enum: ["SELECTED", "MATERIAL", "LOOSE"],
          description: "Separation method: by selected geometry, by material slot, or by loose parts",
        },
      },
      required: ["name", "mode"],
    },
  },
];

export default objectTools;
