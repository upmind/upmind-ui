import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: "src",
      outDir: "dist",
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@upmind-automation/headless-vue',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', "vue-router"],
      output: {
        globals: {
          vue: 'Vue',
          "vue-router": "VueRouter",
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // ---
      '@upmind-automation/types': resolve(__dirname, '../types/src'),
      '@upmind-automation/headless': resolve(__dirname, '../headless/src'),
    },
  },
});
