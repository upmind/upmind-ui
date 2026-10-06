/**
 * @fileoverview `xstate/named-guards` (XState 5 only) — a guard is named in
 * `setup()`, never written inline.
 *
 * A function literal as the value of a `guard` key fails. The rule reads the
 * installed `xstate` major and stays silent below 5.
 *
 * Valid:   `{ guard: "isReady" }`
 * Invalid: `{ guard: ({ context }) => context.ready }`
 *
 * @module packages/eslint-plugin-xstate/rules/named-guards
 */

import {
  belowV5,
  importsXstate,
  propertyName,
  xstateMajorSchema
} from "../util.mjs";

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "XState 5 only: disallow an inline function as a transition guard; name it in setup()."
    },
    schema: [xstateMajorSchema],
    messages: {
      namedGuard:
        "Name the guard in `setup({ guards })` and reference it by name. Do not write a function literal as `guard`."
    }
  },

  create(context) {
    if (belowV5(context) || !importsXstate(context.sourceCode.ast)) return {};
    return {
      Property(node) {
        if (propertyName(node) !== "guard") return;
        if (
          node.value.type === "ArrowFunctionExpression" ||
          node.value.type === "FunctionExpression"
        ) {
          context.report({ node: node.value, messageId: "namedGuard" });
        }
      }
    };
  }
};
