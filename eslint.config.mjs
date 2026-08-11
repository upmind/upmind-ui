// @ts-check
/**
 * @fileoverview FE-2820 — single shared ESLint flat config for the whole monorepo.
 *
 * ONE config at the repo root governs every package. This file REPLACES the five
 * byte-cloned configs that existed (root, packages/headless, packages/ui,
 * apps/velia, apps/hosting) and the stale packages/types/.eslintrc.cjs.
 *
 * Why one config works under flat config + pnpm -r:
 *   `eslint .` from a package cwd walks UP to the nearest eslint.config.mjs.
 *   With only this root file present, every package resolves to it. The former
 *   per-package clones existed ONLY to re-state shared rules — flat config
 *   `files`/`ignores` give us per-area scoping without duplicate files.
 *   packages/ui, apps/velia, apps/hosting are standalone submodules that get a
 *   FULL BYTE-COPY of this file (kept in lockstep via .claude/scripts/lint/sync-configs.mjs).
 *
 * Correctness baselines (the floor that was lost in the flat migration — every
 * rule in eslint:recommended, typescript-eslint/recommended, and vue3-essential
 * was silently OFF on @next because the preset arrays were never spread):
 *   - @eslint/js        recommended      (61 core correctness rules)
 *   - @typescript-eslint flat/recommended (.ts typed-syntax correctness, untyped)
 *   - eslint-plugin-vue  flat/essential   (Vue 3 SFC correctness, 85 rules)
 *   - eslint-config-prettier LAST         (prettier owns all formatting)
 *
 * Pinned to the installed, mutually-compatible stack (latest each plugin supports):
 *   eslint 9.39.2 · @typescript-eslint 8.50.0 · eslint-plugin-vue 10.4.0 ·
 *   vue-eslint-parser 10.2.0 · eslint-config-prettier 10.1.8 · prettier 3.7.4.
 *   (eslint 10 is NOT yet supported by eslint-plugin-vue 10 / typescript-eslint 8,
 *   so 9.39.2 is the latest correct ceiling.)
 *
 * -----------------------------------------------------------------------------
 * SUPPRESSION LEDGER — how it is applied everywhere (FE-2842 Tranche 0)
 * -----------------------------------------------------------------------------
 * Existing violations of the "promoted to error" rules below are held in the
 * native ESLint 9 bulk-suppressions ledger `eslint-suppressions.json` at the
 * repo root. ESLint resolves that file — and computes every suppression key —
 * RELATIVE TO `process.cwd()`. The ledger's keys are root-relative (e.g.
 * "packages/headless/src/…"), so the ledger only matches when ESLint runs with
 * cwd = repo root. A run from a package directory (the old `eslint . --fix`
 * script, as invoked by `pnpm --filter <pkg> lint` / `pnpm -r lint`) computes
 * package-relative keys, matches nothing, and reports every suppressed violation
 * as a live error — so per-package lint and a root `eslint .` disagreed by
 * ~1,005 violations on the same tree. Passing `--suppressions-location` alone
 * does NOT fix this; the cwd itself must be the repo root.
 *
 * THE FIX: every lint entrypoint (root `pnpm lint`, `pnpm -r lint`,
 * `pnpm --filter <pkg> lint`, and CI) routes through
 * `.claude/scripts/lint/eslint-workspace.mjs`, which always runs ESLint with cwd = repo
 * root while targeting the invoking package, so all entrypoints resolve the
 * IDENTICAL suppression state. That wrapper — not this config — is the single
 * source of truth for how the ledger is loaded (ESLint offers no config-level
 * hook for the suppressions location; it is purely a CLI concern).
 * `.claude/scripts/lint/verify-lint-convergence.mjs` (CI job `lint:convergence`, run via
 * `pnpm lint:verify`) guards the invariant so the entrypoints cannot silently
 * diverge again. Git-submodule packages (packages/ui, apps/hosting, apps/velia)
 * must adopt the same wrapper in their OWN repos — the parent cannot edit their
 * package.json without submodule churn; the guard flags any that haven't.
 *
 * Ledger ACCURACY (pruning stale entries, regenerating counts) is a SEPARATE
 * concern from this wiring: the wrapper passes `--pass-on-unpruned-suppressions`
 * so a package-scoped run does not fail merely because the whole-repo ledger
 * carries other packages' (or stale) entries. Regeneration is done by re-running
 * ESLint with `--prune-suppressions` in a later FE-2842 step, never here.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import js from "@eslint/js";
import eslintPluginTypescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import eslintPluginVue from "eslint-plugin-vue";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginUnusedImports from "eslint-plugin-unused-imports";
import vueParser from "vue-eslint-parser";
import globals from "globals";
import scopeBasedPlugin from "@upmind-automation/eslint-plugin-scope-based";

// typescript-eslint's flat/recommended is a 3-config array:
//   [0] base    — registers the @typescript-eslint plugin + parser + sourceType
//   [1] eslint-recommended — turns OFF core rules TS already covers (for *.ts)
//   [2] recommended — the 22 correctness rules
// Spreading it gives us the full recommended baseline without the umbrella pkg.
const tsRecommended = eslintPluginTypescript.configs["flat/recommended"];

// -----------------------------------------------------------------------------
// Runtime globals per area — restored `no-undef` (from js.configs.recommended)
// would otherwise flag `window`/`process`/Nuxt auto-imports in .vue/.js files.
// browser → packages/*, apps/cart, playgrounds; node → scripts/**, *.config.*;
// apps/cart-nuxt → browser + node + Nuxt auto-imports.
// -----------------------------------------------------------------------------

// Nuxt 3 auto-imported globals (no `globals` export covers these). Vue/Nuxt
// composables + helpers that Nuxt injects at build time so they are referenced
// unqualified in apps/cart-nuxt source.
const nuxtAutoImportGlobals = {
  // --- Vue reactivity / lifecycle (auto-imported by Nuxt)
  ref: "readonly",
  computed: "readonly",
  reactive: "readonly",
  readonly: "readonly",
  watch: "readonly",
  watchEffect: "readonly",
  toRef: "readonly",
  toRefs: "readonly",
  toRaw: "readonly",
  unref: "readonly",
  shallowRef: "readonly",
  nextTick: "readonly",
  onMounted: "readonly",
  onUnmounted: "readonly",
  onBeforeMount: "readonly",
  onBeforeUnmount: "readonly",
  defineComponent: "readonly",
  defineAsyncComponent: "readonly",
  provide: "readonly",
  inject: "readonly",
  useSlots: "readonly",
  useAttrs: "readonly",
  // --- Nuxt app + runtime
  defineNuxtConfig: "readonly",
  defineNuxtPlugin: "readonly",
  defineNuxtRouteMiddleware: "readonly",
  defineNuxtComponent: "readonly",
  definePageMeta: "readonly",
  defineAppConfig: "readonly",
  useNuxtApp: "readonly",
  useRuntimeConfig: "readonly",
  useAppConfig: "readonly",
  useState: "readonly",
  useCookie: "readonly",
  useRoute: "readonly",
  useRouter: "readonly",
  useHead: "readonly",
  useSeoMeta: "readonly",
  useRequestHeaders: "readonly",
  useRequestEvent: "readonly",
  useAsyncData: "readonly",
  useLazyAsyncData: "readonly",
  useFetch: "readonly",
  useLazyFetch: "readonly",
  useError: "readonly",
  navigateTo: "readonly",
  abortNavigation: "readonly",
  createError: "readonly",
  clearError: "readonly",
  showError: "readonly",
  refreshNuxtData: "readonly",
  $fetch: "readonly",
  // --- @nuxtjs/seo (nuxt-schema-org) auto-imports (apps/cart-nuxt nuxt.config.ts)
  useSchemaOrg: "readonly",
  defineWebPage: "readonly",
  defineProduct: "readonly"
};

// -----------------------------------------------------------------------------
// @internal architectural barrier — custom local plugin (marker-based, strict).
//
// Replaces the legacy suffix-glob `no-restricted-imports` barrier (FE-2820
// ruling §3). Governance switch is the `@internal` head marker, NOT a filename
// suffix and NOT a frozen exception list: a file is internal iff its first ~15
// lines carry `@internal`. Importing such a file from a DIFFERENT module
// directory under packages/headless/src/modules is an error; same-module wiring
// (a service importing its own mapper, basket.utils → sibling machine) is fine.
//
// Scoped (via the config block below) to files under packages/headless/src/modules.
// -----------------------------------------------------------------------------

const MODULES_ROOT = resolve(
  import.meta.dirname,
  "packages/headless/src/modules"
);

// The two aggregator barrels whose import pulls the whole graph (cycle risk).
const HEADLESS_SRC = resolve(MODULES_ROOT, "..");
const MODULES_BARREL = resolve(MODULES_ROOT, "index.ts");
const PACKAGE_BARREL = resolve(HEADLESS_SRC, "index.ts");

// Cache: absolute resolved path → boolean (isInternal). Keyed by the resolved
// target so repeated imports of the same file read disk once.
const internalMarkerCache = new Map();

/**
 * Resolve a relative import specifier to a concrete file on disk, trying the
 * project's extension conventions (.ts, .vue) and the /index.ts barrel.
 */
