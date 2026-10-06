/**
 * @fileoverview `ui/no-nuxt-auto-import` — no explicit import of a name Nuxt
 * auto-imports.
 *
 * In a Nuxt app, an import from `vue` or `#imports` of a name in the option
 * `names` fails: Nuxt provides it. Scope the rule to the Nuxt app globs in the
 * config; the config passes the names from `nuxtAutoImportGlobals`. Type-only
 * imports are exempt.
 *
 * Valid:   `import type { Ref } from "vue"`, `import { h } from "vue"` (not auto-imported)
 * Invalid: `import { ref, computed } from "vue"`
 *
 * @module packages/eslint-plugin-ui/rules/no-nuxt-auto-import
 */

const SOURCES = new Set(["vue", "#imports"]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow importing a Nuxt auto-imported name from vue or #imports.",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          names: { type: "array", items: { type: "string" } }
        },
        required: ["names"],
        additionalProperties: false
      }
    ],
    messages: {
      autoImported:
        "`{{name}}` is auto-imported by Nuxt. Remove it from the import."
    }
  },

  create(context) {
    const names = new Set(context.options[0]?.names ?? []);
    return {
      ImportDeclaration(node) {
        if (node.importKind === "type") return;
        if (!SOURCES.has(node.source.value)) return;
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;
          if (specifier.importKind === "type") continue;
          const name = specifier.imported.name ?? specifier.imported.value;
          if (names.has(name)) {
            context.report({
              node: specifier,
              messageId: "autoImported",
              data: { name }
            });
          }
        }
      }
    };
  }
};
