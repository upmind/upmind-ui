import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// import Terminal from "vite-plugin-terminal";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Terminal({
    //   console: 'terminal'
    // }),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes('.ce.')
        }
      }
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  },
  build: {
    cssCodeSplit: true,
    lib: {
      entry: './src/index.ts',
      name: "velia",
      fileName: "velia"
    }
  },

})