function resolveRelativeTarget(importerFile, specifier) {
  const base = resolve(dirname(importerFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.vue`,
    resolve(base, "index.ts"),
    resolve(base, "index.vue")
  ];

  for (const candidate of candidates) {
    if (
      (candidate.endsWith(".ts") ||
        candidate.endsWith(".tsx") ||
        candidate.endsWith(".vue")) &&
      existsSync(candidate)
    ) {
      return candidate;
    }
  }

  return null;
}

/** True if the resolved file's head (~15 lines) carries an `@internal` marker. */
function isInternalFile(absPath) {
  const cached = internalMarkerCache.get(absPath);

  if (cached !== undefined) return cached;

  let internal = false;

  if (existsSync(absPath)) {
    const head = readFileSync(absPath, "utf8").split("\n", 15).join("\n");

    internal = /@internal\b/.test(head);
  }

  internalMarkerCache.set(absPath, internal);

  return internal;
}

/** The module directory (immediate child of modules/) that a file lives in. */
function moduleDirOf(absPath) {
  if (!absPath.startsWith(`${MODULES_ROOT}/`)) return null;

  const rest = absPath.slice(MODULES_ROOT.length + 1);
  const slash = rest.indexOf("/");

  return slash === -1 ? rest : rest.slice(0, slash);
}

const internalBarrierPlugin = {
  rules: {
    "no-cross-module-imports": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow importing an @internal-marked headless module file from a different module."
        },
        schema: []
      },
      create(context) {
        const importerFile = context.filename ?? context.getFilename();

        if (!importerFile.startsWith(`${MODULES_ROOT}/`)) return {};

        const importerModule = moduleDirOf(importerFile);

        return {
          ImportDeclaration(node) {
            const specifier = node.source.value;

            if (typeof specifier !== "string") return;
            if (!specifier.startsWith(".")) return;

            const target = resolveRelativeTarget(importerFile, specifier);

            if (!target) return;
            if (!isInternalFile(target)) return;

            const targetModule = moduleDirOf(target);

            if (!targetModule || targetModule === importerModule) return;

            context.report({
              node,
              message:
                `Do not import the @internal file "${specifier}" from another module ` +
                `("${importerModule}" → "${targetModule}"). Reach it via the module's public surface (composable) instead.`
            });
          }
        };
      }
    },
    "no-barrel-imports": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow importing the package-root or modules-root aggregator barrel; it pulls the whole module graph and risks import cycles."
        },
        schema: []
      },
      create(context) {
        const importerFile = context.filename ?? context.getFilename();

        if (!importerFile.startsWith(`${HEADLESS_SRC}/`)) return {};
        // The barrels themselves legitimately re-export the layers below them.
        if (importerFile === PACKAGE_BARREL || importerFile === MODULES_BARREL)
          return {};

        function check(node) {
          const specifier = node.source?.value;
          if (typeof specifier !== "string" || !specifier.startsWith("."))
            return;

          const target = resolveRelativeTarget(importerFile, specifier);
          if (target !== PACKAGE_BARREL && target !== MODULES_BARREL) return;

          const which =
            target === PACKAGE_BARREL ? "package-root" : "modules-root";
          context.report({
            node,
            message:
              `No aggregator-barrel import: "${specifier}" resolves to the ${which} ` +
              `barrel, which pulls the whole module graph and risks import cycles. ` +
              `Import the specific module barrel (e.g. ../brand) or the file directly.`
          });
        }

        return {
          ImportDeclaration: check,
          ExportNamedDeclaration: check,
          ExportAllDeclaration: check
        };
      }
    }
  }
};

