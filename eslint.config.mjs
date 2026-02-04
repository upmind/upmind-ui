// @ts-check
import eslintPluginTypescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import eslintPluginVue from "eslint-plugin-vue";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginUnusedImports from "eslint-plugin-unused-imports";
import vueParser from "vue-eslint-parser";

// -----------------------------------------------------------------------------
/**
 * @fileoverview Shared ESLint flat config for the monorepo.
 *
 * Import order enforced:
 * - external (node_modules)
 * - internal (workspace packages)
 * - utils (utility imports)
 * - types (type-only imports, always last and separate)
 */

export default [
  // --- Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.nuxt/**",
      "**/.output/**",
      "**/coverage/**",
      "**/*.d.ts",
      "**/.eslintrc.cjs",
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
      "**/src/presets/**"
    ]
  },

  // --- TypeScript files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": eslintPluginTypescript,
      import: eslintPluginImport,
      prettier: eslintPluginPrettier,
      "unused-imports": eslintPluginUnusedImports
    },
    rules: {
      // --- Prettier
      "prettier/prettier": ["error", { endOfLine: "auto" }],

      // --- Development only
      "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
      "no-constant-condition":
        process.env.NODE_ENV === "production" ? "error" : "off",

      // --- Unused imports and vars
      "unused-imports/no-unused-imports": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],

      // --- TypeScript
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-this-alias": [
        "error",
        {
          allowDestructuring: true,
          allowedNames: ["vm"]
        }
      ],

      // --- CRITICAL: Type imports must be separate (no inline type specifiers)
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
          disallowTypeAnnotations: false
        }
      ],
      // Disallow inline type specifier in mixed imports
      "@typescript-eslint/no-import-type-side-effects": "error",

      // --- Import ordering (matches code-generation.md)
      "import/order": [
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
            // Utils imports - place before types (covers 0-5 levels of ../)
            {
              pattern: "{.,..,../..,../../..,../../../..}/**/util*",
              group: "type",
              position: "before"
            },
            {
              pattern: "lodash-es",
              group: "type",
              position: "before"
            }
          ],
          pathGroupsExcludedImportTypes: ["type"],
          "newlines-between": "never",
          alphabetize: {
            order: "asc",
            caseInsensitive: true
          }
        }
      ],
      "import/newline-after-import": ["error", { count: 1 }],

      // --- Prevent blank lines before section comments in imports
      "lines-around-comment": [
        "error",
        {
          beforeLineComment: false,
          afterLineComment: false,
          allowBlockStart: true,
          allowObjectStart: true,
          allowArrayStart: true,
          allowClassStart: true
        }
      ],

      // --- General
      "no-unsafe-optional-chaining": "off",
      "prefer-promise-reject-errors": "off"
    }
  },

  // --- Vue files
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
      "@typescript-eslint": eslintPluginTypescript,
      vue: eslintPluginVue,
      import: eslintPluginImport,
      prettier: eslintPluginPrettier,
      "unused-imports": eslintPluginUnusedImports
    },
    rules: {
      // --- Prettier
      "prettier/prettier": ["error", { endOfLine: "auto" }],

      // --- Vue
      "vue/component-name-in-template-casing": ["error", "PascalCase"],
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "off",
      "vue/no-v-text-v-html-on-component": "off",
      "vue/no-v-model-argument": "off",

      // --- Unused imports and vars
      "unused-imports/no-unused-imports": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
          disallowTypeAnnotations: false
        }
      ],
      // Disallow inline type specifier in mixed imports
      "@typescript-eslint/no-import-type-side-effects": "error",

      // --- Import ordering
      "import/order": [
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
            // Utils imports - place before types (covers 0-5 levels of ../)
            {
              pattern: "{.,..,../..,../../..,../../../..}/**/util*",
              group: "type",
              position: "before"
            },
            {
              pattern: "lodash-es",
              group: "type",
              position: "before"
            }
          ],
          pathGroupsExcludedImportTypes: ["type"],
          "newlines-between": "never",
          alphabetize: {
            order: "asc",
            caseInsensitive: true
          }
        }
      ]
    }
  },

  // --- JavaScript/CJS files (less strict)
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    plugins: {
      prettier: eslintPluginPrettier
    },
    rules: {
      "prettier/prettier": ["error", { endOfLine: "auto" }]
    }
  },

  // --- Prettier overrides (must be last)
  eslintConfigPrettier
];
