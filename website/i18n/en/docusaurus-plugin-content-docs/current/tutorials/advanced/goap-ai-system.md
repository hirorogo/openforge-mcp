---
sidebar_position: 2
title: "Building NPC AI with GOAP"
description: "Use Goal-Oriented Action Planning to build a patrol guard NPC that patrols, chases, and raises alerts"
---

# Building NPC AI with GOAP

GOAP (Goal-Oriented Action Planning) is an AI technique that defines NPC behavior through combinations of "goals" and "actions." Unlike state machines, the planner automatically derives action sequences to reach a goal, enabling complex behavior patterns with minimal definitions.

This tutorial uses OpenForge MCP tools to build a patrol guard NPC.

## GOAP Basic Structure

```
World State (current state)
    +
Goal (desired state)
    +
Actions (preconditions + effects + cost)
    |
    v
Planner derives the optimal action sequence
```

- **World State**: Key-value pairs representing the state of the world (e.g., `enemy_visible: true`)
- **Goal**: A subset of the world state you want to achieve (e.g., `area_secure: true`)
- **Action**: Can be executed when preconditions are met; execution changes the world state

## Step 1: Define the World State

First, define the world states that the guard NPC will recognize.

**You:**
> Set up a GOAP system with the following world states:
> - enemy_visible: bool (is an enemy in line of sight)
> - enemy_in_range: bool (is an enemy within attack range)
> - enemy_alive: bool (is the enemy alive)
> - has_alerted: bool (has the guard raised the alarm)
> - at_patrol_point: bool (is the guard at a patrol point)
> - weapon_drawn: bool (is the weapon drawn)
> - stamina_low: bool (is stamina low)

**AI Response Example:**
```
Defined the GOAP world state.
Added GoapAgent component to NPC "PatrolGuard".

Initial world state:
  enemy_visible: false
  enemy_in_range: false
  enemy_alive: false
  has_alerted: false
  at_patrol_point: false
  weapon_drawn: false
  stamina_low: false
```

## Step 2: Define Goals

Set up 3 goals (with priorities) for the guard.

**You:**
> Define the following goals. Higher priority numbers are more important:
>
> 1. Patrol (priority: 1)
>    - Condition: at_patrol_point = true
>    - Activation condition: enemy_visible = false
>
> 2. EliminateThreat (priority: 3)
>    - Condition: enemy_alive = false
>    - Activation condition: enemy_visible = true
>
> 3. AlertAllies (priority: 2)
>    - Condition: has_alerted = true
>    - Activation condition: enemy_visible = true, has_alerted = false

**AI Response Example:**
```
Set 3 goals for PatrolGuard.

Goal list:
  [Priority 3] EliminateThreat: { enemy_alive: false }
  [Priority 2] AlertAllies: { has_alerted: true }
  [Priority 1] Patrol: { at_patrol_point: true }

Goal selection logic:
  - If enemy is visible, EliminateThreat takes highest priority
  - If alert hasn't been raised yet, AlertAllies takes priority
  - During peacetime, Patrol is active
```

## Step 3: Define Actions

Set preconditions, effects, and cost for each action.

**You:**

```text
Define the following actions:

WalkToPatrolPoint:
  preconditions: (none)
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
> Also add a new action called RunToEnemy. Preconditions: enemy_visible and weapon_drawn are true, stamina_low is false. Effect: enemy_in_range becomes true. Cost 1.

**AI Response Example:**
```
Defined 6 actions.

Action list:
  WalkToPatrolPoint  [Cost 1] {} -> { at_patrol_point: true }
  DrawWeapon         [Cost 1] { weapon_drawn: false } -> { weapon_drawn: true }
  ChaseEnemy         [Cost 2] { enemy_visible, weapon_drawn } -> { enemy_in_range: true }
  AttackEnemy        [Cost 3] { enemy_in_range, weapon_drawn } -> { enemy_alive: false }
  RadioAlert         [Cost 2] { enemy_visible } -> { has_alerted: true }
  RunToEnemy         [Cost 1] { enemy_visible, weapon_drawn, !stamina_low } -> { enemy_in_range: true }
```

## Step 4: Verify Plans with the Planner

Use the `plan_goap` tool to check planner output. Given a world state and goal, it returns the optimal action sequence.

**You:**
> Run plan_goap. Show me the plan for the EliminateThreat goal with this state:
> World state:
>   enemy_visible: true
>   enemy_in_range: false
>   enemy_alive: true
>   has_alerted: false
>   at_patrol_point: true
>   weapon_drawn: false
>   stamina_low: false

**AI Response Example:**
```
GOAP Planner output:

Goal: EliminateThreat { enemy_alive: false }

Plan (total cost: 5):
  1. DrawWeapon [Cost 1]
     State change: weapon_drawn: false -> true
  2. RunToEnemy [Cost 1]
     State change: enemy_in_range: false -> true
     (RunToEnemy selected over ChaseEnemy [Cost 2] due to lower cost)
  3. AttackEnemy [Cost 3]
     State change: enemy_alive: true -> false

Search nodes: 12
Computation time: 0.3ms
```

Both RunToEnemy and ChaseEnemy achieve `enemy_in_range`, but RunToEnemy is selected because of its lower cost. However, when `stamina_low: true`, RunToEnemy's preconditions are not met, so ChaseEnemy is selected instead.

**You:**
> Set stamina_low to true and run the same plan again.

**AI Response Example:**
```
GOAP Planner output:

