import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guideSidebar: [
    'intro',
    {
      type: 'category',
      label: 'インストール',
      items: [
        'setup/install',
        'setup/unity',
        'setup/blender',
        'setup/godot',
        'setup/ai-clients',
      ],
    },
    {
      type: 'category',
      label: 'チュートリアル',
      items: [
        'tutorials/first-steps',
        'tutorials/scene-building',
        'tutorials/modeling',
        'tutorials/cross-app',
        'tutorials/save-restore',
        'tutorials/vrchat',
        'tutorials/physics-playground',
        'tutorials/avatar-editing',
        'tutorials/ai-playtest',
      ],
    },
    {
      type: 'category',
      label: '仕組み',
      items: [
        'advanced/architecture',
        'advanced/modes',
        'advanced/http-api',
        'advanced/recipe',
        'advanced/local-llm',
        'advanced/multi-agent',
        'advanced/pipeline-detail',
        'advanced/game-studios',
        'advanced/philosophy',
      ],
    },
  ],
  referenceSidebar: [
    'reference/tool-explorer',
    'reference/unity-tools',
    'reference/blender-tools',
    'reference/godot-tools',
    'reference/system-tools',
    'reference/faq',
    'reference/changelog',
    {
      type: 'category',
      label: '開発に参加する',
      items: [
        'contributing/overview',
        'contributing/add-unity-tool',
        'contributing/add-blender-tool',
        'contributing/add-godot-tool',
        'contributing/project-structure',
      ],
    },
  ],
};

export default sidebars;
