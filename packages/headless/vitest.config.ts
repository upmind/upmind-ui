import { fileURLToPath } from "node:url";
import { mergeConfig, defineConfig, configDefaults } from "vitest/config";
import { workerPool } from "../../vitest.workers";
import viteConfig from "./vite.config";
// -----------------------------------------------------------------------------

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
      // projects (cores-1 = 11 here) and pegs the machine >100%.
      //
      // This cap MUST stay on the root `test` object. Both projects below share
      // ONE memoised fork pool sized from the root config
      // (`coverage.DL5VHqXY.js:3410-3419` and `:2610-2613`), so a `maxWorkers`
      // moved into `projects[]` is silently ignored.
      //
      // Was `maxWorkers: "50%"`, which is 6 workers on this 12-core box —
      // ~3.2 GB, over the ~2.5 GB per-run budget. A percentage tracks cores;
      // the constraint here is memory, so the ceiling is an absolute integer.
      // The heavier of the two lanes (jsdom unit / happy-dom integration)
      // sets the profile.
      ...workerPool("dom"),
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
              // A real browser saves a `download` link instead of following it;
              // happy-dom follows it and moves the page to a blob: origin.
              environmentOptions: {
                happyDOM: {
                  settings: {
                    navigation: {
                      disableMainFrameNavigation: true,
                      disableFallbackToSetURL: true
                    }
                  }
                }
              },
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
