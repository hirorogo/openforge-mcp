@tool
extends RefCounted


func execute(tool_name: String, params: Dictionary) -> Dictionary:
	match tool_name:
		"get_viewport_screenshot":
			return _get_viewport_screenshot(params)
		"get_running_screenshot":
			return _get_running_screenshot(params)
		_:
			return {"error": "Unknown screenshot tool: %s" % tool_name, "code": -32601}


func _get_viewport_screenshot(params: Dictionary) -> Dictionary:
	var width: int = int(params.get("width", 0))
	var height: int = int(params.get("height", 0))

	var tree := Engine.get_main_loop() as SceneTree
	if tree == null:
		return {"error": "SceneTree not available"}

	var viewport := tree.root
	if viewport == null:
		return {"error": "Root viewport not available"}

	# In editor, try to capture from the editor viewport
	if Engine.is_editor_hint():
		var editor_viewport := EditorInterface.get_editor_viewport_3d(0)
		if editor_viewport != null:
			viewport = editor_viewport

	var image := viewport.get_texture().get_image()
	if image == null:
		return {"error": "Failed to capture viewport image"}

	# Resize if requested
	if width > 0 and height > 0:
		image.resize(width, height, Image.INTERPOLATE_LANCZOS)
	elif width > 0:
		var ratio := float(width) / float(image.get_width())
		image.resize(width, int(image.get_height() * ratio), Image.INTERPOLATE_LANCZOS)
	elif height > 0:
		var ratio := float(height) / float(image.get_height())
		image.resize(int(image.get_width() * ratio), height, Image.INTERPOLATE_LANCZOS)

	var png_data := image.save_png_to_buffer()
	if png_data.size() == 0:
		return {"error": "Failed to encode image as PNG"}

	var base64 := Marshalls.raw_to_base64(png_data)

	return {"result": {
		"width": image.get_width(),
		"height": image.get_height(),
		"format": "png",
		"encoding": "base64",
		"data": base64,
	}}


func _get_running_screenshot(params: Dictionary) -> Dictionary:
	var width: int = int(params.get("width", 0))
	var height: int = int(params.get("height", 0))

	var tree := Engine.get_main_loop() as SceneTree
	if tree == null:
		return {"error": "SceneTree not available"}

	# When running in editor, the game runs in a separate process.
	# We can only capture the editor viewport here.
	# For actual game captures, the game must have the plugin embedded.
	var viewport := tree.root
	if viewport == null:
		return {"error": "Root viewport not available"}

	var image := viewport.get_texture().get_image()
	if image == null:
		return {"error": "Failed to capture viewport image"}

	# Resize if requested
	if width > 0 and height > 0:
		image.resize(width, height, Image.INTERPOLATE_LANCZOS)
	elif width > 0:
		var ratio := float(width) / float(image.get_width())
		image.resize(width, int(image.get_height() * ratio), Image.INTERPOLATE_LANCZOS)
	elif height > 0:
		var ratio := float(height) / float(image.get_height())
		image.resize(int(image.get_width() * ratio), height, Image.INTERPOLATE_LANCZOS)

	var png_data := image.save_png_to_buffer()
	if png_data.size() == 0:
		return {"error": "Failed to encode image as PNG"}

	var base64 := Marshalls.raw_to_base64(png_data)

	return {"result": {
		"width": image.get_width(),
		"height": image.get_height(),
		"format": "png",
		"encoding": "base64",
		"data": base64,
	}}
