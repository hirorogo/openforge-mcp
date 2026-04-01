---
sidebar_position: 2
title: "GOAP で NPC の AI を作る"
description: "Goal-Oriented Action Planning を使って、巡回・追跡・警報を行う警備兵 NPC を構築する"
---

# GOAP で NPC の AI を作る

GOAP (Goal-Oriented Action Planning) は、NPC の行動を「ゴール」と「アクション」の組み合わせで定義する AI 手法だ。ステートマシンと違い、ゴールに到達するためのアクション列をプランナーが自動で導出するため、複雑な行動パターンを少ない定義で実現できる。

このチュートリアルでは、OpenForge MCP のツールを使って巡回警備兵 NPC を作る。

## GOAP の基本構造

```
ワールドステート (現在の状態)
    +
ゴール (望む状態)
    +
アクション (前提条件 + 効果 + コスト)
    ↓
プランナーが最適なアクション列を導出
```

- **ワールドステート**: キー・バリューのペアで世界の状態を表現する（例: `enemy_visible: true`）
- **ゴール**: 達成したいワールドステートの部分集合（例: `area_secure: true`）
- **アクション**: 前提条件を満たすとき実行でき、実行するとワールドステートが変化する

## ステップ 1: ワールドステートを定義する

まず、警備兵 NPC が認識する世界の状態を定義する。

**あなた:**
> 以下のワールドステートで GOAP のセットアップを作って:
> - enemy_visible: bool (敵が視界内にいるか)
> - enemy_in_range: bool (敵が攻撃範囲内にいるか)
> - enemy_alive: bool (敵が生存しているか)
> - has_alerted: bool (仲間に警報を出したか)
> - at_patrol_point: bool (巡回ポイントにいるか)
> - weapon_drawn: bool (武器を構えているか)
> - stamina_low: bool (スタミナが低いか)

**AI の応答例:**
```
GOAP ワールドステートを定義しました。
NPC "PatrolGuard" に GoapAgent コンポーネントを追加しました。

初期ワールドステート:
  enemy_visible: false
  enemy_in_range: false
  enemy_alive: false
  has_alerted: false
  at_patrol_point: false
  weapon_drawn: false
  stamina_low: false
```

## ステップ 2: ゴールを定義する

警備兵には 3 つのゴール（優先度付き）を設定する。

**あなた:**
> 以下のゴールを定義して。優先度の数値が大きいほど重要:
>
> 1. Patrol (優先度: 1)
>    - 条件: at_patrol_point = true
>    - 有効化条件: enemy_visible = false
>
> 2. EliminateThreat (優先度: 3)
>    - 条件: enemy_alive = false
>    - 有効化条件: enemy_visible = true
>
> 3. AlertAllies (優先度: 2)
>    - 条件: has_alerted = true
>    - 有効化条件: enemy_visible = true, has_alerted = false

**AI の応答例:**
```
3 つのゴールを PatrolGuard に設定しました。

ゴール一覧:
  [優先度 3] EliminateThreat: { enemy_alive: false }
  [優先度 2] AlertAllies: { has_alerted: true }
  [優先度 1] Patrol: { at_patrol_point: true }

ゴール選択ロジック:
  - 敵が見えていれば EliminateThreat が最優先
  - まだ警報を出していなければ AlertAllies を優先
  - 平時は Patrol
```

## ステップ 3: アクションを定義する

各アクションに前提条件(preconditions)、効果(effects)、コスト(cost) を設定する。

**あなた:**

```text
以下のアクションを定義して:

WalkToPatrolPoint:
  preconditions: (なし)
  effects: at_patrol_point = true
  cost: 1

DrawWeapon:
  preconditions: weapon_drawn = false
  effects: weapon_drawn = true
  cost: 1

ChaseEnemy:
  preconditions: enemy_visible = true, weapon_drawn = true
  effects: enemy_in_range = true
  cost: 2

AttackEnemy:
  preconditions: enemy_in_range = true, weapon_drawn = true
  effects: enemy_alive = false
  cost: 3

RadioAlert:
  preconditions: enemy_visible = true
  effects: has_alerted = true
  cost: 2
```
> RunToEnemy という新しいアクションも追加して。前提条件は enemy_visible と weapon_drawn が true で stamina_low が false。効果は enemy_in_range を true にする。コスト 1 で。

