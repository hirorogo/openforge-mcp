---
sidebar_position: 13
title: "Building Game UI"
description: "Create title screens, HUDs, and pause menus using Unity's uGUI system through conversation with AI"
---

# Building Game UI

Every game needs UI. Title screens, health bars, score displays, pause menus -- let's build them using Unity's uGUI system and conversation with the AI.

## Prerequisites

- Unity is running and connected to OpenForge MCP
- You have a game scene (a simple one is fine)

## Step 1: Create a Canvas

All Unity UI elements are placed on a Canvas. Let's create one.

**You:**
> Create a UI Canvas. Screen Space - Overlay mode, Reference Resolution 1920x1080. Set the Canvas Scaler UI Scale Mode to Scale With Screen Size.

**What the AI does:** A Canvas object is created. The Canvas Scaler Match value defaults to 0.5 (balanced between width and height).

:::info Canvas Rendering Modes
- **Screen Space - Overlay:** Always renders on top of everything. Standard for general UI.
- **Screen Space - Camera:** Tied to a specific camera. Affected by camera effects.
- **World Space:** Places UI in 3D space. For in-game billboards, HP bars, etc.
:::

## Step 2: Build the Title Screen

### Background

**You:**
> Create a background Image on the Canvas for the title screen. Size it to cover the entire Canvas. Dark navy color with slight transparency.

**What the AI does:** A full-screen background panel is created.

### Title Text

**You:**
> Place large title text in the upper-center of the screen. Text: "CLIFF WALKER". Font size 72, white color. Use Text Mesh Pro.

**What the AI does:** A TextMeshPro - Text component is added with the title displayed prominently.

**You:**
> Add a drop shadow to the title text. Shadow color black, offset (2, -2).

**What the AI does:** TextMeshPro shadow settings are applied.

### Buttons

**You:**
> Place 3 buttons vertically below the title text: "New Game", "Continue", and "Settings". Spacing 20 pixels. Button color dark gray, text white, font size 28.

**What the AI does:** Three Button objects are arranged vertically using a Vertical Layout Group.

**You:**
> Set the button hover color to light gray and the click color to orange.

**What the AI does:** Color Tint is configured on each button for interactive feedback.

**You:**
> Show me a screenshot of the title screen.

:::tip Anchors and Pivots
Understanding Anchors and Pivots is important for UI element placement.

- **Anchor:** Which point on the parent element to use as reference. Set to (0.5, 0.5) to anchor to the screen center.
- **Pivot:** Which point on the element itself to use as reference. Set to (0.5, 0.5) for center alignment.

**You:**
> Set the title text anchor to the top-center of the screen. Make it stay at the top even when screen size changes.

This way, the layout holds up across different resolutions.
:::

## Step 3: Build the HUD (Heads-Up Display)

Create the persistent in-game information display.

### Health Bar

**You:**
> Create a health bar in the upper-left of the screen. Dark red background, bright red gauge. Width 200 pixels, height 25 pixels. Anchor top-left, margin (20, -20).

**What the AI does:** Two overlapping Images (background and gauge) are created. The gauge Image Type is set to Filled so the bar length changes with the value.

**You:**
> Add a small "HP" label above the health bar. Font size 14.

**What the AI does:** A small text element is added above the health bar.

### Score Display

**You:**
> Display "Score: 0" text in the upper-right of the screen. Anchor top-right. Font size 24, white. 20-pixel margin from the right edge.

**What the AI does:** Score text is placed in the upper-right. The top-right anchor keeps it fixed to the right edge regardless of screen width.

### Minimap Placeholder

**You:**
> Create a minimap frame in the lower-right of the screen. 150x150 pixel square. Semi-transparent black background. White border, 2 pixels thick. Place "MINIMAP" placeholder text inside.

**What the AI does:** A minimap frame is placed in the lower-right. The actual minimap functionality can be implemented later -- this reserves the space.

**You:**
> Show me a screenshot of the HUD.

:::info Layout and Anchor Placement Patterns
There are standard patterns for HUD element placement:

| Element | Anchor Position | Reason |
|---------|----------------|--------|
| Health bar | Top-left | Frequently checked by the player |
| Score | Top-right | Track game progress |
| Minimap | Bottom-right | Less likely to obstruct the view |
| Item bar | Bottom-center | Consolidate controls at the bottom |

These are conventions and can be adjusted to fit your game type.
:::

## Step 4: Build the Pause Menu

Create a pause menu that appears when pressing ESC during gameplay.

### Darkening Panel

**You:**
> Create a panel for the pause menu. Cover the entire Canvas with semi-transparent black (alpha 0.7). Name it "PausePanel". Start it inactive (hidden).

**What the AI does:** A darkening Image is created and set to inactive (hidden).

### Menu Body

**You:**
> As a child of PausePanel, create a menu panel centered on screen. Size 400x300 pixels, dark gray background. Rounded corners.

**What the AI does:** A centered menu panel is placed.

**You:**
> Place "PAUSE" text at the top of the menu panel. Font size 36, white.

**You:**
> Below that, place 3 buttons vertically: "Resume", "Settings", "Return to Title". Same style as the title screen.

**What the AI does:** Three pause menu buttons are added.

### Show/Hide Script

**You:**
> Create a script that toggles PausePanel visibility when pressing ESC. While paused, set Time.timeScale to 0 to freeze the game. Set it back to 1 when resuming.

**What the AI does:** A PauseManager script is generated and attached to the Canvas or an empty GameObject.

**You:**
> Show me a screenshot with the pause menu displayed.

:::warning Time.timeScale Considerations
Setting Time.timeScale to 0 stops all physics and Time.deltaTime-based processing. If you want certain things to keep running during pause (like UI animations), use Time.unscaledDeltaTime instead.
:::

## Step 5: Adjust the Layout

Make sure the UI does not break at different screen sizes.

**You:**
> Show me screenshots at both 16:9 and 4:3 aspect ratios. I want to check if the UI breaks.

**What the AI does:** Screenshots at different aspect ratios are returned. If anything is broken, ask for fixes.

**You:**
> At 4:3, the buttons extend beyond the screen. Adjust the anchors so they fit at any aspect ratio.

**What the AI does:** Anchors and offsets are adjusted so the layout holds across different screen sizes.

:::tip Responsive UI Tips
- Avoid fixed pixel values where possible; use anchor-based relative positioning
- Setting Canvas Scaler Match to 0.5 balances width and height scaling well
- Layout Group and Content Size Fitter components auto-adjust sizes based on content
:::

## Step 6: UI Transition Animations

Add simple animations for showing and hiding UI to improve visual polish.

**You:**
> When the pause menu appears, make it fade in. 0.3 seconds, alpha from 0 to 1.

**What the AI does:** A CanvasGroup component is added, and alpha animation is set up via script or Animator.

**You:**
> Also make the title screen buttons slide in from below when the screen appears.

**What the AI does:** Position animation is added to the buttons.

## Summary

What you learned in this tutorial:

1. **Canvas** -- Creating and configuring the foundation for UI
2. **Title screen** -- Background, text, and button placement
3. **HUD** -- Health bar, score, and minimap frame placement
4. **Pause menu** -- Darkening panel, menu buttons, and pause logic
5. **Anchors and layout** -- Responsive placement for different screen sizes
6. **UI animations** -- Fade-in and slide-in effects for visual polish

UI is the interface between the player and the game. Beyond looks, usability matters too. Feel free to ask the AI "make this button a bit bigger" or "tighten the spacing" as you work toward a UI that feels good to use.
