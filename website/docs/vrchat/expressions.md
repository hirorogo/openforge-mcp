---
sidebar_position: 5
title: "表情の設定 (FaceEmo)"
description: "FaceEmo を使った VRChat アバターの表情設定ガイド"
---

# 表情の設定 (FaceEmo)

このガイドでは、FaceEmo を使って VRChat アバターの表情を設定する方法を解説します。BlendShape の検出から、プリセット表情の作成、カスタム表情、ジェスチャーマッピング、Expression Menu の構築まで、表情設定のすべてを網羅します。

## FaceEmo とは

FaceEmo は、VRChat アバターの表情を直感的に設定するためのツールです。VRChat の表情システムは Animator Controller や Expression Parameters など複数の仕組みが絡み合っており、手作業での設定は複雑です。FaceEmo はこれらの設定を簡潔にまとめ、OpenForge MCP と連携することで自然言語での表情設定を可能にします。

FaceEmo が管理するもの:

- **表情プリセット**: 喜び、怒り、悲しみなどの定義
- **ジェスチャーマッピング**: ハンドジェスチャーと表情の紐づけ
- **Expression Menu**: VRChat 内の表情切り替えメニュー
- **Animator Controller**: 表情を再生するための内部アニメーション

## ステップ 1: BlendShape の検出 (auto_detect_blendshapes)

まず、アバターにどのような BlendShape（表情を作るための顔の変形データ）が含まれているかを確認します。

**あなた:**
> アバターの BlendShape を一覧表示して

**AI の動き:** `auto_detect_blendshapes` が実行され、利用可能な BlendShape が表示されます。

**AI の返答例:**

```
BlendShape 一覧 (42 個検出):

[口]
  vrc.v_aa, vrc.v_ch, vrc.v_dd, vrc.v_e, vrc.v_ff,
  vrc.v_ih, vrc.v_kk, vrc.v_nn, vrc.v_oh, vrc.v_ou,
  vrc.v_pp, vrc.v_rr, vrc.v_sil, vrc.v_ss, vrc.v_th
  Mouth_Smile, Mouth_Open, Mouth_Pout, Mouth_Grin

[目]
  Eye_Close_L, Eye_Close_R, Eye_Open_Wide_L, Eye_Open_Wide_R,
  Eye_Highlight_Off, Eye_Heart, Eye_Star, Eye_Jitome

[眉]
  Brow_Up_L, Brow_Up_R, Brow_Down_L, Brow_Down_R,
  Brow_Angry, Brow_Sad

[頬]
  Cheek_Blush, Cheek_Puff

[その他]
  Tongue_Out, Tear_L, Tear_R, Dark_Circles
```

:::info BlendShape の命名について
BlendShape の名前はモデルによって異なります。`vrc.v_` で始まるものはリップシンク（口パク）用で、VRChat が自動的に使用します。それ以外が表情設定に利用できる BlendShape です。
:::

## ステップ 2: 基本表情プリセットの作成 (create_expression_preset)

標準的な 8 表情を一括で作成します。

**あなた:**
> 基本の 8 表情プリセットを作って

**AI の動き:** `create_expression_preset` が実行され、以下の表情が自動的に作成されます。

| 表情名 | 使用する BlendShape | 説明 |
|---|---|---|
| 笑顔 (Smile) | Mouth_Smile + Eye_Close_L/R (50%) | 目を細めた柔らかい笑顔 |
| 怒り (Angry) | Brow_Angry + Mouth_Grin + Eye_Jitome | 眉を寄せた怒り顔 |
| 悲しみ (Sad) | Brow_Sad + Eye_Close_L/R (30%) + Mouth_Pout | 眉を下げた悲しい表情 |
| 驚き (Surprised) | Eye_Open_Wide_L/R + Brow_Up_L/R + Mouth_Open | 目と口を大きく開けた驚き |
| 照れ (Shy) | Cheek_Blush + Eye_Close_L/R (40%) + Mouth_Smile (50%) | 頬を染めた照れ顔 |
| ウインク (Wink) | Eye_Close_L + Mouth_Smile | 左目を閉じたウインク |
| じと目 (Jitome) | Eye_Jitome + Brow_Down_L/R | 半目のジト目 |
| 舌出し (Tongue) | Tongue_Out + Mouth_Open (30%) + Eye_Close_L/R (20%) | 舌を出したいたずら顔 |

**AI の返答例:**

```
8 表情プリセットを作成しました:
  Smile, Angry, Sad, Surprised, Shy, Wink, Jitome, Tongue
各表情は検出された BlendShape に基づいて最適な値で設定されています。
```

:::tip プリセットの精度
`create_expression_preset` は検出された BlendShape の名前から適切な組み合わせを推定します。モデルによっては意図と異なる表情になることがあります。その場合は、次のステップでカスタム表情として調整してください。
:::

## ステップ 3: カスタム表情の追加 (add_expression)

プリセットにない表情や、プリセットを微調整した表情を個別に追加します。

### 特定の BlendShape 値を指定して作成

**あなた:**
> 「にっこり」という表情を追加して。Mouth_Smile を 100%、Eye_Close_L と Eye_Close_R を 70%、Cheek_Blush を 30% にして

**AI の動き:** `add_expression` が実行され、指定した BlendShape 値の組み合わせで「にっこり」表情が作成されます。

### 自然言語で表情を指示

**あなた:**
> 「泣き顔」を作って。涙を流して目を細めて、口は少し開いた感じで

**AI の動き:** `add_expression` が実行され、AI が自然言語の指示から適切な BlendShape の組み合わせを推定して表情を作成します。

**AI の返答例:**

```
「泣き顔」を作成しました:
  Eye_Close_L: 60%
  Eye_Close_R: 60%
  Tear_L: 100%
  Tear_R: 100%
  Brow_Sad: 80%
  Mouth_Open: 30%
```

