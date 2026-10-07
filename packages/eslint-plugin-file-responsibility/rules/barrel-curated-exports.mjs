/**
 * @fileoverview `file-responsibility/barrel-curated-exports` — a barrel exports
 * the public API by curated named re-exports.
 *
 * In an `index.ts`, flag:
 *  - `export *` from an `@internal` file;
 *  - a default re-export that is not renamed (`export { default } from "./x"`).
 *    Write `export { default as billingMachine } from "./billing.machine"`.
 *
 * @module packages/eslint-plugin-file-responsibility/rules/barrel-curated-exports
 */

import { isBarrelFile, isInternalByName, resolveRelative } from "../util.mjs";

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a barrel to re-export by name: no `export *` of an @internal file, no unrenamed default re-export."
    },
    schema: [],
    messages: {
      wildcardInternal:
        "Do not `export *` from the @internal file `{{source}}`. Re-export the public names one by one.",
      unnamedDefault:
        'Rename the default re-export: `export { default as <name> } from "{{source}}"`.'
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!isBarrelFile(filename)) return {};

    return {
      ExportAllDeclaration(node) {
        const source = node.source.value;
        const target = resolveRelative(filename, source);
        if (target && isInternalByName(target)) {
          context.report({
            node,
            messageId: "wildcardInternal",
            data: { source }
          });
        }
      },
      ExportNamedDeclaration(node) {
        if (!node.source) return;
        for (const spec of node.specifiers) {
          const local = spec.local.name ?? spec.local.value;
          const exported = spec.exported.name ?? spec.exported.value;
          if (local === "default" && exported === "default") {
            context.report({
              node: spec,
              messageId: "unnamedDefault",
              data: { source: node.source.value }
            });
          }
        }
      }
    };
  }
};
