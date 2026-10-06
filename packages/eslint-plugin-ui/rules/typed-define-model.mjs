/**
 * @fileoverview `ui/typed-define-model` — `defineModel` carries a type argument.
 *
 * `defineModel()` called with no type argument fails. The model type is
 * explicit: `defineModel<string>()`.
 *
 * Valid:   `const value = defineModel<string>();`
 * Invalid: `const value = defineModel();`, `const value = defineModel("x");`
 *
 * @module packages/eslint-plugin-ui/rules/typed-define-model
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Require defineModel to be called with a type argument.",
      recommended: true
    },
    schema: [],
    messages: {
      untypedModel:
        "`defineModel` needs a type argument, for example `defineModel<string>()`."
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier") return;
        if (node.callee.name !== "defineModel") return;
        if (node.typeArguments || node.typeParameters) return;
        context.report({ node, messageId: "untypedModel" });
      }
    };
  }
};
