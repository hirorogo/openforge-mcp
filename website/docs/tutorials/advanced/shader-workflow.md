---
sidebar_position: 3
title: "シェーダーとマテリアルの高度な設定"
description: "Shader Graph マテリアルの作成、PBR テクスチャワークフロー、Poly Haven 連携を扱う"
---

# シェーダーとマテリアルの高度な設定

OpenForge MCP を使って、Shader Graph ベースのマテリアルを効率的に作成・管理する。PBR テクスチャの設定、マテリアルバリアント、ライティングベイク、Poly Haven からのテクスチャ取得まで一通りカバーする。

## 前提

- Unity (URP または HDRP) が起動し、OpenForge MCP に接続済み
- Shader Graph パッケージがインストール済み
- PBR ワークフローの基本概念（Metallic/Roughness）を理解していること

## PBR テクスチャワークフロー

PBR (Physically Based Rendering) マテリアルは以下のテクスチャマップで構成される。

| マップ | 役割 | チャンネル |
|-------|------|----------|
| Albedo (Base Color) | 表面の色。照明の影響を含まない純粋な色 | RGB |
| Normal Map | 表面の凹凸を疑似的に表現する | RGB (タンジェント空間) |
| Metallic | 金属か非金属かを定義する | R (グレースケール) |
| Roughness (Smoothness) | 表面の粗さ。Unity では Smoothness (1 - Roughness) | R (グレースケール) |
| Ambient Occlusion | 環境光の遮蔽。隙間や角が暗くなる | R (グレースケール) |
| Height (Displacement) | 実際にメッシュを変形させる。Parallax Mapping にも使う | R (グレースケール) |

:::tip Metallic vs Smoothness
Unity の Standard/URP Lit シェーダーでは Metallic マップの Alpha チャンネルが Smoothness として使われる。外部テクスチャの Roughness マップを使う場合は値を反転する必要がある。
:::

## ステップ 1: Poly Haven からテクスチャを取得する

Poly Haven は CC0 ライセンスの PBR テクスチャを提供している。OpenForge MCP から直接ダウンロードできる。

**あなた:**
> Poly Haven から "castle_brick" テクスチャを 2K 解像度でダウンロードして。必要なマップは全部。

**AI の応答例:**
```
Poly Haven からテクスチャをダウンロードしました。

castle_brick_wall_03 (2048x2048):
  - castle_brick_wall_03_diff_2k.png  (Albedo)
  - castle_brick_wall_03_nor_gl_2k.png (Normal, OpenGL)
  - castle_brick_wall_03_arm_2k.png   (AO/Roughness/Metallic packed)
  - castle_brick_wall_03_disp_2k.png  (Displacement)

保存先: Assets/Textures/PolyHaven/castle_brick_wall_03/
```

ARM テクスチャは AO (R), Roughness (G), Metallic (B) がパックされた形式だ。Unity のチャンネルパッキングと一致しない場合は分離が必要になる。

## ステップ 2: マテリアルを作成する

**あなた:**
> URP Lit マテリアルを "M_CastleBrick" という名前で作って。ダウンロードしたテクスチャを全部割り当てて。Roughness は Smoothness に変換して。

**AI の応答例:**
```
マテリアル M_CastleBrick を作成しました。

シェーダー: Universal Render Pipeline/Lit
テクスチャ割り当て:
  Base Map: castle_brick_wall_03_diff_2k.png
  Normal Map: castle_brick_wall_03_nor_gl_2k.png (Scale: 1.0)
  Metallic Map: castle_brick_wall_03_arm_2k.png の B チャンネル
  Smoothness Source: Metallic Alpha
  Occlusion Map: castle_brick_wall_03_arm_2k.png の R チャンネル

Roughness → Smoothness 変換を適用しました。
  (ARM テクスチャの G チャンネルを反転して Smoothness として設定)

Height Map: castle_brick_wall_03_disp_2k.png
  Parallax: 有効 (Scale: 0.02)
```

## ステップ 3: カスタム Shader Graph を作成する

標準シェーダーでは足りない場合、Shader Graph を作る。ここでは風化エフェクト付きのレンガシェーダーを作る。

**あなた:**
> Shader Graph で "SG_WeatheredBrick" を作って。URP Lit ベースで以下の機能:
> - Base Map と Normal Map の入力
> - 風化度合いをコントロールする float パラメータ "_WeatherAmount" (0-1)
> - 風化が進むと Albedo が暗くなり、Roughness が上がる
> - 頂点の上面 (World Normal Y > 0.7) にだけ苔テクスチャをブレンドする
> - 苔の量も "_MossAmount" パラメータで制御

