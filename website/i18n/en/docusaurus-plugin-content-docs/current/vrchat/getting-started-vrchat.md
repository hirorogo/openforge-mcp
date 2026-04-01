---
sidebar_position: 0
title: "VRChat Setup Guide"
description: "A complete from-scratch setup guide for people who want to create VRChat worlds and avatars. No programming experience needed."
---

# VRChat Setup Guide

## About This Page

This is a complete from-scratch guide for **people who want to create VRChat worlds and avatars**.

- Zero programming experience is perfectly fine
- Even if you have never opened a "command prompt" or "terminal", we will walk you through it step by step
- You will be able to use AI to automate tedious setup tasks

:::info Goal of This Guide
By the time you finish this guide, you will have an environment where you can simply tell the AI "Set up a VRChat world" and have spawn points, lighting, and other essentials configured automatically.
:::

---

## What You Need

| Requirement | Notes |
|---|---|
| A computer | Windows 10 / Windows 11 or Mac |
| Internet connection | Needed for downloads |
| About 30 minutes | Can be done in 15 minutes once you are familiar |

:::tip Everything is free
All software used in this guide is free (some AI services have paid plans, but you can get started with the free tier).
:::

---

## Step 1: Install Unity (10 minutes)

Unity is the software used to create VRChat worlds and avatars. It is called a "game engine", but you do not need to worry about the details.

### 1-1. Download Unity Hub

