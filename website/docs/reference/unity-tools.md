---
sidebar_position: 1
title: Unity ツール一覧
---

# Unity ツール一覧

OpenForge MCP が提供する Unity 向けツールの一覧です。Dynamic モードでは `list_tools` と `get_tool_schema` で各ツールの詳細を取得できます。

## Scene（シーン）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `get_scene_info` | 現在のシーン情報を取得 | なし |
| `create_scene` | 新しいシーンを作成 | `name` |
| `open_scene` | 既存のシーンを開く | `path` |
| `save_scene` | 現在のシーンを保存 | `path`（省略時は上書き保存） |
| `get_hierarchy` | シーン階層構造を取得 | `depth`（取得する階層の深さ） |

## GameObject（ゲームオブジェクト）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_gameobject` | 新しいゲームオブジェクトを作成 | `name`, `type`, `position`, `rotation`, `scale` |
| `delete_gameobject` | ゲームオブジェクトを削除 | `target` |
| `find_gameobject` | 名前でゲームオブジェクトを検索 | `name`, `tag` |
| `get_gameobject_info` | オブジェクトの詳細情報を取得 | `target` |
| `set_transform` | 位置・回転・スケールを設定 | `target`, `position`, `rotation`, `scale` |
| `set_parent` | 親オブジェクトを設定 | `target`, `parent` |
| `duplicate_gameobject` | オブジェクトを複製 | `target`, `new_name` |
| `rename_gameobject` | オブジェクトの名前を変更 | `target`, `new_name` |
| `set_active` | オブジェクトの有効/無効を切り替え | `target`, `active` |
| `add_component` | コンポーネントを追加 | `target`, `component_type` |
| `remove_component` | コンポーネントを削除 | `target`, `component_type` |
| `set_component_property` | コンポーネントのプロパティを設定 | `target`, `component_type`, `property`, `value` |

## Material（マテリアル）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_material` | 新しいマテリアルを作成 | `name`, `shader`, `color` |
| `set_material` | オブジェクトにマテリアルを適用 | `target`, `material` |
| `get_material_info` | マテリアルの情報を取得 | `target` |
| `set_material_property` | マテリアルのプロパティを設定 | `material`, `property`, `value` |
| `set_material_texture` | テクスチャを設定 | `material`, `property`, `texture_path` |

## Script（スクリプト）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_script` | C# スクリプトを作成 | `name`, `code`, `path` |
| `attach_script` | オブジェクトにスクリプトをアタッチ | `target`, `script_name` |
| `get_script_source` | スクリプトのソースコードを取得 | `script_name` |
| `update_script` | スクリプトを更新 | `name`, `code` |
| `list_scripts` | プロジェクト内のスクリプト一覧 | `path`（検索パス） |

## Screenshot（スクリーンショット）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `take_screenshot` | シーンビューのスクリーンショットを取得 | `width`, `height` |
| `take_game_screenshot` | ゲームビューのスクリーンショットを取得 | `width`, `height` |

## Animation（アニメーション）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_animation_clip` | アニメーションクリップを作成 | `name`, `length` |
| `add_animation_keyframe` | キーフレームを追加 | `clip`, `path`, `property`, `time`, `value` |
| `set_animator_controller` | Animator Controller を設定 | `target`, `controller` |
| `create_animator_state` | アニメーターステートを作成 | `controller`, `state_name`, `clip` |
| `set_animation_curve` | アニメーションカーブを設定 | `clip`, `path`, `property`, `keys` |
| `play_animation` | アニメーションを再生 | `target`, `clip_name` |

## Physics（物理演算）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `add_rigidbody` | Rigidbody を追加 | `target`, `mass`, `use_gravity`, `is_kinematic` |
| `add_collider` | Collider を追加 | `target`, `type`, `is_trigger` |
| `set_physics_material` | 物理マテリアルを設定 | `target`, `friction`, `bounciness` |
| `add_joint` | Joint を追加 | `target`, `type`, `connected_body` |
| `set_rigidbody_constraints` | Rigidbody の制約を設定 | `target`, `constraints` |
| `raycast` | レイキャストを実行 | `origin`, `direction`, `max_distance` |

