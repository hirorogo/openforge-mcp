---
sidebar_position: 6
title: "Game Studios でチーム開発"
description: "Claude Code Game Studios と OpenForge MCP を連携させ、複数の専門エージェントでゲーム開発を行う"
---

# Game Studios でチーム開発

Claude Code Game Studios は、48 種類の専門 AI エージェントと 37 個のスラッシュコマンドでゲーム開発を効率化するプロジェクトだ。OpenForge MCP と連携すると、各エージェントが Unity / Blender / Godot を直接操作してレベル構築、アート調整、QA テストなどを実行できる。

このチュートリアルでは、セットアップから実際のワークフロー実行、カスタマイズまで解説する。

## 前提

- OpenForge MCP がインストール済みで、ゲームエンジンと接続済み
- Game Studios の基本概念を理解している（[Game Studios 連携](/docs/advanced/game-studios) 参照）

## Game Studios とは

Game Studios は、ゲーム開発の各職種を AI エージェントとして定義している。各エージェントには専門分野に応じたツールの使用権限が割り当てられている。

```
creative-director ─── 全体のビジョンと品質を監督
technical-director ── 技術的な意思決定
level-designer ────── シーン・地形・ナビメッシュ
art-director ─────── ライティング・マテリアル・VFX
technical-artist ──── 最適化・シェーダー
gameplay-programmer ─ 物理・入力・アニメーション・スクリプト
ai-programmer ────── NavMesh・ML-Agents
qa-tester ─────────── プレイテスト・プロファイリング
qa-lead ──────────── バグレポート・品質管理
3d-modeler ────────── Blender モデリング
animator ──────────── アニメーション・タイムライン
sound-designer ────── オーディオ
...
```

## ステップ 1: セットアップ

### Game Studios リポジトリをクローン

```bash
git clone https://github.com/Donchitos/Claude-Code-Game-Studios.git
cd Claude-Code-Game-Studios
```

### OpenForge MCP との連携を設定

**あなた:**
> Game Studios プロジェクトを OpenForge と連携して。

**AI の応答例:**
```
setup_game_studios を実行しました。

設定ファイルを生成:
  .claude/settings.json
    - OpenForge MCP サーバー設定を追加
    - 22 エージェントロールのツール権限を設定

接続状況:
  Unity: 接続済み (OpenForge MCP v0.8.0)
  Blender: 接続済み (OpenForge MCP v0.8.0)
  Godot: 未接続

利用可能なエージェント: 22
利用可能なワークフロー: 8
```

### エージェントのツール権限を確認

**あなた:**
> level-designer が使えるツールを教えて。

**AI の応答例:**
```
level-designer のツール権限:

カテゴリ: Scene, GameObject, Terrain, Lighting, NavMesh, Prefab, Weather, Camera

主要ツール (42 個):
  Scene: create_scene, save_scene, load_scene
  GameObject: create_gameobject, set_transform, duplicate_gameobject, delete_gameobject, ...
  Terrain: create_terrain, set_terrain_height, paint_terrain, set_terrain_trees, ...
  Lighting: create_light, set_light_property (配置のみ、調整は art-director)
  NavMesh: bake_navmesh, set_navmesh_area, create_navmesh_obstacle, ...
  Prefab: instantiate_prefab, create_prefab
  Weather: set_fog, set_skybox
  Camera: set_camera, take_screenshot
```

## ステップ 2: "Create Level" ワークフローを実行する

定義済みワークフローは、複数のエージェントが順番に作業を進める。

**あなた:**
> create_level ワークフローを実行して。「中世の城の中庭」を作って。広さは 50m x 50m。石畳の床、中央に噴水、四隅に松明。

