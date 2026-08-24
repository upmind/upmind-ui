import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const configDir = fileURLToPath(new URL("./.storybook", import.meta.url));

/**
 * Runs every story (this app's foundations + design-system/packages/ui components) as a
 * smoke test in real Chromium, with the addon-a11y axe checks enforced at the
 * `test: 'error'` severity set in .storybook/preview.ts.
 */
export default defineConfig({
  plugins: [storybookTest({ configDir })],
  test: {
    name: "storybook",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }]
    }
  }
});
