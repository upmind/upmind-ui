// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from "path";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // Future compatibility with Nuxt 4
  future: {
    compatibilityVersion: 4
  },

  // SSR enabled by default
  ssr: true,

  // Modules
  modules: ["@vueuse/nuxt"],

  // Runtime config for environment variables
  runtimeConfig: {
    public: {
      // Environment-specific settings here
    }
  },

  // Vite configuration for monorepo compatibility
  vite: {
    resolve: {
      alias: {
        "@": resolve(__dirname, "./app"),
        "@icons": resolve(__dirname, "./app/assets/icons"),
        "@animations": resolve(__dirname, "./app/assets/animations"),
        "@upmind-automation/types": resolve(
          __dirname,
          "../../packages/types/src/index.ts"
        ),
        "@upmind-automation/i18n": resolve(
          __dirname,
          "../../packages/i18n/src"
        ),
        "@upmind-automation/headless": resolve(
          __dirname,
          "../../packages/headless/src/index.ts"
        ),
        "@upmind-automation/upmind-ui/styles": resolve(
          __dirname,
          "../../packages/ui/src/assets/styles/index.css"
        ),
        "@upmind-automation/upmind-ui/vars": resolve(
          __dirname,
          "../../packages/ui/src/assets/styles/vars.css"
        ),
        "@upmind-automation/upmind-ui": resolve(
          __dirname,
          "../../packages/ui/src/index.ts"
        ),
        "@upmind-automation/client-vue/styles": resolve(
          __dirname,
          "../../packages/client-vue/src/assets/styles/index.css"
        ),
        "@upmind-automation/client-vue/vars": resolve(
          __dirname,
          "../../packages/client-vue/src/assets/styles/vars.css"
        ),
        "@upmind-automation/client-vue": resolve(
          __dirname,
          "../../packages/client-vue/src/index.ts"
        )
      },
      dedupe: ["vue-router"]
    },
    optimizeDeps: {
      include: ["lodash-es"]
    }
  },

  // TypeScript configuration
  // Note: typeCheck disabled during build due to workspace package compatibility
  // Workspace packages are type-checked separately during their own build
  typescript: {
    strict: true,
    typeCheck: false
  },

  // App configuration (SEO defaults, etc.)
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "Upmind Cart",
      meta: [{ name: "description", content: "Upmind E-commerce Cart" }]
    }
  }
});
