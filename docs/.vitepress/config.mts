import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Upmind",
  description: "Upmind open-source libs documentation",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'UpFlow',
        items: [
          { text: 'Getting started', link: '/upflow' },
        ]
      },
      {
        text: 'UpFlow-Vue',
        items: [
          { text: 'Getting started', link: '/upflow-vue' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'linkedin', link: 'https://www.linkedin.com/company/upmindautomation' }
    ]
  }
})
