/**
 * @fileoverview `ui/single-object-v-bind` — an element carries one object
 * `v-bind`. Two object `v-bind`s on one element crash
 * `vite-plugin-vue-inspector`, and `tsc` cannot see it (code-tests-e2e
 * companion, test-id contract).
 *
 * An object `v-bind` is `v-bind="expr"` with no argument. `:class="x"` and
 * `v-bind:id="y"` are argument binds and do not count. Merge the two objects
 * into one expression instead: `v-bind="{ ...a, ...b }"`.
 *
 * Valid:   `<div v-bind="attrs" :id="id" />`
 * Invalid: `<div v-bind="$attrs" v-bind="useTestAttrs({ key: 'x' })" />`
 *
 * @module packages/eslint-plugin-ui/rules/single-object-v-bind
 */

function isObjectBind(attribute) {
  return (
    attribute.directive === true &&
    attribute.key?.name?.name === "bind" &&
    !attribute.key.argument
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "An element carries one object v-bind, never two.",
      recommended: true
    },
    schema: [],
    messages: {
      doubleBind:
        'This element has {{count}} object `v-bind`s. Two crash `vite-plugin-vue-inspector`. Merge them into one: `v-bind="{ ...a, ...b }"`.'
    }
  },

  create(context) {
    const services = context.sourceCode.parserServices;
    if (!services?.defineTemplateBodyVisitor) return {};

    return services.defineTemplateBodyVisitor({
      VElement(node) {
        const binds = (node.startTag?.attributes ?? []).filter(isObjectBind);
        if (binds.length > 1) {
          context.report({
            node: binds[1],
            messageId: "doubleBind",
            data: { count: binds.length }
          });
        }
      }
    });
  }
};
