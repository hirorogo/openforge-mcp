---
sidebar_position: 5
---

# プロジェクト構成

## ディレクトリツリー

```
openforge-mcp/
├── packages/
│   ├── mcp-server/                    # MCP Server (TypeScript)
│   │   ├── src/
│   │   │   ├── index.ts               # CLI エントリポイント
│   │   │   ├── server.ts              # MCP Server 本体 (ツール登録もここ)
│   │   │   ├── router.ts              # execute の振り分け (unity/blender/godot)
│   │   │   ├── registry.ts            # ToolDefinition 型、モード管理
│   │   │   ├── http.ts                # HTTP API Server (port 19810)
│   │   │   ├── version-control.ts     # Git ベースのセーブ/ロード
│   │   │   ├── transaction.ts         # Undo グループ管理
│   │   │   ├── pipeline.ts            # Blender↔Unity ファイル転送
│   │   │   ├── recipe.ts              # YAML レシピ実行エンジン
│   │   │   ├── playtest.ts            # AI プレイテスト制御
│   │   │   ├── copilot.ts             # GitHub Copilot Dynamic Mode
│   │   │   ├── adapters/
│   │   │   │   ├── base.ts            # TCP クライアント基底クラス
│   │   │   │   ├── unity.ts           # Unity アダプタ (port 19800)
│   │   │   │   ├── blender.ts         # Blender アダプタ (port 19801)
│   │   │   │   └── godot.ts           # Godot アダプタ (port 19802)
│   │   │   ├── tools/
│   │   │   │   ├── unity/             # Unity ツール定義 (*.ts)
│   │   │   │   ├── blender/           # Blender ツール定義 (*.ts)
│   │   │   │   ├── godot/             # Godot ツール定義 (*.ts)
│   │   │   │   └── system/            # システムツール定義 (*.ts)
│   │   │   ├── cli/
│   │   │   │   ├── index.ts           # CLI ルーティング
│   │   │   │   ├── setup.ts           # npx openforge-mcp setup
│   │   │   │   └── vscode-config.ts   # VS Code 設定生成
│   │   │   └── __tests__/             # Vitest テスト
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── unity-plugin/                  # Unity Editor Plugin (C#)
│   │   ├── Editor/
│   │   │   ├── OpenForgeServer.cs     # TCP サーバー (port 19800)
│   │   │   ├── ToolExecutor.cs        # ツール登録・ディスパッチ・Undo管理
│   │   │   ├── Tools/                 # ツール実装 (1カテゴリ = 1ファイル)
│   │   │   └── UI/
│   │   │       └── SetupWindow.cs     # セットアップ UI
│   │   └── package.json               # UPM パッケージ定義
│   │
│   ├── blender-addon/                 # Blender Addon (Python)
│   │   ├── __init__.py                # アドオン登録
│   │   ├── server.py                  # TCP サーバー (port 19801)
│   │   ├── tool_executor.py           # ツール登録・ディスパッチ
│   │   ├── ui_panel.py                # N パネル UI
│   │   ├── tools/                     # ツール実装 (1カテゴリ = 1ファイル)
│   │   └── tests/                     # pytest テスト
│   │
│   └── godot-plugin/                  # Godot Plugin (GDScript)
│       └── addons/openforge/
│           ├── plugin.cfg
│           ├── plugin.gd              # EditorPlugin
│           ├── server.gd              # TCP サーバー (port 19802)
│           ├── tool_executor.gd       # ツールディスパッチ
│           └── tools/                 # ツール実装
│
├── website/                           # Docusaurus ドキュメントサイト
│   ├── docs/                          # マークダウンページ
│   ├── src/pages/index.tsx            # トップページ
│   └── docusaurus.config.ts           # サイト設定
│
├── README.md / README.ja.md
├── CONTRIBUTING.md / CONTRIBUTING.ja.md
└── LICENSE (MIT)
```

## 通信ポート

| サービス | ポート | プロトコル |
|---------|-------|----------|
| Unity Plugin | 19800 | JSON-RPC over TCP |
| Blender Addon | 19801 | JSON-RPC over TCP (length-prefixed) |
| Godot Plugin | 19802 | JSON-RPC over TCP (newline-delimited) |
| HTTP API | 19810 | REST (GET/POST) |

## データフロー

```
1. AI が "execute" ツールを呼ぶ
2. server.ts が router.ts に渡す
3. router.ts が target (unity/blender/godot) を見てアダプタを選択
4. アダプタが JSON-RPC リクエストを TCP で送信
5. エンジン側プラグインがリクエストを受信
6. tool_executor がツール名からハンドラを検索して実行
7. 結果を JSON-RPC レスポンスとして返す
8. server.ts が AI に返す
```

## モード管理 (registry.ts)

| モード | 動作 |
|-------|------|
| `full` | 全ツールが利用可能 |
| `essential` | `ESSENTIAL_TOOLS` セットに含まれるツールのみ |
| `dynamic` | `DYNAMIC_BASE_TOOLS` (8個) + オンデマンド読み込み |

`server.ts` の execute ハンドラ内で、dynamic モード時はツールが未ロードなら `registry.loadToolOnDemand()` が呼ばれます。

## テスト構成

| パッケージ | フレームワーク | 実行方法 |
|-----------|-------------|---------|
| mcp-server | Vitest | `npx vitest run` |
| blender-addon | pytest | `cd tests && python -m pytest -v` |
| unity-plugin | Unity Editor 内のみ | Play Mode Test Runner |
| godot-plugin | Godot 内のみ | -- |

## コードスタイル

| 言語 | ルール |
|------|-------|
| TypeScript | strict, ESM (`import/export`), `.js` 拡張子付きインポート |
| C# | `OpenForge.Editor.Tools` namespace, Undo 必須, main thread |
| Python | `TOOLS` dict, 型ヒント, `**kwargs` 受け取り |
| GDScript | `@tool`, static 関数, `Dictionary` 入出力 |
| 全言語共通 | 絵文字禁止, TODO 禁止, コメント最小限 |
