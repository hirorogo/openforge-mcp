---
sidebar_position: 2
title: Blender ツール一覧
---

# Blender ツール一覧

OpenForge MCP が提供する Blender 向けツールの一覧です。Dynamic モードでは `list_tools` と `get_tool_schema` で各ツールの詳細を取得できます。

## Object（オブジェクト）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_object` | 新しいオブジェクトを作成 | `name`, `type`, `location`, `rotation`, `scale` |
| `delete_object` | オブジェクトを削除 | `name` |
| `select_object` | オブジェクトを選択 | `name`, `extend` |
| `get_object_info` | オブジェクトの詳細情報を取得 | `name` |
| `set_object_transform` | 位置・回転・スケールを設定 | `name`, `location`, `rotation`, `scale` |
| `duplicate_object` | オブジェクトを複製 | `name`, `linked` |
| `rename_object` | オブジェクト名を変更 | `name`, `new_name` |
| `set_object_visibility` | 表示/非表示を切り替え | `name`, `visible` |
| `set_parent_object` | 親オブジェクトを設定 | `child`, `parent` |
| `join_objects` | 複数オブジェクトを結合 | `objects` |
| `separate_object` | オブジェクトを分離 | `name`, `mode` |

## Mesh（メッシュ）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `edit_mesh` | メッシュを編集モードで操作 | `name`, `operation`, `params` |
| `subdivide_mesh` | メッシュを細分化 | `name`, `cuts` |
| `extrude_faces` | 面を押し出し | `name`, `faces`, `offset` |
| `bevel_edges` | 辺をベベル | `name`, `edges`, `width`, `segments` |
| `merge_vertices` | 頂点をマージ | `name`, `threshold` |
| `create_mesh_from_data` | 頂点・面データからメッシュを作成 | `name`, `vertices`, `faces` |
| `get_mesh_stats` | メッシュの統計情報を取得 | `name` |
| `apply_boolean` | ブーリアン演算を適用 | `target`, `tool`, `operation` |
| `mirror_mesh` | メッシュをミラーリング | `name`, `axis` |
| `remesh` | リメッシュを実行 | `name`, `mode`, `resolution` |

## Material（マテリアル）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_material` | 新しいマテリアルを作成 | `name`, `color`, `metallic`, `roughness` |
| `assign_material` | オブジェクトにマテリアルを割り当て | `object`, `material` |
| `get_material_info` | マテリアル情報を取得 | `name` |
| `set_material_property` | マテリアルのプロパティを変更 | `name`, `property`, `value` |
| `create_principled_bsdf` | Principled BSDF マテリアルを作成 | `name`, `base_color`, `metallic`, `roughness`, `emission` |

## Scene（シーン）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `get_scene_info` | シーン情報を取得 | なし |
| `list_objects` | シーン内のオブジェクト一覧を取得 | `type_filter` |
| `set_scene_property` | シーンプロパティを設定 | `property`, `value` |
| `create_collection` | コレクションを作成 | `name`, `parent` |
| `move_to_collection` | オブジェクトをコレクションに移動 | `object`, `collection` |

## Screenshot（スクリーンショット）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `take_screenshot` | ビューポートのスクリーンショットを取得 | `width`, `height` |
| `take_render_screenshot` | レンダリング結果を取得 | `width`, `height`, `samples` |

## Animation（アニメーション）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `insert_keyframe` | キーフレームを挿入 | `object`, `property`, `frame`, `value` |
| `delete_keyframe` | キーフレームを削除 | `object`, `property`, `frame` |
| `set_frame_range` | フレーム範囲を設定 | `start`, `end` |
| `set_current_frame` | 現在のフレームを設定 | `frame` |
| `create_action` | アクションを作成 | `name`, `object` |
| `set_interpolation` | 補間モードを設定 | `object`, `property`, `mode` |

## UV（UV展開）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `unwrap_uv` | UV展開を実行 | `object`, `method` |
| `smart_uv_project` | スマートUV展開 | `object`, `angle_limit`, `island_margin` |
| `pack_uv_islands` | UVアイランドをパック | `object`, `margin` |
| `project_uv` | UV投影 | `object`, `direction` |

## Render（レンダリング）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `set_render_engine` | レンダリングエンジンを設定 | `engine` |
| `set_render_resolution` | レンダリング解像度を設定 | `width`, `height`, `percentage` |
| `set_render_samples` | サンプル数を設定 | `samples` |
| `render_image` | 画像をレンダリング | `output_path`, `file_format` |
| `render_animation` | アニメーションをレンダリング | `output_path`, `file_format`, `start`, `end` |
| `set_output_format` | 出力フォーマットを設定 | `format`, `quality` |

