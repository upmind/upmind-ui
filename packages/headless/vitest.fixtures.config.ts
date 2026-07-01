import { fileURLToPath } from "node:url";
import { mergeConfig, defineConfig } from "vitest/config";
import viteConfig from "./vite.config";

const root = fileURLToPath(new URL("./", import.meta.url));

const alias = {
  "@upmind-automation/test-fixtures": fileURLToPath(
    new URL("../../tests/fixtures", import.meta.url)
  )
};

// Runs the *.fixtures.ts generators against a REAL API (node env, real fetch).
// Never part of the normal suite — selected only by `pnpm fixtures:generate`.
export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: { alias },
    test: {
      root,
      environment: "node",
      include: ["src/**/__tests__/**/*.fixtures.ts"],
      testTimeout: 30000
    }
  })
);
