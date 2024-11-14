import { resolve } from "path";
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "@upmind-automation/headless",
      fileName: "headless"
    }
  },
  // Vitest config - https://vitest.dev/guide/#configuring-vitest
  // @ts-ignore
  test: {
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "e2e/*"],
    root: fileURLToPath(new URL("./", import.meta.url)),
    // https://vitest.dev/guide/coverage.html
    coverage: {
      provider: 'istanbul',
      enabled: true
    },
  },
});
