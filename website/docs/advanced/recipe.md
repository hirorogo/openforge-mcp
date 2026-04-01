---
sidebar_position: 4
title: レシピ機能
---

# レシピ機能

レシピは、一連のツール呼び出しを YAML ファイルに定義して再利用可能にする機能です。よく行う作業手順をレシピとして保存し、ワンコマンドで実行できます。

## レシピとは

レシピは以下のような場面で役立ちます。

- **プロジェクトの初期セットアップ**: シーン作成、照明配置、カメラ設定などを一括実行
- **繰り返し作業の自動化**: 同じ構成のオブジェクトを毎回作成する場合
- **チームでの共有**: 環境構築手順をファイルとして共有
- **テンプレート**: VRChat ワールドの基本構成など、定型パターンの再利用

## YAML フォーマット

レシピファイルは YAML 形式で記述します。

```yaml
name: basic-scene-setup
description: 基本的なシーンセットアップ
version: "1.0"
author: your-name

# 変数定義（オプション）
variables:
  scene_name: "MyScene"
  ground_size: 50
  light_intensity: 1.2

# ステップ定義
steps:
  - name: シーンを作成
    tool: create_scene
    params:
      name: "{{ scene_name }}"

  - name: 地面を作成
    tool: create_gameobject
    params:
      name: "Ground"
      type: "Plane"
      position: { x: 0, y: 0, z: 0 }
      scale: { x: "{{ ground_size }}", y: 1, z: "{{ ground_size }}" }

  - name: メインライトを配置
    tool: create_light
    params:
      name: "MainLight"
      type: "Directional"
      intensity: "{{ light_intensity }}"
      rotation: { x: 50, y: -30, z: 0 }

  - name: カメラを配置
    tool: set_camera
    params:
      position: { x: 0, y: 5, z: -10 }
      rotation: { x: 30, y: 0, z: 0 }

  - name: スクリーンショットを保存
    tool: take_screenshot
    params:
      width: 1920
      height: 1080
```

### フォーマットの詳細

| フィールド | 必須 | 説明 |
|---|---|---|
| `name` | はい | レシピの識別名（英数字とハイフン） |
| `description` | はい | レシピの説明 |
| `version` | いいえ | バージョン番号 |
| `author` | いいえ | 作成者名 |
| `variables` | いいえ | ステップ内で使用する変数の定義 |
| `steps` | はい | 実行するツール呼び出しの配列 |

### ステップの構造

| フィールド | 必須 | 説明 |
|---|---|---|
| `name` | はい | ステップの表示名 |
| `tool` | はい | 呼び出すツール名 |
| `params` | いいえ | ツールに渡すパラメータ |
| `condition` | いいえ | 実行条件（前のステップの結果を参照可能） |
| `on_error` | いいえ | エラー時の動作（`stop` または `continue`、既定は `stop`） |

### 変数の使用

変数は `{{ 変数名 }}` の形式でパラメータ内に埋め込めます。

```yaml
variables:
  color_r: 0.8
  color_g: 0.2
  color_b: 0.1

steps:
  - name: マテリアルを作成
    tool: create_material
    params:
      name: "CustomMaterial"
      color:
        r: "{{ color_r }}"
        g: "{{ color_g }}"
        b: "{{ color_b }}"
        a: 1
```

## レシピの実行例

### VRChat ワールドの基本構成

```yaml
name: vrchat-world-base
description: VRChat ワールドの基本構成をセットアップ
version: "1.0"

steps:
  - name: 床を作成
    tool: create_gameobject
    params:
      name: "Floor"
      type: "Plane"
      position: { x: 0, y: 0, z: 0 }
      scale: { x: 10, y: 1, z: 10 }

  - name: 床のマテリアルを設定
    tool: create_material
    params:
      name: "FloorMaterial"
      color: { r: 0.9, g: 0.9, b: 0.9, a: 1 }

  - name: マテリアルを適用
    tool: set_material
    params:
      target: "Floor"
      material: "FloorMaterial"

  - name: スポーンポイントを作成
    tool: create_gameobject
    params:
      name: "SpawnPoint"
      type: "Empty"
      position: { x: 0, y: 0.5, z: 0 }

  - name: ディレクショナルライト
    tool: create_light
    params:
      name: "Sun"
      type: "Directional"
      intensity: 1.0
      rotation: { x: 50, y: -30, z: 0 }

  - name: ポイントライトを追加
    tool: create_light
    params:
      name: "FillLight"
      type: "Point"
      intensity: 0.5
      position: { x: 3, y: 3, z: 0 }

  - name: 完成状態をスクリーンショット
    tool: take_screenshot
    params:
      width: 1920
      height: 1080
```

## レシピの実行方法

### AI クライアントから実行

AI クライアントに対して自然言語で指示します。

```
「vrchat-world-base レシピを実行して」
```

AI が `run_recipe` ツールを呼び出してレシピを実行します。

### コマンドラインから実行

```bash
# レシピファイルを指定して実行
uvx openforge-mcp --run-recipe ./recipes/vrchat-world-base.yaml

# 変数を上書きして実行
uvx openforge-mcp --run-recipe ./recipes/basic-scene-setup.yaml \
  --var scene_name="TestScene" \
  --var ground_size=100
```

### HTTP API から実行

```bash
curl -X POST http://localhost:8080/tools/run_recipe \
  -H "Content-Type: application/json" \
  -d '{
    "recipe": "vrchat-world-base",
    "variables": {
      "scene_name": "MyWorld"
    }
  }'
```

### 利用可能なレシピの一覧

```bash
# AI クライアントから
「利用可能なレシピを一覧表示して」

# HTTP API から
curl http://localhost:8080/tools/list_recipes
```

## レシピの保存場所

レシピファイルは以下の場所に配置します。

| 場所 | 用途 |
|---|---|
| `./recipes/` | プロジェクトローカルのレシピ |
| `~/.openforge/recipes/` | ユーザー共通のレシピ |

プロジェクトローカルのレシピが優先されます。同名のレシピがある場合、プロジェクト側が使用されます。

## レシピの共有

### Git リポジトリで共有

レシピファイルをプロジェクトの `recipes/` ディレクトリに含めて、Git リポジトリで管理します。

```
my-project/
  recipes/
    basic-scene-setup.yaml
    vrchat-world-base.yaml
  Assets/
  ...
```

### コミュニティレシピ

OpenForge MCP の GitHub リポジトリでは、コミュニティが作成したレシピを公開しています。

```bash
# コミュニティレシピをダウンロード
curl -o recipes/fps-level-base.yaml \
  https://raw.githubusercontent.com/hirorogo/openforge-mcp/main/recipes/fps-level-base.yaml
```

自作のレシピを共有する場合は、GitHub リポジトリにプルリクエストを送ってください。
