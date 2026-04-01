---
sidebar_position: 2
title: ツールモード
---

# ツールモード

OpenForge MCP は 3 つのツールモードを提供しており、使用する AI クライアントやモデルの能力に応じて最適なモードを選択できます。

## モード一覧

| モード | 公開ツール数 | トークン消費 | 推奨環境 |
|---|---|---|---|
| **Full** | すべてのツール（100以上） | 大 | 大規模モデル向け、デバッグ用途 |
| **Essential** | 主要ツールのみ（約20） | 中 | バランス重視の利用 |
| **Dynamic**（既定） | 3 メタツール | 小 | 通常利用、ローカル LLM |

## Full モード

すべてのツールを AI クライアントに直接公開します。AI はツール一覧からそのまま選択して呼び出せるため、最もシンプルな動作です。

**メリット:**
- ツールの呼び出しが 1 ステップで完了する
- AI がすべてのツールとパラメータを事前に把握できる

**デメリット:**
- 毎回のリクエストで大量のトークンを消費する
- ローカル LLM ではコンテキストウィンドウを圧迫する

**推奨ケース:**
- API 利用料金を気にしない場合
- すべてのツールを頻繁に使う開発作業

## Essential モード

よく使われる主要ツールだけを公開します。シーン操作、オブジェクト作成、マテリアル設定、スクリーンショットなど、日常的な作業に必要なツールが含まれます。

**メリット:**
- トークン消費と利便性のバランスが良い
- 多くのユースケースをカバーできる

**デメリット:**
- 高度なツール（NavMesh、VFX、Terrain など）は直接呼び出せない

**推奨ケース:**
- 基本的なシーン構築やモデリング作業
- トークン消費をある程度抑えたい場合

## Dynamic モード（既定）

3 つのメタツール（`list_tools`、`get_tool_schema`、`call_tool`）だけを公開します。AI は必要に応じてツール情報を取得し、動的にツールを呼び出します。

**メリット:**
- トークン消費が最小
- ツール数が増えてもコンテキストサイズが変わらない
- ローカル LLM でも快適に動作する

**デメリット:**
- ツール呼び出しに 2〜3 ステップ必要（一覧取得 → スキーマ取得 → 実行）
- AI がメタツールの使い方を理解する必要がある

**推奨ケース:**
- 通常の利用（既定モード）
- ローカル LLM を使用する場合
- API コストを最適化したい場合

## モードの切り替え方法

### 環境変数で指定

```bash
# Dynamic モード（既定）
export OPENFORGE_TOOL_MODE=dynamic

# Essential モード
export OPENFORGE_TOOL_MODE=essential

# Full モード
export OPENFORGE_TOOL_MODE=full
```

### AI クライアントの設定ファイルで指定

Claude Desktop の `claude_desktop_config.json` の場合:

```json
{
  "mcpServers": {
    "openforge": {
      "command": "uvx",
      "args": ["openforge-mcp"],
      "env": {
        "OPENFORGE_TOOL_MODE": "essential"
      }
    }
  }
}
```

### 起動引数で指定

```bash
uvx openforge-mcp --tool-mode essential
```

## ローカル LLM での利用

ローカル LLM を使用する場合、コンテキストウィンドウが限られるため **Dynamic モード** を強く推奨します。

### LM Studio での設定

1. LM Studio を起動し、MCP 対応モデルをロードする
2. OpenForge MCP サーバーを HTTP モードで起動する

```bash
uvx openforge-mcp --transport http --port 8080
```

3. LM Studio の MCP 設定で、サーバー URL を指定する

```
http://localhost:8080
```

### Ollama での設定

1. Ollama で MCP 対応モデルを起動する

```bash
ollama run qwen3
```

2. MCP クライアント経由で OpenForge MCP に接続する。Ollama 単体では MCP を直接サポートしていないため、MCP 対応のクライアントアプリケーション（例: Open WebUI など）を併用します。

3. OpenForge MCP を HTTP モードで起動する

```bash
uvx openforge-mcp --transport http --port 8080
```

### ローカル LLM 向けのヒント

- **Dynamic モード** を使用して、トークン消費を最小化する
- コンテキストウィンドウが小さいモデルでは、一度に多くのツールを連続呼び出しせず、1 つずつ実行する
- スクリーンショット機能はマルチモーダル対応モデルで特に有効
