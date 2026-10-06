/**
 * @fileoverview `ui/require-accessible-name` — composed-component law CC20 (Lint 14).
 *
 * A composed main must declare an accessible-name prop. This rule enforces the
 * NARROW SYNTACTIC CORE only: when an INSPECTABLE props declaration is present —
 * a `defineProps<{ ... }>()` INLINE object-type literal, OR a top-level
 * `interface Props { ... }` — at least one prop named `title`, `ariaLabel`, or
 * `label` must appear among its members. If none appears, the rule reports.
 *
 * This checks PRESENCE only, not correctness: it cannot judge whether the
 * naming prop is actually wired to the accessible name. The reviewer judges
 * that. The rule is deliberately shallow to stay false-positive-free (Risk 4).
 *
 * FALSE-POSITIVE BOUNDARY — the rule does NOT fire when the props type is a bare
 * NAMED reference with no inspectable members (e.g. `defineProps<TabsProps>()`
 * with `TabsProps` in another file). The members are unreachable from this file,
 * so firing would be a guess. The rule fires ONLY on inline object-type literals
 * and local `interface Props` declarations.
 *
 * A genuinely-exempt component is silenced in place with
 * `// eslint-disable-next-line ui/require-accessible-name -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/require-accessible-name
 */

/** The accessible-name prop names; presence of ANY one satisfies the law. */
const NAMING_PROPS = new Set(["title", "ariaLabel", "label"]);

/** Read the identifier name off a member's key, or null. */
function memberKeyName(member) {
  const key = member && member.key;
  if (!key) return null;
  if (key.type === "Identifier") return key.name;
  if (key.type === "Literal" && typeof key.value === "string") return key.value;
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a composed main to declare an accessible-name prop (`title`, `ariaLabel`, or `label`) when its props type is inspectable inline (CC20). Presence-only; the reviewer judges wiring.",
      recommended: true
    },
    schema: [],
    messages: {
      missingAccessibleName:
        "A composed main must declare an accessible-name prop: one of `title`, `ariaLabel`, or `label` (CC20). This checks PRESENCE only — the reviewer judges whether the name is actually wired. Add a naming prop, or if this component is genuinely exempt, silence it with `// eslint-disable-next-line ui/require-accessible-name -- <reason>`."
    }
  },

  create(context) {
    /** @type {Array<{ node: object, names: string[] }>} */
    const sources = [];

    /** Push an inspectable member list, keyed by the node to report on. */
    const collect = (node, members) => {
      const names = [];
      for (const member of members) {
        const name = memberKeyName(member);
        if (name) names.push(name);
      }
      sources.push({ node, names });
    };

    return {
      // `defineProps<{ ... }>()` — an INLINE object-type literal only.
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "Identifier" || callee.name !== "defineProps")
          return;
        const typeArgs = node.typeArguments;
        if (!typeArgs || typeArgs.params.length === 0) return;
        const first = typeArgs.params[0];
        // A bare named reference (`defineProps<TabsProps>()`) is NOT inspectable.
        if (first.type !== "TSTypeLiteral") return;
        collect(node, first.members);
      },

      // A top-level `interface Props { ... }`.
      TSInterfaceDeclaration(node) {
        if (node.id.name !== "Props") return;
        if (node.parent && node.parent.type !== "Program") return;
        collect(node, node.body.body);
      },

      "Program:exit"() {
        if (sources.length === 0) return;
        const hasNamingProp = sources.some(source =>
          source.names.some(name => NAMING_PROPS.has(name))
        );
        if (hasNamingProp) return;
        // Report once, on the first inspectable source.
        context.report({
          node: sources[0].node,
          messageId: "missingAccessibleName"
        });
      }
    };
  }
};
