/**
 * @fileoverview `ui/no-inline-sfc-types` — composed-component law CC4.
 *
 * Props/emits/slots types for a composed main live in the folder's `types.ts`
 * and are imported by NAME. An SFC `<script setup>` must not spell the shape
 * inline. Two inline shapes are banned:
 *
 *   1. An inline object-type LITERAL as the type argument of a component macro —
 *      `defineProps<{ ... }>()`, `defineEmits<{ ... }>()`, `defineSlots<{ ... }>()`.
 *      The named form `defineProps<TabsProps>()` is the law.
 *   2. A top-level `interface Props {}` / `interface Emits {}` declared in the
 *      SFC instead of `types.ts`.
 *
 * A genuinely-local type is silenced in place with
 * `// eslint-disable-next-line ui/no-inline-sfc-types -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/no-inline-sfc-types
 */

/** The component macros whose type argument must be a named reference. */
const MACROS = new Set(["defineProps", "defineEmits", "defineSlots"]);

/** Top-level interface names that belong in `types.ts`, not an SFC. */
const RELOCATED_INTERFACES = new Set(["Props", "Emits"]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow inline props/emits/slots type literals in a composed main; the types live in the folder's types.ts and are imported by name (CC4).",
      recommended: true
    },
    schema: [],
    messages: {
      inlineMacroType:
        "`{{macro}}` must take a NAMED type from the folder's `types.ts` (e.g. `{{macro}}<TabsProps>()`), not an inline object-type literal. Move the shape to `types.ts` and import it by name. If this type is genuinely local, silence it with `// eslint-disable-next-line ui/no-inline-sfc-types -- <reason>`.",
      relocatedInterface:
        "`interface {{name}}` must live in the folder's `types.ts`, not in the SFC. Move it there and import it by name. If this interface is genuinely local, silence it with `// eslint-disable-next-line ui/no-inline-sfc-types -- <reason>`."
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "Identifier" || !MACROS.has(callee.name)) return;
        const typeArgs = node.typeArguments;
        if (!typeArgs || typeArgs.params.length === 0) return;
        const first = typeArgs.params[0];
        if (first.type === "TSTypeLiteral") {
          context.report({
            node: first,
            messageId: "inlineMacroType",
            data: { macro: callee.name }
          });
        }
      },

      TSInterfaceDeclaration(node) {
        if (!RELOCATED_INTERFACES.has(node.id.name)) return;
        // Top-level only: declared directly in the module body.
        if (node.parent && node.parent.type !== "Program") return;
        context.report({
          node,
          messageId: "relocatedInterface",
          data: { name: node.id.name }
        });
      }
    };
  }
};
