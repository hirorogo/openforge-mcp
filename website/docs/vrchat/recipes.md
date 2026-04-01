---
sidebar_position: 10
title: "VRChat レシピ集"
description: "VRChat 制作を自動化するレシピの一覧と使い方"
---

# VRChat レシピ集

このガイドでは、VRChat 制作でよく使うワークフローをまとめた「レシピ」を紹介します。レシピは複数のツール呼び出しを 1 つの手順にまとめたもので、自然言語の一言で実行できます。

## レシピとは

レシピは、一連の操作を YAML ファイルに定義して再利用可能にする機能です。例えば「VRM を VRChat アバターにセットアップする」作業は、通常 5-8 ステップのツール呼び出しが必要ですが、レシピを使えばワンコマンドで完了します。

レシピの利点:

- **作業時間の短縮**: 複数ステップを一括実行
- **手順の標準化**: 毎回同じ品質のセットアップが可能
- **共有が容易**: YAML ファイルをチームで共有できる
- **カスタマイズ可能**: 変数を変えるだけで異なる設定に対応

## 利用可能な VRChat レシピ

### avatar-quick-setup（アバター簡易セットアップ）

VRM ファイルから VRChat アバターを一気にセットアップするレシピです。

**実行する処理:**

1. VRM ファイルを Unity にインポート
2. `setup_vrc_avatar` で VRChat アバター設定
3. `set_viewpoint` でビューポイントを自動設定
4. `setup_hair_physbone` で髪の PhysBone を設定
5. `create_expression_preset` で基本 8 表情を作成
6. `add_gesture_expression` でジェスチャーマッピング
7. `check_avatar_rank` でパフォーマンスランク確認
8. `validate_for_upload` でアップロード前検証

**実行方法:**

**あなた:**
> アバター簡易セットアップのレシピを実行して。VRM ファイルは「my_avatar.vrm」で

**AI の動き:** 上記の 8 ステップが順番に実行され、結果がまとめて報告されます。

**AI の返答例:**

```
アバター簡易セットアップ完了:

  1. VRM インポート: OK (my_avatar.vrm → Assets/Avatars/my_avatar/)
  2. アバター設定: OK (VRC_AvatarDescriptor 設定済み)
  3. ビューポイント: OK (自動検出で配置)
  4. PhysBone: OK (髪ボーン 24 本に設定)
  5. 表情: OK (8 表情プリセット作成)
  6. ジェスチャー: OK (7 ジェスチャーに表情割り当て)
  7. ランク: Medium (マテリアル数 4、ボーン数 138)
  8. 検証: OK (アップロード可能)

所要時間: 約 45 秒
```

### world-basic-setup（ワールド基本セットアップ）

VRChat ワールドの基本構成を一括でセットアップするレシピです。

**実行する処理:**

1. `setup_vrc_world` でワールド記述子の設定
2. 床オブジェクトの作成とコライダー設定
3. `add_spawn_point` でスポーンポイントの配置
4. `create_light` でディレクショナルライトの配置
5. ポイントライトの追加
6. `add_vrc_mirror` でミラーの配置
7. `validate_for_upload` で検証

**実行方法:**

**あなた:**
> ワールド基本セットアップのレシピを実行して

**AI の動き:** 基本的なワールド構成が自動的にセットアップされます。

**AI の返答例:**

```
ワールド基本セットアップ完了:

  1. ワールド記述子: OK (VRC_SceneDescriptor 設定済み)
  2. 床: OK (50m x 50m、コライダー付き)
  3. スポーンポイント: OK (原点付近に配置)
  4. ディレクショナルライト: OK (角度 50 度、白色光)
  5. ポイントライト: OK (スポーンポイント上方に配置)
  6. ミラー: OK (2m x 2.5m)
  7. 検証: OK (アップロード可能)

この状態からオブジェクトや装飾を追加してワールドを作り込んでください。
```

### outfit-change（衣装着せ替え）

Modular Avatar を使った衣装着せ替えを自動化するレシピです。

**実行する処理:**

1. 衣装 Prefab をアバターの子として配置
2. `auto_setup_outfit` で自動セットアップ
3. `add_ma_toggle` で Expression Menu にトグルを追加
4. `add_ma_blendshape_sync` で体型 BlendShape を同期
5. `validate_for_upload` で検証

