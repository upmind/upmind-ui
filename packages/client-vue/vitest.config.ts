import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig, defineConfig, configDefaults } from "vitest/config";
import viteConfig from "./vite.config";

const root = fileURLToPath(new URL("./", import.meta.url));

export default mergeConfig(
  viteConfig,
  defineConfig({
    // Test-lane-only key — never in `vite.config.ts`, since nothing at runtime
    // may reach a package's `__tests__` tree. Mirrors the mechanism labs-nuxt
    // already uses (`playgrounds/labs-nuxt/vitest.config.ts:36-39`): an alias is
    // what MAKES a specifier resolve, which is why another package's internal
    // surface is reached by name rather than by a relative path through the
    // package boundary.
    resolve: {
      alias: {
        "@upmind-automation/headless-test-kit": resolve(
          root,
          "../headless/src/modules/client-email/__tests__"
        )
      }
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
      exclude: [...configDefaults.exclude, "e2e/*"],
      root
    }
  })
);
