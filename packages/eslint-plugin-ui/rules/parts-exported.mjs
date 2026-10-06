/**
 * @fileoverview `ui/parts-exported` — a composed component keeps its parts
 * exported (CC1b).
 *
 * In a component folder's `index.ts`, every `parts/*.vue` file that exists on
 * disk must be re-exported: `export { X } from "./parts/X.vue"`, or an import
 * from the part that an `export { X }` re-exports.
 *
 * Valid:   `export { default as TabsList } from "./parts/TabsList.vue";`
 * Invalid: an `index.ts` that never mentions `./parts/TabsList.vue`
 *
 * @module packages/eslint-plugin-ui/rules/parts-exported
 */

import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

/** The `parts/<base>` key of an import or export source, or null. */
function partKey(source) {
  const match = /(?:^|\/)parts\/([^/]+?)(?:\.vue)?$/.exec(source);
  return match ? match[1] : null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a component folder's index.ts to export every parts/*.vue file (CC1b).",
      recommended: true
    },
    schema: [],
    messages: {
      partNotExported:
        "`index.ts` does not export the part `{{part}}.vue` from `parts/`. Re-export it (CC1b)."
    }
  },

  create(context) {
    const filename = context.filename;
    if (!/\/src\/components\/[^/]+\/index\.ts$/.test(filename)) return {};
    const partsDir = join(dirname(filename), "parts");
    if (!existsSync(partsDir)) return {};
    const onDisk = readdirSync(partsDir)
      .filter(file => file.endsWith(".vue"))
      .map(file => file.slice(0, -".vue".length));

    return {
      Program(program) {
        const exported = new Set();
        const importedPartByLocal = new Map();
        for (const statement of program.body) {
          if (statement.type === "ImportDeclaration") {
            const key = partKey(statement.source.value);
            if (!key) continue;
            for (const specifier of statement.specifiers) {
              importedPartByLocal.set(specifier.local.name, key);
            }
          } else if (
            (statement.type === "ExportNamedDeclaration" ||
              statement.type === "ExportAllDeclaration") &&
            statement.source
          ) {
            const key = partKey(statement.source.value);
            if (key) exported.add(key);
          }
        }
        for (const statement of program.body) {
          if (statement.type !== "ExportNamedDeclaration" || statement.source) {
            continue;
          }
          for (const specifier of statement.specifiers) {
            const key = importedPartByLocal.get(specifier.local.name);
            if (key) exported.add(key);
          }
        }
        for (const part of onDisk) {
          if (!exported.has(part)) {
            context.report({
              node: program,
              loc: { line: 1, column: 0 },
              messageId: "partNotExported",
              data: { part }
            });
          }
        }
      }
    };
  }
};
