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
      { text: 'UpFlow', link: '/@upmind/upflow' },
      { text: 'UpFlow-Vue', link: '/@upmind/upflow-vue' }
    ],
    sidebar: {
      '/@upmind/upflow/': [
        {
          text: 'Guides',
          items: [
            { text: 'Introduction', link: '/@upmind/upflow/' },
            { text: 'Getting Started', link: '/@upmind/upflow/getting-started' },
            // { text: 'Feature 1', link: '/upflow/feature1' }
          ]
        },
        {
          text: 'API Reference',
          items: typedocSidebar[0].items
        }
      ],
      '/@upmind/upflow-vue/': [
        {
          text: 'Guides',
          items: [
            { text: 'Introduction', link: '/@upmind/upflow-vue/' },
            { text: 'Getting Started', link: '/@upmind/upflow-vue/getting-started' },
            // { text: 'Feature 1', link: '/upflow-vue/feature1' }
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
