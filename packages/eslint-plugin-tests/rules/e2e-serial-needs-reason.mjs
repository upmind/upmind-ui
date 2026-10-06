/**
 * @fileoverview `tests/e2e-serial-needs-reason` — serial mode is a cost, so it
 * carries its reason (P8, §Isolation discipline).
 *
 * `test.describe.configure({ mode: "serial" })` and `test.describe.serial(...)`
 * need a comment on the line before them. `mode: "parallel"` is banned because
 * `fullyParallel: true` is the default.
 *
 * @module packages/eslint-plugin-tests/rules/e2e-serial-needs-reason
 */

import { objectProperty, propertyName, staticString } from "../util.mjs";

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Serial mode needs a reason comment on the line before it. Parallel mode is the default and is banned.",
      recommended: true
    },
    schema: [],
    messages: {
      serialNoReason:
        "Serial mode needs its reason in a comment on the line before it.",
      parallelMode:
        '`mode: "parallel"` is redundant. `fullyParallel: true` is the default.'
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    function statementOf(node) {
      let current = node;
      while (current.parent && !/Statement$|Declaration$/.test(current.type)) {
        current = current.parent;
      }
      return current;
    }

    function requireReason(node) {
      const statement = statementOf(node);
      const line = statement.loc.start.line;
      const hasReason = sourceCode
        .getCommentsBefore(statement)
        .some(comment => comment.loc.end.line === line - 1);
      if (!hasReason) context.report({ node, messageId: "serialNoReason" });
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "MemberExpression" || callee.computed) return;
        const method = propertyName(callee.property);

        if (method === "serial") {
          const owner = callee.object;
          if (
            owner.type === "MemberExpression" &&
            propertyName(owner.property) === "describe"
          ) {
            requireReason(node);
          }
          return;
        }
        if (method !== "configure") return;
        const mode = objectProperty(node.arguments[0], "mode");
        const value = staticString(mode?.value);
        if (value === "serial") requireReason(node);
        else if (value === "parallel") {
          context.report({ node: mode, messageId: "parallelMode" });
        }
      }
    };
  }
};
