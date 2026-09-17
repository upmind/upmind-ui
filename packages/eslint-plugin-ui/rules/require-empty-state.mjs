/**
 * @fileoverview `ui/require-empty-state` — composed-component law CC21 (Lint 15).
 *
 * A composed main that takes a COLLECTION prop must handle the empty case. This
 * rule enforces the NARROW SYNTACTIC CORE only: when a `defineProps<{ ... }>()`
 * INLINE object-type literal, OR a top-level `interface Props { ... }`, declares
 * a prop whose name is `items` or `options` or ends in `s`, AND whose type is an
 * array (`T[]` or `Array<T>`), the component must show one empty-case signal:
 *
 *   1. a reference to `meta.isEmpty` anywhere in the script, OR
 *   2. a `defineSlots<{ empty... }>()` member named `empty`.
 *
 * Only the script is visible here, so a template `<slot name="empty">` is NOT
 * checked — the two script-level signals above are the whole core.
 *
 * FALSE-POSITIVE BOUNDARY — the rule fires ONLY when it positively sees an
 * array-typed collection prop in an INLINE object-type literal or a local
 * `interface Props`. A bare NAMED external props type (e.g. `defineProps<TabsProps>()`
 * with `TabsProps` in another file) is NOT inspectable, so the rule does NOT
 * fire — firing would be a guess (Risk 4).
 *
 * A genuinely-exempt component is silenced in place with
 * `// eslint-disable-next-line ui/require-empty-state -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/require-empty-state
 */

/** Names that always count as a collection prop. */
const COLLECTION_NAMES = new Set(["items", "options"]);

/** Read the identifier name off a member's key, or null. */
function memberKeyName(member) {
  const key = member && member.key;
  if (!key) return null;
  if (key.type === "Identifier") return key.name;
  if (key.type === "Literal" && typeof key.value === "string") return key.value;
  return null;
}

/** True when the prop NAME marks a collection: `items`, `options`, or a plural. */
function isCollectionName(name) {
  return COLLECTION_NAMES.has(name) || name.endsWith("s");
}

/** True when the member's declared type is an array (`T[]` or `Array<T>`). */
function isArrayTyped(member) {
  const annotation = member && member.typeAnnotation;
  if (!annotation || annotation.type !== "TSTypeAnnotation") return false;
  const type = annotation.typeAnnotation;
  if (!type) return false;
  if (type.type === "TSArrayType") return true;
  if (
    type.type === "TSTypeReference" &&
    type.typeName &&
    type.typeName.type === "Identifier" &&
    type.typeName.name === "Array"
  ) {
    return true;
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a composed main with an inline array-typed collection prop to handle the empty case via a `meta.isEmpty` reference or a `defineSlots` `empty` member (CC21).",
      recommended: true
    },
    schema: [],
    messages: {
      missingEmptyState:
        "A composed main with a collection prop (`{{prop}}`) must handle the empty case: reference `meta.isEmpty`, or declare a `defineSlots<{ empty... }>()` member (CC21). Add one signal, or if this component is genuinely exempt, silence it with `// eslint-disable-next-line ui/require-empty-state -- <reason>`."
    }
  },

  create(context) {
    /** @type {Array<{ node: object, name: string }>} */
    const collectionProps = [];
    let hasIsEmptyRef = false;
    let hasEmptySlot = false;

    /** Scan an inspectable member list for array-typed collection props. */
    const scanMembers = (members) => {
      for (const member of members) {
        const name = memberKeyName(member);
        if (name && isCollectionName(name) && isArrayTyped(member)) {
          collectionProps.push({ node: member, name });
        }
      }
    };

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "Identifier") return;
        const typeArgs = node.typeArguments;
        const first =
          typeArgs && typeArgs.params.length > 0 ? typeArgs.params[0] : null;

        // `defineProps<{ ... }>()` — INLINE object-type literal only.
        if (callee.name === "defineProps") {
          if (first && first.type === "TSTypeLiteral") scanMembers(first.members);
          return;
        }

        // `defineSlots<{ empty... }>()` — an inline `empty` member is a signal.
        if (callee.name === "defineSlots") {
          if (first && first.type === "TSTypeLiteral") {
            for (const member of first.members) {
              if (memberKeyName(member) === "empty") hasEmptySlot = true;
            }
          }
          return;
        }
      },

      // A top-level `interface Props { ... }`.
      TSInterfaceDeclaration(node) {
        if (node.id.name !== "Props") return;
        if (node.parent && node.parent.type !== "Program") return;
        scanMembers(node.body.body);
      },

      // A `meta.isEmpty` reference anywhere in the script.
      MemberExpression(node) {
        if (
          node.object &&
          node.object.type === "Identifier" &&
          node.object.name === "meta" &&
          node.property &&
          node.property.type === "Identifier" &&
          node.property.name === "isEmpty"
        ) {
          hasIsEmptyRef = true;
        }
      },

      "Program:exit"() {
        if (collectionProps.length === 0) return;
        if (hasIsEmptyRef || hasEmptySlot) return;
        // Report once, on the first collection prop.
        const first = collectionProps[0];
        context.report({
          node: first.node,
          messageId: "missingEmptyState",
          data: { prop: first.name }
        });
      }
    };
  }
};
