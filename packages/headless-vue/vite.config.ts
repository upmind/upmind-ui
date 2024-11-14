import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { configDefaults } from "vitest/config.js";

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: "@upmind-automation/headless-vue",
      fileName: "headless-vue"
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
})
