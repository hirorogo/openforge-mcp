---
sidebar_position: 5
title: "Terminal (Command Prompt) Basics"
---

# Terminal (Command Prompt) Basics

## What is a terminal?

A terminal is a screen where you give text-based instructions to your computer.

When you normally use a computer, you click icons with a mouse. In a terminal, you do the same things by typing text instead.

For example, to open a folder you would normally double-click its icon, but in a terminal you type `cd foldername` to navigate into that folder.

:::info Nothing to worry about
A terminal may look like the screens hackers use in movies, but in reality it is quite simple. All you need for OpenForge is to copy a single command, paste it, and run it. Let's practice below.
:::

---

## How to open a terminal

### Windows

Windows has several terminal-like applications. Any of the following will work.

#### Method 1: Command Prompt (the most basic)

1. Press the `Windows key` on your keyboard (the Windows logo at the bottom left of the screen).
2. Type "cmd".
3. An application called "Command Prompt" appears. Click it to open.

[Screenshot: Searching for "cmd" in the Start menu, showing "Command Prompt"]

4. A black window opens. This is the Command Prompt.

[Screenshot: Command Prompt screen with a blinking cursor]

#### Method 2: PowerShell

1. Press the `Windows key`.
2. Type "powershell".
3. An application called "Windows PowerShell" appears. Click it to open.

[Screenshot: Searching for "powershell" in the Start menu]

4. A blue window opens. This is PowerShell. It can be used in much the same way as Command Prompt but has more features.

[Screenshot: PowerShell screen]

#### Method 3: Windows Terminal (recommended)

If you are using Windows 11, Windows Terminal is installed by default.

1. Press the `Windows key`.
2. Type "terminal".
3. An application called "Terminal" appears. Click it to open.

[Screenshot: Searching for "terminal" in the Start menu]

4. Windows Terminal opens. You can switch between PowerShell and Command Prompt inside it.

[Screenshot: Windows Terminal screen]

:::tip Which one should I use?
If you are unsure, use Command Prompt. The commands needed for OpenForge work the same in any terminal.
:::

#### Convenient shortcut: Open directly from a folder

If you want to open a terminal in a specific folder, there is an easier way:

1. Open the target folder in File Explorer.
2. Click the address bar (the area at the top showing the folder path).
3. Type "cmd" and press Enter.
4. A Command Prompt opens at that folder location.

[Screenshot: Typing "cmd" in the File Explorer address bar]

### Mac

1. Open Terminal using one of the following methods:

**Method A: Open from Finder**

1. Open Finder.
2. Open the "Applications" folder.
3. Open the "Utilities" folder.
4. Double-click "Terminal".

[Screenshot: Finder showing Terminal inside the Utilities folder]

**Method B: Open with Spotlight Search (recommended)**

1. Press `Command + Space`.
2. Type "terminal".
3. "Terminal" appears. Press Enter or click it to open.

[Screenshot: Spotlight Search with "terminal" typed in]

4. A white (or black) window opens. This is the Terminal.

[Screenshot: Mac Terminal screen]

---

## Basic commands

Let's learn the basic commands you can use in a terminal. You do not need to memorize them all. Come back to this page whenever you need a reminder.

### Check your current location

A terminal has the concept of a "current location" (current directory). It represents where you are within the folder structure of your computer.

**Windows (Command Prompt):**

```bash
cd
```

Type `cd` by itself and press Enter to display your current location. For example, it might show `C:\Users\YourName`.

**Mac / Windows (PowerShell):**

```bash
pwd
```

`pwd` stands for "Print Working Directory".

### Navigate to a folder

```bash
cd foldername
```

`cd` stands for "Change Directory".

**Examples:**

Navigate to the Desktop:

```bash
cd Desktop
```

Go back up one level:

```bash
cd ..
```

`..` is a special symbol meaning "the parent folder".

**Navigate using a full path:**

Windows:
```bash
cd C:\Users\YourName\Documents\MyProject
```

