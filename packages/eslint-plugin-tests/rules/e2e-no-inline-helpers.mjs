/**
 * @fileoverview `tests/e2e-no-inline-helpers` — a spec holds tests, and helpers
 * live in the support library (§Support library organization,
 * `e2e-helper-home`).
 *
 * Flags a top-level function declaration or a top-level `const` bound to an
 * arrow function or function expression in a `*.spec.ts` file. A helper nested
 * inside `test.describe(...)` is out of scope: the rule reads module scope.
 *
 * @module packages/eslint-plugin-tests/rules/e2e-no-inline-helpers
 */

function isFunctionInit(init) {
  return (
    init?.type === "ArrowFunctionExpression" ||
    init?.type === "FunctionExpression"
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "A spec file declares no top-level helper function.",
      recommended: true
    },
    schema: [],
    messages: {
      inlineHelper:
        "`{{name}}` is a helper declared in a spec. Move it to the e2e support library."
    }
  },

  create(context) {
    function check(statement) {
      if (statement.type === "FunctionDeclaration" && statement.id) {
        context.report({
          node: statement,
          messageId: "inlineHelper",
          data: { name: statement.id.name }
        });
      } else if (statement.type === "VariableDeclaration") {
        for (const declarator of statement.declarations) {
          if (isFunctionInit(declarator.init)) {
            context.report({
              node: declarator,
              messageId: "inlineHelper",
              data: {
                name:
                  declarator.id.type === "Identifier"
                    ? declarator.id.name
                    : "function"
              }
            });
          }
        }
      }
    }

    return {
      Program(program) {
        for (const statement of program.body) {
          if (
            (statement.type === "ExportNamedDeclaration" ||
              statement.type === "ExportDefaultDeclaration") &&
            statement.declaration
          ) {
            check(statement.declaration);
          } else {
            check(statement);
          }
        }
      }
    };
  }
};
