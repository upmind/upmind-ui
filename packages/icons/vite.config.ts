import { defineConfig } from "vite";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "assets/*",
          dest: "assets"
        }
      ]
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "@upmind-automation/icons",
      fileName: "index",
      formats: ["es"]
    },
    rollupOptions: {
      output: {
        preserveModules: false,
        entryFileNames: "[name].js"
      }
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    }
  }
});
