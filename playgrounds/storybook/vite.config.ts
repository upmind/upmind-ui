import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./stories', import.meta.url)),
      '@icons': fileURLToPath(new URL('./stories/assets/icons', import.meta.url)),
      '@themes': fileURLToPath(new URL('./stories/assets/themes', import.meta.url)),
    }
  }
})
