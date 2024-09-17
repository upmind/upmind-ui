import { sentryVitePlugin } from "@sentry/vite-plugin";
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
// import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [// basicSsl(),
  vue({
    template: {
      compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('uw-')
      }
    }
  }), vueJsx(), sentryVitePlugin({
    org: "upmind",
      project: "checkout-doteasy"
  })],

  server: {
    cors: true,
    // https: true,
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@icons': fileURLToPath(new URL('./src/assets/icons', import.meta.url)),
      '@themes': fileURLToPath(new URL('./src/assets/themes', import.meta.url)),
      '@locales': fileURLToPath(new URL('./src/locales', import.meta.url)),

    }
  },

  build: {
    sourcemap: true
  }
})
