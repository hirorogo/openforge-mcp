---
sidebar_position: 1
title: "Students Can Start for Free"
---

# Students Can Start for Free

OpenForge MCP is MIT-licensed open-source software. Anyone can use it for free.

And if you are a student, you can get the AI side of things for free too -- meaning the entire setup costs nothing.


## OpenForge MCP is free

OpenForge MCP is released under the MIT license. It is completely free, including for commercial use. There is no cost to download, install, or use it.


## Students get AI for free too

OpenForge MCP requires an AI client, but students can use GitHub Copilot at no cost.

### What is GitHub Education?

GitHub Education is a program that gives students free access to GitHub's paid services.

Key benefits include:

- **GitHub Copilot for free** (normally $10/month)
- GitHub Pro account
- Cloud service credits from various providers

### How to apply

1. Go to [github.com/education](https://github.com/education)
2. Click "Get benefits"
3. Sign in with your GitHub account (create one if you don't have one)
4. Enter your school email address (e.g., one ending in .edu)
5. Upload a photo of your student ID
6. Submit the application
7. Approval typically takes a few days

Once approved, all student benefits -- including GitHub Copilot -- are activated.


## A completely free AI game development setup

With GitHub Copilot available, here is a fully free development environment:

| Software | Cost |
|---|---|
| OpenForge MCP | Free (MIT license) |
| VS Code | Free |
| GitHub Copilot | Free for students (GitHub Education) |
| Unity | Free for students (Unity Student Plan) |
| Blender | Free (for everyone) |
| Godot | Free (for everyone) |

Total cost: zero.


## Setup steps

### 1. Apply for GitHub Education

Follow the steps above to apply for the GitHub Education Pack. While you wait for approval, you can proceed with the rest of the setup.

### 2. Install VS Code

Download and install VS Code from [code.visualstudio.com](https://code.visualstudio.com).

### 3. Install the GitHub Copilot extension

Open VS Code, go to the Extensions tab, search for "GitHub Copilot," and install it. Sign in with your GitHub account.

### 4. Set up OpenForge MCP

Run the following command in a terminal:

```bash
npx openforge-mcp setup --client vscode --mode dynamic
```

### 5. Install a game engine

Install whichever engine you want to use. You can install more than one.

- **Unity**: Apply for the Unity Student Plan at [unity.com/education](https://unity.com/education) (free for students)
- **Blender**: Download from [blender.org](https://blender.org) (free for everyone)
- **Godot**: Download from [godotengine.org](https://godotengine.org) (free for everyone)

### 6. Install the OpenForge plugin

Install the OpenForge plugin for your engine.

For Unity:
```bash
npx openforge-mcp install unity
```

For Blender:
```bash
npx openforge-mcp install blender
```

### 7. Start chatting with Copilot

Open Copilot Chat in VS Code (Ctrl+Shift+I) and give it an instruction in plain language.

```
Create a new scene in Unity and place one Cube in it
```

The AI will operate the game engine on your behalf.


## Cost breakdown by engine

### Unity

Free with the Unity Student Plan. Apply with your school email at [unity.com/education](https://unity.com/education). Unity Personal is also free for anyone whose annual revenue is below a certain threshold.

### Blender

Blender is fully open-source and free for everyone, including commercial use. Student status is irrelevant.

### Godot

Godot is also fully open-source under the MIT license. Free for everyone.


## Not a student? You can still start for free

Even without student status, you can eliminate AI costs entirely by using a local LLM.

### Using LM Studio

LM Studio is an application for running LLMs locally. You can choose a model that fits your hardware.

```bash
npx openforge-mcp setup --client lm-studio
```

### Using Ollama

Ollama is a command-line tool for running local LLMs.

```bash
npx openforge-mcp setup --client ollama
```

Local LLMs require no internet connection and offer full privacy. The trade-off is that response quality may not match large cloud models.


## Summary

Everything you need is available for free:

- OpenForge MCP: Free
- AI (GitHub Copilot): Free for students
- AI (local LLM): Free for everyone
- Unity: Free for students
- Blender: Free for everyone
- Godot: Free for everyone

The days of "I can't create because I can't afford the tools" are over. All you need is a computer, an internet connection, and your ideas.

Start building today.
