/**
 * @fileoverview `ui/no-as-child-prop` — composed-component law CC19.
 *
 * A composed main must not declare an `asChild` prop. Flags a top-level
 * `asChild` member in a `defineProps<{ ... }>()` inline type, in a named
 * `Props` interface used as the props type, or in a `withDefaults` defaults
 * object.
 *
 * Valid:   props without `asChild`.
 * Invalid: `defineProps<{ asChild?: boolean }>()`
 * Invalid: `interface Props { asChild: boolean }`
 *
 * A genuine exception is silenced in place with
 * `// eslint-disable-next-line ui/no-as-child-prop -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/no-as-child-prop
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow an `asChild` prop on a composed main (CC19).",
      recommended: true
    },
    schema: [],
    messages: {
      asChildProp:
        "A composed main must not declare an `asChild` prop (CC19). If this is deliberate, silence it with `// eslint-disable-next-line ui/no-as-child-prop -- <reason>`."
    }
  },

  create(context) {
    const flagIfAsChild = (nameNode, reportNode) => {
      if (nameNode === "asChild") {
        context.report({ node: reportNode, messageId: "asChildProp" });
      }
    };

    return {
      // `interface Props { asChild: boolean }`
      TSInterfaceBody(node) {
        for (const member of node.body) {
          if (member.type !== "TSPropertySignature") continue;
          const key = member.key;
          const name =
            key.type === "Identifier"
              ? key.name
              : key.type === "Literal"
                ? key.value
                : undefined;
          flagIfAsChild(name, member);
        }
      },

      // `defineProps<{ asChild?: boolean }>()` — the inline type literal.
      TSTypeLiteral(node) {
        for (const member of node.members) {
          if (member.type !== "TSPropertySignature") continue;
          const key = member.key;
          const name =
            key.type === "Identifier"
              ? key.name
              : key.type === "Literal"
                ? key.value
                : undefined;
          flagIfAsChild(name, member);
        }
      },

      // `withDefaults(defineProps<Props>(), { asChild: false })`
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "Identifier" || callee.name !== "withDefaults")
          return;

        const defaults = node.arguments[1];
        if (!defaults || defaults.type !== "ObjectExpression") return;

        for (const prop of defaults.properties) {
          if (prop.type !== "Property" || prop.computed) continue;
          const key = prop.key;
          const name =
            key.type === "Identifier"
              ? key.name
              : key.type === "Literal"
                ? key.value
                : undefined;
          flagIfAsChild(name, prop);
        }
      }
    };
  }
};
