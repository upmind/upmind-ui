import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig, configDefaults } from "vitest/config";
import { workerPool } from "../../vitest.workers";

const root = fileURLToPath(new URL("./", import.meta.url));

// Source-consumption (ADR 023 constraint 1) means no package has a dist entry
// to resolve; `@upmind-automation/types` in particular fails with "Failed to
// resolve entry for package" unless it is aliased at its src barrel.
const alias = {
  "@upmind/ui": fileURLToPath(
    new URL("../../design-system/packages/ui/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/headless": fileURLToPath(
    new URL("../headless/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/i18n": fileURLToPath(
    new URL("../i18n/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/types": fileURLToPath(
    new URL("../types/src/index.ts", import.meta.url)
  )
};

export default defineConfig({
  plugins: [vue()],
  resolve: { alias },
  test: {
    ...workerPool("dom"),
    root,
    environment: "jsdom",
    include: ["src/**/__tests__/**/*.test.ts"],
    exclude: [...configDefaults.exclude, "**/*.stub.ts"],
    testTimeout: 5000
  }
});
