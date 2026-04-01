---
sidebar_position: 4
title: "マルチエージェントで並列開発"
description: "HTTP API を使って複数の AI エージェントを同時に動かし、レベル構築・スクリプト・マテリアルを並列で進める"
---

# マルチエージェントで並列開発

OpenForge MCP の HTTP API を使えば、複数の AI エージェントが同時にゲームエンジンを操作できる。このチュートリアルでは、3 つのエージェントを Python スクリプトで同時に動かし、レベルジオメトリ・ゲームプレイスクリプト・マテリアルとライティングを並列で構築する。

## 前提

- OpenForge MCP の HTTP API モードを理解している（[HTTP API](/docs/advanced/http-api) 参照）
- Python 3.10 以上がインストール済み
- `requests` と `concurrent.futures` が使える環境
- Unity が起動し、OpenForge MCP に接続済み

## アーキテクチャ

```
Python オーケストレータ
    |
    +-- Agent 1 (レベルジオメトリ担当)  ──┐
    |                                      |
    +-- Agent 2 (スクリプト担当)         ──+──> HTTP API ──> OpenForge MCP ──> Unity
    |                                      |
    +-- Agent 3 (マテリアル/ライト担当)  ──┘
```

各エージェントは独立したスレッドで HTTP リクエストを送信する。OpenForge MCP 側のリクエストキューが競合を防ぐ。

## ステップ 1: HTTP API サーバーを起動する

```bash
python -m openforge_mcp --mode http --port 8769
```

起動確認:

```bash
curl http://localhost:8769/tools | python -m json.tool | head -20
```

```json
{
  "tools": [
    {
      "name": "list_tools",
      "description": "利用可能なツールの一覧を取得します"
    },
    {
      "name": "create_gameobject",
      "description": "Unity シーンに新しい GameObject を作成します"
    }
  ]
}
```

## ステップ 2: 基本的な API 呼び出し

まず curl で個別のツール呼び出しを確認する。

### オブジェクト作成

```bash
curl -X POST http://localhost:8769/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "create_gameobject",
    "parameters": {
      "name": "Floor",
      "type": "Plane",
      "position": {"x": 0, "y": 0, "z": 0},
      "scale": {"x": 10, "y": 1, "z": 10}
    }
  }'
```

レスポンス:

```json
{
  "success": true,
  "result": {
    "name": "Floor",
    "instance_id": 12340,
    "message": "GameObject 'Floor' を作成しました"
  }
}
```

### スクリプト作成

```bash
curl -X POST http://localhost:8769/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "create_script",
    "parameters": {
      "name": "PlayerController",
      "path": "Assets/Scripts/PlayerController.cs",
      "content": "using UnityEngine;\n\npublic class PlayerController : MonoBehaviour\n{\n    public float speed = 5f;\n    void Update()\n    {\n        float h = Input.GetAxis(\"Horizontal\");\n        float v = Input.GetAxis(\"Vertical\");\n        transform.Translate(new Vector3(h, 0, v) * speed * Time.deltaTime);\n    }\n}"
    }
  }'
```

## ステップ 3: Python オーケストレータを書く

3 つのエージェントを `concurrent.futures.ThreadPoolExecutor` で並列実行する。

