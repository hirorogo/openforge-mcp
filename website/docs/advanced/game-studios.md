---
sidebar_position: 8
title: Game Studios 連携
---

# Claude Code Game Studios 連携

[Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) は、Donchitos氏が開発した、48 種類の専門 AI エージェントと 37 個のスラッシュコマンドを使って Claude Code をゲーム開発スタジオに変えるプロジェクトです (MIT License)。

OpenForge MCP と連携すると、各エージェントが Unity / Blender / Godot を**直接操作**できるようになります。レベルデザイナーが地形を配置し、アートディレクターがライティングを調整し、QA テスターがプレイテストを走らせる -- すべて AI の会話の中だけで完結します。

:::info ライセンス
Claude Code Game Studios は Donchitos 氏により MIT License で公開されています。OpenForge MCP は同プロジェクトのエージェント定義を参照して連携しますが、フォークやコピーではありません。
:::

---

## 仕組み

OpenForge MCP はゲームエンジンとの通信レイヤーを提供します。Game Studios 側はエージェントの役割分担とワークフローを定義しています。この 2 つを橋渡しするのが **GameStudiosBridge** です。

```
Game Studios エージェント
       |
  GameStudiosBridge (ロール → ツールのマッピング)
       |
  OpenForge MCP (350+ ツール)
       |
  Unity / Blender / Godot
```

各エージェントには、役割に応じた OpenForge ツールカテゴリだけが割り当てられます。例えばサウンドデザイナーにはオーディオ関連ツールだけ、レベルデザイナーにはシーン・地形・ナビメッシュ関連ツールだけが見えます。

---

## セットアップ

### 1. Game Studios リポジトリをクローン

```bash
git clone https://github.com/Donchitos/Claude-Code-Game-Studios.git
cd Claude-Code-Game-Studios
```

### 2. OpenForge MCP をインストール

```bash
npx openforge-mcp setup
```

### 3. Game Studios 連携を設定

MCP ツールを使って自動設定します:

```
「Game Studios プロジェクトを OpenForge と連携して」
```

内部では `setup_game_studios` ツールが呼ばれ、`.claude/settings.json` に OpenForge MCP サーバーの設定とエージェントごとのツール権限が書き込まれます。

手動で設定したい場合は、`.claude/settings.json` に以下を追加してください:

```json
{
  "mcpServers": {
    "openforge-mcp": {
      "command": "npx",
      "args": ["-y", "openforge-mcp", "--mode", "full"]
    }
  }
}
```

### 4. エンジンプラグインを入れる

**Unity:** パッケージをインポートして `Tools > OpenForge > Setup`

**Blender:** `Edit > Preferences > Add-ons > Install` から zip を選択して有効化

**Godot:** プラグインをインストールして有効化

---

## エージェントとツールの対応表

| エージェント | 使えるツールカテゴリ |
|------------|-------------------|
| creative-director | 全カテゴリ (読み取り用) |
| technical-director | 全カテゴリ |
| producer | Build, Playtest, Optimization |
| game-designer | Scene, GameObject, Terrain, Input, Template, Physics, NavMesh, Prefab |
| lead-programmer | 全カテゴリ |
| art-director | Material, Lighting, VFX, Camera, Playtest, Weather, Timeline |
| technical-artist | Material, Optimization, VFX, Lighting, Mesh, Bake, UV, Procedural |
| level-designer | Scene, GameObject, Terrain, Lighting, NavMesh, Prefab, Weather, Camera |
| gameplay-programmer | Physics, Input, Animation, Script, Template, GameObject, Prefab, Timeline |
| ui-programmer | UI, Script, Camera |
| ai-programmer | NavMesh, ML-Agents, Script, GameObject, Physics |
| audio-director | Audio, Script |
| sound-designer | Audio |
| narrative-director | Script, UI, Animation, Timeline |
| qa-lead | Playtest, Optimization, Build |
| qa-tester | Playtest, Camera, Optimization |
| tools-programmer | Build, Optimization, Template, Script |
| vfx-artist | VFX, Material, Lighting, Camera |
| animator | Animation, Timeline, Blender Animation/Armature/ShapeKey |
| 3d-modeler | Blender Object/Mesh/Procedural/Modifier/Collection/GameAsset |
| character-artist | Blender Mesh/Armature/WeightPaint/ShapeKey/Body/Cloth/Accessory/Avatar/VRM |
| environment-artist | Terrain, Lighting, Weather, GameObject, Scene, Prefab, Blender Object/Procedural/Material |

