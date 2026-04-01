@tool
extends RefCounted


func execute(tool_name: String, params: Dictionary) -> Dictionary:
	match tool_name:
		"create_node":
			return _create_node(params)
		"find_node":
			return _find_node(params)
		"delete_node":
			return _delete_node(params)
		"set_transform_2d":
			return _set_transform_2d(params)
		"set_transform_3d":
			return _set_transform_3d(params)
		"add_child":
			return _add_child(params)
		"duplicate_node":
			return _duplicate_node(params)
		"set_property":
			return _set_property(params)
		"get_node_info":
			return _get_node_info(params)
		"get_scene_tree":
			return _get_scene_tree(params)
		_:
			return {"error": "Unknown node tool: %s" % tool_name, "code": -32601}


func _get_scene_root() -> Node:
	var tree := Engine.get_main_loop() as SceneTree
	if tree == null:
		return null
	return tree.edited_scene_root if Engine.is_editor_hint() else tree.current_scene


func _resolve_node(node_path: String) -> Node:
	var tree := Engine.get_main_loop() as SceneTree
	if tree == null:
		return null
	var root := tree.root
	if node_path.begins_with("/root"):
		return root.get_node_or_null(NodePath(node_path.substr(5)))
	if node_path == "/root" or node_path == "":
		return _get_scene_root()
	# Try as absolute path from scene root
	var scene_root := _get_scene_root()
	if scene_root == null:
		return null
	return scene_root.get_node_or_null(NodePath(node_path))


func _create_node(params: Dictionary) -> Dictionary:
	var type_name: String = params.get("type", "")
	if type_name == "":
		return {"error": "Missing required parameter: type"}

	var node_name: String = params.get("name", type_name)
	var parent_path: String = params.get("parentPath", "")

	var parent: Node = null
	if parent_path != "":
		parent = _resolve_node(parent_path)
		if parent == null:
			return {"error": "Parent node not found: %s" % parent_path}
	else:
		parent = _get_scene_root()
		if parent == null:
			return {"error": "No scene root available. Open or create a scene first."}

	if not ClassDB.class_exists(type_name):
		return {"error": "Unknown node type: %s" % type_name}

	if not ClassDB.is_parent_class(type_name, "Node"):
		return {"error": "Type '%s' is not a Node subclass" % type_name}

	var new_node: Node = ClassDB.instantiate(type_name)
	if new_node == null:
		return {"error": "Failed to instantiate node of type: %s" % type_name}

	new_node.name = node_name
	parent.add_child(new_node, true)
	new_node.owner = _get_scene_root()

	return {"result": {
		"name": new_node.name,
		"type": new_node.get_class(),
		"path": str(new_node.get_path()),
	}}


func _find_node(params: Dictionary) -> Dictionary:
	var pattern: String = params.get("pattern", "*")
	var type_filter: String = params.get("type", "")
	var recursive: bool = params.get("recursive", true)

	var root := _get_scene_root()
	if root == null:
		return {"error": "No scene root available"}

	var matches: Array[Dictionary] = []
	_find_node_recursive(root, pattern, type_filter, recursive, matches)

	return {"result": {"nodes": matches, "count": matches.size()}}


func _find_node_recursive(node: Node, pattern: String, type_filter: String, recursive: bool, results: Array[Dictionary]) -> void:
	var name_matches := node.name.match(pattern) if pattern != "" else true
	var type_matches := node.is_class(type_filter) if type_filter != "" else true

	if name_matches and type_matches:
		results.append({
			"name": node.name,
			"type": node.get_class(),
			"path": str(node.get_path()),
		})

	if recursive:
		for child in node.get_children():
			_find_node_recursive(child, pattern, type_filter, true, results)


