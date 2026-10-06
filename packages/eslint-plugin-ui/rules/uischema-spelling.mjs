/**
 * @fileoverview `ui/uischema-spelling` — the word is `Uischema`.
 *
 * An identifier that contains `UiSchema` or `UISchema` fails. Use `Uischema`
 * (for example `useProductConfigUischema`).
 *
 * A name imported from a library is exempt: it is not ours to respell.
 *
 * Valid:   `const productUischema = {}`, `import { UISchemaElement } from "x"`
 * Invalid: `const productUiSchema = {}`, `type UISchemaElement = {}`
 *
 * @module packages/eslint-plugin-ui/rules/uischema-spelling
 */

const WRONG = /U[iI]Schema/;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Require the spelling `Uischema` in identifiers.",
      recommended: true
    },
    schema: [],
    messages: {
      spelling:
        "Spell it `Uischema`, not `UiSchema` or `UISchema`: rename `{{name}}`."
    }
  },

  create(context) {
    // A name a library exports (`import { UISchemaElement } from "..."`) is not
    // ours to respell; the rule skips it everywhere in the file.
    const imported = new Set();
    return {
      ImportSpecifier(node) {
        imported.add(node.imported.name ?? node.imported.value);
        imported.add(node.local.name);
      },
      Identifier(node) {
        if (imported.has(node.name)) return;
        if (WRONG.test(node.name)) {
          context.report({
            node,
            messageId: "spelling",
            data: { name: node.name }
          });
        }
      }
    };
  }
};
