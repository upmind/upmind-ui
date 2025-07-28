import { defineConfig } from "vitepress";
import typedocSidebar from "../@upmind-automation/typedoc-sidebar.json";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Upmind",
  description: "Upmind open-source libs documentation",
  srcDir: "./",
  srcExclude: ["**/README.md"],
  outDir: "./dist",
  ignoreDeadLinks: true,
  head: [["link", { rel: "icon", href: "/logo.svg" }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "/logo.svg",
    nav: [
      { text: "Headless", link: "/@upmind-automation/headless" },
      { text: "Headless-vue", link: "/@upmind-automation/headless" }
    ],
    sidebar: {
      "/@upmind-automation/headless/": [
        {
          text: "Guides",
          items: [
            { text: "Introduction", link: "/@upmind-automation/headless/" },
            { text: "Auth", link: "/@upmind-automation/headless/auth-guide" },
            { text: "Brand", link: "/@upmind-automation/headless/brand-guide" },
            {
              text: "System",
              link: "/@upmind-automation/headless/system-guide"
            }
          ]
        },
        {
          text: "API Reference",
          items: typedocSidebar[0].items
        }
      ]
    },
    socialLinks: [
      {
        icon: "linkedin",
        link: "https://www.linkedin.com/company/upmindautomation"
      }
    ]
  }
});