---

## ワークフロー

Game Studios のスラッシュコマンドから、複数エージェントが連携する定義済みワークフローを実行できます。

### Create Level

レベルデザイナー、アートディレクター、テクニカルアーティストが協力してレベルを構築します。

```yaml
steps:
  - agent: level-designer
    tools: [create_scene, create_terrain, create_gameobject, set_transform]
    prompt: "レベルのジオメトリとレイアウトを設定"
  - agent: art-director
    tools: [create_material, create_light, set_skybox]
    prompt: "ライティングとマテリアルを設定"
  - agent: technical-artist
    tools: [analyze_draw_calls, create_lod_group, optimize_textures]
    prompt: "パフォーマンスを最適化"
```

### Performance Audit

QA テスターとツールプログラマーがパフォーマンスを監査します。

```yaml
steps:
  - agent: qa-tester
    tools: [start_profiler, get_profiler_data]
    prompt: "シーンをプロファイリングしてメトリクスを収集"
  - agent: tools-programmer
    tools: [analyze_draw_calls, create_lod_group, optimize_textures, combine_meshes]
    prompt: "プロファイラーデータに基づいて最適化を適用"
  - agent: qa-tester
    tools: [enter_play_mode, take_screenshot]
    prompt: "最適化後のシーンをプレイテスト"
  - agent: qa-lead
    tools: [get_profiler_data, take_screenshot]
    prompt: "ビフォー・アフターの比較レポートを作成"
```

### Art Pass

アートディレクターと VFX アーティストがビジュアルを仕上げます。

```yaml
steps:
  - agent: art-director
    tools: [create_material, set_material_color, set_material_property]
    prompt: "マテリアルを設定・調整"
  - agent: art-director
    tools: [create_light, set_light_property, set_skybox]
    prompt: "ライティングと雰囲気を調整"
  - agent: vfx-artist
    tools: [create_particle_system, set_particle_property]
    prompt: "ビジュアルエフェクトとパーティクルを追加"
  - agent: art-director
    tools: [take_screenshot]
    prompt: "スクリーンショットで最終確認"
```

### QA Pass

QA テスターがゲームをプレイし、バグを報告します。

```yaml
steps:
  - agent: qa-tester
    tools: [enter_play_mode, simulate_input, take_screenshot]
    prompt: "ゲームをプレイテストして問題をキャプチャ"
  - agent: qa-tester
    tools: [take_screenshot, exit_play_mode]
    prompt: "スクリーンショットとコンソール出力でバグを記録"
  - agent: qa-lead
    tools: [take_screenshot]
    prompt: "スクリーンショットを比較してバグレポートをまとめる"
```

---

## MCP ツール

連携用に 4 つの MCP ツールが追加されます:

| ツール名 | 説明 |
|---------|------|
| `setup_game_studios` | Game Studios プロジェクトに OpenForge の設定ファイルを生成 |
| `get_agent_tools` | 指定エージェントが使える OpenForge ツール一覧を取得 |
| `get_studio_status` | 接続中のエンジンと利用可能なエージェントロールを表示 |
| `run_studio_workflow` | 定義済みワークフローを実行 |

---

## 使い方の例

### レベルを作る

```
「create_level ワークフローを実行して、中世の城のレベルを作って」
```

AI は自動的に level-designer → art-director → technical-artist の順でワークフローを実行します。

### エージェントのツールを確認する

```
「art-director が使えるツールを教えて」
```

### パフォーマンスを監査する

```
「performance_audit ワークフローを実行して」
```

プロファイラーデータの収集、最適化の適用、プレイテスト、レポート生成が自動で行われます。

---

## 注意事項

- これはインテグレーション(連携)です。Game Studios をフォークしたりコピーしたりするものではありません。
- エージェントのロール名は Game Studios プロジェクトで定義されているものと完全に一致している必要があります。
- OpenForge MCP サーバーが起動していて、ゲームエンジンのプラグインが接続されている状態で使ってください。
