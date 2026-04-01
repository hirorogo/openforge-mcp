---
sidebar_position: 4
---

# Godot プラグイン

Godot で OpenForge MCP を使うための手順を説明します。事前に [インストール](./install.md) のページを済ませておいてください。

---

## ステップ1: プラグインをインストールする

### 方法A: セットアップコマンドから自動コピー（おすすめ）

`npx openforge-mcp setup` を実行済みなら、プラグインのファイルはもうダウンロードされています。あとは Godot のプロジェクトにコピーするだけです。

1. Godot でプロジェクトを開きます（まだプロジェクトがなければ、新しく作成してください）

2. ターミナルを開いて、以下のコマンドを実行します。`/path/to/your/project` の部分は、あなたの Godot プロジェクトのフォルダパスに置き換えてください:

**Windows の場合:**

```bash
xcopy "%USERPROFILE%\.openforge-mcp\godot-plugin" "あなたのプロジェクトフォルダ\addons\openforge_mcp" /E /I
```

**Mac の場合:**

```bash
cp -r ~/.openforge-mcp/godot-plugin ~/あなたのプロジェクトフォルダ/addons/openforge_mcp
```

:::tip ヒント
プロジェクトのフォルダパスがわからない場合は、Godot のプロジェクト一覧画面で、プロジェクト名の下に表示されているパスを確認してください。
:::

3. Godot に戻ると、`addons/openforge_mcp` フォルダが追加されているはずです

### 方法B: 手動でダウンロードしてコピー

1. [GitHub のリリースページ](https://github.com/hirorogo/openforge-mcp/releases) にアクセスします
2. 最新バージョンの **openforge_mcp_godot.zip** をダウンロードします
3. zip ファイルを解凍します
4. 中身のフォルダを、Godot プロジェクトの **addons** フォルダの中に **openforge_mcp** という名前でコピーします

フォルダの構成はこのようになります:

```
あなたのプロジェクト/
  addons/
    openforge_mcp/
      plugin.cfg
      ...（その他のファイル）
  project.godot
  ...
```

---

## ステップ2: プラグインを有効にする

ファイルをコピーしただけでは、まだプラグインは動いていません。Godot の設定画面から有効にする必要があります。

1. Godot のメニューバーから **Project** → **Project Settings** を選びます（日本語表示の場合は **プロジェクト** → **プロジェクト設定**）

[Screenshot: Godot のメニューから Project Settings を開いているところ]

2. Project Settings ウィンドウの上部にある **「Plugins」** タブをクリックします

[Screenshot: Project Settings の Plugins タブ]

3. 一覧に **「OpenForge MCP」** が表示されているので、右側の **「Status」** 列にあるチェックボックスをクリックして **「Active」（有効）** にします

[Screenshot: OpenForge MCP プラグインを Active にするところ]

4. ステータスが「Active」に変わればOKです

:::warning 注意
プラグインを有効にした直後に、下部の「Output」パネルにエラーが表示されることがあります。多くの場合、Godot をもう一度開き直すと解消します。
:::

---

## ステップ3: 接続を確認する

1. プラグインを有効にすると、Godot のエディター下部に **「OpenForge」** パネルが追加されます

[Screenshot: エディター下部の OpenForge パネル]

2. パネルに **「Connected」** と表示されていれば成功です

3. 表示されていない場合は、パネルの **「Connect」** ボタンをクリックしてみてください

---

## うまくいかないときは

### Plugins タブに表示されない

- `addons/openforge_mcp/plugin.cfg` ファイルが正しい場所にあるか確認してください
- Godot を一度閉じてもう一度開き直してみてください

### 有効にするとエラーが出る

- Godot のバージョンが **4.2 以降** であることを確認してください
- ターミナルで OpenForge MCP が起動しているか確認してください

### 接続できない

- ターミナルで `npx openforge-mcp setup` が正常に完了しているか確認してください
- ファイアウォールやセキュリティソフトが通信をブロックしていないか確認してください

---

接続が確認できたら、次は [AIアプリの設定](./ai-clients.md) に進みましょう。
