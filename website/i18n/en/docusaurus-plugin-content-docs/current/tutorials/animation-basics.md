---
sidebar_position: 10
title: "Adding Animations"
description: "Create animations in Blender and control them with Unity's Animator Controller"
---

# Adding Animations

Once you have a 3D model, it is time to bring it to life. This tutorial covers creating walk and idle animations in Blender, then using Unity's Animator Controller and Blend Trees for smooth transitions. Everything is done through conversation with the AI.

## Prerequisites

- Blender and Unity are running and connected to OpenForge MCP
- You have a character model in Unity that you want to animate (created in Blender or imported)
- The character has an armature (bones) set up

:::info If There Is No Armature
You cannot animate a model without bones. You need to add an armature in Blender first.

**You:**
> Add a humanoid armature to the character model open in Blender. Scale it to match the character's height.

This will give the model a bone structure.
:::

## Step 1: Create an Idle Animation (Blender)

Start with the most basic animation: the "doing nothing" state.

**You:**
> Create an idle animation for the character in Blender. Make it a natural breathing motion with a gentle up-and-down sway. Set it to 60 frames and make it loop.

**What the AI does:** A new action called "Idle" is created in Blender's Action Editor, with keyframes on the chest and shoulder bones for subtle up-and-down movement. Frame 60 matches frame 1, so the loop plays seamlessly.

**You:**
> Preview the animation for me.

**What the AI does:** The animation plays in Blender and a screenshot or preview is returned.

:::tip Checking the Loop
For loop animations, it is important that the first and last poses match. If there is a hitch at the seam, try this:

**You:**
> Adjust the Idle animation so the first and last frames transition smoothly.
:::

## Step 2: Create a Walk Animation (Blender)

Next, the walk animation.

**You:**
> Create a walk animation for the same character. Normal walking speed with natural arm swing. Make it a 30-frame cycle for one step, and make it loopable.

**What the AI does:** A new action called "Walk" is created. Leg bones move forward and back, and arm bones swing in the opposite direction.

**You:**
> Add a slight side-to-side sway during walking. Make it look like a realistic walk.

**What the AI does:** Subtle lateral rotation is added to the hip bone for a more natural gait.

## Step 3: Create a Run Animation (Blender)

With walking done, create a run animation too. This will be used in the Blend Tree later.

**You:**
> Create a run animation too. Faster tempo than Walk, 20 frames per cycle. Larger arm swing, slightly more forward lean.

**What the AI does:** A "Run" action is added. The stride is larger and the tempo is faster compared to Walk.

## Step 4: Export the Animations

With all three animations ready, bring them into Unity.

**You:**
> Export the Idle, Walk, and Run animations from Blender as FBX. Save them to the Unity project folder.

**What the AI does:** An FBX file is exported and placed in the Unity project. It contains all three actions as animation clips.

:::info FBX Export Settings
The AI will automatically choose appropriate settings, but if there are issues you can specify them:

**You:**
> Set the FBX export scale to 1.0 and turn on animation baking.
:::

## Step 5: Create an Animator Controller (Unity)

Now for the Unity side. Use an Animator Controller to manage animation state transitions.

**You:**
> Create an Animator Controller for the character and assign it. Name it "CharacterAnimator".

**What the AI does:** An Animator Controller is created and assigned to the character's Animator component.

### Add States

**You:**
> Add "Idle", "Walk", and "Run" states to CharacterAnimator. Assign the corresponding animation clips to each. Set Idle as the default state.

**What the AI does:** Three States are created in the Animator Controller, each linked to its animation clip. Idle becomes the orange default state.

### Add Parameters

**You:**
> Add a Float parameter called "Speed" to the Animator. Default value 0.

**What the AI does:** The Speed parameter is added to the Animator's Parameters tab.

## Step 6: Set Up Transitions

Create conditions for switching between states.

**You:**
> Create a transition from Idle to Walk. Condition: Speed greater than 0.1. Transition duration: 0.2 seconds.

**What the AI does:** A transition arrow from Idle to Walk is added with the condition set.

**You:**
> Create a transition from Walk to Idle too. Condition: Speed 0.1 or less. Transition duration: 0.2 seconds.