**AI の応答例:**
```
create_level ワークフローを開始します。

=== ステップ 1/3: level-designer ===
使用ツール: create_scene, create_terrain, create_gameobject, set_transform

実行中...
  - シーン "CastleCourtyard" を作成
  - 地面 (50m x 50m) を配置
  - 噴水ベース (中央) を配置 -- Cylinder + Torus で構成
  - 松明スタンド x4 を四隅に配置
  - 城壁 (外周) を Cube で構築
  - ゲート (正面) を配置
  - ベンチ x4 を通路沿いに配置
  - NavMesh をベイク

level-designer 完了。オブジェクト数: 28

=== ステップ 2/3: art-director ===
使用ツール: create_material, create_light, set_skybox

実行中...
  - M_Cobblestone (石畳マテリアル) を作成、床に適用
  - M_CastleWall (城壁マテリアル) を作成、壁に適用
  - M_Water (水面マテリアル) を噴水に適用
  - ディレクショナルライト (夕焼け色) を設定
  - ポイントライト x4 を松明位置に配置 (暖色、Flicker スクリプト付き)
  - Skybox を曇り空に設定
  - スクリーンショット撮影

art-director 完了。マテリアル: 5、ライト: 5

=== ステップ 3/3: technical-artist ===
使用ツール: analyze_draw_calls, create_lod_group, optimize_textures

実行中...
  - ドローコール分析: 34 (良好)
  - 城壁メッシュを結合 (12 → 1 ドローコール)
  - テクスチャ圧縮を適用
  - 最終ドローコール: 23

technical-artist 完了。

=== ワークフロー完了 ===
シーン: CastleCourtyard
オブジェクト数: 28
ドローコール: 23
スクリーンショットを保存しました。
```

## ステップ 3: "QA Pass" ワークフローを実行する

構築したレベルの品質を自動チェックする。

**あなた:**
> QA Pass ワークフローを実行して。CastleCourtyard シーンをチェックして。

**AI の応答例:**
```
qa_pass ワークフローを開始します。

=== ステップ 1/3: qa-tester (プレイテスト) ===
使用ツール: enter_play_mode, simulate_input, take_screenshot

実行中...
  - プレイモードを開始
  - プレイヤーをスポーンポイントに配置
  - 自動移動テスト: 噴水周辺を一周
  - コリジョンテスト: 壁との衝突判定
  - NavMesh テスト: 全エリアへの到達可能性
  スクリーンショット: 8 枚撮影

qa-tester (プレイテスト) 完了。

=== ステップ 2/3: qa-tester (バグ記録) ===
使用ツール: take_screenshot, exit_play_mode

発見した問題:
  [BUG-001] 重大度: 中
    噴水の南側に NavMesh の穴がある。NPC が通過できない。
    スクリーンショット: qa_bug001.png

  [BUG-002] 重大度: 低
    ベンチ 3 番の BoxCollider がメッシュより大きい。
    プレイヤーが見えない壁に当たる。

  [BUG-003] 重大度: 情報
    松明 2 番のライトが壁を貫通している。Range を調整すべき。

qa-tester (バグ記録) 完了。バグ: 3 件

=== ステップ 3/3: qa-lead (レポート) ===
使用ツール: take_screenshot

QA レポート:
  テスト項目: 12
  合格: 9
  不合格: 2
  情報: 1

  推奨アクション:
    1. NavMesh を再ベイク (BUG-001 修正)
    2. ベンチ 3 番の BoxCollider サイズを調整 (BUG-002 修正)
    3. 松明 2 番の Light Range を 8 → 5 に変更 (BUG-003 対応)

qa-lead 完了。

=== ワークフロー完了 ===
```

**あなた:**
> QA レポートのバグを全部修正して。

**AI の応答例:**
```
バグ修正を実行します。

[BUG-001] NavMesh の穴を修正
  - 噴水南側の地面メッシュにギャップがあった
  - ギャップを埋めて NavMesh を再ベイク
  - 確認: NPC のパス検索が全ポイントで成功

[BUG-002] BoxCollider サイズ調整
  - Bench_3 の BoxCollider: (2.5, 1.0, 1.0) → (1.8, 0.8, 0.6)
  - Auto-fit を適用

[BUG-003] ライト Range 調整
  - TorchLight_2: Range 8 → 5
  - 壁への貫通が解消

全 3 件の修正が完了しました。
```

## ステップ 4: ワークフローのカスタマイズ

定義済みワークフローを改変して、プロジェクト固有のフローを作れる。

