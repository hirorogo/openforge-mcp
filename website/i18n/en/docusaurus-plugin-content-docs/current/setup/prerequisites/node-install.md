---
sidebar_position: 1
title: "Installing Node.js"
---

# Installing Node.js

## What is Node.js?

Node.js is a piece of software that acts as the "foundation" for running various applications and tools on your computer.

For example, just as you need a game console to play games, you need Node.js to run the OpenForge MCP server. Node.js itself does not display anything on screen, but it works behind the scenes to run other programs.

:::info Why is Node.js needed?
The OpenForge MCP server runs on top of Node.js. Without Node.js installed, the server cannot start. You only need to install it once, and then you can forget about it.
:::

---

## Installing on Windows

### Step 1: Open the download page

1. Open a browser (Chrome, Edge, etc.).
2. Type `https://nodejs.org` in the address bar (the narrow bar at the top where URLs are shown) and press Enter.
3. The Node.js official website is displayed.

[Screenshot: Node.js official website top page with two green download buttons]

### Step 2: Download the LTS version

1. Two large green buttons are shown on the screen.
2. Click the button labeled "LTS".
   - LTS stands for "Long Term Support", meaning it is a stable, well-maintained version.
   - The "Current" button on the right contains newer features but is more likely to have issues. Choose LTS.
3. Clicking the button starts downloading the installer (a `.msi` file).

[Screenshot: Browser showing the file being downloaded at the bottom]

:::tip If you cannot find the downloaded file
Downloaded files are usually saved in the "Downloads" folder. Press `Windows key + E` to open File Explorer and click "Downloads" on the left.
:::

### Step 3: Run the installer

1. Double-click the downloaded `.msi` file to open it.
2. When prompted "Do you want to allow this app to make changes to your device?", click "Yes".

[Screenshot: Windows User Account Control dialog]

### Step 4: Follow the installation wizard

The installer displays several screens in sequence. In most cases, you can simply click "Next" to proceed.

**Screen 1: Welcome**

1. "Welcome to the Node.js Setup Wizard" is displayed.
2. Click the "Next" button.

[Screenshot: Node.js installer Welcome screen]

**Screen 2: License Agreement**

1. The license text is displayed.
2. Check the "I accept the terms in the License Agreement" checkbox.
3. Click the "Next" button.

[Screenshot: License agreement screen with the checkbox location indicated by an arrow]

**Screen 3: Destination Folder**

1. The installation folder is displayed.
2. No changes are needed. Click "Next".

[Screenshot: Installation folder selection screen]

**Screen 4: Custom Setup**

1. A list of features to install is displayed.
2. Leave everything as-is and click "Next".

[Screenshot: Custom Setup screen]

**Screen 5: Tools for Native Modules**

1. A checkbox "Automatically install the necessary tools..." may appear.
2. You do not need to check this. It is not required for OpenForge.
3. Click "Next".

[Screenshot: Native module tools screen]

**Screen 6: Ready to install**

1. Click the "Install" button.
2. The installation begins. It may take a few minutes.

[Screenshot: Screen showing the Install button]

**Screen 7: Completed**

1. Click the "Finish" button to close the installer.

[Screenshot: Installation complete screen]

### Step 5: Verify the installation

Confirm that the installation completed correctly.

1. Press the `Windows key` on your keyboard (the Windows logo at the bottom left of the screen).
2. Type "cmd".
3. An application called "Command Prompt" appears. Click it to open.

[Screenshot: Searching for "cmd" in the Start menu]

4. A black window opens. Type the following and press Enter:

```bash
node -v
```

5. If a version number like `v20.xx.x` appears, the installation was successful (the exact numbers depend on when you installed).

[Screenshot: Running node -v in the Command Prompt with a version number displayed]

6. Next, type the following and press Enter:

```bash
npm -v
```

7. If a version number like `10.x.x` appears, npm (the package manager included with Node.js) is also correctly installed.

:::warning If no version number appears
If you see an error like "'node' is not recognized as an internal or external command, operable program or batch file.", read the "Common errors and solutions" section below.
:::

---

## Installing on Mac

### Method A: Download from the official site

1. Open `https://nodejs.org` in your browser.
2. Click the green button labeled "LTS".
3. A `.pkg` file is downloaded.
4. Double-click the downloaded file to open it.
5. Follow the on-screen instructions, clicking "Continue" several times, then click "Install".
6. Enter your Mac password when prompted.
7. Click "Close" when the installation is complete.

[Screenshot: Mac Node.js installer screen]

**Verification:**

1. Open Finder.
2. Go to "Applications" > "Utilities" and double-click "Terminal" to open it.
3. Type the following and press Enter:

```bash
node -v
```

4. If a version number appears, the installation was successful.

### Method B: Install with Homebrew

:::info What is Homebrew?
Homebrew is a package manager for Mac. You can install software by typing commands in the terminal. If you already use Homebrew, this method is simpler. If you have not installed Homebrew, use Method A instead.
:::

1. Open Terminal.
2. Type the following command and press Enter:

```bash
brew install node
```

3. Once the installation is complete, verify with:

```bash
node -v
```

---

## Common errors and solutions

### Error 1: "node is not recognized" or "node: command not found"

This error occurs when the computer cannot find where Node.js is installed. This is a "PATH" configuration issue.

**Solution for Windows:**

1. Try restarting your computer. A restart alone often fixes the issue.
2. If restarting does not help, manually configure PATH with the following steps.

**How to manually set PATH (Windows):**

1. Press the `Windows key` and type "environment variables".
2. Click "Edit the system environment variables".

[Screenshot: Searching for "environment variables" in the Start menu]

3. Click the "Environment Variables" button.

[Screenshot: System Properties window showing the "Environment Variables" button location]

4. In the upper section ("User variables"), find and select "Path", then click "Edit".

[Screenshot: Environment variables list with Path selected]

5. Click the "New" button.
6. Enter the following path:

```
C:\Program Files\nodejs\
```

7. Click "OK" to close all windows.
8. Close the Command Prompt and reopen it, then try `node -v` again.

[Screenshot: Path edit screen with the Node.js path added]

**Solution for Mac:**

1. Close Terminal and reopen it.
2. If it still does not work, enter the following command:

```bash
export PATH="/usr/local/bin:$PATH"
```

### Error 2: The installer does not start

- The downloaded file may be corrupted. Delete it and download again.
- Antivirus software may be blocking it. Try temporarily disabling your antivirus before installing.

### Error 3: "permission denied" appears (Mac)

This error may occur when running `npm install` on Mac.

```bash
sudo npm install -g <package-name>
```

Add `sudo` at the beginning of the command and try again. Enter your Mac password when prompted (characters are not displayed while typing, but this is normal).

---

## Summary

You have now completed the following:

- Installing Node.js
- Installing npm (the Node.js package manager)
- Verifying the installation in the Command Prompt (or Terminal)

You are now ready to run the OpenForge MCP server. Proceed to the next step.