1. Open your browser and go to **[unity.com/download](https://unity.com/download)**
2. Click the button that says "Download Unity Hub"
3. Double-click the downloaded file (`UnityHubSetup.exe`) to run it
4. Follow the installer's instructions and click "Next"
5. Click "Finish" when the installation is complete

### 1-2. Create a Unity Hub Account

1. Launch Unity Hub (there should be an icon on your desktop)
2. Click "Create account" and register with your email address and password
3. Click the confirmation link in the email sent to your address
4. Return to Unity Hub and log in

:::info Free to use
Unity is free for personal use (Personal license). If a license selection screen appears, choose "Personal".
:::

### 1-3. Install the Unity Editor

This is the most important step.

1. Click "Installs" in Unity Hub's left menu
2. Click the "Install Editor" button in the upper right
3. Click the **"Archive" tab** (you need a specific version, not the latest)
4. Find **2022.3.22f1** and click "Install"

:::warning Do not get the version wrong
VRChat SDK requires **Unity 2022.3.22f1**. The SDK will not work correctly with any other version. If you install the latest version, you will have to redo this step. Always select **2022.3.22f1**.
:::

**"Why this specific version?"** Because the VRChat development team has officially specified that they have tested with this version.

### 1-4. Create Your First Project

1. Click "Projects" in Unity Hub's left menu
2. Click the "New project" button in the upper right
3. Select **"3D"** from the template list (may also be shown as "3D Core")
4. Enter a name for "Project name" (e.g., `MyVRChatWorld`)
5. Check the "Location" to confirm the save location (the default is fine)
6. Click "Create project"
7. Wait for the Unity Editor to open (this may take a few minutes the first time)

<!-- TODO: [Screenshot: Unity Hub version selection screen] -->

---

## Step 2: Install Node.js (3 minutes)

Node.js is required to run OpenForge. It works behind the scenes, so once installed, you will not need to interact with it.

### 2-1. Download Node.js

1. Open your browser and go to **[nodejs.org](https://nodejs.org)**
2. Two large buttons will appear on the screen
3. Click the one that says **"LTS"** to download it

:::tip What is LTS?
LTS stands for "Long Term Support". It means this is a stable version, so always pick this one. The other option, "Current", has the latest features but is less stable.
:::

### 2-2. Run the Installer

1. Double-click the downloaded file (named something like `node-vXX.X.X-x64.msi`)
2. The installer will launch
3. **Just click "Next" all the way through**
4. If you see a checkbox for "Add to PATH", **make sure it is checked** (it should be checked by default)
5. Click "Install" at the end, then "Finish" when done

### 2-3. Verify the Installation

This is where you will use the "command prompt" for the first time.

:::info What is a command prompt?
A screen where you give text-based instructions to your computer. It is the one with white text on a black background. It might look intimidating, but all you need to do here is copy and paste.
:::

**How to open the command prompt:**

1. Press the **Windows key** (the flag icon in the lower-left)
2. Type **`cmd`** (it will appear in the search box)
3. Press **Enter** when "Command Prompt" appears
4. A black window will open

**Enter the verification command:**

Type the following into the black window and press Enter:

```bash
node -v
```

If you see a version number like `v20.11.0`, it was successful. The exact number may differ.

:::warning If you see "'node' is not recognized as an internal command..."
Node.js may not have installed correctly. Try again from step 2-2. Make sure "Add to PATH" is checked in the installer. After reinstalling, close the command prompt, reopen it, and try `node -v` again.
:::

---

## Step 3: Choose an AI App

OpenForge works in conjunction with an AI app. Choose the pattern that fits you best from the three below.

### Pattern A: Completely Free (Recommended for students)

The **VS Code + GitHub Copilot** combination. Students can use it for free through the GitHub Education program.

**Steps:**

1. **Install VS Code**
   - Go to **[code.visualstudio.com](https://code.visualstudio.com)** in your browser
   - Click "Download for Windows" and download it
   - Run the downloaded file to install (click "Next" all the way through)

2. **Create a GitHub Account**
   - Go to **[github.com](https://github.com)** in your browser
   - Click "Sign up" and create an account

3. **Apply for GitHub Education** (if you are a student)
   - Go to **[education.github.com](https://education.github.com)** in your browser
   - Follow "Join GitHub Education" to complete student verification
   - You will need a school email address or student ID
   - Verification may take a few days

4. **Install the Copilot Extension**
   - Launch VS Code
   - Click the icon with 4 squares on the left side (Extensions)
   - Type "GitHub Copilot" in the search box
   - Click "GitHub Copilot" and then "Install"
   - Log in with your GitHub account when prompted

---

### Pattern B: The Easiest Start (Recommended)

Use **Claude Desktop**. Install it and start using it right away.

**Steps:**

1. Go to **[claude.ai](https://claude.ai)** in your browser
2. Download the desktop app from the "Download" section
3. Run the downloaded file to install
4. Create an account and log in

:::info About pricing
There is a free tier available, but heavy usage may require the $20/month Pro plan. Try the free tier first and consider upgrading if you like it.
:::

---

### Pattern C: Run Everything Locally (Privacy-focused)

Use **LM Studio**. The AI runs entirely on your computer, so no data is ever sent externally.

**Steps:**

1. Go to **[lmstudio.ai](https://lmstudio.ai)** in your browser
2. Click "Download" to download it
3. Run the downloaded file to install
4. Launch LM Studio
5. Download an AI model from the "Discover" tab (recommended: 7B parameters or larger)

:::warning System requirements
LM Studio runs the AI on your computer, so it requires decent specs. 16 GB or more of RAM and a GPU (graphics card) are recommended. If your system does not meet these requirements, Pattern A or Pattern B is a better choice.
:::

---

## Step 4: Set Up OpenForge (1 minute)

Now let's set up OpenForge in your environment. You will use the command prompt, but it is just one line.

### 4-1. Open the Command Prompt

Same steps as 2-3:

1. Press the **Windows key**
2. Type **`cmd`**
3. Press **Enter**

### 4-2. Run the Setup Command

Copy the following command, paste it into the command prompt, and press Enter:

```bash
npx openforge-mcp setup --mode vrchat
```

:::tip How to paste into the command prompt
In the command prompt, **right-click** to paste copied text. Ctrl+V may not work, so try right-clicking instead.
:::

**"What is happening?"** This command is automatically writing to the AI app's configuration file (the one you chose in Step 3). It configures the AI app to use OpenForge's tools.

If you see **`[OK]`** on the screen, the setup was successful.

:::warning If you get an error
If you see an error like "npx not found", the Node.js installation (Step 2) did not complete properly. Redo Step 2, then close and reopen the command prompt.
:::

---

## Step 5: Install the Unity Plugin (2 minutes)

Unity also needs a plugin to communicate with OpenForge.

### 5-1. Open Your Unity Project

Double-click the project you created in Step 1-4 from Unity Hub to open it.

### 5-2. Add the Plugin via Package Manager

1. Click **Window** in the Unity Editor's top menu
2. Click **Package Manager** from the dropdown
3. The Package Manager window will open
4. Click the **"+" button** in the upper left
5. Click **"Add package from git URL..."**
6. Enter the following URL and click **"Add"**:

```
https://github.com/openforgeproject/com.openforge.bridge.git
```

7. The installation will begin (takes a few tens of seconds)
8. When you see a "Successfully added" message, it is done

### 5-3. Test the Connection

1. Click **Tools** in the Unity Editor's top menu
2. Click **OpenForge**
3. Click **Setup**
4. Click the **"Test Connection"** button in the window that appears
5. If it shows **"Connected"**, you are all set

:::warning If "Connected" does not appear
- Make sure the AI app (the one you chose in Step 3) is running
- Make sure the OpenForge setup (Step 4) completed successfully
- Try restarting the Unity Editor
:::

---

## Step 6: Install VRChat SDK (5 minutes)

To upload worlds and avatars to VRChat, you need the official VRChat SDK.

### 6-1. Download VRChat Creator Companion (VCC)

1. Go to **[vrchat.com/home/download](https://vrchat.com/home/download)** in your browser
2. Log in with your VRChat account (create one if you do not have one)
3. Click "Download the Creator Companion" to download
4. Run the downloaded file to install

### 6-2. Launch VCC and Add Your Project

1. Launch VCC (VRChat Creator Companion)
2. Log in with your VRChat account
3. Click "Projects" in the left menu
4. Click the **"Add" button**
5. Select "Add Existing Project"
6. Select the Unity project folder you created in Step 1-4

### 6-3. Install the SDK

1. Click the **"Manage Project"** button for the project you added
2. Click the **"+" button** next to "VRChat SDK - Worlds" or "VRChat SDK - Avatars"
   - Choose **Worlds** if you want to create worlds
   - Choose **Avatars** if you want to set up avatars
   - You can install both
3. Wait for the installation to complete
4. Click **"Open Project"** to launch Unity

Once Unity opens, you should see a **"VRChat SDK"** item in the top menu. If you can see it, the SDK installation was successful.

---

## Step 7: Try Talking to the AI

All the setup is complete. Let's actually talk to the AI and start creating for VRChat.

### With your Unity project open, launch your AI app.

Try saying the following:

### Example 1: Basic World Setup

```
Do the basic VRChat world setup
```

The AI will automatically:
- Place a **VRC_SceneDescriptor** (the base component for world settings)
- Configure a **spawn point** (where players first appear)
- Set up basic **lighting** (brightness adjustments)

### Example 2: Place a Mirror

```
Place a mirror in front
```

The AI will place a VRChat mirror object in the scene. This is a mirror for checking your avatar's appearance in VRChat.

### Example 3: Check Performance

```
Check the performance rank
```

The AI will evaluate the world or avatar's performance rank (Excellent / Good / Medium / Poor). In VRChat, higher performance ranks mean more players can enjoy your content comfortably.

:::tip You can ask for much more
Just talk naturally. For example, "Line up 3 chairs", "Add background music", "Make the lighting a bit darker" -- just describe what you want to do and the AI will handle it.
:::

---

## Troubleshooting

### "node is not found"

**Cause:** The "Add to PATH" setting was not applied correctly during the Node.js installation.

**Fix:**
1. Run the Node.js installer again
2. Select "Repair" or "Modify"
3. Verify that "Add to PATH" is checked
4. After the install finishes, **close the command prompt and open a new one**, then try `node -v` again

### The AI Does Not Recognize OpenForge Tools

**Cause:** The AI app may be running with an old configuration.

**Fix:**
1. **Completely quit** the AI app (not just close the window -- also exit from the taskbar notification area)
2. Restart the AI app
3. Try talking to it again

### Unity Cannot Find the Plugin

**Cause:** Adding the package via Package Manager may not have completed.

**Fix:**
1. Open **Window** > **Package Manager** from the Unity Editor's top menu
2. Click the **"+" button** in the upper left
3. Click **"Add package from git URL..."**
4. Enter the URL again and click "Add"

### VRChat SDK Will Not Install

**Cause:** The Unity version is most likely wrong.

**Fix:**
1. Check the installed Unity version in Unity Hub's "Installs"
2. If it is not **2022.3.22f1**, install the correct version
3. Reopen the project through VCC (VRChat Creator Companion)

:::warning Version mismatch is the most common issue
If something is "not working" related to VRChat, check the Unity version first. The SDK will almost always fail to work correctly with any version other than 2022.3.22f1.
:::

---

## Next Steps

Once the setup is complete, start creating:

- [Create a World](./world-creation.md) -- Steps to create your first world and upload it
- [Set Up an Avatar](./avatar-setup.md) -- How to import and configure an avatar
- [Change Outfits](./outfit-change.md) -- Steps to change avatar outfits
- [Set Up Dynamic Bones](./physbone.md) -- PhysBone setup for hair and skirt physics
