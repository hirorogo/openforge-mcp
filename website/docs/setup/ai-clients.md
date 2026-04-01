---
sidebar_position: 5
---

# AIアプリの設定

OpenForge MCP を使うには、AIと会話するためのアプリが必要です。このページでは、代表的なAIアプリの設定方法を説明します。

---

## どのアプリを選べばいいの?

はじめての方は、この流れで選んでみてください。

- **「とにかく簡単に始めたい」** → Claude Desktop がおすすめ。設定がいちばん少ないです
- **「プログラミングもやりたい」** → Cursor または VS Code がおすすめ。コードを書く機能も充実しています
- **「インターネットに繋がない環境で使いたい」または「完全に無料で使いたい」** → LM Studio または Ollama がおすすめ。自分のパソコンだけでAIを動かせます
- **「どれかわからない」** → まずは Claude Desktop から始めてみてください

:::info 補足
どのアプリを選んでも、OpenForge MCP でできることは同じです。違いは「AIとの会話のしやすさ」や「追加機能」です。あとから別のアプリに切り替えることもできます。
:::

---

## Claude Desktop

Claude Desktop は、AIとチャット形式で会話できるアプリです。設定が少なく、はじめての方におすすめです。

### 手順

1. [claude.ai/download](https://claude.ai/download) からアプリをダウンロードしてインストールします

2. アプリを起動して、アカウントを作成またはログインします

3. 設定ファイルを開きます。メニューバーから **File** → **Settings** を選びます（Mac の場合は **Claude** → **Settings**）

4. 設定画面の **「Developer」** タブをクリックします

5. **「Edit Config」** ボタンをクリックすると、設定ファイルがテキストエディターで開きます

6. ファイルの内容を以下のように書き換えて保存します:

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
すでに他の MCP サーバーの設定がある場合は、`"mcpServers"` の中に追記する形にしてください。設定を全部上書きしてしまわないように注意してください。
:::

7. Claude Desktop を一度完全に終了して、もう一度起動します

8. チャット入力欄の下に小さなハンマーのアイコンが表示されていれば、OpenForge MCP との接続が成功しています

[Screenshot: Claude Desktop のチャット欄にハンマーアイコンが表示されているところ]

### 動作確認

チャット欄に以下のように入力してみてください:

> 「OpenForge MCP に接続できていますか?」

AIが「接続されています」と返答すれば設定完了です。

---

## Cursor

Cursor は、AIの支援機能がついたコードエディターです。プログラミングと3D制作の両方をやりたい方に向いています。

### 手順

1. [cursor.com](https://cursor.com) からアプリをダウンロードしてインストールします

2. アプリを起動します

3. キーボードで **Ctrl + Shift + P**（Mac は **Cmd + Shift + P**）を押して、コマンドパレットを開きます

4. **「Cursor Settings」** と入力して、表示された候補をクリックします

5. 左側のメニューから **「MCP」** をクリックします

6. **「Add new global MCP server」** をクリックします

7. テキストエディターが開くので、以下の内容を入力して保存します:

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

8. MCP の設定画面に戻ると、「openforge-mcp」が一覧に表示されています。ステータスが緑色の丸になっていれば接続成功です

[Screenshot: Cursor の MCP 設定画面で openforge-mcp が接続されているところ]

### 動作確認

画面右側のチャットパネル（Ctrl + L または Cmd + L で開きます）で、以下のように入力してください:

> 「OpenForge MCP のツール一覧を表示して」

ツールの一覧が返ってくれば設定完了です。

---

## VS Code

VS Code は広く使われているコードエディターです。拡張機能を追加することで MCP に対応できます。

### 手順

1. VS Code がまだインストールされていなければ、[code.visualstudio.com](https://code.visualstudio.com) からダウンロードしてインストールします

2. VS Code を起動します

3. プロジェクトフォルダを開きます（**File** → **Open Folder**）

4. プロジェクトのルートフォルダに `.vscode` フォルダがなければ作成します

5. `.vscode` フォルダの中に `mcp.json` というファイルを作成して、以下の内容を入力して保存します:

```json
{
  "servers": {
    "openforge-mcp": {
      "command": "npx",
      "args": ["openforge-mcp", "start"]
    }
  }
}
```

6. VS Code を再起動します

7. チャットパネルを開きます（**Ctrl + Shift + I** または **Cmd + Shift + I**）

8. チャットパネルのモードを **「Agent」** に切り替えます（パネル上部のドロップダウンメニューから選べます）

9. ツールアイコンをクリックして、「openforge-mcp」のツールが表示されていれば接続成功です

[Screenshot: VS Code のチャットパネルで MCP ツールが表示されているところ]

---

## LM Studio

LM Studio は、自分のパソコン上でAIを動かせるアプリです。インターネット接続なしでも使えるのが特長です。

:::info 補足
LM Studio で動かすAIは、パソコンのスペックによって性能が変わります。GPU（グラフィックボード）を搭載しているパソコンでの利用を推奨します。
:::

### 手順

1. [lmstudio.ai](https://lmstudio.ai) からアプリをダウンロードしてインストールします

2. アプリを起動して、好きなAIモデルをダウンロードします。おすすめは **Qwen 2.5** シリーズです（ダウンロード画面で検索してください）

3. 左側のメニューから **「Developer」** タブをクリックします

4. 画面上部の **「Settings」** をクリックします

5. **「MCP Servers」** のセクションを見つけます

6. **「Add Server」** をクリックして、以下のように設定します:
   - **Name:** `openforge-mcp`
   - **Command:** `npx`
   - **Arguments:** `openforge-mcp start`

7. **「Save」** をクリックします

8. チャット画面に戻り、入力欄の近くにツールアイコンが表示されていれば接続成功です

### 動作確認

チャット欄で以下のように入力してみてください:

> 「OpenForge MCP に接続できていますか?」

AIがツールを使って確認した結果を返してくれれば設定完了です。

---

## Ollama

Ollama は、ターミナルからAIを動かすためのツールです。パソコンのみでAIを実行でき、完全に無料です。

:::warning 注意
Ollama はターミナルで操作するツールです。ターミナルの操作に慣れていない場合は、LM Studio の方が使いやすいかもしれません。
:::

### 手順

1. [ollama.com](https://ollama.com) からインストーラーをダウンロードしてインストールします

2. ターミナルを開いて、AIモデルをダウンロードします:

```bash
ollama pull qwen2.5
```

このコマンドは「qwen2.5 というAIモデルをダウンロードしてね」という意味です。数GB のダウンロードが発生するので、少し時間がかかります。

3. OpenForge MCP を Ollama と接続するには、以下のコマンドで起動します:

```bash
npx openforge-mcp start --provider ollama --model qwen2.5
```

このコマンドの意味は:
- `npx openforge-mcp start` -- OpenForge MCP を起動する
- `--provider ollama` -- AIとして Ollama を使う
- `--model qwen2.5` -- モデルは qwen2.5 を使う

4. 「Server started」と表示されれば起動成功です

### 動作確認

別のターミナルウィンドウを開いて（最初のターミナルは閉じないでください）、以下のコマンドを実行します:

```bash
npx openforge-mcp test
```

「All tests passed」と表示されれば、正しく動作しています。

---

## 共通のトラブルシューティング

### どのアプリでも接続できない

- ターミナルで `npx openforge-mcp setup` が正常に完了しているか確認してください
- Node.js が正しくインストールされているか確認してください（`node --version` で確認できます）
- パソコンを再起動してからもう一度試してみてください

### 「MCP server disconnected」と表示される

AIアプリと OpenForge MCP の通信が途切れています。

1. AIアプリを一度完全に終了します
2. ターミナルで OpenForge MCP が動いている場合は、**Ctrl + C** で止めます
3. `npx openforge-mcp start` をもう一度実行します
4. AIアプリを起動し直します

### AIがツールを使ってくれない

会話の中で明確にお願いしてみてください。例:

> 「OpenForge MCP を使って、Unity のシーンにキューブを追加してください」

それでもダメな場合は、AIアプリの設定で MCP が有効になっているか、もう一度確認してください。

---

これでセットアップは完了です。お疲れさまでした。

実際にAIに話しかけて作品を作ってみましょう。チュートリアルのページに進んで、最初の一歩を踏み出してみてください。
