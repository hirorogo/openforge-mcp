---
sidebar_position: 1
title: "カスタムパイプラインを組む"
description: "Blender モデリングから Unity プレハブ化まで、一気通貫のアセットパイプラインを構築する"
---

# カスタムパイプラインを組む

Blender でモデルを作り、最適化し、テクスチャをベイクし、Unity にインポートしてマテリアル設定、LOD 生成、プレハブ化まで -- この一連のフローを OpenForge MCP のパイプラインとレシピで自動化する。

## 前提

- Blender と Unity の両方が起動し、OpenForge MCP に接続済み
- クロスアプリパイプラインが動作している（共有ディレクトリが設定済み）
- レシピ機能の基本を理解している（[レシピ機能](/docs/advanced/recipe) 参照）

## パイプライン全体像

```
Blender モデリング
    |
    v
メッシュ最適化 (decimate, クリーンアップ)
    |
    v
テクスチャベイク (albedo, normal, AO)
    |
    v
FBX エクスポート → 共有ディレクトリ
    |
    v
Unity インポート (自動検知)
    |
    v
マテリアルセットアップ (URP/HDRP)
    |
    v
LOD グループ生成
    |
    v
プレハブ化
```

## ステップ 1: Blender でモデリング

**あなた:**
> Blender で中世の木箱を作って。サイズは 1m x 0.8m x 0.6m。板の継ぎ目のディテールを入れて、ふたは別オブジェクトにして。

**AI の応答例:**
```
Blender でモデルを作成しました。
- WoodenCrate_Body: 頂点数 248, ポリゴン数 120
- WoodenCrate_Lid: 頂点数 86, ポリゴン数 40
- 合計ポリゴン数: 160
```

## ステップ 2: メッシュ最適化

ハイポリモデルをそのまま使うと重い。Decimate で段階的にポリゴン数を落とす。

**あなた:**
> WoodenCrate_Body を decimate して。ratio 0.5 でまず試して。シルエットが崩れないか確認して。

**AI の応答例:**
```
Decimate モディファイアを適用しました。
- 変更前: 248 頂点, 120 ポリゴン
- 変更後: 126 頂点, 60 ポリゴン
- 削減率: 50%
スクリーンショットを撮影しました。シルエットの変化は軽微です。
```

ここでスクリーンショットを確認して、品質に問題があれば ratio を調整する。

**あなた:**
> メッシュのクリーンアップもやって。重複頂点の削除、法線の再計算、非多様体の修正を。

**AI の応答例:**
```
クリーンアップを実行しました。
- 重複頂点を 3 個削除
- 法線を再計算 (外向きに統一)
- 非多様体エッジ: 0 (問題なし)
```

## ステップ 3: テクスチャベイク

ハイポリのディテールをローポリにベイクする。

**あなた:**
> WoodenCrate_Body に対して以下のテクスチャをベイクして:
> - Albedo (1024x1024)
> - Normal Map (1024x1024)
> - Ambient Occlusion (1024x1024)
> 出力先は //textures/ フォルダに。

**AI の応答例:**
```
テクスチャベイクが完了しました。
- WoodenCrate_Body_Albedo.png (1024x1024)
- WoodenCrate_Body_Normal.png (1024x1024)
- WoodenCrate_Body_AO.png (1024x1024)
保存先: //textures/
ベイク時間: 4.2 秒
```

:::tip マージンの設定
UV アイランド間のマージンが狭いと、テクスチャの境界にシームが出る。ベイク前に UV のマージンを十分に取っておくこと。2048x2048 なら 4px、1024x1024 なら 2px が目安。
:::

## ステップ 4: FBX エクスポート

**あなた:**
> WoodenCrate_Body と WoodenCrate_Lid を FBX でエクスポートして。Unity 向けの設定で。テクスチャも一緒に共有ディレクトリに出して。

**AI の応答例:**
```
FBX エクスポートが完了しました。
- ファイル: ~/OpenForge/shared/WoodenCrate.fbx (245 KB)
- テクスチャ: ~/OpenForge/shared/textures/WoodenCrate_Body_Albedo.png
- テクスチャ: ~/OpenForge/shared/textures/WoodenCrate_Body_Normal.png
- テクスチャ: ~/OpenForge/shared/textures/WoodenCrate_Body_AO.png
- スケール: FBX All (Unity 互換)
- 座標系: Y-Up (Unity 互換)
```

## ステップ 5: Unity インポートとマテリアル設定

共有ディレクトリに出力したファイルは Unity 側で自動検知される。検知後にマテリアルを設定する。

