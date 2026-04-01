[English version / 英語版](tool-reference.md)

# ツールリファレンス

## ツールの仕組み

OpenForge は 3 メタツールアーキテクチャを採用しています。数百の個別ツールを AI に公開する代わりに(トークンの浪費を防ぐため)、登録されるツールは 3 つだけです:

1. **list_categories** -- 利用可能なツールカテゴリを返す
2. **list_tools** -- カテゴリ内のツールをパラメータスキーマとともに返す
3. **execute** -- 特定のツールを実行する

AI はオンデマンドでツールを発見します。まずカテゴリを一覧し、1 つを選択し、そのカテゴリからツールを実行します。

## モード

### Full モード (デフォルト)

すべてのツールが利用可能です。大きなコンテキストウィンドウを持つクラウドホスト型モデルに最適です。

### Essential モード

厳選された約 80 のコアツールのサブセットです。コンテキストフットプリントが 62% 削減されます。コンテキストが限られた LM Studio や Ollama で動作するローカル LLM に最適です。

### Dynamic モード

起動時に 8 つの基本ツールが登録されます。追加のツールは AI がリクエストした際にオンデマンドで読み込まれます。GitHub Copilot の動的ツール読み込み機能を持つ VS Code に最適です。

## Unity ツール

### Scene

| ツール | 説明 | 主要パラメータ |
|------|-------------|----------------|
| create_scene | 新しいシーンを作成する | name |
| load_scene | 既存のシーンを開く | path |
| save_scene | 現在のシーンを保存する | path (省略可) |
| get_scene_info | シーンのメタデータを取得する | -- |
| get_hierarchy | シーンの完全なオブジェクトツリーを取得する | -- |

### GameObject

| ツール | 説明 | 主要パラメータ |
|------|-------------|----------------|
| create_gameobject | オブジェクトまたはプリミティブを作成する | name, primitiveType, position |
| find_gameobject | 名前/タグ/レイヤーでオブジェクトを検索する | name, tag, layer, component |
| destroy_gameobject | オブジェクトを削除する | name or path |
| set_transform | 位置/回転/スケールを設定する | name, position, rotation, scale, space |
| set_active | オブジェクトを有効化または無効化する | name, active |
| add_component | コンポーネントを追加する | gameObject, componentType |
| remove_component | コンポーネントを削除する | gameObject, componentType |
| get_components | すべてのコンポーネントを一覧する | name |
| set_parent | 親オブジェクトを変更する | child, parent |
| duplicate | オブジェクトを複製する | name, newName |

### Material

| ツール | 説明 | 主要パラメータ |
|------|-------------|----------------|
| create_material | 新しいマテリアルを作成する | name, shader |
| set_material_color | カラープロパティを設定する | material, property, color |
| set_material_shader | シェーダーを変更する | material, shader |
| set_material_texture | テクスチャを割り当てる | material, property, texturePath |
| set_material_property | 任意のシェーダープロパティを設定する | material, property, value |
| get_material_info | マテリアルの詳細を取得する | material |

### Script

| ツール | 説明 | 主要パラメータ |
|------|-------------|----------------|
| create_script | 新しい C# スクリプトを生成する | name, namespace, template |
| edit_script | 既存のスクリプトを編集する | path, content or find/replace |
| attach_script | オブジェクトにスクリプトを追加する | gameObject, scriptName |
| get_script | スクリプトの内容を読み取る | path |
| search_code | すべてのスクリプトからパターンを検索する | pattern, regex |

### Screenshot

| ツール | 説明 | 主要パラメータ |
|------|-------------|----------------|
| get_viewport_screenshot | シーン/ゲームビューをキャプチャする | source (scene or game), width, height |

## Blender ツール

### Object

| ツール | 説明 | 主要パラメータ |
|------|-------------|----------------|
| create_mesh | プリミティブメッシュを作成する | type (cube, sphere, etc.), location, size |
| transform_object | 位置/回転/スケールを設定する | name, location, rotation, scale |
| duplicate_object | オブジェクトを複製する | name, linked |
| delete_object | オブジェクトを削除する | name |
| set_origin | オブジェクトの原点を設定する | name, type |
| join_objects | オブジェクトを 1 つに結合する | names |
| separate_mesh | メッシュパーツを分離する | name, type |

### Mesh

| ツール | 説明 | 主要パラメータ |
|------|-------------|----------------|
| extrude | 選択した面を押し出す | object, value |
| bevel | エッジをベベルする | object, width, segments |
| subdivide | メッシュを細分化する | object, cuts |
| boolean_operation | ブーリアンモディファイアを適用する | object, other, operation |
| decimate | ポリゴン数を削減する | object, ratio |
| merge_by_distance | 重複頂点を削除する | object, threshold |
| knife_cut | 平面でメッシュを切断する | object, plane_co, plane_no |

### Material

| ツール | 説明 | 主要パラメータ |
|------|-------------|----------------|
| create_material | Principled BSDF マテリアルを作成する | name, color |
| set_color | ベースカラーを設定する | material, color |
| set_metallic | メタリック値を設定する | material, value |
| set_roughness | ラフネス値を設定する | material, value |
| create_glass_material | ガラスマテリアルを作成する | name, ior, color |
| create_emission_material | 発光マテリアルを作成する | name, color, strength |

### Scene

| ツール | 説明 | 主要パラメータ |
|------|-------------|----------------|
| get_scene_info | シーンのメタデータを取得する | -- |
| get_objects_list | すべてのオブジェクトを一覧する | type_filter |
| set_render_engine | レンダーエンジンを切り替える | engine (cycles, eevee, workbench) |
| set_resolution | レンダー解像度を設定する | x, y, percentage |
| set_frame_range | アニメーションのフレーム範囲を設定する | start, end |

### Screenshot

| ツール | 説明 | 主要パラメータ |
|------|-------------|----------------|
| get_viewport_screenshot | 3D ビューポートをキャプチャする | width, height |
