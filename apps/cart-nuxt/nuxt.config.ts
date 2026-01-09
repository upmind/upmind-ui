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
  ssr: false,

  // Route rules for aliases
  routeRules: {
    "/order": { redirect: "/" },
    "/loading": { redirect: "/" }
  },

  // Modules
  modules: ["@vueuse/nuxt"],

  // Dev server configuration
  devServer: {
    host: "collabstudio.local",
    port: 5173
  },

  // Runtime config for environment variables
  runtimeConfig: {
    public: {
      API_NAME: process.env.VITE_API_NAME || "",
      API_URL: process.env.VITE_API_URL || "",
      API_REGION: process.env.VITE_API_REGION || "",
      GOOGLE_RECAPTCHA_V3_SITE_KEY:
        process.env.VITE_APP_GOOGLE_RECAPTCHA_V3_SITE_KEY || "",
      SENTRY_DSN: process.env.VITE_APP_SENTRY_DSN || ""
    }
  },

  // Alias configuration for monorepo compatibility
  alias: {
    "@": resolve(__dirname, "./app"),
    "@icons": resolve(__dirname, "./app/assets/icons"),
    "@animations": resolve(__dirname, "./app/assets/animations"),
    "@upmind-automation/types": resolve(
      __dirname,
      "../../packages/types/src/index.ts"
    ),
    "@upmind-automation/i18n": resolve(__dirname, "../../packages/i18n/src"),
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

  // Vite configuration
  vite: {
    resolve: {
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
    typeCheck: false,
    tsConfig: {
      include: ["app/**/*", "../../packages/**/*"],
      exclude: ["node_modules", "dist", ".output", "**/*.spec.*"]
    }
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
