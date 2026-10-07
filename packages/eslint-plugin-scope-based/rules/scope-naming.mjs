/**
 * @fileoverview `scope-based/scope-naming` — scope values carry the `scope`
 * prefix.
 *
 * In a `use*.ts` or `*.types.ts` file of a module:
 *  - a returned member that holds the resolved actor (`actorScope`, or a
 *    computed of it) is named `scopeActor`;
 *  - a returned member that holds the acting-for target (`config.context`) is
 *    named `scopeContext`;
 *  - a top-level const that is the actor matrix (an object literal keyed by
 *    `ScopeActorTypes.*`) is named `<MODULE>_SCOPE_MATRIX`.
 *
 * @module packages/eslint-plugin-scope-based/rules/scope-naming
 */

import {
  basenameOf,
  composableFile,
  isFunctionNode,
  isTestFile,
  onReturnedObjects,
  propertyKeyName,
  SCOPE_MATRIX_NAME_RE
} from "../util.mjs";

/** True for `actorScope` or `computed(() => actorScope)`. */
function holdsResolvedActor(value) {
  if (value.type === "Identifier") return value.name === "actorScope";
  if (
    value.type === "CallExpression" &&
    value.callee.type === "Identifier" &&
    value.callee.name === "computed" &&
    isFunctionNode(value.arguments[0])
  ) {
    const body = value.arguments[0].body;
    return body.type === "Identifier" && body.name === "actorScope";
  }
  return false;
}

/** True for `config.context`. */
function holdsActingForTarget(value) {
  return (
    value.type === "MemberExpression" &&
    !value.computed &&
    value.object.type === "Identifier" &&
    value.object.name === "config" &&
    value.property.type === "Identifier" &&
    value.property.name === "context"
  );
}

/** True for an object literal with a `[ScopeActorTypes.X]` computed key. */
function isActorMatrix(init) {
  const obj =
    init?.type === "TSAsExpression" || init?.type === "TSSatisfiesExpression"
      ? init.expression
      : init;
  return (
    obj?.type === "ObjectExpression" &&
    obj.properties.length > 0 &&
    obj.properties.some(
      p =>
        p.type === "Property" &&
        p.computed &&
        p.key.type === "MemberExpression" &&
        p.key.object.type === "Identifier" &&
        p.key.object.name === "ScopeActorTypes"
    )
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require scopeActor, scopeContext and <MODULE>_SCOPE_MATRIX for the scope values of a scoped module."
    },
    schema: [],
    messages: {
      scopeActor: "Name the member that holds the resolved actor `scopeActor`.",
      scopeContext:
        "Name the member that holds the acting-for target `scopeContext`.",
      matrixName:
        "Name the actor matrix `<MODULE>_SCOPE_MATRIX` (UPPER_SNAKE_CASE ending in `_SCOPE_MATRIX`)."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename)) return {};
    const isComposable = !!composableFile(filename);
    const isTypes = /\.types(\.[A-Za-z0-9-]+)*\.ts$/.test(basenameOf(filename));
    if (!isComposable && !isTypes) return {};

    return {
      ...(isComposable
        ? onReturnedObjects(objectNode => {
            for (const prop of objectNode.properties) {
              const name = propertyKeyName(prop);
              if (!name || prop.type !== "Property") continue;
              if (holdsResolvedActor(prop.value) && name !== "scopeActor") {
                context.report({ node: prop, messageId: "scopeActor" });
              } else if (
                holdsActingForTarget(prop.value) &&
                name !== "scopeContext"
              ) {
                context.report({ node: prop, messageId: "scopeContext" });
              }
            }
          })
        : {}),
      "Program > VariableDeclaration > VariableDeclarator, Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator"(
        node
      ) {
        if (node.id.type !== "Identifier" || !isActorMatrix(node.init)) return;
        if (!SCOPE_MATRIX_NAME_RE.test(node.id.name)) {
          context.report({ node: node.id, messageId: "matrixName" });
        }
      }
    };
  }
};
