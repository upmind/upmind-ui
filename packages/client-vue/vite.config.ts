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
    alias: {
      "@": resolve(__dirname, "./src"),
      "@icons": resolve(__dirname, "../icons/assets"),
      "@themes": resolve(__dirname, "./src/assets/themes"),
      "@animations": resolve(__dirname, "./src/assets/animations"),
      // ---
      "@upmind-automation/types": resolve(__dirname, "../types/src/index.ts"),
      "@upmind-automation/i18n": resolve(__dirname, "../../packages/i18n/src"),
      "@upmind-automation/headless": resolve(
        __dirname,
        "../headless/src/index.ts"
      ),
      "@upmind-automation/upmind-ui/styles": resolve(
        __dirname,
        "../ui/src/assets/styles/index.css"
      ),
      "@upmind-automation/upmind-ui/vars": resolve(
        __dirname,
        "../ui/src/assets/styles/vars.css"
      ),
      "@upmind-automation/upmind-ui": resolve(__dirname, "../ui/src/index.ts")
    }
  }
});