// -----------------------------------------------------------------------------
// Shared rule fragments — defined once, referenced from the typed-syntax layers
// so the .ts and .vue blocks cannot drift apart (they did, historically).
// -----------------------------------------------------------------------------

const unusedVarsRule = [
  "error",
  {
    argsIgnorePattern: "^_",
    varsIgnorePattern: "^_",
    caughtErrorsIgnorePattern: "^_"
  }
];

const consistentTypeImportsRule = [
  "error",
  {
    prefer: "type-imports",
    // Load-bearing: separate `import type {…}` statements, never inline `{ type X }`.
    // Pairs with @typescript-eslint/no-import-type-side-effects below.
    fixStyle: "separate-type-imports",
    disallowTypeAnnotations: false
  }
];

const importOrderRule = [
  "error",
  {
    groups: [
      "builtin",
      "external",
      "internal",
      "parent",
      "sibling",
      "index",
      "type"
    ],
    pathGroups: [
      {
        pattern: "@upmind-automation/**",
        group: "external",
        position: "after"
      },
      // Utils imports sit just before types (covers 0–5 levels of ../).
      {
        pattern: "{.,..,../..,../../..,../../../..}/**/util*",
        group: "type",
        position: "before"
      },
      { pattern: "lodash-es", group: "type", position: "before" }
    ],
    pathGroupsExcludedImportTypes: ["type"],
    "newlines-between": "never",
    alphabetize: { order: "asc", caseInsensitive: true }
  }
];

const linesAroundCommentRule = [
  "error",
  {
    beforeLineComment: false,
    afterLineComment: false,
    allowBlockStart: true,
    allowObjectStart: true,
    allowArrayStart: true,
    allowClassStart: true
  }
];

