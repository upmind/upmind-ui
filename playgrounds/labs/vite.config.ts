import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith("lord-")
        }
      }
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@icons": resolve(__dirname, "./src/assets/icons"),
      "@animations": resolve(__dirname, "./src/assets/animations"),
      "@locales": resolve(__dirname, "./src/locales"),

      // Map local package imports to their source folders.
      "@upmind-automation/types": resolve(
        __dirname,
        "../../packages/types/src/index.ts"
      ),
      "@upmind-automation/headless": resolve(
        __dirname,
        "../../packages/headless/src/index.ts"
      ),
      "@upmind-automation/upmind-ui": resolve(
        __dirname,
        "../../packages/ui/src/index.ts"
      ),
      "@upmind-automation/client-vue": resolve(
        __dirname,
        "../../packages/client-vue/src/index.ts"
      )
    }
  },
  server: {
    allowedHosts: true,
    fs: {
      strict: false
    }
  },

  build: {
    sourcemap: true
  }
});
