/**
 * @fileoverview `file-responsibility/machine-sibling-names` — machine services,
 * actions and guards live in their named sibling file.
 *
 * A file that exports `services`, `actions` or `guards` for a machine must be
 * named `{module}.{services|actions|guards}.{context?}.ts`, and the segment
 * must match what it exports.
 *
 * Valid:   `basket.services.ts` exporting `services`; `useBasket.actions.client.ts`
 * Invalid: `basket.helpers.ts` exporting `actions`; `basket.actions.ts` exporting `guards`
 *
 * @module packages/eslint-plugin-file-responsibility/rules/machine-sibling-names
 */

const KINDS = new Set(["services", "actions", "guards"]);

/** The machine-part names a file exports: `services`, `actions`, `guards`. */
function exportedKinds(program) {
  const found = [];
  for (const statement of program.body) {
    if (
      statement.type === "ExportDefaultDeclaration" &&
      statement.declaration.type === "Identifier" &&
      KINDS.has(statement.declaration.name)
    ) {
      found.push({ node: statement, kind: statement.declaration.name });
    } else if (statement.type === "ExportNamedDeclaration") {
      if (statement.declaration?.type === "VariableDeclaration") {
        for (const declarator of statement.declaration.declarations) {
          if (
            declarator.id.type === "Identifier" &&
            KINDS.has(declarator.id.name)
          ) {
            found.push({ node: declarator, kind: declarator.id.name });
          }
        }
      }
      if (!statement.source) {
        for (const specifier of statement.specifiers) {
          const name = specifier.exported.name ?? specifier.exported.value;
          if (KINDS.has(name)) found.push({ node: specifier, kind: name });
        }
      }
    }
  }
  return found;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a file exporting machine services, actions or guards to be named {module}.{services|actions|guards}.{context?}.ts."
    },
    schema: [],
    messages: {
      siblingName:
        "A file that exports `{{kind}}` must be named `{module}.{{kind}}.ts` or `{module}.{{kind}}.<context>.ts`."
    }
  },

  create(context) {
    const file = context.filename.slice(context.filename.lastIndexOf("/") + 1);
    return {
      Program(program) {
        for (const { node, kind } of exportedKinds(program)) {
          const named = new RegExp(`\\.${kind}(\\.[A-Za-z0-9-]+)*\\.[cm]?ts$`);
          if (!named.test(file)) {
            context.report({ node, messageId: "siblingName", data: { kind } });
          }
        }
      }
    };
  }
};
