---
sidebar_position: 3
title: "Installing Blender"
---

# Installing Blender

## What is Blender?

Blender is free software for creating 3D models (three-dimensional shapes) and adding animations. It is used in professional film and game production.

With OpenForge, you can create and edit 3D models in Blender using the power of AI.

:::info Completely free
Blender is open-source software that is completely free to use, including for commercial purposes. No account creation is required.
:::

---

## Step 1: Download Blender

1. Open `https://www.blender.org/download/` in your browser.
2. A large "Download Blender" button is displayed on the screen. The correct version for your computer is selected automatically.

[Screenshot: The Blender official download page showing a large blue download button]

3. Click the "Download Blender" button.
4. The file download begins. The file is approximately 300 MB, so it may take a few minutes.

:::tip Choosing a version
Unless you have a specific reason, use the latest stable version shown on the download page.
:::

---

## Step 2: Install Blender

### Windows

1. Double-click the downloaded `.msi` file (e.g., `blender-4.x.x-windows-x64.msi`).
2. When prompted "Do you want to allow this app to make changes to your device?", click "Yes".

[Screenshot: Windows User Account Control dialog]

3. The installer starts.

**Screen 1: Welcome**

1. Click "Next".

[Screenshot: Blender installer Welcome screen]

**Screen 2: License Agreement**

1. Check "I accept the terms in the License Agreement".
2. Click "Next".

[Screenshot: License agreement screen]

**Screen 3: Custom Setup**

1. No changes are needed.
2. Click "Next".

[Screenshot: Custom Setup screen]

**Screen 4: Ready to Install**

1. Click "Install".
2. The installation begins.

[Screenshot: Screen showing the Install button]

**Screen 5: Completed**

1. Click "Finish".

[Screenshot: Installation complete screen]

### Mac

1. Double-click the downloaded `.dmg` file (e.g., `blender-4.x.x-macos-arm64.dmg`).
2. A new window opens. Drag and drop the Blender icon into the "Applications" folder.

[Screenshot: Mac install screen showing the Blender icon being dragged to Applications]

3. Open the "Applications" folder in Finder and double-click "Blender" to launch it.
4. If a warning says "This application was downloaded from the Internet", click "Open".

---

## Step 3: Launch Blender for the first time

### Windows

1. Double-click the "Blender" shortcut icon on your desktop.
   - If you cannot find the icon, press the `Windows key`, type "Blender", and click the application that appears.

### Mac

1. Double-click "Blender" in the "Applications" folder.

### First launch screen

When you launch Blender for the first time, a splash screen appears in the center.

[Screenshot: Blender first-launch splash screen]

1. A language setting may be shown. You can select your preferred language from the "Language" dropdown.
   - Switching to your native language translates the menus, but many tutorials are written in English, so leaving it in English is also a valid choice.
2. Click anywhere outside the splash screen to close it and display the Blender workspace.

---

## Step 4: Understand the interface layout

The Blender interface has many buttons and panels, but here are the key areas to learn first.

[Screenshot: Blender main screen with labels on each area]

### 3D Viewport (center of the screen)

The main area that occupies most of the screen, showing 3D space. By default, a gray cube, a camera, and a light are placed here. This is where you create and edit 3D models.

### Outliner (upper right)

Lists every object in the scene (cube, camera, light, etc.). It serves a similar role to the Hierarchy panel in Unity.

### Properties panel (right side)

Displays and lets you edit settings (position, size, material, etc.) of the selected object. Switch between different information using the icon tabs arranged vertically.

### Timeline (bottom of the screen)

Used for creating animations. You will not need it at first, so you can ignore it for now.

### N Panel (Sidebar)

A panel hidden on the right edge of the 3D Viewport. Press the `N` key on your keyboard to toggle its visibility. You can view and change the position, rotation, and size of the selected object numerically.

[Screenshot: 3D Viewport with the N Panel visible]

---

## Step 5: Learn the basic controls

Blender makes heavy use of the mouse wheel (middle button).

:::warning If your mouse does not have a wheel
Blender frequently uses the middle mouse button (wheel click). Operating with only a laptop trackpad is difficult, so an external mouse with a scroll wheel is strongly recommended.
:::

### Navigating the viewport

| Action | How to do it |
|--------|-------------|
| Rotate the view | Hold the middle mouse button (wheel) and move the mouse |
| Zoom in/out | Scroll the mouse wheel |
| Pan the view | Hold `Shift` + middle mouse button and move the mouse |

Try it now:

1. Place your mouse cursor over the 3D Viewport.
2. Click and hold the mouse wheel, then move the mouse left and right. The view rotates.
3. Scroll the wheel forward and backward to zoom in and out.
4. Hold `Shift` while clicking and holding the wheel, then move the mouse to pan the view.

[Screenshot: Rotating the viewport in the 3D Viewport]

### Selecting objects

1. Left-click the cube with your mouse.
2. When an orange outline appears around the object, it is selected.

[Screenshot: The cube is selected with an orange outline]

### Moving objects

1. With an object selected, press the `G` key on your keyboard.
2. Move the mouse -- the object follows.
3. Left-click to confirm the new position.
4. To cancel, right-click or press `Esc`.

---

## Step 6: Check the add-on installation location

When installing the OpenForge Blender plugin or other add-ons, you will use the add-on settings screen. Let's confirm where it is.

1. Click "Edit" in the menu bar at the top of the screen.
2. Click "Preferences..." at the bottom.

[Screenshot: Edit menu open with Preferences highlighted]

3. The Preferences window opens.
4. Click "Add-ons" in the left-hand menu.

[Screenshot: Preferences window showing Add-ons in the left menu]

5. This is the add-on management screen. Use the "Install..." button in the upper right to install downloaded add-on files (`.zip` or `.py`).

[Screenshot: Add-on management screen with an arrow pointing to the Install button]

:::tip No installation needed right now
You do not need to install any add-ons at this point. Come back here when the OpenForge setup instructions require it. Just remember the location.
:::

---

## Common errors and solutions

### Error 1: Blender crashes immediately after launch

- Your graphics driver may be outdated. On Windows, update the graphics card driver through "Device Manager".
- Your computer's graphics hardware may not meet Blender's minimum requirements. Check the system requirements on the official website.

### Error 2: The screen goes completely black

- The viewport may have navigated too far away. Press the `Home` key on the numpad, or click "View" > "Frame All" to reset the viewport to show all objects.
- If you do not have a numpad, double-click an object in the Outliner to focus on it.

### Error 3: The middle mouse button is not responding

- Laptop trackpads may not support middle-click.
- Go to "Edit" > "Preferences" > "Input" and check "Emulate 3 Button Mouse". This lets you use `Alt` + left-click as a substitute for the middle button.

[Screenshot: Emulate 3 Button Mouse settings screen]

---

## Summary

You have now completed the following:

- Downloading and installing Blender
- Understanding the interface layout (3D Viewport, Outliner, Properties panel, N Panel)
- Learning basic controls (rotating, zooming, panning, selecting and moving objects)
- Locating the add-on installation screen

You are now ready to start working with Blender.
