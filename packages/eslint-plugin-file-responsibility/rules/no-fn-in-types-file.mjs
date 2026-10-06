/**
 * @fileoverview `file-responsibility/no-fn-in-types-file` — a types file holds
 * vocabulary, never behaviour.
 *
 * In a `*.types.ts` (or a bare `types.ts`), flag a function declaration and a
 * function-valued `const`. A function belongs in the utils, mappers or services
 * file whose job it is.
 *
 * @module packages/eslint-plugin-file-responsibility/rules/no-fn-in-types-file
 */

import { isTestFile, isTypesFile } from "../util.mjs";

const FUNCTION_VALUES = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression"
]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a function declaration or a function-valued const in a `*.types.ts` file."
    },
    schema: [],
    messages: {
      fnInTypesFile:
        "A types file holds no function. Move `{{name}}` to the utils, mappers or services file whose job it is."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!isTypesFile(filename) || isTestFile(filename)) return {};

    return {
      FunctionDeclaration(node) {
        context.report({
          node: node.id ?? node,
          messageId: "fnInTypesFile",
          data: { name: node.id?.name ?? "this function" }
        });
      },
      VariableDeclarator(node) {
        if (!node.init || !FUNCTION_VALUES.has(node.init.type)) return;
        context.report({
          node: node.id,
          messageId: "fnInTypesFile",
          data: { name: node.id.name ?? "this function" }
        });
      }
    };
  }
};
