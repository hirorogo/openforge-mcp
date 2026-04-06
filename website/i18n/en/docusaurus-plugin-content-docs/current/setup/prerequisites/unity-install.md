---
sidebar_position: 2
title: "Installing Unity"
---

# Installing Unity

## What is Unity?

Unity is software for creating 3D and 2D games and applications. It is used by game developers worldwide, and VRChat worlds and avatars are also built with Unity.

OpenForge works with Unity to let you assemble 3D scenes and manipulate objects using the power of AI.

:::info Free to use
Unity can be used for free for personal use (Unity Personal license). No fees apply until your revenue exceeds a certain threshold.
:::

---

## Step 1: Create a Unity account

To use Unity, you first need to create a Unity account (free).

1. Open `https://id.unity.com/` in your browser.
2. Click "Create a Unity ID".

[Screenshot: Unity ID login page showing the "Create a Unity ID" link]

3. Enter the following information:
   - **Email**: Enter your email address.
   - **Password**: Enter a password (at least 8 characters, including uppercase, lowercase, and numbers).
   - **Username**: Enter a username (alphanumeric characters).
   - **Full Name**: Enter your name.

4. Check the checkbox to agree to the Terms of Service and Privacy Policy.
5. Click the "Create a Unity ID" button.

[Screenshot: Account creation form with information filled in]

6. A confirmation email is sent to the address you entered. Open the email and click "Link to confirm email".

:::tip If the email does not arrive
Check your spam folder. If it has not arrived after a few minutes, verify that the email address is correct and try again.
:::

---

## Step 2: Download Unity Hub

Unity Hub is an application for managing Unity versions and projects. You need Unity Hub first in order to install the Unity Editor itself.

1. Open `https://unity.com/download` in your browser.
2. Click the "Download Unity Hub" button.

[Screenshot: Unity Hub download page with a prominent download button]

3. The file downloads.

---

## Step 3: Install Unity Hub

### Windows

1. Double-click the downloaded `UnityHubSetup.exe`.
2. When prompted "Do you want to allow this app to make changes to your device?", click "Yes".
3. A license agreement is displayed. Click "I Agree".

[Screenshot: Unity Hub license agreement screen]

4. An installation destination screen appears. No changes are needed. Click "Install".

[Screenshot: Installation destination selection screen]

5. When the installation is complete, click "Finish".
6. Unity Hub starts automatically. If it does not, double-click the "Unity Hub" icon on your desktop.

### Mac

1. Double-click the downloaded `UnityHubSetup.dmg`.
2. In the window that appears, drag and drop the Unity Hub icon into the "Applications" folder.

[Screenshot: Mac install screen showing the icon being dragged]

3. Open the "Applications" folder in Finder and double-click "Unity Hub" to launch it.
4. If a warning says "This application was downloaded from the Internet", click "Open".

---

## Step 4: Sign in to Unity Hub

1. When Unity Hub starts, a sign-in screen is displayed.
2. Enter the email address and password from the account you created in Step 1.
3. Click "Sign in".

[Screenshot: Unity Hub sign-in screen]

4. A license approval screen may appear. Click "Agree and get personal edition license".

[Screenshot: License selection screen]

---

## Step 5: Install the Unity Editor

After signing in to Unity Hub, install the Unity Editor (the main Unity application).

1. Click "Installs" in the left-side menu of Unity Hub.
2. Click the "Install Editor" button in the upper right.

[Screenshot: Unity Hub Installs screen with an arrow pointing to the Install Editor button]

3. A version selection screen appears.

### Which version to choose

:::info What is LTS?
LTS stands for "Long Term Support". Bug fixes and security updates are provided for 2 years, making it the most stable version. Unless you have a specific reason, choose LTS.
:::

**If you want to create VRChat worlds or avatars:**
- Choose **Unity 2022.3.x LTS**. VRChat specifies which Unity versions can be used, and the 2022.3 series is recommended.

**For general use outside of VRChat:**
- Choose **Unity 6 (LTS)**. This is the latest LTS version with the newest features.

4. Click the "Install" button next to the version you want.

[Screenshot: Version selection screen showing 2022.3 LTS and Unity 6 LTS]

5. An additional modules selection screen appears. Check the following:
   - **Microsoft Visual Studio Community**: If it is checked, leave it checked (this is a code editing tool).
   - **Android Build Support / iOS Build Support**: Not needed if you are not developing for mobile. You can uncheck these.

6. Click "Install".

[Screenshot: Module selection screen]

:::warning Installation takes time
Depending on your internet speed, installing the Unity Editor can take 30 minutes to over an hour. Do not interrupt it -- just wait patiently.
:::

7. When the installation is complete, the installed version appears on the "Installs" screen.

[Screenshot: Installs screen after installation is complete]

---

## Step 6: Create your first project

Create a test project to confirm that Unity was installed correctly.

1. Click "Projects" in the left-side menu of Unity Hub.
2. Click the "New project" button in the upper right.

[Screenshot: Projects screen with the New project button indicated]

3. A template selection screen appears.
   - Select "3D (Core)" or "3D (Built-in Render Pipeline)".
   - Enter a project name in the "Project name" field on the right. For example, type "TestProject".
   - Confirm the save location in the "Location" field. No changes are needed.

[Screenshot: Template selection screen with 3D Core selected]

4. Click the "Create project" button.
5. Creating the project and launching the Unity Editor takes a few minutes.

---

## Step 7: Understand the Unity Editor layout

When the Unity Editor opens, the screen is divided into several panels (areas). Here is what each one does.

[Screenshot: Full Unity Editor screen with labels on each panel]

### Scene View

The central area of the screen showing 3D space. This is where you look around the game world and place objects.

- **Right-click drag**: Rotate the view
- **Mouse scroll wheel**: Zoom in/out
- **Middle-click drag**: Pan the view

### Hierarchy panel

The panel on the left side. It lists all objects in the scene (cameras, lights, 3D models, etc.). Think of it as a folder structure for the scene.

### Inspector panel

The panel on the right side. It displays and lets you edit detailed information (position, size, color, settings, etc.) of the object selected in the Hierarchy.

### Project panel

The panel at the bottom. It shows all files in the project (images, 3D models, scripts, etc.). It works like File Explorer or Finder.

### Game View

Next to the Scene View tab, there is a "Game" tab. Click it to preview how the game looks when played.

### Console panel

A "Console" tab at the bottom displays error messages and debug information. Check here when something goes wrong.

---

## Common errors and solutions

### Error 1: Unity Hub does not start

- Try restarting your computer.
- Antivirus software may be blocking Unity Hub. Add Unity Hub as an exception.

### Error 2: Unity Editor installation fails midway

- Check your internet connection.
- Check your available disk space. The Unity Editor requires at least 10 GB of free space.
- Close Unity Hub and restart it, then try again.

### Error 3: Project creation is extremely slow

- The first project creation is especially slow. It can take 10 minutes or more.
- On lower-spec machines, it may take even longer.
- Antivirus software monitoring file creation can slow things down. Excluding the Unity project folder from scanning may help.

### Error 4: "License activation failed"

1. Click the gear icon (settings) in the upper left of Unity Hub.
2. Select "Licenses".
3. Click "Activate New License".
4. Select "Unity Personal" and click "Done".

[Screenshot: License settings screen]

---

## Summary

You have now completed the following:

- Creating a Unity account
- Installing Unity Hub
- Installing the Unity Editor
- Creating a test project
- Understanding the Unity Editor layout

You are now ready to start working with Unity.
