import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

const isProd = process.env.MODE === "production";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag: string) => tag.startsWith("lord-")
        }
      }
    }),
    vueDevTools(),
    tailwindcss(),
    sentryVitePlugin({
      org: "upmind",
      project: "cart",
      applicationKey: "cart"
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@icons": resolve(__dirname, "./src/assets/icons"),
      "@animations": resolve(__dirname, "./src/assets/animations"),
      "@upmind-automation/types": resolve(
        __dirname,
        "../../packages/types/src/index.ts"
      ),
      "@upmind-automation/headless": resolve(
        __dirname,
        "../../packages/headless/src/index.ts"
      ),
      "@upmind-automation/upmind-ui/styles": resolve(
        __dirname,
        "../../packages/ui/src/main.css"
      ),
      "@upmind-automation/upmind-ui": resolve(
        __dirname,
        "../../packages/ui/src/index.ts"
      ),
      "@upmind-automation/client-vue/styles": resolve(
        __dirname,
        "../../packages/client-vue/src/main.css"
      ),
      "@upmind-automation/client-vue": resolve(
        __dirname,
        "../../packages/client-vue/src/index.ts"
      )
    },
    dedupe: ["vue-router"]
  },
  server: {
    allowedHosts: true,
    fs: {
      strict: false
    }
    // Remove custom middleware here
  },
  esbuild: {
    drop: isProd ? ["console", "debugger"] : []
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        transfer: resolve(__dirname, "transfer.html")
      }
    },
    sourcemap: true
  }
});
