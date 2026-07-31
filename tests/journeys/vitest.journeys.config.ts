import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig, configDefaults } from "vitest/config";

// The journey int tests import the headless SOURCE barrel (aliased to a file),
// but headless's own runtime deps (vue, xstate, @tanstack/*, lodash-es, …) are
// installed under packages/headless/node_modules — pnpm does not hoist them to
// a node_modules reachable from tests/journeys. Resolve each of headless's
// declared deps/peers to its own package directory so the barrel's transitive
// bare imports resolve exactly as they do under packages/headless's own vitest
// project. Aliasing to the package DIR (not its entry file) keeps subpath
// imports like `dayjs/plugin/utc` working (vite alias matches on a path
// boundary, so `vue` never captures `vue-router`).
const require = createRequire(
  fileURLToPath(
    new URL("../../packages/headless/package.json", import.meta.url)
  )
);

const headlessPkg = require("./package.json") as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

function packageDir(name: string): string {
  try {
    return dirname(require.resolve(`${name}/package.json`));
  } catch {
    const entry = require.resolve(name);
    const marker = `node_modules/${name}`;
    const index = entry.lastIndexOf(marker);
    return index >= 0 ? entry.slice(0, index + marker.length) : dirname(entry);
  }
}

const headlessDepAliases = Object.fromEntries(
  [
    ...Object.keys(headlessPkg.dependencies ?? {}),
    ...Object.keys(headlessPkg.peerDependencies ?? {})
  ]
    // Workspace packages are aliased to their own source below; @types/* are
    // type-only and never imported at runtime.
    .filter(name => !name.startsWith("@upmind-automation/"))
    .filter(name => !name.startsWith("@types/"))
    .map(name => [name, packageDir(name)])
);

const alias = {
  ...headlessDepAliases,
  // Workspace source (mirrors packages/headless/vite.config.ts): a FILE for the
  // headless barrel (single-file, init-order safe) and a DIRECTORY for the
  // fixtures tool (its subpaths /replay-server, /msw-handlers must keep
  // resolving — it has no exports map).
  "@upmind-automation/headless": fileURLToPath(
    new URL("../../packages/headless/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/test-fixtures": fileURLToPath(
    new URL("../fixtures", import.meta.url)
  ),
  "@upmind-automation/types": fileURLToPath(
    new URL("../../packages/types/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/i18n": fileURLToPath(
    new URL("../../packages/i18n/src/index.ts", import.meta.url)
  ),
  // The scenario-harness package is source-consumed, no-build (FE-2976 design
  // §1) — same shape as the other workspace barrels above.
  "@upmind-automation/scenario-harness": fileURLToPath(
    new URL("../../packages/scenario-harness/src/index.ts", import.meta.url)
  )
};

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias
  },
  test: {
    root: fileURLToPath(new URL("./", import.meta.url)),
    // happy-dom, not jsdom: node's undici fetch rejects jsdom's AbortSignal
    // (vitest #8374) — the journey int tests drive real composables that fetch
    // through MSW replay, so they need the same DOM as the headless integration
    // project.
    environment: "happy-dom",
    include: ["**/*.int.test.ts"],
    exclude: [
      ...configDefaults.exclude,
      "**/*.spec.ts",
      "**/*.fixtures.ts",
      "**/fixtures/**",
      "**/node_modules/**"
    ],
    testTimeout: 30000,
    hookTimeout: 30000,
    passWithNoTests: true
  }
});
