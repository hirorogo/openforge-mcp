---
sidebar_position: 10
title: "VRChat Recipes"
description: "A collection of recipes for automating VRChat content creation workflows"
---

# VRChat Recipes

This guide introduces "recipes" that bundle commonly used VRChat production workflows. A recipe combines multiple tool calls into a single procedure that can be executed with a single natural language command.

## What Are Recipes

Recipes define a series of operations in a YAML file for reuse. For example, "setting up a VRM as a VRChat avatar" normally requires 5-8 tool calls, but with a recipe, it completes in a single command.

Benefits of recipes:

- **Time savings**: Execute multiple steps at once
- **Standardized procedures**: Achieve consistent setup quality every time
- **Easy sharing**: Share YAML files across a team
- **Customizable**: Adapt to different configurations by changing variables

## Available VRChat Recipes

### avatar-quick-setup (Quick Avatar Setup)

A recipe that sets up a VRChat avatar from a VRM file in one go.

**Steps performed:**

1. Import VRM file into Unity
2. `setup_vrc_avatar` to configure VRChat avatar settings
3. `set_viewpoint` to auto-configure the viewpoint
4. `setup_hair_physbone` to set up hair PhysBone
5. `create_expression_preset` to create 8 basic expressions
6. `add_gesture_expression` for gesture mapping
7. `check_avatar_rank` to check performance rank
8. `validate_for_upload` for pre-upload validation

**How to run:**

**You:**
> Run the avatar quick setup recipe. The VRM file is "my_avatar.vrm".

**AI action:** The 8 steps above run in sequence, with results reported together.

**AI response example:**

```
Avatar quick setup complete:

  1. VRM import: OK (my_avatar.vrm -> Assets/Avatars/my_avatar/)
  2. Avatar settings: OK (VRC_AvatarDescriptor configured)
  3. Viewpoint: OK (auto-detected and placed)
  4. PhysBone: OK (24 hair bones configured)
  5. Expressions: OK (8 expression presets created)
  6. Gestures: OK (7 gestures mapped to expressions)
  7. Rank: Medium (4 materials, 138 bones)
  8. Validation: OK (ready to upload)

Time elapsed: approximately 45 seconds
```

### world-basic-setup (Basic World Setup)

A recipe that sets up the basic structure of a VRChat world in one step.

**Steps performed:**

1. `setup_vrc_world` to configure the world descriptor
2. Create a floor object with colliders
3. `add_spawn_point` to place the spawn point
4. `create_light` to add a directional light
5. Add a point light
6. `add_vrc_mirror` to place a mirror
7. `validate_for_upload` for validation

**How to run:**

**You:**
> Run the basic world setup recipe.

**AI action:** The basic world structure is automatically set up.

**AI response example:**

```
Basic world setup complete:

  1. World descriptor: OK (VRC_SceneDescriptor configured)
  2. Floor: OK (50m x 50m with colliders)
  3. Spawn point: OK (placed near origin)
  4. Directional light: OK (angle 50 degrees, white light)
  5. Point light: OK (placed above spawn point)
  6. Mirror: OK (2m x 2.5m)
  7. Validation: OK (ready to upload)

Add objects and decorations from this base to build out your world.
```

### outfit-change (Outfit Switching)

A recipe that automates Modular Avatar outfit switching setup.

**Steps performed:**

1. Place outfit Prefab as a child of the avatar
2. `auto_setup_outfit` for automatic setup
3. `add_ma_toggle` to add a toggle to the Expression Menu
4. `add_ma_blendshape_sync` to sync body shape BlendShapes
5. `validate_for_upload` for validation

**How to run:**

**You:**
> Run the outfit switching recipe. The outfit is "SummerDress" and the toggle name is "Summer Dress".

**AI action:** Outfit setup and menu registration run automatically.

**AI response example:**

```
Outfit switching setup complete:

  1. Placement: OK (SummerDress placed as child of avatar)
  2. Auto setup: OK (MA Merge Armature, body mesh hiding configured)
  3. Toggle: OK ("Summer Dress" added to Expression Menu)
  4. BlendShape sync: OK (3 body shape keys synced)
  5. Validation: OK

Verify switching from the Expression Menu.
```

### avatar-optimize (Avatar Optimization)

A recipe that improves avatar performance rank.

**Steps performed:**

1. `check_avatar_rank` to check current rank
2. `suggest_optimizations` to get optimization suggestions
3. `auto_optimize_avatar` to run automatic optimization
4. `check_avatar_rank` to check post-optimization rank
5. `compare_before_after` to display before-and-after comparison

**How to run:**

**You:**
> Run the avatar optimization recipe. Target Good rank.

**AI action:** From checking the current rank through optimization to result comparison, everything runs automatically.

**AI response example:**

```
Avatar optimization complete:

  1. Pre-optimization rank: Poor
     - Material count: 6 (Poor)
     - Mesh count: 5 (Medium)
     - Bone count: 142 (Medium)

  2. Optimization suggestions: material merging, mesh merging, bone reduction

  3. Auto optimization executed:
     - Texture atlas created -> Materials 6 -> 1
     - Mesh merging -> 5 -> 1
     - Unused bones removed -> 142 -> 128

  4. Post-optimization rank: Good

  5. Comparison:
     Materials: 6 -> 1 (Poor -> Excellent)
     Meshes: 5 -> 1 (Medium -> Excellent)
     Bones: 142 -> 128 (Medium -> Good)
     Overall: Poor -> Good
```

### expression-setup (Expression Setup)

A recipe that automates FaceEmo expression setup.

**Steps performed:**

