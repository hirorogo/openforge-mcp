---
sidebar_position: 2
title: "Using Unity"
---

# Using Unity

A reference of common Unity operations, with natural language prompt examples and the tools they invoke.


## Scene Management

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| View the scene hierarchy | `Show me the scene structure` | `get_hierarchy` |
| Create a new scene | `Create a new scene` | `create_scene` |
| Save the scene | `Save the scene` | `save_scene` |
| Open a scene | `Open MainScene` | `open_scene` |
| Take a screenshot of the scene | `Take a screenshot` | `take_screenshot` |


## Object Operations

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Create an object | `Create a Cube` | `create_object` |
| Move an object | `Set the Cube's position to (0, 5, 0)` | `set_transform` |
| Rotate an object | `Rotate the Cube 45 degrees` | `set_transform` |
| Duplicate an object | `Duplicate the Cube` | `duplicate_object` |
| Delete an object | `Delete the Cube` | `delete_object` |


## Materials

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Create a material | `Create a red material` | `create_material` |
| Change the color | `Set the Cube's color to blue` | `set_material_color` |
| Set a texture | `Apply this texture to the Cube` | `set_material_texture` |
| View the material list | `Show me the material list` | `get_materials` |
| Change the shader | `Switch the material to URP Lit` | `set_material_shader` |


## Scripts

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Create a script | `Create a PlayerController script` | `create_script` |
| Read a script | `Show me the contents of PlayerController` | `read_script` |
| Edit a script | `Change the move speed to 10` | `edit_script` |
| Add a component | `Add a Rigidbody to the Cube` | `add_component` |
| Change a component value | `Set the Rigidbody mass to 5` | `set_component_property` |


## Lighting

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Add a light | `Add a PointLight` | `create_light` |
| Change light color | `Set the light color to orange` | `set_light_property` |
| Change light intensity | `Set the light intensity to 5` | `set_light_property` |
| Set ambient lighting | `Make the ambient light darker` | `set_environment` |


## Camera

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Add a camera | `Add a camera` | `create_camera` |
| Move the camera | `Set the camera position to (0, 10, -10)` | `set_transform` |
| Change the camera direction | `Point the camera at the origin` | `set_transform` |
| Change FOV | `Set the camera FOV to 90` | `set_camera_property` |


## Animation

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Create an AnimatorController | `Create an animator for the Cube` | `create_animator` |
| Create an animation clip | `Create a rotation animation` | `create_animation_clip` |
| Add a parameter | `Add an isRunning parameter` | `add_animator_parameter` |
| Set up a transition | `Create a transition from Idle to Run` | `add_animator_transition` |


## Physics

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Add a Rigidbody | `Add a Rigidbody to the Cube` | `add_component` |
| Add a Collider | `Add a BoxCollider to the Cube` | `add_component` |
| Disable gravity | `Turn off gravity on the Cube's Rigidbody` | `set_component_property` |
| Set a physics material | `Set the bounciness to 0.8` | `set_physics_material` |
| Add a joint | `Add a HingeJoint` | `add_component` |


## UI

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Create a Canvas | `Create a UI Canvas` | `create_ui_canvas` |
| Add text | `Add a text element for the score display` | `create_ui_element` |
| Add a button | `Add a Start button` | `create_ui_element` |
| Adjust UI position | `Center the button on the screen` | `set_ui_layout` |


## Build

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Check build settings | `Show me the build settings` | `get_build_settings` |
| Switch platform | `Switch to Android` | `switch_platform` |
| Run a build | `Build for Windows` | `build_project` |
| Change Player Settings | `Set the resolution to 1920x1080` | `set_player_settings` |
