@tool
extends RefCounted


func execute(tool_name: String, params: Dictionary) -> Dictionary:
	match tool_name:
		"create_material":
			return _create_material(params)
		"create_script":
			return _create_script(params)
		"attach_script":
			return _attach_script(params)
		"load_scene":
			return _load_scene(params)
		"save_scene":
			return _save_scene(params)
		"create_mesh":
			return _create_mesh(params)
		"set_material":
			return _set_material(params)
		"import_asset":
			return _import_asset(params)
		_:
			return {"error": "Unknown resource tool: %s" % tool_name, "code": -32601}


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
	var scene_root := _get_scene_root()
	if scene_root == null:
		return null
	return scene_root.get_node_or_null(NodePath(node_path))


func _create_material(params: Dictionary) -> Dictionary:
	var type_name: String = params.get("type", "StandardMaterial3D")
	var mat_name: String = params.get("name", "NewMaterial")
	var save_path: String = params.get("savePath", "")

	var material: Material = null

	match type_name:
		"StandardMaterial3D":
			var std_mat := StandardMaterial3D.new()
			std_mat.resource_name = mat_name

			if params.has("albedoColor"):
				var color_dict: Dictionary = params["albedoColor"]
				std_mat.albedo_color = Color(
					color_dict.get("r", 1.0),
					color_dict.get("g", 1.0),
					color_dict.get("b", 1.0),
					color_dict.get("a", 1.0),
				)

			if params.has("metallic"):
				std_mat.metallic = float(params["metallic"])

			if params.has("roughness"):
				std_mat.roughness = float(params["roughness"])

			material = std_mat

		"ShaderMaterial":
			var shader_mat := ShaderMaterial.new()
			shader_mat.resource_name = mat_name

			if params.has("shaderCode"):
				var shader := Shader.new()
				shader.code = params["shaderCode"]
				shader_mat.shader = shader

			material = shader_mat

		_:
			return {"error": "Unknown material type: %s. Use StandardMaterial3D or ShaderMaterial." % type_name}

	if save_path != "":
		var err := ResourceSaver.save(material, save_path)
		if err != OK:
			return {"error": "Failed to save material to %s: %s" % [save_path, error_string(err)]}

	return {"result": {
		"name": mat_name,
		"type": type_name,
		"savePath": save_path if save_path != "" else null,
	}}


