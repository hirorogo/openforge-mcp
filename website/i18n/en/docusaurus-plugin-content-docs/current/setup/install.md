---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Installation

Let's get OpenForge MCP set up. The process is simple:

1. Install Node.js
2. Run one command in a terminal

That's it. Let's walk through each step.

---

## Step 1: Install Node.js

### What is Node.js?

Node.js is a piece of software that OpenForge MCP needs in order to run. It does not have a visible window -- think of it as the foundation that supports OpenForge MCP behind the scenes.

You only need to install it once and then you can forget about it.

### Installation steps

<Tabs>
  <TabItem value="windows" label="Windows">

1. Open [https://nodejs.org](https://nodejs.org) in your browser
2. You will see two large download buttons on the front page. Click the one on the **left labeled "LTS"** (this is the recommended, stable version)
3. Double-click the downloaded file to open it
4. The installer will launch -- just **keep clicking "Next"**. The default settings are fine
5. Click "Install" at the end and wait for it to finish

  </TabItem>
  <TabItem value="mac" label="Mac">

1. Open [https://nodejs.org](https://nodejs.org) in your browser
2. You will see two large download buttons on the front page. Click the one on the **left labeled "LTS"** (this is the recommended, stable version)
3. Double-click the downloaded `.pkg` file to open it
4. The installer will launch -- just **keep clicking "Continue"**. The default settings are fine
5. Click "Install" at the end and wait for it to finish

  </TabItem>
</Tabs>

:::tip Tip
After the installation finishes, restarting your computer is a good idea to make sure everything takes effect.
:::

### Verify the installation

Open a terminal (instructions just below) and run this command:

```bash
node --version
```

If you see a version number like `v20.xx.x` or `v22.xx.x`, the installation was successful.

---

## Step 2: Open a terminal

A "terminal" is a window where you give your computer text-based instructions. It might look a bit intimidating, but all you need to do here is copy and paste a single line, so don't worry.

<Tabs>
  <TabItem value="windows" label="Windows">

1. Press the **Windows key** on your keyboard (or click the Start button at the bottom-left of the screen)
2. Type **"terminal"**
3. Click on **"Windows Terminal"** or **"Command Prompt"** when it appears in the search results

:::info Note
On Windows 11 you will find "Windows Terminal"; on Windows 10 you will find "Command Prompt." Either one works.
:::

  </TabItem>
  <TabItem value="mac" label="Mac">

1. Press **Command + Space** on your keyboard (this opens Spotlight Search)
2. Type **"terminal"** and press Enter
3. A dark window (the terminal) will open

  </TabItem>
</Tabs>

---

## Step 3: Run the setup command

With the terminal open, copy and paste the following command and press Enter:

```bash
npx openforge-mcp setup
```

This command tells your computer to "automatically configure OpenForge MCP." `npx` is a tool that comes with Node.js -- it downloads and runs programs from the internet.

### What happens when I run it?

You will see output like this:

```
  OpenForge MCP Setup
  ========================

  [1/3] Downloading required files...       done
  [2/3] Creating configuration files...     done
  [3/3] Testing connection...               done

  Setup complete!
  Next step: Install the plugin for your app (Unity / Blender / Godot).
```

If you see this, the setup is done.

:::tip Tip
If you are asked "OK to proceed?" the first time you run the command, type **y** and press Enter. It is simply asking for your permission to run the program.
:::

---

## Troubleshooting

### "node is not recognized" or "node: command not found"

Node.js may not be installed yet, or you may not have reopened the terminal after installing it.

- Confirm that Node.js is installed
- Close the terminal and open a new one
- If that doesn't help, restart your computer

### "permission denied" or "access denied"

You may need administrator privileges.

<Tabs>
  <TabItem value="windows" label="Windows">

When you search for "terminal" in the Start menu, right-click the result and select **"Run as administrator."**

  </TabItem>
  <TabItem value="mac" label="Mac">

Prefix the command with `sudo`:

```bash
sudo npx openforge-mcp setup
```

When prompted for a password, enter your Mac login password (nothing will appear on screen as you type, but it is being entered).

  </TabItem>
</Tabs>

### The download stalls midway

Check your internet connection. If your Wi-Fi is unstable, wait a moment and then run the same command again.

### Still stuck?

Search the [GitHub Issues page](https://github.com/hirorogo/openforge-mcp/issues) to see if anyone else has encountered the same problem. If you can't find a match, feel free to open a new issue.

---

Once the setup is complete, the next step is to install the plugin for your app:

- Using Unity? --> [Unity Plugin](./unity.md)
- Using Blender? --> [Blender Add-on](./blender.md)
- Using Godot? --> [Godot Plugin](./godot.md)