**実行方法:**

**あなた:**
> 衣装着せ替えレシピを実行して。衣装は「SummerDress」で、トグル名は「夏服」にして

**AI の動き:** 衣装のセットアップとメニュー登録が自動実行されます。

**AI の返答例:**

```
衣装着せ替えセットアップ完了:

  1. 配置: OK (SummerDress をアバターの子に配置)
  2. 自動セットアップ: OK (MA Merge Armature、体メッシュ非表示設定)
  3. トグル: OK (Expression Menu に「夏服」を追加)
  4. BlendShape 同期: OK (体型シェイプキー 3 個を同期)
  5. 検証: OK

Expression Menu からの切り替えを確認してください。
```

### avatar-optimize（アバター最適化）

アバターのパフォーマンスランクを改善するレシピです。

**実行する処理:**

1. `check_avatar_rank` で現在のランクを確認
2. `suggest_optimizations` で最適化の提案を取得
3. `auto_optimize_avatar` で自動最適化を実行
4. `check_avatar_rank` で最適化後のランクを確認
5. `compare_before_after` で前後比較を表示

**実行方法:**

**あなた:**
> アバター最適化レシピを実行して。Good ランクを目指して

**AI の動き:** 現在のランクの確認から最適化実行、結果の比較まで自動実行されます。

**AI の返答例:**

```
アバター最適化完了:

  1. 最適化前ランク: Poor
     - マテリアル数: 6 (Poor)
     - メッシュ数: 5 (Medium)
     - ボーン数: 142 (Medium)

  2. 最適化提案: マテリアル結合、メッシュ結合、ボーン削減

  3. 自動最適化実行:
     - テクスチャアトラス作成 → マテリアル 6 → 1
     - メッシュ結合 → 5 → 1
     - 未使用ボーン削除 → 142 → 128

  4. 最適化後ランク: Good

  5. 比較:
     マテリアル: 6 → 1 (Poor → Excellent)
     メッシュ: 5 → 1 (Medium → Excellent)
     ボーン: 142 → 128 (Medium → Good)
     総合: Poor → Good
```

### expression-setup（表情セットアップ）

FaceEmo を使った表情設定を自動化するレシピです。

**実行する処理:**

1. `auto_detect_blendshapes` で利用可能な BlendShape を検出
2. `create_expression_preset` で基本 8 表情を作成
3. `add_gesture_expression` でジェスチャーマッピング
4. Expression Menu に表情サブメニューを追加

**実行方法:**

**あなた:**
> 表情セットアップのレシピを実行して

**AI の動き:** BlendShape の検出から表情作成、メニュー設定まで自動実行されます。

**AI の返答例:**

```
表情セットアップ完了:

  1. BlendShape 検出: 42 個 (口: 19、目: 8、眉: 6、その他: 9)
  2. 表情プリセット: 8 表情作成済み
     - Smile, Angry, Sad, Surprised, Shy, Wink, Jitome, Tongue
  3. ジェスチャーマッピング:
     - Fist → Angry
     - Victory → Smile
     - HandOpen → Surprised
     - FingerPoint → Wink
     - RockNRoll → Tongue
     - ThumbsUp → Shy
  4. Expression Menu: 「表情」サブメニューに 8 項目追加
```

## レシピの実行方法

### 自然言語で実行

最も簡単な方法は、自然言語で指示することです。

```
「アバター簡易セットアップのレシピを実行して」
「ワールド基本セットアップレシピで始めて」
「表情セットアップのレシピを my_avatar に対して実行して」
```

AI が `run_recipe` ツールを呼び出してレシピを実行します。

### コマンドラインで実行

```bash
# レシピの一覧を表示
uvx openforge-mcp --list-recipes

# レシピを実行
uvx openforge-mcp --run-recipe avatar-quick-setup \
  --var vrm_file="my_avatar.vrm"

# 変数を指定して実行
uvx openforge-mcp --run-recipe world-basic-setup \
  --var floor_size=100 \
  --var spawn_count=4
```

### 利用可能なレシピの確認

**あなた:**
> 利用可能な VRChat レシピを一覧表示して

**AI の返答例:**

