import { resolve } from "path";
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import dts from "vite-plugin-dts";

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "@upmind/upflow",
      fileName: "upflow"
    }
  },
});
