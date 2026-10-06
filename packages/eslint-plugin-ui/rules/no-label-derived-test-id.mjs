/**
 * @fileoverview `ui/no-label-derived-test-id` — a test id is a deliberate,
 * stable name, never derived from translated text (P9, `e2e-semantic-test-id`).
 *
 * A primitive that defaults its test id to `kebabCase(label)` gives a control
 * with no explicit id a different id in every locale (`button-add-to-basket`
 * in English, `button-ajouter-au-panier` in French), and the test times out in
 * every locale but English.
 *
 * Flags a `kebabCase(...)` call whose argument ends in a label or text name
 * (`label`, `text`, `title`, `caption`, `placeholder`, `heading`,
 * `description`) when the result feeds a test id: a `data-test-key` or
 * `data-test-value` property or attribute, a `data-attrs` / `dataAttrs`
 * binding, a `testId` / `testKey` property, or the `key` / `value` of a
 * `useTestAttrs({ ... })` call. An i18n key is stable and is not flagged.
 *
 * Valid:   `useTestAttrs({ key: "show-more-payment-options" })`
 * Invalid: `useTestAttrs({ key: kebabCase(props.label) })`
 *
 * @module packages/eslint-plugin-ui/rules/no-label-derived-test-id
 */

const KEBAB_FUNCTIONS = new Set(["kebabCase", "kebab"]);
const LABEL_NAMES = new Set([
  "label",
  "text",
  "title",
  "caption",
  "placeholder",
  "heading",
  "description"
]);
const TEST_ID_PROPERTIES = new Set([
  "data-test-key",
  "data-test-value",
  "testId",
  "testKey"
]);
const TEST_ID_ATTRIBUTES = new Set([
  "data-test-key",
  "data-test-value",
  "data-attrs",
  "dataAttrs"
]);

function lastName(node) {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression" && !node.computed) {
    return node.property.type === "Identifier" ? node.property.name : null;
  }
  if (node.type === "ChainExpression") return lastName(node.expression);
  return null;
}

function keyName(property) {
  if (property.computed) return null;
  if (property.key.type === "Identifier") return property.key.name;
  if (property.key.type === "Literal") return String(property.key.value);
  return null;
}

/** True when the call's result feeds a test id, judged from its ancestors. */
function feedsTestId(call) {
  let current = call.parent;
  let child = call;
  while (current) {
    if (current.type === "Property" && current.value === child) {
      const name = keyName(current);
      if (name && TEST_ID_PROPERTIES.has(name)) return true;
      if (name === "key" || name === "value") {
        const owner = current.parent?.parent;
        if (
          owner?.type === "CallExpression" &&
          owner.callee.type === "Identifier" &&
          owner.callee.name === "useTestAttrs"
        ) {
          return true;
        }
      }
    }
    if (current.type === "VAttribute") {
      const name = current.directive
        ? current.key.argument?.name
        : current.key.name;
      return typeof name === "string" && TEST_ID_ATTRIBUTES.has(name);
    }
    child = current;
    current = current.parent;
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "A test id is never derived from a label or text prop (kebabCase(label)).",
      recommended: true
    },
    schema: [],
    messages: {
      labelDerived:
        "This test id is derived from `{{source}}`, which is translated text, so it changes in each locale. Use a deliberate semantic id, or a stable id, value or code."
    }
  },

  create(context) {
    const visitor = {
      CallExpression(node) {
        if (
          node.callee.type !== "Identifier" ||
          !KEBAB_FUNCTIONS.has(node.callee.name)
        ) {
          return;
        }
        const argument = node.arguments[0];
        const name = lastName(argument);
        if (name && LABEL_NAMES.has(name) && feedsTestId(node)) {
          context.report({
            node,
            messageId: "labelDerived",
            data: { source: context.sourceCode.getText(argument) }
          });
        }
      }
    };

    const services = context.sourceCode.parserServices;
    if (!services?.defineTemplateBodyVisitor) return visitor;
    return services.defineTemplateBodyVisitor(visitor, visitor);
  }
};
