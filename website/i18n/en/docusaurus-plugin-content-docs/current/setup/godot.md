---
sidebar_position: 4
---

# Godot Plugin

This page explains how to set up OpenForge MCP for use with Godot. Make sure you have completed the steps on the [Installation](./install.md) page first.

---

## Step 1: Install the Plugin

### Method A: Automatic Copy via the Setup Command (Recommended)

If you have already run `npx openforge-mcp setup`, the plugin files have been downloaded. All you need to do is copy them into your Godot project.

1. Open your project in Godot (if you do not have a project yet, create a new one)

2. Open a terminal and run the following command. Replace `/path/to/your/project` with the actual path to your Godot project folder:

**Windows:**

```bash
xcopy "%USERPROFILE%\.openforge-mcp\godot-plugin" "YourProjectFolder\addons\openforge_mcp" /E /I
```

**Mac:**

```bash
cp -r ~/.openforge-mcp/godot-plugin ~/YourProjectFolder/addons/openforge_mcp
```

:::tip Hint
If you are unsure of your project's folder path, check the path displayed beneath the project name on the Godot project list screen.
:::

3. Switch back to Godot and you should see the `addons/openforge_mcp` folder has been added

### Method B: Manual Download and Copy

1. Go to the [GitHub Releases page](https://github.com/hirorogo/openforge-mcp/releases)
2. Download the latest version of **openforge_mcp_godot.zip**
3. Extract the zip file
4. Copy the contents into the **addons** folder of your Godot project, naming the folder **openforge_mcp**

The folder structure should look like this:

```
YourProject/
  addons/
    openforge_mcp/
      plugin.cfg
      ...(other files)
  project.godot
  ...
```

---

## Step 2: Enable the Plugin

Simply copying the files does not activate the plugin. You need to enable it in the Godot settings.

1. From the Godot menu bar, go to **Project** > **Project Settings**

[Screenshot: Opening Project Settings from the Godot menu]

2. Click the **"Plugins"** tab at the top of the Project Settings window

[Screenshot: The Plugins tab in Project Settings]

3. **"OpenForge MCP"** will appear in the list. Click the checkbox in the **"Status"** column on the right to set it to **"Active"**

[Screenshot: Setting the OpenForge MCP plugin to Active]

4. Once the status changes to "Active", you are all set

:::warning Note
You may see errors in the "Output" panel at the bottom right after enabling the plugin. In most cases, closing and reopening Godot will resolve this.
:::

---

## Step 3: Verify the Connection

1. After enabling the plugin, an **"OpenForge"** panel will appear at the bottom of the Godot editor

[Screenshot: The OpenForge panel at the bottom of the editor]

2. If the panel shows **"Connected"**, the setup is successful

3. If it does not appear, try clicking the **"Connect"** button in the panel

---

## Troubleshooting

### Plugin Does Not Appear in the Plugins Tab

- Verify that the `addons/openforge_mcp/plugin.cfg` file is in the correct location
- Try closing and reopening Godot

### Errors When Enabling the Plugin

- Verify that your Godot version is **4.2 or later**
- Make sure OpenForge MCP is running in the terminal

### Cannot Connect

- Make sure `npx openforge-mcp setup` completed successfully in the terminal
- Check whether a firewall or security software is blocking the connection

---

Once you have confirmed the connection, proceed to [AI Client Setup](./ai-clients.md).