**AI の応答例:**
```
6 つのアクションを定義しました。

アクション一覧:
  WalkToPatrolPoint  [コスト 1] {} → { at_patrol_point: true }
  DrawWeapon         [コスト 1] { weapon_drawn: false } → { weapon_drawn: true }
  ChaseEnemy         [コスト 2] { enemy_visible, weapon_drawn } → { enemy_in_range: true }
  AttackEnemy        [コスト 3] { enemy_in_range, weapon_drawn } → { enemy_alive: false }
  RadioAlert         [コスト 2] { enemy_visible } → { has_alerted: true }
  RunToEnemy         [コスト 1] { enemy_visible, weapon_drawn, !stamina_low } → { enemy_in_range: true }
```

## ステップ 4: プランナーでプランを確認する

`plan_goap` ツールでプランナーの出力を確認する。ワールドステートとゴールを与えると、最適なアクション列が返る。

**あなた:**
> plan_goap を実行して。以下の状態で EliminateThreat ゴールのプランを見せて:
> ワールドステート:
>   enemy_visible: true
>   enemy_in_range: false
>   enemy_alive: true
>   has_alerted: false
>   at_patrol_point: true
>   weapon_drawn: false
>   stamina_low: false

**AI の応答例:**
```
GOAP プランナー出力:

ゴール: EliminateThreat { enemy_alive: false }

プラン (合計コスト: 5):
  1. DrawWeapon [コスト 1]
     状態変化: weapon_drawn: false → true
  2. RunToEnemy [コスト 1]
     状態変化: enemy_in_range: false → true
     (ChaseEnemy [コスト 2] より低コストのため RunToEnemy を選択)
  3. AttackEnemy [コスト 3]
     状態変化: enemy_alive: true → false

探索ノード数: 12
計算時間: 0.3ms
```

RunToEnemy と ChaseEnemy の両方が `enemy_in_range` を達成するが、RunToEnemy の方がコストが低いためそちらが選ばれる。ただし `stamina_low: true` の場合は RunToEnemy の前提条件を満たさないため、ChaseEnemy が選ばれる。

**あなた:**
> stamina_low を true にして同じプランをもう一度。

**AI の応答例:**
```
GOAP プランナー出力:

ゴール: EliminateThreat { enemy_alive: false }

プラン (合計コスト: 6):
  1. DrawWeapon [コスト 1]
  2. ChaseEnemy [コスト 2]  ← RunToEnemy の代わり
  3. AttackEnemy [コスト 3]

RunToEnemy は前提条件 stamina_low: false を満たさないため除外。
```

## ステップ 5: AlertAllies ゴールのプランも確認

**あなた:**
> AlertAllies ゴールのプランも見せて。同じワールドステートで (stamina_low: false に戻して)。

**AI の応答例:**
```
GOAP プランナー出力:

ゴール: AlertAllies { has_alerted: true }

プラン (合計コスト: 2):
  1. RadioAlert [コスト 2]
     状態変化: has_alerted: false → true

探索ノード数: 3
計算時間: 0.1ms
```

## ステップ 6: AI プレイテストで動作確認

実際にシーンを再生して NPC の行動を観察する。

**あなた:**
> テスト用のシーンを作って:
> - 広い部屋 (20m x 20m)
> - PatrolGuard を中央に配置
> - 巡回ポイントを 4 つ、部屋の四隅に配置
> - 敵 (赤い Capsule) を (8, 0, 8) に配置、最初は無効にしておいて
>
> AI プレイテストで以下のシナリオを実行して:
> 1. まず巡回が正しく動くことを確認 (10秒)
> 2. 敵を有効にして、NPC の反応を観察 (15秒)
> 3. スクリーンショットを 3 秒ごとに撮って

