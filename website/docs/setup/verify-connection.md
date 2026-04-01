---
sidebar_position: 6
title: "接続を確認する"
---

# 接続を確認する -- 「本当に繋がっていますか?」

MCPツールは**インストールしただけでは動きません**。AIクライアントとMCPサーバーが正しく接続されて、初めてAIがツールを使えるようになります。

この確認を怠ると、AIは「目と手を持っているのに使えない」状態で作業することになります。コンパイルエラーを何度も出す、存在しないAPIを推測で書く -- そういった問題の原因は、AIの能力不足ではなく**接続の問題**であることが多いです。

---

## 30秒でできる確認方法

AIクライアント (Claude Desktop, Cursor, VS Code など) を開いて、こう聞いてください:

```
あなたが今使えるMCPサーバーとツールを全部リストアップして
```

**正常な場合の応答例:**

```
利用可能なMCPサーバー: openforge-mcp
ツール: list_categories, list_tools, execute
カテゴリ: scene, gameobject, material, script, ...
```

**繋がっていない場合の応答例:**

```
MCPツールは利用できません
```

もしツールが出てこなければ、以下を確認してください。

---

## MCPの3層構造を理解する

MCPが動くには、3つの層が全て正しく接続されている必要があります。

```
┌─────────────────────────┐
│  AI モデル               │  Claude / GPT / Gemini
│  「考える」だけの存在     │  MCPのことは何も知らない
└────────────┬────────────┘
             │
┌────────────┴────────────┐
│  AI クライアント          │  Claude Desktop / Cursor / VS Code
│  「どのMCPに繋ぐか」     │  ← ここに設定が必要
│  を決める存在            │
└────────────┬────────────┘
             │
┌────────────┴────────────┐
│  MCP サーバー            │  OpenForge MCP
│  「何ができるか」        │  インストールしただけでは
│  を提供する存在          │  上の層に繋がらない
└─────────────────────────┘
```

よくある失敗パターン:
- Unity にプラグインを入れた → でも AI クライアントの設定ファイルに MCP サーバーが書かれていない
- MCP サーバーが起動している → でも AI クライアントが別のプロセスを見ている
- 設定ファイルに書いた → でもパスが間違っている (Mac のパスが Windows に入っている等)

---

## AI クライアント別の設定ファイル確認

| AI クライアント | 設定ファイルの場所 |
|---------------|----------------|
| Claude Desktop (Mac) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Win) | `%APPDATA%/Claude/claude_desktop_config.json` |
| Claude Desktop (Linux) | `~/.config/Claude/claude_desktop_config.json` |
| Cursor | `~/.cursor/mcp.json` |
| VS Code | `.vscode/mcp.json` (プロジェクトレベル) |
| Claude Code | `.mcp.json` (プロジェクト) or `~/.claude/settings.json` (グローバル) |
| LM Studio | `~/.lmstudio/mcp.json` |

:::warning 設定ファイルが正しい場所にあるか確認
OpenForge の `npx openforge-mcp setup` は自動検出して書き込みますが、念のため手動でも確認してください。
:::

---

## 設定ファイルの中身を確認する

正しい設定例 (Claude Desktop / Cursor):

```json
{
  "mcpServers": {
    "openforge": {
      "command": "node",
      "args": ["/path/to/openforge-mcp/packages/mcp-server/dist/index.js"],
      "env": {}
    }
  }
}
```

VS Code の場合 (キーが `"servers"` であることに注意):

```json
{
  "servers": {
    "openforge": {
      "command": "node",
      "args": ["/path/to/openforge-mcp/packages/mcp-server/dist/index.js"],
      "env": {}
    }
  }
}
```

:::tip 自動セットアップを使う
```bash
npx openforge-mcp setup
```
このコマンドが正しい設定を自動で書き込みます。手動編集で迷ったらこれを実行してください。
:::

---

## チェックリスト

問題が起きたら、上から順に確認:

### 1. Node.js は入っている?
```bash
node -v
```
バージョン番号が出ればOK。出なければ [Node.js をインストール](./prerequisites/node-install.md)。

### 2. OpenForge のセットアップは完了している?
```bash
npx openforge-mcp setup
```
`[OK]` が表示されればOK。

### 3. AI クライアントを再起動した?
設定ファイルを変更した後は、AI クライアントを**完全に終了して再起動**する必要があります。

### 4. Unity / Blender のプラグインは起動している?
- Unity: `Tools > OpenForge > Setup` で「Connected」と表示されているか
- Blender: N パネルの「OpenForge」タブで「Running」と表示されているか

### 5. ポートが競合していない?
OpenForge が使うポート:
- Unity: 19800
- Blender: 19801
- Godot: 19802
- HTTP API: 19810
- Dashboard: 19821

他のアプリが同じポートを使っていると接続できません。

### 6. ファイアウォールがブロックしていない?
localhost の通信がファイアウォールでブロックされている場合があります。

---

## それでも動かない場合

### HTTP API で直接テスト
```bash
curl http://localhost:19810/api/status
```

レスポンスが返ってくれば MCP サーバーは動いています。返ってこなければサーバーが起動していません。

### ログを確認
Unity のコンソール (Window > Console) に OpenForge 関連のメッセージが出ていないか確認してください。

### 一から再セットアップ
```bash
npx openforge-mcp setup
```
AI クライアントを完全に終了 → 再起動。

---

## まとめ

- MCP は「インストール」と「接続」が別の作業
- AI が能力を発揮するには 3 層全てが正しく繋がっている必要がある
- 「AI がエラーばかり出す」時は、AI の問題ではなく接続の問題かもしれない
- 確認方法: AI に「使えるツールを教えて」と聞く