### ワークフロー定義ファイル

ワークフローは YAML で定義される。以下は独自の "create_dungeon" ワークフローの例。

```yaml
name: create_dungeon
description: ダンジョンを自動生成する
version: "1.0"

steps:
  - agent: level-designer
    tools:
      - create_scene
      - create_gameobject
      - set_transform
      - duplicate_gameobject
    prompt: |
      ダンジョンの基本構造を構築する。
      - 部屋を 5-8 個生成 (サイズはランダム: 5-15m)
      - 廊下で部屋を接続
      - 入口と出口を配置
      - 各部屋に PropSpawnPoint (Empty) を配置

  - agent: art-director
    tools:
      - create_material
      - set_material
      - set_material_property
      - create_light
      - set_light_property
    prompt: |
      ダンジョンのビジュアルを設定する。
      - 石壁マテリアルを作成して壁に適用
      - 床にひび割れた石材マテリアル
      - 各部屋にポイントライト (暗めの暖色)
      - 廊下には松明ライト (フリッカー付き)
      - 全体的に暗い雰囲気

  - agent: ai-programmer
    tools:
      - bake_navmesh
      - set_navmesh_area
      - create_navmesh_obstacle
    prompt: |
      NPC 用の NavMesh を設定する。
      - 廊下と部屋のすべてが NavMesh でつながっていること
      - ドアの位置に NavMesh Obstacle (開閉用) を配置
      - 狭い通路の NavMesh Area を "Narrow" に設定

  - agent: gameplay-programmer
    tools:
      - create_script
      - add_component
      - set_component_property
    prompt: |
      ダンジョンのゲームプレイロジックを作成する。
      - DungeonManager スクリプト: 部屋のクリア状態管理
      - DoorController スクリプト: 近づくとドアが開く
      - TrapTrigger スクリプト: トラップの発動ロジック
      - PropSpawnPoint にスクリプトを適用

  - agent: qa-tester
    tools:
      - enter_play_mode
      - simulate_input
      - take_screenshot
      - exit_play_mode
    prompt: |
      ダンジョンのプレイテスト。
      - 入口から出口まで到達可能か
      - 全ての部屋に入れるか
      - ドアが正しく開閉するか
      - ライティングが暗すぎないか (スクリーンショットで確認)

  - agent: technical-artist
    tools:
      - analyze_draw_calls
      - optimize_textures
      - create_lod_group
      - combine_meshes
    prompt: |
      パフォーマンス最適化。
      - ドローコールを 200 以下に
      - 静的メッシュの結合
      - テクスチャ圧縮
```

### ワークフローの実行

**あなた:**
> create_dungeon ワークフローを実行して。テーマは「地下墓地」で。

**AI の応答例:**
```
create_dungeon ワークフローを開始します。テーマ: 地下墓地

=== ステップ 1/6: level-designer ===
  - シーン "Catacomb_01" を作成
  - 部屋 6 個を生成 (6m-12m)
  - 廊下 8 本で接続
  - 入口: 北端 / 出口: 南端の最深部
  - PropSpawnPoint: 18 個配置
  オブジェクト数: 94

=== ステップ 2/6: art-director ===
  - M_CatacombWall: 暗い灰色の石壁、ノーマルマップ付き
  - M_CatacombFloor: ひび割れた石材
  - M_Bones: 骨のマテリアル (PropSpawnPoint 用)
  - ポイントライト: 各部屋に 1-2 個 (薄緑の不気味な光)
  - 廊下: 松明ライト (暖色、フリッカー)
  マテリアル: 4、ライト: 14

=== ステップ 3/6: ai-programmer ===
  - NavMesh ベイク完了
  - NavMesh Obstacle: ドア x 8
  - 狭い廊下 3 本を "Narrow" エリアに設定
  - パステスト: 入口→出口 到達可能

=== ステップ 4/6: gameplay-programmer ===
  - DungeonManager.cs 作成
  - DoorController.cs 作成 (近接トリガー)
  - TrapTrigger.cs 作成 (床トラップ)
  - スクリプトを 18 の PropSpawnPoint に適用

=== ステップ 5/6: qa-tester ===
  - プレイテスト実行 (30 秒)
  - 入口→出口: 到達可能
  - 全 6 部屋: アクセス可能
  - ドア: 8/8 正常動作
  - バグ: 1 件 (部屋 4 のトラップが発動しない -- TriggerCollider の isTrigger が false)
  スクリーンショット: 12 枚

=== ステップ 6/6: technical-artist ===
  - ドローコール: 156 (目標 200 以下: 達成)
  - 壁メッシュを部屋ごとに結合 (48 → 6)
  - テクスチャ圧縮適用

=== ワークフロー完了 ===
バグ 1 件を自動修正: 部屋 4 の TrapTrigger に isTrigger = true を設定
```