**AI の応答例:**
```
Shader Graph "SG_WeatheredBrick" を作成しました。

パス: Assets/Shaders/SG_WeatheredBrick.shadergraph

プロパティ:
  _BaseMap (Texture2D) - メインテクスチャ
  _NormalMap (Texture2D) - 法線マップ
  _MossMap (Texture2D) - 苔テクスチャ
  _MossNormal (Texture2D) - 苔の法線マップ
  _WeatherAmount (Float, 0-1, default 0.3) - 風化度合い
  _MossAmount (Float, 0-1, default 0.5) - 苔の量
  _MossThreshold (Float, 0-1, default 0.7) - 苔が生える法線 Y の閾値

ノード構成:
  1. Sample Texture 2D (_BaseMap) → Lerp (暗い色へ) → _WeatherAmount で制御
  2. World Normal Y → Step (_MossThreshold) → Multiply (_MossAmount)
     → 苔テクスチャとのブレンドマスク
  3. Base Albedo と Moss Albedo を Lerp でブレンド → Fragment の Base Color へ
  4. Roughness: _WeatherAmount で 0.4 → 0.9 に補間
  5. Normal: Base Normal と Moss Normal をブレンド
```

## ステップ 4: マテリアルバリアントを作成する

同じシェーダーで異なるパラメータ値を持つバリアントを作る。

**あなた:**
> SG_WeatheredBrick を使って以下の 3 バリアントを作って:
> - M_Brick_New: WeatherAmount=0, MossAmount=0 (新品)
> - M_Brick_Old: WeatherAmount=0.6, MossAmount=0.3 (古い)
> - M_Brick_Ruins: WeatherAmount=0.9, MossAmount=0.8 (廃墟)
> 全部同じ Base Map と Normal Map を使って。

**AI の応答例:**
```
3 つのマテリアルバリアントを作成しました。

M_Brick_New:
  Shader: SG_WeatheredBrick
  _WeatherAmount: 0.0
  _MossAmount: 0.0
  外観: きれいなレンガ、色鮮やか

M_Brick_Old:
  Shader: SG_WeatheredBrick
  _WeatherAmount: 0.6
  _MossAmount: 0.3
  外観: くすんだ色、部分的に苔

M_Brick_Ruins:
  Shader: SG_WeatheredBrick
  _WeatherAmount: 0.9
  _MossAmount: 0.8
  外観: 非常に暗い、苔に覆われている

保存先: Assets/Materials/Brick/
```

**あなた:**
> 3 つのマテリアルを並べた比較用のオブジェクトを作って、スクリーンショットを撮って。

**AI の応答例:**
```
比較シーンを構築しました。
- 3 つの Cube (2m x 2m x 2m) を横に並べて配置
- 左: M_Brick_New / 中央: M_Brick_Old / 右: M_Brick_Ruins
- ディレクショナルライト + 環境光を設定
スクリーンショットを撮影しました。
```

## ステップ 5: ライティングベイク

静的オブジェクトにはライトマップをベイクしてパフォーマンスを上げる。

**あなた:**
> シーン内の壁と床を Static に設定して。ライトマップをベイクして。設定は以下:
> - Lightmapper: Progressive GPU
> - Lightmap Resolution: 40 texels/unit
> - Bounce: 2 回
> - Ambient Occlusion: 有効、Distance 1.0
> - Directional Mode: Directional

**AI の応答例:**
```
ライトマップベイク設定を適用しました。

Static 設定:
  - Wall_North: Contribute GI + Receive GI (Static)
  - Wall_South: Contribute GI + Receive GI (Static)
  - Wall_East: Contribute GI + Receive GI (Static)
  - Wall_West: Contribute GI + Receive GI (Static)
  - Floor: Contribute GI + Receive GI (Static)

ベイク設定:
  Lightmapper: Progressive GPU
  Resolution: 40 texels/unit
  Bounces: 2
  AO: Enabled (Distance: 1.0)
  Directional Mode: Directional

ベイクを開始します...
ベイク完了 (18.3 秒)
  ライトマップ: 2 枚 (1024x1024)
  合計テクセル: 2,097,152
```

## パイプライン: テクスチャ取得からマテリアル適用まで

一連の流れをまとめると以下のようになる。

