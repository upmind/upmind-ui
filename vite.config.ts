import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    dts({
      entryRoot: "src",
      outDir: "dist",
      tsconfigPath: "tsconfig.json"
    })
  ],
  build: {
    lib: {
      entry: {
        main: resolve(__dirname, "src/index.ts")
      },
      name: "@upmind-automation/upmind-ui",
      fileName: "index",
      formats: ["es"]
    },
    rollupOptions: {
      external: ["vue", "vue-router"],
      output: {
        globals: {
          vue: "Vue",
          "vue-router": "VueRouter"
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@icons": resolve(__dirname, "./src/assets/icons"),
      "@themes": resolve(__dirname, "./src/assets/themes"),
      "@animations": resolve(__dirname, "./src/assets/animations")
    }
  }
});