Goal: EliminateThreat { enemy_alive: false }

Plan (total cost: 6):
  1. DrawWeapon [Cost 1]
  2. ChaseEnemy [Cost 2]  <- instead of RunToEnemy
  3. AttackEnemy [Cost 3]

RunToEnemy excluded: precondition stamina_low: false not met.
```

## Step 5: Check the AlertAllies Goal Plan

**You:**
> Show me the AlertAllies goal plan too. Same world state (set stamina_low back to false).

**AI Response Example:**
```
GOAP Planner output:

Goal: AlertAllies { has_alerted: true }

Plan (total cost: 2):
  1. RadioAlert [Cost 2]
     State change: has_alerted: false -> true

Search nodes: 3
Computation time: 0.1ms
```

## Step 6: Verify Behavior with AI Playtest

Run the scene and observe the NPC's behavior.

**You:**
> Create a test scene:
> - Large room (20m x 20m)
> - Place PatrolGuard at the center
> - Place 4 patrol points at the room corners
> - Place an enemy (red Capsule) at (8, 0, 8), initially disabled
>
> Run an AI playtest with the following scenario:
> 1. First verify patrol works correctly (10 seconds)
> 2. Enable the enemy and observe NPC reaction (15 seconds)
> 3. Take screenshots every 3 seconds

**AI Response Example:**
```
Built the test scene. Starting AI playtest.

[0:00-0:10] Patrol Phase
  - PatrolGuard repeatedly executes WalkToPatrolPoint
  - Moves through patrol points A -> B -> C -> D
  - Goal: Patrol is selected (no enemy)
  Screenshots: 4 captured

[0:10] Enemy enabled
  - Enemy activated at (8, 0, 8)
  - PatrolGuard sensor detects enemy

[0:10-0:12] Goal Switch
  - enemy_visible changed to true
  - Goal: switched to EliminateThreat (priority 3)
  - Plan: DrawWeapon -> RunToEnemy -> AttackEnemy

[0:12-0:15] Combat Phase
  - DrawWeapon executed (0.5s)
  - RunToEnemy executed -- running toward enemy
  - AttackEnemy executed -- attack animation
  Screenshots: 5 captured

[0:15-0:25] Post-combat
  - enemy_alive changed to false
  - Goal: reverted to Patrol
  - Resumed patrolling

Test result: All scenarios functioning correctly
```

## Step 7: Iterative Design

Refine based on playtest results.

**You:**
> Make 2 improvements:
> 1. I want the guard to RadioAlert first before attacking when spotting an enemy. Either make AlertAllies higher priority than EliminateThreat, or add has_alerted as a precondition for EliminateThreat.
> 2. Add a 5-second alert state before returning to patrol after combat. Add a "StayAlert" goal.

**AI Response Example:**
```
Updated the design.

Change 1: Added has_alerted: true to the preconditions of "ChaseEnemy" and "RunToEnemy" actions
  -> When spotting an enemy, the guard will execute RadioAlert first before giving chase

Change 2: Added goal "StayAlert"
  - Priority: 1.5 (between Patrol and EliminateThreat)
  - Condition: alert_timer_done: true
  - Activation condition: enemy_alive: false, alert_timer_done: false

New behavior flow:
  Peacetime: Patrol
  Enemy spotted: RadioAlert -> DrawWeapon -> RunToEnemy -> AttackEnemy
  Post-combat: StayAlert (5 seconds) -> Patrol
```

**You:**
> Run plan_goap again. Starting state: enemy visible, alert not yet raised.

**AI Response Example:**
```
GOAP Planner output:

Goal: EliminateThreat { enemy_alive: false }

Plan (total cost: 7):
  1. RadioAlert [Cost 2]
     State change: has_alerted: false -> true
  2. DrawWeapon [Cost 1]
     State change: weapon_drawn: false -> true
  3. RunToEnemy [Cost 1]
     State change: enemy_in_range: false -> true
  4. AttackEnemy [Cost 3]
     State change: enemy_alive: true -> false

RadioAlert was naturally incorporated into the plan.
By making has_alerted a precondition, the planner automatically
inserts RadioAlert as a prerequisite action.
```

## GOAP Design Guidelines

| Aspect | Guideline |
|--------|-----------|
| Action granularity | Too fine-grained increases search cost. Group actions into meaningful units |
| Cost design | Use cost differences between actions with the same effect to control behavior priority |
| World state count | Fewer states mean faster search. Include only information truly needed for decisions |
| Goal priorities | Changing priorities dynamically creates situationally adaptive AI |
| Debugging | Verify plans with `plan_goap` before execution. If unexpected plans appear, review preconditions |

## Completed Definition Overview

```
World State (7 variables):
  enemy_visible, enemy_in_range, enemy_alive,
  has_alerted, at_patrol_point, weapon_drawn, stamina_low

Goals (4):
  EliminateThreat [3], AlertAllies [2], StayAlert [1.5], Patrol [1]

Actions (6):
  WalkToPatrolPoint, DrawWeapon, ChaseEnemy,
  RunToEnemy, AttackEnemy, RadioAlert

Behavior flow:
  Patrol -> Enemy spotted -> Alert -> Draw weapon -> Approach -> Attack -> Alert stance -> Patrol
```

By extending this base with actions like opening doors, using healing items, or regrouping with allies, more complex NPC behaviors become possible. The strength of GOAP is that you only need to add actions, and the planner automatically derives the combinations.
