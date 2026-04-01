English version: [vrchat-guide.md](vrchat-guide.md)

# OpenForge MCP -- VRChat クリエイター向けガイド

VRChatのワールド制作やアバター改変を、AIに話しかけるだけで進められます。
プログラミングの知識は不要です。

## できること

### ワールド制作

```
「展望台のあるワールドを作って、柵と階段を配置して」
「夜のライティングにして、街灯を点灯させて」
「水面を追加して、反射を設定して」
「BGM用のAudioSourceをエントランスに置いて」
「スポーンポイントを入口に設置して」
```

### アバター編集（Blender）

```
「ダウンロードフォルダのVRMファイルをインポートして」
「ポリゴン数を7万に削減して」
「ベベルモディファイアを追加してエッジを滑らかにして」
「アクセサリー用にガラスマテリアルを作って」
「VRMとしてエクスポートして」
```

### 最適化

```
「このシーンのDraw Callを分析して」
「同じマテリアルを使っているメッシュを結合して」
「全オブジェクトにLODグループを生成して」
「テクスチャ圧縮をモバイル向けASTMに設定して」
「パフォーマンスレポートを見せて」
```

### マテリアルとビジュアル

```
「半透明のガラスマテリアルを作って窓に適用して」
「青く光るエミッションマテリアルを作って」
「3点ライティングをセットアップして」
「フォグとポストプロセッシングのブルームを追加して」
```

## セットアップ

### 必要なもの

- Unity 2022.3.22f1 LTS（VRChat SDK対応バージョン）
- Blender 3.6以上（アバター編集用）
- 次のいずれか: Claude Desktop、Cursor、VS Code、LM Studio

### インストール

```bash
npx openforge-mcp setup
```

その後、Unityで `Tools > OpenForge > Setup` からプラグインを設定します。

詳しい手順は [セットアップガイド](getting-started.ja.md) を参照してください。

## VRChat開発のコツ

### 大きな変更の前にセーブする

```
「プロジェクトをセーブして」
```

これでGitのセーブポイントが自動的に作成されます。もし壊れたら:

```
「前のセーブに戻して」
```

### 指示は具体的に

良い例:
```
「位置 0, 1, 0 にスケール 2, 0.1, 2 のCubeを作って、床にして」
```

曖昧な例:
```
「床を作って」
```

具体的に伝えるほど、正確な結果が得られます。

### 変更後にシーンを確認する

AIはビューポートのスクリーンショットを撮って結果を確認できます:

```
「シーンビューのスクリーンショットを撮って」
```

これによりAIが自分の作業を確認し、必要に応じて修正します。

### VRChat SDKとの連携

OpenForgeはUnity Editorの操作（オブジェクト作成、マテリアル設定、スクリプト記述など）を担当します。VRChat SDKのコンポーネントは `add_component` ツールで追加できます:

```
「ルートオブジェクトにVRC_SceneDescriptorコンポーネントを追加して」
「スポーンポイントを位置 0, 1, 0 に設定して」
```

### BlenderとUnityの連携

1回の会話で両方を操作できます:

```
「Blenderでシンプルなテーブルモデルを作ってFBXでエクスポートして」
「Unityでそのfbxをインポートして位置 3, 0, 2 に配置して」
「木材のマテリアルを作ってテーブルに適用して」
```

## 用途別ツールガイド

| やりたいこと | カテゴリ | ツール例 |
|------------|---------|---------|
| ワールドを構築 | Scene, GameObject | create_scene, create_gameobject, set_transform |
| ライティング設定 | Material | create_material, set_material_color |
| ギミックのスクリプト | Script | create_script, attach_script |
| アバターのメッシュ編集 | Mesh (Blender) | decimate, bevel, subdivide |
| アバターのマテリアル作成 | Material (Blender) | create_material, set_color, create_emission_material |
| モデルの入出力 | Object (Blender) | FBXエクスポート、VRMインポート |
| パフォーマンス確認 | Screenshot | get_viewport_screenshot |

## よくある質問

**Q: VRChat SDKと一緒に使えますか？**
A: はい。OpenForgeはUnity Editorの機能を操作します。VRChat SDKはUnityコンポーネントの集まりなので、問題なく共存します。

**Q: Udon / UdonSharpに対応していますか？**
A: Scriptツールを通じてUdonSharpスクリプトの作成・編集が可能です。AIに「UdonSharpで書いて」と伝えてください。

**Q: オフラインで使えますか？**
A: AI（Claude等）への接続にはインターネットが必要です。ただしLM StudioやOllamaでローカルモデルを使用すれば、全てローカルで動作します。

**Q: プロジェクトのデータは外部に送信されますか？**
A: OpenForgeはローカルで動作します。プロジェクトファイルはあなたのマシン上に留まります。AIクライアントに送信されるのは会話のテキストとツールの実行結果のみで、プロジェクトファイルそのものは直接送信されません。
