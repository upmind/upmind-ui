import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: "src",
      outDir: "dist"
    })
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        scenarios: resolve(__dirname, "src/scenarios.ts")
      },
      name: "@upmind-automation/headless",
      formats: ["es"]
    },
    rollupOptions: {
      external: [
        "vue",
        "vue-router",
        "vue-i18n",
        "@vueuse/core",
        "@tanstack/vue-query",
        "@tanstack/vue-store",
        "@tanstack/pacer",
        "@tanstack/query-persist-client-core",
        "xstate",
        "@xstate/vue",
        "@xstate/inspect",
        "@stripe/stripe-js",
        "braintree-web-drop-in",
        "@sentry/vue",
        "dayjs",
        "@googlemaps/js-api-loader",
        /^lodash-es/
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
        globals: {
          vue: "Vue",
          "vue-router": "VueRouter",
          "vue-i18n": "VueI18n"
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      // ---
      "@upmind-automation/types": resolve(__dirname, "../types/src/index.ts"),
      "@upmind-automation/i18n": resolve(__dirname, "../i18n/src/index.ts")
    }
  }
});
