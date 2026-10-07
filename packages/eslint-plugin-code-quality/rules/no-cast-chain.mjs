/**
 * @fileoverview `code-quality/no-cast-chain` — no cast where a real type
 * exists.
 *
 * A double cast through `unknown` (`x as unknown as T`) discards the type
 * system. It is legal in one place only: the initializer of a named `const`
 * declaration, where the declared name documents the claim. Anywhere else the
 * real type is missing; add it.
 *
 * @module packages/eslint-plugin-code-quality/rules/no-cast-chain
 */

/** True for `<expr> as unknown`. */
function isCastToUnknown(node) {
  return (
    node.type === "TSAsExpression" &&
    node.typeAnnotation.type === "TSUnknownKeyword"
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `as unknown as T` except as the initializer of a named const declaration."
    },
    schema: [],
    messages: {
      castChain:
        "Do not cast through `unknown`. Give the value its real type. A double cast is allowed only as the initializer of a named `const`."
    }
  },

  create(context) {
    return {
      TSAsExpression(node) {
        if (!isCastToUnknown(node.expression)) return;
        const parent = node.parent;
        const isNamedConstInit =
          parent?.type === "VariableDeclarator" &&
          parent.init === node &&
          parent.id.type === "Identifier" &&
          parent.parent?.type === "VariableDeclaration" &&
          parent.parent.kind === "const";
        if (isNamedConstInit) return;
        context.report({ node, messageId: "castChain" });
      }
    };
  }
};
