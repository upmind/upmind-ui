/**
 * Nuxt Configuration
 * Documentation: https://nuxt.com/docs/api/configuration/nuxt-config
 */

import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

// Enable typeCheck only during build (not dev) to avoid spawn EBADF error on macOS
const isBuild =
  process.argv.includes("build") || process.argv.includes("generate");

// A pinned per-brand dev server (dev:hostgrid) must not share one build dir
// with a bare `pnpm dev`: each rewrites .nuxt's app manifest with its own
// build id, so the browser's /_nuxt/builds/meta/dev.json 404s under whichever
// server wrote last. The pin keys a private build dir and vite cache; a bare
// `pnpm dev` (and `nuxt typecheck`, which extends .nuxt/tsconfig.json) keeps
// the plain paths.
const portalShape = process.env.NUXT_PUBLIC_PORTAL_CONFIG ?? "";

export default defineNuxtConfig({
  buildDir: portalShape === "" ? ".nuxt" : `.nuxt/${portalShape}`,

  /**
   * ---------------------------------------------------------------------------
   * CORE SETTINGS
   * Basic Nuxt behavior: rendering mode, compatibility, and developer tools
   * ---------------------------------------------------------------------------
   */

  ssr: false, // SPA mode (set to true for server-side rendering)

  // ADR 023 §9 — the per-package feature list. `routes: false` because this app
  // owns its own auth paths (`/login`, `/register`, `/forgotten-password`).
  modules: ["@upmind-automation/auth/nuxt"],

  auth: { routes: false },
  compatibilityDate: "2025-07-15",
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },
  sourcemap: { client: "hidden" },
  // The pre-paint theme script owns first paint; a spinner with hardcoded
  // colours would flash against every non-default theme.
  spaLoadingTemplate: false,

  /**
   * ---------------------------------------------------------------------------
   * RUNTIME CONFIG
   * Which product shape this server boots as
   * ---------------------------------------------------------------------------
   */

  runtimeConfig: {
    public: {
      // Nuxt maps NUXT_PUBLIC_PORTAL_CONFIG onto this. Empty = no pin, so a
      // plain `pnpm dev` boots DEFAULT_PORTAL_CONFIG_ID. `pnpm dev:hostgrid`
      // sets it, which is what lets a pinned server run beside a bare one
      // without a `?config=` on every URL.
      portalConfig: ""
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

    // Monorepo packages
    // headless resolves to SOURCE, mirroring cart-nuxt. This app's OWN files
    // still reach it type-only — ESLint fences them (no-restricted-imports,
    // allowTypeImports) in the root config — but the ADR 023 `auth` package
    // brings it in as a value dependency, so the barrel does execute here.
    "@upmind-automation/headless": resolve(
      __dirname,
      "../../packages/headless/src/index.ts"
    ),
    "@upmind-automation/types": resolve(
      __dirname,
      "../../packages/types/src/index.ts"
    ),
    // A directory, not a barrel: headless glob-imports the locale files, and a
    // glob needs a path it can walk. Reachable from here since the ADR 023
    // `auth` package brought headless in as a VALUE dependency.
    "@upmind-automation/i18n": resolve(__dirname, "../../packages/i18n/src"),
    "@upmind/ui/styles": resolve(
      __dirname,
      "../../design-system/packages/ui/src/styles/index.css"
    ),
    "@upmind/ui": resolve(
      __dirname,
      "../../design-system/packages/ui/src/index.ts"
    ),

    // ADR 023 domain packages. Source-consumed, like every alias above.
    "@upmind-automation/foundation": resolve(
      __dirname,
      "../../packages/foundation/src/index.ts"
    ),
    "@upmind-automation/product": resolve(
      __dirname,
      "../../packages/product/src/index.ts"
    ),
    "@upmind-automation/recommendations": resolve(
      __dirname,
      "../../packages/recommendations/src/index.ts"
    ),
    "@upmind-automation/catalogue": resolve(
      __dirname,
      "../../packages/catalogue/src/index.ts"
    ),
    "@upmind-automation/domain": resolve(
      __dirname,
      "../../packages/domain/src/index.ts"
    ),
    // The subpath alias must precede the bare one: an app-level alias is what
    // Nuxt resolves `modules: [...]` through, and a bare-only map turns
    // `@upmind-automation/auth/nuxt` into `.../src/index.ts/nuxt`.
    "@upmind-automation/auth/nuxt": resolve(
      __dirname,
      "../../packages/auth/nuxt.ts"
    ),
    "@upmind-automation/auth": resolve(
      __dirname,
      "../../packages/auth/src/index.ts"
    ),
    "@upmind-automation/client": resolve(
      __dirname,
      "../../packages/client/src/index.ts"
    ),
    "@upmind-automation/payment": resolve(
      __dirname,
      "../../packages/payment/src/index.ts"
    ),
    "@upmind-automation/invoice": resolve(
      __dirname,
      "../../packages/invoice/src/index.ts"
    ),
    "@upmind-automation/basket": resolve(
      __dirname,
      "../../packages/basket/src/index.ts"
    )
  },

  /**
   * ---------------------------------------------------------------------------
   * BUILD TOOLS
   * Vite bundler and TypeScript configuration
   * ---------------------------------------------------------------------------
   */

  vite: {
    cacheDir:
      portalShape === "" ? undefined : `node_modules/.vite/${portalShape}`,
    plugins: [tailwindcss()],
    server: {
      fs: {
        // A dev server started from a git worktree reaches node_modules through
        // a symlink out of the worktree, which Vite's default allow list treats
        // as outside the project — @fontsource's woff2 files 404 and the page
        // silently rasterises in a fallback face. That produced a whole round of
        // false "text renders differently" evidence before the log line was
        // found. Allow the real monorepo root so a worktree-served app and a
        // main-tree one render identically, which parallel stages depend on.
        allow: [resolve(__dirname, "../..")]
      }
    }
  },

  typescript: {
    strict: true,
    typeCheck: isBuild, // Only during build (macOS EBADF bug in dev)
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: false,
        skipLibCheck: true,
        // the @upmind/ui alias resolves to source, whose imports carry .ts extensions
        allowImportingTsExtensions: true,
        // The headless alias pulls headless SOURCE into this app's typecheck.
        // Nuxt generates `"types": []`, which disables ambient auto-inclusion,
        // so the ambient packages headless's own tsconfig loads must be named
        // here (mirrors packages/headless/tsconfig.json).
        types: ["@types/google.maps", "@types/mercadopago-sdk-js"],
        paths: {
          // psl ships types its package.json `exports` hides from bundler
          // resolution; headless resolves them via its own node10 build. Point
          // straight at the shipped declarations.
          psl: [
            resolve(
              __dirname,
              "../../packages/headless/node_modules/psl/types/index.d.ts"
            )
          ]
        }
      },
      include: ["app/**/*"],
      exclude: ["node_modules", "dist", ".output", "**/*.spec.*"]
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
      viewport: "width=device-width, initial-scale=1.0",
      title: "Upmind Portal — design system sandbox",
      htmlAttrs: { lang: "en", "data-theme": "upmind" },
      meta: [
        {
          name: "description",
          content:
            "A clickable client-portal sandbox built entirely from Upmind UI — for validating the design system and finding component gaps."
        }
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
      script: [
        {
          innerHTML: `
      // Pre-paint: restore brand + mode from localStorage before first paint
      // so there is no flash of the default theme (FOUC).
      ;(function () {
        try {
          var root = document.documentElement
          var theme = localStorage.getItem('upmind-portal-theme')
          if (theme) root.setAttribute('data-theme', theme)
          var mode = localStorage.getItem('upmind-portal-mode')
          var dark =
            mode === 'dark' ||
            (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
          root.classList.toggle('dark', dark)
        } catch (e) {
          /* storage unavailable — keep the defaults */
        }
      })()
    `
        }
      ]
    }
  },

  css: [
    "@fontsource-variable/inter",
    "@fontsource-variable/jetbrains-mono",
    "@fontsource-variable/outfit",
    "@fontsource-variable/rethink-sans",
    "@fontsource-variable/sora",
    "@fontsource-variable/space-grotesk",
    "@fontsource-variable/bricolage-grotesque",
    "@fontsource/gilda-display",
    "@fontsource/instrument-serif",
    "~/main.css"
  ]
});
