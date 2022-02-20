import { defineConfigWithTheme } from 'vitepress';

export default defineConfigWithTheme({
  lang: 'en-US',
  title: 'Varm',
  head: [],
  locales: {
    '/': {
      lang: 'en-US',
      title: 'Varm',
      description: 'Varm is a form validation library for Vue.js',
    },
    '/zh-TW/': {
      lang: 'zh-TW',
      title: 'Varm',
      description: 'Varm 是一個 Vue.js 的表單驗證套件',
    },
  },
  themeConfig: {
    repo: 'Jay0328/varm',
    docsRepo: 'Jay0328/varm',
    docsDir: 'docs',
    docsBranch: 'main',
    editLinks: true,
  },
});
