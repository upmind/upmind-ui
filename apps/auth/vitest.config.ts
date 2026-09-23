import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig, configDefaults } from "vitest/config";
import { workerPool } from "../../vitest.workers";

const root = fileURLToPath(new URL("./", import.meta.url));

// Source-consumption (ADR 023 constraint 1) means no package has a dist entry
// to resolve; each workspace dependency is aliased at its src barrel.
const alias = {
  "@upmind/ui": fileURLToPath(
    new URL("../../design-system/packages/ui/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/foundation": fileURLToPath(
    new URL("../../packages/modules-foundation/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/headless": fileURLToPath(
    new URL("../../packages/headless/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/i18n": fileURLToPath(
    new URL("../../packages/i18n/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/types": fileURLToPath(
    new URL("../../packages/types/src/index.ts", import.meta.url)
  )
};

export default defineConfig({
  plugins: [vue()],
  resolve: { alias },
  test: {
    ...workerPool("dom"),
    root,
    environment: "jsdom",
    // This app's specs live in `tests/`; the package's two lanes are kept so a
    // colocated spec runs without a config edit.
    include: [
      "tests/**/*.test.ts",
      "src/**/*.spec.ts",
      "src/**/__tests__/**/*.test.ts"
    ],
    exclude: [...configDefaults.exclude, "**/*.stub.ts"],
    testTimeout: 5000
  }
});