```python
"""
multi_agent_build.py
3 つの AI エージェントでレベルを並列構築する
"""

import json
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

API_BASE = "http://localhost:8769"


def call_tool(tool_name: str, parameters: dict, agent_id: str = "") -> dict:
    """OpenForge MCP ツールを呼び出す"""
    url = f"{API_BASE}/call_tool"
    payload = {
        "tool_name": tool_name,
        "parameters": parameters,
    }
    try:
        resp = requests.post(url, json=payload, timeout=60)
        resp.raise_for_status()
        result = resp.json()
        print(f"  [{agent_id}] {tool_name}: {result.get('result', {}).get('message', 'OK')}")
        return result
    except requests.exceptions.RequestException as e:
        print(f"  [{agent_id}] {tool_name}: ERROR - {e}")
        return {"success": False, "error": str(e)}


# ============================================================
# Agent 1: レベルジオメトリ担当
# ============================================================
def agent_geometry():
    """床、壁、階段、柱などのジオメトリを構築する"""
    agent = "Geometry"
    print(f"[{agent}] 開始: レベルジオメトリ構築")

    # 床
    call_tool("create_gameobject", {
        "name": "Floor",
        "type": "Plane",
        "position": {"x": 0, "y": 0, "z": 0},
        "scale": {"x": 10, "y": 1, "z": 10},
    }, agent)

    # 壁 4 枚
    walls = [
        ("Wall_North", {"x": 0, "y": 2.5, "z": 50}, {"x": 100, "y": 5, "z": 0.5}),
        ("Wall_South", {"x": 0, "y": 2.5, "z": -50}, {"x": 100, "y": 5, "z": 0.5}),
        ("Wall_East", {"x": 50, "y": 2.5, "z": 0}, {"x": 0.5, "y": 5, "z": 100}),
        ("Wall_West", {"x": -50, "y": 2.5, "z": 0}, {"x": 0.5, "y": 5, "z": 100}),
    ]
    for name, pos, scale in walls:
        call_tool("create_gameobject", {
            "name": name,
            "type": "Cube",
            "position": pos,
            "scale": scale,
        }, agent)

    # 柱 4 本
    for i, (px, pz) in enumerate([(-20, -20), (-20, 20), (20, -20), (20, 20)]):
        call_tool("create_gameobject", {
            "name": f"Pillar_{i}",
            "type": "Cylinder",
            "position": {"x": px, "y": 3, "z": pz},
            "scale": {"x": 1, "y": 3, "z": 1},
        }, agent)

    # 階段
    for step in range(10):
        call_tool("create_gameobject", {
            "name": f"Stair_{step}",
            "type": "Cube",
            "position": {"x": 30, "y": step * 0.3, "z": -20 + step * 0.5},
            "scale": {"x": 3, "y": 0.3, "z": 0.5},
        }, agent)

    print(f"[{agent}] 完了")
    return "geometry_done"


# ============================================================
# Agent 2: ゲームプレイスクリプト担当
# ============================================================
def agent_scripts():
    """プレイヤーコントローラーとゲームロジックを作成する"""
    agent = "Scripts"
    print(f"[{agent}] 開始: スクリプト作成")

    # プレイヤーコントローラー
    player_script = """using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    public float walkSpeed = 5f;
    public float runSpeed = 10f;
    public float jumpForce = 8f;
    public float gravity = 20f;

    private CharacterController _cc;
    private Vector3 _velocity;

    void Start()
    {
        _cc = GetComponent<CharacterController>();
    }

    void Update()
    {
        float speed = Input.GetKey(KeyCode.LeftShift) ? runSpeed : walkSpeed;
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");

        Vector3 move = transform.right * h + transform.forward * v;
        _velocity.x = move.x * speed;
        _velocity.z = move.z * speed;

        if (_cc.isGrounded)
        {
            _velocity.y = 0f;
            if (Input.GetButtonDown("Jump"))
                _velocity.y = jumpForce;
        }

        _velocity.y -= gravity * Time.deltaTime;
        _cc.Move(_velocity * Time.deltaTime);
    }
}"""
    call_tool("create_script", {
        "name": "PlayerController",
        "path": "Assets/Scripts/PlayerController.cs",
        "content": player_script,
    }, agent)

    # ゲームマネージャー
    game_manager_script = """using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public int score;
    public float elapsedTime;
    public bool isGameActive = true;

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    void Update()
    {
        if (isGameActive)
            elapsedTime += Time.deltaTime;
    }

    public void AddScore(int points)
    {
        score += points;
        Debug.Log($"Score: {score}");
    }
}"""
    call_tool("create_script", {
        "name": "GameManager",
        "path": "Assets/Scripts/GameManager.cs",
        "content": game_manager_script,
    }, agent)

    # 収集アイテム
    collectible_script = """using UnityEngine;

public class Collectible : MonoBehaviour
{
    public int points = 10;
    public float rotateSpeed = 90f;

    void Update()
    {
        transform.Rotate(Vector3.up, rotateSpeed * Time.deltaTime);
    }

    void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Player"))
        {
            GameManager.Instance?.AddScore(points);
            Destroy(gameObject);
        }
    }
}"""
    call_tool("create_script", {
        "name": "Collectible",
        "path": "Assets/Scripts/Collectible.cs",
        "content": collectible_script,
    }, agent)

    print(f"[{agent}] 完了")
    return "scripts_done"


# ============================================================
# Agent 3: マテリアルとライティング担当
# ============================================================
def agent_materials():
    """マテリアルの作成とライティングの設定を行う"""
    agent = "Materials"
    print(f"[{agent}] 開始: マテリアルとライティング設定")

    # 床マテリアル
    call_tool("create_material", {
        "name": "M_Floor",
        "shader": "Universal Render Pipeline/Lit",
        "color": {"r": 0.85, "g": 0.82, "b": 0.75, "a": 1.0},
    }, agent)
    call_tool("set_material_property", {
        "material": "M_Floor",
        "properties": {"_Smoothness": 0.3, "_Metallic": 0.0},
    }, agent)

    # 壁マテリアル
    call_tool("create_material", {
        "name": "M_Wall",
        "shader": "Universal Render Pipeline/Lit",
        "color": {"r": 0.7, "g": 0.65, "b": 0.6, "a": 1.0},
    }, agent)

    # 柱マテリアル
    call_tool("create_material", {
        "name": "M_Pillar",
        "shader": "Universal Render Pipeline/Lit",
        "color": {"r": 0.5, "g": 0.5, "b": 0.55, "a": 1.0},
    }, agent)
    call_tool("set_material_property", {
        "material": "M_Pillar",
        "properties": {"_Smoothness": 0.6, "_Metallic": 0.2},
    }, agent)

    # マテリアル適用
    call_tool("set_material", {"target": "Floor", "material": "M_Floor"}, agent)
    for wall in ["Wall_North", "Wall_South", "Wall_East", "Wall_West"]:
        call_tool("set_material", {"target": wall, "material": "M_Wall"}, agent)
    for i in range(4):
        call_tool("set_material", {"target": f"Pillar_{i}", "material": "M_Pillar"}, agent)

    # ディレクショナルライト
    call_tool("create_light", {
        "name": "Sun",
        "type": "Directional",
        "intensity": 1.2,
        "color": {"r": 1.0, "g": 0.95, "b": 0.85},
        "rotation": {"x": 50, "y": -30, "z": 0},
    }, agent)

    # ポイントライト (柱の上)
    for i, (px, pz) in enumerate([(-20, -20), (-20, 20), (20, -20), (20, 20)]):
        call_tool("create_light", {
            "name": f"PillarLight_{i}",
            "type": "Point",
            "intensity": 5.0,
            "range": 15.0,
            "color": {"r": 1.0, "g": 0.85, "b": 0.6},
            "position": {"x": px, "y": 6.5, "z": pz},
        }, agent)

    print(f"[{agent}] 完了")
    return "materials_done"


# ============================================================
# メイン: オーケストレーション
# ============================================================
def main():
    start = time.time()
    print("=== マルチエージェントビルド開始 ===\n")

    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {
            executor.submit(agent_geometry): "Geometry",
            executor.submit(agent_scripts): "Scripts",
            executor.submit(agent_materials): "Materials",
        }

        results = {}
        for future in as_completed(futures):
            agent_name = futures[future]
            try:
                result = future.result()
                results[agent_name] = result
            except Exception as e:
                print(f"[{agent_name}] 例外発生: {e}")
                results[agent_name] = f"error: {e}"

    elapsed = time.time() - start
    print(f"\n=== 全エージェント完了 ({elapsed:.1f}秒) ===")
    print(f"結果: {json.dumps(results, ensure_ascii=False, indent=2)}")

    # --- フェーズ 2: 依存関係のある後続タスク ---
    print("\n=== フェーズ 2: 統合タスク ===")

    # スクリプトをオブジェクトに適用 (ジオメトリとスクリプトの両方が完了した後)
    if results.get("Geometry") == "geometry_done" and results.get("Scripts") == "scripts_done":
        # プレイヤーオブジェクト作成 + スクリプト適用
        call_tool("create_gameobject", {
            "name": "Player",
            "type": "Capsule",
            "position": {"x": 0, "y": 1, "z": 0},
        }, "Integrate")
        call_tool("add_component", {
            "target": "Player",
            "component": "PlayerController",
        }, "Integrate")
        call_tool("add_component", {
            "target": "Player",
            "component": "CharacterController",
        }, "Integrate")

        # GameManager
        call_tool("create_gameobject", {
            "name": "GameManager",
            "type": "Empty",
        }, "Integrate")
        call_tool("add_component", {
            "target": "GameManager",
            "component": "GameManager",
        }, "Integrate")

    # スクリーンショット
    call_tool("take_screenshot", {
        "width": 1920,
        "height": 1080,
    }, "Integrate")

    print("\n=== ビルド完了 ===")


if __name__ == "__main__":
    main()
```

