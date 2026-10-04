import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig, configDefaults } from "vitest/config";
import { workerPool } from "../../vitest.workers";

const root = fileURLToPath(new URL("./", import.meta.url));

const alias = {
  "@upmind/ui": fileURLToPath(
    new URL("../../design-system/packages/ui/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/foundation": fileURLToPath(
    new URL("../modules-foundation/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/headless": fileURLToPath(
    new URL("../headless/src/index.ts", import.meta.url)
  ),
  // Not imported here: `headless`'s bare-specifier `import.meta.glob` needs it at transform time.
  "@upmind-automation/i18n": fileURLToPath(
    new URL("../i18n/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/payment": fileURLToPath(
    new URL("../modules-payment/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/product": fileURLToPath(
    new URL("../modules-product/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/types": fileURLToPath(
    new URL("../types/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/test-fixtures": fileURLToPath(
    new URL("../../tests/fixtures", import.meta.url)
  )
};

export default defineConfig({
  plugins: [vue()],
  resolve: { alias },
  test: {
    ...workerPool("dom"),
    root,
    environment: "jsdom",
    include: ["src/**/*.spec.ts", "src/**/__tests__/**/*.test.ts"],
    exclude: [...configDefaults.exclude, "**/*.stub.ts"],
    testTimeout: 5000
  }
});
