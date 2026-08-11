import { fileURLToPath } from "node:url";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import { defineConfig, mergeConfig } from "vitest/config";
import type { Alias } from "vite";

const root = fileURLToPath(new URL("./", import.meta.url));

// Mirrors nuxt.config.ts's own `alias` map (":103-143") — the resolve seam
// a Nuxt app and its vitest projects must agree on, kept in one place here
// because vitest never boots the Nuxt runtime itself.
const alias: Alias[] = [
  { find: "@", replacement: resolve(root, "./app") },
  // Nuxt's own srcDir alias, provided by the framework rather than declared in
  // `nuxt.config.ts` — pages reach their composables through it.
  { find: "~", replacement: resolve(root, "./app") },
  {
    find: "@upmind-automation/types",
    replacement: resolve(root, "../../packages/types/src/index.ts")
  },
  {
    find: "@upmind-automation/i18n",
    replacement: resolve(root, "../../packages/i18n/src")
  },
  // Anchored: a bare string `find` also captures every subpath under it, which
  // would rewrite `@upmind-automation/headless/testing/*` — the package's real
  // test-kit export — to a path THROUGH `index.ts`. Exact-match only, so
  // subpaths fall through to the package's own `exports` map.
  {
    find: /^@upmind-automation\/headless$/,
    replacement: resolve(root, "../../packages/headless/src/index.ts")
  },
  // Test-lane-only key — never in `nuxt.config.ts`, since nothing at runtime
  // may reach recorded fixtures. Mirrors the mechanism headless already uses
  // for its own fixtures (`packages/headless/vitest.config.ts:7-11`).
  {
    find: "@upmind-automation/test-fixtures",
    replacement: resolve(root, "../../tests/fixtures")
  },
  {
    find: "@upmind-automation/scenario-harness",
    replacement: resolve(root, "../../packages/scenario-harness/src/index.ts")
  },
  {
    find: "@upmind-automation/upmind-ui",
    replacement: resolve(root, "../../packages/ui/src/index.ts")
  }
];

// `@upmind-automation/client-vue`'s own barrel re-exports modules unrelated to
// the factory renderer (and, at time of writing, one with a pre-existing
// broken relative import — FE-3002, unrelated to FE-2977). Component specs
// exercise the factory surfaces against `tests/doubles/client-vue.stub.ts`
// (a prop/emit-faithful `UpmForm` double) instead of pulling in the whole
// package — never aliased for the "unit" project, which never renders JSX/SFC.
const componentAlias: Alias[] = [
  ...alias,
  {
    find: "@upmind-automation/client-vue",
    replacement: resolve(root, "./tests/doubles/client-vue.stub.ts")
  }
];

const base = defineConfig({
  plugins: [vue()],
  resolve: { alias },
  test: { root, testTimeout: 5000 }
});

export default defineConfig({
  test: {
    projects: [
      mergeConfig(
        base,
        defineConfig({
          test: {
            name: "unit",
            environment: "node",
            include: [
              "app/composables/**/__tests__/**/*.spec.ts",
              "modules/scenarios/runtime/composables/**/__tests__/**/*.spec.ts"
            ]
          }
        })
      ),
      mergeConfig(
        base,
        defineConfig({
          resolve: { alias: componentAlias },
          test: {
            name: "component",
            environment: "jsdom",
            include: [
              "app/components/**/__tests__/**/*.spec.ts",
              "app/pages/**/__tests__/**/*.spec.ts",
              "modules/scenarios/runtime/components/**/__tests__/**/*.spec.ts"
            ],
            setupFiles: ["tests/setup/component.setup.ts"]
          }
        })
      ),
      // The registrar runs in Nuxt's Node/jiti BUILD context, so it belongs to
      // neither lane above: it is not a composable and renders nothing. jsdom,
      // not node, because proving the registered routes carry the scope shapes
      // pulls in the app's own scope parser and headless behind it.
      mergeConfig(
        base,
        defineConfig({
          test: {
            name: "module",
            environment: "jsdom",
            include: ["modules/scenarios/__tests__/**/*.spec.ts"],
            // The registrar's own seam with the app mounts components — the
            // derived navigation resolves a scenario's declared `nav.i18n` —
            // so this lane needs the same installed catalogue the component
            // lane does, for the same reason: a missing translator is a raw
            // key on screen that still passes a shape assertion.
            setupFiles: ["tests/setup/component.setup.ts"],
            testTimeout: 20000
          }
        })
      )
    ]
  }
});
