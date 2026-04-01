---
sidebar_position: 3
---

# Blender アドオン

Blender で OpenForge MCP を使うための手順を説明します。事前に [インストール](./install.md) のページを済ませておいてください。

---

## ステップ1: アドオンをインストールする

### 方法A: セットアップコマンドから自動インストール（おすすめ）

`npx openforge-mcp setup` を実行済みなら、アドオンのファイルはもうダウンロードされています。

1. Blender を開きます
2. メニューバーから **Edit** → **Preferences** を選びます（日本語表示の場合は **編集** → **プリファレンス**）

[Screenshot: Blender のメニューから Preferences を開いているところ]

3. 左側のメニューから **「Add-ons」**（アドオン）をクリックします

[Screenshot: Preferences ウィンドウの左側にある Add-ons をクリック]

4. 右上の **「Install...」** ボタンをクリックします（Blender 4.x では、ドロップダウンメニューから **「Install from Disk...」** を選びます）

[Screenshot: Install ボタンの位置]

5. ファイル選択ダイアログが開くので、以下のファイルを選びます:
   - **Windows:** `C:\Users\あなたのユーザー名\.openforge-mcp\blender-addon\openforge_mcp.zip`
   - **Mac:** `/Users/あなたのユーザー名/.openforge-mcp/blender-addon/openforge_mcp.zip`

6. **「Install Add-on」** をクリックします

[Screenshot: ファイルを選んで Install Add-on をクリックするところ]

7. インストールが完了すると、一覧に **「OpenForge MCP」** が表示されます。**チェックボックスをオンにして有効化**してください

[Screenshot: アドオン一覧で OpenForge MCP のチェックボックスをオンにするところ]

:::tip ヒント
Blender 4.2 以降では、アドオンの管理画面のデザインが少し変わっています。「Get Extensions」タブではなく、「Install from Disk」の方を使ってください。
:::

### 方法B: 手動でダウンロードしてインストール

1. [GitHub のリリースページ](https://github.com/hirorogo/openforge-mcp/releases) にアクセスします
2. 最新バージョンの **openforge_mcp_blender.zip** をダウンロードします
3. 上の手順4から同じ流れで、ダウンロードした zip ファイルを選んでインストールします

---

## ステップ2: 接続を確認する（Nパネル）

Blender で接続状態を確認するには、**Nパネル** を使います。

1. 3D ビューポート（メインの3D画面）にマウスカーソルを置きます
2. キーボードの **N キー** を押します。画面の右側にサイドパネルが出てきます

[Screenshot: N キーを押してサイドパネルが開いたところ]

3. サイドパネルの上部にタブが並んでいるので、**「OpenForge」** タブをクリックします

[Screenshot: サイドパネルの OpenForge タブ]

4. **「Status: Connected」** と表示されていれば、AIとの接続が成功しています

[Screenshot: OpenForge パネルに Connected と表示されているところ]

:::info Nパネルとは
Blender の3D画面右側に表示されるサイドパネルのことです。N キーで表示/非表示を切り替えられます。プロパティの確認やアドオンの操作に使う便利なパネルです。
:::

---

## うまくいかないときは

### アドオン一覧に表示されない

- zip ファイルを**解凍せずにそのまま**選んでいるか確認してください。zip を解凍してからフォルダを指定してもインストールできません
- Blender のバージョンが **3.6 以降** であることを確認してください

### 有効化しても N パネルにタブが出ない

- 一度 Blender を完全に閉じて、もう一度開いてみてください
- 3D ビューポート上にマウスカーソルがあることを確認してから N キーを押してください。他のエディター（UV エディターなど）の上で N キーを押すと、別のパネルが開くことがあります

### 「Status: Disconnected」になる

1. ターミナルで OpenForge MCP が起動しているか確認してください
2. N パネルの **「Reconnect」** ボタンをクリックしてみてください
3. ファイアウォールやセキュリティソフトがブロックしていないか確認してください

### Blender の Console にエラーが出ている

Blender のメニューバーから **Window** → **Toggle System Console**（Windows のみ）を選ぶと、エラーの詳細が確認できます。Mac の場合は、ターミナルから Blender を起動するとエラーが確認できます:

```bash
/Applications/Blender.app/Contents/MacOS/Blender
```

---

接続が確認できたら、次は [AIアプリの設定](./ai-clients.md) に進みましょう。
