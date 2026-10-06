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
 *   packages/ui is a standalone submodule that gets a
 *   FULL BYTE-COPY of this file (kept in lockstep via etc/ci/lint/sync-configs.mjs).
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
 * `etc/ci/lint/eslint-workspace.mjs`, which always runs ESLint with cwd = repo
 * root while targeting the invoking package, so all entrypoints resolve the
 * IDENTICAL suppression state. That wrapper — not this config — is the single
 * source of truth for how the ledger is loaded (ESLint offers no config-level
 * hook for the suppressions location; it is purely a CLI concern).
 * `etc/ci/lint/verify-lint-convergence.mjs` (CI job `lint:convergence`, run via
 * `pnpm lint:verify`) guards the invariant so the entrypoints cannot silently
 * diverge again. Git-submodule packages (packages/ui)
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
import fileResponsibilityPlugin from "@upmind-automation/eslint-plugin-file-responsibility";
import endpointOwnershipPlugin from "@upmind-automation/eslint-plugin-endpoint-ownership";
import asyncDisciplinePlugin from "@upmind-automation/eslint-plugin-async-discipline";
import codeQualityPlugin from "@upmind-automation/eslint-plugin-code-quality";
import uiPlugin from "@upmind-automation/eslint-plugin-ui";
import xstatePlugin from "@upmind-automation/eslint-plugin-xstate";
import securityPlugin from "@upmind-automation/eslint-plugin-security";
import testsPlugin from "@upmind-automation/eslint-plugin-tests";

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
// directory under the importer's OWN `<package>/src/modules` is an error;
// same-module wiring (a service importing its own mapper, basket.utils →
// sibling machine) is fine.
// -----------------------------------------------------------------------------

const PACKAGES_ROOT = resolve(import.meta.dirname, "packages");

const MODULES_ROOT = resolve(
  import.meta.dirname,
  "packages/headless/src/modules"
);

// Aggregator barrels whose import pulls the whole graph (cycle risk): the root
// barrel (`src/index.ts`) of headless, client-vue and every modules-* package,
// plus the headless modules-root barrel (`src/modules/index.ts`).
const HEADLESS_SRC = resolve(MODULES_ROOT, "..");
const MODULES_BARREL = resolve(MODULES_ROOT, "index.ts");
const AGGREGATOR_PACKAGE = /^(headless|client-vue|modules-[^/]+)$/;

/** The `src` folder of the aggregator package a file belongs to, or null. */
function aggregatorSrcOf(absPath) {
  if (!absPath.startsWith(`${PACKAGES_ROOT}/`)) return null;

  const pkg = absPath.slice(PACKAGES_ROOT.length + 1).split("/")[0];

  if (!AGGREGATOR_PACKAGE.test(pkg)) return null;

  const src = resolve(PACKAGES_ROOT, pkg, "src");

  return absPath.startsWith(`${src}/`) ? src : null;
}

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

const moduleRootCache = new Map();

function moduleRootOf(absPath) {
  if (!absPath.startsWith(`${PACKAGES_ROOT}/`)) return null;

  const rest = absPath.slice(PACKAGES_ROOT.length + 1);
  const slash = rest.indexOf("/");

  if (slash === -1) return null;

  const pkg = rest.slice(0, slash);
  const cached = moduleRootCache.get(pkg);

  if (cached !== undefined) return cached;

  // modules-foundation has no `src/modules` folder: it is split by feature
  // directly under `src`, and each feature folder is one module.
  const root = resolve(
    PACKAGES_ROOT,
    pkg,
    pkg === "modules-foundation" ? "src" : "src/modules"
  );
  const found = existsSync(root) && statSync(root).isDirectory() ? root : null;

  moduleRootCache.set(pkg, found);

  return found;
}

