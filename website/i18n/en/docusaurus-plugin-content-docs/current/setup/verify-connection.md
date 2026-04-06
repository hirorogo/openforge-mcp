---
sidebar_position: 6
title: "Verify Your Connection"
---

# Verify Your Connection -- "Is it actually connected?"

MCP tools **do not work just by installing them**. The AI client and MCP server must be correctly connected before the AI can use the tools.

If you skip this check, the AI ends up in a state where it "has eyes and hands but cannot use them". Repeated compile errors, guessing at non-existent APIs -- the root cause of these issues is often **a connection problem**, not a lack of AI capability.

---

## How to verify in 30 seconds

Open your AI client (Claude Desktop, Cursor, VS Code, etc.) and ask:

```
List all MCP servers and tools you currently have access to
```

**Expected response when connected:**

```
Available MCP server: openforge-mcp
Tools: list_categories, list_tools, execute
Categories: scene, gameobject, material, script, ...
```

**Response when not connected:**

```
No MCP tools are available
```

If the tools do not appear, check the following.

---

## Understanding the three-layer architecture of MCP

For MCP to work, all three layers must be correctly connected.

```
+-------------------------+
|  AI Model               |  Claude / GPT / Gemini
|  Only "thinks"          |  Knows nothing about MCP
+------------+------------+
             |
+------------+------------+
|  AI Client              |  Claude Desktop / Cursor / VS Code
|  Decides "which MCP     |  <-- Configuration goes here
|  to connect to"         |
+------------+------------+
             |
+------------+------------+
|  MCP Server             |  OpenForge MCP
|  Provides "what it      |  Installing alone does not
|  can do"                |  connect it to the layer above
+-------------------------+
```

Common failure patterns:
- Installed the Unity plugin, but the AI client's configuration file does not list the MCP server
- The MCP server is running, but the AI client is looking at a different process
- The configuration file has an entry, but the path is wrong (e.g., a Mac path on a Windows machine)

---

## Configuration file locations by AI client

| AI Client | Configuration file location |
|-----------|---------------------------|
| Claude Desktop (Mac) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Win) | `%APPDATA%/Claude/claude_desktop_config.json` |
| Claude Desktop (Linux) | `~/.config/Claude/claude_desktop_config.json` |
| Cursor | `~/.cursor/mcp.json` |
| VS Code | `.vscode/mcp.json` (project level) |
| Claude Code | `.mcp.json` (project) or `~/.claude/settings.json` (global) |
| LM Studio | `~/.lmstudio/mcp.json` |

:::warning Verify the configuration file is in the right place
The `npx openforge-mcp setup` command auto-detects and writes the configuration, but it is worth double-checking manually.
:::

---

## Verify the configuration file contents

Correct configuration example (Claude Desktop / Cursor):

```json
{
  "mcpServers": {
    "openforge": {
      "command": "node",
      "args": ["/path/to/openforge-mcp/packages/mcp-server/dist/index.js"],
      "env": {}
    }
  }
}
```

For VS Code (note the key is `"servers"`, not `"mcpServers"`):

```json
{
  "servers": {
    "openforge": {
      "command": "node",
      "args": ["/path/to/openforge-mcp/packages/mcp-server/dist/index.js"],
      "env": {}
    }
  }
}
```

:::tip Use automatic setup
```bash
npx openforge-mcp setup
```
This command writes the correct configuration automatically. Run it if you are unsure about manual editing.
:::

---

## Checklist

If something is not working, check from top to bottom:

### 1. Is Node.js installed?
```bash
node -v
```
If a version number appears, you are good. If not, [install Node.js](./prerequisites/node-install.md).

### 2. Is the OpenForge setup complete?
```bash
npx openforge-mcp setup
```
If `[OK]` appears, you are good.

### 3. Did you restart the AI client?
After changing the configuration file, you need to **fully quit and restart** the AI client.

### 4. Is the Unity / Blender plugin running?
- Unity: Check that "Connected" is displayed under `Tools > OpenForge > Setup`
- Blender: Check that "Running" is displayed in the "OpenForge" tab of the N Panel

### 5. Is there a port conflict?
Ports used by OpenForge:
- Unity: 19800
- Blender: 19801
- Godot: 19802
- HTTP API: 19810
- Dashboard: 19821

If another application is using the same port, the connection will fail.

### 6. Is a firewall blocking it?
Localhost communication may be blocked by a firewall.

---

## If it still does not work

### Test directly with the HTTP API
```bash
curl http://localhost:19810/api/status
```

If a response comes back, the MCP server is running. If not, the server has not started.

### Check the logs
Look for OpenForge-related messages in the Unity Console (Window > Console).

### Start over with a fresh setup
```bash
npx openforge-mcp setup
```
Fully quit the AI client, then restart it.

---

## Summary

- MCP "installation" and "connection" are separate steps
- All three layers must be correctly linked for the AI to work at full capacity
- When the AI keeps producing errors, it may be a connection issue, not an AI limitation
- To verify: ask the AI "What tools do you have access to?"
