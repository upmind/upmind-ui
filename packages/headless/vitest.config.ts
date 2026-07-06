import { fileURLToPath } from "node:url";
import { mergeConfig, defineConfig, configDefaults } from "vitest/config";
import viteConfig from "./vite.config";

const root = fileURLToPath(new URL("./", import.meta.url));

const alias = {
  "@upmind-automation/test-fixtures": fileURLToPath(
    new URL("../../tests/fixtures", import.meta.url)
  )
};

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      root,
      // Cap concurrency — uncapped, vitest spawns one fork per CPU across both
      // projects and pegs the machine >100%. Half the cores keeps it sustainable.
      pool: "forks",
      maxWorkers: "50%",
      minWorkers: 1,
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "dist/",
          "**/*.d.ts",
          "**/*.config.*",
          "**/__tests__/**",
          "**/test/**",
          "**/tests/**"
        ],
        include: ["src/**/*.{ts,tsx,vue}"],
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
          }
        }
      },
      projects: [
        mergeConfig(
          viteConfig,
          defineConfig({
            resolve: { alias },
            test: {
              name: "unit",
              root,
              environment: "jsdom",
              include: ["src/**/__tests__/**/*.test.ts"],
              exclude: [
                ...configDefaults.exclude,
                "e2e/*",
                "**/*.int.test.ts",
                "**/*.no-test.ts",
                "**/*.fixtures.ts"
              ],
              setupFiles: ["src/__tests__/setup.unit.ts"],
              testTimeout: 5000
            }
          })
        ),
        mergeConfig(
          viteConfig,
          defineConfig({
            resolve: { alias },
            test: {
              name: "integration",
              root,
              // happy-dom, not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
              environment: "happy-dom",
              include: ["src/**/__tests__/**/*.int.test.ts"],
              exclude: [...configDefaults.exclude, "e2e/*", "**/*.fixtures.ts"],
              testTimeout: 30000,
              hookTimeout: 30000
            }
          })
        )
      ]
    }
  })
);