**あなた:**
> もう少し目を開けて。涙はそのままで

**AI の動き:** Eye_Close_L/R の値が調整されます（例: 60% → 30%）。

### 表情のプレビュー

**あなた:**
> 「にっこり」の表情をプレビューして。スクリーンショットで見せて

**AI の動き:** 指定された表情の BlendShape が適用された状態でスクリーンショットが撮影されます。

## ステップ 4: ジェスチャーマッピング (add_gesture_expression)

VRChat では、コントローラーのハンドジェスチャー（手の形）に表情を割り当てることができます。

### 利用可能なジェスチャー

| ジェスチャー | 英語名 | 説明 |
|---|---|---|
| ニュートラル | Neutral | 何も操作していない状態 |
| 拳 | Fist | 手をグーに握った状態 |
| 手を開く | HandOpen | 手をパーに開いた状態 |
| 指差し | FingerPoint | 人差し指で指した状態 |
| ピース | Victory | ピースサインの状態 |
| ロック | RockNRoll | ロックサインの状態 |
| 銃 | HandGun | 銃の形の状態 |
| サムズアップ | ThumbsUp | 親指を立てた状態 |

### ジェスチャーに表情を割り当て

**あなた:**
> ジェスチャーに表情を割り当てて。ピースで笑顔、拳で怒り、手を開いたら驚き、指差しでウインク、ロックで舌出し、サムズアップで照れにして

**AI の動き:** `add_gesture_expression` が実行され、各ジェスチャーに表情が割り当てられます。

**AI の返答例:**

```
ジェスチャーマッピング設定完了:
  Neutral: (表情なし - デフォルト顔)
  Fist: Angry (怒り)
  HandOpen: Surprised (驚き)
  FingerPoint: Wink (ウインク)
  Victory: Smile (笑顔)
  RockNRoll: Tongue (舌出し)
  HandGun: (未設定)
  ThumbsUp: Shy (照れ)
```

:::info 左手と右手の設定
既定では、左手のジェスチャーが表情に使われます。右手を使いたい場合や、左右の組み合わせで表情を変えたい場合は、個別に指定できます。

```
「右手のピースでもウインクにして」
「左手がピースで右手が拳のときは、じと目にして」
```
:::

### ジェスチャーによる表情遷移

**あなた:**
> ジェスチャーを変えたときに表情がスムーズに切り替わるようにして。0.2 秒で遷移して

**AI の動き:** 表情切り替え時のブレンド時間が 0.2 秒に設定されます。ジェスチャーを変えると、前の表情から次の表情へ滑らかに移行します。

## Expression Menu の設定

Expression Menu から表情を手動で切り替えられるようにする設定です。

**あなた:**
> Expression Menu に表情サブメニューを追加して。8 表情すべてを選択できるようにして

**AI の動き:** Expression Menu に「表情」サブメニューが作成され、各表情がトグル項目として追加されます。

**あなた:**
> 「泣き顔」と「にっこり」もメニューに追加して

**AI の動き:** カスタム表情がメニューに追加されます。

最終的な Expression Menu の構造:

```
Expression Menu
  └─ 表情
       ├─ 笑顔
       ├─ 怒り
       ├─ 悲しみ
       ├─ 驚き
       ├─ 照れ
       ├─ ウインク
       ├─ じと目
       ├─ 舌出し
       ├─ にっこり
       └─ 泣き顔
```

## 表情のテスト

### Unity 上でのテスト

**あなた:**
> 表情をひとつずつプレビューして。全表情のスクリーンショットを並べて

**AI の動き:** 各表情が順番に適用され、スクリーンショットが撮影されます。一覧として表示されるので、すべての表情を確認できます。

### 確認するポイント

| 確認項目 | 内容 |
|---|---|
| 表情の見た目 | 意図通りの表情になっているか |
| BlendShape の干渉 | 複数の BlendShape が競合して不自然になっていないか |
| リップシンクとの共存 | 表情中に口パクが正しく動くか |
| ジェスチャーの反応 | 正しいジェスチャーで正しい表情が出るか |
| 遷移の滑らかさ | 表情切り替え時に不自然なちらつきがないか |

:::warning リップシンクとの競合
口を大きく変形させる表情（笑顔、口を開けた驚きなど）は、リップシンク（口パク）と干渉する場合があります。FaceEmo はリップシンク BlendShape と表情 BlendShape の優先度を自動的に管理しますが、不自然に見える場合は口の BlendShape 値を控えめに設定してください。
:::

## 高度な設定

### 表情のロック

特定の表情を固定して、ジェスチャーを変えても切り替わらないようにする機能です。

**あなた:**
> 表情のロック機能を追加して。Expression Menu から ON/OFF できるようにして

**AI の動き:** Expression Menu に「表情ロック」トグルが追加されます。ON にすると、現在の表情がジェスチャーに関係なく維持されます。

### 表情の組み合わせ

複数の表情パーツを組み合わせて使う設定です。

**あなた:**
> 目の表情と口の表情を別々に制御できるようにして。目はジェスチャーで、口は Expression Menu から選択

**AI の動き:** 表情が「目」と「口」のレイヤーに分離され、それぞれ独立して制御できるようになります。

## 次のステップ

表情の設定が完了したら、以下のガイドも参考にしてください。

- [アバターセットアップ](./avatar-setup.md) -- アバターの全体的なセットアップに戻る
- [揺れ骨の設定 (PhysBone)](./physbone.md) -- 髪やスカートの揺れ物設定
- [パフォーマンス最適化](./optimization.md) -- 表情が増えた場合のパラメータ最適化
- [アップロード](./upload.md) -- VRChat へのアップロード
