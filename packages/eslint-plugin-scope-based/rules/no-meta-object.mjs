/**
 * @fileoverview `scope-based/no-meta-object` — expose single flags, not one
 * `meta` object.
 *
 * In a `use*.ts` file, flag a returned `meta` member whose value is one
 * `computed` object (`meta: computed(() => ({ ... }))`, inline or through a
 * `const` of that name in the file). Put each flag in the meta layer as its own
 * computed. Existing uses are held in the suppressions ledger.
 *
 * @module packages/eslint-plugin-scope-based/rules/no-meta-object
 */

import {
  composableFile,
  isFunctionNode,
  isTestFile,
  onReturnedObjects,
  propertyKeyName
} from "../util.mjs";

/** True for `computed(() => ({...}))` or a block getter returning an object. */
function isComputedObject(node) {
  if (
    node?.type !== "CallExpression" ||
    node.callee.type !== "Identifier" ||
    node.callee.name !== "computed"
  ) {
    return false;
  }
  const getter = node.arguments[0];
  if (!isFunctionNode(getter)) return false;
  if (getter.body.type === "ObjectExpression") return true;
  if (getter.body.type !== "BlockStatement") return false;
  const last = getter.body.body[getter.body.body.length - 1];
  return (
    last?.type === "ReturnStatement" &&
    last.argument?.type === "ObjectExpression"
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a returned `meta` member that is one computed object."
    },
    schema: [],
    messages: {
      metaObject:
        "Do not return one `meta` object. Expose each flag as its own computed in the meta layer."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename) || !composableFile(filename)) return {};
    const sourceCode = context.sourceCode ?? context.getSourceCode();

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
        if (propertyKeyName(prop) !== "meta") continue;
        const value =
          prop.value.type === "Identifier" ? initOf(prop.value) : prop.value;
        if (isComputedObject(value)) {
          context.report({ node: prop, messageId: "metaObject" });
        }
      }
    });
  }
};
