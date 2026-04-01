---
sidebar_position: 4
title: System Tools
---

# System Tools

Cross-application system tools provided by OpenForge MCP. These include version control, transactions, pipelines, and recipe functionality.

## Version Control

Features for saving and restoring the state of scenes and projects. This is OpenForge MCP's own version control system, independent of Git, and records state at the editor operation level.

| Tool Name | Description | Main Parameters |
|---|---|---|
| `save_version` | Save the current state | `name`, `description` |
| `list_versions` | List saved versions | `limit`, `offset` |
| `restore_version` | Restore a specific version | `version_id` |
| `create_branch` | Create a branch | `name`, `from_version` |
| `list_branches` | List branches | None |
| `switch_branch` | Switch branches | `name` |
| `delete_version` | Delete a version | `version_id` |

### Usage Examples

```bash
# Save the current state
curl -X POST http://localhost:8080/tools/save_version \
  -H "Content-Type: application/json" \
  -d '{
    "name": "initial-layout",
    "description": "Basic layout complete"
  }'

# Get the version list
curl http://localhost:8080/tools/list_versions

# Restore a specific version
curl -X POST http://localhost:8080/tools/restore_version \
  -H "Content-Type: application/json" \
  -d '{"version_id": "v001"}'
```

### Using Branches

Branches let you try different variations in parallel.

```bash
# Create a branch
curl -X POST http://localhost:8080/tools/create_branch \
  -H "Content-Type: application/json" \
  -d '{
    "name": "lighting-experiment",
    "from_version": "v003"
  }'

# Switch branches
curl -X POST http://localhost:8080/tools/switch_branch \
  -H "Content-Type: application/json" \
  -d '{"name": "lighting-experiment"}'
```

## Transaction

Features for grouping multiple tool calls and executing them atomically. If an error occurs mid-way, you can roll back to the state at the start of the transaction.

| Tool Name | Description | Main Parameters |
|---|---|---|
| `begin_transaction` | Begin a transaction | `name` |
| `commit_transaction` | Commit the transaction | None |
| `rollback_transaction` | Roll back the transaction | None |
| `get_transaction_status` | Get the current transaction status | None |

### Usage Examples

```bash
# Begin transaction
curl -X POST http://localhost:8080/tools/begin_transaction \
  -H "Content-Type: application/json" \
  -d '{"name": "scene-setup"}'

# Execute multiple operations
curl -X POST http://localhost:8080/tools/create_gameobject \
  -H "Content-Type: application/json" \
  -d '{"name": "Wall1", "type": "Cube"}'

curl -X POST http://localhost:8080/tools/create_gameobject \
  -H "Content-Type: application/json" \
  -d '{"name": "Wall2", "type": "Cube"}'

# Commit if everything is fine
curl -X POST http://localhost:8080/tools/commit_transaction

# Roll back if something went wrong
curl -X POST http://localhost:8080/tools/rollback_transaction
```

### Usage with AI Clients

You can instruct the AI to use transactions as follows:

```
"Use a transaction to create a room with 4 walls and 1 floor.
  Roll back if something goes wrong."
```

The AI will automatically call `begin_transaction` and execute `commit_transaction` if all operations succeed.

## Pipeline

Features for transferring assets between applications. This enables cross-application workflows such as importing a model created in Blender into Unity.

| Tool Name | Description | Main Parameters |
|---|---|---|
| `transfer_asset` | Transfer an asset to another application | `source_app`, `target_app`, `asset`, `format`, `options` |
| `get_pipeline_status` | Get the pipeline status | None |
| `list_transferable_assets` | List transferable assets | `app` |

### Usage Examples

```bash
# Transfer a Blender object to Unity
curl -X POST http://localhost:8080/tools/transfer_asset \
  -H "Content-Type: application/json" \
  -d '{
    "source_app": "blender",
    "target_app": "unity",
    "asset": "Character",
    "format": "fbx",
    "options": {
      "apply_modifiers": true,
      "include_animations": true
    }
  }'
```

### Supported Transfer Paths

| Source | Destination | Supported Formats |
|---|---|---|
| Blender | Unity | FBX, glTF, OBJ, USD |
| Blender | Godot | glTF, OBJ, FBX |
| Unity | Blender | FBX, OBJ |
| Godot | Blender | glTF, OBJ |

### Usage with AI Clients

```
"Import the Character model I made in Blender into Unity"
```

The AI will automatically call `transfer_asset` and handle the export and import in one step.

## Recipe

Tools for running and managing recipes. For more details about recipes, see [Recipe Feature](/docs/advanced/recipe).

| Tool Name | Description | Main Parameters |
|---|---|---|
| `run_recipe` | Run a recipe | `recipe`, `variables` |
| `list_recipes` | List available recipes | None |
| `get_recipe_info` | Get recipe details | `recipe` |
| `validate_recipe` | Validate a recipe's syntax | `recipe` |

### Usage Examples

```bash
# List recipes
curl http://localhost:8080/tools/list_recipes

# Run a recipe
curl -X POST http://localhost:8080/tools/run_recipe \
  -H "Content-Type: application/json" \
  -d '{
    "recipe": "basic-scene-setup",
    "variables": {
      "scene_name": "TestScene",
      "ground_size": 100
    }
  }'

# Get recipe details
curl http://localhost:8080/tools/get_recipe_info?recipe=basic-scene-setup

# Validate a recipe's syntax
curl -X POST http://localhost:8080/tools/validate_recipe \
  -H "Content-Type: application/json" \
  -d '{"recipe": "my-custom-recipe"}'
```