```
VRChat レシピ一覧:
  1. avatar-quick-setup    - VRM → VRChat アバター一括セットアップ
  2. world-basic-setup     - ワールドの基本構成セットアップ
  3. outfit-change         - Modular Avatar 衣装着せ替え
  4. avatar-optimize       - パフォーマンスランク最適化
  5. expression-setup      - FaceEmo 表情セットアップ
```

## 自作レシピの作り方

独自のワークフローをレシピとして定義できます。

### レシピファイルの作成

レシピは YAML 形式で記述します。以下は、アバターに特定の PhysBone 設定を適用するカスタムレシピの例です。

```yaml
name: my-physbone-setup
description: 自分好みの PhysBone 設定をアバターに適用する
version: "1.0"
author: your-name

variables:
  hair_spring: 0.25
  hair_stiffness: 0.3
  skirt_spring: 0.4
  skirt_stiffness: 0.2

steps:
  - name: 髪の PhysBone を設定
    tool: setup_hair_physbone
    params:
      preset: "long"
      spring: "{{ hair_spring }}"
      stiffness: "{{ hair_stiffness }}"

  - name: スカートの PhysBone を設定
    tool: setup_skirt_physbone
    params:
      spring: "{{ skirt_spring }}"
      stiffness: "{{ skirt_stiffness }}"

  - name: 脚のコライダーを追加
    tool: add_physbone_collider
    params:
      target: "LeftUpperLeg"
      type: "Capsule"
      radius: 0.04

  - name: 脚のコライダーを追加（右）
    tool: add_physbone_collider
    params:
      target: "RightUpperLeg"
      type: "Capsule"
      radius: 0.04

  - name: 確認スクリーンショット
    tool: take_screenshot
    params:
      width: 1920
      height: 1080
```

### レシピファイルの配置

| 場所 | 用途 |
|---|---|
| `./recipes/` | プロジェクトローカル（そのプロジェクト専用） |
| `~/.openforge/recipes/` | ユーザー共通（すべてのプロジェクトで利用可能） |

**あなた:**
> このレシピをプロジェクトに保存して

**AI の動き:** YAML ファイルが `./recipes/my-physbone-setup.yaml` として保存されます。

### レシピの変数

レシピの変数は、実行時に上書きできます。

**あなた:**
> my-physbone-setup レシピを実行して。髪のバネを 0.5 にして

**AI の動き:** `hair_spring` 変数が 0.5 に上書きされた状態でレシピが実行されます。

### 条件付きステップ

前のステップの結果に応じて処理を分岐させることもできます。

```yaml
steps:
  - name: パフォーマンスランクを確認
    tool: check_avatar_rank
    params: {}

  - name: 最適化が必要なら実行
    tool: auto_optimize_avatar
    params:
      target_rank: "Good"
    condition: "{{ previous.rank != 'Good' and previous.rank != 'Excellent' }}"

  - name: 結果を表示
    tool: compare_before_after
    params: {}
    condition: "{{ previous.optimized == true }}"
```

### エラーハンドリング

ステップが失敗したときの動作を指定できます。

```yaml
steps:
  - name: BlendShape 検出
    tool: auto_detect_blendshapes
    params: {}
    on_error: stop  # エラー時にレシピを停止（既定）

  - name: 表情プリセット作成
    tool: create_expression_preset
    params: {}
    on_error: continue  # エラーがあっても次のステップへ進む
```

## レシピの活用例

### チームでの標準化

プロジェクトの `recipes/` ディレクトリにレシピを配置して、チーム全員が同じセットアップ手順を使えるようにします。

```
my-vrchat-project/
  recipes/
    team-avatar-setup.yaml
    team-world-setup.yaml
    team-optimization.yaml
  Assets/
  ...
```

### 繰り返し作業の自動化

複数のアバターに同じ設定を適用する場合に便利です。

**あなた:**
> my-physbone-setup レシピを、シーン内のすべてのアバターに実行して

**AI の動き:** シーン内の VRC_AvatarDescriptor を持つすべてのオブジェクトに対してレシピが実行されます。

## 次のステップ

レシピを活用して効率的に VRChat コンテンツを制作しましょう。

- [VRChat モード概要](./overview.md) -- 利用可能なツールの全体像
- [アバターセットアップ](./avatar-setup.md) -- アバター設定の詳細
- [ワールド制作](./world-creation.md) -- ワールド制作の詳細
