---
sidebar_position: 0
title: ツールエクスプローラー
---

# ツールエクスプローラー

OpenForge MCP は 620 以上のツールを提供しています。このページでは、各エンジンのツール構成と使い方の概要を紹介します。

---

## エンジン別ツール数

| エンジン | ツール数 | 主なカテゴリ |
|---|---|---|
| **Unity** | 260+ | Scene, GameObject, Component, Material, Physics, Animation, UI, Editor |
| **Blender** | 240+ | Object, Mesh, Material, Modifier, Animation, Render, Nodes, UV |
| **Godot** | 100+ | Node, Scene, Script, Resource, Physics, UI, TileMap, Animation |
| **共通 (System)** | 20+ | プロジェクト管理, スナップショット, スクリーンショット, Pipeline |

---

## カテゴリ クイックジャンプ

### Unity

[Scene](./unity-tools.md#sceneシーン) | [GameObject](./unity-tools.md#gameobjectゲームオブジェクト) | [Material](./unity-tools.md#materialマテリアル) | [Script](./unity-tools.md#scriptスクリプト) | [Physics](./unity-tools.md#physics物理演算) | [Animation](./unity-tools.md#animationアニメーション) | [UI](./unity-tools.md#uiユーザーインターフェース) | [Lighting](./unity-tools.md#lightingライティング)

### Blender

[Object](./blender-tools.md#objectオブジェクト) | [Mesh](./blender-tools.md#meshメッシュ) | [Material](./blender-tools.md#materialマテリアル) | [Modifier](./blender-tools.md#modifierモディファイア) | [Animation](./blender-tools.md#animationアニメーション) | [Render](./blender-tools.md#renderレンダリング)

### Godot

[Node](./godot-tools.md#nodeノード) | [Resource](./godot-tools.md#resourceリソース) | [Screenshot](./godot-tools.md#screenshotスクリーンショット)

---

## エンジンを選ぶ

用途に応じて、各エンジンのツール一覧ページをご覧ください。

### Unity ツール一覧

ゲーム開発、VRChat ワールド制作に最適です。260 以上のツールでシーン構築、マテリアル設定、物理演算、アニメーションまで対応します。

**[Unity ツール一覧を見る →](./unity-tools.md)**

### Blender ツール一覧

3D モデリング、レンダリング、アバター制作に最適です。240 以上のツールでメッシュ編集、マテリアルノード、モディファイアまで対応します。

**[Blender ツール一覧を見る →](./blender-tools.md)**

### Godot ツール一覧

オープンソースのゲームエンジンで開発したい方向けです。100 以上のツールでノード操作、シーン管理、スクリプト実行に対応します。

**[Godot ツール一覧を見る →](./godot-tools.md)**

### 共通ツール (System)

全エンジンで共通して使えるツールです。プロジェクト管理、スナップショット、スクリーンショット取得などを提供します。

**[共通ツール一覧を見る →](./system-tools.md)**

---

## ツールの使い方

OpenForge MCP の Dynamic モードでは、以下の流れでツールを利用します。

### 1. カテゴリ一覧を取得する

```
list_categories
```

利用可能なカテゴリ（Scene, GameObject, Material など）の一覧を返します。

### 2. カテゴリ内のツールを取得する

```
list_tools category="Scene"
```

指定したカテゴリに属するツールの一覧を返します。

### 3. ツールを実行する

```
execute tool="create_gameobject" params={"name": "MyCube", "type": "Cube", "position": [0, 1, 0]}
```

指定したツールをパラメータ付きで実行します。

:::tip ヒント
実際の利用時には、AI が上記の流れを自動で行います。あなたは「立方体を作って」と伝えるだけで大丈夫です。
:::
