---
sidebar_position: 1
title: "Basic Usage"
---

# Basic Usage

With OpenForge MCP, you control everything by talking to the AI in plain language. No special command syntax or symbols needed.


## How to talk to the AI

Just give instructions in everyday language. No programming knowledge required.

```
Create a sphere
```

```
Move that red cube 3 meters to the left
```

```
Show me a list of all objects in the scene
```

That's all it takes. The AI picks the right tool and carries out the operation.


## Common instruction patterns

### Create

| Say this | What it does |
|---|---|
| `Create a Cube` | Creates a basic object |
| `Create a red material` | Creates a material |
| `Create an empty GameObject` | Creates an empty object |
| `Add a PointLight` | Adds a light |
| `Create a new script` | Creates a script file |

### Modify

| Say this | What it does |
|---|---|
| `Change the Cube's color to red` | Changes material color |
| `Set the Cube's position to (0, 5, 0)` | Changes position |
| `Scale the Cube to 2x` | Changes size |
| `Rename the Cube to Player` | Changes the name |
| `Set the light intensity to 3` | Changes a property |

### Delete

| Say this | What it does |
|---|---|
| `Delete the Cube` | Deletes an object |
| `Remove all unused materials` | Batch deletion |
| `Remove the Rigidbody component from the Cube` | Removes a component |

### Inspect

| Say this | What it does |
|---|---|
| `Show me the scene hierarchy` | View the scene structure |
| `Tell me about the Cube` | View object details |
| `List the components on the Cube` | View components |
| `Show me all materials` | List assets |

### Search

| Say this | What it does |
|---|---|
| `Find the object named Player` | Search by name |
| `Find objects with a Rigidbody` | Search by component |
| `Find the red material` | Search assets |


## AI responses

After performing an operation, the AI will typically reply with:

- A description of what it did
- The result (success or failure)
- The current state of the created or modified object
- Suggestions for next steps, when relevant

For longer operations, the AI may provide progress updates along the way.


## Correcting mistakes

If the AI does something you didn't intend, just tell it in plain language:

| Situation | Say this |
|---|---|
| Undo the last action | `Undo that` / `Revert the last change` |
| Target the wrong object | `Not that one -- do it to the Sphere instead` |
| Start over | `Redo that, but make it blue this time` |
| Small adjustment | `Move it a bit more to the right` |


## Tips for better results

### Use specific numbers

```
# Vague instruction
Move the object up a little

# Specific instruction (more reliable)
Set the object's Y position to 5
```

### Specify coordinates

When setting a position, use the `x, y, z` format for accuracy.

```
Set the Cube's position to (3, 0, -2)
```

### Be explicit about colors

```
# Vague
Make it a nice color

# Specific
Set the color to #FF6600
```

```
Set the color to RGB (255, 100, 0)
```

### Identify the target clearly

When the scene contains multiple objects, specify which one by name.

```
# Vague
Move that object

# Clear
Move the Cube named Player
```

### Combine multiple operations in one instruction

You can ask for several things at once.

```
Create a Cube, set its color to red, and position it at (0, 3, 0)
```

### Ask the AI what it can do

If you are not sure what is possible, just ask.

```
What can you do?
```

```
What operations are available in Unity?
```
