---
sidebar_position: 3
title: HTTP API
---

# HTTP API

OpenForge MCP は、stdio トランスポートに加えて HTTP トランスポートをサポートしています。HTTP モードを使うと、REST API 経由でツールを呼び出したり、複数のクライアントから同時に接続したりできます。

## サーバーの起動

```bash
# 既定ポート（8080）で起動
uvx openforge-mcp --transport http

# ポートを指定して起動
uvx openforge-mcp --transport http --port 3000

# ホストとポートを指定
uvx openforge-mcp --transport http --host 0.0.0.0 --port 3000
```

## REST API エンドポイント

### ツール一覧の取得

```
GET /tools
```

利用可能なすべてのツールを一覧取得します。

```bash
curl http://localhost:8080/tools
```

レスポンス例:

```json
{
  "tools": [
    {
      "name": "list_tools",
      "description": "利用可能なツールの一覧を取得します"
    },
    {
      "name": "get_tool_schema",
      "description": "指定したツールのパラメータスキーマを取得します"
    },
    {
      "name": "call_tool",
      "description": "指定したツールを実行します"
    }
  ]
}
```

### ツールスキーマの取得

```
GET /tools/:tool_name/schema
```

指定したツールのパラメータスキーマを取得します。

```bash
curl http://localhost:8080/tools/create_gameobject/schema
```

レスポンス例:

```json
{
  "name": "create_gameobject",
  "description": "Unity シーンに新しい GameObject を作成します",
  "parameters": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "オブジェクト名"
      },
      "type": {
        "type": "string",
        "enum": ["Empty", "Cube", "Sphere", "Cylinder", "Plane", "Capsule"],
        "description": "プリミティブ型"
      },
      "position": {
        "type": "object",
        "properties": {
          "x": {"type": "number"},
          "y": {"type": "number"},
          "z": {"type": "number"}
        }
      }
    },
    "required": ["name"]
  }
}
```

### ツールの実行

```
POST /tools/:tool_name
```

指定したツールを実行します。

```bash
curl -X POST http://localhost:8080/tools/create_gameobject \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyCube",
    "type": "Cube",
    "position": {"x": 0, "y": 1, "z": 0}
  }'
```

レスポンス例:

```json
{
  "success": true,
  "result": {
    "id": "a1b2c3d4",
    "name": "MyCube",
    "type": "Cube",
    "position": {"x": 0, "y": 1, "z": 0}
  }
}
```

### スクリーンショットの取得

```
POST /tools/take_screenshot
```

```bash
curl -X POST http://localhost:8080/tools/take_screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "width": 1920,
    "height": 1080
  }' \
  -o screenshot.png
```

### サーバーステータス

```
GET /health
```

サーバーの稼働状態と接続中のアプリケーションを確認します。

```bash
curl http://localhost:8080/health
```

レスポンス例:

```json
{
  "status": "ok",
  "connections": {
    "unity": true,
    "blender": false,
    "godot": false
  },
  "version": "0.5.0"
}
```

## マルチエージェント構成

HTTP モードでは、複数の AI クライアントが同じ OpenForge MCP サーバーに接続できます。これにより、マルチエージェント構成が可能になります。

```
エージェント A（シーン設計担当）──┐
                                ├──> OpenForge MCP サーバー ──> Unity
エージェント B（マテリアル担当）──┘        (HTTP)
```

### 構成例

1 つの OpenForge MCP サーバーを HTTP モードで起動し、複数のクライアントから接続します。

```bash
# サーバーを起動
uvx openforge-mcp --transport http --port 8080
```

各エージェントは同じエンドポイントに対してリクエストを送信します。排他制御はサーバー側で行われるため、同時リクエストによるデータ競合は発生しません。

## スクリプトとの統合

HTTP API を使えば、シェルスクリプトや Python スクリプトからツールを直接呼び出せます。

### シェルスクリプトの例

```bash
#!/bin/bash
# Unity シーンにオブジェクトを一括配置するスクリプト

SERVER="http://localhost:8080"

# 5 つのキューブを配置
for i in $(seq 0 4); do
  curl -s -X POST "$SERVER/tools/create_gameobject" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Cube_$i\",
      \"type\": \"Cube\",
      \"position\": {\"x\": $((i * 2)), \"y\": 0, \"z\": 0}
    }"
  echo ""
done
```

### Python スクリプトの例

```python
import requests

SERVER = "http://localhost:8080"

def call_tool(tool_name: str, params: dict) -> dict:
    response = requests.post(
        f"{SERVER}/tools/{tool_name}",
        json=params
    )
    return response.json()

# マテリアルを作成してオブジェクトに適用
call_tool("create_material", {
    "name": "RedMaterial",
    "color": {"r": 1, "g": 0, "b": 0, "a": 1}
})

call_tool("set_material", {
    "target": "MyCube",
    "material": "RedMaterial"
})
```

## CI/CD との統合

HTTP API を利用して、CI/CD パイプラインから Unity のビルドやシーン検証を自動化できます。

### GitHub Actions の例

```yaml
name: Scene Validation

on: [push]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start OpenForge MCP
        run: |
          uvx openforge-mcp --transport http --port 8080 &
          sleep 3

      - name: Validate scene objects
        run: |
          RESULT=$(curl -s http://localhost:8080/tools/get_scene_info)
          echo "$RESULT" | python -c "
          import sys, json
          data = json.load(sys.stdin)
          objects = data['result']['objects']
          assert len(objects) > 0, 'シーンにオブジェクトがありません'
          print(f'検証完了: {len(objects)} オブジェクト')
          "
```
