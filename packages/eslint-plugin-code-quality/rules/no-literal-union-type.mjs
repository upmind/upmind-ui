/**
 * @fileoverview `code-quality/no-literal-union-type` — a value set is an enum.
 *
 * A type alias whose union holds two or more string-literal types is a value
 * set in disguise. Declare an enum and derive the union from it with a
 * template literal type, `${Enum}`, so the enum stays the one source of truth.
 *
 * @module packages/eslint-plugin-code-quality/rules/no-literal-union-type
 */

/** True for a string-literal type: `"a"`, or a template literal type with no holes. */
function isStringLiteralType(node) {
  if (node.type === "TSLiteralType") {
    const lit = node.literal;
    if (lit.type === "Literal") return typeof lit.value === "string";
    if (lit.type === "TemplateLiteral") return lit.expressions.length === 0;
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow a type alias that is a union of two or more string-literal types; define an enum and derive the union from it."
    },
    schema: [],
    messages: {
      literalUnion:
        "Define an enum and derive the union as `${Enum}`. A union of {{count}} string literals is a value set."
    }
  },

  create(context) {
    return {
      TSTypeAliasDeclaration(node) {
        const ann = node.typeAnnotation;
        if (ann.type !== "TSUnionType") return;
        const count = ann.types.filter(isStringLiteralType).length;
        if (count < 2) return;
        context.report({
          node: node.id,
          messageId: "literalUnion",
          data: { count: String(count) }
        });
      }
    };
  }
};
