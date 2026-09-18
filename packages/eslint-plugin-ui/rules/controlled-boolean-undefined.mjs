/**
 * @fileoverview `ui/controlled-boolean-undefined` — composed-component law CC6.
 *
 * A boolean prop that falls through to a reka primitive is CONTROLLED state.
 * Its `withDefaults` entry must be `undefined`, never `false`. An absent Vue
 * boolean casts to `false`, so a `false` default pins the controlled value and
 * breaks the fall-through to reka's own default.
 *
 * Narrow, decidable core: flag any property in the `withDefaults` defaults
 * object whose value is the literal `false`.
 *
 *   Valid:   withDefaults(defineProps<P>(), { open: undefined })
 *   Invalid: withDefaults(defineProps<P>(), { open: false })
 *
 * A default that is genuinely `false` (not a controlled fall-through) is
 * silenced with `// eslint-disable-next-line ui/controlled-boolean-undefined -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/controlled-boolean-undefined
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a controlled boolean prop to default to `undefined`, never `false`, in a composed main's withDefaults (CC6).",
      recommended: true
    },
    schema: [],
    messages: {
      booleanFalseDefault:
        "A controlled boolean falls through to reka with `undefined`, not `false` — a `false` default pins the controlled state. Change `{{name}}: false` to `{{name}}: undefined`. If this default is genuinely `false`, silence it with `// eslint-disable-next-line ui/controlled-boolean-undefined -- <reason>`."
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "Identifier" || callee.name !== "withDefaults") return;
        const defaults = node.arguments[1];
        if (!defaults || defaults.type !== "ObjectExpression") return;

        for (const prop of defaults.properties) {
          if (prop.type !== "Property") continue;
          const value = prop.value;
          if (value.type === "Literal" && value.value === false) {
            const name =
              prop.key.type === "Identifier"
                ? prop.key.name
                : prop.key.type === "Literal"
                  ? String(prop.key.value)
                  : "prop";
            context.report({
              node: prop,
              messageId: "booleanFalseDefault",
              data: { name }
            });
          }
        }
      }
    };
  }
};
