---
sidebar_position: 14
title: "Adding Sound"
description: "Set up BGM, sound effects, and spatial audio using Unity's Audio system through conversation with AI"
---

# Adding Sound

Sound adds a sense of presence that visuals alone cannot convey. This tutorial covers Unity's Audio system: playing BGM, setting up sound effects, 3D spatial audio, reverb zones, and audio mixers.

## Prerequisites

- Unity is running and connected to OpenForge MCP
- You have a scene with some objects placed
- Audio files (.wav or .ogg) are imported into the project, or you can ask the AI to provide them

## Step 1: Add an AudioSource

An AudioSource component is needed to play sound.

**You:**
> Create an empty GameObject at the center of the scene. Name it "BGMPlayer". Add an AudioSource component.

**What the AI does:** A GameObject with AudioSource is created.

### Basic Settings

**You:**
> Configure BGMPlayer's AudioSource with the following:
> - Play On Awake on (plays when the scene starts)
> - Loop on (loop playback)
> - Volume 0.3 (keep BGM subtle)

**What the AI does:** The AudioSource properties are set.

**You:**
> Assign an audio clip to the BGM. Use a BGM file if one exists in the project; otherwise, prepare something calm and ambient.

**What the AI does:** An audio clip is assigned to the AudioSource's Clip.

**You:**
> Play the scene and check if the sound is playing.

:::info AudioSource and AudioListener
Both an AudioSource (sound emitter) and AudioListener (receiver) are needed to play sound. AudioListener is usually attached automatically to the Main Camera. If there are two or more AudioListeners in the scene, you will get a warning.
:::

## Step 2: Set Up 3D Spatial Audio

BGM works fine as 2D (same volume regardless of position), but making sound effects 3D (volume changes with distance) adds immersion.

### 2D vs 3D Audio

**You:**
> Set BGMPlayer's AudioSource Spatial Blend to 0. This makes it a fully 2D sound source.

**What the AI does:** Spatial Blend is set to 0. BGM is heard at the same volume no matter where the player is.

### Create a 3D Sound Effect

**You:**
> Add an AudioSource to the campfire object in the scene. Assign a crackling fire sound effect. Configure it as follows:
> - Spatial Blend to 1 (fully 3D)
> - Min Distance 2 meters
> - Max Distance 15 meters
> - Loop on
> - Volume 0.8

**What the AI does:** A 3D AudioSource is configured on the campfire object. It gets louder as the player approaches and quieter as they move away.

**You:**
> Play the scene and check the volume change when approaching and moving away from the campfire.

:::tip 3D Audio Rolloff Curves
The AudioSource Rolloff mode controls how volume decreases with distance.

- **Logarithmic Rolloff:** Realistic attenuation. Gets loud quickly up close.
- **Linear Rolloff:** Straight-line attenuation. More game-friendly and predictable.
- **Custom Rolloff:** Draw your own curve. For when you need fine control.

**You:**
> Change the campfire AudioSource Rolloff to Linear.
:::

## Step 3: Attach Sound Effects to Events

Link sound effects to in-game actions.

### Button Click Sound

**You:**
> Make a "click" sound play when a UI button is clicked. Use an AudioSource and link Play() to the click event.

**What the AI does:** AudioSource.Play() is connected to the button's OnClick event.

### Footsteps

**You:**
> Make footstep sounds play when the player character walks. Trigger them when the walking animation's feet touch the ground. Prepare multiple AudioClips that randomly alternate.

**What the AI does:** A system is created using animation events or a script to play footstep sounds during walking. Random clip selection prevents repetitive sounds.

### Collision Sound Effects

**You:**
> Create a script that plays a collision sound when objects collide. Use OnCollisionEnter and vary the Volume based on collision strength.

**What the AI does:** A collision detection script is generated. Weak collisions produce quiet sounds; strong collisions produce loud sounds.

:::info AudioSource.PlayOneShot
For short sound effects, use PlayOneShot() instead of Play(). PlayOneShot() can overlay multiple sounds on the same AudioSource, so sounds do not cut off when effects trigger in rapid succession.

**You:**
> Change the footstep script to use PlayOneShot.
:::

## Step 4: Create Reverb Zones

Changing how sound reverberates by location conveys a sense of space size and material.

**You:**
> Add an Audio Reverb Zone to the cave area. Set ReverbPreset to Cave. MinDistance 5 meters, MaxDistance 20 meters.

**What the AI does:** A Reverb Zone is placed in the cave area. When entering this zone, all sounds echo as if in a cave.

**You:**
> Add a Reverb Zone to the indoor area too. Set ReverbPreset to Room.

**What the AI does:** An indoor Reverb Zone is added.

**You:**
> Check how footsteps sound different when in the cave versus outdoors.

:::tip Choosing Reverb Presets
Choose reverb presets to match the location's atmosphere.

| Location | Recommended Preset |
|----------|-------------------|
| Cave | Cave |
| Cathedral | Cathedral |
| Small room | Room |
| Corridor | Hallway |
| Outdoors | Plain (or no reverb) |
:::

## Step 5: Use an Audio Mixer

Use an Audio Mixer to manage volume for multiple sound categories.

### Create the Mixer

**You:**
> Create an Audio Mixer named "MainMixer". Create 3 groups: "BGM", "SFX", and "Ambient".

**What the AI does:** An Audio Mixer with 3 sub-channel groups is created.

### Assign AudioSources to Groups

**You:**
> Route BGMPlayer's AudioSource output to MainMixer's BGM group. Route the campfire AudioSource to the Ambient group. Route sound effects to the SFX group.

**What the AI does:** Each AudioSource's Output is set to its respective mixer group.

### Adjust Volume Balance

**You:**
> Set BGM group volume to -10dB. Keep SFX group at 0dB. Set Ambient group to -5dB.

**What the AI does:** Each mixer group's volume is adjusted. BGM stays subtle while sound effects come through clearly.

### Integration with Settings Screen

**You:**
> Make it so BGM and SFX volumes can be adjusted separately with sliders on the settings screen. Use the mixer's Exposed Parameters.

**What the AI does:** Mixer parameters are Exposed, allowing scripts to change volume based on slider values.

:::info Mixer Effects
Audio Mixers can also have effects added. For example, applying a lowpass filter to muffle BGM during a pause screen, or making all audio sound muffled during underwater scenes -- these expand your creative options.

**You:**
> Apply a Lowpass Filter to the BGM group during pause. Set cutoff frequency to 500Hz.
:::

## Step 6: Final Check

With all sounds in place, listen through the entire experience.

**You:**
> Play the scene. While moving the player around, check the following:
> - Is BGM looping at an appropriate volume?
> - Does the campfire sound get louder when approaching?
> - Do footsteps match the animation?
> - Does reverb apply in the cave?

**What the AI does:** The AI plays the scene and checks each item.

## Summary

What you learned in this tutorial:

1. **AudioSource** -- The basic component for playing sound
2. **3D spatial audio** -- Spatial Blend and volume changes with distance
3. **Event-driven playback** -- Button clicks, footsteps, collision sounds
4. **Reverb zones** -- Location-based sound reverberation
5. **Audio mixer** -- Category-based sound management and volume balancing

Sound greatly affects the sense of immersion in a game. Tell the AI "make this sound a bit quieter" or "add more reverb" as you craft a pleasing soundscape.
