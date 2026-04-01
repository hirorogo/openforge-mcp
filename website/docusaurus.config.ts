import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'OpenForge MCP',
  tagline: 'AIに話しかけるだけで、UnityとBlenderを操作できる',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://hirorogo.github.io',
  baseUrl: '/openforge-mcp/',

  organizationName: 'hirorogo',
  projectName: 'openforge-mcp',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    localeConfigs: {
      ja: { label: '日本語' },
      en: { label: 'English' },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/hirorogo/openforge-mcp/tree/main/website/',
          breadcrumbs: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    ['@easyops-cn/docusaurus-search-local', {
      hashed: true,
      language: ['ja', 'en'],
      highlightSearchTermsOnTargetPage: true,
      searchResultLimits: 8,
    }],
  ],

  themeConfig: {
    announcementBar: {
      id: 'v030_release',
      content: 'v0.3.0 リリース -- 620以上のツール、全機能実装完了',
      backgroundColor: '#1a56db',
      textColor: '#ffffff',
      isCloseable: true,
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
      },
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
    navbar: {
      title: 'OpenForge MCP',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guideSidebar',
          position: 'left',
          label: 'ガイド',
        },
        {
          type: 'docSidebar',
          sidebarId: 'referenceSidebar',
          position: 'left',
          label: 'ツール一覧',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/hirorogo/openforge-mcp',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'ガイド',
          items: [
            { label: 'はじめに', to: '/docs/intro' },
            { label: 'インストール', to: '/docs/setup/install' },
            { label: 'VRChat向け', to: '/docs/tutorials/vrchat' },
          ],
        },
        {
          title: 'リンク',
          items: [
            { label: 'GitHub', href: 'https://github.com/hirorogo/openforge-mcp' },
          ],
        },
      ],
      copyright: `OpenForge MCP -- MIT License`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'csharp', 'python', 'yaml', 'gdscript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