const sharedTsRules = {
  // --- Prettier as the single formatter
  "prettier/prettier": ["error", { endOfLine: "auto" }],

  // --- Development-only correctness (env-gated; promoted to error in prod builds)
  "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
  "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
  "no-constant-condition":
    process.env.NODE_ENV === "production" ? "error" : "off",

  // --- Unused
  "unused-imports/no-unused-imports": "error",
  "no-unused-vars": "off", // base off; the TS-aware variant below reports correctly
  "@typescript-eslint/no-unused-vars": unusedVarsRule,

  // --- TypeScript intent overrides (relax recommended where the codebase needs it)
  "@typescript-eslint/no-require-imports": "off", // a Vite plugin resolves require() in build; require is intentional in a few configs
  "@typescript-eslint/ban-ts-comment": "off", // @ts-expect-error is used deliberately at typed boundaries
  "@typescript-eslint/no-this-alias": [
    "error",
    { allowDestructuring: true, allowedNames: ["vm"] }
  ],

  // --- Decision rules promoted to error (FE-2820 rulings §5/§6/§7). Existing
  //     violations are handled by native bulk suppressions (eslint-suppressions.json),
  //     NOT by auto-fixes — `any` seams and rejection payloads are load-bearing.
  "@typescript-eslint/no-explicit-any": "error",
  "no-unsafe-optional-chaining": "error",
  "prefer-promise-reject-errors": "warn",

  // --- Type-import hygiene (the project's strictest enforced contract)
  "@typescript-eslint/consistent-type-imports": consistentTypeImportsRule,
  "@typescript-eslint/no-import-type-side-effects": "error",

  // --- Import ordering + section-comment hygiene
  "import/order": importOrderRule,
  "import/newline-after-import": ["error", { count: 1 }],
  "import/first": "error",
  "lines-around-comment": linesAroundCommentRule
};

const sharedVueRules = {
  "prettier/prettier": ["error", { endOfLine: "auto" }],

  // --- Vue style/intent on top of vue3-essential correctness
  "vue/component-name-in-template-casing": ["error", "PascalCase"],
  "vue/multi-word-component-names": "off", // many intentional single-word public components (Cart, Upmind); renaming is cosmetic churn with API impact
  "vue/no-v-html": "off", // sanitised HTML is rendered deliberately (rich content, CMS); we own the sanitiser
  "vue/no-v-text-v-html-on-component": "off", // web-component wrappers legitimately receive v-html
  "vue/no-v-model-argument": "off", // Vue-2-era guard; irrelevant under Vue 3
  // vue/component-api-style is deliberately OFF (left unset): the codebase mixes
  // <script setup>, composition, and options API by design (client-vue web-component
  // wrappers vs cart SFCs). Enforcing one style is churn with no correctness gain
  // (FE-2820 ruling §4). The 2 stale eslint-disable comments for it were removed.

  // --- Unused / type-import hygiene mirrored from sharedTsRules (single source above)
  "unused-imports/no-unused-imports": "error",
  "no-unused-vars": "off",
  "@typescript-eslint/no-unused-vars": unusedVarsRule,
  "@typescript-eslint/consistent-type-imports": consistentTypeImportsRule,
  "@typescript-eslint/no-import-type-side-effects": "error",

  // --- Decision rules promoted to error (mirrored from sharedTsRules)
  "@typescript-eslint/no-explicit-any": "error",
  "no-unsafe-optional-chaining": "error",
  "prefer-promise-reject-errors": "warn",

  // --- Import ordering
  "import/first": "error",
  "import/order": importOrderRule
};

// -----------------------------------------------------------------------------
// No-vue lint boundary — packages/scenario-harness is
// framework-agnostic by design. This IS the explicit decision to reintroduce
// `no-restricted-imports`: FE-2820 §3 removed the legacy version for
// COARSENESS (a suffix-glob over all headless modules), not principle — this
// block is package-scoped, so that coarseness doesn't apply. Banned: the vue
// family plus the vue-tainted workspace packages (a headless import taints
// transitively even when "vue" never appears in the specifier). The base
// `no-restricted-imports` rule also flags `import type`, which is intentional
// here — even type-only coupling to a vue-tainted package defeats the point.
// -----------------------------------------------------------------------------
const NO_VUE_BOUNDARY_MESSAGE =
  "packages/scenario-harness is framework-agnostic — vue and vue-tainted packages banned, incl. import type.";

const bannedScenarioHarnessSpecifiers = [
  "vue",
  "vue-router",
  "vue-i18n",
  "vue-demi",
  "pinia",
  "@xstate/vue",
  "@upmind-automation/headless",
  "@upmind-automation/client-vue",
  "@upmind-automation/upmind-ui",
  "@upmind-automation/i18n"
];

