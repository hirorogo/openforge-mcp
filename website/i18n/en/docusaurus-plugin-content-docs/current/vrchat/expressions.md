---
sidebar_position: 5
title: "Expression Setup (FaceEmo)"
description: "A guide to setting up VRChat avatar expressions using FaceEmo"
---

# Expression Setup (FaceEmo)

This guide explains how to set up VRChat avatar expressions using FaceEmo. It covers everything from BlendShape detection, preset expression creation, custom expressions, gesture mapping, to building Expression Menus.

## What Is FaceEmo

FaceEmo is a tool for intuitively setting up VRChat avatar expressions. The VRChat expression system involves multiple interconnected mechanisms such as Animator Controllers and Expression Parameters, making manual setup complex. FaceEmo consolidates these settings and, when combined with OpenForge MCP, enables expression setup through natural language.

What FaceEmo manages:

- **Expression presets**: Definitions for happiness, anger, sadness, etc.
- **Gesture mapping**: Linking hand gestures to expressions
- **Expression Menu**: The expression switching menu used in VRChat
- **Animator Controller**: Internal animations for playing expressions

## Step 1: BlendShape Detection (auto_detect_blendshapes)

First, check what BlendShapes (facial deformation data used to create expressions) are available on the avatar.

**You:**
> List the avatar's BlendShapes.

**AI action:** `auto_detect_blendshapes` runs and displays the available BlendShapes.

**AI response example:**

```
BlendShape list (42 detected):

[Mouth]
  vrc.v_aa, vrc.v_ch, vrc.v_dd, vrc.v_e, vrc.v_ff,
  vrc.v_ih, vrc.v_kk, vrc.v_nn, vrc.v_oh, vrc.v_ou,
  vrc.v_pp, vrc.v_rr, vrc.v_sil, vrc.v_ss, vrc.v_th
  Mouth_Smile, Mouth_Open, Mouth_Pout, Mouth_Grin

[Eyes]
  Eye_Close_L, Eye_Close_R, Eye_Open_Wide_L, Eye_Open_Wide_R,
  Eye_Highlight_Off, Eye_Heart, Eye_Star, Eye_Jitome

[Eyebrows]
  Brow_Up_L, Brow_Up_R, Brow_Down_L, Brow_Down_R,
  Brow_Angry, Brow_Sad

[Cheeks]
  Cheek_Blush, Cheek_Puff

[Other]
  Tongue_Out, Tear_L, Tear_R, Dark_Circles
```

:::info About BlendShape Naming
BlendShape names vary by model. Those starting with `vrc.v_` are for lip sync (mouth movement) and are used automatically by VRChat. The remaining BlendShapes are available for expression setup.
:::

## Step 2: Create Basic Expression Presets (create_expression_preset)

Create a standard set of 8 expressions in one step.

**You:**
> Create the basic 8 expression presets.

**AI action:** `create_expression_preset` runs, automatically creating the following expressions:

| Expression Name | BlendShapes Used | Description |
|---|---|---|
| Smile | Mouth_Smile + Eye_Close_L/R (50%) | A soft smile with narrowed eyes |
| Angry | Brow_Angry + Mouth_Grin + Eye_Jitome | Furrowed brows, angry face |
| Sad | Brow_Sad + Eye_Close_L/R (30%) + Mouth_Pout | Lowered brows, sad expression |
| Surprised | Eye_Open_Wide_L/R + Brow_Up_L/R + Mouth_Open | Wide eyes and open mouth |
| Shy | Cheek_Blush + Eye_Close_L/R (40%) + Mouth_Smile (50%) | Blushing, bashful face |
| Wink | Eye_Close_L + Mouth_Smile | Left eye closed wink |
| Jitome | Eye_Jitome + Brow_Down_L/R | Half-lidded skeptical look |
| Tongue | Tongue_Out + Mouth_Open (30%) + Eye_Close_L/R (20%) | Playful tongue-out face |

**AI response example:**

```
Created 8 expression presets:
  Smile, Angry, Sad, Surprised, Shy, Wink, Jitome, Tongue
Each expression is configured with optimal values based on the detected BlendShapes.
```

:::tip Preset Accuracy
`create_expression_preset` estimates appropriate combinations from the detected BlendShape names. Depending on the model, the resulting expression may differ from what you intended. In that case, adjust it as a custom expression in the next step.
:::

## Step 3: Add Custom Expressions (add_expression)

Add expressions not included in the presets, or fine-tune existing presets.

### Create with Specific BlendShape Values

**You:**
> Add an expression called "Beaming". Set Mouth_Smile to 100%, Eye_Close_L and Eye_Close_R to 70%, and Cheek_Blush to 30%.

**AI action:** `add_expression` runs, creating the "Beaming" expression with the specified BlendShape values.

### Describe an Expression in Natural Language

**You:**
> Create a "Crying" expression. Tears flowing, eyes narrowed, mouth slightly open.

**AI action:** `add_expression` runs. The AI infers the appropriate BlendShape combination from the natural language description.