## ステップ 5: カスタムエージェント定義を追加する

プロジェクト固有の専門エージェントを追加できる。

### エージェント定義ファイル

```yaml
# agents/vr-specialist.yaml
name: vr-specialist
description: VR 体験の専門家。インタラクション設計と快適性を担当
tools:
  - category: Input
  - category: Physics
  - category: Camera
  - category: UI
  - category: Script
  - tool: take_screenshot
  - tool: enter_play_mode
  - tool: exit_play_mode

prompts:
  default: |
    VR 体験の品質を最適化する。以下を重視:
    - ハンドトラッキングのインタラクション設計
    - モーションシックネスの回避 (視野角の制限、テレポート移動)
    - UI の配置 (ワールド空間 UI、視線追従)
    - パフォーマンス (90 FPS 以上を維持)
```

### エージェントの登録

**あなた:**
> vr-specialist エージェントを登録して。

**AI の応答例:**
```
エージェント "vr-specialist" を登録しました。

使用可能ツール: 38 個
  Input: 8 ツール
  Physics: 12 ツール
  Camera: 4 ツール
  UI: 6 ツール
  Script: 5 ツール
  個別: take_screenshot, enter_play_mode, exit_play_mode

ワークフローで使用する場合:
  steps:
    - agent: vr-specialist
      prompt: "VR インタラクションを設計して"
```

### ワークフローにカスタムエージェントを組み込む

```yaml
name: create_vr_level
description: VR 対応レベルを構築する
version: "1.0"

steps:
  - agent: level-designer
    prompt: "レベルジオメトリを構築"

  - agent: art-director
    prompt: "ビジュアルを設定"

  - agent: vr-specialist
    tools:
      - create_script
      - add_component
      - set_component_property
      - enter_play_mode
      - take_screenshot
    prompt: |
      VR インタラクションを設定する。
      - グラブ可能なオブジェクトに XR Grab Interactable を追加
      - テレポートエリアを定義
      - UI をワールド空間に配置 (プレイヤーの正面 1.5m)
      - プレイテストで 90 FPS 以上を確認

  - agent: qa-tester
    prompt: "プレイテストとバグ記録"
```

## エージェントロールとツール権限の一覧

よく使うエージェントと権限の対応。

| エージェント | ツールカテゴリ | 主な用途 |
|------------|-------------|---------|
| level-designer | Scene, GameObject, Terrain, NavMesh, Prefab | レベルレイアウト |
| art-director | Material, Lighting, VFX, Camera | ビジュアル品質 |
| technical-artist | Material, Optimization, Mesh, Bake, UV | シェーダー、最適化 |
| gameplay-programmer | Physics, Input, Animation, Script | ゲームロジック |
| ai-programmer | NavMesh, ML-Agents, Script | NPC AI |
| qa-tester | Playtest, Camera, Optimization | テスト実行 |
| qa-lead | Playtest, Camera | レポート作成 |
| 3d-modeler | Blender Object/Mesh/Procedural/Modifier | モデリング |
| animator | Animation, Timeline, Blender Animation | アニメーション |
| sound-designer | Audio | サウンド |

ワークフロー設計のコツ: エージェントの担当範囲が重ならないように設計する。同じオブジェクトを複数のエージェントが操作する場合は、ステップの順序で競合を防ぐ。