## UI（ユーザーインターフェース）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_canvas` | Canvas を作成 | `name`, `render_mode` |
| `create_ui_text` | Text 要素を作成 | `name`, `text`, `font_size`, `color` |
| `create_ui_image` | Image 要素を作成 | `name`, `sprite`, `color` |
| `create_ui_button` | Button を作成 | `name`, `text`, `on_click` |
| `create_ui_panel` | Panel を作成 | `name`, `color`, `size` |
| `set_ui_rect` | RectTransform を設定 | `target`, `anchors`, `position`, `size` |

## Lighting（ライティング）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_light` | ライトを作成 | `name`, `type`, `color`, `intensity`, `position`, `rotation` |
| `set_light_property` | ライトのプロパティを変更 | `target`, `property`, `value` |
| `set_ambient_light` | 環境光を設定 | `color`, `intensity`, `mode` |
| `set_fog` | フォグを設定 | `enabled`, `color`, `mode`, `density` |
| `set_skybox` | Skybox を設定 | `material` |
| `bake_lighting` | ライトマップをベイク | `quality` |

## Camera（カメラ）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `set_camera` | カメラの位置・回転を設定 | `position`, `rotation`, `fov` |
| `get_camera_info` | カメラの情報を取得 | `target` |
| `create_camera` | 新しいカメラを作成 | `name`, `position`, `rotation`, `fov` |
| `set_camera_property` | カメラのプロパティを変更 | `target`, `property`, `value` |

## Prefab（プレハブ）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_prefab` | オブジェクトからプレハブを作成 | `target`, `path` |
| `instantiate_prefab` | プレハブをインスタンス化 | `path`, `position`, `rotation` |
| `apply_prefab_overrides` | プレハブのオーバーライドを適用 | `target` |
| `unpack_prefab` | プレハブを展開 | `target`, `mode` |

## Audio（オーディオ）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `add_audio_source` | AudioSource を追加 | `target`, `clip`, `volume`, `loop` |
| `set_audio_property` | オーディオプロパティを設定 | `target`, `property`, `value` |
| `create_audio_mixer` | Audio Mixer を作成 | `name` |
| `set_audio_mixer_param` | Mixer パラメータを設定 | `mixer`, `param`, `value` |

## Terrain（地形）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_terrain` | Terrain を作成 | `name`, `width`, `height`, `length` |
| `set_terrain_height` | 地形の高さを設定 | `target`, `heights`, `offset_x`, `offset_y` |
| `paint_terrain_texture` | 地形テクスチャをペイント | `target`, `layer`, `position`, `radius`, `opacity` |
| `add_terrain_layer` | Terrain Layer を追加 | `target`, `texture`, `normal_map`, `tile_size` |
| `place_terrain_trees` | 地形に木を配置 | `target`, `prefab`, `positions`, `density` |
| `set_terrain_detail` | 草・詳細メッシュを設定 | `target`, `prototype`, `density` |

## NavMesh（ナビメッシュ）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `bake_navmesh` | NavMesh をベイク | `agent_radius`, `agent_height`, `step_height` |
| `add_navmesh_agent` | NavMeshAgent を追加 | `target`, `speed`, `radius`, `height` |
| `set_navmesh_destination` | エージェントの目的地を設定 | `target`, `destination` |
| `add_navmesh_obstacle` | NavMesh Obstacle を追加 | `target`, `shape`, `carve` |
| `add_offmesh_link` | OffMeshLink を追加 | `start`, `end`, `bidirectional` |

## VFX（ビジュアルエフェクト）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `create_particle_system` | パーティクルシステムを作成 | `name`, `position`, `preset` |
| `set_particle_property` | パーティクルプロパティを変更 | `target`, `module`, `property`, `value` |
| `create_trail_renderer` | Trail Renderer を作成 | `target`, `time`, `width`, `color` |
| `create_line_renderer` | Line Renderer を作成 | `target`, `points`, `width`, `color` |

## Optimization（最適化）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `get_scene_stats` | シーンの統計情報を取得 | なし |
| `set_static_flags` | Static フラグを設定 | `target`, `flags` |
| `set_lod_group` | LOD Group を設定 | `target`, `lod_levels` |
| `set_occlusion_area` | Occlusion Area を設定 | `position`, `size` |
| `batch_set_quality` | テクスチャ品質を一括設定 | `max_size`, `compression` |

## Build（ビルド）

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `build_project` | プロジェクトをビルド | `target_platform`, `output_path`, `scenes` |
| `get_build_settings` | ビルド設定を取得 | なし |
| `set_build_settings` | ビルド設定を変更 | `platform`, `settings` |
| `switch_platform` | ターゲットプラットフォームを切り替え | `platform` |
