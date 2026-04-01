---
sidebar_position: 2
title: "Unity での使い方"
---

# Unity での使い方

Unity でよく使う操作を、自然言語での指示例とともにまとめたリファレンスです。


## シーン管理

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| シーンの階層を確認する | `シーンの構成を見せて` | `get_hierarchy` |
| 新しいシーンを作る | `新しいシーンを作って` | `create_scene` |
| シーンを保存する | `シーンを保存して` | `save_scene` |
| シーンを開く | `MainSceneを開いて` | `open_scene` |
| シーンのスクリーンショットを撮る | `スクショを撮って` | `take_screenshot` |


## オブジェクト操作

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| オブジェクトを作る | `Cubeを作って` | `create_object` |
| オブジェクトを移動する | `Cubeの位置を (0, 5, 0) にして` | `set_transform` |
| オブジェクトを回転する | `Cubeを45度回転して` | `set_transform` |
| オブジェクトを複製する | `Cubeを複製して` | `duplicate_object` |
| オブジェクトを削除する | `Cubeを削除して` | `delete_object` |


## マテリアル

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| マテリアルを作る | `赤いマテリアルを作って` | `create_material` |
| 色を変える | `Cubeの色を青にして` | `set_material_color` |
| テクスチャを設定する | `このテクスチャをCubeに貼って` | `set_material_texture` |
| マテリアル一覧を見る | `マテリアル一覧を見せて` | `get_materials` |
| シェーダーを変える | `マテリアルをURPのLitに変えて` | `set_material_shader` |


## スクリプト

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| スクリプトを作る | `PlayerControllerスクリプトを作って` | `create_script` |
| スクリプトを読む | `PlayerControllerの中身を見せて` | `read_script` |
| スクリプトを編集する | `移動速度を10に変えて` | `edit_script` |
| コンポーネントを追加する | `CubeにRigidbodyをつけて` | `add_component` |
| コンポーネントの値を変更する | `Rigidbodyのmassを5にして` | `set_component_property` |


## ライティング

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| ライトを追加する | `PointLightを追加して` | `create_light` |
| ライトの色を変える | `ライトの色をオレンジにして` | `set_light_property` |
| ライトの強さを変える | `ライトの強度を5にして` | `set_light_property` |
| 環境光を設定する | `環境光を暗くして` | `set_environment` |


## カメラ

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| カメラを追加する | `カメラを追加して` | `create_camera` |
| カメラを移動する | `カメラの位置を (0, 10, -10) にして` | `set_transform` |
| カメラの向きを変える | `カメラを原点に向けて` | `set_transform` |
| FOVを変更する | `カメラのFOVを90にして` | `set_camera_property` |


## アニメーション

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| AnimatorControllerを作る | `Cubeにアニメーターを作って` | `create_animator` |
| アニメーションクリップを作る | `回転アニメーションを作って` | `create_animation_clip` |
| パラメータを追加する | `isRunningパラメータを追加して` | `add_animator_parameter` |
| トランジションを設定する | `IdleからRunへの遷移を作って` | `add_animator_transition` |


## 物理

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| Rigidbodyを追加する | `CubeにRigidbodyをつけて` | `add_component` |
| Colliderを追加する | `CubeにBoxColliderをつけて` | `add_component` |
| 重力を無効にする | `CubeのRigidbodyの重力を切って` | `set_component_property` |
| 物理マテリアルを設定する | `反発係数を0.8にして` | `set_physics_material` |
| ジョイントを追加する | `HingeJointを追加して` | `add_component` |


## UI

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| Canvasを作る | `UIのCanvasを作って` | `create_ui_canvas` |
| テキストを追加する | `スコア表示用テキストを追加して` | `create_ui_element` |
| ボタンを追加する | `スタートボタンを追加して` | `create_ui_element` |
| UIの位置を調整する | `ボタンを画面中央に配置して` | `set_ui_layout` |


## ビルド

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| ビルド設定を確認する | `ビルド設定を見せて` | `get_build_settings` |
| プラットフォームを切り替える | `Androidに切り替えて` | `switch_platform` |
| ビルドを実行する | `Windowsでビルドして` | `build_project` |
| Player Settingsを変更する | `解像度を1920x1080にして` | `set_player_settings` |
