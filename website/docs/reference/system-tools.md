---
sidebar_position: 4
title: システムツール
---

# システムツール

OpenForge MCP が提供するアプリケーション横断のシステムツールです。バージョン管理、トランザクション、パイプライン、レシピの各機能を含みます。

## Version Control（バージョン管理）

シーンやプロジェクトの状態を保存・復元する機能です。Git とは独立した OpenForge MCP 独自のバージョン管理で、エディタの操作単位で状態を記録します。

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `save_version` | 現在の状態を保存 | `name`, `description` |
| `list_versions` | 保存済みバージョンの一覧を取得 | `limit`, `offset` |
| `restore_version` | 指定したバージョンに復元 | `version_id` |
| `create_branch` | ブランチを作成 | `name`, `from_version` |
| `list_branches` | ブランチの一覧を取得 | なし |
| `switch_branch` | ブランチを切り替え | `name` |
| `delete_version` | バージョンを削除 | `version_id` |

### 使用例

```bash
# 現在の状態を保存
curl -X POST http://localhost:8080/tools/save_version \
  -H "Content-Type: application/json" \
  -d '{
    "name": "initial-layout",
    "description": "基本レイアウト完成"
  }'

# バージョン一覧を取得
curl http://localhost:8080/tools/list_versions

# 特定のバージョンに復元
curl -X POST http://localhost:8080/tools/restore_version \
  -H "Content-Type: application/json" \
  -d '{"version_id": "v001"}'
```

### ブランチの活用

ブランチを使うと、異なるバリエーションを並行して試すことができます。

```bash
# ブランチを作成
curl -X POST http://localhost:8080/tools/create_branch \
  -H "Content-Type: application/json" \
  -d '{
    "name": "lighting-experiment",
    "from_version": "v003"
  }'

# ブランチを切り替え
curl -X POST http://localhost:8080/tools/switch_branch \
  -H "Content-Type: application/json" \
  -d '{"name": "lighting-experiment"}'
```

## Transaction（トランザクション）

複数のツール呼び出しをまとめてアトミックに実行する機能です。途中でエラーが発生した場合、トランザクション開始時点の状態にロールバックできます。

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `begin_transaction` | トランザクションを開始 | `name` |
| `commit_transaction` | トランザクションを確定 | なし |
| `rollback_transaction` | トランザクションをロールバック | なし |
| `get_transaction_status` | 現在のトランザクション状態を取得 | なし |

### 使用例

```bash
# トランザクション開始
curl -X POST http://localhost:8080/tools/begin_transaction \
  -H "Content-Type: application/json" \
  -d '{"name": "scene-setup"}'

# 複数の操作を実行
curl -X POST http://localhost:8080/tools/create_gameobject \
  -H "Content-Type: application/json" \
  -d '{"name": "Wall1", "type": "Cube"}'

curl -X POST http://localhost:8080/tools/create_gameobject \
  -H "Content-Type: application/json" \
  -d '{"name": "Wall2", "type": "Cube"}'

# 問題なければ確定
curl -X POST http://localhost:8080/tools/commit_transaction

# 問題があればロールバック
curl -X POST http://localhost:8080/tools/rollback_transaction
```

### AI クライアントでの使い方

AI に対して以下のように指示すると、トランザクションを活用した操作が可能です。

```
「トランザクションを使って、壁4枚と床1枚で部屋を作って。
  うまくいかなかったらロールバックして。」
```

AI は自動的に `begin_transaction` を呼び出し、すべての操作が成功した場合に `commit_transaction` を実行します。

## Pipeline（パイプライン）

アプリケーション間でアセットを転送する機能です。Blender で作成したモデルを Unity にインポートするなど、クロスアプリケーションのワークフローを実現します。

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `transfer_asset` | アセットを別のアプリケーションに転送 | `source_app`, `target_app`, `asset`, `format`, `options` |
| `get_pipeline_status` | パイプラインの状態を取得 | なし |
| `list_transferable_assets` | 転送可能なアセットの一覧を取得 | `app` |

### 使用例

```bash
# Blender のオブジェクトを Unity に転送
curl -X POST http://localhost:8080/tools/transfer_asset \
  -H "Content-Type: application/json" \
  -d '{
    "source_app": "blender",
    "target_app": "unity",
    "asset": "Character",
    "format": "fbx",
    "options": {
      "apply_modifiers": true,
      "include_animations": true
    }
  }'
```

### 対応する転送パス

| 転送元 | 転送先 | 対応フォーマット |
|---|---|---|
| Blender | Unity | FBX, glTF, OBJ, USD |
| Blender | Godot | glTF, OBJ, FBX |
| Unity | Blender | FBX, OBJ |
| Godot | Blender | glTF, OBJ |

### AI クライアントでの使い方

```
「Blender で作った Character モデルを Unity にインポートして」
```

AI が自動的に `transfer_asset` を呼び出し、エクスポート・インポートを一括で処理します。

## Recipe（レシピ）

レシピの実行と管理を行うツールです。レシピの詳細については [レシピ機能](/docs/advanced/recipe) を参照してください。

| ツール名 | 説明 | 主なパラメータ |
|---|---|---|
| `run_recipe` | レシピを実行 | `recipe`, `variables` |
| `list_recipes` | 利用可能なレシピの一覧を取得 | なし |
| `get_recipe_info` | レシピの詳細情報を取得 | `recipe` |
| `validate_recipe` | レシピの構文を検証 | `recipe` |

### 使用例

```bash
# レシピ一覧を取得
curl http://localhost:8080/tools/list_recipes

# レシピを実行
curl -X POST http://localhost:8080/tools/run_recipe \
  -H "Content-Type: application/json" \
  -d '{
    "recipe": "basic-scene-setup",
    "variables": {
      "scene_name": "TestScene",
      "ground_size": 100
    }
  }'

# レシピの詳細を確認
curl http://localhost:8080/tools/get_recipe_info?recipe=basic-scene-setup

# レシピの構文を検証
curl -X POST http://localhost:8080/tools/validate_recipe \
  -H "Content-Type: application/json" \
  -d '{"recipe": "my-custom-recipe"}'
```
