/**
 * @fileoverview `code-quality/no-lodash-get-state` — never `lodash.get` for a
 * state or context read.
 *
 * Flags a `get` call (named import, aliased import, or `_.get`) from `lodash`
 * or `lodash-es` whose first argument is `state`, `context`, or a `.context`
 * member. The message names the state-read utilities.
 *
 * @module packages/eslint-plugin-code-quality/rules/no-lodash-get-state
 */

const LODASH_SOURCES = new Set(["lodash", "lodash-es", "lodash/get"]);

/** True when the argument reads state or context. */
function isStateRead(arg) {
  if (!arg) return false;
  if (arg.type === "Identifier") {
    return arg.name === "state" || arg.name === "context";
  }
  if (arg.type === "MemberExpression" && !arg.computed) {
    return (
      arg.property.type === "Identifier" && arg.property.name === "context"
    );
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow lodash `get` on state or context; use the state-read utilities."
    },
    schema: [],
    messages: {
      lodashGetState:
        "Do not read state or context with lodash `get`. Use `stateMatches`, `useContext` or `contextValue`."
    }
  },

  create(context) {
    const getNames = new Set();
    const namespaces = new Set();

    return {
      ImportDeclaration(node) {
        if (!LODASH_SOURCES.has(node.source.value)) return;
        for (const spec of node.specifiers) {
          if (spec.type === "ImportSpecifier") {
            const imported = spec.imported.name ?? spec.imported.value;
            if (imported === "get") getNames.add(spec.local.name);
          } else if (node.source.value === "lodash/get") {
            getNames.add(spec.local.name);
          } else {
            namespaces.add(spec.local.name);
          }
        }
      },
      CallExpression(node) {
        const callee = node.callee;
        const isGet =
          (callee.type === "Identifier" && getNames.has(callee.name)) ||
          (callee.type === "MemberExpression" &&
            !callee.computed &&
            callee.object.type === "Identifier" &&
            namespaces.has(callee.object.name) &&
            callee.property.type === "Identifier" &&
            callee.property.name === "get");
        if (!isGet) return;
        if (!isStateRead(node.arguments[0])) return;
        context.report({ node, messageId: "lodashGetState" });
      }
    };
  }
};
