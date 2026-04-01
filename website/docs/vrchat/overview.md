---
sidebar_position: 1
title: "VRChat モード概要"
description: "OpenForge MCP の VRChat モードの全体像、セットアップ方法、含まれるツール一覧"
---

# VRChat モード概要

OpenForge MCP の VRChat モードは、VRChat のワールド制作とアバター編集に特化したツールセットを提供する専用モードです。通常の Unity 汎用ツールに加えて、VRChat SDK、Modular Avatar、FaceEmo、PhysBone といった VRChat 固有の機能を自然言語で操作できるようになります。

## なぜ VRChat モードが必要か

VRChat のコンテンツ制作には、Unity の基本操作だけでなく VRChat SDK の独自コンポーネントや、Modular Avatar などのコミュニティツールの知識が必要です。Full モードではすべてのツールが公開されるため、VRChat に関係のないツール（Godot 関連、Blender 専用機能など）がコンテキストを圧迫してしまいます。

VRChat モードでは、VRChat 制作に必要なツールだけを厳選して公開することで、AI の判断精度を高め、トークン消費を抑えます。

## セットアップ

VRChat モードのセットアップは 1 コマンドで完了します。

```bash
npx openforge-mcp setup --mode vrchat
```

このコマンドは以下を実行します。

1. OpenForge MCP の設定ファイルにモード情報を書き込む
2. VRChat 関連ツールのみを公開するように構成する
3. AI クライアントの設定ファイル（`claude_desktop_config.json` など）を更新する

:::info 既存プロジェクトへの適用
既に OpenForge MCP を使用しているプロジェクトでも、上記コマンドを再実行することでモードを切り替えられます。既存の設定はバックアップされます。
:::

## 含まれるツール一覧

VRChat モードで利用できるツールをカテゴリ別に示します。

### シーン・オブジェクト操作

| ツール名 | 説明 |
|---|---|
| `create_gameobject` | GameObject の作成 |
| `set_transform` | 位置・回転・スケールの設定 |
| `set_material` | マテリアルの設定 |
| `create_material` | マテリアルの作成 |
| `take_screenshot` | スクリーンショットの撮影 |
| `create_light` | ライトの配置 |
| `set_skybox` | スカイボックスの設定 |

### VRChat ワールド

| ツール名 | 説明 |
|---|---|
| `setup_vrc_world` | VRC Scene Descriptor の設定 |
| `add_spawn_point` | スポーンポイントの追加 |
| `add_vrc_mirror` | ミラーの配置 |
| `add_vrc_chair` | 椅子（座れるオブジェクト）の追加 |
| `add_vrc_pickup` | 持てるオブジェクトの追加 |
| `add_vrc_video_player` | ビデオプレイヤーの配置 |
| `add_vrc_portal` | ポータルの作成 |
| `validate_for_upload` | アップロード前の検証 |

### VRChat アバター

| ツール名 | 説明 |
|---|---|
| `setup_vrc_avatar` | VRC Avatar Descriptor の設定 |
| `set_viewpoint` | ビューポイントの設定 |
| `check_avatar_rank` | パフォーマンスランクの確認 |
| `suggest_optimizations` | 最適化の提案 |
| `auto_optimize_avatar` | 自動最適化 |
| `compare_before_after` | 最適化前後の比較 |

### Modular Avatar（衣装着せ替え）

| ツール名 | 説明 |
|---|---|
| `auto_setup_outfit` | 衣装の自動セットアップ |
| `add_ma_merge_armature` | MA Merge Armature の追加 |
| `add_ma_bone_proxy` | MA Bone Proxy の追加 |
| `add_ma_toggle` | ON/OFF トグルの設定 |
| `add_ma_blendshape_sync` | BlendShape の同期設定 |

### FaceEmo（表情）

| ツール名 | 説明 |
|---|---|
| `auto_detect_blendshapes` | BlendShape の自動検出 |
| `create_expression_preset` | 表情プリセットの作成 |
| `add_expression` | カスタム表情の追加 |
| `add_gesture_expression` | ジェスチャーへの表情割り当て |

### PhysBone（揺れ骨）

| ツール名 | 説明 |
|---|---|
| `setup_hair_physbone` | 髪の PhysBone 設定 |
| `setup_skirt_physbone` | スカートの PhysBone 設定 |
| `setup_tail_physbone` | しっぽの PhysBone 設定 |
| `setup_accessory_physbone` | アクセサリーの PhysBone 設定 |
| `configure_physbone` | PhysBone パラメータの個別設定 |
| `add_physbone_collider` | PhysBone コライダーの追加 |

### テクスチャ編集

| ツール名 | 説明 |
|---|---|
| `adjust_hsv` | 色相・彩度・明度の調整 |
| `apply_gradient` | グラデーションの適用 |
| `generate_pattern` | パターンの生成 |
| `overlay_decal` | デカールの合成 |
| `swap_color` | 色の置換 |
| `batch_recolor` | 一括カラー変更 |
| `export_texture` | テクスチャの書き出し |

## Full モードとの違い

| 項目 | Full モード | VRChat モード |
|---|---|---|
| 公開ツール数 | 100 以上 | 約 50 |
| Blender ツール | すべて | クロスアプリ連携のみ |
| Godot ツール | すべて | なし |
| VRChat 専用ツール | あり | あり |
| Modular Avatar | あり | あり |
| FaceEmo | あり | あり |
| PhysBone 専用ツール | あり | あり |
| テクスチャ編集 | あり | あり |
| トークン消費 | 大 | 中 |

VRChat モードでは、VRChat 制作に不要なツール（Godot 関連、Blender 専用のモデリングツールなど）を除外しています。ただし、Blender とのクロスアプリ連携（ポリゴン削減など）は利用可能です。

## 対応 VRChat SDK バージョン

| SDK | 対応バージョン |
|---|---|
| VRChat SDK - Worlds | 3.5.x 以降 |
| VRChat SDK - Avatars | 3.5.x 以降 |

:::warning SDK のバージョンについて
VRChat SDK は頻繁にアップデートされます。OpenForge MCP は最新の安定版 SDK に追従していますが、SDK のベータ版には対応していない場合があります。問題が発生した場合は、VRChat Creator Companion (VCC) で最新の安定版に更新してください。
:::

## 推奨 Unity バージョン

**Unity 2022.3.22f1 LTS** を使用してください。

VRChat は使用可能な Unity バージョンを厳密に指定しています。指定外のバージョンではビルドエラーやアップロード失敗が発生する可能性があります。VRChat Creator Companion (VCC) からプロジェクトを作成すると、自動的に正しいバージョンが選択されます。

:::tip Unity バージョンの確認方法
Unity Hub のインストール一覧で、プロジェクトに紐づいている Unity バージョンを確認できます。VCC 経由で作成したプロジェクトであれば、通常は正しいバージョンが設定されています。
:::

## 次のステップ

VRChat モードのセットアップが完了したら、以下のガイドに進んでください。

- [ワールド制作](./world-creation.md) -- VRChat ワールドをゼロから構築する
- [アバターセットアップ](./avatar-setup.md) -- アバターを VRChat 対応にする
- [衣装の着せ替え](./outfit-change.md) -- Modular Avatar で衣装を追加する
- [表情の設定](./expressions.md) -- FaceEmo で表情を作る
- [揺れ骨の設定](./physbone.md) -- PhysBone で自然な動きを付ける