**What the AI does:** A return transition from Walk to Idle is added.

**You:**
> Create a transition from Walk to Run. Condition: Speed greater than 0.6. Transition duration: 0.15 seconds.

**What the AI does:** A walk-to-run transition is added.

**You:**
> Create a transition from Run to Walk too. Condition: Speed 0.6 or less. Transition duration: 0.15 seconds.

**What the AI does:** A run-to-walk return transition is added.

:::tip Adjusting Transition Duration
If the transition duration is too short, animation switches look abrupt. If too long, they feel sluggish. Try values between 0.1 and 0.3 seconds.
:::

## Step 7: Smooth Blending with Blend Trees

Transitions give you a binary "walking" or "running" choice, but Blend Trees let you smoothly blend between walk and run based on the Speed value.

**You:**
> Delete the Walk and Run states from the Animator Controller. Replace them with a single Blend Tree called "Locomotion". Parameter is Speed, with Idle (Speed=0), Walk (Speed=0.5), and Run (Speed=1.0) as the three motions.

**What the AI does:** Walk and Run states are replaced by the Blend Tree "Locomotion." When Speed is 0, Idle plays; at 0.5, Walk plays; at 1.0, Run plays. Intermediate values automatically blend between them.

**You:**
> Show me a preview of slowly changing Speed from 0 to 1.

**What the AI does:** The result is previewed with Speed changing incrementally. You can see the character go from standing still, to slowly walking, to running.

:::info Types of Blend Trees
This tutorial used a 1D Blend Tree (controlled by a single parameter). A 2D Blend Tree lets you use two parameters -- such as "forward speed" and "lateral speed" -- to blend 8-directional movement animations.
:::

## Step 8: Trigger Actions

Beyond walking and running, learn how to play one-shot actions like jumps using Triggers.

**You:**
> Create a jump animation for the character in Blender. A vertical jump in place, 20 frames from takeoff to landing.

**What the AI does:** A Jump action is created in Blender.

**You:**
> Export the jump animation to Unity. Add a "Jump" Trigger parameter to the Animator Controller. Create a transition from Locomotion to Jump state controlled by the Jump trigger. Return to Locomotion when Jump finishes.

**What the AI does:** A Trigger parameter and Jump state are added. Triggers automatically reset after firing, so pressing the button plays the jump exactly once.

:::tip Trigger vs Bool
- **Trigger:** Automatically resets after firing. Suited for one-shot actions like jumps or attacks.
- **Bool:** Manually toggled on and off. Suited for sustained actions like crouching.
:::

## Step 9: Test It

With everything in place, test it in action.

**You:**
> Add a simple movement script to the character. WASD keys for movement, updating the Animator's Speed parameter based on movement speed. Space key fires the Jump trigger.

**What the AI does:** A movement script is generated and attached to the character.

**You:**
> Play the scene and take a screenshot of the character walking.

**What the AI does:** Play mode is entered, and the character can be seen moving with the walk animation.

## Common Issues and Fixes

Here are points where animation work commonly runs into trouble.

### Feet Sinking Into the Ground

**You:**
> The feet are sinking below the ground during the walk animation. Fix it.

The AI adjusts root motion settings or bone positions.

### Animation Speed Mismatch

**You:**
> The animation is too fast for the movement speed. The feet look like they are sliding. Adjust the animation playback speed.

The AI adjusts the Animator State's Speed Multiplier.

### Character Stuck in T-Pose

The Animator settings may not be correct.

**You:**
> The character is stuck in T-pose and not moving. Check if the Animator Controller is correctly assigned.

## Summary

What you learned in this tutorial:

1. **Animation creation in Blender** -- Created Idle, Walk, Run, and Jump animations
2. **FBX export** -- Transferring from Blender to Unity
3. **Animator Controller** -- Setting up States and Transitions
4. **Blend Tree** -- Smooth animation blending based on Speed values
5. **Trigger** -- Firing one-shot actions
6. **Testing** -- Verifying functionality with a movement script

Animation breathes life into your game characters. Experiment through conversation with the AI to find animations that feel just right.
