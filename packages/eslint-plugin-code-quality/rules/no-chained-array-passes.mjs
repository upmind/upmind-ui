/**
 * @fileoverview `code-quality/no-chained-array-passes` — one traversal over an
 * array, not a chain of filter/map/reject.
 *
 * Flags two forms:
 *  - a member chain of two passes, `items.filter(...).map(...)`;
 *  - two lodash `filter`/`reject` calls on the same identifier in one function
 *    (or module) scope.
 *
 * Use one `remove`, `reduce` or `forEach` pass.
 *
 * @module packages/eslint-plugin-code-quality/rules/no-chained-array-passes
 */

const CHAIN_PASSES = new Set(["filter", "map", "reject", "flatMap"]);
const SPLIT_PASSES = new Set(["filter", "reject"]);
const LODASH_SOURCES = new Set(["lodash", "lodash-es"]);

/** The method name of `x.name(...)`, or null. */
function methodName(call) {
  const callee = call.callee;
  if (callee.type !== "MemberExpression" || callee.computed) return null;
  return callee.property.type === "Identifier" ? callee.property.name : null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow chained filter/map/reject passes over one array; use one traversal."
    },
    schema: [],
    messages: {
      chain: "Use one `remove`/`reduce` pass, not a chain of array passes.",
      split:
        "Use one `remove`/`reduce` pass. `{{name}}` is already filtered or rejected in this scope."
    }
  },

  create(context) {
    const lodashNames = new Map(); // local name -> imported name
    /** scope node -> Map(identifier name -> count) */
    const stack = [new Map()];

    function enter() {
      stack.push(new Map());
    }
    function exit() {
      stack.pop();
    }

    return {
      ImportDeclaration(node) {
        if (!LODASH_SOURCES.has(node.source.value)) return;
        for (const spec of node.specifiers) {
          if (spec.type !== "ImportSpecifier") continue;
          const imported = spec.imported.name ?? spec.imported.value;
          if (SPLIT_PASSES.has(imported))
            lodashNames.set(spec.local.name, imported);
        }
      },
      FunctionDeclaration: enter,
      "FunctionDeclaration:exit": exit,
      FunctionExpression: enter,
      "FunctionExpression:exit": exit,
      ArrowFunctionExpression: enter,
      "ArrowFunctionExpression:exit": exit,

      CallExpression(node) {
        const name = methodName(node);
        if (name && CHAIN_PASSES.has(name)) {
          const inner = node.callee.object;
          if (
            inner.type === "CallExpression" &&
            CHAIN_PASSES.has(methodName(inner) ?? "")
          ) {
            context.report({ node, messageId: "chain" });
            return;
          }
        }

        const callee = node.callee;
        if (callee.type !== "Identifier" || !lodashNames.has(callee.name))
          return;
        const target = node.arguments[0];
        if (target?.type !== "Identifier") return;
        const counts = stack[stack.length - 1];
        const seen = counts.get(target.name) ?? 0;
        counts.set(target.name, seen + 1);
        if (seen >= 1) {
          context.report({
            node,
            messageId: "split",
            data: { name: target.name }
          });
        }
      }
    };
  }
};
