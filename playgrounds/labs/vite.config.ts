// vite.config.ts
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";
import vueDevTools from "vite-plugin-vue-devtools";
import { compact } from "lodash-es";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enableDevTools = (env.VITE_ENABLE_DEVTOOLS ?? "true") !== "false";
  const isProd = mode === "production";

  return {
    plugins: compact([
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag: string) => tag.startsWith("lord-")
          }
        }
      }),
      enableDevTools ? vueDevTools() : null,
      tailwindcss()
    ]),
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@icons": resolve(__dirname, "../../packages/icons/assets"),
        "@animations": resolve(__dirname, "./src/assets/animations"),
        "@upmind-automation/types": resolve(
          __dirname,
          "../../packages/types/src/index.ts"
        ),
        "@upmind-automation/i18n": resolve(
          __dirname,
          "../../packages/i18n/src"
        ),
        "@upmind-automation/headless": resolve(
          __dirname,
          "../../packages/headless/src/index.ts"
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
        "@upmind-automation/client-vue/styles": resolve(
          __dirname,
          "../../packages/client-vue/src/assets/styles/index.css"
        ),
        "@upmind-automation/client-vue/vars": resolve(
          __dirname,
          "../../packages/client-vue/src/assets/styles/vars.css"
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
    },
    esbuild: {
      drop: isProd ? ["console", "debugger"] : []
    },
    build: {
      minify: "esbuild",
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html")
        }
      },
      sourcemap: true
    }
  };
});
