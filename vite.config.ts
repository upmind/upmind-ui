import { defineConfig, type PluginOption } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import nodeResolve from '@rollup/plugin-node-resolve';
import vue from '@vitejs/plugin-vue'
import { configDefaults } from "vitest/config";

export default defineConfig({
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@': resolve(__dirname, './src'),
      '@icons': resolve(__dirname,'./src/assets/icons'),
      '@themes': resolve(__dirname,'./src/assets/themes'),
    }
  },
  define: {
    "process.env": {},
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@upmind-automation/upmind-ui',
    },
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: ['vue'], // Vue is an external dependency
      output: {
        globals: {
          vue: 'Vue',
        },
      },
      plugins: [nodeResolve()],
    },
  },
  plugins: [
    vue(),
    tsconfigPaths() as PluginOption,
    dts({
      entryRoot: 'src',
      outputDir: 'dist/types',
    }) as PluginOption,
  ],
});
