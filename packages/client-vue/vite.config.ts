import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: "src",
      outDir: "dist",
      tsconfigPath: "tsconfig.json"
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "@upmind-automation/client-vue",
      formats: ["es"]
    },
    rollupOptions: {
      external: [
        "vue",
        "vue-router",
        "vue-i18n",
        "@upmind-automation/headless",
        "@upmind-automation/upmind-ui",
        "@vueuse/core",
        "@vueuse/components",
        "@vueuse/router",
        "xstate",
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
    alias: [
      { find: "@", replacement: resolve(__dirname, "./src") },
      { find: "@icons", replacement: resolve(__dirname, "../icons/assets") },
      {
        find: "@themes",
        replacement: resolve(__dirname, "./src/assets/themes")
      },
      {
        find: "@animations",
        replacement: resolve(__dirname, "./src/assets/animations")
      },
      // ---
      {
        find: "@upmind-automation/types",
        replacement: resolve(__dirname, "../types/src/index.ts")
      },
      {
        find: "@upmind-automation/i18n",
        replacement: resolve(__dirname, "../../packages/i18n/src")
      },
      // Anchored: a bare string `find` also captures every subpath under it,
      // which would rewrite `@upmind-automation/headless/testing/*` — the
      // package's real test-kit export — to a path THROUGH `index.ts`.
      // Exact-match only, so subpaths fall through to the package's own
      // `exports` map.
      {
        find: /^@upmind-automation\/headless$/,
        replacement: resolve(__dirname, "../headless/src/index.ts")
      },
      {
        find: "@upmind-automation/upmind-ui/styles",
        replacement: resolve(__dirname, "../ui/src/assets/styles/index.css")
      },
      {
        find: "@upmind-automation/upmind-ui/vars",
        replacement: resolve(__dirname, "../ui/src/assets/styles/vars.css")
      },
      {
        find: "@upmind-automation/upmind-ui",
        replacement: resolve(__dirname, "../ui/src/index.ts")
      }
    ]
  }
});
