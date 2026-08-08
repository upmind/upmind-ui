import { fileURLToPath } from "node:url";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import { defineConfig, mergeConfig } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

// Mirrors nuxt.config.ts's own `alias` map (":103-143") — the resolve seam
// a Nuxt app and its vitest projects must agree on, kept in one place here
// because vitest never boots the Nuxt runtime itself.
const alias = {
  "@": resolve(root, "./app"),
  "@upmind-automation/types": resolve(
    root,
    "../../packages/types/src/index.ts"
  ),
  "@upmind-automation/i18n": resolve(root, "../../packages/i18n/src"),
  // Above the bare key on purpose: alias matching is prefix-based and
  // first-match-wins, so the bare entry would rewrite the subpath to
  // `…/src/index.ts/scenarios`.
  "@upmind-automation/headless/scenarios": resolve(
    root,
    "../../packages/headless/src/scenarios.ts"
  ),
  "@upmind-automation/headless": resolve(
    root,
    "../../packages/headless/src/index.ts"
  ),
  "@upmind-automation/scenario-harness": resolve(
    root,
    "../../packages/scenario-harness/src/index.ts"
  ),
  "@upmind-automation/upmind-ui": resolve(
    root,
    "../../packages/ui/src/index.ts"
  )
};

// `@upmind-automation/client-vue`'s own barrel re-exports modules unrelated to
// the factory renderer (and, at time of writing, one with a pre-existing
// broken relative import — FE-3002, unrelated to FE-2977). Component specs
// exercise the factory surfaces against `tests/doubles/client-vue.stub.ts`
// (a prop/emit-faithful `UpmForm` double) instead of pulling in the whole
// package — never aliased for the "unit" project, which never renders JSX/SFC.
const componentAlias = {
  ...alias,
  "@upmind-automation/client-vue": resolve(
    root,
    "./tests/doubles/client-vue.stub.ts"
  )
};

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
            include: ["app/composables/**/__tests__/**/*.spec.ts"]
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
            include: ["app/components/**/__tests__/**/*.spec.ts"],
            setupFiles: ["tests/setup/component.setup.ts"]
          }
        })
      )
    ]
  }
});
