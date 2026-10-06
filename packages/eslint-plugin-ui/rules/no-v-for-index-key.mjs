/**
 * @fileoverview `ui/no-v-for-index-key` — composed-component law CC18.
 *
 * A `v-for` must key on stable identity, never on the loop index. When a
 * `v-for="(item, i) in items"` binds `:key="i"`, the key changes with position,
 * not identity, so Vue reuses the wrong DOM on reorder. Key on `item.id`.
 *
 * The rule flags a `:key` whose expression is exactly the index variable
 * declared by the same element's `v-for` (`i`, `index`, whatever it is named),
 * so it never fires on `:key="item.id"` and never guesses at variable meaning.
 *
 * Valid:   `<li v-for="(item, i) in items" :key="item.id">`
 * Invalid: `<li v-for="(item, i) in items" :key="i">`,
 *          `<li v-for="(item, index) in items" :key="index">`
 *
 * A genuine exception is silenced in place with
 * `// eslint-disable-next-line ui/no-v-for-index-key -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/no-v-for-index-key
 */

/** The `:key` directive on an element's start tag, or null. */
function findKeyBinding(element) {
  const attrs = element.startTag?.attributes ?? [];
  return (
    attrs.find(
      attr =>
        attr.directive === true &&
        attr.key?.name?.name === "bind" &&
        attr.key?.argument?.name === "key"
    ) ?? null
  );
}

/** The index variable name declared by an element's `v-for`, or null. */
function findForIndexName(element) {
  const attrs = element.startTag?.attributes ?? [];
  const forAttr = attrs.find(
    attr => attr.directive === true && attr.key?.name?.name === "for"
  );
  const expression = forAttr?.value?.expression;
  if (!expression || expression.type !== "VForExpression") return null;
  // left is [value, key, index]; the loop index is the SECOND binding.
  const indexNode = expression.left?.[1];
  return indexNode?.type === "Identifier" ? indexNode.name : null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow keying a v-for on its loop index; key on stable identity (CC18).",
      recommended: true
    },
    schema: [],
    messages: {
      indexKey:
        "A `v-for` must not key on its loop index `{{index}}` (CC18); the key must be stable identity such as `item.id`. If this is intentional, silence it with `// eslint-disable-next-line ui/no-v-for-index-key -- <reason>`."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const services = sourceCode.parserServices;
    if (!services || !services.defineTemplateBodyVisitor) return {};

    return services.defineTemplateBodyVisitor({
      VElement(node) {
        const indexName = findForIndexName(node);
        if (!indexName) return;
        const keyBinding = findKeyBinding(node);
        const keyExpr = keyBinding?.value?.expression;
        if (keyExpr?.type === "Identifier" && keyExpr.name === indexName) {
          context.report({
            node: keyBinding,
            messageId: "indexKey",
            data: { index: indexName }
          });
        }
      }
    });
  }
};
