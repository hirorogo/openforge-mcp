---
sidebar_position: 6
title: "マルチエージェント"
description: "複数のAIエージェントを同時に使って、並列で作業を進める方法"
---

# マルチエージェント

OpenForge MCP の HTTP API モードを使うと、複数の AI エージェントが同時に同じアプリケーションにアクセスできる。このガイドでは、マルチエージェントの仕組みと活用方法を解説するよ。

## マルチエージェントとは

通常、OpenForge MCP は 1つの AI クライアントと 1対1 で接続する（stdio モード）。マルチエージェント構成では、HTTP API を通じて複数の AI エージェントが同時にリクエストを送れるようになる。

```
エージェントA（シーン構築担当）──┐
                                 ├──> HTTP API ──> OpenForge MCP ──> Unity
エージェントB（スクリプト担当）──┘                                 ──> Blender
```

### どんなときに使うのか

- 大規模なシーンを複数のエージェントで分担して構築したい
- シーン構築とスクリプト作成を並行して進めたい
- 自動化パイプラインに組み込んで、バッチ処理したい
- CI/CD からテストを自動実行したい

## HTTP API モードの起動

マルチエージェントには HTTP API モードが必要。以下のコマンドで起動する:

```bash
python -m openforge_mcp --mode http --port 8769
```

起動すると、`http://localhost:8769` で API リクエストを受け付ける状態になるよ。

:::info stdio モードとの違い
stdio モードは、AI クライアントが MCP サーバーを子プロセスとして起動する 1対1 の接続。HTTP API モードは、サーバーを独立したプロセスとして起動して、複数のクライアントからアクセスできる。詳しくは [HTTP API](./http-api.md) を参照してね。
:::

## リクエストキューとシリアライゼーション

複数のエージェントが同時にリクエストを送った場合、OpenForge MCP はリクエストキューを使って安全に処理する。

### 仕組み

1. 各エージェントからのリクエストがキューに追加される
2. キューから1つずつ取り出して、順番に処理される
3. 処理が完了したら、結果を該当のエージェントに返す
4. 次のリクエストを処理する

```
時間軸 ─────────────────────────────>

エージェントA: [リクエスト1]              [リクエスト3]
エージェントB:     [リクエスト2]                [リクエスト4]

キュー処理:   [1を処理][2を処理]    [3を処理][4を処理]
```

:::warning 同時書き込みの注意
2つのエージェントが同じオブジェクトを同時に変更しようとすると、後から処理されたリクエストが先の変更を上書きする可能性がある。担当するオブジェクトや領域を明確に分けることで、競合を防げるよ。
:::

### レスポンスの待機

リクエストは非同期で処理されるけど、各リクエストは完了まで HTTP 接続を維持する（同期レスポンス）。つまり、レスポンスが返ってきた時点で処理は完了しているよ。

## 活用例: シーン構築とスクリプト作成の並列実行

実際に2つのエージェントを使って、シーン構築とスクリプト作成を同時に進める例を見てみよう。

### 全体の流れ

1. エージェントA がシーン内のオブジェクトを構築する
2. エージェントB が C# スクリプトを作成する
3. エージェントA が構築したオブジェクトにスクリプトを適用する

### curl を使った例

まず、エージェントA がオブジェクトを作成する:

```bash
# エージェントA: 地面を作成
curl -X POST http://localhost:8769/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "create_gameobject",
    "parameters": {
      "name": "Ground",
      "type": "Plane",
      "position": {"x": 0, "y": 0, "z": 0},
      "scale": {"x": 10, "y": 1, "z": 10}
    }
  }'
```

同時に、エージェントB がスクリプトを作成する:

```bash
# エージェントB: プレイヤー制御スクリプトを作成
curl -X POST http://localhost:8769/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "create_script",
    "parameters": {
      "name": "PlayerController",
      "code": "using UnityEngine;\n\npublic class PlayerController : MonoBehaviour\n{\n    public float speed = 5f;\n\n    void Update()\n    {\n        float h = Input.GetAxis(\"Horizontal\");\n        float v = Input.GetAxis(\"Vertical\");\n        transform.Translate(new Vector3(h, 0, v) * speed * Time.deltaTime);\n    }\n}"
    }
  }'
```

エージェントA がプレイヤーオブジェクトを作成してスクリプトを適用する:

```bash
# エージェントA: プレイヤーを作成
curl -X POST http://localhost:8769/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "create_gameobject",
    "parameters": {
      "name": "Player",
      "type": "Capsule",
      "position": {"x": 0, "y": 1, "z": 0}
    }
  }'

# エージェントA: スクリプトを適用
curl -X POST http://localhost:8769/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "add_component",
    "parameters": {
      "object_name": "Player",
      "component_type": "PlayerController"
    }
  }'
```

## Python スクリプトによる自動化

curl を1つずつ実行するのは面倒なので、Python スクリプトで自動化してみよう。

