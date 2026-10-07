/**
 * @fileoverview `ui/pascal-case-file-name` — a component file is PascalCase.
 *
 * The base name of a `.vue` file must be PascalCase. Route-convention files
 * (`pages/`, `layouts/`, `app.vue`, `error.vue`) are excluded in the config
 * `ignores`, because the framework fixes their names.
 *
 * Valid:   `ProductCard.vue`
 * Invalid: `product-card.vue`, `productCard.vue`, `Product_Card.vue`
 *
 * @module packages/eslint-plugin-ui/rules/pascal-case-file-name
 */

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Require a .vue file base name to be PascalCase.",
      recommended: true
    },
    schema: [],
    messages: {
      notPascalCase:
        "Component file `{{file}}` must be PascalCase (for example `ProductCard.vue`)."
    }
  },

  create(context) {
    const filename = context.filename;
    if (!filename.endsWith(".vue")) return {};
    const file = filename.slice(filename.lastIndexOf("/") + 1);
    const base = file.slice(0, -".vue".length);
    return {
      Program(node) {
        if (!PASCAL_CASE.test(base)) {
          context.report({
            loc: { line: 1, column: 0 },
            node,
            messageId: "notPascalCase",
            data: { file }
          });
        }
      }
    };
  }
};
