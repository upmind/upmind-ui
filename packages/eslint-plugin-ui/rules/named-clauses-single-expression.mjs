/**
 * @fileoverview `ui/named-clauses-single-expression` — composed-component law
 * CC13a (narrow, decidable core).
 *
 * A `meta` object's derivations must be single expressions — no ternaries in
 * a `meta` property. Scoped to: within an object literal assigned to
 * `const meta = { ... }`, or returned as `{ ... }` from a function/getter
 * named `meta`, flag any property whose value is a `ConditionalExpression`.
 * Early-return `true`/`false` chains are out of scope for this rule (the
 * spec calls that the reviewer's judgement call, not a mechanical check).
 *
 * Valid:   `const meta = { open: state.isOpen }`
 * Invalid: `const meta = { label: x ? "a" : "b" }`
 *
 * A genuine exception is silenced in place with
 * `// eslint-disable-next-line ui/named-clauses-single-expression -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/named-clauses-single-expression
 */

/** True when `node` is the ObjectExpression assigned to `const meta = ...`. */
function isMetaVariableInit(node) {
  return (
    node.parent?.type === "VariableDeclarator" &&
    node.parent.id.type === "Identifier" &&
    node.parent.id.name === "meta"
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a ternary inside a `meta` object property (CC13a).",
      recommended: true
    },
    schema: [],
    messages: {
      ternaryInMeta:
        "A `meta` property must be a single expression, not a ternary (CC13a). Derive it as a named clause instead. If this is deliberate, silence it with `// eslint-disable-next-line ui/named-clauses-single-expression -- <reason>`."
    }
  },

  create(context) {
    return {
      ObjectExpression(node) {
        if (!isMetaVariableInit(node)) return;

        for (const prop of node.properties) {
          if (prop.type !== "Property") continue;
          if (prop.value.type === "ConditionalExpression") {
            context.report({ node: prop.value, messageId: "ternaryInMeta" });
          }
        }
      }
    };
  }
};
