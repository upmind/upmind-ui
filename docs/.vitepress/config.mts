import { defineConfig } from 'vitepress'
import typedocSidebar from '../@upmind-automation/typedoc-sidebar.json'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Upmind",
  description: "Upmind open-source libs documentation",
  srcDir: './',
  srcExclude: ['**/README.md'],
  outDir: './dist',
  head: [['link', { rel: 'icon', href: '/logo.svg' }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.svg',
    nav: [
      { text: 'Headless', link: '/@upmind-automation/headless' },
      { text: 'Headless-vue', link: '/@upmind-automation/headless-vue' }
    ],
    sidebar: {
      '/@upmind-automation/headless/': [
        {
          text: 'Guides',
          items: [
            { text: 'Introduction', link: '/@upmind-automation/headless/' }
          ]
        },
        {
          text: 'API Reference',
          items: typedocSidebar[0].items
        }
      ],
      '/@upmind-automation/headless-vue/': [
        {
          text: 'Guides',
          items: [
            { text: 'Introduction', link: '/@upmind-automation/headless-vue/' },
            { text: 'Auth', link: '/@upmind-automation/headless-vue/auth-guide' },
            { text: 'Brand', link: '/@upmind-automation/headless-vue/brand-guide' },
            { text: 'System', link: '/@upmind-automation/headless-vue/system-guide' },
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
