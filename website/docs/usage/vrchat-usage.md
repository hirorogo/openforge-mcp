---
sidebar_position: 5
title: "VRChat モードの使い方"
---

# VRChat モードの使い方

OpenForge MCP の VRChat モードを使うと、VRChat のワールド制作やアバター関連の操作をAIに自然言語で指示できます。


## VRChat モードの有効化

```bash
npx openforge-mcp setup --mode vrchat
```

VRChat モードを有効にすると、VRChat SDK、Modular Avatar、FaceEmo、PhysBone などの専用ツールが使えるようになります。


## ワールド制作

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| スポーンポイントを設置する | `スポーンポイントを (0, 0, 0) に置いて` | `set_spawn_point` |
| ミラーを設置する | `全身ミラーを置いて` | `create_mirror` |
| 椅子を設置する | `椅子を3脚並べて` | `create_chair` |
| ポータルを作る | `ワールドへのポータルを置いて` | `create_portal` |
| ワールド設定を変更する | `最大人数を16人にして` | `set_world_settings` |


## アバター

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| アバターをセットアップする | `このモデルをVRChatアバターとしてセットアップして` | `setup_avatar` |
| ビューポイントを調整する | `ビューポイントを目の位置に合わせて` | `set_viewpoint` |
| パフォーマンスランクを確認する | `アバターのパフォーマンスランクを確認して` | `check_performance_rank` |
| Boundsを設定する | `アバターのBoundsを自動調整して` | `set_avatar_bounds` |
| アバターをアップロードする | `アバターをアップロードして` | `upload_avatar` |


## 衣装 (Modular Avatar)

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| 衣装を着せる | `この衣装をアバターに着せて` | `ma_setup_outfit` |
| 衣装を切り替え可能にする | `衣装をメニューから切り替えられるようにして` | `ma_add_toggle` |
| ボーンを自動統合する | `Merge Armatureを設定して` | `ma_merge_armature` |
| Blendshape Syncを設定する | `体のシェイプキーと衣装を同期して` | `ma_sync_blendshape` |
| メニューを整理する | `衣装メニューをフォルダにまとめて` | `ma_organize_menu` |


## 表情 (FaceEmo)

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| 表情セットを作る | `基本的な表情セットを作って` | `faceemo_create_set` |
| 表情を追加する | `笑顔の表情を追加して` | `faceemo_add_expression` |
| 表情をプレビューする | `怒りの表情をプレビューして` | `faceemo_preview` |
| ハンドジェスチャーに割り当てる | `笑顔をピースサインに割り当てて` | `faceemo_assign_gesture` |
| 表情の遷移を設定する | `表情の切り替え時間を0.1秒にして` | `faceemo_set_transition` |


## 揺れ骨 (PhysBone)

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| 髪の揺れ骨を設定する | `髪にPhysBoneをプリセットで設定して` | `setup_physbone` |
| スカートの揺れ骨を設定する | `スカートにPhysBoneを設定して` | `setup_physbone` |
| しっぽの揺れ骨を設定する | `しっぽにPhysBoneを設定して` | `setup_physbone` |
| 揺れ具合を調整する | `髪の揺れをもっと柔らかくして` | `set_physbone_property` |
| コライダーを追加する | `頭にPhysBoneColliderを追加して` | `add_physbone_collider` |


## テクスチャ

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| 色を変える | `服の色を黒に変えて` | `change_texture_color` |
| グラデーションをつける | `髪にグラデーションをつけて` | `apply_gradient` |
| テクスチャを差し替える | `目のテクスチャを差し替えて` | `replace_texture` |
| 色味を調整する | `肌の色を少し明るくして` | `adjust_texture_color` |


## 最適化

| やりたいこと | こう言う | 使われるツール |
|---|---|---|
| パフォーマンスランクを確認する | `現在のランクを教えて` | `check_performance_rank` |
| 自動最適化する | `Poorランクを自動で改善して` | `auto_optimize` |
| ポリゴン数を確認する | `ポリゴン数を教えて` | `get_polygon_count` |
| テクスチャを圧縮する | `テクスチャを最適化して` | `optimize_textures` |
| マテリアル数を減らす | `マテリアルをまとめて` | `merge_materials` |
