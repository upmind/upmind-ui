import { fileURLToPath } from "node:url";
import { mergeConfig, defineConfig, configDefaults } from "vitest/config";
import { workerPool } from "../../vitest.workers";
import viteConfig from "./vite.config";

const root = fileURLToPath(new URL("./", import.meta.url));

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Uncapped this took cores-1 = 11 jsdom forks. See vitest.workers.ts for
      // the measured per-worker cost and the per-run memory budget.
      ...workerPool("dom"),
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
      exclude: [...configDefaults.exclude, "e2e/*"],
      root
    }
  })
);
