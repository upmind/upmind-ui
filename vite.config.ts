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
      entry: resolve(__dirname, "src/index.ts"),
      name: "@upmind-automation/upmind-ui",
      formats: ["es"]
    },
    rollupOptions: {
      external: [
        "vue",
        "vue-router",
        "radix-vue",
        "@vueuse/core",
        "@vueuse/components",
        "@vueuse/shared",
        "lucide-vue-next",
        "embla-carousel",
        "embla-carousel-vue",
        "marked",
        "lottie-web",
        "@lordicon/element",
        /^lodash-es/
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
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
      "@themes": resolve(__dirname, "./src/assets/themes"),
      "@animations": resolve(__dirname, "./src/assets/animations")
    }
  }
});
