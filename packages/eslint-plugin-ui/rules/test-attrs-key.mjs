/**
 * @fileoverview `ui/test-attrs-key` — composed-component laws CC9/CC10.
 *
 * Every `useTestAttrs({ ... })` call must carry a `key` property (CC9 — a
 * keyless call emits nothing), and that `key` value must be a plain string
 * literal, never a template literal or an expression (CC10 — item identity
 * belongs in `value`, not in `key`).
 *
 * Valid:   `useTestAttrs({ key: "tab-item", value: [item.value, index] })`
 * Invalid: `useTestAttrs({ value: x })` — no key
 * Invalid: `useTestAttrs({ dataAttrs })` — no key
 * Invalid: `useTestAttrs({ key: \`tab-${item.value}\` })` — interpolated key
 *
 * A genuine exception is silenced in place with
 * `// eslint-disable-next-line ui/test-attrs-key -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/test-attrs-key
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require every useTestAttrs() call to carry a string-literal `key` (CC9/CC10).",
      recommended: true
    },
    schema: [],
    messages: {
      missingKey:
        "`useTestAttrs()` must carry a `key` property; a keyless call emits nothing (CC9). If this is deliberate, silence it with `// eslint-disable-next-line ui/test-attrs-key -- <reason>`.",
      nonLiteralKey:
        "`key` must be a plain string literal, not a template literal or expression; item identity goes in `value`, not `key` (CC10). If this is deliberate, silence it with `// eslint-disable-next-line ui/test-attrs-key -- <reason>`."
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "Identifier" || callee.name !== "useTestAttrs")
          return;

        const arg = node.arguments[0];
        if (!arg || arg.type !== "ObjectExpression") return;

        const keyProp = arg.properties.find(
          p =>
            p.type === "Property" &&
            !p.computed &&
            ((p.key.type === "Identifier" && p.key.name === "key") ||
              (p.key.type === "Literal" && p.key.value === "key"))
        );

        if (!keyProp) {
          context.report({ node: arg, messageId: "missingKey" });
          return;
        }

        const value = keyProp.value;
        const isStringLiteral =
          value.type === "Literal" && typeof value.value === "string";

        if (!isStringLiteral) {
          context.report({ node: value, messageId: "nonLiteralKey" });
        }
      }
    };
  }
};