## ステップ 4: 実行

```bash
pip install requests
python multi_agent_build.py
```

出力例:

```
=== マルチエージェントビルド開始 ===

[Geometry] 開始: レベルジオメトリ構築
[Scripts] 開始: スクリプト作成
[Materials] 開始: マテリアルとライティング設定
  [Geometry] create_gameobject: GameObject 'Floor' を作成しました
  [Scripts] create_script: スクリプト 'PlayerController' を作成しました
  [Materials] create_material: マテリアル 'M_Floor' を作成しました
  [Geometry] create_gameobject: GameObject 'Wall_North' を作成しました
  [Materials] set_material_property: プロパティを設定しました
  ...
[Scripts] 完了
[Materials] 完了
[Geometry] 完了

=== 全エージェント完了 (8.3秒) ===
結果: {
  "Scripts": "scripts_done",
  "Materials": "materials_done",
  "Geometry": "geometry_done"
}

=== フェーズ 2: 統合タスク ===
  [Integrate] create_gameobject: GameObject 'Player' を作成しました
  [Integrate] add_component: コンポーネント 'PlayerController' を追加しました
  ...

=== ビルド完了 ===
```

## 競合回避の設計

マルチエージェントで最も注意すべきは、同じオブジェクトへの同時書き込みだ。

