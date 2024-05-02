import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import svgLoader from 'vite-svg-loader';
// import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // basicSsl(),
    vue(),
    vueJsx(),
    svgLoader()
  ],
  server: {
    cors: true,
    // https: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@icons': fileURLToPath(new URL('./src/assets/icons', import.meta.url)),
      '@themes': fileURLToPath(new URL('./src/assets/themes', import.meta.url)),
      '@locales': fileURLToPath(new URL('./public/locales', import.meta.url)),

    }
  }
})