func _delete_node(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("nodePath", "")
	if node_path == "":
		return {"error": "Missing required parameter: nodePath"}

	var node := _resolve_node(node_path)
	if node == null:
		return {"error": "Node not found: %s" % node_path}

	var scene_root := _get_scene_root()
	if node == scene_root:
		return {"error": "Cannot delete the scene root node"}

	var node_name := node.name
	var node_type := node.get_class()
	node.get_parent().remove_child(node)
	node.queue_free()

	return {"result": {"deleted": true, "name": node_name, "type": node_type}}


func _set_transform_2d(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("nodePath", "")
	if node_path == "":
		return {"error": "Missing required parameter: nodePath"}

	var node := _resolve_node(node_path)
	if node == null:
		return {"error": "Node not found: %s" % node_path}

	if not (node is Node2D):
		return {"error": "Node is not a Node2D: %s (%s)" % [node_path, node.get_class()]}

	var node_2d := node as Node2D

	if params.has("position"):
		var pos: Dictionary = params["position"]
		node_2d.position = Vector2(pos.get("x", 0.0), pos.get("y", 0.0))

	if params.has("rotation"):
		node_2d.rotation_degrees = float(params["rotation"])

	if params.has("scale"):
		var s: Dictionary = params["scale"]
		node_2d.scale = Vector2(s.get("x", 1.0), s.get("y", 1.0))

	return {"result": {
		"path": str(node_2d.get_path()),
		"position": {"x": node_2d.position.x, "y": node_2d.position.y},
		"rotation": node_2d.rotation_degrees,
		"scale": {"x": node_2d.scale.x, "y": node_2d.scale.y},
	}}


func _set_transform_3d(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("nodePath", "")
	if node_path == "":
		return {"error": "Missing required parameter: nodePath"}

	var node := _resolve_node(node_path)
	if node == null:
		return {"error": "Node not found: %s" % node_path}

	if not (node is Node3D):
		return {"error": "Node is not a Node3D: %s (%s)" % [node_path, node.get_class()]}

	var node_3d := node as Node3D

	if params.has("position"):
		var pos: Dictionary = params["position"]
		node_3d.position = Vector3(pos.get("x", 0.0), pos.get("y", 0.0), pos.get("z", 0.0))

	if params.has("rotation"):
		var rot: Dictionary = params["rotation"]
		node_3d.rotation_degrees = Vector3(rot.get("x", 0.0), rot.get("y", 0.0), rot.get("z", 0.0))

	if params.has("scale"):
		var s: Dictionary = params["scale"]
		node_3d.scale = Vector3(s.get("x", 1.0), s.get("y", 1.0), s.get("z", 1.0))

	return {"result": {
		"path": str(node_3d.get_path()),
		"position": {"x": node_3d.position.x, "y": node_3d.position.y, "z": node_3d.position.z},
		"rotation": {"x": node_3d.rotation_degrees.x, "y": node_3d.rotation_degrees.y, "z": node_3d.rotation_degrees.z},
		"scale": {"x": node_3d.scale.x, "y": node_3d.scale.y, "z": node_3d.scale.z},
	}}


func _add_child(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("nodePath", "")
	var new_parent_path: String = params.get("newParentPath", "")

	if node_path == "":
		return {"error": "Missing required parameter: nodePath"}
	if new_parent_path == "":
		return {"error": "Missing required parameter: newParentPath"}

	var node := _resolve_node(node_path)
	if node == null:
		return {"error": "Node not found: %s" % node_path}

	var new_parent := _resolve_node(new_parent_path)
	if new_parent == null:
		return {"error": "New parent not found: %s" % new_parent_path}

	var scene_root := _get_scene_root()
	if node == scene_root:
		return {"error": "Cannot reparent the scene root node"}

	var old_parent := node.get_parent()
	if old_parent != null:
		old_parent.remove_child(node)

	new_parent.add_child(node, true)
	node.owner = scene_root

	# Reassign owner for all descendants
	_set_owner_recursive(node, scene_root)

	return {"result": {
		"name": node.name,
		"newPath": str(node.get_path()),
		"parentPath": str(new_parent.get_path()),
	}}


func _set_owner_recursive(node: Node, owner: Node) -> void:
	for child in node.get_children():
		child.owner = owner
		_set_owner_recursive(child, owner)


func _duplicate_node(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("nodePath", "")
	if node_path == "":
		return {"error": "Missing required parameter: nodePath"}

	var node := _resolve_node(node_path)
	if node == null:
		return {"error": "Node not found: %s" % node_path}

	var dup := node.duplicate()
	if dup == null:
		return {"error": "Failed to duplicate node: %s" % node_path}

	var new_name: String = params.get("newName", "")
	if new_name != "":
		dup.name = new_name

	var parent := node.get_parent()
	if parent != null:
		parent.add_child(dup, true)
		dup.owner = _get_scene_root()
		_set_owner_recursive(dup, _get_scene_root())

	return {"result": {
		"name": dup.name,
		"type": dup.get_class(),
		"path": str(dup.get_path()),
		"originalPath": str(node.get_path()),
	}}


func _set_property(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("nodePath", "")
	if node_path == "":
		return {"error": "Missing required parameter: nodePath"}

	var property: String = params.get("property", "")
	if property == "":
		return {"error": "Missing required parameter: property"}

	if not params.has("value"):
		return {"error": "Missing required parameter: value"}

	var node := _resolve_node(node_path)
	if node == null:
		return {"error": "Node not found: %s" % node_path}

	var value = params["value"]

	# Convert dictionary values to Godot types where appropriate
	if typeof(value) == TYPE_DICTIONARY:
		value = _convert_dict_to_variant(value, node, property)

	node.set(property, value)

	# Read back the value to confirm
	var read_back = node.get(property)

	return {"result": {
		"path": str(node.get_path()),
		"property": property,
		"value": _variant_to_json(read_back),
	}}


func _convert_dict_to_variant(dict: Dictionary, node: Node, property: String) -> Variant:
	# Try to detect the expected type from the current property value
	var current = node.get(property)
	if current is Vector2:
		return Vector2(dict.get("x", 0.0), dict.get("y", 0.0))
	elif current is Vector3:
		return Vector3(dict.get("x", 0.0), dict.get("y", 0.0), dict.get("z", 0.0))
	elif current is Color:
		return Color(dict.get("r", 0.0), dict.get("g", 0.0), dict.get("b", 0.0), dict.get("a", 1.0))
	elif current is Vector2i:
		return Vector2i(int(dict.get("x", 0)), int(dict.get("y", 0)))
	elif current is Vector3i:
		return Vector3i(int(dict.get("x", 0)), int(dict.get("y", 0)), int(dict.get("z", 0)))
	elif current is Rect2:
		return Rect2(dict.get("x", 0.0), dict.get("y", 0.0), dict.get("w", 0.0), dict.get("h", 0.0))
	return dict


func _variant_to_json(value: Variant) -> Variant:
	if value is Vector2:
		return {"x": value.x, "y": value.y}
	elif value is Vector3:
		return {"x": value.x, "y": value.y, "z": value.z}
	elif value is Color:
		return {"r": value.r, "g": value.g, "b": value.b, "a": value.a}
	elif value is Vector2i:
		return {"x": value.x, "y": value.y}
	elif value is Vector3i:
		return {"x": value.x, "y": value.y, "z": value.z}
	elif value is Rect2:
		return {"x": value.position.x, "y": value.position.y, "w": value.size.x, "h": value.size.y}
	elif value is Transform3D:
		return {
			"origin": {"x": value.origin.x, "y": value.origin.y, "z": value.origin.z},
		}
	elif value is Transform2D:
		return {
			"origin": {"x": value.origin.x, "y": value.origin.y},
		}
	elif value is NodePath:
		return str(value)
	elif value is Resource:
		return {"resource_type": value.get_class(), "resource_path": value.resource_path}
	elif value == null:
		return null
	return value


func _get_node_info(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("nodePath", "")
	if node_path == "":
		return {"error": "Missing required parameter: nodePath"}

	var node := _resolve_node(node_path)
	if node == null:
		return {"error": "Node not found: %s" % node_path}

	var include_properties: bool = params.get("includeProperties", true)

	var info: Dictionary = {
		"name": node.name,
		"type": node.get_class(),
		"path": str(node.get_path()),
		"childCount": node.get_child_count(),
		"children": [],
	}

	for child in node.get_children():
		info["children"].append({
			"name": child.name,
			"type": child.get_class(),
		})

	if node.get_script() != null:
		var script: Script = node.get_script()
		info["script"] = script.resource_path

	if include_properties:
		var props: Dictionary = {}
		for prop_info in node.get_property_list():
			var prop_name: String = prop_info["name"]
			# Skip internal/private properties
			if prop_name.begins_with("_") or prop_info["usage"] & PROPERTY_USAGE_INTERNAL:
				continue
			# Only include commonly useful property categories
			if prop_info["usage"] & PROPERTY_USAGE_EDITOR:
				var val = node.get(prop_name)
				props[prop_name] = _variant_to_json(val)
		info["properties"] = props

	return {"result": info}


func _get_scene_tree(params: Dictionary) -> Dictionary:
	var max_depth: int = params.get("maxDepth", -1)
	var root_path: String = params.get("rootPath", "")

	var root: Node = null
	if root_path != "":
		root = _resolve_node(root_path)
		if root == null:
			return {"error": "Root node not found: %s" % root_path}
	else:
		root = _get_scene_root()
		if root == null:
			return {"error": "No scene root available"}

	var tree_data := _build_tree(root, 0, max_depth)

	return {"result": tree_data}


func _build_tree(node: Node, current_depth: int, max_depth: int) -> Dictionary:
	var data: Dictionary = {
		"name": node.name,
		"type": node.get_class(),
		"path": str(node.get_path()),
		"childCount": node.get_child_count(),
	}

	if max_depth == -1 or current_depth < max_depth:
		var children: Array[Dictionary] = []
		for child in node.get_children():
			children.append(_build_tree(child, current_depth + 1, max_depth))
		data["children"] = children

	return data
