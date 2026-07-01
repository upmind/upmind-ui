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
 *   FULL BYTE-COPY of this file (kept in lockstep via scripts/lint/sync-configs.mjs).
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
 */

import { existsSync, readFileSync } from "node:fs";
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
      "**/.artifacts/**"
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
  //    test fixtures). Covers: scripts/**, .agent/scripts/**, *.config.*,
  //    tests/fixtures/** — all are Node runtime environments.
  // ---------------------------------------------------------------------------
  {
    files: [
      "scripts/**/*.{ts,tsx,mts,cts,js,cjs,mjs}",
      ".agent/scripts/**/*.{ts,tsx,mts,cts,js,cjs,mjs}",
      "**/*.config.{ts,mts,cts,js,cjs,mjs}",
      "tests/fixtures/**/*.{mjs,js,ts}"
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
      }
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