func _create_script(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	if path == "":
		return {"error": "Missing required parameter: path"}

	var source: String = params.get("source", "")
	var base_class: String = params.get("baseClass", "Node")

	if source == "":
		source = "extends %s\n\n\nfunc _ready() -> void:\n\tpass\n\n\nfunc _process(delta: float) -> void:\n\tpass\n" % base_class

	# Ensure directory exists
	var dir_path := path.get_base_dir()
	if not DirAccess.dir_exists_absolute(dir_path):
		var err := DirAccess.make_dir_recursive_absolute(dir_path)
		if err != OK:
			return {"error": "Failed to create directory %s: %s" % [dir_path, error_string(err)]}

	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return {"error": "Failed to open file for writing: %s (error: %s)" % [path, error_string(FileAccess.get_open_error())]}

	file.store_string(source)
	file.close()

	# Notify the editor that the filesystem has changed
	if Engine.is_editor_hint():
		var efs := EditorInterface.get_resource_filesystem()
		if efs != null:
			efs.scan()

	return {"result": {
		"path": path,
		"size": source.length(),
	}}


func _attach_script(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("nodePath", "")
	var script_path: String = params.get("scriptPath", "")

	if node_path == "":
		return {"error": "Missing required parameter: nodePath"}
	if script_path == "":
		return {"error": "Missing required parameter: scriptPath"}

	var node := _resolve_node(node_path)
	if node == null:
		return {"error": "Node not found: %s" % node_path}

	var script := load(script_path)
	if script == null:
		return {"error": "Failed to load script: %s" % script_path}

	if not (script is GDScript):
		return {"error": "Resource is not a GDScript: %s" % script_path}

	node.set_script(script)

	return {"result": {
		"nodePath": str(node.get_path()),
		"scriptPath": script_path,
	}}


func _load_scene(params: Dictionary) -> Dictionary:
	var scene_path: String = params.get("scenePath", "")
	if scene_path == "":
		return {"error": "Missing required parameter: scenePath"}

	var parent_path: String = params.get("parentPath", "")
	var instance_name: String = params.get("name", "")

	var packed_scene := load(scene_path)
	if packed_scene == null:
		return {"error": "Failed to load scene: %s" % scene_path}

	if not (packed_scene is PackedScene):
		return {"error": "Resource is not a PackedScene: %s" % scene_path}

	if parent_path == "":
		return {"result": {
			"scenePath": scene_path,
			"loaded": true,
			"instanced": false,
		}}

	var parent := _resolve_node(parent_path)
	if parent == null:
		return {"error": "Parent node not found: %s" % parent_path}

	var instance := (packed_scene as PackedScene).instantiate()
	if instance == null:
		return {"error": "Failed to instantiate scene: %s" % scene_path}

	if instance_name != "":
		instance.name = instance_name

	parent.add_child(instance, true)
	instance.owner = _get_scene_root()

	# Set owner for all descendants
	_set_owner_recursive(instance, _get_scene_root())

	return {"result": {
		"scenePath": scene_path,
		"loaded": true,
		"instanced": true,
		"name": instance.name,
		"path": str(instance.get_path()),
	}}


func _set_owner_recursive(node: Node, owner: Node) -> void:
	for child in node.get_children():
		child.owner = owner
		_set_owner_recursive(child, owner)


func _save_scene(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var scene_root := _get_scene_root()

	if scene_root == null:
		return {"error": "No scene root available. Open or create a scene first."}

	if path == "":
		path = scene_root.scene_file_path
		if path == "":
			return {"error": "Scene has no file path. Provide a path parameter."}

	var packed := PackedScene.new()
	var err := packed.pack(scene_root)
	if err != OK:
		return {"error": "Failed to pack scene: %s" % error_string(err)}

	err = ResourceSaver.save(packed, path)
	if err != OK:
		return {"error": "Failed to save scene to %s: %s" % [path, error_string(err)]}

	return {"result": {
		"path": path,
		"saved": true,
	}}


func _create_mesh(params: Dictionary) -> Dictionary:
	var type_name: String = params.get("type", "")
	if type_name == "":
		return {"error": "Missing required parameter: type"}

	var mesh: Mesh = null
	var size_dict: Dictionary = params.get("size", {})

	match type_name:
		"BoxMesh":
			var box := BoxMesh.new()
			if size_dict.size() > 0:
				box.size = Vector3(
					size_dict.get("x", 1.0),
					size_dict.get("y", 1.0),
					size_dict.get("z", 1.0),
				)
			mesh = box
		"SphereMesh":
			var sphere := SphereMesh.new()
			if size_dict.has("x"):
				sphere.radius = float(size_dict["x"]) / 2.0
				sphere.height = float(size_dict.get("y", size_dict["x"]))
			mesh = sphere
		"CylinderMesh":
			var cyl := CylinderMesh.new()
			if size_dict.has("x"):
				cyl.top_radius = float(size_dict["x"]) / 2.0
				cyl.bottom_radius = float(size_dict["x"]) / 2.0
			if size_dict.has("y"):
				cyl.height = float(size_dict["y"])
			mesh = cyl
		"PlaneMesh":
			var plane := PlaneMesh.new()
			if size_dict.size() > 0:
				plane.size = Vector2(
					size_dict.get("x", 1.0),
					size_dict.get("z", size_dict.get("y", 1.0)),
				)
			mesh = plane
		"CapsuleMesh":
			var capsule := CapsuleMesh.new()
			if size_dict.has("x"):
				capsule.radius = float(size_dict["x"]) / 2.0
			if size_dict.has("y"):
				capsule.height = float(size_dict["y"])
			mesh = capsule
		"PrismMesh":
			var prism := PrismMesh.new()
			if size_dict.size() > 0:
				prism.size = Vector3(
					size_dict.get("x", 1.0),
					size_dict.get("y", 1.0),
					size_dict.get("z", 1.0),
				)
			mesh = prism
		"TorusMesh":
			var torus := TorusMesh.new()
			if size_dict.has("x"):
				torus.outer_radius = float(size_dict["x"]) / 2.0
			if size_dict.has("y"):
				torus.inner_radius = float(size_dict["y"]) / 2.0
			mesh = torus
		_:
			return {"error": "Unknown mesh type: %s" % type_name}

	# Assign to existing node or create a new MeshInstance3D
	var node_path: String = params.get("nodePath", "")
	var mesh_instance: MeshInstance3D = null

	if node_path != "":
		var node := _resolve_node(node_path)
		if node == null:
			return {"error": "Node not found: %s" % node_path}
		if not (node is MeshInstance3D):
			return {"error": "Node is not a MeshInstance3D: %s (%s)" % [node_path, node.get_class()]}
		mesh_instance = node as MeshInstance3D
	else:
		mesh_instance = MeshInstance3D.new()
		mesh_instance.name = type_name.replace("Mesh", "")
		var scene_root := _get_scene_root()
		if scene_root == null:
			return {"error": "No scene root available"}
		scene_root.add_child(mesh_instance, true)
		mesh_instance.owner = scene_root

	mesh_instance.mesh = mesh

	return {"result": {
		"meshType": type_name,
		"nodePath": str(mesh_instance.get_path()),
		"nodeName": mesh_instance.name,
	}}


func _set_material(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("nodePath", "")
	var material_path: String = params.get("materialPath", "")

	if node_path == "":
		return {"error": "Missing required parameter: nodePath"}
	if material_path == "":
		return {"error": "Missing required parameter: materialPath"}

	var node := _resolve_node(node_path)
	if node == null:
		return {"error": "Node not found: %s" % node_path}

	if not (node is MeshInstance3D):
		return {"error": "Node is not a MeshInstance3D: %s (%s)" % [node_path, node.get_class()]}

	var material := load(material_path)
	if material == null:
		return {"error": "Failed to load material: %s" % material_path}

	if not (material is Material):
		return {"error": "Resource is not a Material: %s" % material_path}

	var mesh_instance := node as MeshInstance3D

	if params.has("surfaceIndex"):
		var surface_index: int = int(params["surfaceIndex"])
		mesh_instance.set_surface_override_material(surface_index, material as Material)
	else:
		mesh_instance.material_override = material as Material

	return {"result": {
		"nodePath": str(mesh_instance.get_path()),
		"materialPath": material_path,
		"surfaceIndex": params.get("surfaceIndex", null),
	}}


func _import_asset(params: Dictionary) -> Dictionary:
	var source_path: String = params.get("sourcePath", "")
	var target_path: String = params.get("targetPath", "")

	if source_path == "":
		return {"error": "Missing required parameter: sourcePath"}
	if target_path == "":
		return {"error": "Missing required parameter: targetPath"}

	# Verify source file exists
	if not FileAccess.file_exists(source_path):
		return {"error": "Source file not found: %s" % source_path}

	# Ensure target directory exists
	var target_dir := target_path.get_base_dir()
	if not DirAccess.dir_exists_absolute(target_dir):
		var err := DirAccess.make_dir_recursive_absolute(target_dir)
		if err != OK:
			return {"error": "Failed to create target directory %s: %s" % [target_dir, error_string(err)]}

	# Copy the file
	var err := DirAccess.copy_absolute(source_path, target_path)
	if err != OK:
		return {"error": "Failed to copy file: %s" % error_string(err)}

	# Trigger reimport
	if Engine.is_editor_hint():
		var efs := EditorInterface.get_resource_filesystem()
		if efs != null:
			efs.scan()

	return {"result": {
		"sourcePath": source_path,
		"targetPath": target_path,
		"importType": params.get("importType", "other"),
		"imported": true,
	}}