**あなた:**
> Unity にインポートされた WoodenCrate に URP Lit マテリアルを作成して設定して。ベイクしたテクスチャを割り当てて。Metallic は 0、Smoothness は 0.2 にして。

**AI の応答例:**
```
マテリアルを作成して適用しました。
- マテリアル: WoodenCrate_Mat (URP/Lit)
- Albedo Map: WoodenCrate_Body_Albedo.png
- Normal Map: WoodenCrate_Body_Normal.png (Scale: 1.0)
- Occlusion Map: WoodenCrate_Body_AO.png
- Metallic: 0.0
- Smoothness: 0.2
```

## ステップ 6: LOD グループ生成

**あなた:**
> WoodenCrate に LOD グループを設定して。LOD0 はそのまま、LOD1 は 50%、LOD2 は 25% に。LOD2 以降はカリングして。

**AI の応答例:**
```
LOD グループを設定しました。
- LOD0: 160 ポリゴン (画面比 60% 以上)
- LOD1: 80 ポリゴン (画面比 30% 以上)
- LOD2: 40 ポリゴン (画面比 10% 以上)
- Culled: 画面比 10% 未満
```

## ステップ 7: プレハブ化

**あなた:**
> WoodenCrate を Assets/Prefabs/Props/ にプレハブとして保存して。BoxCollider も追加して。

**AI の応答例:**
```
プレハブを作成しました。
- パス: Assets/Prefabs/Props/WoodenCrate.prefab
- コンポーネント: MeshRenderer, MeshFilter, LODGroup, BoxCollider
- BoxCollider サイズ: (1.0, 0.8, 0.6) -- メッシュに自動フィット
```

## レシピ化: YAML で全フローを定義する

上記の手順をレシピにまとめて、一発で実行できるようにする。

```yaml
name: blender-to-unity-asset
description: Blender モデルを最適化して Unity プレハブとして出力する
version: "1.0"
author: your-team

variables:
  model_name: "WoodenCrate"
  body_object: "WoodenCrate_Body"
  lid_object: "WoodenCrate_Lid"
  texture_resolution: 1024
  decimate_ratio: 0.5
  lod1_ratio: 0.5
  lod2_ratio: 0.25
  metallic: 0.0
  smoothness: 0.2
  prefab_path: "Assets/Prefabs/Props"

steps:
  # --- Blender 側の処理 ---
  - name: メッシュ最適化 (Body)
    tool: blender_decimate
    params:
      object: "{{ body_object }}"
      ratio: "{{ decimate_ratio }}"
    on_error: stop

  - name: メッシュ最適化 (Lid)
    tool: blender_decimate
    params:
      object: "{{ lid_object }}"
      ratio: "{{ decimate_ratio }}"
    on_error: stop

  - name: メッシュクリーンアップ (Body)
    tool: blender_clean_mesh
    params:
      object: "{{ body_object }}"
      remove_doubles: true
      recalc_normals: true
    on_error: continue

  - name: メッシュクリーンアップ (Lid)
    tool: blender_clean_mesh
    params:
      object: "{{ lid_object }}"
      remove_doubles: true
      recalc_normals: true
    on_error: continue

  - name: Albedo ベイク
    tool: blender_bake_texture
    params:
      object: "{{ body_object }}"
      type: "DIFFUSE"
      resolution: "{{ texture_resolution }}"
      output: "//textures/{{ model_name }}_Albedo.png"
    on_error: stop

  - name: Normal Map ベイク
    tool: blender_bake_texture
    params:
      object: "{{ body_object }}"
      type: "NORMAL"
      resolution: "{{ texture_resolution }}"
      output: "//textures/{{ model_name }}_Normal.png"
    on_error: stop

  - name: AO ベイク
    tool: blender_bake_texture
    params:
      object: "{{ body_object }}"
      type: "AO"
      resolution: "{{ texture_resolution }}"
      output: "//textures/{{ model_name }}_AO.png"
    on_error: stop

  - name: FBX エクスポート
    tool: blender_export
    params:
      objects:
        - "{{ body_object }}"
        - "{{ lid_object }}"
      format: "fbx"
      filename: "{{ model_name }}.fbx"
      to_shared: true
      include_textures: true
    on_error: stop

  # --- Unity 側の処理 ---
  - name: インポート完了を待機
    tool: wait_for_import
    params:
      filename: "{{ model_name }}.fbx"
      timeout: 30
    on_error: stop

  - name: マテリアル作成
    tool: create_material
    params:
      name: "{{ model_name }}_Mat"
      shader: "Universal Render Pipeline/Lit"
    on_error: stop

  - name: テクスチャ割り当て
    tool: set_material_textures
    params:
      material: "{{ model_name }}_Mat"
      albedo: "{{ model_name }}_Albedo.png"
      normal: "{{ model_name }}_Normal.png"
      occlusion: "{{ model_name }}_AO.png"
    on_error: stop

  - name: マテリアルプロパティ設定
    tool: set_material_property
    params:
      material: "{{ model_name }}_Mat"
      properties:
        _Metallic: "{{ metallic }}"
        _Smoothness: "{{ smoothness }}"
    on_error: continue

  - name: マテリアル適用
    tool: set_material
    params:
      target: "{{ model_name }}"
      material: "{{ model_name }}_Mat"
    on_error: stop

  - name: LOD グループ設定
    tool: create_lod_group
    params:
      target: "{{ model_name }}"
      lod_levels:
        - ratio: 1.0
          screen_percentage: 0.6
        - ratio: "{{ lod1_ratio }}"
          screen_percentage: 0.3
        - ratio: "{{ lod2_ratio }}"
          screen_percentage: 0.1
      cull_below: 0.1
    on_error: continue

  - name: BoxCollider 追加
    tool: add_component
    params:
      target: "{{ model_name }}"
      component: "BoxCollider"
      auto_fit: true
    on_error: continue

  - name: プレハブ作成
    tool: create_prefab
    params:
      source: "{{ model_name }}"
      path: "{{ prefab_path }}/{{ model_name }}.prefab"
    on_error: stop
```

