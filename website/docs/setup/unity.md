---
sidebar_position: 2
---

# Unity プラグイン

Unity で OpenForge MCP を使うための手順を説明します。事前に [インストール](./install.md) のページを済ませておいてください。

---

## ステップ1: プラグインをインストールする

Unity にプラグインを追加する方法はいくつかありますが、一番簡単な方法で進めます。

### 方法A: セットアップコマンドから自動インストール（おすすめ）

すでに `npx openforge-mcp setup` を実行している場合、Unity プラグインのファイルはダウンロード済みです。

1. Unity でプロジェクトを開きます
2. Unity のメニューバーから **Window** → **Package Manager** を選びます

[Screenshot: Unity メニューバーの Window から Package Manager を開いているところ]

3. Package Manager ウィンドウの左上にある **「+」ボタン** をクリックします

[Screenshot: Package Manager の左上にある + ボタン]

4. **「Add package from disk...」** を選びます

[Screenshot: ドロップダウンメニューから "Add package from disk..." を選択しているところ]

5. ファイル選択ダイアログが開くので、以下のフォルダに移動します:
   - **Windows:** `C:\Users\あなたのユーザー名\.openforge-mcp\unity-plugin\package.json`
   - **Mac:** `/Users/あなたのユーザー名/.openforge-mcp/unity-plugin/package.json`

6. `package.json` を選んで「開く」をクリックします

[Screenshot: ファイル選択ダイアログで package.json を選んでいるところ]

7. Package Manager に「OpenForge MCP」が追加されれば成功です

[Screenshot: Package Manager に OpenForge MCP が表示されているところ]

### 方法B: Git URL からインストール

1. Unity のメニューバーから **Window** → **Package Manager** を選びます
2. **「+」ボタン** → **「Add package from git URL...」** を選びます
3. 以下のURLを入力して **「Add」** をクリックします:

```
https://github.com/hirorogo/openforge-mcp.git?path=unity-plugin
```

[Screenshot: Git URL 入力欄に URL を入力しているところ]

しばらく待つと自動的にインストールされます。

---

## ステップ2: 接続を確認する

プラグインをインストールしたら、AIと正しく繋がるか確認しましょう。

1. Unity のメニューバーから **OpenForge** → **Connection Status** を選びます

[Screenshot: メニューバーの OpenForge メニュー]

2. 小さなウィンドウが開きます。ここに **「Connected」** と緑色で表示されていれば、AIとの接続が成功しています

[Screenshot: Connection Status ウィンドウに "Connected" と表示されているところ]

:::warning 注意
「Disconnected」と表示される場合は、ターミナルで OpenForge MCP が起動しているか確認してください。ターミナルを閉じてしまった場合は、もう一度 `npx openforge-mcp setup` を実行してください。
:::

---

## ステップ3: Setup ウィンドウの見方

Unity のメニューバーから **OpenForge** → **Setup** を選ぶと、設定画面が開きます。

[Screenshot: OpenForge Setup ウィンドウ全体]

この画面では以下の項目を確認・変更できます:

### 接続状態（Connection）

AIとの接続が正常かどうかを表示します。通常は自動で接続されるので、ここを操作する必要はありません。

### ポート番号（Port）

AIとの通信に使う番号です。初期値のままで問題ありません。他のソフトと番号がぶつかってしまった場合にのみ変更してください。

### スクリーンショット設定（Screenshot）

AIが画面を確認するときに使うスクリーンショットの設定です。「Auto」にしておけば、AIが必要なときに自動で画面を撮影します。

### ログ（Log）

AIとのやり取りの記録が表示されます。うまく動かないときに、ここを確認すると原因がわかることがあります。

---

## うまくいかないときは

### Package Manager に何も表示されない

- Unity を一度再起動してみてください
- Unity のバージョンが **2021.3 以降** であることを確認してください。古いバージョンでは動作しない場合があります

### 「OpenForge」メニューが見つからない

プラグインのインストールが完了していない可能性があります。

- Package Manager を開いて、左側のリストに「OpenForge MCP」があるか確認してください
- ない場合は、ステップ1のインストール手順をもう一度試してください

### 「Connected」にならない

1. ターミナルが開いていて、OpenForge MCP が動いているか確認してください
2. ファイアウォールやセキュリティソフトがブロックしていないか確認してください
3. Setup ウィンドウのポート番号が、ターミナルに表示されている番号と一致しているか確認してください

### Console にエラーが出ている

Unity のメニューバーから **Window** → **General** → **Console** を開くと、エラーメッセージが確認できます。エラーの内容を [GitHub の Issues ページ](https://github.com/hirorogo/openforge-mcp/issues) で検索してみてください。

---

接続が確認できたら、次は [AIアプリの設定](./ai-clients.md) に進みましょう。
