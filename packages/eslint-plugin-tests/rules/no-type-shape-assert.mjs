/**
 * @fileoverview `tests/no-type-shape-assert` — a test asserts behaviour, not
 * shape. TypeScript already checks shape (code-tests §Before Writing Q2,
 * §Tests That Waste Time).
 *
 * Flags, in test files:
 *  - `toHaveProperty(...)`
 *  - `expect(typeof x)...` and `toBeTypeOf(...)`
 *  - a lone `toBeDefined()` / `not.toBeUndefined()`: a test whose only
 *    assertions are existence checks. A defined-check beside a behavioural
 *    assertion in the same test is a guard, not the test, and stays valid.
 *
 * @module packages/eslint-plugin-tests/rules/no-type-shape-assert
 */

import { enclosingTestFunction, parseExpectChain } from "../util.mjs";

function isDefinedCheck(chain) {
  return (
    (chain.matcher === "toBeDefined" && !chain.negated) ||
    (chain.matcher === "toBeUndefined" && chain.negated)
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Test files assert behaviour, never type shape: no toHaveProperty, typeof asserts or lone toBeDefined.",
      recommended: true
    },
    schema: [],
    messages: {
      shape:
        "`{{what}}` asserts shape. TypeScript checks shape; assert behaviour.",
      loneDefined:
        "This test only asserts that a value exists. TypeScript checks shape; assert behaviour."
    }
  },

  create(context) {
    /** @type {Map<object, { defined: object[], other: number }>} */
    const byTest = new Map();

    return {
      CallExpression(node) {
        const chain = parseExpectChain(node);
        if (!chain) return;

        if (chain.matcher === "toHaveProperty") {
          context.report({
            node,
            messageId: "shape",
            data: { what: "toHaveProperty" }
          });
          return;
        }
        if (chain.matcher === "toBeTypeOf") {
          context.report({
            node,
            messageId: "shape",
            data: { what: "toBeTypeOf" }
          });
          return;
        }
        if (
          chain.subject?.type === "UnaryExpression" &&
          chain.subject.operator === "typeof"
        ) {
          context.report({
            node,
            messageId: "shape",
            data: { what: "expect(typeof ...)" }
          });
          return;
        }

        const test = enclosingTestFunction(node);
        if (!test) return;
        const entry = byTest.get(test) ?? { defined: [], other: 0 };
        if (isDefinedCheck(chain)) entry.defined.push(node);
        else entry.other += 1;
        byTest.set(test, entry);
      },

      "Program:exit"() {
        for (const { defined, other } of byTest.values()) {
          if (other > 0) continue;
          for (const node of defined) {
            context.report({ node, messageId: "loneDefined" });
          }
        }
      }
    };
  }
};