## Armature（アーマチュア）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_armature` | アーマチュアを作成 | `name`, `location` |
| `add_bone` | ボーンを追加 | `armature`, `name`, `head`, `tail`, `parent` |
| `set_bone_transform` | ボーンのトランスフォームを設定 | `armature`, `bone`, `head`, `tail`, `roll` |
| `set_bone_parent` | ボーンの親を設定 | `armature`, `bone`, `parent` |
| `add_ik_constraint` | IK コンストレイントを追加 | `armature`, `bone`, `target`, `chain_length` |
| `set_pose_bone` | ポーズモードでボーンを設定 | `armature`, `bone`, `location`, `rotation` |

## VRM

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `export_vrm` | VRM ファイルをエクスポート | `output_path`, `version` |
| `import_vrm` | VRM ファイルをインポート | `file_path` |
| `set_vrm_meta` | VRM メタデータを設定 | `title`, `author`, `license` |
| `setup_vrm_spring_bone` | スプリングボーンを設定 | `armature`, `bones`, `stiffness`, `gravity` |
| `setup_vrm_expression` | VRM 表情を設定 | `name`, `preset`, `binds` |

## Lighting（ライティング）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_light` | ライトオブジェクトを作成 | `name`, `type`, `energy`, `color`, `location` |
| `set_light_property` | ライトのプロパティを変更 | `name`, `property`, `value` |
| `set_world_hdri` | HDRI 環境マップを設定 | `hdri_path`, `strength` |
| `set_world_color` | ワールド背景色を設定 | `color` |

## Camera（カメラ）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_camera` | カメラを作成 | `name`, `location`, `rotation`, `focal_length` |
| `set_active_camera` | アクティブカメラを設定 | `name` |
| `set_camera_property` | カメラのプロパティを変更 | `name`, `property`, `value` |
| `look_at` | カメラをターゲットに向ける | `camera`, `target` |

## Sculpt（スカルプト）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `enter_sculpt_mode` | スカルプトモードに入る | `object` |
| `sculpt_stroke` | スカルプトストロークを実行 | `brush`, `points`, `radius`, `strength` |
| `set_sculpt_brush` | スカルプトブラシを設定 | `brush_type`, `radius`, `strength` |
| `apply_sculpt_mask` | スカルプトマスクを適用 | `object`, `vertices`, `values` |

## Texture（テクスチャ）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_image_texture` | 画像テクスチャを作成 | `name`, `width`, `height`, `color` |
| `load_texture` | テクスチャファイルを読み込み | `file_path`, `name` |
| `bake_texture` | テクスチャをベイク | `object`, `type`, `width`, `height` |
| `paint_texture` | テクスチャペイント | `object`, `color`, `position`, `radius` |

## Node（ノードエディタ）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `add_shader_node` | シェーダーノードを追加 | `material`, `node_type`, `location` |
| `connect_nodes` | ノードを接続 | `material`, `from_node`, `from_output`, `to_node`, `to_input` |
| `set_node_value` | ノードの値を設定 | `material`, `node`, `input`, `value` |
| `create_node_group` | ノードグループを作成 | `name`, `nodes` |
| `add_geometry_node` | ジオメトリノードを追加 | `object`, `node_type` |

## Import/Export（入出力）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `import_model` | 3D モデルをインポート | `file_path`, `format` |
| `export_model` | 3D モデルをエクスポート | `file_path`, `format`, `selection_only` |
| `import_image` | 画像をインポート | `file_path` |
| `export_usd` | USD 形式でエクスポート | `file_path`, `selection_only` |

対応フォーマット: FBX, OBJ, glTF/GLB, STL, PLY, USD, ABC

## Modifier（モディファイア）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `add_modifier` | モディファイアを追加 | `object`, `type` |
| `set_modifier_property` | モディファイアのプロパティを設定 | `object`, `modifier`, `property`, `value` |
| `apply_modifier` | モディファイアを適用 | `object`, `modifier` |
| `remove_modifier` | モディファイアを削除 | `object`, `modifier` |

対応モディファイア: Subdivision Surface, Mirror, Array, Boolean, Solidify, Bevel, Decimate, Remesh, Shrinkwrap, Armature, Lattice など
