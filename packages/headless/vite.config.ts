import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths'; // Import the plugin
import nodeResolve from '@rollup/plugin-node-resolve';
import { configDefaults } from "vitest/config";

export default defineConfig({
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@upmind-automation/headless',
    },
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: [], // Only truly external dependencies here (e.g., React, Vue)
      plugins: [nodeResolve()], // Essential for monorepo dependencies
    },
  },
  plugins: [
    tsconfigPaths(), // Add this plugin for path mapping
    dts({
      entryRoot: 'src',
      outputDir: 'dist/types',
      // compilerOptions: {
      //   declarationMap: true,
      // },
    }),
  ],
  // Vitest config - https://vitest.dev/guide/#configuring-vitest
  // @ts-ignore
  test: {
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "e2e/*"],
    root: resolve(__dirname, './'),
    // https://vitest.dev/guide/coverage.html
    coverage: {
      provider: 'istanbul',
      enabled: true
    },
  },
});
