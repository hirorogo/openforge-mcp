import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ExtensionManager } from "../extension.js";
import { ToolRegistry } from "../registry.js";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("ExtensionManager", () => {
  let manager: ExtensionManager;
  let tempDir: string;

  beforeEach(async () => {
    manager = new ExtensionManager();
    tempDir = await mkdtemp(join(tmpdir(), "ext-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("C# attribute parsing", () => {
    it("should parse a basic OpenForgeTool attribute", () => {
      const content = `
using OpenForge.Editor;

public class MyTools
{
    [OpenForgeTool("spawn_enemy", "Spawn an enemy at position")]
    public static ToolResult SpawnEnemy(string enemyType, float x, float y)
    {
        return new ToolResult { success = true };
    }
}`;
      manager.parseCSharpFile(content, "MyTools.cs");
      const extensions = manager.getExtensions();
      expect(extensions).toHaveLength(1);
      expect(extensions[0].name).toBe("spawn_enemy");
      expect(extensions[0].description).toBe("Spawn an enemy at position");
      expect(extensions[0].source).toBe("unity");
      expect(extensions[0].parameters).toContain("enemyType");
      expect(extensions[0].parameters).toContain("x");
      expect(extensions[0].parameters).toContain("y");
    });

    it("should parse multiple attributes in one file", () => {
      const content = `
[OpenForgeTool("tool_a", "First tool")]
public static void ToolA(string name)
{
}

[OpenForgeTool("tool_b", "Second tool")]
public static void ToolB(int count, string label)
{
}`;
      manager.parseCSharpFile(content, "Multi.cs");
      const extensions = manager.getExtensions();
      expect(extensions).toHaveLength(2);
      expect(extensions[0].name).toBe("tool_a");
      expect(extensions[1].name).toBe("tool_b");
      expect(extensions[1].parameters).toEqual(["count", "label"]);
    });

    it("should parse attribute with no parameters", () => {
      const content = `
[OpenForgeTool("reset_all", "Reset everything")]
public static void ResetAll()
{
}`;
      manager.parseCSharpFile(content, "NoParams.cs");
      const extensions = manager.getExtensions();
      expect(extensions).toHaveLength(1);
      expect(extensions[0].parameters).toEqual([]);
    });

    it("should scan directory and find C# files", async () => {
      const csContent = `
[OpenForgeTool("my_tool", "A custom tool")]
public static void MyTool(string arg1)
{
}`;
      await writeFile(join(tempDir, "CustomTool.cs"), csContent, "utf-8");

      const found = await manager.scanForExtensions(tempDir);
      expect(found).toHaveLength(1);
      expect(found[0].name).toBe("my_tool");
      expect(found[0].filePath).toContain("CustomTool.cs");
    });
  });

  describe("Python decorator parsing", () => {
    it("should parse a basic openforge_tool decorator", () => {
      const content = `
from openforge_tool import openforge_tool

@openforge_tool("place_object", "Place an object in the scene")
def place_object(name: str, x: float, y: float, z: float):
    pass
`;
      manager.parsePythonFile(content, "my_addon.py");
      const extensions = manager.getExtensions();
      expect(extensions).toHaveLength(1);
      expect(extensions[0].name).toBe("place_object");
      expect(extensions[0].description).toBe("Place an object in the scene");
      expect(extensions[0].source).toBe("blender");
      expect(extensions[0].parameters).toContain("name");
      expect(extensions[0].parameters).toContain("x");
      expect(extensions[0].parameters).toContain("y");
      expect(extensions[0].parameters).toContain("z");
    });

    it("should parse multiple decorators in one file", () => {
      const content = `
@openforge_tool("tool_x", "Tool X")
def tool_x(a: str):
    pass

@openforge_tool("tool_y", "Tool Y")
def tool_y(b: int, c: str):
    pass
`;
      manager.parsePythonFile(content, "multi.py");
      const extensions = manager.getExtensions();
      expect(extensions).toHaveLength(2);
      expect(extensions[0].name).toBe("tool_x");
      expect(extensions[1].name).toBe("tool_y");
      expect(extensions[1].parameters).toEqual(["b", "c"]);
    });

    it("should skip self parameter in methods", () => {
      const content = `
@openforge_tool("method_tool", "A method tool")
def method_tool(self, name: str):
    pass
`;
      manager.parsePythonFile(content, "method.py");
      const extensions = manager.getExtensions();
      expect(extensions).toHaveLength(1);
      expect(extensions[0].parameters).toEqual(["name"]);
    });

    it("should scan directory and find Python files", async () => {
      const pyContent = `
@openforge_tool("py_tool", "A python tool")
def py_tool(value: str):
    pass
`;
      await writeFile(join(tempDir, "addon.py"), pyContent, "utf-8");

      const found = await manager.scanForExtensions(tempDir);
      expect(found).toHaveLength(1);
      expect(found[0].name).toBe("py_tool");
      expect(found[0].source).toBe("blender");
    });
  });

  describe("extension registration", () => {
    it("should register discovered tools into the registry", async () => {
      const csContent = `
[OpenForgeTool("custom_tool", "A custom tool")]
public static void CustomTool(string param1)
{
}`;
      await writeFile(join(tempDir, "Custom.cs"), csContent, "utf-8");
      await manager.scanForExtensions(tempDir);

      const registry = new ToolRegistry();
      registry.setMode("full");
      const count = manager.registerDiscoveredTools(registry);
      expect(count).toBe(1);

      const tool = registry.getTool("unity", "custom_tool");
      expect(tool).toBeDefined();
      expect(tool!.description).toBe("A custom tool");
      expect(tool!.category).toBe("extension");
    });

    it("should register blender extensions with correct target", async () => {
      const pyContent = `
@openforge_tool("blend_tool", "A blender tool")
def blend_tool(arg: str):
    pass
`;
      await writeFile(join(tempDir, "blend.py"), pyContent, "utf-8");
      await manager.scanForExtensions(tempDir);

      const registry = new ToolRegistry();
      registry.setMode("full");
      const count = manager.registerDiscoveredTools(registry);
      expect(count).toBe(1);

      const tool = registry.getTool("blender", "blend_tool");
      expect(tool).toBeDefined();
      expect(tool!.target).toBe("blender");
    });
  });

  describe("getExtensionCount", () => {
    it("should return 0 initially", () => {
      expect(manager.getExtensionCount()).toBe(0);
    });

    it("should return correct count after scanning", async () => {
      const csContent = `
[OpenForgeTool("tool1", "Tool one")]
public static void Tool1(string a)
{
}

[OpenForgeTool("tool2", "Tool two")]
public static void Tool2(int b)
{
}`;
      await writeFile(join(tempDir, "Tools.cs"), csContent, "utf-8");
      await manager.scanForExtensions(tempDir);
      expect(manager.getExtensionCount()).toBe(2);
    });
  });

  describe("recursive scanning", () => {
    it("should scan subdirectories", async () => {
      const subDir = join(tempDir, "sub", "deep");
      await mkdir(subDir, { recursive: true });
      const csContent = `
[OpenForgeTool("nested_tool", "A nested tool")]
public static void NestedTool(string x)
{
}`;
      await writeFile(join(subDir, "Nested.cs"), csContent, "utf-8");

      const found = await manager.scanForExtensions(tempDir);
      expect(found).toHaveLength(1);
      expect(found[0].name).toBe("nested_tool");
    });

    it("should skip hidden directories", async () => {
      const hiddenDir = join(tempDir, ".hidden");
      await mkdir(hiddenDir, { recursive: true });
      const csContent = `
[OpenForgeTool("hidden_tool", "Should not be found")]
public static void HiddenTool(string x)
{
}`;
      await writeFile(join(hiddenDir, "Hidden.cs"), csContent, "utf-8");

      const found = await manager.scanForExtensions(tempDir);
      expect(found).toHaveLength(0);
    });
  });
});
