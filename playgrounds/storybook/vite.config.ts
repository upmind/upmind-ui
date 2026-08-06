import { fileURLToPath, URL } from "node:url";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  // assetsInclude: ['./stories/assets/upmind.css'],
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith("upm-")
        }
      }
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./stories", import.meta.url)),
      "@icons": resolve(__dirname, "../../packages/icons/assets"),
      "@animations": fileURLToPath(
        new URL("./stories/assets/animations", import.meta.url)
      ),
      "@themes": fileURLToPath(
        new URL("./stories/assets/themes", import.meta.url)
      ),
      "@locales": fileURLToPath(
        new URL("./stories/assets/locales", import.meta.url)
      ),
      "@upmind-automation/upmind-ui/styles": resolve(
        __dirname,
        "../../packages/ui/src/assets/styles/index.css"
      ),
      "@upmind-automation/upmind-ui/vars": resolve(
        __dirname,
        "../../packages/ui/src/assets/styles/vars.css"
      ),
      "@upmind-automation/upmind-ui": resolve(
        __dirname,
        "../../packages/ui/src/index.ts"
      ),
      "@upmind-automation/types": resolve(
        __dirname,
        "../../packages/types/src/index.ts"
      ),
      // `useI18n`'s DEV-mode source-override `import.meta.glob` is written
      // against this specifier, and Vite resolves a glob prefix through the
      // alias table only — without it the dependency scan fails.
      "@upmind-automation/i18n": resolve(__dirname, "../../packages/i18n/src"),
      // The DIRECTORY, not `src/index.ts`: the root barrel constructs the
      // `useUpmind` singleton at import time (which boots the platform and can
      // navigate away), so a story reaches the module barrels by subpath
      // (`.../modules/client-email`) and never evaluates it.
      "@upmind-automation/headless": resolve(
        __dirname,
        "../../packages/headless/src"
      )
    }
  }
  // build: {
  //   rollupOptions: {
  //     output: {
  //       manualChunks: (id) => {
  //         if (id.includes('radix-vue@')) return 'radix-vue'
  //         if (id.includes('@vue+')) return 'vue'
  //         if (id.includes('@vueuse/core')) return 'vueuse'
  //         if (id.includes('lucide-vue-next')) return 'lucide'
  //         if (id.includes('class-variance-authority@')) return 'cva'
  //         if (id.includes('tailwind-merge@')) return 'tailwind-merge'
  //         if (id.includes('clsx@')) return 'clsx'
  //         if (id.includes('@floating-ui+')) return 'floating-ui'
  //       },
  //     }
  //   }
  // }
});
