English version: [README.md](README.md)

# OpenForge MCP

AIをUnityおよびBlenderに接続する、無料かつオープンソースのMCPサーバーです。
自然言語でクリエイティブツールを操作できます。

---

## 概要

OpenForge MCPは、AIアシスタントがUnity EditorおよびBlenderを自然言語で操作できるようにする[Model Context Protocol](https://modelcontextprotocol.io/)サーバーです。AIにゲームオブジェクトの作成、シーンの構築、マテリアルの編集、スクリプトの記述などを指示できます。

**主な特徴:**

- Claude Desktop、Cursor、VS Code、Claude Code CLI、Gemini CLI、LM Studio、Ollamaに対応
- UnityおよびBlender向けに99種類のツールを提供（350種類以上に拡張予定）
- トークン効率に優れた3メタツールアーキテクチャ（コンテキスト使用量を99%削減）
- コマンド一つでセットアップ完了
- MITライセンス、永久無料

## デモ

<!-- 実際のスクリーンショットに差し替えてください -->
| Unity | Blender |
|-------|---------|
| ![Unity デモ](docs/images/unity-demo.png) | ![Blender デモ](docs/images/blender-demo.png) |

| セットアップ画面 | AIクライアント |
|----------------|--------------|
| ![セットアップ](docs/images/setup-window.png) | ![Claude Desktop](docs/images/claude-desktop.png) |

## クイックスタート

### 1. MCPサーバーのインストール

```bash
npx openforge-mcp setup
```

このコマンドはAIクライアント（Claude Desktop、Cursor、VS Codeなど）を自動検出し、設定を自動的に書き込みます。

### 2. エディタープラグインのインストール

**Unity:** Unity Package Managerまたは`.unitypackage`からパッケージをインポートします。`Tools > OpenForge > Setup`を開き、Test Connectionをクリックします。

**Blender:** `Edit > Preferences > Add-ons > Install`から`blender-addon.zip`をインストールします。アドオンを有効化してください。

### 3. 使い方

AIクライアントを開き、エディターに話しかけてください:

```
"プレイヤーキャラクターにカプセルコライダーとリジッドボディを設定して"
"指向性ライティングのある森のシーンを作って"
"ガラスマテリアルを作成してSphereオブジェクトに適用して"
"モデルをFBXとしてエクスポートして"
```

## アーキテクチャ

```
AI Client (Claude Desktop, Cursor, etc.)
    |
    | MCP Protocol (stdio / SSE)
    v
OpenForge MCP Server (Node.js)
    |
    | JSON-RPC over TCP
    v
Unity Editor / Blender
```

サーバーはトークン使用量を最小限に抑えるため、3つのメタツールを公開しています:

| ツール | 用途 |
|------|---------|
| `list_categories` | UnityまたはBlenderで利用可能なツールカテゴリを表示 |
| `list_tools` | 特定カテゴリのツールとそのパラメータを表示 |
| `execute` | 指定されたパラメータでツールを実行 |

これにより、AIは必要なときにのみツールの詳細を読み込み、数百のツール定義でコンテキストを圧迫することを防ぎます。

## 対応ツール一覧

### Unity（27ツール）

| カテゴリ | ツール |
|----------|-------|
| Scene | create_scene, load_scene, save_scene, get_scene_info, get_hierarchy |
| GameObject | create, find, destroy, set_transform, set_active, add_component, remove_component, get_components, set_parent, duplicate |
| Material | create, set_color, set_shader, set_texture, set_property, get_info |
| Script | create, edit, attach, get, search_code |
| Screenshot | get_viewport_screenshot |

### Blender（26ツール）

| カテゴリ | ツール |
|----------|-------|
| Object | create_mesh, transform, duplicate, delete, set_origin, join, separate |
| Mesh | extrude, bevel, subdivide, boolean, decimate, merge_by_distance, knife_cut |
| Material | create, set_color, set_metallic, set_roughness, glass, emission |
| Scene | get_info, get_objects_list, set_render_engine, set_resolution, set_frame_range |
| Screenshot | get_viewport_screenshot |

ツールは継続的に追加されています。詳細は下記の[ロードマップ](#ロードマップ)をご覧ください。

**VRChatクリエイターの方へ:** ワールド制作やアバター編集の具体的な使い方は [VRChatガイド](docs/vrchat-guide.ja.md) をご覧ください。

## ツールモード

環境に合わせてモードを選択できます:

| モード | ツール数 | 推奨用途 |
|------|-------|----------|
| Full | 全ツール | Claude Desktop、クラウドモデルを使用するCursor |
| Essential | 80のコアツール | LM Studio、Ollama、ローカルLLM |
| Dynamic | 基本8 + オンデマンド | GitHub Copilotを使用するVS Code |

```bash
npx openforge-mcp setup --mode essential --client lmstudio
```

## HTTP API

自動化、CI/CD、またはマルチエージェントワークフロー向けに、サーバーはREST APIも提供しています:

```bash
# ツールの実行
curl -X POST http://localhost:19810/api/execute \
  -H "Content-Type: application/json" \
  -d '{"target": "unity", "tool": "create_gameobject", "params": {"name": "Cube", "primitiveType": "Cube"}}'

# カテゴリの一覧取得
curl http://localhost:19810/api/categories

# ステータスの確認
curl http://localhost:19810/api/status
```

## プロジェクト構成

```
openforge-mcp/
  packages/
    mcp-server/       TypeScript MCP server + HTTP API
    unity-plugin/     Unity Editor plugin (C#)
    blender-addon/    Blender addon (Python)
```

## ソースからのビルド

**必要環境:** Node.js 18+, pnpm

```bash
git clone https://github.com/your-org/openforge-mcp.git
cd openforge-mcp
pnpm install
pnpm build
```

**テストの実行:**

```bash
# MCP server tests (176 tests)
cd packages/mcp-server && npx vitest run

# Blender addon tests
cd packages/blender-addon/tests && python -m pytest -v
```

## ロードマップ

### v0.1.0（現行バージョン）
- [x] 3メタツールアーキテクチャによるMCPサーバー
- [x] Unityプラグイン: Scene、GameObject、Material、Scriptツール
- [x] Blenderアドオン: Object、Mesh、Material、Sceneツール
- [x] ビジュアルフィードバック（ビューポートスクリーンショット）
- [x] マルチエージェント対応のHTTP API
- [x] Full / Essential / Dynamicモード

### v0.2.0
- [ ] UnityおよびBlender向けに150種類以上のツール
- [ ] 自動検出機能付きセットアップCLI
- [ ] 自動バージョン管理（Gitによる保存・復元）
- [ ] トランザクションおよびアンドゥグループ
- [ ] LM StudioおよびOllamaの設定対応

### v1.0.0
- [ ] 350種類以上のツール（Animation、Physics、UI、Lighting、Camera、Terrain、VFX、Shader）
- [ ] BlenderからUnityへのパイプライン
- [ ] レシピシステム（YAML定義の再利用可能なワークフロー）
- [ ] コミュニティツール拡張向けプラグインAPI

### 将来の展望
- [ ] AIプレイテスト（ゲームの実行、自動バグ検出）
- [ ] AIアセット生成（text-to-3D、text-to-textureの統合）
- [ ] リモート監視用Webダッシュボード
- [ ] Godot Engineのサポート

## コントリビューション

コントリビューションを歓迎します。ガイドラインについては[CONTRIBUTING.md](CONTRIBUTING.md)をご参照ください。

## ライセンス

MIT
