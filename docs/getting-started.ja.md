[English version / 英語版](getting-started.md)

# はじめに

## 前提条件

- Node.js 18 以降
- 次のいずれか: Unity 2021.3+、Blender 3.6+
- 次のいずれか: Claude Desktop、Cursor、VS Code、Claude Code CLI、LM Studio、Ollama

## インストール

### ステップ 1: MCP サーバーのインストール

```bash
npx openforge-mcp setup
```

setup コマンドは以下を実行します:
- システムにインストールされている AI クライアントを検出する
- 検出された各クライアントに対して MCP 設定ファイルを書き込む
- エディタープラグインのインストール手順を表示する

特定のクライアントを指定する場合:

```bash
npx openforge-mcp setup --client claude-desktop
npx openforge-mcp setup --client cursor
npx openforge-mcp setup --client vscode
npx openforge-mcp setup --client lmstudio
npx openforge-mcp setup --client ollama
```

コンテキストが限られたローカル LLM の場合は、essential モードを使用してください:

```bash
npx openforge-mcp setup --mode essential --client lmstudio
```

### ステップ 2: エディタープラグインのインストール

#### Unity

**方法 A: Unity Package Manager (推奨)**

1. Unity を開く
2. `Window > Package Manager` に移動
3. `+` をクリックし、`Add package from git URL` を選択
4. 次の URL を入力: `https://github.com/your-org/openforge-mcp.git?path=packages/unity-plugin`

**方法 B: 手動インストール**

1. Releases から最新の `.unitypackage` をダウンロード
2. Unity で `Assets > Import Package > Custom Package` に移動
3. ダウンロードしたファイルを選択

インストール後、`Tools > OpenForge > Setup` を開いて接続を確認してください。

#### Blender

1. Releases から `openforge-blender-addon.zip` をダウンロード
2. Blender で `Edit > Preferences > Add-ons` に移動
3. `Install` をクリックし、zip ファイルを選択
4. "OpenForge MCP" アドオンを有効化

サーバーは自動的に起動します。3D ビューポートの N パネルでステータスを確認できます。

### ステップ 3: AI クライアントの再起動

Claude Desktop、Cursor、または設定した AI クライアントを閉じて再度開いてください。OpenForge ツールが利用可能になっているはずです。

## セットアップの確認

AI に次のように尋ねてください:

```
List all Unity tool categories
```

Scene、GameObject、Material、Script などのカテゴリ一覧が表示されるはずです。

次に以下を試してください:

```
Create a cube at position 0, 2, 0
```

プラグインがインストールされた Unity が起動していれば、その位置にキューブが表示されます。

## 設定ファイル

setup コマンドは以下の場所に書き込みます:

| クライアント | 設定ファイル |
|--------|-------------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) または `%APPDATA%/Claude/claude_desktop_config.json` (Windows) |
| Cursor | `~/.cursor/mcp.json` |
| VS Code | `.vscode/mcp.json` (プロジェクトレベル) |
| LM Studio | `~/.lmstudio/mcp.json` |

## ポート

| サービス | デフォルトポート |
|---------|-------------|
| Unity プラグイン | 19800 |
| Blender アドオン | 19801 |
| HTTP API | 19810 |

すべてのポートは環境変数またはセットアップ UI で変更可能です。

## 次のステップ

- 利用可能なツールの完全な一覧は[ツールリファレンス](tool-reference.ja.md)を参照してください
- AI 環境に適したモードの選び方は[ツールモード](tool-reference.ja.md#モード)を参照してください