const noRestrictedVueImportsRule = [
  "error",
  {
    paths: bannedScenarioHarnessSpecifiers.map(name => ({
      name,
      message: NO_VUE_BOUNDARY_MESSAGE
    })),
    patterns: [
      // Bare-package deep subpaths (vue's own + the vue-composition-utils
      // family): glob groups suffice here because none of these names
      // collide with an unrelated prefix.
      {
        group: ["vue/*", "@vue/*", "@vueuse/*"],
        message: NO_VUE_BOUNDARY_MESSAGE
      },
      // Workspace-package deep subpaths — `paths` above only matches the
      // bare specifier exactly, so `@upmind-automation/headless/src/...`
      // (or any other file inside a vue-tainted workspace package) needs
      // its own check. `regex` (not `group`) because the glob matcher
      // wouldn't otherwise anchor "must start with this exact package name
      // plus a slash" without also catching unrelated `@upmind-automation/*`
      // packages (e.g. `@upmind-automation/types`, which is NOT banned).
      {
        regex: "^@upmind-automation/(headless|client-vue|upmind-ui|i18n)/",
        message: NO_VUE_BOUNDARY_MESSAGE
      }
    ]
  }
];

// Two shapes `no-restricted-imports` structurally cannot see, verified against
// the installed rule source (node_modules/eslint/lib/rules/no-restricted-imports.js):
// it registers only an `ImportDeclaration` visitor, never `ImportExpression`, so a
// dynamic `await import("vue")` is invisible to it; and its `paths`/`patterns`
// match on the raw specifier TEXT, so a relative escape (`../../headless/src/index`)
// that never types a banned name is invisible too. Both need the import resolved —
// dynamic imports need the *specifier value itself checked against the same banned
// list, and relative escapes need the specifier resolved to a concrete disk path
// (the same technique block 8c's `no-barrel-imports` uses, so it is depth-agnostic)
// and rejected if that path falls outside packages/scenario-harness entirely.
const SCENARIO_HARNESS_ROOT = resolve(
  import.meta.dirname,
  "packages/scenario-harness"
);

// Mirrors noRestrictedVueImportsRule's own ban list (exact + subpath + vueuse),
// as a single regex so the custom rule below and the base rule stay in lockstep.
const bannedScenarioHarnessSpecifierPattern = new RegExp(
  "^(?:vue|vue-router|vue-i18n|vue-demi|pinia|@xstate/vue)(?:/.*)?$" +
    "|^@vue/" +
    "|^@vueuse/" +
    "|^@upmind-automation/(?:headless|client-vue|upmind-ui|i18n)(?:/.*)?$"
);

const scenarioHarnessBoundaryPlugin = {
  rules: {
    "no-vue-boundary-escape": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow dynamic import() of a banned framework specifier and any relative import that resolves outside packages/scenario-harness."
        },
        schema: []
      },
      create(context) {
        function check(node, sourceNode) {
          const specifier = sourceNode?.value;
          if (typeof specifier !== "string") return;

          if (bannedScenarioHarnessSpecifierPattern.test(specifier)) {
            context.report({ node, message: NO_VUE_BOUNDARY_MESSAGE });
            return;
          }

          if (!specifier.startsWith(".")) return;

          const importerFile = context.filename ?? context.getFilename();
          const target = resolveRelativeTarget(importerFile, specifier);

          if (target && !target.startsWith(`${SCENARIO_HARNESS_ROOT}/`)) {
            context.report({
              node,
              message: `${NO_VUE_BOUNDARY_MESSAGE} (relative import resolves outside packages/scenario-harness: "${specifier}")`
            });
          }
        }

        return {
          ImportDeclaration(node) {
            check(node, node.source);
          },
          ExportNamedDeclaration(node) {
            check(node, node.source);
          },
          ExportAllDeclaration(node) {
            check(node, node.source);
          },
          ImportExpression(node) {
            check(node, node.source);
          }
        };
      }
    }
  }
};

// -----------------------------------------------------------------------------
// Workspace package boundary (FE-2977 ruling). A workspace package is
// reached by its published specifier; its file layout is private. Two arms,
// because a path escape and a subpath specifier are different shapes:
//
//   arm 1 — `no-restricted-imports` on the deep subpaths of the two packages
//           whose public surface is bounded: headless publishes exactly ".",
//           "./scenarios" and "./testing/*" (its `exports` map), scenario-harness
//           exactly ".". The map alone does NOT gate the playgrounds — a
//           vite/vitest alias to the package DIRECTORY resolves ahead of
//           `exports`, so a subpath keeps resolving there no matter what the map
//           says. This arm is the gate for that lane. "./testing/*" is published
//           for OTHER packages' test lanes, so block 8h re-arms it there and
//           8g keeps it banned everywhere else.
//   arm 2 — the same law for relative escapes, which no specifier pattern can
//           see: `../../packages/headless/src/...` never types a package name.
//           Resolved to a disk path (the technique block 8c uses) and compared
//           by owning package, so it is depth-agnostic and lets a package's own
//           deep relative imports through.
//
// Alias maps are exempt by construction: an alias is what MAKES a specifier
// resolve, and neither arm looks at one.
// -----------------------------------------------------------------------------
const PACKAGE_BOUNDARY_MESSAGE =
  "Import a workspace package by its published specifier — its internals are private.";

/**
 * @param testLane Whether headless's `./testing/*` export — its published
 *   test-kit surface, kept off the main barrel so it never enters the
 *   production graph — is reachable from these files. Test lanes only.
 */
