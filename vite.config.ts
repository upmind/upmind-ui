import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
// import tsconfigPaths from 'vite-tsconfig-paths';
// import nodeResolve from '@rollup/plugin-node-resolve';
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
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@upmind-automation/upmind-ui',
    },
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: ['vue', 'vue-router'],
      output: {
        globals: {
          vue: 'Vue', // Provide global name for 'vue'
          'vue-router': 'VueRouter', // Provide global name for 'vue-router'
        },
      },
      // plugins: [nodeResolve()],

    },

  },
  plugins: [
    vue(),
    // tsconfigPaths() as PluginOption,
    dts({
      entryRoot: 'src',
      outDir: 'dist/types',
      tsconfigPath: 'tsconfig.build.json',
    }),
  ],
});
