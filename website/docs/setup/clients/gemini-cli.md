---
sidebar_position: 5
---

# Gemini CLI

このページでは、Gemini CLI から OpenForge MCP に接続する方法を説明します。

---

## Gemini CLI とは

Gemini CLI は、Google が提供するコマンドライン（CLI）ベースの AI ツールです。ターミナルから AI と対話できるツールで、MCP サーバーとの接続にも対応しています。OpenForge MCP と接続すると、ターミナルでの会話を通じて Unity や Blender などの3Dアプリを操作できるようになります。

---

## 事前準備

Gemini CLI がまだインストールされていない場合は、以下のコマンドでインストールしてください。

```bash
npm install -g @google/gemini-cli
```

インストールが完了したら、`gemini --version` で動作確認できます。

---

## セットアップ方法

Gemini CLI から OpenForge MCP を利用するには、HTTP API を経由して接続します。

### ステップ1: OpenForge MCP サーバーを起動する

まず、ターミナルで OpenForge MCP を HTTP サーバーモードで起動します。

```bash
npx openforge-mcp start --transport http
```

サーバーが起動すると、以下のようにエンドポイントの URL が表示されます。

```
OpenForge MCP HTTP server listening on http://localhost:24601
```

:::warning 注意
このターミナルウィンドウは閉じないでください。サーバーが動作し続ける必要があります。
:::

### ステップ2: Gemini CLI の設定ファイルを作成する

Gemini CLI の MCP 設定ファイル `~/.gemini/settings.json` を編集して、OpenForge MCP の接続情報を追加します。

```json
{
  "mcpServers": {
    "openforge-mcp": {
      "uri": "http://localhost:24601/mcp"
    }
  }
}
```

:::tip ヒント
`~/.gemini/` フォルダがない場合は、Gemini CLI を一度起動してから確認してください。初回起動時にフォルダが作成されます。
:::

### 自動セットアップ

上記の手動手順の代わりに、以下のコマンドで設定を自動的に行うこともできます。

```bash
npx openforge-mcp setup --client gemini-cli
```

ただし、OpenForge MCP の HTTP サーバーは別途起動する必要があります。

---

## 使い方

OpenForge MCP サーバーが起動している状態で、別のターミナルウィンドウを開いて Gemini CLI を起動します。

```bash
gemini
```

対話モードが開始されたら、自然な日本語で話しかけるだけで3Dアプリを操作できます。

### 使い方の例

```
$ gemini

> Unity のシーンにCubeを作って、位置を 0, 2, 0 にして

OpenForge MCP を使ってCubeを作成します。

Cube を位置 (0, 2, 0) に作成しました。

> シーンにあるオブジェクトを全部見せて

現在のシーンには以下のオブジェクトがあります:
- Main Camera
- Directional Light
- Cube
```

---

## HTTP API を直接使う場合

Gemini CLI を使わずに、HTTP API を直接呼び出すこともできます。これはスクリプトや自動化に便利です。

```bash
curl -X POST http://localhost:24601/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list", "params": {}}'
```

HTTP API の詳細については、[HTTP API のドキュメント](/docs/advanced/http-api)を参照してください。

---

## 動作確認

Gemini CLI を起動して、以下のように入力してみてください。

> 「OpenForge MCP に接続できていますか?ツールの一覧を表示してください」

ツールの一覧が返ってくれば、正しく接続されています。

---

## トラブルシューティング

### 「Connection refused」と表示される

- OpenForge MCP の HTTP サーバーが起動しているか確認してください
- サーバーを起動したターミナルで、エラーメッセージが出ていないか確認してください
- 設定ファイルの URL（`http://localhost:24601/mcp`）が正しいか確認してください

### サーバーは起動しているのにツールが使えない

- Gemini CLI を再起動してください
- `~/.gemini/settings.json` の JSON が正しい書式か確認してください

### npx コマンドが見つからない

Node.js がインストールされていない可能性があります。[nodejs.org](https://nodejs.org) から LTS 版をダウンロードしてインストールしてください。

### サーバーのポートが競合している

別のアプリがポート 24601 を使っている場合は、別のポートを指定して起動できます。

```bash
npx openforge-mcp start --transport http --port 24602
```

この場合、設定ファイルの URL も合わせて変更してください。

---

これで Gemini CLI のセットアップは完了です。何か問題がある場合は、[よくある質問](/docs/reference/faq)も参照してみてください。
