/**
 * @fileoverview `tests/no-fixed-wait` — a test waits for the request or the
 * state, then asserts it. It never sleeps (code-tests §Mutation Chain,
 * code-tests-e2e §Mutation chain).
 *
 * Flags `page.waitForTimeout(...)` and `new Promise(r => setTimeout(r, n))`
 * sleeps. (`eslint-plugin-playwright` `no-wait-for-timeout` is not installed
 * here, so this rule covers both.)
 *
 * @module packages/eslint-plugin-tests/rules/no-fixed-wait
 */

import { propertyName, walk } from "../util.mjs";

function callsSetTimeoutWith(executor, paramName) {
  let found = false;
  walk(executor.body, node => {
    if (
      node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === "setTimeout"
    ) {
      let usesParam = paramName === null;
      for (const arg of node.arguments) {
        walk(arg, inner => {
          if (inner.type === "Identifier" && inner.name === paramName)
            usesParam = true;
        });
      }
      if (usesParam) found = true;
    }
  });
  return found;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ban fixed sleeps in test files: waitForTimeout and setTimeout promises.",
      recommended: true
    },
    schema: [],
    messages: {
      fixedWait:
        "A fixed wait hides the real condition. Wait for the request or the state, and assert it."
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          propertyName(node.callee.property) === "waitForTimeout"
        ) {
          context.report({ node, messageId: "fixedWait" });
        }
      },
      NewExpression(node) {
        if (node.callee.type !== "Identifier" || node.callee.name !== "Promise")
          return;
        const executor = node.arguments[0];
        if (
          !executor ||
          (executor.type !== "ArrowFunctionExpression" &&
            executor.type !== "FunctionExpression")
        ) {
          return;
        }
        const first = executor.params[0];
        const paramName = first?.type === "Identifier" ? first.name : null;
        if (callsSetTimeoutWith(executor, paramName)) {
          context.report({ node, messageId: "fixedWait" });
        }
      }
    };
  }
};
