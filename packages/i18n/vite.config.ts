import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
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
      entry: resolve(__dirname, "src/index.ts"),
      name: "@upmind-automation/i18n",
      fileName: "index",
      formats: ["es"]
    },
    rollupOptions: {
      external: ["vue", "vue-i18n"],
      output: {
        globals: {
          vue: "Vue",
          "vue-i18n": "VueI18n"
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    }
  }
});