**AI response example:**

```
Created "Crying" expression:
  Eye_Close_L: 60%
  Eye_Close_R: 60%
  Tear_L: 100%
  Tear_R: 100%
  Brow_Sad: 80%
  Mouth_Open: 30%
```

**You:**
> Open the eyes a bit more. Keep the tears as they are.

**AI action:** The Eye_Close_L/R values are adjusted (e.g., 60% -> 30%).

### Preview an Expression

**You:**
> Preview the "Beaming" expression. Show me a screenshot.

**AI action:** A screenshot is captured with the specified expression's BlendShapes applied.

## Step 4: Gesture Mapping (add_gesture_expression)

In VRChat, you can assign expressions to controller hand gestures (hand shapes).

### Available Gestures

| Gesture | English Name | Description |
|---|---|---|
| Neutral | Neutral | No input state |
| Fist | Fist | Hand clenched into a fist |
| Open hand | HandOpen | Hand fully open |
| Pointing | FingerPoint | Index finger pointing |
| Peace | Victory | Peace sign |
| Rock | RockNRoll | Rock sign |
| Gun | HandGun | Gun hand shape |
| Thumbs up | ThumbsUp | Thumb raised |

### Assign Expressions to Gestures

**You:**
> Assign expressions to gestures. Peace for Smile, Fist for Angry, Open hand for Surprised, Pointing for Wink, Rock for Tongue, Thumbs up for Shy.

**AI action:** `add_gesture_expression` runs, assigning expressions to each gesture.

**AI response example:**

```
Gesture mapping configured:
  Neutral: (no expression - default face)
  Fist: Angry
  HandOpen: Surprised
  FingerPoint: Wink
  Victory: Smile
  RockNRoll: Tongue
  HandGun: (not set)
  ThumbsUp: Shy
```

:::info Left and Right Hand Settings
By default, the left hand gesture controls the expression. If you want to use the right hand, or change expressions based on left-right combinations, you can specify them individually.

```
"Make right hand Peace also trigger Wink"
"When left hand is Peace and right hand is Fist, use Jitome"
```
:::

### Gesture Transition

**You:**
> Make expressions transition smoothly when changing gestures. Use a 0.2 second transition.

**AI action:** The blend time for expression transitions is set to 0.2 seconds. When you change gestures, expressions will smoothly transition from one to the next.

## Expression Menu Setup

Configure the Expression Menu so expressions can be manually switched from within VRChat.

**You:**
> Add an expression submenu to the Expression Menu. Include all 8 expressions as selectable options.

**AI action:** An "Expressions" submenu is created in the Expression Menu, with each expression added as a toggle item.

**You:**
> Add "Crying" and "Beaming" to the menu too.

**AI action:** The custom expressions are added to the menu.

Final Expression Menu structure:

```
Expression Menu
  └─ Expressions
       ├─ Smile
       ├─ Angry
       ├─ Sad
       ├─ Surprised
       ├─ Shy
       ├─ Wink
       ├─ Jitome
       ├─ Tongue
       ├─ Beaming
       └─ Crying
```

## Testing Expressions

### Testing in Unity

**You:**
> Preview each expression one by one. Show all expression screenshots side by side.

**AI action:** Each expression is applied in sequence and screenshots are captured. They are displayed as a grid so you can review all expressions.

### Checklist

| Item | Details |
|---|---|
| Appearance | Does the expression look as intended? |
| BlendShape interference | Do multiple BlendShapes conflict and look unnatural? |
| Lip sync coexistence | Does lip sync work correctly during expressions? |
| Gesture response | Does the correct gesture trigger the correct expression? |
| Transition smoothness | Is there any unnatural flickering during expression changes? |

:::warning Lip Sync Conflicts
Expressions that significantly deform the mouth (smiles, open-mouth surprise, etc.) may interfere with lip sync. FaceEmo automatically manages the priority between lip sync BlendShapes and expression BlendShapes, but if results look unnatural, reduce the mouth BlendShape values.
:::

## Advanced Settings

### Expression Lock

A feature to lock a specific expression so it stays active regardless of gesture changes.

**You:**
> Add an expression lock feature. Make it toggleable from the Expression Menu.

**AI action:** An "Expression Lock" toggle is added to the Expression Menu. When enabled, the current expression is maintained regardless of gestures.

### Expression Combinations

Configure separate control of different facial parts.

**You:**
> Make eye expressions and mouth expressions controllable independently. Eyes controlled by gestures, mouth selected from the Expression Menu.

**AI action:** Expressions are split into "eye" and "mouth" layers, each controllable independently.

## Next Steps

After completing expression setup, see the following guides:

- [Avatar Setup](./avatar-setup.md) -- Return to the overall avatar setup
- [PhysBone Setup](./physbone.md) -- Set up hair and skirt physics
- [Performance Optimization](./optimization.md) -- Optimize parameters when you have many expressions
- [Upload](./upload.md) -- Upload to VRChat
