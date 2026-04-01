import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

function Feature({title, description}: {title: string; description: string}) {
  return (
    <div className="col col--6" style={{marginBottom: '1.5rem'}}>
      <div className="feature-card">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className="hero" style={{textAlign: 'center'}}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p style={{fontSize: '1rem', color: 'var(--ifm-color-emphasis-600)', maxWidth: 600, margin: '0 auto 2rem'}}>
          Unity, Blender, Godotを自然言語で操作できる無料のMCPサーバー。
          プログラミング不要。MIT License。
        </p>
        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            はじめる
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

function Features() {
  const features = [
    {
      title: 'AIが画面を見て自分で直す',
      description:
        'スクリーンショットを撮ってAIが結果を確認。「建物の間隔が狭いので調整します」と自律的に修正します。',
    },
    {
      title: 'BlenderとUnityを1会話でまたぐ',
      description:
        'Blenderでモデリング、最適化、Unityにインポート、配置。全部1つの会話で完結。アプリの切り替え不要。',
    },
    {
      title: '「セーブして」「戻して」で管理',
      description:
        'Gitを知らなくても大丈夫。RPGのセーブポイントと同じ感覚でプロジェクトの状態を保存・復元。',
    },
    {
      title: 'AIがゲームを遊んでバグを見つける',
      description:
        'PlayModeでゲームを実行し、入力をシミュレート。エラーやパフォーマンス問題を自動で報告。',
    },
    {
      title: '350種類以上のツール',
      description:
        'シーン管理、オブジェクト作成、マテリアル、スクリプト、アニメーション、物理、UI、VFX、地形など。Unity, Blender, Godotに対応。',
    },
    {
      title: '完全無料、ずっと無料',
      description:
        'MITライセンスのオープンソース。サブスクなし、買い切りですらない。誰でも自由に使える。',
    },
  ];

  return (
    <section className="features-section">
      <div className="container">
        <div className="row">
          {features.map((f, i) => (
            <Feature key={i} title={f.title} description={f.description} />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickExample() {
  return (
    <section style={{padding: '3rem 0', background: 'var(--ifm-color-emphasis-100)'}}>
      <div className="container">
        <Heading as="h2" style={{textAlign: 'center', marginBottom: '2rem'}}>
          こう言うだけで、こうなります
        </Heading>
        <div className="row">
          <div className="col col--6">
            <pre style={{background: 'var(--ifm-color-emphasis-0)', padding: '1.5rem', borderRadius: 8, border: '1px solid var(--ifm-color-emphasis-200)'}}>
{`「廃墟の街を作って、壊れたビルを5棟配置して」

「Blenderで椅子を作って、Unityの部屋に配置して」

「ネオンに光るマテリアルを作って看板に適用して」

「テストプレイしてバグがないか確認して」

「セーブして」`}
            </pre>
          </div>
          <div className="col col--6" style={{display: 'flex', alignItems: 'center'}}>
            <div>
              <p style={{fontSize: '1.1rem', lineHeight: 1.8}}>
                日本語でも英語でもOK。
                AIがあなたの指示を理解して、Unity/Blender/Godotを直接操作します。
              </p>
              <p style={{fontSize: '1.1rem', lineHeight: 1.8}}>
                結果に納得いかなければ「直して」と言うだけ。
                AIが画面を見て、自分で修正します。
              </p>
              <Link className="button button--primary" to="/docs/tutorials/first-steps">
                チュートリアルを見る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InstallSection() {
  return (
    <section style={{padding: '3rem 0', textAlign: 'center'}}>
      <div className="container">
        <Heading as="h2" style={{marginBottom: '1rem'}}>
          コマンド1つで始められる
        </Heading>
        <p style={{color: 'var(--ifm-color-emphasis-600)', marginBottom: '2rem'}}>
          AIアプリを自動で検出して設定します。JSONを手で書く必要はありません。
        </p>
        <pre style={{
          display: 'inline-block',
          textAlign: 'left',
          padding: '1rem 2rem',
          borderRadius: 8,
          fontSize: '1.1rem',
        }}>
          npx openforge-mcp setup
        </pre>
        <div style={{marginTop: '2rem'}}>
          <Link className="button button--outline button--primary" to="/docs/setup/install">
            インストール手順を見る
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="AIで Unity / Blender / Godot を操作"
      description="自然言語でUnity、Blender、Godotを操作できる無料のMCPサーバー">
      <HomepageHeader />
      <main>
        <Features />
        <QuickExample />
        <InstallSection />
      </main>
    </Layout>
  );
}
