@tool
extends EditorPlugin

const SERVER_SCRIPT := preload("res://addons/openforge/server.gd")

var _server: Node = null


func _get_plugin_name() -> String:
	return "OpenForge MCP"


func _enter_tree() -> void:
	_server = Node.new()
	_server.name = "OpenForgeMCPServer"
	_server.set_script(SERVER_SCRIPT)
	add_child(_server)
	print("[OpenForge MCP] Plugin enabled")


func _exit_tree() -> void:
	if _server != null:
		_server.queue_free()
		_server = null
	print("[OpenForge MCP] Plugin disabled")