### レシピの実行

**あなた:**
> このレシピを実行して。model_name は "IronChest" に変えて。

**AI の応答例:**
```
レシピ blender-to-unity-asset を実行します。
変数のオーバーライド: model_name = "IronChest"

[1/17] メッシュ最適化 (Body)... 完了
[2/17] メッシュ最適化 (Lid)... 完了
[3/17] メッシュクリーンアップ (Body)... 完了
[4/17] メッシュクリーンアップ (Lid)... 完了
[5/17] Albedo ベイク... 完了
[6/17] Normal Map ベイク... 完了
[7/17] AO ベイク... 完了
[8/17] FBX エクスポート... 完了
[9/17] インポート完了を待機... 完了 (3.2秒)
[10/17] マテリアル作成... 完了
[11/17] テクスチャ割り当て... 完了
[12/17] マテリアルプロパティ設定... 完了
[13/17] マテリアル適用... 完了
[14/17] LOD グループ設定... 完了
[15/17] BoxCollider 追加... 完了
[16/17] プレハブ作成... 完了

全 17 ステップが正常に完了しました。
プレハブ: Assets/Prefabs/Props/IronChest.prefab
```

## エラーハンドリングの設計

レシピの各ステップには `on_error` を設定できる。設計指針は以下の通り。

| フェーズ | on_error | 理由 |
|---------|----------|------|
| Decimate | `stop` | メッシュが壊れた状態で先に進めても意味がない |
| クリーンアップ | `continue` | 重複頂点が 0 でも問題はない。警告として扱う |
| テクスチャベイク | `stop` | テクスチャがないとマテリアルが不完全になる |
| FBX エクスポート | `stop` | エクスポート失敗は致命的 |
| インポート待機 | `stop` | タイムアウトは接続やパスの問題を示唆する |
| マテリアルプロパティ | `continue` | デフォルト値でも最低限動く |
| LOD 設定 | `continue` | LOD なしでもアセットとしては機能する |
| プレハブ作成 | `stop` | 最終出力が作れないのは失敗 |

### 条件分岐

ステップに `condition` を付けると、前のステップの結果に応じて実行を制御できる。

```yaml
  - name: ハイポリ警告チェック
    tool: blender_get_mesh_info
    params:
      object: "{{ body_object }}"

  - name: Decimate (ポリゴン数が多い場合のみ)
    tool: blender_decimate
    condition: "{{ steps.ハイポリ警告チェック.result.polygon_count > 5000 }}"
    params:
      object: "{{ body_object }}"
      ratio: "{{ decimate_ratio }}"
```

## パイプラインとレシピの使い分け

| 観点 | パイプライン (自然言語) | レシピ (YAML) |
|-----|----------------------|--------------|
| 柔軟性 | 高い。AI が状況に応じて判断する | 低い。定義通りに実行する |
| 再現性 | 低い。同じ指示でも結果が変わりうる | 高い。同じ入力なら同じ結果になる |
| 適する場面 | 探索的な作業、1回限りの作業 | 繰り返す作業、チーム共有、CI/CD |
| エラー対応 | AI が自律的にリカバリを試みる | on_error と condition で明示的に制御する |

実際のプロジェクトでは、最初は自然言語で試行錯誤し、手順が固まったらレシピにまとめるという流れが効率的だ。
