import { UnityAdapter } from "./adapters/unity.js";
import { BlenderAdapter } from "./adapters/blender.js";
import { GodotAdapter } from "./adapters/godot.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface ResourceContent {
  contents: Array<{
    uri: string;
    mimeType: string;
    text: string;
  }>;
}

export interface ResourceHandlerDeps {
  unityAdapter: UnityAdapter;
  blenderAdapter: BlenderAdapter;
  godotAdapter: GodotAdapter;
}

// ---------------------------------------------------------------------------
// Resource list
// ---------------------------------------------------------------------------

export function getResourceDefinitions(): ResourceDefinition[] {
  return [
    {
      uri: "scene://unity/hierarchy",
      name: "Unity Scene Hierarchy",
      description: "The current Unity scene hierarchy as a nested tree of GameObjects",
      mimeType: "application/json",
    },
    {
      uri: "scene://unity/console",
      name: "Unity Console Log",
      description: "Recent Unity Editor console log messages including errors, warnings, and info",
      mimeType: "application/json",
    },
    {
      uri: "scene://blender/objects",
      name: "Blender Scene Objects",
      description: "List of all objects in the current Blender scene with type and transform data",
      mimeType: "application/json",
    },
    {
      uri: "scene://godot/tree",
      name: "Godot Scene Tree",
      description: "The current Godot scene tree as a nested hierarchy of nodes",
      mimeType: "application/json",
    },
  ];
}

// ---------------------------------------------------------------------------
// Resource read handler
// ---------------------------------------------------------------------------

type ResourceReader = (uri: string) => Promise<ResourceContent>;

export function createResourceHandlers(deps: ResourceHandlerDeps): Map<string, ResourceReader> {
  const { unityAdapter, blenderAdapter, godotAdapter } = deps;

  const handlers = new Map<string, ResourceReader>();

  handlers.set("scene://unity/hierarchy", async (uri) => {
    if (!unityAdapter.isConnected()) {
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify({ error: "Unity is not connected" }),
          },
        ],
      };
    }
    try {
      const response = await unityAdapter.getHierarchy();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(response.result ?? response.error, null, 2),
          },
        ],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ error: msg }) }],
      };
    }
  });

  handlers.set("scene://unity/console", async (uri) => {
    if (!unityAdapter.isConnected()) {
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify({ error: "Unity is not connected" }),
          },
        ],
      };
    }
    try {
      const response = await unityAdapter.getConsoleLog();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(response.result ?? response.error, null, 2),
          },
        ],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ error: msg }) }],
      };
    }
  });

  handlers.set("scene://blender/objects", async (uri) => {
    if (!blenderAdapter.isConnected()) {
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify({ error: "Blender is not connected" }),
          },
        ],
      };
    }
    try {
      const response = await blenderAdapter.getObjects();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(response.result ?? response.error, null, 2),
          },
        ],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ error: msg }) }],
      };
    }
  });

  handlers.set("scene://godot/tree", async (uri) => {
    if (!godotAdapter.isConnected()) {
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify({ error: "Godot is not connected" }),
          },
        ],
      };
    }
    try {
      const response = await godotAdapter.getSceneTree();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(response.result ?? response.error, null, 2),
          },
        ],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ error: msg }) }],
      };
    }
  });

  return handlers;
}