```python
import requests
import concurrent.futures
import json

API_BASE = "http://localhost:8769"


def call_tool(tool_name: str, parameters: dict) -> dict:
    """OpenForge MCP のツールを呼び出す"""
    response = requests.post(
        f"{API_BASE}/call_tool",
        json={"tool_name": tool_name, "parameters": parameters},
    )
    response.raise_for_status()
    return response.json()


def list_tools(category: str = "") -> dict:
    """利用可能なツール一覧を取得する"""
    response = requests.post(
        f"{API_BASE}/list_tools",
        json={"category": category},
    )
    response.raise_for_status()
    return response.json()


def agent_scene_builder():
    """エージェントA: シーン構築を担当"""
    print("[A] 地面を作成中...")
    call_tool("create_gameobject", {
        "name": "Ground",
        "type": "Plane",
        "position": {"x": 0, "y": 0, "z": 0},
        "scale": {"x": 10, "y": 1, "z": 10},
    })

    print("[A] 壁を作成中...")
    walls = [
        {"name": "Wall_North", "pos": {"x": 0, "y": 1, "z": 50}},
        {"name": "Wall_South", "pos": {"x": 0, "y": 1, "z": -50}},
        {"name": "Wall_East", "pos": {"x": 50, "y": 1, "z": 0}},
        {"name": "Wall_West", "pos": {"x": -50, "y": 1, "z": 0}},
    ]
    for wall in walls:
        call_tool("create_gameobject", {
            "name": wall["name"],
            "type": "Cube",
            "position": wall["pos"],
            "scale": {"x": 100, "y": 2, "z": 1},
        })

    print("[A] シーン構築完了")


def agent_script_writer():
    """エージェントB: スクリプト作成を担当"""
    print("[B] PlayerController スクリプトを作成中...")
    call_tool("create_script", {
        "name": "PlayerController",
        "code": (
            "using UnityEngine;\n\n"
            "public class PlayerController : MonoBehaviour\n"
            "{\n"
            "    public float speed = 5f;\n\n"
            "    void Update()\n"
            "    {\n"
            '        float h = Input.GetAxis("Horizontal");\n'
            '        float v = Input.GetAxis("Vertical");\n'
            "        transform.Translate(new Vector3(h, 0, v) * speed * Time.deltaTime);\n"
            "    }\n"
            "}"
        ),
    })

    print("[B] ItemCollector スクリプトを作成中...")
    call_tool("create_script", {
        "name": "ItemCollector",
        "code": (
            "using UnityEngine;\n\n"
            "public class ItemCollector : MonoBehaviour\n"
            "{\n"
            "    public int score = 0;\n\n"
            "    void OnTriggerEnter(Collider other)\n"
            "    {\n"
            '        if (other.CompareTag("Collectible"))\n'
            "        {\n"
            "            score++;\n"
            "            Destroy(other.gameObject);\n"
            "        }\n"
            "    }\n"
            "}"
        ),
    })

    print("[B] スクリプト作成完了")


def main():
    # 2つのエージェントを並列実行
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        future_a = executor.submit(agent_scene_builder)
        future_b = executor.submit(agent_script_writer)

        # 両方の完了を待つ
        concurrent.futures.wait([future_a, future_b])

    # 両方完了後、スクリプトをオブジェクトに適用
    print("[統合] プレイヤーを作成してスクリプトを適用中...")
    call_tool("create_gameobject", {
        "name": "Player",
        "type": "Capsule",
        "position": {"x": 0, "y": 1, "z": 0},
    })
    call_tool("add_component", {
        "object_name": "Player",
        "component_type": "Rigidbody",
    })
    call_tool("add_component", {
        "object_name": "Player",
        "component_type": "PlayerController",
    })
    call_tool("add_component", {
        "object_name": "Player",
        "component_type": "ItemCollector",
    })

    print("すべての作業が完了しました")


if __name__ == "__main__":
    main()
```

このスクリプトを実行すると、シーン構築とスクリプト作成が並行して進む。両方が完了した後で、オブジェクトとスクリプトを統合するよ。

:::tip 依存関係の管理
並列実行するタスクは、お互いに依存しないようにするのが鍵。上の例では「シーン構築」と「スクリプト作成」は独立した作業なので並列にできる。「スクリプトの適用」はどちらにも依存するので、両方が完了してから実行しているよ。
:::

## ベストプラクティス

### 担当領域を明確に分ける

エージェント間で操作対象が重ならないようにしよう。

| エージェント | 担当 | 操作対象 |
|---|---|---|
| A | シーン構築 | オブジェクトの作成・配置 |
| B | スクリプト | C#スクリプトの生成 |
| C | マテリアル | テクスチャとマテリアルの設定 |

### エラーハンドリングを忘れない

マルチエージェントでは、1つのエージェントが失敗しても他のエージェントは動き続ける。エラー処理を適切に入れておこう。

```python
def safe_call_tool(tool_name: str, parameters: dict) -> dict:
    """エラーハンドリング付きのツール呼び出し"""
    try:
        result = call_tool(tool_name, parameters)
        if result.get("error"):
            print(f"ツールエラー: {result['error']}")
            return None
        return result
    except requests.exceptions.ConnectionError:
        print("接続エラー: MCPサーバーに接続できません")
        return None
    except requests.exceptions.Timeout:
        print("タイムアウト: 処理に時間がかかりすぎています")
        return None
```

### 処理の順序が重要な場合は同期する

並列実行が適さないケースもある。オブジェクトを作成してからコンポーネントを追加する、といった順序依存の処理は、必ず直列で実行しよう。

## まとめ

- HTTP API モードで、複数のエージェントから同時にアクセスできる
- リクエストキューにより、安全にシリアライズされて処理される
- 独立したタスクは並列に、依存するタスクは直列に実行する
- Python スクリプトで自動化パイプラインを構築できる
- 担当領域を分けて、競合を避けることが大切
