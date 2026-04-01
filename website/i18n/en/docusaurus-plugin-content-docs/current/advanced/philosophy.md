---
sidebar_position: 8
---

# Design Philosophy

Why OpenForge MCP is free. Why it is designed the way it is.

---

## AI tools shouldn't be expensive

AI-powered creative tools are appearing everywhere. Most of them cost money -- monthly subscriptions, one-time purchases ranging from tens to hundreds of dollars.

But think about it for a moment.

The internals of a Unity MCP tool are, for the most part, "call a fixed API in a fixed order." Call `GameObject.CreatePrimitive()`. Record it with `Undo.RegisterCreatedObjectUndo()`. Return the result as JSON.

This is fixed logic. There is no sophisticated decision-making happening on each run.

The sophisticated decisions come from the AI (Claude, GPT, Gemini), not from the MCP tool. The tool just calls APIs as instructed.

Should you really be paying thousands for that? We didn't think so.

---

## What the AI should do vs. what the tool should do

A developer once shared this observation:
https://x.com/i/status/2038958744852394412

> "I had Claude Code doing everything, and my token costs ended up more than double what I expected. In hindsight it was obvious. I was having the AI handle fixed-logic tasks like RSS crawling. It was like hiring a top chef to wash dishes."

The same principle applies to MCP tools.

**What the AI should do:**
- Decide *what* to build
- Interpret vague user instructions
- Look at the result and judge whether it needs improvement
- Plan multi-step workflows

**What the tool should do:**
- Call the Unity / Blender / Godot API as instructed
- Return structured results
- Report errors

The tool is the prep work. The AI is the seasoning. Charging money for prep work doesn't make sense.

---

## OpenForge MCP's design principles

### 1. Don't waste AI tokens

If you dump all tool definitions into the AI's context, it fills up fast. Loading 620+ tool definitions every time would consume a huge number of tokens.

OpenForge exposes just three meta-tools to the AI:

```
list_categories -> list_tools -> execute
```

The AI loads tool details only when it actually needs them. Categories that aren't relevant never get loaded. This alone dramatically reduces context pressure.

Buying an expensive tool and then paying inflated token costs on top of that -- that's the user losing twice.

### 2. Don't charge for fixed logic

Look inside `create_gameobject`:

```csharp
var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
go.name = name;
Undo.RegisterCreatedObjectUndo(go, "Create " + name);
```

This is fixed logic. Anyone would write the same thing. There is no per-run judgment involved.

Selling code like this is essentially putting a price tag on knowledge the community has accumulated over years. Unity's API documentation is freely available. There is no reason to charge for a wrapper that simply calls those APIs.

### 3. Let the AI decide; let the tool execute

What sets OpenForge apart is that **it does not embed decision-making in the tool layer**.

Take Visual Feedback as an example. The AI captures a screenshot and judges for itself whether the result is acceptable. The judgment comes from the AI. The tool just takes the screenshot and returns it.

AI Playtest works the same way. The tool enters Play mode, collects logs, and captures screenshots -- all fixed logic. Deciding whether a bug is serious or what is causing low FPS is the AI's job.

With this design, as AI models get smarter, the tools become more valuable automatically. You never need to replace the tool itself.

### 4. Don't lock away community contributions

Paid tools have a structural problem. When users find a bug or think of an improvement, they can't touch the code. They have to wait for the vendor to act.

OpenForge is MIT-licensed. Anyone can read the code, fix it, and add tools.

In C#, a single annotation is all you need to expose a custom tool to MCP:

```csharp
[OpenForgeTool("my_tool", "description")]
public static void MyTool(string param) { ... }
```

In Python:

```python
@openforge_tool("my_tool", "description")
def my_tool(param: str) -> dict: ...
```

Tools built by the community belong to the community. Locking them behind a paywall instead of keeping them open weakens the ecosystem. Keeping them free makes the whole ecosystem stronger.

---

## Summary

- The "tool" part of an AI tool is fixed logic. It shouldn't be expensive.
- A design that conserves AI tokens saves users real money.
- Let the AI handle judgment; let the tool handle execution.
- Community knowledge belongs to the community.

OpenForge MCP is free. It will always be free.