/** The module directory (immediate child of modules/) that a file lives in. */
function moduleDirOf(absPath) {
  const root = moduleRootOf(absPath);

  if (!root || !absPath.startsWith(`${root}/`)) return null;

  const rest = absPath.slice(root.length + 1);
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
            "Disallow importing an @internal-marked module file from a different module in the same package."
        },
        schema: []
      },
      create(context) {
        const importerFile = context.filename ?? context.getFilename();
        const importerRoot = moduleRootOf(importerFile);

        if (!importerRoot || !importerFile.startsWith(`${importerRoot}/`))
          return {};

        const importerModule = moduleDirOf(importerFile);

        return {
          ImportDeclaration(node) {
            const specifier = node.source.value;

            if (typeof specifier !== "string") return;
            if (!specifier.startsWith(".")) return;

            const target = resolveRelativeTarget(importerFile, specifier);

            if (!target) return;
            if (moduleRootOf(target) !== importerRoot) return;
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

        const srcRoot = aggregatorSrcOf(importerFile);

        if (!srcRoot) return {};

        const packageBarrel = resolve(srcRoot, "index.ts");
        const barrels = new Set([packageBarrel]);

        if (srcRoot === HEADLESS_SRC) barrels.add(MODULES_BARREL);
        // The barrels themselves legitimately re-export the layers below them.
        if (barrels.has(importerFile)) return {};

        function check(node) {
          const specifier = node.source?.value;
          if (typeof specifier !== "string" || !specifier.startsWith("."))
            return;

          const target = resolveRelativeTarget(importerFile, specifier);
          if (!target || !barrels.has(target)) return;

          const which =
            target === packageBarrel ? "package-root" : "modules-root";
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
  // We never suppress a type error — a real fix or a proper type, never
  // `@ts-expect-error`. The only exemption (type-negative-control specs, where
  // it IS the assertion) is scoped by file glob below.
  "@typescript-eslint/ban-ts-comment": [
    "error",
    { "ts-expect-error": true, "ts-ignore": false, "ts-nocheck": false }
  ],
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
  "vue/no-v-html": "off", // replaced by ui/v-html-sanitised (decision 13): v-html only through a sanitiser call
  "vue/no-v-text-v-html-on-component": "off", // web-component wrappers legitimately receive v-html
  "vue/no-v-model-argument": "off", // Vue-2-era guard; irrelevant under Vue 3
  // vue/component-api-style is deliberately OFF (left unset): the codebase mixes
  // <script setup>, composition, and options API by design (web-component
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
        regex: "^@upmind-automation/(headless|upmind-ui|i18n)/",
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
    "|^@upmind-automation/(?:headless|upmind-ui|i18n)(?:/.*)?$"
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
//           "./scenarios", "./fixtures" and "./testing" (its `exports` map),
//           of which "./fixtures" — recordings only, no harness — is open to
//           every position (FE-3113), scenario-harness
//           exactly ".". The map alone does NOT gate the playgrounds — a
//           vite/vitest alias to the package DIRECTORY resolves ahead of
//           `exports`, so a subpath keeps resolving there no matter what the map
//           says. This arm is the gate for that lane. "./testing" is the ONE
//           entry OTHER packages' test lanes reach — and, since the FE-2977 seam
//           ruling, one named app-runtime file — so block 8h re-arms that bare
//           entry on exactly the files it lists and 8g keeps it banned
//           everywhere else. Anything BELOW it is an error from every position,
//           test lanes included: the package publishes no "./testing/*", so a
//           per-module specifier only ever resolved through a directory alias.
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
 * @param testLane Whether headless's `./testing` export — its published
 *   test-kit entry, kept off the main barrel so it never enters the
 *   production graph — is reachable from these files. Test lanes only.
 *
 *   `./fixtures` is NOT gated by it: that entry publishes the recorded bodies
 *   and nothing else (FE-3113), so a recording carries no module boot and no
 *   runner registration into whatever graph names it. The harness half stays
 *   behind `./testing`'s single named seam, unchanged.
 */
const noWorkspaceSubpathImportsRule = testLane => [
  "error",
  {
    patterns: [
      {
        regex: `^@upmind-automation/headless/(?!scenarios$|fixtures$|features$|package\\.json$${testLane ? "|testing$" : ""})`,
        message: `${PACKAGE_BOUNDARY_MESSAGE} headless publishes ".", "./fixtures", "./features" and "./testing" — no subpaths below them ("./testing" is the test lanes' plus the one app-runtime seam block 8h names).`
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

// -----------------------------------------------------------------------------
// Package-graph enforcement — `import/no-cycle` + `import/no-internal-modules`.
//
// The node resolver knows .js/.json only; without these extensions both rules pass vacuously.
// -----------------------------------------------------------------------------
const IMPORT_RESOLVE_EXTENSIONS = [
  ".js",
  ".mjs",
  ".cjs",
  ".jsx",
  ".ts",
  ".mts",
  ".cts",
  ".tsx",
  ".vue"
];

const importGraphSettings = {
  "import/resolver": { node: { extensions: IMPORT_RESOLVE_EXTENSIONS } },
  "import/extensions": IMPORT_RESOLVE_EXTENSIONS,
  "import/parsers": {
    "@typescript-eslint/parser": [".ts", ".tsx", ".mts"],
    "vue-eslint-parser": [".vue"]
  }
};

const SCOPE = "@upmind-automation/";

const DOMAIN_PACKAGES = [
  { dir: "modules-auth", name: "@upmind-automation/auth" },
  { dir: "modules-basket", name: "@upmind-automation/basket" },
  { dir: "modules-catalogue", name: "@upmind-automation/catalogue" },
  { dir: "modules-client", name: "@upmind-automation/client" },
  { dir: "modules-domain", name: "@upmind-automation/domain" },
  { dir: "modules-foundation", name: "@upmind-automation/foundation" },
  { dir: "modules-invoice", name: "@upmind-automation/invoice" },
  { dir: "modules-payment", name: "@upmind-automation/payment" },
  { dir: "modules-product", name: "@upmind-automation/product" },
  { dir: "modules-recommendations", name: "@upmind-automation/recommendations" }
];

const DOMAIN_PACKAGE_FILES = DOMAIN_PACKAGES.map(
  p => `packages/${p.dir}/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}`
);

const DOMAIN_PACKAGE_INTERNALS = `${SCOPE}{${DOMAIN_PACKAGES.map(p =>
  p.name.slice(SCOPE.length)
).join(",")}}/**`;

export default [
  // ---------------------------------------------------------------------------
  // 1. Global ignores
  // ---------------------------------------------------------------------------
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/storybook-static/**",
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
      "**/.features-gen/**"
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
      "packages/eslint-plugin-endpoint-ownership/**/*.{js,mjs}",
      "packages/eslint-plugin-async-discipline/**/*.{js,mjs}",
      "packages/eslint-plugin-code-quality/**/*.{js,mjs}",
      "packages/eslint-plugin-tests/**/*.{js,mjs}",
      "packages/eslint-plugin-file-responsibility/**/*.{js,mjs}",
      "packages/eslint-plugin-ui/**/*.{js,mjs}",
      "packages/eslint-plugin-xstate/**/*.{js,mjs}",
      "packages/eslint-plugin-security/**/*.{js,mjs}",
      "docs/corpus/**/*.{js,mjs}",
      "packages/*/scripts/**/*.{ts,mts,cts,js,cjs,mjs}"
    ],
    languageOptions: {
      globals: { ...globals.node }
    }
  },

  // ---------------------------------------------------------------------------
  // 5. Runtime globals — Nuxt apps (cart-nuxt + portal-nuxt + labs-nuxt):
  //    browser + node + Nuxt auto-imports.
  // ---------------------------------------------------------------------------
  {
    files: [
      "apps/cart-nuxt/**/*.{ts,tsx,mts,cts,js,cjs,mjs,vue}",
      "apps/portal-nuxt/**/*.{ts,tsx,mts,cts,js,cjs,mjs,vue}",
      "playgrounds/labs-nuxt/**/*.{ts,tsx,mts,cts,js,cjs,mjs,vue}"
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...nuxtAutoImportGlobals }
    }
  },

  // ---------------------------------------------------------------------------
  // 5b. portal-nuxt's MOCK FACADES keep headless as a TYPES-ONLY dependency.
  //     (docs/plans/portal-mock-composable-facades.md R3)
  // ---------------------------------------------------------------------------
  {
    files: ["apps/portal-nuxt/app/portal/mock/**/*.{ts,tsx,mts,cts,vue}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@upmind-automation/headless",
              allowTypeImports: true,
              message:
                "portal-nuxt's mock facades consume headless as types only — a value import there serves a mock from the real barrel, which is the coupling they exist to avoid."
            }
          ]
        }
      ]
    }
  },

  // ---------------------------------------------------------------------------
  // 6. TypeScript files — project conventions on top of the baselines
  // ---------------------------------------------------------------------------
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        parser: typescriptParser
      }
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
  // 8. @internal barrier — custom marker-based rule, per-package resolver.
  //    A file is internal iff its head carries `@internal`; importing it from a
  //    different module directory is an error. Same-module wiring is allowed.
  //    Replaces the coarse suffix-glob no-restricted-imports (FE-2820 ruling §3).
  // ---------------------------------------------------------------------------
  {
    files: [
      "packages/*/src/modules/**/*.{ts,tsx,mts,cts,vue}",
      "packages/modules-foundation/src/**/*.{ts,tsx,mts,cts,vue}"
    ],
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
    files: [
      "packages/headless/src/**/*.{ts,tsx,mts,cts,vue}",
      "packages/client-vue/src/**/*.{ts,tsx,mts,cts,vue}",
      "packages/modules-*/src/**/*.{ts,tsx,mts,cts,vue}"
    ],
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
      "scope-based/arm-in-matrix": "error",
      "scope-based/no-private-instance-axis": "error",
      "scope-based/no-self-context": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 8e. Integration-test fixture provenance — the AST re-home of the retired
  //     regex scanner `tests/fixtures/lint-int-test-provenance.mjs`. A journey
  //     body fed to `HttpResponse.json(...)` must replay a recorded fixture
  //     (getFixtureBody/getFixture), never a hand-rolled local builder.
  // ---------------------------------------------------------------------------
  {
    files: [
      "**/*.test.ts",
      "**/__tests__/**/*.ts",
      "tests/journeys/**/*.{ts,mts}"
    ],
    plugins: {
      "scope-based": scopeBasedPlugin
    },
    rules: {
      "scope-based/no-hand-rolled-int-fixture": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 8e2. Test rules (`tests` plugin; code-tests, code-tests-e2e). The frozen
  //     `tests/Playwright/**` suite is ignored globally (D4). The e2e rules run
  //     over the journeys, `tests/journeys/**`, which hold the Playwright e2e
  //     specs and the integration tests. The test-id attribute is read from
  //     `testIdAttribute` in `playwright.config.ts` (G7).
  // ---------------------------------------------------------------------------
  {
    files: ["**/*.test.{ts,tsx,mts,cts}", "**/*.spec.{ts,tsx,mts,cts}"],
    plugins: { tests: testsPlugin },
    rules: {
      "tests/no-type-shape-assert": "error",
      "tests/no-bare-called": "error",
      "tests/no-fixed-wait": "error",
      "tests/file-header": "error",
      "tests/e2e-no-own-http": "error"
    }
  },
  {
    files: ["**/*.test.{ts,tsx,mts,cts}"],
    plugins: { tests: testsPlugin },
    rules: {
      "tests/file-name": "error"
    }
  },
  {
    files: ["packages/headless/src/modules/**/*.int.test.ts"],
    plugins: { tests: testsPlugin },
    rules: {
      "tests/one-replay-int-test": "error"
    }
  },
  // ADR 035: a module's tests answer every request from a recording served
  // verbatim; its recorder is the shared Generator with tokens from `auth`.
  // `auth`, `session-store` and `query` own token and transport behaviour, so
  // their recorders log in by design.
  {
    files: ["packages/headless/src/modules/**/__tests__/**/*.ts"],
    ignores: [
      "packages/headless/src/modules/auth/**",
      "packages/headless/src/modules/session-store/**",
      "packages/headless/src/modules/query/**"
    ],
    plugins: { tests: testsPlugin },
    rules: {
      "tests/int-replay-only": "error"
    }
  },
  {
    files: ["packages/headless/src/modules/*/__tests__/*.fixtures.ts"],
    ignores: [
      "packages/headless/src/modules/auth/**",
      "packages/headless/src/modules/session-store/**",
      "packages/headless/src/modules/query/**"
    ],
    plugins: { tests: testsPlugin },
    rules: {
      "tests/fixtures-shared-recorder": "error"
    }
  },
  {
    files: ["tests/journeys/**/*.{ts,mts}"],
    plugins: { tests: testsPlugin },
    rules: {
      "tests/e2e-test-id-locators-only": "error",
      "tests/e2e-no-text-assert": "error",
      "tests/e2e-test-id-attribute": "error",
      "tests/e2e-no-own-http": "error",
      "tests/e2e-no-external-goto": "error",
      "tests/e2e-no-spec-retries": "error",
      "tests/e2e-serial-needs-reason": "error",
      "tests/e2e-unroute-cleanup": "error",
      "tests/e2e-no-journey-mock": "error"
    }
  },
  {
    files: ["tests/journeys/**/*.spec.{ts,mts}"],
    plugins: { tests: testsPlugin },
    rules: {
      "tests/e2e-spec-file-kebab": "error",
      "tests/e2e-no-inline-helpers": "error"
    }
  },
  {
    files: ["playwright.config.ts", "playwright.*.config.ts"],
    plugins: { tests: testsPlugin },
    rules: {
      "tests/e2e-no-spec-retries": "error"
    }
  },
  {
    files: ["**/*.vue"],
    plugins: { tests: testsPlugin, ui: uiPlugin },
    rules: {
      "tests/e2e-test-id-attribute": "error",
      "ui/no-label-derived-test-id": "error",
      "ui/single-object-v-bind": "error"
    }
  },
  {
    files: [
      "apps/*/src/**/*.{ts,tsx,mts,vue}",
      "apps/*/app/**/*.{ts,tsx,mts,vue}",
      "packages/*/src/**/*.{ts,tsx,mts,vue}",
      "design-system/packages/ui/src/**/*.{ts,tsx,mts,vue}"
    ],
    ignores: [
      "**/__tests__/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/eslint-plugin-*/**"
    ],
    plugins: { tests: testsPlugin },
    rules: {
      "tests/test-attrs-only-divergence": "error"
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
  // 8h. The named-reach lane of 8g. headless's ONE "./testing" entry is
  //    reachable from exactly these files — another package's specs reaching
  //    its module kits, its replay setup and its recorded fixtures through it,
  //    plus the ONE app-runtime seam the operator ruled in on 2026-08-12
  //    (FE-2977 `ESC6`, route (a)): a playground whose whole subject is the
  //    recorded scenarios has access to them by implication of the approved
  //    concept. So the boundary reads "app runtime reaches recorded artefacts
  //    through exactly one named seam" rather than "never" — every other app
  //    file imports that seam, and 8g still bans the entry everywhere else, so
  //    no second door can open. A per-module subpath below the entry is banned
  //    HERE too: this lane re-arms `./testing`, never `./testing/*`, which the
  //    package does not publish. Flat config REPLACES `no-restricted-imports`,
  //    so this restates the whole rule rather than adding to it; arm 2 (the
  //    relative-escape rule) is untouched and still forbids reaching the same
  //    files by path.
  // ---------------------------------------------------------------------------
  {
    files: [
      "**/__tests__/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}",
      "**/*.{test,spec}.{ts,tsx,mts,cts,js,jsx,mjs,cjs}",
      "playgrounds/*/tests/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}",
      // The scenario framework's own test kit — the shared helpers every spec
      // above imports. Same named-reach lane as `tests/**`, just the home they
      // moved to when the framework absorbed them; neither is a spec itself, so
      // the two globs above never match them.
      "playgrounds/*/modules/scenarios/testing/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}",
      "playgrounds/labs-nuxt/modules/scenarios/runtime/force/corpus.source.ts",
      "tests/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}"
    ],
    ignores: ["packages/scenario-harness/**"],
    rules: {
      "no-restricted-imports": noWorkspaceSubpathImportsRule(true)
    }
  },

  // ---------------------------------------------------------------------------
  // 8i. No deep reach INTO a domain package.
  // ---------------------------------------------------------------------------
  {
    files: [
      "apps/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}",
      "packages/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}",
      "playgrounds/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}",
      "tests/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,vue}"
    ],
    plugins: { import: eslintPluginImport },
    settings: importGraphSettings,
    rules: {
      "import/no-internal-modules": [
        "error",
        { forbid: [DOMAIN_PACKAGE_INTERNALS] }
      ]
    }
  },

  // ---------------------------------------------------------------------------
  // 8j. No import cycles in the domain packages.
  // ---------------------------------------------------------------------------
  {
    files: DOMAIN_PACKAGE_FILES,
    plugins: { import: eslintPluginImport },
    settings: importGraphSettings,
    rules: {
      "import/no-cycle": ["error", { maxDepth: Infinity }]
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
  // 10. The Upmind.vue shells — two-script-block SFCs whose plain options block
  //    (inheritAttrs/customOptions — inexpressible in <script setup>) precedes
  //    the setup block. vue-eslint-parser reads both blocks as one program, so
  //    import/first ("imports before code") is structurally unsatisfiable here.
  //    import/order still applies. Do NOT let any fixer "solve" this by moving
  //    statements across blocks (FE-2820 incident, 2026-06-11) — sweep.mjs
  //    refuses to write fixes to multi-block SFCs for the same reason.
  // ---------------------------------------------------------------------------
  {
    files: ["apps/cart/src/shell/Upmind.vue"],
    rules: { "import/first": "off" }
  },

  // ---------------------------------------------------------------------------
  // 11a. The new ui library deliberately exports shadcn-style component names
  //     (Dialog, Select, …); registering them in SFCs and tests is the API.
  // ---------------------------------------------------------------------------
  {
    files: ["design-system/packages/ui/**"],
    rules: { "vue/no-reserved-component-names": "off" }
  },

  // ---------------------------------------------------------------------------
  // 11b. `@ts-expect-error` stays legal ONLY where it IS the assertion:
  //      type-negative-control specs run under `tsc` to prove that bad code
  //      fails to compile. The design system is a separate library.
  // ---------------------------------------------------------------------------
  {
    files: [
      "**/*.no-test.ts",
      "**/*.types.test.ts",
      "**/*.typecheck.ts",
      "design-system/**"
    ],
    rules: { "@typescript-eslint/ban-ts-comment": "off" }
  },

  // ---------------------------------------------------------------------------
  // 12a. Composed-component laws (FE-3247) — the ui plugin over the composed
  //     components. Each rule is one former code-ui.companion CC law; the prose
  //     is retired to a lint. A genuine exception is silenced in place with
  //     `// eslint-disable-next-line ui/<rule> -- <why>`. The vendored
  //     src/form/** subtree is never in scope.
  //
  //     ALL-COMPONENT rules — the SFC hygiene laws that bind a composed MAIN
  //     and its parts alike (types-in-types.ts, slot declarations, template
  //     conditions, test-attr key discipline, class placement, lodash ban).
  // ---------------------------------------------------------------------------
  {
    files: ["design-system/packages/ui/src/components/**/*.vue"],
    plugins: { ui: uiPlugin },
    rules: {
      "ui/folder-grammar": "error",
      "ui/no-inline-sfc-types": "error",
      "ui/test-attrs-key": "error",
      "ui/test-attrs-in-template": "error",
      "ui/simple-template-conditions": "error",
      "ui/no-direct-slots-access": "error",
      "ui/no-v-for-index-key": "error",
      "ui/slot-return-vnode": "error",
      "ui/class-strings-placement": "error",
      "ui/named-clauses-single-expression": "error",
      "ui/no-lodash-in-components": "error",
      // Blunt by nature (operator ruling 2026-09-17: everything to error).
      // no-english-default cannot tell a variant token (`size: "md"`) from
      // rendered copy; controlled-boolean-undefined cannot tell a genuine
      // `false` default from a controlled fall-through. Existing hits are
      // banked; narrowing is tracked for the burn-down (see the FE-3247
      // follow-up). A false positive is silenced in place with the waiver.
      "ui/no-english-default": "error",
      "ui/controlled-boolean-undefined": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 12b. MAIN-ONLY rules — laws that bind the composed MAIN (the folder-root
  //     `<Name>.vue`) but NOT the parts under `parts/`. A part is a reka
  //     primitive wrapper: it legitimately calls `cn()`, forwards `asChild`,
  //     and names itself. Applying these to parts is a false positive, so the
  //     `parts/` glob is ignored here.
  // ---------------------------------------------------------------------------
  {
    files: ["design-system/packages/ui/src/components/**/*.vue"],
    ignores: ["design-system/packages/ui/src/components/**/parts/**"],
    plugins: { ui: uiPlugin },
    rules: {
      "ui/no-cva-in-composed": "error",
      "ui/no-as-child-prop": "error",
      "ui/define-options-name": "error",
      "ui/require-accessible-name": "error",
      "ui/require-empty-state": "error",
      "ui/require-story-and-registry": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 12c. The lodash carve-out also covers the folder's `.ts` helpers
  //     (variants.ts, types.ts, context.ts). The cva ban does NOT extend to
  //     `.ts`: `variants.ts` is the sanctioned home of `cva` (CC26), so
  //     `no-cva-in-composed` binds the composed MAIN `.vue` only, above.
  // ---------------------------------------------------------------------------
  {
    files: ["design-system/packages/ui/src/components/**/*.{ts,mts,cts}"],
    ignores: ["**/*.test.*", "**/*.spec.*"],
    plugins: { ui: uiPlugin },
    rules: { "ui/no-lodash-in-components": "error" }
  },

  // ---------------------------------------------------------------------------
  // 12c. CC-C — consumers never hand-assemble from a composed folder's parts/.
  //     Runs over app/package consumer code, NOT the ui components themselves
  //     (the rule's own guard skips files under src/components/).
  // ---------------------------------------------------------------------------
  {
    files: ["apps/**/*.{ts,tsx,vue}", "packages/**/*.{ts,tsx,vue}"],
    ignores: ["**/eslint-plugin-*/**", "**/*.test.*", "**/*.spec.*"],
    plugins: { ui: uiPlugin },
    rules: { "ui/no-parts-import": "error" }
  },

  // ---------------------------------------------------------------------------
  // 13. File-responsibility (FE-3249) — each module concern lives in its named
  //     file. Retires the code-typescript / code-services companion prose to
  //     lint. Every exception is structural (the machine-service signature), so
  //     no rule needs an eslint-disable. Over the headless modules; each rule
  //     self-filters by filename, so one glob suffices.
  // ---------------------------------------------------------------------------
  {
    files: ["packages/headless/src/modules/**/*.{ts,tsx,mts,cts}"],
    ignores: [
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.no-test.ts",
      "**/__tests__/**",
      "**/*.fixtures.ts"
    ],
    plugins: { "file-responsibility": fileResponsibilityPlugin },
    rules: {
      "file-responsibility/query-only-in-services": "error",
      "file-responsibility/services-purity": "error",
      "file-responsibility/types-in-types-file": "error",
      "file-responsibility/no-type-reexport": "error",
      "file-responsibility/schemas-in-schema-file": "error",
      "file-responsibility/mappers-in-mapper-file": "error",
      // FE-3249 #7 — `type`, not `interface`. Custom rule (not the built-in):
      // it exempts an interface used for declaration merging inside a
      // `declare global` / `declare module` block, where `type` is illegal.
      "file-responsibility/consistent-type-definitions": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 11. endpoint-ownership — a brand-owned or system-owned endpoint is loaded
  //     once by the `brand` / `system` module; every other module reads it
  //     through useBrand()/useSystem(), never by re-requesting the URL. The rule
  //     self-exempts the owning modules and session-transfer's brand/settings
  //     carve-out; the globs scope it to the request-making surface, minus
  //     tests and fixtures.
  // ---------------------------------------------------------------------------
  {
    files: [
      "packages/headless/src/modules/**/*.{ts,tsx,mts,cts,vue}",
      "packages/client-vue/src/**/*.{ts,tsx,mts,cts,vue}",
      "packages/modules-*/src/**/*.{ts,tsx,mts,cts,vue}",
      "apps/**/*.{ts,tsx,mts,cts,vue}",
      "playgrounds/**/*.{ts,tsx,mts,cts,vue}"
    ],
    ignores: [
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.no-test.ts",
      "**/__tests__/**",
      "**/*.fixtures.ts"
    ],
    plugins: { "endpoint-ownership": endpointOwnershipPlugin },
    rules: {
      "endpoint-ownership/owned-endpoint-boundary": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 11b. no-direct-tanstack-query — TanStack Query entry points are reached only
  //     through the internal useQuery wrapper in the query module. A value
  //     import of one from @tanstack/vue-query or @tanstack/query-core outside
  //     that module forks the boundary. The rule self-exempts the query module;
  //     the globs scope it to source, minus tests, fixtures and the test
  //     harness (packages/headless/src/testing).
  // ---------------------------------------------------------------------------
  {
    files: [
      "packages/headless/src/**/*.{ts,tsx,mts,cts,vue}",
      "packages/client-vue/src/**/*.{ts,tsx,mts,cts,vue}",
      "packages/modules-*/src/**/*.{ts,tsx,mts,cts,vue}",
      "apps/**/*.{ts,tsx,mts,cts,vue}",
      "playgrounds/**/*.{ts,tsx,mts,cts,vue}"
    ],
    ignores: [
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.no-test.ts",
      "**/__tests__/**",
      "**/*.fixtures.ts",
      "packages/headless/src/testing/**"
    ],
    plugins: { "endpoint-ownership": endpointOwnershipPlugin },
    rules: {
      "endpoint-ownership/no-direct-tanstack-query": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 11c. async-discipline — the house async hygiene preset. Covers ALL code,
  //     tests and fixtures included.
  // ---------------------------------------------------------------------------
  {
    files: ["**/*.{ts,tsx,mts,cts,js,mjs,cjs,vue}"],
    plugins: { "async-discipline": asyncDisciplinePlugin },
    rules: {
      "async-discipline/no-promise-try-catch": "error",
      "async-discipline/no-await-only-return": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 14. ts-quality — the type-system and hygiene principles of code-typescript
  //     and code-quality that a lint decides. Over `packages/**` and `apps/**`,
  //     minus tests, fixtures and the local lint plugins. Existing violations
  //     are held in the bulk-suppressions ledger (see the SUPPRESSION LEDGER
  //     note above). Principles that need type information (no-floating-promises,
  //     return-await, no-unsafe-enum-comparison, collection calls on arrays) are
  //     not here: the repo has no typed linting.
  // ---------------------------------------------------------------------------
  {
    files: ["packages/**/*.{ts,tsx,mts,cts}", "apps/**/*.{ts,tsx,mts,cts}"],
    ignores: [
      "**/eslint-plugin-*/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.no-test.ts",
      "**/__tests__/**",
      "**/*.fixtures.ts",
      "**/*.d.ts"
    ],
    plugins: { "code-quality": codeQualityPlugin },
    rules: {
      // A value set is an enum; an immutable literal is `as const`.
      "code-quality/no-literal-union-type": "error",
      "code-quality/require-as-const": "error",
      // Every function states its parameter and return types.
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowTypedFunctionExpressions: true }
      ],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      // File layout: import block, separator after it, header block, sections.
      "code-quality/no-comment-in-imports": "error",
      "code-quality/import-separator": "error",
      "code-quality/file-header": "error",
      "code-quality/section-separators": "error"
    }
  },
  {
    files: [
      "packages/**/*.{ts,tsx,mts,cts,vue}",
      "apps/**/*.{ts,tsx,mts,cts,vue}"
    ],
    ignores: [
      "**/eslint-plugin-*/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.no-test.ts",
      "**/__tests__/**",
      "**/*.fixtures.ts",
      "**/*.d.ts"
    ],
    plugins: { "code-quality": codeQualityPlugin },
    rules: {
      "code-quality/no-cast-chain": "error",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "as", objectLiteralTypeAssertions: "never" }
      ],
      "code-quality/no-literal-error-message": "error",
      "code-quality/no-lodash-get-state": "error",
      "code-quality/no-chained-array-passes": "error",
      // No technical debt markers; a comment states the present, not the
      // history. The tracker id pattern is this repo's Linear team key.
      "no-warning-comments": [
        "error",
        { terms: ["todo", "fixme", "xxx", "hack"], location: "anywhere" }
      ],
      "code-quality/no-history-comments": [
        "error",
        { trackerIdPattern: "\\bFE-\\d+\\b" }
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow"
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow"
        },
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "enumMember", format: ["UPPER_CASE"] }
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "BinaryExpression[operator=/^[!=]==?$/][left.type='UnaryExpression'][left.operator='typeof'][right.type='Literal']",
          message:
            "Use the collection utility's type guard (for example lodash `isString`), not `typeof`. Where TypeScript narrowing needs `typeof`, disable this line with a reason."
        },
        {
          selector:
            "BinaryExpression[operator=/^[!=]==?$/][right.type='UnaryExpression'][right.operator='typeof'][left.type='Literal']",
          message:
            "Use the collection utility's type guard (for example lodash `isString`), not `typeof`. Where TypeScript narrowing needs `typeof`, disable this line with a reason."
        },
        {
          selector:
            "BinaryExpression[operator=/^[!=]==$/][right.type='Literal'][right.raw=/^(true|false)$/]",
          message: "Use `!!x` or `!x`, not a comparison with a boolean literal."
        },
        {
          selector:
            "BinaryExpression[operator=/^[!=]==$/][left.type='Literal'][left.raw=/^(true|false)$/]",
          message: "Use `!!x` or `!x`, not a comparison with a boolean literal."
        }
      ]
    }
  },
  {
    // Every user-facing string comes from a translation key. The `.vue` half
    // uses vue/no-bare-strings-in-template (the vue-i18n plugin is not
    // installed); the `.ts` half is code-quality/no-literal-error-message.
    files: ["packages/**/*.vue", "apps/**/*.vue"],
    ignores: [
      "**/eslint-plugin-*/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/__tests__/**"
    ],
    rules: { "vue/no-bare-strings-in-template": "error" }
  },
  {
    // Type definitions: `type`, not `interface` — widened from the headless
    // modules to every package and app. A types file per module (decision 12).
    files: [
      "packages/**/*.{ts,tsx,mts,cts,vue}",
      "apps/**/*.{ts,tsx,mts,cts,vue}"
    ],
    ignores: [
      "**/eslint-plugin-*/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/__tests__/**"
    ],
    plugins: { "file-responsibility": fileResponsibilityPlugin },
    rules: { "file-responsibility/consistent-type-definitions": "error" }
  },
  {
    files: [
      "packages/modules-*/src/**/*.{ts,tsx,mts,cts}",
      "packages/client-vue/src/**/*.{ts,tsx,mts,cts}"
    ],
    ignores: [
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.no-test.ts",
      "**/__tests__/**",
      "**/*.fixtures.ts"
    ],
    plugins: { "file-responsibility": fileResponsibilityPlugin },
    rules: {
      "file-responsibility/types-in-types-file": "error",
      "file-responsibility/no-type-reexport": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 15. modules — where code lives in a headless module and how a composable is
  //     shaped (code-modules, code-services, code-composables). Each rule
  //     self-gates by file name. Existing violations are held in the
  //     bulk-suppressions ledger.
  // ---------------------------------------------------------------------------
  {
    files: ["packages/headless/src/modules/**/*.{ts,tsx,mts,cts}"],
    ignores: [
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.no-test.ts",
      "**/__tests__/**",
      "**/*.fixtures.ts",
      "**/*.d.ts"
    ],
    plugins: {
      "file-responsibility": fileResponsibilityPlugin,
      "scope-based": scopeBasedPlugin
    },
    rules: {
      "file-responsibility/barrel-only-reexports": "error",
      "file-responsibility/barrel-curated-exports": "error",
      "file-responsibility/no-fn-in-types-file": "error",
      "file-responsibility/no-state-outside-layers": "error",
      "file-responsibility/no-promise-wrap": "error",
      // The internal-file set of the module visibility law.
      "file-responsibility/internal-file-marker": [
        "error",
        {
          patterns: [
            "\\.(machine|services|mappers|schemas)(\\.[A-Za-z0-9-]+)*\\.ts$",
            "(^|/)session-store\\.[^/]*$"
          ]
        }
      ],
      "file-responsibility/no-own-barrel-import": "error",
      "scope-based/no-local-state": "error",
      "scope-based/no-services-in-read-layers": "error",
      "scope-based/machine-service-event-data": "error",
      "scope-based/services-factory-fns": "error",
      "scope-based/return-order": "error",
      "scope-based/no-inline-return-values": "error",
      "scope-based/export-return-type": "error",
      "scope-based/pagination-shape": "error",
      "scope-based/no-meta-object": "error",
      // Decision 4: the flag prefixes are reviewed here, one line at a time.
      "scope-based/meta-flag-name": [
        "error",
        { prefixes: ["is", "has", "can", "show"] }
      ],
      "scope-based/is-ready-contract": "error",
      "scope-based/on-done-unsubscribes": "error",
      "scope-based/file-names": "error",
      "scope-based/query-client-inside": "error",
      "scope-based/destroy-removes-key": "error",
      "scope-based/state-paths-resolve": "error",
      "scope-based/scope-naming": "error",
      "scope-based/scoped-factory": "error",
      "scope-based/no-local-query-type": "error"
    }
  },
  {
    // S6 (`.ts` half; the `.vue` half is vue/no-side-effects-in-computed-properties,
    // in vue/essential): a computed getter assigns nothing and calls nothing
    // for its effect.
    files: ["packages/**/*.{ts,tsx,mts,cts}", "apps/**/*.{ts,tsx,mts,cts}"],
    ignores: [
      "**/eslint-plugin-*/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/__tests__/**",
      "**/*.d.ts"
    ],
    plugins: { "scope-based": scopeBasedPlugin },
    rules: { "scope-based/no-computed-effects": "error" }
  },

  // ---------------------------------------------------------------------------
  // 11d. xstate — the machine conventions (code-xstate). Each rule self-gates on
  //     an `xstate` import, so one glob over source suffices. The (v5) rules read
  //     the installed `xstate` major (4.38 here) and stay silent below 5.
  // ---------------------------------------------------------------------------
  {
    files: ["apps/**/*.{ts,tsx,mts,cts}", "packages/**/*.{ts,tsx,mts,cts}"],
    ignores: [
      "**/eslint-plugin-*/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.no-test.ts",
      "**/__tests__/**",
      "**/*.fixtures.ts"
    ],
    plugins: { xstate: xstatePlugin },
    rules: {
      "xstate/guard-prefix": ["error", { prefixes: ["is", "has", "can"] }],
      "xstate/event-case": "error",
      "xstate/machine-file-name": "error",
      "xstate/typed-context": "error",
      "xstate/use-actor-param": "error",
      "xstate/bind-subscribe": "error",
      "xstate/machine-factory": "error",
      "xstate/setup-first": "error",
      "xstate/named-guards": "error",
      "xstate/no-v4-keys": "error",
      "xstate/actor-stubs": "error"
    }
  },
  // Canonical state reads: machine files read state freely; everything else goes
  // through `stateMatches` / `useContext` / `contextValue` (the state utility file
  // itself and the headless test harness are the implementation of those reads).
  {
    files: [
      "packages/headless/src/**/*.{ts,tsx,mts,cts,vue}",
      "packages/client-vue/src/**/*.{ts,tsx,mts,cts,vue}",
      "packages/modules-*/src/**/*.{ts,tsx,mts,cts,vue}",
      "apps/**/*.{ts,tsx,mts,cts,vue}",
      "playgrounds/**/*.{ts,tsx,mts,cts,vue}"
    ],
    ignores: [
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.no-test.ts",
      "**/__tests__/**",
      "**/*.fixtures.ts",
      "packages/headless/src/utils/useState.ts",
      "packages/headless/src/testing/**"
    ],
    plugins: { xstate: xstatePlugin },
    rules: {
      "xstate/canonical-state-read": [
        "error",
        { utilities: ["stateMatches", "useContext", "contextValue"] }
      ]
    }
  },

  // ---------------------------------------------------------------------------
  // 11e. security — code-security principles a lint decides. Wildcard CORS binds
  //     server files (Nitro `server/`, functions); the merge rule binds all source,
  //     because request input reaches `merge` from handlers and from `route.query`.
  // ---------------------------------------------------------------------------
  {
    files: [
      "**/server/**/*.{ts,mts,cts,js,mjs,cjs}",
      "**/functions/**/*.{ts,mts,cts,js,mjs,cjs}"
    ],
    plugins: { security: securityPlugin },
    rules: { "security/no-wildcard-cors": "error" }
  },
  {
    files: [
      "apps/**/*.{ts,tsx,mts,cts,js,mjs,vue}",
      "packages/**/*.{ts,tsx,mts,cts,js,mjs,vue}"
    ],
    ignores: [
      "**/eslint-plugin-*/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/__tests__/**"
    ],
    plugins: { security: securityPlugin },
    rules: {
      "security/no-merge-untrusted": "error",
      "security/no-dynamic-regexp": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 11f. machines + file layout — where machine parts and module files live.
  // ---------------------------------------------------------------------------
  {
    files: ["packages/headless/src/modules/**/*.{ts,tsx,mts,cts}"],
    ignores: [
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.no-test.ts",
      "**/__tests__/**",
      "**/*.fixtures.ts"
    ],
    plugins: { "file-responsibility": fileResponsibilityPlugin },
    rules: {
      "file-responsibility/machine-sibling-names": "error",
      "file-responsibility/module-prefixed-names": "error"
    }
  },

  // ---------------------------------------------------------------------------
  // 11g. Core security + simplicity rules for all source (code-security,
  //     code-reviews): no eval; short functions; shallow nesting. Existing
  //     violations are held in the bulk-suppressions ledger.
  // ---------------------------------------------------------------------------
  {
    files: ["**/*.{ts,tsx,mts,cts,js,mjs,cjs,vue}"],
    rules: {
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error"
    }
  },
  {
    files: [
      "apps/**/*.{ts,tsx,mts,cts,js,mjs,cjs,vue}",
      "packages/**/*.{ts,tsx,mts,cts,js,mjs,cjs,vue}",
      "playgrounds/**/*.{ts,tsx,mts,cts,js,mjs,cjs,vue}"
    ],
    ignores: [
      "**/eslint-plugin-*/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.no-test.ts",
      "**/__tests__/**",
      "**/*.fixtures.ts"
    ],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: 30, skipBlankLines: true, skipComments: true }
      ],
      "max-depth": ["error", 3]
    }
  },

  // ---------------------------------------------------------------------------
  // 11h. UI — SFC structure and the ui plugin laws (code-ui, decisions 11, 13, 14).
  //     Built-in vue rules plus the ui plugin, over every `.vue`.
  // ---------------------------------------------------------------------------
  {
    files: ["**/*.vue"],
    plugins: { ui: uiPlugin },
    rules: {
      "vue/block-order": ["error", { order: ["template", "script"] }],
      "vue/no-restricted-block": [
        "error",
        {
          element: "style",
          message: "Put classes in the template or in variants.ts."
        }
      ],
      "vue/block-lang": ["error", { script: { lang: "ts" } }],
      "vue/define-props-declaration": ["error", "type-based"],
      "vue/define-emits-declaration": ["error", "type-based"],
      "vue/define-macros-order": [
        "error",
        {
          order: [
            "defineOptions",
            "defineModel",
            "defineProps",
            "defineEmits",
            "defineSlots"
          ]
        }
      ],
      "vue/require-explicit-slots": "error",
      "vue/no-static-inline-styles": "error",
      "ui/no-bound-style": "error",
      "ui/typed-define-model": "error",
      "ui/script-setup-order": "error",
      "ui/multi-root-attrs": "error",
      "ui/item-slot-scope": "error",
      // Decision 13: `vue/no-v-html` stays off; this rule replaces it.
      "ui/v-html-sanitised": [
        "error",
        { sanitisers: ["DOMPurify.sanitize", "sanitizeHtml"] }
      ]
    }
  },
  {
    // `<script setup>` only where the config can hold it: the modules-* packages
    // and the design-system components. The client-vue web-component wrappers
    // stay exempt (FE-2820 §4).
    files: [
      "packages/modules-*/**/*.vue",
      "design-system/packages/ui/src/components/**/*.vue"
    ],
    rules: { "vue/component-api-style": ["error", ["script-setup"]] }
  },
  {
    // Bare copy and `type`-not-`interface` also bind the trees the earlier
    // `packages/**` / `apps/**` blocks do not reach.
    files: ["design-system/packages/ui/src/**/*.vue", "playgrounds/**/*.vue"],
    ignores: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**"],
    rules: { "vue/no-bare-strings-in-template": "error" }
  },
  {
    files: [
      "design-system/packages/ui/src/**/*.{ts,tsx,mts,cts,vue}",
      "playgrounds/**/*.{ts,tsx,mts,cts,vue}"
    ],
    ignores: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**", "**/*.d.ts"],
    plugins: { "file-responsibility": fileResponsibilityPlugin },
    rules: { "file-responsibility/consistent-type-definitions": "error" }
  },
  {
    // Component files are PascalCase. The framework fixes the names of route
    // files (`pages/`, `layouts/`, `app.vue`, `error.vue`).
    files: ["**/*.vue"],
    ignores: [
      "**/pages/**",
      "**/layouts/**",
      "**/app.vue",
      "**/error.vue",
      "**/eslint-plugin-*/**"
    ],
    plugins: { ui: uiPlugin },
    rules: {
      "ui/pascal-case-file-name": "error",
      "vue/match-component-file-name": [
        "error",
        { extensions: ["vue"], shouldMatchCase: true }
      ]
    }
  },
  {
    // Decision 14: the placement laws run on every `.vue` the rule covers.
    files: [
      "packages/modules-*/src/**/*.vue",
      "packages/client-vue/src/**/*.vue",
      "apps/**/*.vue",
      "playgrounds/**/*.vue"
    ],
    ignores: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**"],
    plugins: { ui: uiPlugin },
    rules: { "ui/class-strings-placement": "error" }
  },
  {
    files: ["packages/modules-*/src/**/*.vue"],
    ignores: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**"],
    plugins: { ui: uiPlugin },
    rules: {
      "ui/no-english-default": "error",
      "ui/no-inline-sfc-types": "error",
      "ui/simple-template-conditions": "error",
      "ui/no-v-for-index-key": "error",
      "ui/no-direct-slots-access": "error"
    }
  },
  {
    // Token utilities only. The manifest names the CSS variables a class may read.
    files: [
      "design-system/packages/ui/src/components/**/*.vue",
      "design-system/packages/ui/src/**/variants.ts",
      "packages/modules-*/src/**/*.vue",
      "packages/modules-*/src/**/variants.ts"
    ],
    plugins: { ui: uiPlugin },
    rules: {
      "ui/token-classes": [
        "error",
        { tokensManifest: "design-system/packages/tokens/dist/tokens.json" }
      ]
    }
  },
  {
    files: ["design-system/packages/ui/src/components/*/index.ts"],
    plugins: { ui: uiPlugin },
    rules: { "ui/parts-exported": "error" }
  },
  {
    files: ["packages/modules-*/src/**/*.{ts,tsx,mts,cts,vue}"],
    ignores: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**"],
    plugins: { ui: uiPlugin },
    rules: { "ui/module-anatomy": "error" }
  },
  {
    files: [
      "apps/**/*.schemas.ts",
      "apps/**/*.schemas.*.ts",
      "packages/**/*.schemas.ts",
      "packages/**/*.schemas.*.ts"
    ],
    ignores: ["**/eslint-plugin-*/**", "**/*.test.*", "**/__tests__/**"],
    plugins: { ui: uiPlugin },
    rules: { "ui/uischema-i18n": "error" }
  },
  {
    files: [
      "apps/**/*.{ts,tsx,mts,cts,vue}",
      "packages/**/*.{ts,tsx,mts,cts,vue}",
      "playgrounds/**/*.{ts,tsx,mts,cts,vue}"
    ],
    ignores: ["**/eslint-plugin-*/**"],
    plugins: { ui: uiPlugin },
    rules: { "ui/uischema-spelling": "error" }
  },
  {
    // Nuxt auto-imports the names in `nuxtAutoImportGlobals`; an explicit import
    // of one is redundant.
    files: [
      "apps/*-nuxt/**/*.{ts,tsx,mts,cts,vue}",
      "playgrounds/labs-nuxt/**/*.{ts,tsx,mts,cts,vue}"
    ],
    plugins: { ui: uiPlugin },
    rules: {
      "ui/no-nuxt-auto-import": [
        "error",
        { names: Object.keys(nuxtAutoImportGlobals) }
      ]
    }
  },
  {
    files: [
      "apps/*/src/router/**/*.ts",
      "apps/*/src/router.ts",
      "apps/*/src/routes.ts",
      "apps/*/app/router.options.ts"
    ],
    plugins: { ui: uiPlugin },
    rules: { "ui/lazy-route-component": "error" }
  },
  {
    // `no-underscore-dangle` (decision 11, CC7) in the composed components. The
    // `^_` unused-vars ignore is untouched: a `_name` function parameter stays legal.
    files: ["design-system/packages/ui/src/components/**/*.{ts,vue}"],
    ignores: ["**/*.test.*", "**/*.spec.*"],
    rules: { "no-underscore-dangle": "error" }
  },

  // ---------------------------------------------------------------------------
  // 12. Prettier compatibility — MUST be last. Disables every stylistic rule so
  //    prettier is the sole formatter (330 rule names switched off).
  // ---------------------------------------------------------------------------
  eslintConfigPrettier
];
