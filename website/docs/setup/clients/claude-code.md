---
sidebar_position: 4
---

# Claude Code CLI

このページでは、Claude Code CLI に OpenForge MCP を接続する方法を説明します。

---

## Claude Code とは

Claude Code は、Anthropic が提供するコマンドライン（CLI）ベースの AI ツールです。ターミナルから `claude` コマンドを実行するだけで、AI と会話しながら作業を進められます。MCP に対応しているため、OpenForge MCP と接続すると、ターミナルでの会話を通じて Unity や Blender などの3Dアプリを操作できるようになります。

---

## 事前準備

Claude Code がまだインストールされていない場合は、以下のコマンドでインストールしてください。

```bash
npm install -g @anthropic-ai/claude-code
```

インストールが完了したら、`claude --version` で動作確認できます。

---

## セットアップ方法

### 方法1: 自動セットアップ（おすすめ）

ターミナルで以下のコマンドを実行するだけで、設定が自動的に行われます。

```bash
npx openforge-mcp setup --client claude-code
```

「Setup complete」と表示されれば成功です。

### 方法2: 手動セットアップ

Claude Code は、プロジェクトディレクトリの `.mcp.json` ファイル、またはグローバル設定から MCP サーバーを自動的に検出します。

#### プロジェクト単位で設定する場合

プロジェクトのルートディレクトリに `.mcp.json` を作成して、以下の内容を入力します。

```json
{
  "mcpServers": {
    "openforge-mcp": {
      "command": "npx",
      "args": ["openforge-mcp", "start"]
    }
  }
}
```

#### グローバルに設定する場合

Claude Code の設定コマンドを使って、グローバルに MCP サーバーを追加できます。

```bash
claude mcp add openforge-mcp -- npx openforge-mcp start
```

このコマンドを実行すると、どのプロジェクトディレクトリからでも OpenForge MCP が利用可能になります。

---

## 使い方

ターミナルで `claude` コマンドを実行して、AI との会話を始めます。

```bash
claude
```

対話モードが開始されたら、自然な日本語で話しかけるだけで3Dアプリを操作できます。

### 使い方の例

以下は、Claude Code で OpenForge MCP を使った会話の例です。

```
$ claude

> Unity のシーンにあるオブジェクトを一覧表示して

OpenForge MCP のツールを使ってシーンを確認しますね。

[ツール呼び出し: list_scene_objects]

現在のシーンには以下のオブジェクトがあります:
- Main Camera
- Directional Light

> Cubeを位置 0, 2, 0 に作って

[ツール呼び出し: create_primitive]

Cube を位置 (0, 2, 0) に作成しました。

> 赤いマテリアルを作って、さっきのCubeに適用して

[ツール呼び出し: create_material]
[ツール呼び出し: apply_material]

赤いマテリアルを作成し、Cube に適用しました。
```

Claude Code では、複数のツール呼び出しを連続して行うことも可能です。複雑な操作もひとつの文章で指示するだけで、AI が必要なステップを順番に実行してくれます。

---

## 動作確認

Claude Code を起動して、以下のように入力してみてください。

> 「OpenForge MCP のツールカテゴリを一覧表示して」

ツールのカテゴリ一覧が返ってくれば、正しく接続されています。

また、以下のコマンドで登録されている MCP サーバーを確認することもできます。

```bash
claude mcp list
```

一覧に `openforge-mcp` が表示されていれば、設定は正しく行われています。

---

## トラブルシューティング

### 「openforge-mcp」が MCP サーバー一覧に表示されない

- `.mcp.json` がカレントディレクトリまたはその親ディレクトリにあるか確認してください
- グローバル設定を使う場合は、`claude mcp add` コマンドが正常に完了したか確認してください
- JSON の書式が正しいか確認してください

### ツールが呼び出されない

- Claude Code のバージョンが最新であることを確認してください: `npm update -g @anthropic-ai/claude-code`
- Node.js v18 以上がインストールされていることを確認してください: `node --version`

### 「npx: command not found」と表示される

Node.js がインストールされていない可能性があります。[nodejs.org](https://nodejs.org) から LTS 版をダウンロードしてインストールしてください。

### 接続が途中で切れる

Claude Code を一度終了（`Ctrl + C` または `/exit`）してから、もう一度 `claude` を実行してください。それでも解決しない場合は、以下のコマンドで OpenForge MCP が単体で動作するか確認してみてください。

```bash
npx openforge-mcp test
```

---

これで Claude Code のセットアップは完了です。何か問題がある場合は、[よくある質問](/docs/reference/faq)も参照してみてください。