### 原則: 担当領域を分ける

| エージェント | 担当する操作 | 触るオブジェクト |
|------------|------------|----------------|
| Geometry | create_gameobject, set_transform | Floor, Wall_*, Pillar_*, Stair_* |
| Scripts | create_script | Assets/Scripts/ 以下のファイル |
| Materials | create_material, create_light, set_material | M_*, Sun, PillarLight_* |

同じオブジェクトを複数エージェントが操作する場合（例: Geometry が作ったオブジェクトに Materials がマテリアルを適用する）は、フェーズを分けて依存関係を明示する。

### リクエストキューの動作

OpenForge MCP の HTTP API はリクエストキューを持っている。同時に到着したリクエストは順次処理される。これにより、個々のツール呼び出しレベルではアトミック性が保証される。

ただし、複数のツール呼び出しにまたがるトランザクション（例: オブジェクト作成 + コンポーネント追加 + プロパティ設定を一括で行いたい場合）は、呼び出し間に他のエージェントのリクエストが割り込む可能性がある。

### 対策: 依存タスクはシリアルに実行する

```python
# 悪い例: 依存関係のある操作を並列で実行
executor.submit(create_player)      # Player オブジェクト作成
executor.submit(attach_controller)  # Player にスクリプト適用 (Player がまだ存在しない可能性)

# 良い例: 依存関係は直列で、独立した作業は並列で
def create_player_with_controller():
    call_tool("create_gameobject", {"name": "Player", ...})  # 先に作る
    call_tool("add_component", {"target": "Player", ...})    # 次に適用する
```

## 高度な例: タスクキューによるオーケストレーション

大規模なプロジェクトでは、タスクの依存関係を明示的に管理する。

```python
from dataclasses import dataclass, field
from typing import Callable

@dataclass
class Task:
    name: str
    agent: str
    fn: Callable
    depends_on: list[str] = field(default_factory=list)
    done: bool = False

class TaskQueue:
    def __init__(self):
        self.tasks: dict[str, Task] = {}

    def add(self, task: Task):
        self.tasks[task.name] = task

    def get_ready_tasks(self) -> list[Task]:
        """依存タスクが全て完了しているタスクを返す"""
        ready = []
        for task in self.tasks.values():
            if task.done:
                continue
            deps_met = all(
                self.tasks[dep].done
                for dep in task.depends_on
                if dep in self.tasks
            )
            if deps_met:
                ready.append(task)
        return ready

    def run_all(self, max_workers: int = 3):
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            while not all(t.done for t in self.tasks.values()):
                ready = self.get_ready_tasks()
                if not ready:
                    time.sleep(0.1)
                    continue

                futures = {}
                for task in ready:
                    futures[executor.submit(task.fn)] = task

                for future in as_completed(futures):
                    task = futures[future]
                    try:
                        future.result()
                        task.done = True
                        print(f"[完了] {task.name}")
                    except Exception as e:
                        print(f"[失敗] {task.name}: {e}")
                        task.done = True  # 失敗しても進める (要件に応じて変更)


# 使用例
queue = TaskQueue()
queue.add(Task("geometry", "Agent1", agent_geometry))
queue.add(Task("scripts", "Agent2", agent_scripts))
queue.add(Task("materials", "Agent3", agent_materials, depends_on=["geometry"]))
queue.add(Task("integrate", "Agent1", lambda: integrate_all(), depends_on=["geometry", "scripts", "materials"]))
queue.run_all()
```

この構造なら、materials は geometry の完了を待ってから実行される（マテリアル適用先のオブジェクトが存在することが保証される）。
