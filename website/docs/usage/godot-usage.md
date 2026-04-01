---
sidebar_position: 4
title: "Godot での使い方"
---

# Godot での使い方

Godot でよく使う操作を、自然言語での指示例とともにまとめたリファレンスです。


## ノード操作

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| ノードを追加する | `MeshInstance3Dノードを追加して` | `add_node` |
| ノードを削除する | `Playerノードを削除して` | `delete_node` |
| ノードを移動する | `Playerの位置を (0, 5, 0) にして` | `set_node_property` |
| ノード一覧を見る | `シーンツリーを見せて` | `get_scene_tree` |
| ノードをリネームする | `Node3DをPlayerに名前変更して` | `rename_node` |


## スクリプト

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| GDScriptを作る | `Player用のスクリプトを作って` | `create_script` |
| スクリプトを読む | `player.gdの内容を見せて` | `read_script` |
| スクリプトを編集する | `移動速度を10に変更して` | `edit_script` |
| シグナルを接続する | `ボタンのpressedシグナルを接続して` | `connect_signal` |


## マテリアル

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| マテリアルを作る | `赤いStandardMaterial3Dを作って` | `create_material` |
| 色を変える | `マテリアルの色を青に変えて` | `set_material_property` |
| テクスチャを設定する | `テクスチャをセットして` | `set_material_texture` |
| シェーダーを作る | `カスタムシェーダーを作って` | `create_shader` |


## シーン管理

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| シーンを保存する | `シーンを保存して` | `save_scene` |
| シーンを開く | `main.tscnを開いて` | `open_scene` |
| 新しいシーンを作る | `新しいシーンを作って` | `create_scene` |
| シーンをインスタンス化する | `enemy.tscnをインスタンス化して` | `instance_scene` |


## リソース

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| リソースを確認する | `プロジェクトのリソース一覧を見せて` | `list_resources` |
| リソースを読み込む | `テクスチャを読み込んで` | `load_resource` |
| エクスポート設定を確認する | `エクスポート設定を見せて` | `get_export_settings` |


## 物理

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| CollisionShapeを追加する | `当たり判定を追加して` | `add_collision_shape` |
| RigidBody3Dを作る | `物理オブジェクトにして` | `add_node` |
| Areaを追加する | `検知エリアを追加して` | `add_node` |
