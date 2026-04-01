---
sidebar_position: 3
title: "Using Blender"
---

# Using Blender

A reference of common Blender operations, with natural language instruction examples.


## Object Creation

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Create a mesh | `Add a Cube` | `add_mesh` |
| Create a curve | `Add a Bezier curve` | `add_curve` |
| Create an empty object | `Add an Empty` | `add_empty` |
| Create text | `Add 3D text` | `add_text` |
| Duplicate an object | `Duplicate the selected object` | `duplicate_object` |


## Mesh Editing

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Move vertices | `Move the selected vertices up by 1m` | `edit_mesh` |
| Extrude faces | `Extrude the selected faces` | `extrude_faces` |
| Add loop cuts | `Add 3 loop cuts in the X direction` | `loop_cut` |
| Merge vertices | `Merge the selected vertices` | `merge_vertices` |
| Recalculate normals | `Recalculate normals to face outward` | `recalculate_normals` |


## Materials

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Create a material | `Create a red material` | `create_material` |
| Change the base color | `Set the material color to blue` | `set_material_property` |
| Set a texture | `Set an image texture` | `set_material_texture` |
| Change metallic value | `Set metallic to 1.0` | `set_material_property` |
| Connect nodes | `Connect the noise texture to the bump` | `connect_shader_nodes` |


## Modifiers

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Add Subdivision | `Add a subdivision at level 2` | `add_modifier` |
| Add Mirror | `Add a mirror modifier` | `add_modifier` |
| Add Boolean | `Cut a hole with a boolean` | `add_modifier` |
| Apply a modifier | `Apply the subdivision` | `apply_modifier` |
| Add Array | `Arrange 5 copies with an array modifier` | `add_modifier` |


## UV

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| UV unwrap | `Do a smart UV unwrap` | `uv_unwrap` |
| Mark seams | `Mark the selected edges as seams` | `mark_seam` |
| Check UV map | `Show me the UV map` | `get_uv_info` |
| Reset UV coordinates | `Reset the UVs` | `reset_uv` |


## Animation

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Insert a keyframe | `Insert a keyframe at the current frame` | `insert_keyframe` |
| Set frame range | `Set the frame range to 1-120` | `set_frame_range` |
| Play animation | `Play the animation` | `play_animation` |
| Delete keyframes | `Delete all keyframes` | `delete_keyframes` |
| Change FPS | `Set the frame rate to 30` | `set_fps` |


## Rendering

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Render | `Render the image` | `render_image` |
| Change engine | `Switch the render engine to Cycles` | `set_render_engine` |
| Change resolution | `Set the resolution to 1920x1080` | `set_render_resolution` |
| Change sample count | `Set the sample count to 256` | `set_render_samples` |
| Set output path | `Set the output path to /tmp/render` | `set_output_path` |


## Armature

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Add an armature | `Add an armature` | `add_armature` |
| Add a bone | `Add an arm bone` | `add_bone` |
| Weight paint | `Set up automatic weights` | `auto_weight_paint` |
| Move a bone | `Rotate the right arm bone 90 degrees` | `pose_bone` |
| Set up IK | `Set up IK on the leg` | `add_ik_constraint` |


## VRM

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Import VRM | `Import the VRM file` | `import_vrm` |
| Export VRM | `Export as VRM` | `export_vrm` |
| Set expressions | `Set up the smile blend shape` | `set_vrm_expression` |
| Set spring bones | `Set up spring bones for the hair` | `set_vrm_spring_bone` |


## Import / Export

| What You Want to Do | What to Say | Tool Used |
|---|---|---|
| Import FBX | `Import the FBX file` | `import_fbx` |
| Export FBX | `Export as FBX` | `export_fbx` |
| Import OBJ | `Import the OBJ file` | `import_obj` |
| Export glTF | `Export as glTF` | `export_gltf` |
| Import an image | `Import the texture image` | `import_image` |
