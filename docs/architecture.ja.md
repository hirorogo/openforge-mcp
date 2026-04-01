English version: [architecture.md](architecture.md)

# アーキテクチャ

## 全体構成

```
AI Client (Claude Desktop, Cursor, etc.)
    |
    | MCP Protocol (stdio / SSE)
    v
OpenForge MCP Server (Node.js)
    |
    | JSON-RPC over TCP
    v
Unity Editor / Blender
```

## 3メタツール設計

数百のツールをそのままAIに公開するとトークンを大量消費します。OpenForge はツールを3つだけ登録します:

| ツール | 役割 |
|------|------|
| `list_categories` | 利用可能なツールカテゴリを表示 |
| `list_tools` | カテゴリ内のツールとパラメータを表示 |
| `execute` | 指定したツールを実行 |

AIは必要なときだけツール詳細を読み込みます。数百のツールがあってもコンテキストを圧迫しません。

## コンポーネント

| コンポーネント | 言語 | 役割 |
|-------------|------|------|
| MCP Server | TypeScript (Node.js) | MCP SDKでAIクライアントと通信 |
| Unity Plugin | C# | Unity Editor内でTCPサーバーを起動 |
| Blender Addon | Python | Blender内でTCPサーバーを起動 |

## 通信プロトコル

MCPサーバーとUnity/BlenderプラグインはJSON-RPC over TCPで通信します:

```json
// リクエスト (MCP Server -> Unity/Blender)
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "execute_tool",
  "params": {
    "tool": "create_gameobject",
    "args": {
      "name": "Player",
      "position": [0, 1, 0],
      "primitiveType": "Capsule"
    }
  }
}

// レスポンス (Unity/Blender -> MCP Server)
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true,
    "data": {
      "instanceId": 12345,
      "name": "Player",
      "path": "/Player"
    }
  }
}
```

## ポート設定

| サービス | デフォルトポート |
|---------|--------------|
| Unity Plugin | 19800 |
| Blender Addon | 19801 |
| HTTP API | 19810 |

環境変数またはセットアップUIで変更可能です。

## ツールモード

| モード | ツール数 | 対象 |
|------|---------|------|
| Full | 全ツール | Claude Desktop、クラウドモデル利用時 |
| Essential | 約80 (62%軽量) | LM Studio、Ollama等のローカルLLM |
| Dynamic | 基本8 + オンデマンド | VS Code (GitHub Copilot) |

```bash
npx openforge-mcp setup --mode essential --client lmstudio
```

## HTTP API（マルチエージェント対応）

自動化やCI/CD、複数AIの同時利用向けに、REST APIを提供しています (ポート19810):

```bash
# ツール実行
curl -X POST http://localhost:19810/api/execute \
  -H "Content-Type: application/json" \
  -d '{"target": "unity", "tool": "create_gameobject", "params": {"name": "Cube", "primitiveType": "Cube"}}'

# カテゴリ一覧
curl http://localhost:19810/api/categories

# カテゴリ内ツール一覧
curl http://localhost:19810/api/tools/scene

# 接続状態確認
curl http://localhost:19810/api/status
```

複数のAIエージェントが同時にUnity/Blenderにアクセス可能です。リクエストはキューイングされ、スレッドセーフに順次実行されます。

## プロジェクト構成

```
openforge-mcp/
  packages/
    mcp-server/           TypeScript MCP server + HTTP API
      src/
        index.ts          エントリポイント
        server.ts         MCPサーバー (SDK統合)
        router.ts         executeの振り分け
        registry.ts       ツールレジストリ (モード対応)
        http.ts           HTTP APIサーバー
        adapters/         Unity/Blender向けTCPクライアント
        tools/            ツール定義 (スキーマ)
    unity-plugin/         Unity Editor プラグイン (C#)
      Editor/
        OpenForgeServer.cs    TCPサーバー
        ToolExecutor.cs       ツール実行 + Undoグループ
        Tools/                ツール実装
        UI/                   セットアップ画面
    blender-addon/        Blender アドオン (Python)
      server.py           TCPサーバー
      tool_executor.py    ツール実行
      tools/              ツール実装
      ui_panel.py         Nパネル UI
```

## ソースからのビルド

**必要環境:** Node.js 18+, pnpm

```bash
git clone https://github.com/hirorogo/openforge-mcp.git
cd openforge-mcp
pnpm install
pnpm build
```

**テスト実行:**

```bash
# TypeScript (単体101 + 統合16テスト)
cd packages/mcp-server && npx vitest run

# Python (75テスト)
cd packages/blender-addon/tests && python -m pytest -v
```
