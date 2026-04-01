[English version / 英語版](CONTRIBUTING.md)

# OpenForge MCP への貢献

貢献に興味を持っていただきありがとうございます。

## はじめに

1. リポジトリをフォークする
2. フォークをクローンする
3. 依存関係をインストールする: `pnpm install`
4. ビルドする: `pnpm build`
5. テストを実行する: `cd packages/mcp-server && npx vitest run`

## プロジェクト構成

| パッケージ | 言語 | 説明 |
|---------|----------|-------------|
| `packages/mcp-server` | TypeScript | MCP サーバー、ツールレジストリ、HTTP API |
| `packages/unity-plugin` | C# | Unity エディタープラグイン |
| `packages/blender-addon` | Python | Blender アドオン |

## 新しいツールの追加

### Unity ツール

1. `packages/unity-plugin/Editor/Tools/` にファイルを作成または編集する
2. `ToolExecutor.cs` にハンドラーを登録する
3. `packages/mcp-server/src/tools/unity/` にツール定義を追加する
4. テストを追加する

### Blender ツール

1. `packages/blender-addon/tools/` にファイルを作成または編集する
2. モジュールの `TOOLS` 辞書に関数を追加する
3. `packages/mcp-server/src/tools/blender/` にツール定義を追加する
4. テストを追加する

## コードスタイル

- TypeScript: strict モード、回避可能な場合は `any` を使用しない
- C#: 標準的な Unity の規約に従い、変更には必ず Undo を使用する
- Python: 型ヒント、snake_case、Blender アドオンの規約に従う
- コード、コメント、UI テキストに絵文字を使用しない
- コメントは最小限に -- コード自体が説明的であるべき

## プルリクエスト

- 1 つの PR につき 1 つの機能
- 新しいツールにはテストを含める
- 既存のテストがすべてパスすることを確認する
- 変更内容と理由を明確に記述する

## 問題の報告

Issue を作成する際は以下を記載してください:
- 期待した動作
- 実際に起こった動作
- 再現手順
- 環境情報 (OS、Unity/Blender のバージョン、AI クライアント)
