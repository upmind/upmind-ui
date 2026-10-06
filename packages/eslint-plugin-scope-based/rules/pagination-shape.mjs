/**
 * @fileoverview `scope-based/pagination-shape` — a returned `pagination` member
 * is a computed `{ offset, limit, total }`.
 *
 * In a `use*.ts` file, a factory's returned `pagination` member is resolved to
 * its `computed(() => ({ ... }))` initializer in the same file (inline, or a
 * `const` of that name). The object it returns must have exactly the keys
 * `offset`, `limit` and `total`. A member that does not resolve to a computed
 * object literal is not checked: the type is the typed variant of this rule,
 * listed in the ledger as needing typed linting.
 *
 * @module packages/eslint-plugin-scope-based/rules/pagination-shape
 */

import {
  composableFile,
  isFunctionNode,
  isTestFile,
  onReturnedObjects,
  propertyKeyName
} from "../util.mjs";

const SHAPE = ["limit", "offset", "total"];

/** The object literal a `computed(() => ({...}))` call returns, or null. */
function computedObject(node) {
  if (
    node?.type !== "CallExpression" ||
    node.callee.type !== "Identifier" ||
    node.callee.name !== "computed"
  ) {
    return null;
  }
  const getter = node.arguments[0];
  if (!isFunctionNode(getter)) return null;
  if (getter.body.type === "ObjectExpression") return getter.body;
  if (getter.body.type !== "BlockStatement") return null;
  const last = getter.body.body[getter.body.body.length - 1];
  return last?.type === "ReturnStatement" &&
    last.argument?.type === "ObjectExpression"
    ? last.argument
    : null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a returned `pagination` member to be a computed object with exactly offset, limit and total."
    },
    schema: [],
    messages: {
      paginationShape:
        "`pagination` must be a computed `{ offset, limit, total }`. Found keys: {{found}}."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename) || !composableFile(filename)) return {};
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    /** Resolve an identifier to its declarator initializer in this file. */
    function initOf(identifier) {
      let scope = sourceCode.getScope(identifier);
      while (scope) {
        const variable = scope.set.get(identifier.name);
        if (variable) {
          const def = variable.defs[0];
          return def?.node?.type === "VariableDeclarator"
            ? def.node.init
            : null;
        }
        scope = scope.upper;
      }
      return null;
    }

    return onReturnedObjects(objectNode => {
      for (const prop of objectNode.properties) {
        if (propertyKeyName(prop) !== "pagination") continue;
        const value =
          prop.value.type === "Identifier" ? initOf(prop.value) : prop.value;
        const object = computedObject(value);
        if (!object) continue;
        const keys = object.properties
          .map(p => propertyKeyName(p) ?? "?")
          .sort();
        if (keys.join(",") !== SHAPE.join(",")) {
          context.report({
            node: prop,
            messageId: "paginationShape",
            data: { found: keys.join(", ") || "none" }
          });
        }
      }
    });
  }
};
