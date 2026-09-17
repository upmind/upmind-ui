/**
 * @fileoverview `ui/define-options-name` — composed-component law CC1a.
 *
 * When a `defineOptions({ ... })` call is present, its object must carry a
 * string-literal `name` property. Scoped to "when present" because RuleTester
 * (and a bare script AST) cannot see whether the surrounding file is a
 * composed main's SFC, so absence-of-the-call is out of scope for this rule.
 *
 * Valid:   `defineOptions({ name: "Tabs" })`
 * Invalid: `defineOptions({ inheritAttrs: false })` — no name
 * Invalid: `defineOptions({ name: someVar })` — non-literal name
 *
 * A genuine exception is silenced in place with
 * `// eslint-disable-next-line ui/define-options-name -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/define-options-name
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require defineOptions() to carry a string-literal `name` (CC1a).",
      recommended: true
    },
    schema: [],
    messages: {
      missingName:
        "`defineOptions()` must carry a `name` property matching the composed main's folder namesake (CC1a). If this is deliberate, silence it with `// eslint-disable-next-line ui/define-options-name -- <reason>`.",
      nonLiteralName:
        "`defineOptions({ name })` must be a string literal, not a variable or expression (CC1a). If this is deliberate, silence it with `// eslint-disable-next-line ui/define-options-name -- <reason>`."
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "Identifier" || callee.name !== "defineOptions") return;

        const arg = node.arguments[0];
        if (!arg || arg.type !== "ObjectExpression") return;

        const nameProp = arg.properties.find(
          (p) =>
            p.type === "Property" &&
            !p.computed &&
            ((p.key.type === "Identifier" && p.key.name === "name") ||
              (p.key.type === "Literal" && p.key.value === "name"))
        );

        if (!nameProp) {
          context.report({ node: arg, messageId: "missingName" });
          return;
        }

        const value = nameProp.value;
        const isStringLiteral = value.type === "Literal" && typeof value.value === "string";

        if (!isStringLiteral) {
          context.report({ node: value, messageId: "nonLiteralName" });
        }
      }
    };
  }
};
