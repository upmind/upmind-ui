/**
 * @fileoverview `ui/uischema-i18n` — each uischema element carries an `i18n` key.
 *
 * In `*.schemas.ts` and `*.schemas.<actor>.ts` files, an object literal whose
 * `type` is `Control`, `Group`, `Label`, `Category`, `Categorization` or a
 * layout type (`VerticalLayout`, `HorizontalLayout`, ...) must have an `i18n`
 * property. The option `types` replaces the default list.
 *
 * Valid:   `{ type: "Control", scope: "#/properties/name", i18n: "name" }`
 * Invalid: `{ type: "Control", scope: "#/properties/name" }`
 *
 * @module packages/eslint-plugin-ui/rules/uischema-i18n
 */

const SCHEMA_FILE = /\.schemas(\.[A-Za-z0-9-]+)*\.[cm]?ts$/;
const DEFAULT_TYPES = [
  "Control",
  "Group",
  "Label",
  "Category",
  "Categorization",
  "VerticalLayout",
  "HorizontalLayout",
  "Layout"
];

/** The ObjectExpression property named `name`, or undefined. */
function property(objectNode, name) {
  return objectNode.properties.find(
    candidate =>
      candidate.type === "Property" &&
      !candidate.computed &&
      ((candidate.key.type === "Identifier" && candidate.key.name === name) ||
        (candidate.key.type === "Literal" && candidate.key.value === name))
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require every uischema element in a schemas file to carry an i18n key.",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          types: { type: "array", items: { type: "string" }, minItems: 1 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingI18n:
        "The uischema element `{{type}}` needs an `i18n` property naming its translation key."
    }
  },

  create(context) {
    if (!SCHEMA_FILE.test(context.filename)) return {};
    const types = new Set(context.options[0]?.types ?? DEFAULT_TYPES);
    return {
      ObjectExpression(node) {
        const type = property(node, "type");
        if (type?.value.type !== "Literal") return;
        if (typeof type.value.value !== "string") return;
        if (!types.has(type.value.value)) return;
        if (property(node, "i18n")) return;
        context.report({
          node,
          messageId: "missingI18n",
          data: { type: type.value.value }
        });
      }
    };
  }
};
