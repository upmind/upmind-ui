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
      name: '@upmind-automation/client-vue',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@icons': resolve(__dirname, './src/assets/icons'),
      '@themes': resolve(__dirname, './src/assets/themes'),
      // ---
      '@upmind-automation/types': resolve(__dirname, '../types/src'),
      '@upmind-automation/headless': resolve(__dirname, '../headless/src'),
      '@upmind-automation/headless-vue': resolve(__dirname, '../headless-vue/src'),
      '@upmind-automation/upmind-ui': resolve(__dirname, '../ui/src'),
    },
  },
});
