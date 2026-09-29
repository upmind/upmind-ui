import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

const appRoot = fileURLToPath(new URL("../", import.meta.url));
const appDir = fileURLToPath(new URL("../app/", import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "~~": appRoot,
      "@@": appRoot,
      "~": appDir,
      "@": appDir,
      // The package's `main` points at unbuilt dist; nuxt.config aliases do
      // not reach this standalone config, so seeds' enum-value imports need
      // the same src alias here (cart-nuxt precedent).
      "@upmind-automation/types": fileURLToPath(
        new URL("../../../packages/types/src/index.ts", import.meta.url)
      ),
      "@upmind-automation/headless": fileURLToPath(
        new URL("../../../packages/headless/src/index.ts", import.meta.url)
      ),
      "@upmind-automation/i18n": fileURLToPath(
        new URL("../../../packages/i18n/src/index.ts", import.meta.url)
      ),
      "@upmind/ui/styles": fileURLToPath(
        new URL(
          "../../../design-system/packages/ui/src/styles/index.css",
          import.meta.url
        )
      ),
      "@upmind/ui": fileURLToPath(
        new URL(
          "../../../design-system/packages/ui/src/index.ts",
          import.meta.url
        )
      ),
      // Nuxt's build-time virtual module — see support/nuxt-components-stub.ts.
      "#components": fileURLToPath(
        new URL("../tests/support/nuxt-components-stub.ts", import.meta.url)
      ),
      "#app": fileURLToPath(
        new URL("../tests/support/nuxt-app-stub.ts", import.meta.url)
      )
    }
  },
  test: {
    root: appRoot,
    include: ["tests/**/*.test.ts"],
    environment: "jsdom",
    restoreMocks: true,
    // The config-mocking read-backs mount a whole page against a re-mocked
    // module graph and run ~4.6-4.9s against vitest's 5000ms default — a 2%
    // margin. Under a must-fail patch they cross it and go red on the CLOCK
    // rather than on their subject, which reads as a control discriminating
    // when it is only timing out. Raised so a red means what it says.
    testTimeout: 20000
  }
});
