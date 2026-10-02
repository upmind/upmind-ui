import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@icons": resolve(__dirname, "../../packages/icons/assets"),
      "@upmind-automation/types": resolve(
        __dirname,
        "../../packages/types/src/index.ts"
      ),
      "@upmind-automation/i18n": resolve(__dirname, "../../packages/i18n/src"),
      "@upmind-automation/headless": resolve(
        __dirname,
        "../../packages/headless/src/index.ts"
      ),
      "@upmind/ui/styles": resolve(
        __dirname,
        "../../design-system/packages/ui/src/styles/index.css"
      ),
      "@upmind/ui": resolve(
        __dirname,
        "../../design-system/packages/ui/src/index.ts"
      ),
      "@upmind/tokens/css/tailwind.css": resolve(
        __dirname,
        "../../design-system/packages/tokens/dist/tailwind.css"
      ),
      "@upmind/tokens/css": resolve(
        __dirname,
        "../../design-system/packages/tokens/dist/index.css"
      ),
      "@upmind/tokens": resolve(
        __dirname,
        "../../design-system/packages/tokens/src/index.ts"
      ),
      "@upmind-automation/foundation/styles": resolve(
        __dirname,
        "../../packages/modules-foundation/src/styles.css"
      ),
      "@upmind-automation/foundation": resolve(
        __dirname,
        "../../packages/modules-foundation/src/index.ts"
      ),
      "@upmind-automation/auth/styles": resolve(
        __dirname,
        "../../packages/modules-auth/src/styles.css"
      ),
      "@upmind-automation/auth": resolve(
        __dirname,
        "../../packages/modules-auth/src/index.ts"
      )
    },
    dedupe: ["vue-router"]
  },
  server: {
    port: 5183,
    allowedHosts: true,
    fs: { strict: false }
  }
});