const noWorkspaceSubpathImportsRule = testLane => [
  "error",
  {
    patterns: [
      {
        regex: `^@upmind-automation/headless/(?!scenarios$|package\\.json$${testLane ? "|testing/" : ""})`,
        message: `${PACKAGE_BOUNDARY_MESSAGE} headless publishes ".", "./scenarios" and "./testing/*" (test lanes only).`
      },
      {
        regex: "^@upmind-automation/scenario-harness/",
        message: `${PACKAGE_BOUNDARY_MESSAGE} scenario-harness publishes "." only.`
      }
    ]
  }
];

const packageRootCache = new Map();

/** The workspace package that owns a file: its nearest ancestor with a package.json. */
function packageRootOf(absPath) {
  const cached = packageRootCache.get(absPath);

  if (cached !== undefined) return cached;

  let dir =
    existsSync(absPath) && statSync(absPath).isDirectory()
      ? absPath
      : dirname(absPath);

  while (dir.startsWith(import.meta.dirname) && dir !== import.meta.dirname) {
    if (existsSync(resolve(dir, "package.json"))) break;

    dir = dirname(dir);
  }

  packageRootCache.set(absPath, dir);

  return dir;
}

const workspaceBoundaryPlugin = {
  rules: {
    "no-cross-package-path-imports": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow a relative import that resolves into a different workspace package."
        },
        schema: []
      },
      create(context) {
        function check(node, sourceNode) {
          const specifier = sourceNode?.value;

          if (typeof specifier !== "string" || !specifier.startsWith(".")) {
            return;
          }

          const importerFile = context.filename ?? context.getFilename();
          const base = resolve(dirname(importerFile), specifier);
          // resolveRelativeTarget only answers for source files; a recorded
          // JSON fixture is reached by its exact path, so try that first.
          const target = existsSync(base)
            ? base
            : resolveRelativeTarget(importerFile, specifier);

          if (!target) return;

          const owner = packageRootOf(target);

          // Repo-level shared code (tests/Playwright's support library) belongs
          // to no package, so reaching it crosses no package boundary.
          if (
            owner === import.meta.dirname ||
            owner === packageRootOf(importerFile)
          ) {
            return;
          }

          context.report({
            node,
            message: `${PACKAGE_BOUNDARY_MESSAGE} ("${specifier}" resolves into ${owner.slice(import.meta.dirname.length + 1)})`
          });
        }

        return {
          ImportDeclaration(node) {
            check(node, node.source);
          },
          ExportNamedDeclaration(node) {
            check(node, node.source);
          },
          ExportAllDeclaration(node) {
            check(node, node.source);
          },
          ImportExpression(node) {
            check(node, node.source);
          }
        };
      }
    }
  }
};

