import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import UpmindTransferPlugin from "./vite.plugin.transfer";

const isProd = process.env.MODE === "production";

export default defineConfig({
  plugins: [
    UpmindTransferPlugin(),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith("lord-")
        }
      }
    }),
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
      "@upmind-automation/upmind-ui": resolve(
        __dirname,
        "../../packages/ui/src/index.ts"
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