1. `auto_detect_blendshapes` to detect available BlendShapes
2. `create_expression_preset` to create 8 basic expressions
3. `add_gesture_expression` for gesture mapping
4. Add an expression submenu to the Expression Menu

**How to run:**

**You:**
> Run the expression setup recipe.

**AI action:** From BlendShape detection through expression creation to menu configuration, everything runs automatically.

**AI response example:**

```
Expression setup complete:

  1. BlendShape detection: 42 found (mouth: 19, eyes: 8, brows: 6, other: 9)
  2. Expression presets: 8 expressions created
     - Smile, Angry, Sad, Surprised, Shy, Wink, Jitome, Tongue
  3. Gesture mapping:
     - Fist -> Angry
     - Victory -> Smile
     - HandOpen -> Surprised
     - FingerPoint -> Wink
     - RockNRoll -> Tongue
     - ThumbsUp -> Shy
  4. Expression Menu: 8 items added to "Expressions" submenu
```

## How to Run Recipes

### Run with Natural Language

The simplest approach is to give natural language instructions.

```
"Run the avatar quick setup recipe"
"Start with the basic world setup recipe"
"Run the expression setup recipe on my_avatar"
```

The AI calls the `run_recipe` tool to execute the recipe.

### Run from the Command Line

```bash
# List available recipes
uvx openforge-mcp --list-recipes

# Run a recipe
uvx openforge-mcp --run-recipe avatar-quick-setup \
  --var vrm_file="my_avatar.vrm"

# Run with variables
uvx openforge-mcp --run-recipe world-basic-setup \
  --var floor_size=100 \
  --var spawn_count=4
```

### View Available Recipes

**You:**
> List the available VRChat recipes.

**AI response example:**

```
VRChat recipe list:
  1. avatar-quick-setup    - VRM -> VRChat avatar full setup
  2. world-basic-setup     - Basic world structure setup
  3. outfit-change         - Modular Avatar outfit switching
  4. avatar-optimize       - Performance rank optimization
  5. expression-setup      - FaceEmo expression setup
```

## Creating Custom Recipes

You can define your own workflows as recipes.

### Creating a Recipe File

Recipes are written in YAML format. Below is an example of a custom recipe that applies specific PhysBone settings to an avatar.

```yaml
name: my-physbone-setup
description: Apply my preferred PhysBone settings to an avatar
version: "1.0"
author: your-name

variables:
  hair_spring: 0.25
  hair_stiffness: 0.3
  skirt_spring: 0.4
  skirt_stiffness: 0.2

steps:
  - name: Set up hair PhysBone
    tool: setup_hair_physbone
    params:
      preset: "long"
      spring: "{{ hair_spring }}"
      stiffness: "{{ hair_stiffness }}"

  - name: Set up skirt PhysBone
    tool: setup_skirt_physbone
    params:
      spring: "{{ skirt_spring }}"
      stiffness: "{{ skirt_stiffness }}"

  - name: Add left leg collider
    tool: add_physbone_collider
    params:
      target: "LeftUpperLeg"
      type: "Capsule"
      radius: 0.04

  - name: Add right leg collider
    tool: add_physbone_collider
    params:
      target: "RightUpperLeg"
      type: "Capsule"
      radius: 0.04

  - name: Take confirmation screenshot
    tool: take_screenshot
    params:
      width: 1920
      height: 1080
```

### Recipe File Locations

| Location | Purpose |
|---|---|
| `./recipes/` | Project-local (specific to that project) |
| `~/.openforge/recipes/` | User-wide (available across all projects) |

**You:**
> Save this recipe to the project.

**AI action:** The YAML file is saved as `./recipes/my-physbone-setup.yaml`.

### Recipe Variables

Recipe variables can be overridden at runtime.

**You:**
> Run the my-physbone-setup recipe. Set the hair spring to 0.5.

**AI action:** The recipe runs with the `hair_spring` variable overridden to 0.5.

### Conditional Steps

You can branch processing based on the result of a previous step.

```yaml
steps:
  - name: Check performance rank
    tool: check_avatar_rank
    params: {}

  - name: Run optimization if needed
    tool: auto_optimize_avatar
    params:
      target_rank: "Good"
    condition: "{{ previous.rank != 'Good' and previous.rank != 'Excellent' }}"

  - name: Show results
    tool: compare_before_after
    params: {}
    condition: "{{ previous.optimized == true }}"
```

### Error Handling

Specify what happens when a step fails.

```yaml
steps:
  - name: Detect BlendShapes
    tool: auto_detect_blendshapes
    params: {}
    on_error: stop  # Stop the recipe on error (default)

  - name: Create expression presets
    tool: create_expression_preset
    params: {}
    on_error: continue  # Proceed to next step even on error
```

## Recipe Use Cases

### Team Standardization

Place recipes in the project's `recipes/` directory so the entire team uses the same setup procedures.

```
my-vrchat-project/
  recipes/
    team-avatar-setup.yaml
    team-world-setup.yaml
    team-optimization.yaml
  Assets/
  ...
```

### Automating Repetitive Tasks

Useful when applying the same settings to multiple avatars.

**You:**
> Run the my-physbone-setup recipe on all avatars in the scene.

**AI action:** The recipe runs on all objects in the scene that have a VRC_AvatarDescriptor.

## Next Steps

Use recipes to efficiently create VRChat content.

- [VRChat Mode Overview](./overview.md) -- Overview of available tools
- [Avatar Setup](./avatar-setup.md) -- Detailed avatar settings
- [World Creation](./world-creation.md) -- Detailed world creation
