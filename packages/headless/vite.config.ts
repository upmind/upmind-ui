import { resolve } from "path";
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { configDefaults } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    preserveSymlinks: true
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "@upmind-automation/headless",
      fileName: "headless"
    },
    rollupOptions: {
      // Externalize deps that shouldn't be bundled
      external: ['@upmind-automation/types'],
    },
    outDir: "dist",
    sourcemap: true,
  },
  plugins: [
    dts({
      rollupTypes: true, // or compilerOptions: { declarationDir: "dist/types" }
    }),
  ],
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
