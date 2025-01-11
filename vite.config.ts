import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
   vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('lord-'),
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@icons': fileURLToPath(new URL('./src/assets/icons', import.meta.url)),
      '@themes': fileURLToPath(new URL('./src/assets/themes', import.meta.url)),
    }
  },
   define: {
    "process.env": {},
  },
  build: {
    lib: {
      // entry: ['./src/index.ts','./src/auto.ts'],
      entry: './src/index.ts',
      name: "upmind-ui",
      fileName: "upmind-ui",
    },
    rollupOptions: {
      output: {
        assetFileNames: "upmind-ui.[ext]",
      },
    },
  },

})
