import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

const appRoot = fileURLToPath(new URL("../", import.meta.url));

const src = (path: string) =>
  fileURLToPath(new URL(`../../../${path}`, import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@upmind/ui/styles": src(
        "design-system/packages/ui/src/styles/index.css"
      ),
      "@upmind/ui": src("design-system/packages/ui/src/index.ts"),
      "@upmind-automation/auth": src("packages/modules-auth/src/index.ts"),
      "@upmind-automation/foundation": src(
        "packages/modules-foundation/src/index.ts"
      ),
      "@upmind-automation/headless": src("packages/headless/src/index.ts"),
      "@upmind-automation/i18n": src("packages/i18n/src/index.ts"),
      "@upmind-automation/types": src("packages/types/src/index.ts")
    }
  },
  test: {
    root: appRoot,
    include: ["tests/**/*.test.ts"],
    environment: "jsdom",
    restoreMocks: true,
    testTimeout: 20000
  }
});
