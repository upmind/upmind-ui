/**
 * @fileoverview `scope-based/no-computed-effects` — a `computed` has no side
 * effects (the `.ts` half of decision S6; `vue/no-side-effects-in-computed-properties`
 * covers `.vue`).
 *
 * Inside a `computed` getter (the function passed to `computed(...)`, or the
 * `get` of `computed({ get, set })`), flag:
 *  - any assignment (`=`, `+=`, ...) and any update (`++`, `--`);
 *  - any call used as a bare statement, whose result is unused. A discarded
 *    result can only be there for its effect, so a rename gets past nothing.
 *
 * A nested function inside the getter is its own scope and is not inspected.
 *
 * @module packages/eslint-plugin-scope-based/rules/no-computed-effects
 */

import { isFunctionNode, propertyKeyName } from "../util.mjs";

/** The getter function of a `computed(...)` call, or null. */
function getterOf(call) {
  const arg = call.arguments[0];
  if (!arg) return null;
  if (isFunctionNode(arg)) return arg;
  if (arg.type === "ObjectExpression") {
    for (const prop of arg.properties) {
      if (propertyKeyName(prop) !== "get") continue;
      return isFunctionNode(prop.value) ? prop.value : null;
    }
  }
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow an assignment or a bare call statement inside a computed getter."
    },
    schema: [],
    messages: {
      assignment:
        "A computed getter must not assign. Derive the value and return it; do the write in an action.",
      bareCall:
        "A computed getter must not call a function for its effect. Its result is unused, so the call is a side effect."
    }
  },

  create(context) {
    /** @type {Set<object>} */
    const getters = new Set();

    /** Nearest enclosing function is a recorded getter. */
    function inGetter(node) {
      for (let cur = node.parent; cur; cur = cur.parent) {
        if (isFunctionNode(cur)) return getters.has(cur);
      }
      return false;
    }

    return {
      CallExpression(node) {
        if (
          node.callee.type !== "Identifier" ||
          node.callee.name !== "computed"
        ) {
          return;
        }
        const getter = getterOf(node);
        if (getter) getters.add(getter);
      },
      AssignmentExpression(node) {
        if (inGetter(node)) context.report({ node, messageId: "assignment" });
      },
      UpdateExpression(node) {
        if (inGetter(node)) context.report({ node, messageId: "assignment" });
      },
      ExpressionStatement(node) {
        const expr = node.expression;
        const isCall =
          expr.type === "CallExpression" ||
          (expr.type === "AwaitExpression" &&
            expr.argument.type === "CallExpression") ||
          (expr.type === "ChainExpression" &&
            expr.expression.type === "CallExpression");
        if (isCall && inGetter(node)) {
          context.report({ node, messageId: "bareCall" });
        }
      }
    };
  }
};
