/**
 * @fileoverview `ui/no-bound-style` — no bound `:style`.
 *
 * A bound `:style` is flagged unless its value is an object literal that sets
 * only CSS custom properties (every key starts with `--`). Classes belong in
 * the template or in `variants.ts`.
 *
 * Valid:   `<div :style="{ '--row-height': `${h}px` }" />`
 * Invalid: `<div :style="{ width: w }" />`, `<div :style="styles" />`
 *
 * A genuine exception is silenced in place with
 * `<!-- eslint-disable-next-line ui/no-bound-style -- <reason> -->`.
 *
 * @module packages/eslint-plugin-ui/rules/no-bound-style
 */

/** The static text of an object key, or null when computed or dynamic. */
function keyText(property) {
  if (property.type !== "Property" || property.computed) return null;
  if (property.key.type === "Identifier") return property.key.name;
  if (property.key.type === "Literal") return String(property.key.value);
  return null;
}

/** True when the expression is an object literal that sets only `--*` keys. */
function setsOnlyCustomProperties(expression) {
  if (expression?.type !== "ObjectExpression") return false;
  return expression.properties.every(property =>
    (keyText(property) ?? "").startsWith("--")
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a bound :style unless it sets only CSS custom properties.",
      recommended: true
    },
    schema: [],
    messages: {
      boundStyle:
        "Do not bind `:style`. Put classes in the template or in variants.ts. A binding that sets only CSS custom properties (`--name`) is allowed."
    }
  },

  create(context) {
    const services = context.sourceCode.parserServices;
    if (!services || !services.defineTemplateBodyVisitor) return {};

    return services.defineTemplateBodyVisitor({
      "VAttribute[directive=true]"(node) {
        if (node.key?.name?.name !== "bind") return;
        if (node.key.argument?.name !== "style") return;
        if (setsOnlyCustomProperties(node.value?.expression)) return;
        context.report({ node, messageId: "boundStyle" });
      }
    });
  }
};