Mac:
```bash
cd /Users/YourName/Documents/MyProject
```

:::tip Auto-complete folder names
Type the first few letters of a folder name and press `Tab` to auto-complete it. For example, type "Doc" and press `Tab` to get "Documents".
:::

### List the contents of a folder

**Windows (Command Prompt):**

```bash
dir
```

**Mac / Windows (PowerShell):**

```bash
ls
```

This displays a list of files and folders at your current location.

### Check the Node.js version

```bash
node -v
```

If Node.js is correctly installed, a version number (e.g., `v20.11.0`) is displayed.

### The npx command

```bash
npx command-name
```

`npx` is a tool included with Node.js for downloading and running packages (reusable pieces of software). It is frequently used during OpenForge setup.

:::info Difference between npx and npm
- `npm`: Installs packages on your computer
- `npx`: Downloads and runs a package temporarily

You will often use `npx` when starting the OpenForge MCP server.
:::

---

## Copy and paste in the terminal

Copying and pasting in a terminal can work slightly differently from regular applications.

### Windows Command Prompt

| Action | How to do it |
|--------|-------------|
| Copy | Select text with the mouse, then right-click (or `Ctrl + C`) |
| Paste | Right-click (or `Ctrl + V`) |

:::warning Note about Command Prompt
In older versions of Command Prompt, `Ctrl + C` acts as "cancel the current command" rather than copy. Selecting text and right-clicking is the more reliable method.
:::

### Windows PowerShell / Windows Terminal

| Action | How to do it |
|--------|-------------|
| Copy | `Ctrl + C` (while text is selected) |
| Paste | `Ctrl + V` or right-click |

### Mac Terminal

| Action | How to do it |
|--------|-------------|
| Copy | `Command + C` |
| Paste | `Command + V` |

---

## Frequently asked questions

### Q1: What if I type a command wrong?

No need to worry. If you enter an incorrect command, you will typically see an error message like "command not found" and nothing bad happens to your computer.

Just type the correct command again.

:::tip Recall the previous command
Press the up arrow key on your keyboard to recall the last command you entered. This is handy for making small corrections and re-running.
:::

### Q2: "'xxx' is not recognized as an internal or external command..."

This error means that the program for the command you typed is either not installed, or its location is not registered in the PATH (the list of places your computer looks for programs).

- For the `node` command: Node.js is not installed or PATH is not set up. Refer to the Node.js installation guide.
- If this error appears right after installation: Close the terminal and reopen it, then try again.

### Q3: The terminal screen has scrolled too much and is hard to read

There is a command to clear the screen:

**Windows:**

```bash
cls
```

**Mac:**

```bash
clear
```

This clears the display (past commands are hidden, but nothing is actually deleted).

### Q4: A command is running and will not finish

If a command keeps running and you cannot type the next one:

- Press `Ctrl + C` to forcibly stop the running command.

---

## Practice exercise

Let's try out what you have learned so far. Follow these steps in order:

1. Open a terminal.

2. Check your current location:

```bash
cd
```

3. Navigate to the Desktop:

```bash
cd Desktop
```

4. List the folder contents:

Windows:
```bash
dir
```

Mac:
```bash
ls
```

5. Go back up one level:

```bash
cd ..
```

6. Check whether Node.js is installed:

```bash
node -v
```

7. Check whether npm is installed:

```bash
npm -v
```

If everything runs without issues, you have mastered the terminal basics.

:::tip This is all you need
The only terminal skills required for OpenForge are copying a command from the documentation, pasting it, and pressing Enter. You do not need to memorize any commands. Come back to this page whenever you need help.
:::

---

## Summary

You have now completed the following:

- Opening a terminal (Command Prompt / PowerShell / Terminal)
- Basic commands (`cd`, `dir` / `ls`, `node -v`, `npx`)
- Copy and paste methods
- Handling errors

A terminal may feel intimidating at first, but in practice you will only use a handful of commands. It becomes natural with use.
