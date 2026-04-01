---
sidebar_position: 1
---

# 開発ガイド

OpenForge MCP にツールや機能を追加するための技術ガイドです。

## 環境構築

```bash
git clone https://github.com/hirorogo/openforge-mcp.git
cd openforge-mcp
pnpm install
pnpm build
```

テスト実行:

```bash
cd packages/mcp-server && npx vitest run    # TypeScript (166+ tests)
cd packages/blender-addon/tests && python -m pytest -v  # Python (75+ tests)
```

## アーキテクチャ概要

ツールを追加するには、**2箇所** にコードを書きます:

```
1. MCP Server (TypeScript)  -- ツールの定義 (名前、パラメータのスキーマ)
2. Editor Plugin (C#/Py/GD) -- ツールの実装 (実際の処理)
```

MCP Server がAIからリクエストを受け取り、TCP経由でEditor Pluginに転送します。
Editor Plugin が実際のAPI (Unity/Blender/Godot) を呼び出して結果を返します。

```
AI Client → MCP Server → TCP (JSON-RPC) → Editor Plugin → エンジンAPI
```

## ファイルの対応関係

| 実装 (エンジン側) | 定義 (MCP Server側) |
|------------------|-------------------|
| `unity-plugin/Editor/Tools/XxxTools.cs` | `mcp-server/src/tools/unity/xxx.ts` |
| `blender-addon/tools/xxx_tools.py` | `mcp-server/src/tools/blender/xxx.ts` |
| `godot-plugin/addons/openforge/tools/xxx_tools.gd` | `mcp-server/src/tools/godot/xxx.ts` |

## ツール定義のスキーマ (共通)

すべてのツール定義は `ToolDefinition` 型に従います:

```typescript
// packages/mcp-server/src/registry.ts
export interface ToolDefinition {
  name: string;          // ツール名 (snake_case)
  description: string;   // 説明 (英語)
  category: string;      // カテゴリ名
  target: 'unity' | 'blender' | 'godot';
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      default?: unknown;
    }>;
    required?: string[];
  };
}
```

## 登録フロー

1. ツール定義ファイルを作成 (`mcp-server/src/tools/xxx/`)
2. `mcp-server/src/server.ts` でインポートして `registry.registerTools()` を呼ぶ
3. エンジン側プラグインでハンドラを実装
4. エンジン側のディスパッチャに登録

各エンジンの具体的な手順は次のページを参照してください。
