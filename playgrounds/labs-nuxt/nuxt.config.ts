/**
 * Nuxt Configuration
 * Documentation: https://nuxt.com/docs/api/configuration/nuxt-config
 */

import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

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

  // Build artifacts must never enter the dev watcher: chokidar 4 holds one fd
  // per watched file on macOS, and a populated .output/ (10k+ files) pushes the
  // process past the OS spawn ceiling — every esbuild/fork child then dies with
  // EBADF (same failure class the typeCheck-in-dev comment above dodges).
  ignore: ["**/.output/**", "**/test-results/**"],

  /**
   * ---------------------------------------------------------------------------
   * MODULES
   * Third-party plugins that extend Nuxt functionality
   * Browse available modules: https://nuxt.com/modules
   * ---------------------------------------------------------------------------
   */

  modules: [
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
    name: "Upmind Labs",
    description: "A playground showcasing the Upmind platform",
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
        process.env.VITE_APP_GOOGLE_RECAPTCHA_V3_SITE_KEY || ""
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
    // `@upmind-automation/headless` is deliberately absent: a bare string key
    // in this Record<string, string> also captures every subpath under it,
    // rewriting the package's `testing/*` exports through `index.ts`. It is
    // anchored on the `vite` and `typescript` blocks below instead.
    "@upmind-automation/scenario-harness": resolve(
      __dirname,
      "../../packages/scenario-harness/src/index.ts"
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

  /**
   * ---------------------------------------------------------------------------
   * BUILD TOOLS
   * Vite bundler, Vue compiler, and TypeScript configuration
   * ---------------------------------------------------------------------------
   */

  vite: {
    plugins: [tailwindcss()],
    server: {
      // The QA host the e2e creds are scoped to. Vite allows only localhost
      // and *.localhost by default, so a dev-server restart silently 403s the
      // very origin the recorded corpus and credentials were captured against.
      allowedHosts: ["qa-automation.local"]
    },
    resolve: {
      dedupe: ["vue-router"],
      // Vite's array form takes a RegExp `find`, which Nuxt's `alias` map
      // cannot express — exact-match only, so subpaths fall through to the
      // package's own `exports` map (mirrors `vitest.config.ts`).
      alias: [
        {
          find: /^@upmind-automation\/headless$/,
          replacement: resolve(
            __dirname,
            "../../packages/headless/src/index.ts"
          )
        }
      ]
    },
    optimizeDeps: {
      include: ["lodash-es"]
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
        types: ["google.maps"],
        // Nuxt derives tsconfig `paths` from `alias` too, so the anchor above
        // covers Vite only — without this, types would resolve through
        // node_modules to `dist` while the runtime resolves to src. Exact key
        // (no `/*`), so subpaths still fall to the package's `exports` map.
        paths: {
          "@upmind-automation/headless": [
            resolve(__dirname, "../../packages/headless/src/index.ts")
          ]
        }
      },
      include: ["app/**/*", "modules/**/*"],
      // Nuxt writes these verbatim into `.nuxt/tsconfig.*.json`, and TS
      // resolves a relative pattern against the config's OWN directory — so a
      // bare `**/*.spec.*` matches nothing outside `.nuxt/` and every spec
      // stayed in the app's type program, resolving test-lane-only aliases it
      // has no business knowing. `../` is what makes the exclusion the sibling
      // packages already declare (`tsconfig.build.json`) actually bite.
      exclude: [
        "node_modules",
        "dist",
        ".output",
        "../**/*.spec.*",
        "../**/*.test.*",
        "../**/__tests__/**"
      ]
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
      title: "Upmind Labs",
      meta: [
        {
          name: "description",
          content: "A playground showcasing the Upmind platform"
        }
      ]
    }
  },

  css: ["~//main.css"]
});
