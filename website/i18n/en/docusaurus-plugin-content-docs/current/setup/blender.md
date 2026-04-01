---
sidebar_position: 3
---

# Blender Add-on

This page explains how to set up OpenForge MCP for use with Blender. Make sure you have completed the steps on the [Installation](./install.md) page first.

---

## Step 1: Install the Add-on

### Method A: Automatic Installation via the Setup Command (Recommended)

If you have already run `npx openforge-mcp setup`, the add-on files have been downloaded.

1. Open Blender
2. From the menu bar, go to **Edit** > **Preferences**

[Screenshot: Opening Preferences from the Blender menu]

3. Click **"Add-ons"** in the left-hand menu

[Screenshot: Clicking Add-ons in the Preferences window]

4. Click the **"Install..."** button in the upper right (in Blender 4.x, select **"Install from Disk..."** from the dropdown menu)

[Screenshot: Location of the Install button]

5. A file selection dialog will open. Select the following file:
   - **Windows:** `C:\Users\YourUsername\.openforge-mcp\blender-addon\openforge_mcp.zip`
   - **Mac:** `/Users/YourUsername/.openforge-mcp/blender-addon/openforge_mcp.zip`

6. Click **"Install Add-on"**

[Screenshot: Selecting the file and clicking Install Add-on]

7. Once the installation is complete, **"OpenForge MCP"** will appear in the add-on list. **Check the checkbox to enable it**

[Screenshot: Enabling the OpenForge MCP checkbox in the add-on list]

:::tip Hint
In Blender 4.2 and later, the add-on management interface has a slightly different layout. Use the "Install from Disk" option rather than the "Get Extensions" tab.
:::

### Method B: Manual Download and Installation

1. Go to the [GitHub Releases page](https://github.com/hirorogo/openforge-mcp/releases)
2. Download the latest version of **openforge_mcp_blender.zip**
3. Follow the same process from step 4 above, selecting the downloaded zip file to install

---

## Step 2: Verify the Connection (N Panel)

To check the connection status in Blender, use the **N Panel**.

1. Place your mouse cursor over the 3D Viewport (the main 3D view)
2. Press the **N key** on your keyboard. A side panel will appear on the right side of the screen

[Screenshot: The side panel after pressing the N key]

3. Click the **"OpenForge"** tab at the top of the side panel

[Screenshot: The OpenForge tab in the side panel]

4. If it shows **"Status: Connected"**, the connection to the AI is working

[Screenshot: The OpenForge panel showing Connected]

:::info What Is the N Panel?
The N Panel is the side panel that appears on the right side of Blender's 3D Viewport. You can toggle its visibility with the N key. It is a convenient panel for checking properties and using add-on controls.
:::

---

## Troubleshooting

### The Add-on Does Not Appear in the List

- Make sure you selected the zip file **without extracting it first**. You cannot install the add-on by pointing to an extracted folder
- Verify that your Blender version is **3.6 or later**

### The Tab Does Not Appear in the N Panel After Enabling

- Try closing Blender completely and reopening it
- Make sure your mouse cursor is over the 3D Viewport before pressing the N key. Pressing N over a different editor (such as the UV Editor) may open a different panel

### "Status: Disconnected"

1. Make sure OpenForge MCP is running in the terminal
2. Try clicking the **"Reconnect"** button in the N Panel
3. Check whether a firewall or security software is blocking the connection

### Errors in the Blender Console

From the Blender menu bar, select **Window** > **Toggle System Console** (Windows only) to view detailed error information. On Mac, launch Blender from the terminal to see errors:

```bash
/Applications/Blender.app/Contents/MacOS/Blender
```

---

Once you have confirmed the connection, proceed to [AI Client Setup](./ai-clients.md).
