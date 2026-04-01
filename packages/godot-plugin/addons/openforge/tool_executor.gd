@tool
extends RefCounted

var _node_tools: RefCounted = null
var _resource_tools: RefCounted = null
var _screenshot_tools: RefCounted = null


func _init() -> void:
	var NodeToolsScript := load("res://addons/openforge/tools/node_tools.gd")
	_node_tools = NodeToolsScript.new()

	var ResourceToolsScript := load("res://addons/openforge/tools/resource_tools.gd")
	_resource_tools = ResourceToolsScript.new()

	var ScreenshotToolsScript := load("res://addons/openforge/tools/screenshot_tools.gd")
	_screenshot_tools = ScreenshotToolsScript.new()


func execute(method: String, params: Dictionary) -> Dictionary:
	var parts := method.split(".")
	if parts.size() != 2:
		return {"error": "Invalid method format. Expected 'category.tool_name'", "code": -32601}

	var category := parts[0]
	var tool_name := parts[1]

	match category:
		"node":
			return _node_tools.execute(tool_name, params)
		"resource":
			return _resource_tools.execute(tool_name, params)
		"screenshot":
			return _screenshot_tools.execute(tool_name, params)
		_:
			return {"error": "Unknown category: %s" % category, "code": -32601}
