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
