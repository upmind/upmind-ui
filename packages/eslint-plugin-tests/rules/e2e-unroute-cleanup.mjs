/**
 * @fileoverview `tests/e2e-unroute-cleanup` — a mocked route does not leak into
 * the next test (§Route mock cleanup). A file that calls `page.route(...)`
 * needs a `test.afterEach` that calls `page.unrouteAll({ behavior: "wait" })`.
 *
 * Exemplar: `tests/Playwright/e2e/e2e-tests/errors/error-handling.spec.ts:22-25`.
 *
 * @module packages/eslint-plugin-tests/rules/e2e-unroute-cleanup
 */

import { objectProperty, propertyName, staticString } from "../util.mjs";

function isAfterEach(callee) {
  return (
    (callee.type === "Identifier" && callee.name === "afterEach") ||
    (callee.type === "MemberExpression" &&
      !callee.computed &&
      propertyName(callee.property) === "afterEach")
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "A file that calls page.route needs an afterEach that calls page.unrouteAll({ behavior: 'wait' }).",
      recommended: true
    },
    schema: [],
    messages: {
      noUnroute:
        'This file mocks a route but has no `test.afterEach` that calls `page.unrouteAll({ behavior: "wait" })`.'
    }
  },

  create(context) {
    /** @type {object[]} */
    const routeCalls = [];
    /** @type {object[]} */
    const afterEachFunctions = [];
    /** @type {object[]} */
    const unrouteCalls = [];

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (isAfterEach(callee)) {
          const fn = node.arguments.find(
            arg =>
              arg.type === "ArrowFunctionExpression" ||
              arg.type === "FunctionExpression"
          );
          if (fn) afterEachFunctions.push(fn);
          return;
        }
        if (callee.type !== "MemberExpression" || callee.computed) return;
        const method = propertyName(callee.property);
        if (method === "route") routeCalls.push(node);
        else if (method === "unrouteAll") {
          const behavior = objectProperty(node.arguments[0], "behavior");
          if (staticString(behavior?.value) === "wait") unrouteCalls.push(node);
        }
      },

      "Program:exit"() {
        if (routeCalls.length === 0) return;
        const cleaned = unrouteCalls.some(call =>
          afterEachFunctions.some(
            fn => call.range[0] >= fn.range[0] && call.range[1] <= fn.range[1]
          )
        );
        if (!cleaned) {
          context.report({ node: routeCalls[0], messageId: "noUnroute" });
        }
      }
    };
  }
};
