---
sidebar_position: 4
title: Recipe Feature
---

# Recipe Feature

Recipes let you define a sequence of tool calls in a YAML file for reuse. You can save common workflows as recipes and run them with a single command.

## What Are Recipes?

Recipes are useful in scenarios like these:

- **Project initial setup**: Run scene creation, lighting placement, and camera setup all at once
- **Automating repetitive work**: When you create the same object configurations repeatedly
- **Team sharing**: Share environment setup procedures as a file
- **Templates**: Reuse standard patterns like VRChat world base configurations

## YAML Format

Recipe files are written in YAML.

```yaml
name: basic-scene-setup
description: Basic scene setup
version: "1.0"
author: your-name

# Variable definitions (optional)
variables:
  scene_name: "MyScene"
  ground_size: 50
  light_intensity: 1.2

# Step definitions
steps:
  - name: Create scene
    tool: create_scene
    params:
      name: "{{ scene_name }}"

  - name: Create ground
    tool: create_gameobject
    params:
      name: "Ground"
      type: "Plane"
      position: { x: 0, y: 0, z: 0 }
      scale: { x: "{{ ground_size }}", y: 1, z: "{{ ground_size }}" }

  - name: Place main light
    tool: create_light
    params:
      name: "MainLight"
      type: "Directional"
      intensity: "{{ light_intensity }}"
      rotation: { x: 50, y: -30, z: 0 }

  - name: Place camera
    tool: set_camera
    params:
      position: { x: 0, y: 5, z: -10 }
      rotation: { x: 30, y: 0, z: 0 }

  - name: Take screenshot
    tool: take_screenshot
    params:
      width: 1920
      height: 1080
```

### Format Details

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Recipe identifier (alphanumeric and hyphens) |
| `description` | Yes | Recipe description |
| `version` | No | Version number |
| `author` | No | Author name |
| `variables` | No | Variable definitions used within steps |
| `steps` | Yes | Array of tool calls to execute |

### Step Structure

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Display name for the step |
| `tool` | Yes | Name of the tool to call |
| `params` | No | Parameters to pass to the tool |
| `condition` | No | Execution condition (can reference results of previous steps) |
| `on_error` | No | Behavior on error (`stop` or `continue`, default is `stop`) |

### Using Variables

Variables can be embedded in parameters using the `{{ variable_name }}` format.

```yaml
variables:
  color_r: 0.8
  color_g: 0.2
  color_b: 0.1

steps:
  - name: Create material
    tool: create_material
    params:
      name: "CustomMaterial"
      color:
        r: "{{ color_r }}"
        g: "{{ color_g }}"
        b: "{{ color_b }}"
        a: 1
```

## Recipe Examples

### VRChat World Base Configuration

```yaml
name: vrchat-world-base
description: Set up a basic VRChat world configuration
version: "1.0"

steps:
  - name: Create floor
    tool: create_gameobject
    params:
      name: "Floor"
      type: "Plane"
      position: { x: 0, y: 0, z: 0 }
      scale: { x: 10, y: 1, z: 10 }

  - name: Set floor material
    tool: create_material
    params:
      name: "FloorMaterial"
      color: { r: 0.9, g: 0.9, b: 0.9, a: 1 }

  - name: Apply material
    tool: set_material
    params:
      target: "Floor"
      material: "FloorMaterial"

  - name: Create spawn point
    tool: create_gameobject
    params:
      name: "SpawnPoint"
      type: "Empty"
      position: { x: 0, y: 0.5, z: 0 }

  - name: Directional light
    tool: create_light
    params:
      name: "Sun"
      type: "Directional"
      intensity: 1.0
      rotation: { x: 50, y: -30, z: 0 }

  - name: Add point light
    tool: create_light
    params:
      name: "FillLight"
      type: "Point"
      intensity: 0.5
      position: { x: 3, y: 3, z: 0 }

  - name: Take completion screenshot
    tool: take_screenshot
    params:
      width: 1920
      height: 1080
```

## Running Recipes

### From an AI Client

Give the AI a natural language instruction.

```
"Run the vrchat-world-base recipe"
```

The AI will call the `run_recipe` tool to execute the recipe.

### From the Command Line

```bash
# Run by specifying the recipe file
uvx openforge-mcp --run-recipe ./recipes/vrchat-world-base.yaml

# Run with variable overrides
uvx openforge-mcp --run-recipe ./recipes/basic-scene-setup.yaml \
  --var scene_name="TestScene" \
  --var ground_size=100
```

### From the HTTP API

```bash
curl -X POST http://localhost:8080/tools/run_recipe \
  -H "Content-Type: application/json" \
  -d '{
    "recipe": "vrchat-world-base",
    "variables": {
      "scene_name": "MyWorld"
    }
  }'
```

### Listing Available Recipes

```bash
# From an AI client
"List the available recipes"

# From the HTTP API
curl http://localhost:8080/tools/list_recipes
```

## Recipe Storage Locations

Recipe files should be placed in the following locations.

| Location | Purpose |
|---|---|
| `./recipes/` | Project-local recipes |
| `~/.openforge/recipes/` | User-wide recipes |

Project-local recipes take priority. If recipes with the same name exist in both locations, the project-level one is used.

## Sharing Recipes

### Sharing via Git Repository

Include recipe files in your project's `recipes/` directory and manage them with Git.

```
my-project/
  recipes/
    basic-scene-setup.yaml
    vrchat-world-base.yaml
  Assets/
  ...
```

### Community Recipes

The OpenForge MCP GitHub repository hosts recipes created by the community.

```bash
# Download a community recipe
curl -o recipes/fps-level-base.yaml \
  https://raw.githubusercontent.com/hirorogo/openforge-mcp/main/recipes/fps-level-base.yaml
```

To share your own recipes, submit a pull request to the GitHub repository.