export default [
  // ---------------------------------------------------------------------------
  // 1. Global ignores
  // ---------------------------------------------------------------------------
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.nuxt/**",
      "**/.output/**",
      "**/coverage/**",
      "**/*.d.ts",
      "**/.eslintrc.cjs", // legacy eslintrc files lingering in the tree are not linted by us
      "**/.history/**",
      "**/.husky/**",
      "**/.vscode/**",
      "**/public/**",
      "**/jsdoc/**",
      "**/templates/**",
      // Machine-owned generated docs corpus (FE-2752 / FE-2950) — byte-identity is
      // the authorship-guard contract; never linted/reformatted (builder is sole formatter).
      "docs/corpus/corpus.json",
      "docs/corpus/relations.json",
      "docs/published-docs/developers/reference/**",
      "docs/published-docs/developers/changelog/**",
      "docs/published-docs/developers/corpus-version.json",
      "**/tests/bench/**",
      "**/tests/fixtures/**",
      "**/tests/performance/**",
      "**/tmp/**",
      "**/src/presets/**",
      // packages/types is a standalone repo consumed by other projects — EXCLUDED
      // from the linted set entirely (FE-2820 ruling §8). Never touch its files.
      "packages/types/**",
      // FE-2774 parity oracle — byte-frozen during migration, remove post-cutover (FE-2827)
      "tests/Playwright/**",
      // Frozen audit evidence — per-package .eslintrc.cjs baseline captures, @next-legacy
      // eslint.config.mjs snapshot, proposed config copy, and classify.mjs. Not live code;
      // linting/fixing them would mutate the baseline (FE-2820 cycle-1 triage).
      "**/.artifacts/**",
      // playwright-bdd's generated spec files (bddgen output, FE-2976) — machine
      // output sitting in the tree (gitignored, but not previously excluded from
      // a root-cwd lint pass), never hand-edited or reformatted.
      ".features-gen/**"
    ]
  },

  // ---------------------------------------------------------------------------
  // 2. Correctness baselines (apply to all lintable JS/TS/Vue)
  //    These are the layers the flat migration dropped. Restored here ONCE.
  // ---------------------------------------------------------------------------
  js.configs.recommended, // @eslint/js — 61 core correctness rules (was never loaded on @next)
  ...tsRecommended, // @typescript-eslint base + eslint-recommended(.ts core-off) + 22 recommended rules
  ...eslintPluginVue.configs["flat/essential"], // Vue 3 essential: vue base (comment-directive, jsx-uses-vars) + 85 rules + vue/vue processor scoped to *.vue

  // ---------------------------------------------------------------------------
  // 3. Runtime globals — browser areas (packages/*, apps/cart, playgrounds).
  //    Restores defensible `no-undef` without flagging window/document/etc.
  // ---------------------------------------------------------------------------
  {
    files: [
      "packages/**/*.{ts,tsx,mts,cts,js,cjs,mjs,vue}",
      "apps/cart/**/*.{ts,tsx,mts,cts,js,cjs,mjs,vue}",
      "playgrounds/**/*.{ts,tsx,mts,cts,js,cjs,mjs,vue}"
    ],
    languageOptions: {
      globals: { ...globals.browser }
    }
  },

  // ---------------------------------------------------------------------------
  // 4. Runtime globals — node areas (build scripts, config files, agent scripts,
  //    test fixtures). Covers: .claude/scripts/**, *.config.*,
  //    tests/fixtures/** — all are Node runtime environments.
  // ---------------------------------------------------------------------------
  {
    files: [
      ".claude/scripts/**/*.{ts,tsx,mts,cts,js,cjs,mjs}",
      "**/*.config.{ts,mts,cts,js,cjs,mjs}",
      "tests/fixtures/**/*.{mjs,js,ts}",
      "packages/eslint-plugin-scope-based/**/*.{js,mjs}",
      "packages/*/scripts/**/*.{ts,mts,cts,js,cjs,mjs}"
    ],
    languageOptions: {
      globals: { ...globals.node }
    }
  },

  // ---------------------------------------------------------------------------
  // 5. Runtime globals — Nuxt apps (cart-nuxt + labs-nuxt): browser + node +
  //    Nuxt auto-imports.
  // ---------------------------------------------------------------------------
  {
    files: [
      "apps/cart-nuxt/**/*.{ts,tsx,mts,cts,js,cjs,mjs,vue}",
      "playgrounds/labs-nuxt/**/*.{ts,tsx,mts,cts,js,cjs,mjs,vue}"
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...nuxtAutoImportGlobals }
    }
  },

  // ---------------------------------------------------------------------------
  // 6. TypeScript files — project conventions on top of the baselines
  // ---------------------------------------------------------------------------
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" }
    },
    plugins: {
      import: eslintPluginImport,
      prettier: eslintPluginPrettier,
      "unused-imports": eslintPluginUnusedImports
      // @typescript-eslint plugin already registered by the spread preset above
    },
    rules: sharedTsRules
  },

  // ---------------------------------------------------------------------------
  // 7. Vue SFCs — TS parser inside <script>, vue3-essential already applied
  // ---------------------------------------------------------------------------
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: { ...globals.browser, ...globals.node, ...nuxtAutoImportGlobals }
    },
    plugins: {
      import: eslintPluginImport,
      prettier: eslintPluginPrettier,
      "unused-imports": eslintPluginUnusedImports
    },
    rules: sharedVueRules
  },

  // ---------------------------------------------------------------------------
  // 8. @internal barrier — custom marker-based rule, scoped to headless modules.
  //    A file is internal iff its head carries `@internal`; importing it from a
  //    different module directory is an error. Same-module wiring is allowed.
  //    Replaces the coarse suffix-glob no-restricted-imports (FE-2820 ruling §3).
  // ---------------------------------------------------------------------------
  {
    files: ["packages/headless/src/modules/**/*.{ts,tsx,mts,cts}"],
    plugins: {
      "@internal": internalBarrierPlugin
    },
    rules: {
      "@internal/no-cross-module-imports": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 8c. No aggregator-barrel imports — importing the package-root barrel
  //     (src/index.ts) or the modules-root barrel (src/modules/index.ts) pulls
  //     the whole module graph and creates import cycles (the useTime load-order
  //     crash). The custom marker plugin resolves the specifier to a disk path,
  //     so it is depth-agnostic and never mistakes a same-module `..` for root.
  //     Import the specific owning module barrel (../brand) or the file itself.
  //     `warn` until the existing call sites are repointed, then flip to `error`.
  // ---------------------------------------------------------------------------
  {
    files: ["packages/headless/src/**/*.{ts,tsx,mts,cts,vue}"],
    plugins: {
      "@internal": internalBarrierPlugin
    },
    rules: {
      "@internal/no-barrel-imports": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 8d. Scope-based composable variance law (ADR-001 / FE-2967) — custom AST
  //     plugin, the enforcement replacement for the hand-rolled law-checker.mjs.
  //     Scoped to headless modules; each rule self-gates further (arm files,
  //     composable entries, data-layer files). Tolerated exceptions are silenced
  //     in place with a native `// eslint-disable-*-line scope-based/<rule> -- <reason>`.
  //     Pre-existing violations across legacy modules are grandfathered via the
  //     bulk-suppressions ledger (see the SUPPRESSION LEDGER note above), so a
  //     new/edited scoped construct errors while unscoped legacy stays advisory.
  // ---------------------------------------------------------------------------
  {
    files: ["packages/headless/src/modules/**/*.{ts,tsx,mts,cts}"],
    ignores: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
    plugins: {
      "scope-based": scopeBasedPlugin
    },
    rules: {
      "scope-based/no-self-branch": "error",
      "scope-based/require-decision": "error",
      "scope-based/no-cosplay-arm": "error",
      "scope-based/complete-layer-set": "error",
      "scope-based/actor-scope-first": "error",
      "scope-based/arm-in-matrix": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 8e. Integration-test fixture provenance — the AST re-home of the retired
  //     regex scanner `tests/fixtures/lint-int-test-provenance.mjs`. A journey
  //     body fed to `HttpResponse.json(...)` must replay a recorded fixture
  //     (getFixtureBody/getFixture), never a hand-rolled local builder.
  // ---------------------------------------------------------------------------
  {
    files: ["**/*.int.test.ts"],
    plugins: {
      "scope-based": scopeBasedPlugin
    },
    rules: {
      "scope-based/no-hand-rolled-int-fixture": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 8f. No-vue lint boundary — packages/scenario-harness only. See the const
  //    definitions above for the full rationale. Widened past .ts/.tsx/.mts/.cts
  //    to .js/.jsx/.mjs/.cjs/.vue so a future tooling file (vitest.config.mjs,
  //    a .vue playground fixture) in this package cannot import vue unguarded.
  // ---------------------------------------------------------------------------
  {
    files: [
      "packages/scenario-harness/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}"
    ],
    plugins: {
      "@scenario-harness": scenarioHarnessBoundaryPlugin
    },
    rules: {
      "no-restricted-imports": noRestrictedVueImportsRule,
      "@scenario-harness/no-vue-boundary-escape": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 8g. Workspace package boundary — see the const definitions above. Scoped to
  //    the workspace members `pnpm -r lint` actually lints; repo-root tooling
  //    configs are outside every package and outside that target set, so they
  //    are not covered here. packages/scenario-harness is excluded because 8f
  //    owns `no-restricted-imports` for it (flat config replaces, not merges)
  //    with a strictly wider ban, and its escape rule covers relative paths.
  // ---------------------------------------------------------------------------
  {
    files: [
      "apps/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}",
      "packages/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}",
      "playgrounds/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}",
      "tests/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}"
    ],
    ignores: ["packages/scenario-harness/**"],
    plugins: {
      "@workspace": workspaceBoundaryPlugin
    },
    rules: {
      "no-restricted-imports": noWorkspaceSubpathImportsRule(false),
      "@workspace/no-cross-package-path-imports": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 8h. The test lane of 8g. headless publishes "./testing/*" for exactly these
  //    files — another package's specs reaching its module kits, its replay
  //    setup and its recorded fixtures by specifier. 8g still bans the subpath
  //    everywhere else, so nothing in a production graph can reach it. Flat
  //    config REPLACES `no-restricted-imports`, so this restates the whole rule
  //    rather than adding to it; arm 2 (the relative-escape rule) is untouched
  //    and still forbids reaching the same files by path.
  // ---------------------------------------------------------------------------
  {
    files: [
      "**/__tests__/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}",
      "**/*.{test,spec}.{ts,tsx,mts,cts,js,jsx,mjs,cjs}",
      "playgrounds/*/tests/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}",
      "tests/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}"
    ],
    ignores: ["packages/scenario-harness/**"],
    rules: {
      "no-restricted-imports": noWorkspaceSubpathImportsRule(true)
    }
  },

  // ---------------------------------------------------------------------------
  // 9. Plain JS / CJS / MJS — config & tooling files. Correctness from
  //    js.configs.recommended still applies; we only relax module + format here.
  // ---------------------------------------------------------------------------
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      "prettier/prettier": ["error", { endOfLine: "auto" }]
    }
  },

  // ---------------------------------------------------------------------------
  // 10. Upmind.vue — two-script-block SFC whose plain options block
  //    (inheritAttrs/customOptions — inexpressible in <script setup>) precedes
  //    the setup block. vue-eslint-parser reads both blocks as one program, so
  //    import/first ("imports before code") is structurally unsatisfiable here.
  //    import/order still applies. Do NOT let any fixer "solve" this by moving
  //    statements across blocks (FE-2820 incident, 2026-06-11) — sweep.mjs
  //    refuses to write fixes to multi-block SFCs for the same reason.
  // ---------------------------------------------------------------------------
  {
    files: ["packages/client-vue/src/Upmind.vue"],
    rules: { "import/first": "off" }
  },

  // ---------------------------------------------------------------------------
  // 11. Prettier compatibility — MUST be last. Disables every stylistic rule so
  //    prettier is the sole formatter (330 rule names switched off).
  // ---------------------------------------------------------------------------
  eslintConfigPrettier
];
