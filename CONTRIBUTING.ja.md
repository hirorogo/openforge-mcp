[English version / 英語版](CONTRIBUTING.md)

# OpenForge MCP への貢献

ツールを追加したい、バグを直したい、ドキュメントを改善したい。どんな貢献でも歓迎です。
プログラミング経験の多少は問いません。

---

## 貢献の流れ (初めての方向け)

### 1. リポジトリをフォークする

GitHub 上で右上の「Fork」ボタンを押します。自分のアカウントにコピーが作られます。

### 2. フォークをクローンする

```bash
git clone https://github.com/あなたのユーザー名/openforge-mcp.git
cd openforge-mcp
```

### 3. ブランチを作る

```bash
git checkout -b feature/追加したい機能の名前
```

例: `git checkout -b feature/add-mirror-tool`

### 4. 変更を加える

ファイルを編集して機能を追加・修正します。詳しい手順は下の「ツールの追加方法」を参照してください。

### 5. テストする

```bash
# TypeScript
cd packages/mcp-server && npx vitest run

# Python
cd packages/blender-addon/tests && python -m pytest -v
```

### 6. コミットする

```bash
git add .
git commit -m "変更内容の説明"
```

### 7. push して PR を作る

```bash
git push origin feature/追加したい機能の名前
```

GitHub 上で「Pull Request」ボタンが表示されるので、クリックして PR を作成します。

---

## ツールの追加方法

「こういうツールが欲しい」と思ったら、自分で追加して PR を出せます。

### Unity ツールを追加する場合

3つのファイルを作成/編集します。

**手順1: C# で実装する**

`packages/unity-plugin/Editor/Tools/` にファイルを追加:

```csharp
// 例: packages/unity-plugin/Editor/Tools/MyNewTools.cs
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;

namespace OpenForge.Editor.Tools
{
    public static class MyNewTools
    {
        public static void Register()
        {
            ToolExecutor.RegisterTool("my_new_tool", Execute);
        }

        private static ToolResult Execute(Dictionary<string, string> parameters)
        {
            var name = ToolExecutor.GetRequiredParam(parameters, "name");

            // ここに Unity API を使った処理を書く
            var go = new GameObject(name);
            Undo.RegisterCreatedObjectUndo(go, "Create " + name);

            return ToolResult.Success("Created " + name);
        }
    }
}
```

**手順2: ToolExecutor に登録する**

`packages/unity-plugin/Editor/ToolExecutor.cs` の `EnsureInitialized()` に追加:

```csharp
MyNewTools.Register();
```

**手順3: MCP サーバーにツール定義を追加する**

`packages/mcp-server/src/tools/unity/` に TypeScript ファイルを追加:

```typescript
// 例: packages/mcp-server/src/tools/unity/my_new.ts
import { ToolDefinition } from '../../registry.js';

export const myNewTools: ToolDefinition[] = [
  {
    name: 'my_new_tool',
    description: 'Creates something new',
    category: 'my_category',
    target: 'unity',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the thing to create' },
      },
      required: ['name'],
    },
  },
];
```

`packages/mcp-server/src/server.ts` でインポートして登録:

```typescript
import { myNewTools } from './tools/unity/my_new.js';
// ...
registry.registerTools(myNewTools);
```

### Blender ツールを追加する場合

**手順1: Python で実装する**

`packages/blender-addon/tools/` にファイルを追加:

```python
# 例: packages/blender-addon/tools/my_new_tools.py
import bpy
from typing import Any

def my_new_tool(name: str = "Object", **kwargs: Any) -> dict:
    """Creates something new in Blender."""
    bpy.ops.mesh.primitive_cube_add()
    obj = bpy.context.active_object
    obj.name = name
    return {"name": obj.name, "type": obj.type}

TOOLS = {
    "my_new_tool": my_new_tool,
}
```

**手順2: tool_executor.py にインポートを追加する**

```python
from .tools import my_new_tools
_register_module_tools(my_new_tools)
```

**手順3: MCP サーバーにツール定義を追加する** (Unity と同じ要領)

### Godot ツールを追加する場合

`packages/godot-plugin/addons/openforge/tools/` に GDScript ファイルを追加し、`tool_executor.gd` に登録します。

---

## プロジェクト構成

```
openforge-mcp/
  packages/
    mcp-server/           MCP サーバー (TypeScript)
    unity-plugin/         Unity プラグイン (C#)
    blender-addon/        Blender アドオン (Python)
    godot-plugin/         Godot プラグイン (GDScript)
  website/                ドキュメントサイト (Docusaurus)
```

## コードを書くときのルール

- **絵文字は使わない** (コード、コメント、UI テキスト全て)
- **TODO や stub は書かない** -- 完全な実装を書く
- **コメントは最小限** -- コード自体が説明的であるべき
- **C#:** 変更には必ず `Undo` を使う。namespace は `OpenForge.Editor.Tools`
- **Python:** `TOOLS` dict に関数を登録。型ヒントを書く
- **TypeScript:** strict mode。`any` はテスト以外で避ける

## PR のチェックリスト

- [ ] 新しいツールには MCP 定義 (TypeScript) と実装 (C#/Python/GDScript) の両方がある
- [ ] 既存のテストが全てパスする
- [ ] コードに絵文字がない
- [ ] 変更内容を PR の説明に書いた

## ドキュメントだけの PR も歓迎

コードを書かなくても貢献できます:
- 誤字脱字の修正
- 説明をわかりやすくする
- 新しいチュートリアルの追加
- 翻訳の改善

`website/docs/` のマークダウンファイルを編集して PR を出してください。

## Issue の書き方

バグ報告や機能リクエストは GitHub Issues へ:

- **バグ報告:** 何が起きたか、何が正しいか、再現手順、環境 (OS, Unity/Blender バージョン, AI クライアント)
- **機能リクエスト:** やりたいこと、なぜ必要か

## 質問がある場合

Issue を作成してください。「質問」のラベルを付けてもらえると助かります。
