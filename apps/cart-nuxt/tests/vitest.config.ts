import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

const appRoot = fileURLToPath(new URL("../", import.meta.url));
const appDir = fileURLToPath(new URL("../app/", import.meta.url));

const src = (path: string) =>
  fileURLToPath(new URL(`../../../${path}`, import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "#basket-segment": fileURLToPath(
        new URL("../app/funnels/segment.ts", import.meta.url)
      ),
      "#locale-overrides": fileURLToPath(
        new URL("../app/assets/locale-overrides.ts", import.meta.url)
      ),
      "#app": fileURLToPath(new URL("./nuxt.stub.ts", import.meta.url)),
      "#imports": fileURLToPath(new URL("./nuxt.stub.ts", import.meta.url)),
      "@icons": src("packages/icons/assets"),
      "@animations": fileURLToPath(
        new URL("../app/assets/animations", import.meta.url)
      ),
      "~~": appRoot,
      "@@": appRoot,
      "~": appDir,
      "@": appDir,
      "@upmind/ui/styles": src(
        "design-system/packages/ui/src/styles/index.css"
      ),
      "@upmind/ui": src("design-system/packages/ui/src/index.ts"),
      "@upmind-automation/auth": src("packages/modules-auth/src/index.ts"),
      "@upmind-automation/basket": src("packages/modules-basket/src/index.ts"),
      "@upmind-automation/catalogue": src(
        "packages/modules-catalogue/src/index.ts"
      ),
      "@upmind-automation/client-vue": src("packages/client-vue/src/index.ts"),
      "@upmind-automation/client": src("packages/modules-client/src/index.ts"),
      "@upmind-automation/domain": src("packages/modules-domain/src/index.ts"),
      "@upmind-automation/foundation": src(
        "packages/modules-foundation/src/index.ts"
      ),
      "@upmind-automation/headless": src("packages/headless/src/index.ts"),
      "@upmind-automation/i18n": src("packages/i18n/src/index.ts"),
      "@upmind-automation/invoice": src(
        "packages/modules-invoice/src/index.ts"
      ),
      "@upmind-automation/payment": src(
        "packages/modules-payment/src/index.ts"
      ),
      "@upmind-automation/product": src(
        "packages/modules-product/src/index.ts"
      ),
      "@upmind-automation/recommendations": src(
        "packages/modules-recommendations/src/index.ts"
      ),
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
