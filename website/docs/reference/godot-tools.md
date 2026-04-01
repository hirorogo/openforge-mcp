---
sidebar_position: 3
title: Godot ツール一覧
---

# Godot ツール一覧

OpenForge MCP が提供する Godot 向けツールの一覧です。Dynamic モードでは `list_tools` と `get_tool_schema` で各ツールの詳細を取得できます。

## Node（ノード）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_node` | 新しいノードを作成 | `name`, `type`, `parent` |
| `delete_node` | ノードを削除 | `path` |
| `get_node_info` | ノードの詳細情報を取得 | `path` |
| `set_node_property` | ノードのプロパティを設定 | `path`, `property`, `value` |
| `get_node_property` | ノードのプロパティを取得 | `path`, `property` |
| `find_node` | ノードを検索 | `name`, `type`, `recursive` |
| `rename_node` | ノードの名前を変更 | `path`, `new_name` |
| `reparent_node` | ノードの親を変更 | `path`, `new_parent` |
| `duplicate_node` | ノードを複製 | `path`, `new_name` |
| `get_scene_tree` | シーンツリーを取得 | `depth` |
| `create_node2d` | Node2D を作成 | `name`, `parent`, `position`, `rotation`, `scale` |
| `create_node3d` | Node3D を作成 | `name`, `parent`, `position`, `rotation`, `scale` |
| `create_mesh_instance` | MeshInstance3D を作成 | `name`, `parent`, `mesh_type`, `position` |
| `create_camera3d` | Camera3D を作成 | `name`, `parent`, `position`, `rotation`, `fov` |
| `create_light3d` | Light3D を作成 | `name`, `parent`, `type`, `position`, `energy`, `color` |
| `create_sprite2d` | Sprite2D を作成 | `name`, `parent`, `texture`, `position` |
| `add_child_scene` | PackedScene をインスタンス化して子ノードに追加 | `scene_path`, `parent`, `name` |

## Resource（リソース）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_resource` | リソースを作成 | `type`, `properties`, `save_path` |
| `load_resource` | リソースを読み込み | `path` |
| `save_resource` | リソースを保存 | `resource`, `path` |
| `create_material3d` | StandardMaterial3D を作成 | `name`, `albedo_color`, `metallic`, `roughness` |
| `assign_material` | ノードにマテリアルを割り当て | `node_path`, `material`, `surface_index` |
| `create_script` | GDScript を作成 | `path`, `code` |
| `attach_script` | ノードにスクリプトをアタッチ | `node_path`, `script_path` |
| `get_script_source` | スクリプトのソースコードを取得 | `path` |
| `update_script` | スクリプトを更新 | `path`, `code` |
| `list_project_files` | プロジェクトファイルの一覧を取得 | `directory`, `extension_filter` |
| `create_scene` | 新しいシーンを作成 | `name`, `root_type` |
| `open_scene` | シーンを開く | `path` |
| `save_scene` | 現在のシーンを保存 | `path` |
| `get_project_settings` | プロジェクト設定を取得 | `property` |
| `set_project_settings` | プロジェクト設定を変更 | `property`, `value` |

## Screenshot（スクリーンショット）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `take_screenshot` | エディタビューポートのスクリーンショットを取得 | `width`, `height` |
| `take_game_screenshot` | ゲーム実行中のスクリーンショットを取得 | `width`, `height` |