**AI の応答例:**
```
テストシーンを構築しました。AI プレイテストを開始します。

[0:00-0:10] 巡回フェーズ
  - PatrolGuard は WalkToPatrolPoint を繰り返し実行
  - 巡回ポイント A → B → C → D の順に移動
  - ゴール: Patrol が選択されている (敵なし)
  スクリーンショット: 4 枚撮影

[0:10] 敵を有効化
  - Enemy を (8, 0, 8) で有効化
  - PatrolGuard のセンサーが敵を検知

[0:10-0:12] ゴール切り替え
  - enemy_visible が true に変化
  - ゴール: EliminateThreat に切り替え (優先度 3)
  - プラン: DrawWeapon → RunToEnemy → AttackEnemy

[0:12-0:15] 戦闘フェーズ
  - DrawWeapon 実行 (0.5秒)
  - RunToEnemy 実行 -- 敵に向かって走行
  - AttackEnemy 実行 -- 攻撃モーション
  スクリーンショット: 5 枚撮影

[0:15-0:25] 戦闘終了後
  - enemy_alive が false に変化
  - ゴール: Patrol に復帰
  - 巡回を再開

テスト結果: 全シナリオ正常動作
```

## ステップ 7: 設計の反復

プレイテストの結果を踏まえて改善する。

**あなた:**
> 2 つ改善して:
> 1. 敵を見つけたらまず RadioAlert してから攻撃に移るようにしたい。AlertAllies の優先度を EliminateThreat より高くするか、EliminateThreat の前提条件に has_alerted を追加して
> 2. 攻撃後に巡回に戻るまでに 5 秒の警戒状態を入れて。ゴール "StayAlert" を追加して

**AI の応答例:**
```
設計を更新しました。

変更 1: EliminateThreat のアクション "ChaseEnemy" と "RunToEnemy" の preconditions に has_alerted: true を追加
  → 敵を見つけたら、まず RadioAlert を実行してから追跡に移る

変更 2: ゴール "StayAlert" を追加
  - 優先度: 1.5 (Patrol と EliminateThreat の間)
  - 条件: alert_timer_done: true
  - 有効化条件: enemy_alive: false, alert_timer_done: false

新しい行動フロー:
  平時: Patrol
  敵発見: RadioAlert → DrawWeapon → RunToEnemy → AttackEnemy
  戦闘後: StayAlert (5秒) → Patrol
```

**あなた:**
> plan_goap でもう一度確認して。敵が見えていて、まだ alert していない状態から。

**AI の応答例:**
```
GOAP プランナー出力:

ゴール: EliminateThreat { enemy_alive: false }

プラン (合計コスト: 7):
  1. RadioAlert [コスト 2]
     状態変化: has_alerted: false → true
  2. DrawWeapon [コスト 1]
     状態変化: weapon_drawn: false → true
  3. RunToEnemy [コスト 1]
     状態変化: enemy_in_range: false → true
  4. AttackEnemy [コスト 3]
     状態変化: enemy_alive: true → false

RadioAlert が自然にプランに組み込まれました。
has_alerted を precondition にしたことで、プランナーが自動的に
RadioAlert を先行アクションとして挿入しています。
```

## GOAP 設計のポイント

| 観点 | 指針 |
|-----|------|
| アクションの粒度 | 細かすぎると探索コストが増える。意味のある単位でまとめる |
| コスト設計 | 同じ効果を持つアクションのコスト差で行動の優先順位を制御する |
| ワールドステートの数 | 少ないほど探索が速い。本当に判断に必要な情報だけを入れる |
| ゴールの優先度 | 動的に変更することで状況適応的な AI になる |
| デバッグ | `plan_goap` で事前にプランを確認してから実行する。意図しないプランが出たら preconditions を見直す |

## 完成した定義の全体像

```
ワールドステート (7 変数):
  enemy_visible, enemy_in_range, enemy_alive,
  has_alerted, at_patrol_point, weapon_drawn, stamina_low

ゴール (4 つ):
  EliminateThreat [3], AlertAllies [2], StayAlert [1.5], Patrol [1]

アクション (6 つ):
  WalkToPatrolPoint, DrawWeapon, ChaseEnemy,
  RunToEnemy, AttackEnemy, RadioAlert

行動フロー:
  巡回 → 敵発見 → 警報 → 武器構え → 接近 → 攻撃 → 警戒 → 巡回
```

このベースを拡張して、扉を開ける、回復アイテムを使う、仲間と合流するといったアクションを追加していくことで、より複雑な NPC 行動が実現できる。アクションを追加するだけで、プランナーが自動的に組み合わせを導出してくれるのが GOAP の強みだ。
