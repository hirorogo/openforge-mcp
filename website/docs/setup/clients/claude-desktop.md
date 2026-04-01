---
sidebar_position: 1
---

# Claude Desktop

このページでは、Claude Desktop に OpenForge MCP を接続する方法を説明します。

---

## Claude Desktop とは

Claude Desktop は、Anthropic が提供するデスクトップ向けの AI チャットアプリです。テキストで会話するだけで、さまざまな作業を AI にお願いできます。MCP（Model Context Protocol）に対応しているため、OpenForge MCP と接続すると、会話を通じて Unity や Blender などの3Dアプリを操作できるようになります。

アプリのダウンロードは [claude.ai/download](https://claude.ai/download) から行えます。

---

## OpenForge MCP との接続の仕組み

Claude Desktop は、設定ファイル（JSON）に MCP サーバーの情報を書き込むことで外部ツールと接続します。OpenForge MCP の情報をこの設定ファイルに追加すると、Claude Desktop が起動時に自動的に OpenForge MCP サーバーを立ち上げて接続します。

---

## セットアップ方法

### 方法1: 自動セットアップ（おすすめ）

ターミナルで以下のコマンドを実行するだけで、設定ファイルが自動的に作成されます。

```bash
npx openforge-mcp setup --client claude-desktop
```

「Setup complete」と表示されれば成功です。このあと「動作確認」のセクションに進んでください。

### 方法2: 手動セットアップ

自動セットアップがうまくいかない場合や、設定ファイルを自分で編集したい場合は、以下の手順で進めてください。

#### 1. 設定ファイルの場所を確認する

設定ファイルの場所は OS によって異なります。

| OS | パス |
|---|---|
| Mac | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%/Claude/claude_desktop_config.json` |

:::tip ヒント
Windows の場合、エクスプローラーのアドレスバーに `%APPDATA%/Claude` と入力すると、そのフォルダに移動できます。
:::

#### 2. 設定ファイルを編集する

設定ファイルをテキストエディターで開き、以下の内容に書き換えて保存します。

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

:::warning 注意
すでに他の MCP サーバーの設定がある場合は、`"mcpServers"` の中に `"openforge-mcp"` のブロックだけを追記してください。ファイル全体を上書きしてしまうと、他の設定が消えてしまいます。

既存の設定に追記する場合の例:

```json
{
  "mcpServers": {
    "既存のサーバー": {
      "command": "...",
      "args": ["..."]
    },
    "openforge-mcp": {
      "command": "npx",
      "args": ["openforge-mcp", "start"]
    }
  }
}
```
:::

#### 3. Claude Desktop を再起動する

設定を反映するには、Claude Desktop を一度完全に終了してから、もう一度起動してください。タスクバーやメニューバーに残っている場合は、右クリックから「Quit」を選んで完全に終了してください。

---

## 動作確認

Claude Desktop を起動したあと、チャット入力欄の下に小さなハンマーのアイコンが表示されていれば、OpenForge MCP との接続が成功しています。

接続を確認するために、チャット欄に以下のように入力してみてください。

> 「Unity のツールカテゴリを一覧表示して」

OpenForge MCP が提供するツールのカテゴリ一覧が返ってくれば、正しく接続されています。

---

## 使い方の例

接続が完了したら、日本語で自然に話しかけるだけで3Dアプリを操作できます。

以下はいくつかの例です。

> 「Cubeを位置 0, 2, 0 に作って」

> 「シーンにあるオブジェクトを全部リストアップして」

> 「赤いマテリアルを作って、Cubeに適用して」

> 「カメラの位置を 0, 5, -10 に移動して」

AI が OpenForge MCP のツールを呼び出して、Unity や Blender 上でその操作を実行してくれます。

---

## トラブルシューティング

### ハンマーアイコンが表示されない

- 設定ファイルの JSON が正しいか確認してください。カンマの抜けや括弧の閉じ忘れが原因になることが多いです
- 設定ファイルの保存場所が正しいか確認してください
- Claude Desktop を完全に終了してから再起動してください
- ターミナルで `node --version` を実行して、Node.js がインストールされていることを確認してください（v18 以上が必要です）

### 「MCP server disconnected」と表示される

1. Claude Desktop を一度完全に終了します
2. もう一度起動します

それでも解決しない場合は、ターミナルで以下のコマンドを実行して、OpenForge MCP が単体で正しく動作するか確認してください。

```bash
npx openforge-mcp test
```

### AI がツールを使ってくれない

会話の中で明確にお願いしてみてください。例えば:

> 「OpenForge MCP を使って、シーンにキューブを追加してください」

それでも反応しない場合は、ハンマーアイコンをクリックして、OpenForge MCP のツールが一覧に表示されているか確認してください。

### 設定ファイルが見つからない

Claude Desktop を一度起動してから、設定ファイルの場所を確認してください。アプリを一度も起動したことがない場合、設定ファイルのフォルダが存在しないことがあります。

---

これで Claude Desktop のセットアップは完了です。何か問題がある場合は、[よくある質問](/docs/reference/faq)も参照してみてください。
