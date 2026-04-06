---
sidebar_position: 4
title: "Installing Godot"
---

# Installing Godot

## What is Godot?

Godot is free software for creating games. It supports both 2D and 3D game development.

It serves a similar role to Unity, but Godot has a small file size and can be used immediately without an installer.

OpenForge works with Godot as well, letting you manipulate game scenes and objects using the power of AI.

:::info Completely free
Godot is open-source software that is completely free to use, including for commercial purposes. No account creation is required.
:::

---

## Step 1: Download Godot

1. Open `https://godotengine.org/download/` in your browser.
2. Download buttons for your OS (Windows or macOS) are displayed.

[Screenshot: Godot official download page]

3. Click the download button.

:::info Which version to choose
The download page may show two options: "Godot Engine" and "Godot Engine - .NET".

- **Godot Engine (standard)**: Uses GDScript, a language made specifically for Godot. Recommended for beginners.
- **Godot Engine - .NET**: A version that supports the C# language. Useful if you have C# experience or are migrating from Unity.

If unsure, choose the standard version (Godot Engine).
:::

4. A `.zip` file is downloaded.

---

## Step 2: Extract (unzip) Godot

Unlike other software, Godot does not have an installer. Just extract (unzip) the downloaded ZIP file and it is ready to use.

### Windows

1. Find the downloaded `.zip` file (usually in your "Downloads" folder).
2. Right-click the `.zip` file.
3. Click "Extract All...".

[Screenshot: Right-clicking a ZIP file and selecting "Extract All"]

4. A dialog appears asking where to extract. It is recommended to choose a convenient location, for example:

```
C:\Godot
```

5. Click the "Extract" button.

[Screenshot: Extraction destination selection screen]

6. When extraction finishes, the folder opens. Inside you will find a file like `Godot_v4.x-stable_win64.exe`. This is the Godot executable.

[Screenshot: Extracted folder showing the Godot executable]

:::tip Create a shortcut for convenience
Right-click the Godot executable, then select "Show more options" > "Send to" > "Desktop (create shortcut)". This creates a desktop shortcut so you can launch Godot with a double-click next time.
:::

### Mac

1. Double-click the downloaded `.zip` file. It is extracted automatically.
2. Drag and drop the extracted `Godot.app` file into the "Applications" folder.

[Screenshot: Dragging Godot.app into the Applications folder]

3. Open the "Applications" folder and double-click "Godot" to launch it.
4. If a warning says "This application was downloaded from the Internet", click "Open".

---

## Step 3: Launch Godot

### Windows

1. Double-click `Godot_v4.x-stable_win64.exe` in the extracted folder.
   - If "Windows protected your PC" appears, click "More info" and then click "Run anyway".

[Screenshot: Windows SmartScreen warning with "More info" click location indicated]

### Mac

1. Double-click "Godot" in the "Applications" folder.

### Project Manager screen

When Godot starts, the "Project Manager" screen appears. This is where you create and manage projects.

[Screenshot: Godot Project Manager screen]

---

## Step 4: Create your first project

1. Click the "New Project" button on the Project Manager screen.

[Screenshot: Arrow pointing to the New Project button]

2. Configure the following:
   - **Project Name**: Enter a name for the project, for example "TestProject".
   - **Project Path**: Specify where to save the project. Click the "Browse" button to choose a convenient location.
   - **Renderer**: Select the rendering method. If unsure, leave it as "Forward+".

[Screenshot: Project creation screen with fields filled in]

3. Click the "Create & Edit" button.
4. The Godot editor opens.

---

## Step 5: Understand the editor layout

When the Godot editor opens, the screen is divided into several areas.

[Screenshot: Full Godot editor screen with labels on each area]

### Viewport (center of the screen)

The main area displaying 3D space (or 2D space). This is where you view and edit the game world. Tabs labeled "2D", "3D", "Script", and "AssetLib" appear at the top for switching views.

### Scene panel (upper left)

Shows a list of nodes (objects) in the current scene (game level). In Godot, all objects are called "nodes" and are organized in a tree structure (parent-child relationships).

### Inspector (right side)

Displays and lets you edit the properties (settings) of the selected node, such as position, size, and color.

### FileSystem panel (lower left)

Shows the files and folders in the project. Images, audio files, scripts, and other resources all appear here.

### Output panel / Debugger (bottom of the screen)

Displays game execution results and error messages. Switch between the "Output" and "Debugger" tabs as needed.

---

## Step 6: Check the plugin installation location

When using the OpenForge Godot plugin, plugins are placed in the `addons` folder inside the project folder.

1. Check the "FileSystem" panel in the lower left of the Godot editor.
2. Create an `addons` folder at the root of the project.
   - Right-click `res://` in the FileSystem panel.
   - Click "New Folder...".
   - Enter `addons` as the folder name and click "OK".

[Screenshot: Right-clicking in the FileSystem panel and selecting New Folder]

3. When installing a plugin, place the plugin folder inside `res://addons/`.

:::info What is res://?
`res://` is a special path representing the root (top level) of the Godot project folder. For example, `res://addons/` means the `addons` folder inside the project folder. The actual location on your computer's file system depends on where you saved the project.
:::

4. After placing a plugin, you need to enable it in the Godot editor under "Project" menu > "Project Settings..." > "Plugins" tab.

[Screenshot: Project Settings Plugins tab]

:::tip No plugin installation needed right now
Come back here when the OpenForge setup instructions require it.
:::

---

## Common errors and solutions

### Error 1: "Windows protected your PC" appears

Since Godot does not use an installer, the Windows security feature (SmartScreen) may show a warning.

1. Click the "More info" text.
2. A "Run anyway" button appears -- click it.

This does not mean Godot is dangerous. Windows is simply warning about an unfamiliar program. Godot is safe as long as it was downloaded from the official site.

[Screenshot: SmartScreen warning with the "Run anyway" button after clicking "More info"]

### Error 2: Godot does not launch (Mac)

This may be caused by macOS security settings.

1. Open "System Settings" > "Privacy & Security".
2. Near the bottom, you should see a message that says "Godot was blocked because it is from an unidentified developer".
3. Click "Open Anyway".

### Error 3: Text is too small on screen

On high-resolution displays, text may appear very small.

1. Open "Editor" menu > "Editor Settings...".
2. Select "Interface" > "Editor" from the list on the left.
3. Increase the "Display Scale" value (e.g., 150% or 200%).
4. Restart Godot for the change to take effect.

---

## Summary

You have now completed the following:

- Downloading and extracting (unzipping) Godot
- Launching Godot and creating a project
- Understanding the editor layout
- Locating the plugin installation folder (`res://addons/`)

You are now ready to start working with Godot.
