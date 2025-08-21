import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: "src",
      outDir: "dist",
      tsconfigPath: "tsconfig.build.json"
    })
  ],
  build: {
    lib: {
      entry: {
        main: resolve(__dirname, "src/index.ts"),
        styles: resolve(__dirname, "src/main.css")
      },
      name: "@upmind-automation/client-vue",
      fileName: "index",
      formats: ["es"]
    },
    rollupOptions: {
      external: ["vue", "vue-router"],
      output: {
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
      "@icons": resolve(__dirname, "./src/assets/icons"),
      "@themes": resolve(__dirname, "./src/assets/themes"),
      "@animations": resolve(__dirname, "./src/assets/animations"),
      // ---
      "@upmind-automation/types": resolve(__dirname, "../types/src/index.ts"),
      "@upmind-automation/headless": resolve(
        __dirname,
        "../headless/src/index.ts"
      ),
      "@upmind-automation/upmind-ui/styles": resolve(
        __dirname,
        "../ui/src/main.css"
      ),
      "@upmind-automation/upmind-ui": resolve(__dirname, "../ui/src/index.ts")
    }
  }
});