```yaml
name: pbr-material-pipeline
description: Poly Haven テクスチャからマテリアルを作成して適用する
version: "1.0"

variables:
  texture_name: "castle_brick_wall_03"
  resolution: "2k"
  material_name: "M_CastleBrick"
  target_objects:
    - "Wall_North"
    - "Wall_South"
    - "Wall_East"
    - "Wall_West"
  tiling_x: 3.0
  tiling_y: 3.0

steps:
  - name: テクスチャダウンロード
    tool: download_polyhaven
    params:
      asset_name: "{{ texture_name }}"
      resolution: "{{ resolution }}"
      types: ["diffuse", "normal", "arm", "displacement"]
      output_dir: "Assets/Textures/PolyHaven/{{ texture_name }}"
    on_error: stop

  - name: テクスチャインポート設定
    tool: set_texture_import_settings
    params:
      path: "Assets/Textures/PolyHaven/{{ texture_name }}"
      settings:
        - pattern: "*_nor_*"
          type: "NormalMap"
        - pattern: "*_arm_*"
          type: "Default"
          sRGB: false
        - pattern: "*_disp_*"
          type: "Default"
          sRGB: false
    on_error: continue

  - name: マテリアル作成
    tool: create_material
    params:
      name: "{{ material_name }}"
      shader: "Universal Render Pipeline/Lit"
    on_error: stop

  - name: テクスチャ割り当て
    tool: set_material_textures
    params:
      material: "{{ material_name }}"
      albedo: "{{ texture_name }}_diff_{{ resolution }}.png"
      normal: "{{ texture_name }}_nor_gl_{{ resolution }}.png"
      metallic_ao_packed: "{{ texture_name }}_arm_{{ resolution }}.png"
      height: "{{ texture_name }}_disp_{{ resolution }}.png"
    on_error: stop

  - name: タイリング設定
    tool: set_material_property
    params:
      material: "{{ material_name }}"
      properties:
        _BaseMap_ST: { x: "{{ tiling_x }}", y: "{{ tiling_y }}", z: 0, w: 0 }
    on_error: continue

  - name: マテリアル適用
    tool: set_material_batch
    params:
      targets: "{{ target_objects }}"
      material: "{{ material_name }}"
    on_error: stop

  - name: 確認スクリーンショット
    tool: take_screenshot
    params:
      width: 1920
      height: 1080
    on_error: continue
```

## ARM テクスチャのチャンネル分離

Poly Haven の ARM テクスチャ (AO/Roughness/Metallic packed) を Unity で正しく使うには、チャンネルの対応を理解する必要がある。

| ARM チャンネル | 内容 | Unity での使い方 |
|--------------|------|-----------------|
| R | Ambient Occlusion | Occlusion Map として設定 |
| G | Roughness | 反転して Smoothness として使用 |
| B | Metallic | Metallic Map として設定 |

**あなた:**
> ARM テクスチャを Unity 用にチャンネル分離して。Roughness は反転して Smoothness にして。

**AI の応答例:**
```
チャンネル分離を実行しました。

入力: castle_brick_wall_03_arm_2k.png
出力:
  - castle_brick_wall_03_ao_2k.png (R チャンネル)
  - castle_brick_wall_03_smoothness_2k.png (G チャンネル反転)
  - castle_brick_wall_03_metallic_2k.png (B チャンネル)

保存先: Assets/Textures/PolyHaven/castle_brick_wall_03/
```

## テクスチャアトラス化

複数のマテリアルを 1 つにまとめてドローコールを削減する場合、テクスチャアトラスが有効。

**あなた:**
> M_Brick_New, M_Brick_Old, M_Brick_Ruins の Albedo テクスチャを 1 枚のアトラスにまとめて。UV も調整して。

**AI の応答例:**
```
テクスチャアトラスを作成しました。

アトラス: Atlas_Brick_Albedo.png (4096x4096)
  左上: M_Brick_New の Albedo (2048x2048)
  右上: M_Brick_Old の Albedo (2048x2048)
  左下: M_Brick_Ruins の Albedo (2048x2048)
  右下: (空き)

UV 調整:
  M_Brick_New 使用オブジェクト: UV を (0,0.5)-(0.5,1.0) にリマップ
  M_Brick_Old 使用オブジェクト: UV を (0.5,0.5)-(1.0,1.0) にリマップ
  M_Brick_Ruins 使用オブジェクト: UV を (0,0)-(0.5,0.5) にリマップ

マテリアル統合: Atlas_Brick_Mat (1 マテリアル, 1 ドローコール)
```

この手法は [パフォーマンス最適化ガイド](./performance-optimization.md) でも詳しく扱う。
