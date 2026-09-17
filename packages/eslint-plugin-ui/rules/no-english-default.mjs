/**
 * @fileoverview `ui/no-english-default` — composed-component law CC22.
 *
 * Rendered copy must not default to English inside the library. A `withDefaults`
 * default that is a non-empty string literal bakes a hard-coded string into the
 * component, which defeats i18n for any rendered prop.
 *
 * The rendered/token distinction is not decidable from syntax: `{ size: "md" }`
 * (a variant token) looks the same as `{ label: "Announcement" }` (rendered
 * copy). So this rule lands narrow — ANY non-empty string-literal default is
 * flagged — and the message tells a non-rendered token default to use the
 * waiver.
 *
 *   Valid:   withDefaults(defineProps<P>(), { label: undefined })
 *   Valid:   withDefaults(defineProps<P>(), { empty: "" })   // empty string ok
 *   Invalid: withDefaults(defineProps<P>(), { label: "Announcement" })
 *   Invalid: withDefaults(defineProps<P>(), { size: "md" })  // token also flagged
 *
 * A non-rendered token default is silenced with
 * `// eslint-disable-next-line ui/no-english-default -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/no-english-default
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a non-empty string-literal default in a composed main's withDefaults; rendered copy must not default to English inside the library (CC22).",
      recommended: true
    },
    schema: [],
    messages: {
      stringDefault:
        "`{{name}}: \"{{value}}\"` defaults rendered copy to English inside the library — pass `undefined` and let the consumer supply the (translated) copy. This rule cannot tell a rendered string from a variant token; if `{{name}}` is a non-rendered token default, silence it with `// eslint-disable-next-line ui/no-english-default -- <reason>`."
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
          if (
            value.type === "Literal" &&
            typeof value.value === "string" &&
            value.value !== ""
          ) {
            const name =
              prop.key.type === "Identifier"
                ? prop.key.name
                : prop.key.type === "Literal"
                  ? String(prop.key.value)
                  : "prop";
            context.report({
              node: prop,
              messageId: "stringDefault",
              data: { name, value: value.value }
            });
          }
        }
      }
    };
  }
};
