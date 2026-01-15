// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  sourcemap: { client: "hidden" },
  future: { compatibilityVersion: 4 },

  // SPA loading template shown while app initializes
  spaLoadingTemplate: true,

  // Modules
  modules: ["@vueuse/nuxt", "@sentry/nuxt/module"],

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
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ["vue-router"]
    },
    optimizeDeps: {
      include: ["lodash-es"]
    }
  },

  // Vue compiler options
  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag.startsWith("lord-")
    }
  },

  // TypeScript configuration
  // Note: typeCheck disabled during build due to workspace package compatibility
  // Workspace packages are type-checked separately during their own build
  typescript: {
    strict: true,
    typeCheck: true,
    tsConfig: {
      compilerOptions: {
        // Disable verbatimModuleSyntax to avoid TS1484 errors from workspace packages
        // that don't use `import type` syntax consistently
        verbatimModuleSyntax: false,
        // Match Vue cart's strictness - packages aren't written for this stricter mode
        noUncheckedIndexedAccess: false,
        // Skip type validation of declaration files (workaround for psl module issue)
        skipLibCheck: true
      },
      include: ["app/**/*"],
      exclude: ["node_modules", "dist", ".output", "**/*.spec.*"]
    }
  },

  // Register virtual routes (routes without page files)
  // These routes are handled by middleware/routing engine
  hooks: {
    "pages:extend"(pages) {
      pages.push({ name: "storefront", path: "/storefront" });
    }
  },

  // ---------------------------------------------------------------------------

  // App configuration (SEO defaults, etc.)
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "Upmind Cart",
      meta: [{ name: "description", content: "Upmind E-commerce Cart" }]
    }
  },
  // Global CSS
  css: ["~//main.css"]
});
