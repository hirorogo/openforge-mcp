@tool
extends Node

const DEFAULT_PORT := 19802
const BUFFER_SIZE := 65536

var _tcp_server: TCPServer = null
var _clients: Array[StreamPeerTCP] = []
var _receive_buffers: Dictionary = {}
var _tool_executor: RefCounted = null

var _port: int = DEFAULT_PORT


func _ready() -> void:
	var env_port := OS.get_environment("OPENFORGE_GODOT_PORT")
	if env_port != "":
		_port = int(env_port)

	var ToolExecutorScript := load("res://addons/openforge/tool_executor.gd")
	_tool_executor = ToolExecutorScript.new()

	_tcp_server = TCPServer.new()
	var err := _tcp_server.listen(_port, "127.0.0.1")
	if err != OK:
		push_error("[OpenForge MCP] Failed to listen on port %d: %s" % [_port, error_string(err)])
		return
	print("[OpenForge MCP] TCP server listening on port %d" % _port)


func _exit_tree() -> void:
	if _tcp_server != null:
		_tcp_server.stop()
		_tcp_server = null
	for client in _clients:
		client.disconnect_from_host()
	_clients.clear()
	_receive_buffers.clear()


func _process(_delta: float) -> void:
	if _tcp_server == null:
		return

	# Accept new connections
	while _tcp_server.is_connection_available():
		var peer := _tcp_server.take_connection()
		if peer != null:
			_clients.append(peer)
			_receive_buffers[peer] = ""
			print("[OpenForge MCP] Client connected")

	# Process existing connections
	var disconnected: Array[int] = []
	for i in range(_clients.size()):
		var client := _clients[i]
		client.poll()
		var status := client.get_status()
		if status == StreamPeerTCP.STATUS_CONNECTED:
			var available := client.get_available_bytes()
			if available > 0:
				var data := client.get_data(available)
				if data[0] == OK:
					var text := data[1].get_string_from_utf8()
					_receive_buffers[client] += text
					_process_buffer(client)
		elif status == StreamPeerTCP.STATUS_NONE or status == StreamPeerTCP.STATUS_ERROR:
			disconnected.append(i)

	# Clean up disconnected clients (reverse order)
	for i in range(disconnected.size() - 1, -1, -1):
		var idx := disconnected[i]
		var client := _clients[idx]
		_receive_buffers.erase(client)
		_clients.remove_at(idx)
		print("[OpenForge MCP] Client disconnected")


func _process_buffer(client: StreamPeerTCP) -> void:
	var buffer: String = _receive_buffers[client]
	var newline_idx := buffer.find("\n")
	while newline_idx != -1:
		var line := buffer.substr(0, newline_idx).strip_edges()
		buffer = buffer.substr(newline_idx + 1)
		if line.length() > 0:
			_handle_request(client, line)
		newline_idx = buffer.find("\n")
	_receive_buffers[client] = buffer


func _handle_request(client: StreamPeerTCP, line: String) -> void:
	var json := JSON.new()
	var parse_result := json.parse(line)
	if parse_result != OK:
		_send_error(client, -1, -32700, "Parse error: invalid JSON")
		return

	var request: Dictionary = json.data
	if typeof(request) != TYPE_DICTIONARY:
		_send_error(client, -1, -32600, "Invalid request: expected object")
		return

	var id: int = request.get("id", -1)
	var method: String = request.get("method", "")
	var params: Dictionary = request.get("params", {})

	if method == "":
		_send_error(client, id, -32600, "Invalid request: missing method")
		return

	var result := _tool_executor.execute(method, params)
	_send_response(client, id, result)


func _send_response(client: StreamPeerTCP, id: int, result: Dictionary) -> void:
	var response := {
		"jsonrpc": "2.0",
		"id": id,
	}
	if result.has("error"):
		response["error"] = {
			"code": result.get("code", -32000),
			"message": result["error"],
			"data": result.get("data", null),
		}
	else:
		response["result"] = result.get("result", null)

	var payload := JSON.stringify(response) + "\n"
	client.put_data(payload.to_utf8_buffer())


func _send_error(client: StreamPeerTCP, id: int, code: int, message: String) -> void:
	var response := {
		"jsonrpc": "2.0",
		"id": id,
		"error": {
			"code": code,
			"message": message,
		},
	}
	var payload := JSON.stringify(response) + "\n"
	client.put_data(payload.to_utf8_buffer())
