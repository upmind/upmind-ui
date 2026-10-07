import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig, configDefaults } from "vitest/config";
import { workerPool } from "../../vitest.workers";
// -----------------------------------------------------------------------------

const root = fileURLToPath(new URL("./", import.meta.url));

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const alias = {
  "@": at("./src"),
  "@icons": at("../../packages/icons/assets"),
  "@animations": at("./src/assets/animations"),
  "@upmind/ui": at("../../design-system/packages/ui/src/index.ts"),
  "@upmind/tokens": at("../../design-system/packages/tokens/src/index.ts"),
  "@upmind-automation/types": at("../../packages/types/src/index.ts"),
  "@upmind-automation/i18n": at("../../packages/i18n/src"),
  "@upmind-automation/headless": at("../../packages/headless/src/index.ts"),
  "@upmind-automation/foundation": at(
    "../../packages/modules-foundation/src/index.ts"
  ),
  "@upmind-automation/product": at(
    "../../packages/modules-product/src/index.ts"
  ),
  "@upmind-automation/recommendations": at(
    "../../packages/modules-recommendations/src/index.ts"
  ),
  "@upmind-automation/catalogue": at(
    "../../packages/modules-catalogue/src/index.ts"
  ),
  "@upmind-automation/domain": at("../../packages/modules-domain/src/index.ts"),
  "@upmind-automation/auth": at("../../packages/modules-auth/src/index.ts"),
  "@upmind-automation/client": at("../../packages/modules-client/src/index.ts"),
  "@upmind-automation/payment": at(
    "../../packages/modules-payment/src/index.ts"
  ),
  "@upmind-automation/invoice": at(
    "../../packages/modules-invoice/src/index.ts"
  ),
  "@upmind-automation/basket": at("../../packages/modules-basket/src/index.ts")
};

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag: string) => tag.startsWith("lord-")
        }
      }
    })
  ],
  resolve: { alias, dedupe: ["vue-router"] },
  test: {
    ...workerPool("dom"),
    root,
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    exclude: [...configDefaults.exclude, "**/*.stub.ts"],
    testTimeout: 10000
  }
});
