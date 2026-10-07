import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import { maxWorkers } from "../../vitest.workers";

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
    // The single heaviest test run in the repo. Uncapped it took 8 vitest
    // workers and 14 real Chromium processes: 6.12 GB peak, which on its own
    // exceeds this machine's spare memory (~5-6 GB free+inactive at rest).
    //
    // Browser mode is sized differently from the fork pools: vitest 4 keeps
    // one pool PER project (`cli-api.24X8XwN1.js:2409-2412`) and reads the
    // per-project value at `:2482` — `headless: true` below is precisely what
    // makes it claim the full cores-1 = 11 by default (`:2481`). Hence a
    // dedicated "browser" profile at ~765 MB per worker, NOT the fork number.
    maxWorkers: maxWorkers("browser"),
    browser: {
      enabled: true,
      headless: true,
      // Animated stories draw one still frame; on CI the shader loop made axe time out.
      provider: playwright({ contextOptions: { reducedMotion: "reduce" } }),
      instances: [{ browser: "chromium" }]
    }
  }
});
