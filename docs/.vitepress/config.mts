import { defineConfig } from 'vitepress'
import typedocSidebar from '../@upmind/typedoc-sidebar.json'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Upmind",
  description: "Upmind open-source libs documentation",
  srcDir: './',
  outDir: './dist',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Headless', link: '/@upmind/headless' },
      { text: 'Headless-vue', link: '/@upmind/headless-vue' }
    ],
    sidebar: {
      '/@upmind/headless/': [
        {
          text: 'Guides',
          items: [
            { text: 'Introduction', link: '/@upmind/headless/' },
            { text: 'Getting Started', link: '/@upmind/headless/getting-started' },
            // { text: 'Feature 1', link: '/upflow/feature1' }
          ]
        },
        {
          text: 'API Reference',
          items: typedocSidebar[0].items
        }
      ],
      '/@upmind/headless-vue/': [
        {
          text: 'Guides',
          items: [
            { text: 'Introduction', link: '/@upmind/headless-vue/' },
            { text: 'Getting Started', link: '/@upmind/headless-vue/getting-started' },
            { text: 'Auth', link: '/@upmind/headless-vue/auth-guide' },
            { text: 'Brand', link: '/@upmind/headless-vue/brand-guide' },
            // { text: 'Feature 1', link: '/headless-vue/feature1' }
          ]
        },
        {
          text: 'API Reference',
          items: typedocSidebar[1].items
        }
      ]
    },
    socialLinks: [
      { icon: 'linkedin', link: 'https://www.linkedin.com/company/upmindautomation' }
    ]
  },
})
