/**
 * Nuxt Configuration
 * Documentation: https://nuxt.com/docs/api/configuration/nuxt-config
 */

import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";
import { upmindTokensCss } from "@upmind/tokens/vite";
import { set } from "lodash-es";
// -----------------------------------------------------------------------------

// Enable typeCheck only during build (not dev) to avoid spawn EBADF error on macOS
const isBuild =
  process.argv.includes("build") || process.argv.includes("generate");

export default defineNuxtConfig({
  /**
   * ---------------------------------------------------------------------------
   * CORE SETTINGS
   * Basic Nuxt behavior: rendering mode, compatibility, and developer tools
   * ---------------------------------------------------------------------------
   */

  ssr: false, // SPA mode (set to true for server-side rendering)
  compatibilityDate: "2025-07-15",
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },
  sourcemap: { client: "hidden" },
  spaLoadingTemplate: true,

  /**
   * ---------------------------------------------------------------------------
   * MODULES
   * Third-party plugins that extend Nuxt functionality
   * Browse available modules: https://nuxt.com/modules
   * ---------------------------------------------------------------------------
   */

  modules: [
    "@sentry/nuxt/module", // Error tracking
    "@nuxtjs/seo" // SEO toolkit (robots, sitemap, schema.org)
  ],

  /**
   * ---------------------------------------------------------------------------
   * SEO CONFIGURATION
   * Search engine optimization settings for @nuxtjs/seo module
   * Docs: https://nuxtseo.com/
   * ---------------------------------------------------------------------------
   */

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || "https://cart.upmind.com",
    name: "Upmind Cart",
    description: "Upmind E-commerce Cart",
    defaultLocale: "en"
  },

  seo: {
    automaticDefaults: true
  },

  // Sitemap works in SPA mode (generates at build time)
  sitemap: {
    enabled: true
  },

  // Robots.txt works in SPA mode
  robots: {
    enabled: true
  },

  // Schema.org for structured data (works in SPA via client-side JS)
  schemaOrg: {
    enabled: true
  },

  // OG Image disabled - requires SSR
  ogImage: {
    enabled: false
  },

  /**
   * ---------------------------------------------------------------------------
   * RUNTIME CONFIGURATION
   * Environment variables accessible in the app via useRuntimeConfig()
   * ---------------------------------------------------------------------------
   */

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

  /**
   * ---------------------------------------------------------------------------
   * PATH ALIASES
   * Shorthand imports for monorepo packages and app directories
   * ---------------------------------------------------------------------------
   */

  alias: {
    // App directories
    "@": resolve(__dirname, "./app"),
    "@icons": resolve(__dirname, "../../packages/icons/assets"),
    "@animations": resolve(__dirname, "./app/assets/animations"),

    // Monorepo packages
    "@upmind-automation/types": resolve(
      __dirname,
      "../../packages/types/src/index.ts"
    ),
    "@upmind-automation/i18n": resolve(__dirname, "../../packages/i18n/src"),
    "@upmind-automation/headless": resolve(
      __dirname,
      "../../packages/headless/src/index.ts"
    ),
    "@upmind/ui/styles": resolve(
      __dirname,
      "../../design-system/packages/ui/src/styles/index.css"
    ),
    "@upmind/ui": resolve(
      __dirname,
      "../../design-system/packages/ui/src/index.ts"
    ),
    "@upmind-automation/foundation/styles": resolve(
      __dirname,
      "../../packages/modules-foundation/src/styles.css"
    ),
    "@upmind-automation/foundation": resolve(
      __dirname,
      "../../packages/modules-foundation/src/index.ts"
    ),
    "@upmind-automation/product/styles": resolve(
      __dirname,
      "../../packages/modules-product/src/styles.css"
    ),
    "@upmind-automation/product": resolve(
      __dirname,
      "../../packages/modules-product/src/index.ts"
    ),
    "@upmind-automation/recommendations/styles": resolve(
      __dirname,
      "../../packages/modules-recommendations/src/styles.css"
    ),
    "@upmind-automation/recommendations": resolve(
      __dirname,
      "../../packages/modules-recommendations/src/index.ts"
    ),
    "@upmind-automation/catalogue/styles": resolve(
      __dirname,
      "../../packages/modules-catalogue/src/styles.css"
    ),
    "@upmind-automation/catalogue": resolve(
      __dirname,
      "../../packages/modules-catalogue/src/index.ts"
    ),
    "@upmind-automation/domain/styles": resolve(
      __dirname,
      "../../packages/modules-domain/src/styles.css"
    ),
    "@upmind-automation/domain": resolve(
      __dirname,
      "../../packages/modules-domain/src/index.ts"
    ),
    "@upmind-automation/auth/styles": resolve(
      __dirname,
      "../../packages/modules-auth/src/styles.css"
    ),
    "@upmind-automation/auth": resolve(
      __dirname,
      "../../packages/modules-auth/src/index.ts"
    ),
    "@upmind-automation/client/styles": resolve(
      __dirname,
      "../../packages/modules-client/src/styles.css"
    ),
    "@upmind-automation/client": resolve(
      __dirname,
      "../../packages/modules-client/src/index.ts"
    ),
    "@upmind-automation/payment/styles": resolve(
      __dirname,
      "../../packages/modules-payment/src/styles.css"
    ),
    "@upmind-automation/payment": resolve(
      __dirname,
      "../../packages/modules-payment/src/index.ts"
    ),
    "@upmind-automation/invoice/styles": resolve(
      __dirname,
      "../../packages/modules-invoice/src/styles.css"
    ),
    "@upmind-automation/invoice": resolve(
      __dirname,
      "../../packages/modules-invoice/src/index.ts"
    ),
    "@upmind-automation/basket/styles": resolve(
      __dirname,
      "../../packages/modules-basket/src/styles.css"
    ),
    "@upmind-automation/basket": resolve(
      __dirname,
      "../../packages/modules-basket/src/index.ts"
    )
  },

  /**
   * ---------------------------------------------------------------------------
   * BUILD TOOLS
   * Vite bundler, Vue compiler, and TypeScript configuration
   * ---------------------------------------------------------------------------
   */

  vite: {
    plugins: [upmindTokensCss(), tailwindcss()],
    resolve: {
      dedupe: ["vue-router"]
    },
    optimizeDeps: {
      include: ["lodash-es"]
    },
    server: {
      // Vite's startup scan misses these files, so their packages load late and reload the page.
      warmup: {
        clientFiles: [
          resolve(__dirname, "app/pages/**/*.vue"),
          resolve(__dirname, "app/plugins/**/*.ts"),
          resolve(__dirname, "app/shell/**/*.{vue,ts}")
        ]
      }
    }
  },

  vue: {
    compilerOptions: {
      // Treat <lord-*> as custom elements (for lord-icon web components)
      isCustomElement: (tag: string) => tag.startsWith("lord-")
    }
  },

  typescript: {
    strict: true,
    typeCheck: isBuild, // Only during build (macOS EBADF bug in dev)
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: false,
        skipLibCheck: true,
        // the upmind-ui alias resolves to source, whose imports carry .ts extensions
        allowImportingTsExtensions: true
      },
      include: ["app/**/*"],
      exclude: ["node_modules", "dist", ".output", "**/*.spec.*"]
    }
  },

  hooks: {
    // DevTools watches every Nitro storage mount, and `root` is the whole app folder.
    "nitro:config": nitroConfig => {
      set(nitroConfig, "devStorage.root", {
        driver: "fs",
        readOnly: true,
        base: nitroConfig.rootDir,
        // A regex, not globs: globs miss paths under a dot folder such as ~/.worktrees.
        watchOptions: {
          ignored: [
            /[\\/](node_modules|\.git|\.output|dist|\.nuxt|\.data|graphify-out)([\\/]|$)/
          ]
        }
      });
    }
  },

  /**
   * ---------------------------------------------------------------------------
   * APP SETTINGS
   * Global HTML head tags and stylesheets
   * ---------------------------------------------------------------------------
   */

  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "Upmind Cart",
      meta: [{ name: "description", content: "Upmind E-commerce Cart" }]
    }
  },

  // Absolute, not `~/`: an extending layer resolves `~` to its own srcDir.
  css: [resolve(__dirname, "./app/main.css")]
});
