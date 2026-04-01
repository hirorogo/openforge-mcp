import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <header style={{padding: '5rem 0 3rem', textAlign: 'center'}}>
      <div className="container">
        <Heading as="h1" style={{fontSize: '3rem', fontWeight: 800, marginBottom: '1rem'}}>
          AIに話しかけるだけで<br/>Unity・Blender・Godotが動く
        </Heading>
        <p style={{fontSize: '1.3rem', color: 'var(--ifm-color-emphasis-700)', maxWidth: 700, margin: '0 auto 1rem'}}>
          「廃墟の街を作って」「アバターのポリゴンを減らして」「バグがないかテストして」
        </p>
        <p style={{fontSize: '1.1rem', color: 'var(--ifm-color-emphasis-600)', maxWidth: 600, margin: '0 auto 2.5rem'}}>
          日本語OK。プログラミング不要。完全無料。
        </p>
        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
          <Link className="button button--primary button--lg" to="/docs/setup/install">
            インストール
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            できることを見る
          </Link>
          <Link
            className="button button--outline button--lg"
            href="https://github.com/hirorogo/openforge-mcp">
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  What it does (conversation demo)                                   */
/* ------------------------------------------------------------------ */
function ConversationDemo() {
  const exchanges = [
    {user: '壊れたビルが並ぶ廃墟の街を作って', ai: 'Terrain + 建物5棟 + ひび割れ道路 + 夕暮れライティングを配置しました。スクリーンショットを確認します...建物の間隔を調整しました。'},
    {user: 'Blenderで椅子を作って、Unityの部屋に配置して', ai: 'Blenderでメッシュ生成 → ポリゴン最適化 → FBXエクスポート → Unityにインポート → 部屋に配置しました。'},
    {user: 'テストプレイしてバグがないか確認して', ai: 'PlayModeで実行しました。2件検出: 着地時にNullReferenceException / FPSが座標(100,0,200)付近で25に低下。'},
    {user: 'セーブして', ai: 'セーブポイント #12 を作成しました: 「廃墟シーン構築 + 椅子配置 + バグ修正前」'},
  ];

  return (
    <section style={{padding: '4rem 0', background: 'var(--ifm-color-emphasis-100)'}}>
      <div className="container">
        <Heading as="h2" style={{textAlign: 'center', marginBottom: '0.5rem'}}>
          こう話しかけるだけ
        </Heading>
        <p style={{textAlign: 'center', color: 'var(--ifm-color-emphasis-600)', marginBottom: '2.5rem'}}>
          AIがUnity・Blender・Godotを直接操作します
        </p>
        <div style={{maxWidth: 750, margin: '0 auto'}}>
          {exchanges.map((ex, i) => (
            <div key={i} style={{marginBottom: '1.5rem'}}>
              <div style={{
                background: 'var(--ifm-color-primary)',
                color: '#fff',
                padding: '0.8rem 1.2rem',
                borderRadius: '12px 12px 4px 12px',
                marginBottom: '0.5rem',
                marginLeft: '3rem',
                fontSize: '0.95rem',
              }}>
                {ex.user}
              </div>
              <div style={{
                background: 'var(--ifm-color-emphasis-0)',
                border: '1px solid var(--ifm-color-emphasis-200)',
                padding: '0.8rem 1.2rem',
                borderRadius: '12px 12px 12px 4px',
                marginRight: '3rem',
                fontSize: '0.9rem',
                color: 'var(--ifm-color-emphasis-700)',
              }}>
                {ex.ai}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Key differentiators                                                */
/* ------------------------------------------------------------------ */
function Differentiators() {
  const items = [
    {
      title: 'AIが結果を見て自分で直す',
      desc: 'スクリーンショットで出来栄えを確認し、問題があれば自律的に修正。指示→確認→修正のループをAIが自動で回します。',
    },
    {
      title: 'BlenderとUnityを1会話で横断',
      desc: 'Blenderでモデリング → 最適化 → Unityにインポート → シーンに配置。アプリの切り替え不要。',
    },
    {
      title: '「セーブして」「戻して」で安心',
      desc: 'Gitを知らなくてもバージョン管理。壊れても一言で復元。破壊的な操作の前に自動バックアップ。',
    },
    {
      title: 'AIがゲームを遊んでバグ発見',
      desc: 'PlayModeでゲームを実行、入力をシミュレート。エラー・パフォーマンス問題を自動レポート。',
    },
    {
      title: 'テキストから3Dモデルやテクスチャを生成',
      desc: 'Rodin, Meshy, Stable Diffusion, DALL-E などと連携。生成→最適化→配置まで自動。',
    },
    {
      title: '自分のツールを1行で追加',
      desc: 'C#なら [OpenForgeTool]、Pythonなら @openforge_tool を付けるだけ。コミュニティでツールを共有できます。',
    },
  ];

  return (
    <section style={{padding: '4rem 0'}}>
      <div className="container">
        <Heading as="h2" style={{textAlign: 'center', marginBottom: '0.5rem'}}>
          他にはない機能
        </Heading>
        <p style={{textAlign: 'center', color: 'var(--ifm-color-emphasis-600)', marginBottom: '2.5rem'}}>
          既存ツールにはない独自の設計
        </p>
        <div className="row">
          {items.map((item, i) => (
            <div className="col col--4" key={i} style={{marginBottom: '1.5rem'}}>
              <div style={{
                border: '1px solid var(--ifm-color-emphasis-200)',
                borderRadius: 8,
                padding: '1.5rem',
                height: '100%',
              }}>
                <h3 style={{fontSize: '1.05rem', marginTop: 0, marginBottom: '0.5rem'}}>{item.title}</h3>
                <p style={{color: 'var(--ifm-color-emphasis-700)', marginBottom: 0, fontSize: '0.9rem', lineHeight: 1.6}}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Numbers                                                            */
/* ------------------------------------------------------------------ */
function Numbers() {
  const stats = [
    {num: '620+', label: 'ツール'},
    {num: '3', label: '対応エンジン'},
    {num: '7+', label: '対応AIクライアント'},
    {num: '0円', label: '永久に無料'},
  ];

  return (
    <section style={{padding: '3rem 0', background: 'var(--ifm-color-emphasis-100)'}}>
      <div className="container">
        <div className="row" style={{textAlign: 'center'}}>
          {stats.map((s, i) => (
            <div className="col col--3" key={i}>
              <div style={{fontSize: '2.5rem', fontWeight: 800, color: 'var(--ifm-color-primary)'}}>{s.num}</div>
              <div style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '0.95rem'}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Supported tools overview                                           */
/* ------------------------------------------------------------------ */
function ToolsOverview() {
  const engines = [
    {
      name: 'Unity',
      count: '202',
      categories: 'Scene, GameObject, Material, Script, Animation, Physics, UI, Lighting, Camera, Terrain, VFX, Weather, Timeline, Prefab, Audio, NavMesh, Build, Input, Template, Optimization, Playtest, ML-Agents',
    },
    {
      name: 'Blender',
      count: '396',
      categories: 'Object, Mesh, Material, Animation, Armature, UV, Render, VRM, ShapeKey, WeightPaint, Sculpt, Texture, Node, Modifier, Camera, Lighting, Bake, Batch, Avatar, ClothFitting, BodyShape, GameAsset, Inspection, Procedural, Import/Export, Collection, MeshRepair',
    },
    {
      name: 'Godot',
      count: '20',
      categories: 'Node, Resource, Screenshot',
    },
  ];

  return (
    <section style={{padding: '4rem 0'}}>
      <div className="container">
        <Heading as="h2" style={{textAlign: 'center', marginBottom: '2.5rem'}}>
          対応ツール
        </Heading>
        <div className="row">
          {engines.map((e, i) => (
            <div className="col col--4" key={i}>
              <div style={{
                border: '1px solid var(--ifm-color-emphasis-200)',
                borderRadius: 8,
                padding: '1.5rem',
                height: '100%',
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem'}}>
                  <h3 style={{margin: 0}}>{e.name}</h3>
                  <span style={{fontSize: '1.5rem', fontWeight: 700, color: 'var(--ifm-color-primary)'}}>{e.count}</span>
                </div>
                <p style={{fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)', lineHeight: 1.6, marginBottom: 0}}>{e.categories}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign: 'center', marginTop: '1.5rem'}}>
          <Link to="/docs/reference/unity-tools" style={{marginRight: '1rem'}}>Unity ツール一覧</Link>
          <Link to="/docs/reference/blender-tools" style={{marginRight: '1rem'}}>Blender ツール一覧</Link>
          <Link to="/docs/reference/godot-tools">Godot ツール一覧</Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Supported AI clients                                               */
/* ------------------------------------------------------------------ */
function AIClients() {
  const clients = [
    'Claude Desktop',
    'Cursor',
    'VS Code (GitHub Copilot)',
    'Claude Code CLI',
    'Gemini CLI',
    'LM Studio',
    'Ollama',
  ];

  return (
    <section style={{padding: '3rem 0', background: 'var(--ifm-color-emphasis-100)'}}>
      <div className="container" style={{textAlign: 'center'}}>
        <Heading as="h2" style={{marginBottom: '1.5rem'}}>対応AIクライアント</Heading>
        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
          {clients.map((c, i) => (
            <span key={i} style={{
              border: '1px solid var(--ifm-color-emphasis-300)',
              borderRadius: 6,
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              background: 'var(--ifm-color-emphasis-0)',
            }}>{c}</span>
          ))}
        </div>
        <p style={{marginTop: '1rem', color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem'}}>
          LM Studio / Ollama ならローカル実行。API費用ゼロ、データも外部に送信されません。
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Install CTA                                                        */
/* ------------------------------------------------------------------ */
function InstallCTA() {
  return (
    <section style={{padding: '4rem 0', textAlign: 'center'}}>
      <div className="container">
        <Heading as="h2" style={{marginBottom: '0.5rem'}}>
          始めよう
        </Heading>
        <p style={{color: 'var(--ifm-color-emphasis-600)', marginBottom: '2rem', fontSize: '1.05rem'}}>
          AIアプリを自動検出して設定します
        </p>
        <pre style={{
          display: 'inline-block',
          textAlign: 'left',
          padding: '1rem 2.5rem',
          borderRadius: 8,
          fontSize: '1.2rem',
          marginBottom: '2rem',
        }}>
          npx openforge-mcp setup
        </pre>
        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
          <Link className="button button--primary button--lg" to="/docs/setup/install">
            インストールガイド
          </Link>
          <Link className="button button--outline button--lg" to="/docs/tutorials/first-steps">
            最初のチュートリアル
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Home(): ReactNode {
  return (
    <Layout
      title="AIに話しかけるだけでUnity・Blender・Godotが動く"
      description="自然言語でUnity、Blender、Godotを操作できる無料のMCPサーバー。620以上のツール。">
      <Hero />
      <main>
        <ConversationDemo />
        <Differentiators />
        <Numbers />
        <ToolsOverview />
        <AIClients />
        <InstallCTA />
      </main>
    </Layout>
  );
}
