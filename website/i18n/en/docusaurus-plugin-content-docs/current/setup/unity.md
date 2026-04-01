---
sidebar_position: 2
---

# Unity Plugin

This page explains how to set up OpenForge MCP for use with Unity. Make sure you have completed the steps on the [Installation](./install.md) page first.

---

## Step 1: Install the Plugin

There are several ways to add the plugin to Unity. Here we will use the simplest method.

### Method A: Automatic Installation via the Setup Command (Recommended)

If you have already run `npx openforge-mcp setup`, the Unity plugin files have been downloaded.

1. Open your project in Unity
2. From the Unity menu bar, go to **Window** > **Package Manager**

[Screenshot: Opening Package Manager from the Window menu in Unity]

3. Click the **"+" button** in the upper-left corner of the Package Manager window

[Screenshot: The + button in the upper-left corner of Package Manager]

4. Select **"Add package from disk..."**

[Screenshot: Selecting "Add package from disk..." from the dropdown menu]

5. A file selection dialog will open. Navigate to the following folder:
   - **Windows:** `C:\Users\YourUsername\.openforge-mcp\unity-plugin\package.json`
   - **Mac:** `/Users/YourUsername/.openforge-mcp/unity-plugin/package.json`

6. Select `package.json` and click "Open"

[Screenshot: Selecting package.json in the file dialog]

7. If "OpenForge MCP" appears in Package Manager, the installation was successful

[Screenshot: OpenForge MCP displayed in Package Manager]

### Method B: Install from a Git URL

1. From the Unity menu bar, go to **Window** > **Package Manager**
2. Click the **"+" button** > **"Add package from git URL..."**
3. Enter the following URL and click **"Add"**:

```
https://github.com/hirorogo/openforge-mcp.git?path=unity-plugin
```

[Screenshot: Entering the URL in the Git URL input field]

After a short wait, the plugin will be installed automatically.

---

## Step 2: Verify the Connection

After installing the plugin, check whether it can connect to the AI correctly.

1. From the Unity menu bar, go to **OpenForge** > **Connection Status**

[Screenshot: The OpenForge menu in the menu bar]

2. A small window will open. If it shows **"Connected"** in green, the connection to the AI is working

[Screenshot: The Connection Status window showing "Connected"]

:::warning Note
If it shows "Disconnected", make sure OpenForge MCP is running in the terminal. If you closed the terminal, run `npx openforge-mcp setup` again.
:::

---

## Step 3: Understanding the Setup Window

From the Unity menu bar, select **OpenForge** > **Setup** to open the settings panel.

[Screenshot: The full OpenForge Setup window]

You can check and modify the following items in this panel:

### Connection

Shows whether the connection to the AI is working. Normally this connects automatically, so you should not need to change anything here.

### Port

The port number used for communication with the AI. The default value should work fine. Only change this if it conflicts with another application.

### Screenshot

Settings for the screenshots the AI uses to inspect the scene. If set to "Auto", the AI will automatically capture screenshots when needed.

### Log

Displays a log of interactions with the AI. Checking this can help you identify the cause of any issues.

---

## Troubleshooting

### Nothing Appears in Package Manager

- Try restarting Unity
- Verify that your Unity version is **2021.3 or later**. Older versions may not be supported

### The "OpenForge" Menu Is Missing

The plugin installation may not have completed successfully.

- Open Package Manager and check whether "OpenForge MCP" appears in the list on the left
- If not, try the installation steps in Step 1 again

### Cannot Get "Connected" Status

1. Make sure the terminal is open and OpenForge MCP is running
2. Check whether a firewall or security software is blocking the connection
3. Confirm that the port number in the Setup window matches the one shown in the terminal

### Errors Appear in the Console

Open the Console from the Unity menu bar via **Window** > **General** > **Console** to view error messages. Try searching for the error on the [GitHub Issues page](https://github.com/hirorogo/openforge-mcp/issues).

---

Once you have confirmed the connection, proceed to [AI Client Setup](./ai-clients.md).
