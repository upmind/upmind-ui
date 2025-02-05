import vue from '@vitejs/plugin-vue'
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
  plugins: [
    vue(),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: "@upmind-automation/headless-vue",
      fileName: "upmind-headless-vue"
    },
    rollupOptions: {
      // Externalize deps that shouldn't be bundled
      external: [/^@upmind-automation\//]
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
