English version: [README.md](README.md)

# OpenForge MCP

**日本語で話すだけで、UnityとBlenderを操作できる。無料。**

---

## 他にはない機能

### AIが画面を「見て」自分で直す

既存ツールは操作結果がテキストで返るだけ。OpenForge はAIがスクリーンショットを見て、問題を自分で判断して修正します。

```
あなた: 「街のシーンを作って」
  → AI: オブジェクト配置完了
  → AI: スクリーンショットを確認
  → AI: 「建物の間隔が狭いので調整します」
  → AI: 自動で修正
```

### BlenderとUnityを1会話でまたぐ

Blenderでモデリング → 最適化 → Unityにインポート → 配置。これが全部1つの会話で完結します。アプリの切り替えもファイルの手動受け渡しも不要。

```
「Blenderで盾のモデルを作って、ポリゴン最適化して、
　Unityにインポートして、Playerの左手にアタッチして」
```

### 「セーブして」「戻して」でバージョン管理

Gitを知らなくても大丈夫。RPGのセーブポイントと同じ感覚です。

```
「セーブして」       → 自動でGitコミット
「壊れた、戻して」   → 一言で復元
「セーブ一覧見せて」 → 変更履歴を表示
```

### AIがゲームをプレイしてバグを見つける

AIがPlayModeで実際にゲームを動かし、エラーやパフォーマンス問題を報告します。

```
「テストプレイして問題点を教えて」
  → AI: ゲームを実行、入力をシミュレート
  → AI: 「着地時にNullReferenceException発生。
         FPSが座標 x:100 付近で30以下に低下。」
```

<!-- スクリーンショットに差し替え -->
| Unity | Blender |
|-------|---------|
| ![Unity デモ](docs/images/unity-demo.png) | ![Blender デモ](docs/images/blender-demo.png) |

## 基本機能

- **完全無料** -- MITライセンス。ずっと無料。
- **日本語OK** -- 日本語でも英語でも指示できる。
- **350種類以上のツール** -- シーン、オブジェクト、マテリアル、スクリプト、メッシュ、アニメーション、物理、UI、ライティング、カメラ、地形、VFX、レンダリングなど。
- **コマンド1つで始められる** -- AIアプリを自動検出して設定。JSONを手で書く必要なし。
- **長時間作業でもトークンが溢れない** -- 必要なツールだけ都度読み込む設計。
- **対応AIクライアント** -- Claude Desktop / Cursor / VS Code / Claude Code CLI / Gemini CLI / [LM Studio / Ollama](docs/getting-started.ja.md)

## 始め方

### 1. インストール

```bash
npx openforge-mcp setup
```

### 2. プラグインを入れる

**Unity:** パッケージをインポート → `Tools > OpenForge > Setup`

**Blender:** `Edit > Preferences > Add-ons > Install` からzipを選択 → 有効化

### 3. AIに話しかける

```
「キャラクターにラグドールの物理演算を設定して」
```

詳しい手順は [セットアップガイド](docs/getting-started.ja.md) をご覧ください。

## こう言うだけで、こうなります

| やりたいこと | こう言うだけ |
|------------|-----------|
| シーン構築 | 「廃墟の街を作って、壊れたビルを5棟配置して」 |
| クロスアプリ | 「Blenderで椅子を作って、Unityの部屋に配置して」 |
| マテリアル | 「ネオンに光るマテリアルを作って看板に適用して」 |
| 物理演算 | 「木箱にリジッドボディを付けて、積み上げて」 |
| AI修正ループ | 「ライティングを調整して。スクショ見て良くなるまで繰り返して」 |
| バージョン管理 | 「セーブして」「3つ前に戻して」 |
| スクリプト生成 | 「敵がプレイヤーを追いかけるAIスクリプトを書いて」 |
| テストプレイ | 「ゲームを実行してバグがないか確認して」 |

## ドキュメント

ドキュメントサイト: **https://hirorogo.github.io/openforge-mcp/**

| ガイド | 内容 |
|-------|------|
| [はじめに](https://hirorogo.github.io/openforge-mcp/docs/intro) | OpenForge MCP の概要と独自機能 |
| [インストール](https://hirorogo.github.io/openforge-mcp/docs/setup/install) | Node.js の入れ方からセットアップまで |
| [はじめての操作](https://hirorogo.github.io/openforge-mcp/docs/tutorials/first-steps) | AIに最初の指示を出してみる |
| [シーンを作ってみよう](https://hirorogo.github.io/openforge-mcp/docs/tutorials/scene-building) | 屋上庭園を一から構築 |
| [Blenderでモデリング](https://hirorogo.github.io/openforge-mcp/docs/tutorials/modeling) | 灯籠を作ってエクスポート |
| [BlenderからUnityへ](https://hirorogo.github.io/openforge-mcp/docs/tutorials/cross-app) | クロスアプリ連携チュートリアル |
| [セーブとロード](https://hirorogo.github.io/openforge-mcp/docs/tutorials/save-restore) | バージョン管理の使い方 |
| [VRChatワールドを作ろう](https://hirorogo.github.io/openforge-mcp/docs/tutorials/vrchat) | 星空の展望台を制作 |
| [ツール一覧](https://hirorogo.github.io/openforge-mcp/docs/reference/unity-tools) | Unity / Blender / Godot 全ツール |
| [開発に参加する](CONTRIBUTING.ja.md) | PR の出し方、ツールの追加方法 |

## ロードマップ

### v0.1.0 (今ここ)
- [x] 350種類以上のツール (Unity + Blender)
- [x] AIがシーンを見て自律修正 (Visual Feedback)
- [x] 「セーブして」「戻して」で自動バージョン管理
- [x] Blender→Unity 自動パイプライン
- [x] あらゆるAIクライアントに対応

### v1.0.0
- [ ] AIプレイテスト (ゲームを実行してバグ検出)
- [ ] レシピ機能 (複雑な操作を1コマンドで再現・共有)
- [ ] コミュニティがツールを追加できるプラグインAPI

### その先
- [ ] AIアセット生成 (テキストから3Dモデル/テクスチャ)
- [ ] スマホから進捗確認できるWebダッシュボード
- [ ] Godot Engine 対応

## ビルド

```bash
git clone https://github.com/hirorogo/openforge-mcp.git
cd openforge-mcp
pnpm install && pnpm build
```

## ライセンス

MIT
