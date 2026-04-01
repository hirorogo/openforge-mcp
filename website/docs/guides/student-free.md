---
sidebar_position: 1
title: "学生は完全無料で始められる"
---

# 学生は完全無料で始められる

OpenForge MCP は MIT License のオープンソースソフトウェアです。誰でも無料で使えます。

そして学生なら、AI の利用コストも含めて、すべてを無料で揃えることができます。


## OpenForge MCP は無料

OpenForge MCP は MIT License で公開されています。商用利用も含めて完全に無料です。ダウンロードもインストールも、利用に一切の費用はかかりません。


## 学生なら AI も無料で使える

OpenForge MCP を使うには AI クライアントが必要ですが、学生なら GitHub Copilot を無料で利用できます。

### GitHub Education とは

GitHub Education は、学生に対して GitHub の有料サービスを無料で提供するプログラムです。

含まれる主な特典:

- **GitHub Copilot が無料** (通常は月額 $10)
- GitHub Pro アカウント
- 各種クラウドサービスのクレジット

### 申請方法

1. [github.com/education](https://github.com/education) にアクセスする
2. 「Get benefits」をクリックする
3. GitHub アカウントでサインインする (持っていなければ作成する)
4. 学校のメールアドレス (.ac.jp など) を入力する
5. 学生証の写真をアップロードする
6. 申請を送信する
7. 通常、数日以内に承認される

承認されると、GitHub Copilot を含むすべての学生特典が有効になります。


## 完全無料の AI ゲーム開発環境

GitHub Copilot が使えるようになれば、以下の組み合わせで完全無料の AI 開発環境が手に入ります。

| ソフトウェア | 費用 |
|---|---|
| OpenForge MCP | 無料 (MIT License) |
| VS Code | 無料 |
| GitHub Copilot | 学生無料 (GitHub Education) |
| Unity | 学生無料 (Unity Student Plan) |
| Blender | 無料 (誰でも) |
| Godot | 無料 (誰でも) |

すべてを合わせても費用はゼロです。


## セットアップ手順

### 1. GitHub Education に申請する

上記の手順で GitHub Education Pack を申請してください。承認を待つ間に、他の準備を進められます。

### 2. VS Code をインストールする

[code.visualstudio.com](https://code.visualstudio.com) から VS Code をダウンロードしてインストールします。

### 3. GitHub Copilot 拡張をインストールする

VS Code を開き、拡張機能タブで「GitHub Copilot」を検索してインストールします。GitHub アカウントでサインインしてください。

### 4. OpenForge MCP をセットアップする

ターミナルで以下のコマンドを実行します。

```bash
npx openforge-mcp setup --client vscode --mode dynamic
```

### 5. ゲームエンジンをインストールする

使いたいエンジンをインストールしてください。複数入れても構いません。

- **Unity**: [unity.com/education](https://unity.com/education) から Unity Student Plan に申し込む (学生無料)
- **Blender**: [blender.org](https://blender.org) からダウンロード (誰でも無料)
- **Godot**: [godotengine.org](https://godotengine.org) からダウンロード (誰でも無料)

### 6. OpenForge プラグインを入れる

使用するエンジン向けの OpenForge プラグインをインストールします。

Unity の場合:
```bash
npx openforge-mcp install unity
```

Blender の場合:
```bash
npx openforge-mcp install blender
```

### 7. Copilot Chat で話しかける

VS Code で Copilot Chat を開き (Ctrl+Shift+I)、自然な日本語で指示するだけです。

```
Unityで新しいシーンを作って、Cubeを一つ配置して
```

これで、AI があなたの代わりにゲームエンジンを操作してくれます。


## 各エンジンの費用まとめ

### Unity

Unity Student Plan を利用すれば無料です。[unity.com/education](https://unity.com/education) から学校のメールアドレスで申請できます。個人利用 (Unity Personal) であれば、年間売上が一定額以下なら学生でなくても無料です。

### Blender

Blender は完全なオープンソースソフトウェアで、誰でも無料で利用できます。学生かどうかに関係なく、商用利用も含めて無料です。

### Godot

Godot も完全なオープンソースソフトウェアです。MIT License で提供されており、誰でも無料で利用できます。


## 学生じゃなくても無料で始められる方法

学生でなくても、ローカル LLM を使えば AI の利用コストをゼロにできます。

### LM Studio を使う方法

LM Studio はローカルで LLM を動かすためのアプリケーションです。PC のスペックに応じたモデルを選んで実行できます。

```bash
npx openforge-mcp setup --client lm-studio
```

### Ollama を使う方法

Ollama はコマンドラインでローカル LLM を実行するツールです。

```bash
npx openforge-mcp setup --client ollama
```

ローカル LLM はインターネット接続も不要で、プライバシーの面でも安心です。ただし、AI の応答品質はクラウドの大規模モデルに比べると劣る場合があります。


## まとめ

必要なものはすべて無料で手に入ります。

- OpenForge MCP: 無料
- AI (GitHub Copilot): 学生無料
- AI (ローカル LLM): 誰でも無料
- Unity: 学生無料
- Blender: 誰でも無料
- Godot: 誰でも無料

「お金がないから作れない」という時代は終わりました。必要なのはPCとインターネット回線、そしてあなたのアイデアだけです。

今すぐ始めてみてください。
