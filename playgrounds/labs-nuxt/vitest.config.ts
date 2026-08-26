import { fileURLToPath } from "node:url";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import { defaultExclude, defineConfig, mergeConfig } from "vitest/config";
import type { Alias } from "vite";

const root = fileURLToPath(new URL("./", import.meta.url));

// Mirrors nuxt.config.ts's own `alias` map (":109-153") — the resolve seam
// a Nuxt app and its vitest projects must agree on, kept in one place here
// because vitest never boots the Nuxt runtime itself.
const alias: Alias[] = [
  { find: "@", replacement: resolve(root, "./app") },
  // Nuxt's own srcDir alias, provided by the framework rather than declared in
  // `nuxt.config.ts` — pages reach their composables through it.
  { find: "~", replacement: resolve(root, "./app") },
  { find: "@icons", replacement: resolve(root, "../../packages/icons/assets") },
  {
    find: "@animations",
    replacement: resolve(root, "./app/assets/animations")
  },
  {
    find: "@upmind-automation/types",
    replacement: resolve(root, "../../packages/types/src/index.ts")
  },
  {
    find: "@upmind-automation/i18n",
    replacement: resolve(root, "../../packages/i18n/src")
  },
  // Anchored: a bare string `find` also captures every subpath under it, which
  // would rewrite `@upmind-automation/headless/testing` — the package's one
  // test-kit export — to a path THROUGH `index.ts`. Exact-match only, so that
  // subpath falls through to the package's own `exports` map.
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
  // A string `find` also captures every subpath under it, and the array is
  // matched in order — so these stylesheet keys only bite while they sit ABOVE
  // the bare package entry below.
  {
    find: "@upmind/ui/styles",
    replacement: resolve(
      root,
      "../../design-system/packages/ui/src/styles/index.css"
    )
  },
  {
    find: "@upmind/ui",
    replacement: resolve(root, "../../design-system/packages/ui/src/index.ts")
  },
  {
    find: "@upmind-automation/client-vue/styles",
    replacement: resolve(
      root,
      "../../packages/client-vue/src/assets/styles/index.css"
    )
  },
  {
    find: "@upmind-automation/client-vue/vars",
    replacement: resolve(
      root,
      "../../packages/client-vue/src/assets/styles/vars.css"
    )
  },
  // Every lane takes the real package from `src` (`nuxt.config.ts:149-152`);
  // without this key they resolve through the package's `exports` map to a
  // `dist` build older than `src`, the same src/dist split
  // `nuxt.config.ts:199-202` closes for types.
  {
    find: "@upmind-automation/client-vue",
    replacement: resolve(root, "../../packages/client-vue/src/index.ts")
  }
];

// The audit gates read the tree off disk rather than importing it, so they run
// in their own node lane. Their files sit inside `modules/scenarios/__tests__`,
// which the "module" project also matches — hence the same list is subtracted
// there, or every audit runs twice, once in an environment it has no use for.
const auditInclude = ["modules/scenarios/__tests__/*vocabulary*.spec.ts"];

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
              "app/services/**/__tests__/**/*.spec.ts",
              "modules/scenarios/runtime/composables/**/__tests__/**/*.spec.ts",
              "modules/scenarios/runtime/force/**/__tests__/**/*.spec.ts"
            ]
          }
        })
      ),
      mergeConfig(
        base,
        defineConfig({
          test: {
            name: "component",
            environment: "jsdom",
            include: [
              "app/components/**/__tests__/**/*.spec.ts",
              "app/layouts/**/__tests__/**/*.spec.ts",
              "app/pages/**/__tests__/**/*.spec.ts",
              // A Nuxt plugin renders nothing, but it boots `client-vue` and
              // the ui plugin set, so it needs a document — not the node lane
              // its "not a component" shape suggests.
              "app/plugins/**/__tests__/**/*.spec.ts",
              "modules/scenarios/runtime/components/**/__tests__/**/*.spec.ts"
            ],
            setupFiles: ["modules/scenarios/testing/component.setup.ts"]
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
            exclude: [...defaultExclude, ...auditInclude],
            // The registrar's own seam with the app mounts components — the
            // derived navigation resolves a scenario's declared `nav.i18n` —
            // so this lane needs the same installed catalogue the component
            // lane does, for the same reason: a missing translator is a raw
            // key on screen that still passes a shape assertion.
            setupFiles: ["modules/scenarios/testing/component.setup.ts"],
            testTimeout: 20000
          }
        })
      ),
      mergeConfig(
        base,
        defineConfig({
          test: {
            name: "audits",
            environment: "node",
            include: auditInclude,
            // A gate that walks `app/** + modules/**` on disk is IO-bound and
            // widens twice more (T2.6, T6.2); the default 5s is the run's only
            // ceiling it could ever reach.
            testTimeout: 20000
          }
        })
      )
    ]
  }
});
