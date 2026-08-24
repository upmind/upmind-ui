// vite.config.ts
import { resolve } from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";
import vueDevTools from "vite-plugin-vue-devtools";
import UpmindTransferPlugin from "./vite.plugin.transfer";
import { compact } from "lodash-es";

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enableDevTools = (env.VITE_ENABLE_DEVTOOLS ?? "true") === "true";

  console.log("*** BUILDING for mode:", mode, "command:", command, "***");

  const assetsDir =
    env.VITE_ASSETS_SUBPATH && `assets/${env.VITE_ASSETS_SUBPATH}`;

  return {
    plugins: compact([
      UpmindTransferPlugin(),
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag: string) => tag.startsWith("lord-")
          }
        }
      }),
      enableDevTools ? vueDevTools() : null,
      tailwindcss(),
      sentryVitePlugin({
        org: "upmind",
        project: "cart",
        applicationKey: "cart"
      })
    ]),
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@icons": resolve(__dirname, "../../packages/icons/assets"),
        "@animations": resolve(__dirname, "./src/assets/animations"),
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
        "@upmind/ui/styles": resolve(
          __dirname,
          "../../design-system/packages/ui/src/styles/index.css"
        ),
        "@upmind/ui": resolve(
          __dirname,
          "../../design-system/packages/ui/src/index.ts"
        ),
        "@upmind/tokens/css/tailwind.css": resolve(
          __dirname,
          "../../design-system/packages/tokens/dist/tailwind.css"
        ),
        "@upmind/tokens/css": resolve(
          __dirname,
          "../../design-system/packages/tokens/dist/index.css"
        ),
        "@upmind/tokens": resolve(
          __dirname,
          "../../design-system/packages/tokens/src/index.ts"
        ),
        "@upmind-automation/client-vue/styles": resolve(
          __dirname,
          "../../packages/client-vue/src/assets/styles/index.css"
        ),
        "@upmind-automation/client-vue": resolve(
          __dirname,
          "../../packages/client-vue/src/index.ts"
        )
      },
      dedupe: ["vue-router"]
    },
    server: {
      allowedHosts: true,
      fs: {
        strict: false
      }
    },
    esbuild: {
      drop: command === "build" ? ["console", "debugger"] : []
    },
    build: {
      assetsDir,
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
          transfer: resolve(__dirname, "transfer.html")
        },
        output: {
          manualChunks(id) {
            // Vue ecosystem
            if (
              id.includes("node_modules/vue/") ||
              id.includes("node_modules/@vue/") ||
              id.includes("node_modules/vue-router/") ||
              id.includes("node_modules/vue-i18n/")
            ) {
              return "vue-vendor";
            }
            // VueUse
            if (id.includes("node_modules/@vueuse/")) {
              return "vueuse";
            }
            // TanStack
            if (id.includes("node_modules/@tanstack/")) {
              return "tanstack";
            }
            // XState
            if (
              id.includes("node_modules/xstate/") ||
              id.includes("node_modules/@xstate/")
            ) {
              return "xstate";
            }
            // Radix UI
            if (
              id.includes("node_modules/radix-vue/") ||
              id.includes("node_modules/vaul-vue/")
            ) {
              return "radix";
            }
            // Payment gateways - removed from manualChunks
            // Stripe and Braintree are now dynamically imported in headless
            // and will create their own lazy-loaded chunks
            // JSON Forms & validation
            if (
              id.includes("node_modules/@jsonforms/") ||
              id.includes("node_modules/ajv")
            ) {
              return "forms";
            }
            // Icons (lucide and lottie)
            if (
              id.includes("node_modules/lucide-vue-next/") ||
              id.includes("node_modules/lottie-web/") ||
              id.includes("node_modules/@lordicon/")
            ) {
              return "icons";
            }
            // Carousel
            if (id.includes("node_modules/embla-carousel")) {
              return "carousel";
            }
            // Lodash
            if (id.includes("node_modules/lodash")) {
              return "lodash";
            }
            // Sentry (monitoring)
            if (id.includes("node_modules/@sentry/")) {
              return "sentry";
            }
            // Date utilities
            if (id.includes("node_modules/dayjs/")) {
              return "dayjs";
            }
            // File upload
            if (id.includes("node_modules/filepond")) {
              return "filepond";
            }
            // Sanitization & markdown
            if (
              id.includes("node_modules/dompurify/") ||
              id.includes("node_modules/marked/")
            ) {
              return "sanitize";
            }
            // Floating UI
            if (id.includes("node_modules/@floating-ui/")) {
              return "floating-ui";
            }
            // Class variance authority & tailwind merge
            if (
              id.includes("node_modules/class-variance-authority/") ||
              id.includes("node_modules/tailwind-merge/") ||
              id.includes("node_modules/clsx/")
            ) {
              return "styling";
            }
            // Phone/location utilities
            if (
              id.includes("node_modules/libphonenumber-js/") ||
              id.includes("node_modules/countries-list/") ||
              id.includes("node_modules/psl/")
            ) {
              return "locale-utils";
            }
            // Google Maps
            if (id.includes("node_modules/@googlemaps/")) {
              return "maps";
            }
          }
        }
      },
      sourcemap: true
    }
  };
});
