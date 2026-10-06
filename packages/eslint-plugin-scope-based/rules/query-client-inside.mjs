/**
 * @fileoverview `scope-based/query-client-inside` — a factory calls
 * `useQueryClient()` itself; it never takes the client as a parameter.
 *
 * Flags a parameter typed `QueryClient` on a function named `use*` or
 * `create*`.
 *
 * @module packages/eslint-plugin-scope-based/rules/query-client-inside
 */

import { isTestFile } from "../util.mjs";

/** True when a parameter's annotation is the type `QueryClient`. */
function isQueryClientParam(param) {
  const p = param.type === "AssignmentPattern" ? param.left : param;
  const ref = p.typeAnnotation?.typeAnnotation;
  return (
    ref?.type === "TSTypeReference" &&
    ref.typeName.type === "Identifier" &&
    ref.typeName.name === "QueryClient"
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a QueryClient parameter on a composable or layer factory."
    },
    schema: [],
    messages: {
      queryClientParam:
        "Do not pass the `QueryClient` in. Call `useQueryClient()` inside `{{name}}`."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename)) return {};

    function check(name, fn) {
      if (!/^(use|create)[A-Z]/.test(name)) return;
      for (const param of fn.params) {
        if (isQueryClientParam(param)) {
          context.report({
            node: param,
            messageId: "queryClientParam",
            data: { name }
          });
        }
      }
    }

    return {
      FunctionDeclaration(node) {
        if (node.id) check(node.id.name, node);
      },
      VariableDeclarator(node) {
        if (
          node.id.type === "Identifier" &&
          node.init &&
          (node.init.type === "ArrowFunctionExpression" ||
            node.init.type === "FunctionExpression")
        ) {
          check(node.id.name, node.init);
        }
      }
    };
  }
};
