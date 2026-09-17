/**
 * @fileoverview `ui/slot-return-vnode` — composed-component law CC5b.
 *
 * Slot functions declared in an INLINE `defineSlots<{ ... }>()` type literal
 * must return `VNode[]` — never `any`, never `unknown`, and never a missing
 * return type. This rule covers the decidable core: within the inline type
 * literal, a slot member whose function return type is `any`/`unknown`/absent.
 *
 * Both member shapes are handled:
 *   - method form:   `item(props): any`      (TSMethodSignature)
 *   - property form: `item: () => any`        (TSPropertySignature → TSFunctionType)
 *
 * When `defineSlots` is called with a NAMED type (not an inline literal) this
 * rule does not fire — Lint 4 (`no-inline-sfc-types`) owns the inline-literal
 * ban separately.
 *
 * Valid:   `defineSlots<{ item(props: { x: T }): VNode[] }>()`
 * Invalid: `defineSlots<{ item(): any }>()`
 * Invalid: `defineSlots<{ item(): unknown }>()`
 *
 * A genuine exception is silenced in place with
 * `// eslint-disable-next-line ui/slot-return-vnode -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/slot-return-vnode
 */

/** True when a return-type annotation node is `any` or `unknown`. */
function isAnyOrUnknown(typeNode) {
  return (
    typeNode.type === "TSAnyKeyword" || typeNode.type === "TSUnknownKeyword"
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require slot functions in an inline `defineSlots<{...}>()` to return `VNode[]`, never `any`/`unknown`/absent (CC5b).",
      recommended: true
    },
    schema: [],
    messages: {
      weakSlotReturn:
        "Slot `{{name}}` must return `VNode[]` (CC5b), not `{{found}}`. Type its return as `VNode[]`. If this is deliberate, silence it with `// eslint-disable-next-line ui/slot-return-vnode -- <reason>`."
    }
  },

  create(context) {
    /** Report a slot member given its name node and its return-type annotation. */
    const check = (member, returnType) => {
      const key = member.key;
      const name =
        key && key.type === "Identifier"
          ? key.name
          : key && key.type === "Literal"
            ? String(key.value)
            : "<slot>";

      // Missing return type.
      if (!returnType) {
        context.report({
          node: member,
          messageId: "weakSlotReturn",
          data: { name, found: "no return type" }
        });
        return;
      }

      const annotation = returnType.typeAnnotation;
      if (annotation && isAnyOrUnknown(annotation)) {
        context.report({
          node: member,
          messageId: "weakSlotReturn",
          data: {
            name,
            found: annotation.type === "TSAnyKeyword" ? "any" : "unknown"
          }
        });
      }
    };

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "Identifier" || callee.name !== "defineSlots") return;

        const typeArgs = node.typeArguments;
        if (!typeArgs || typeArgs.params.length === 0) return;

        // Inline form only. A named type (TSTypeReference) is Lint 4's business.
        const first = typeArgs.params[0];
        if (first.type !== "TSTypeLiteral") return;

        for (const member of first.members) {
          // method form: `item(props): any`
          if (member.type === "TSMethodSignature") {
            check(member, member.returnType);
            continue;
          }
          // property form: `item: () => any`
          if (member.type === "TSPropertySignature") {
            const ann = member.typeAnnotation && member.typeAnnotation.typeAnnotation;
            if (ann && ann.type === "TSFunctionType") {
              check(member, ann.returnType);
            }
          }
        }
      }
    };
  }
};
