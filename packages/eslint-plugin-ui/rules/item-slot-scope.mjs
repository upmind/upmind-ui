/**
 * @fileoverview `ui/item-slot-scope` — an item slot passes its item.
 *
 * A `<slot>` inside a `v-for` must bind at least one of the loop's variables
 * (`:item="item"`, `v-bind="item"`, `:id="item.id"`). A slot that binds none
 * gives the consumer no way to render the item.
 *
 * Valid:   `<li v-for="item in items"><slot name="item" :item="item" /></li>`
 * Invalid: `<li v-for="item in items"><slot name="item" /></li>`
 *
 * @module packages/eslint-plugin-ui/rules/item-slot-scope
 */

/** The loop variable names declared by a `v-for` attribute. */
function loopVariables(forAttribute) {
  const expression = forAttribute.value?.expression;
  if (expression?.type !== "VForExpression") return [];
  const names = [];
  for (const pattern of expression.left) {
    if (pattern.type === "Identifier") names.push(pattern.name);
    else collect(pattern, names);
  }
  return names;
}

/** Collect identifiers from a destructuring pattern. */
function collect(pattern, names) {
  if (!pattern || typeof pattern !== "object") return;
  if (pattern.type === "Identifier") {
    names.push(pattern.name);
    return;
  }
  for (const key of ["properties", "elements"]) {
    for (const child of pattern[key] ?? []) collect(child, names);
  }
  if (pattern.value) collect(pattern.value, names);
  if (pattern.argument) collect(pattern.argument, names);
  if (pattern.left) collect(pattern.left, names);
}

/** The nearest enclosing element's `v-for` attribute, scanning up from a slot. */
function enclosingFor(element) {
  for (
    let current = element.parent;
    current && current.type === "VElement";
    current = current.parent
  ) {
    const attribute = current.startTag.attributes.find(
      candidate => candidate.directive && candidate.key.name.name === "for"
    );
    if (attribute) return attribute;
  }
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a <slot> inside a v-for to bind at least one loop variable.",
      recommended: true
    },
    schema: [],
    messages: {
      itemSlotScope:
        'This `<slot>` is inside a `v-for` but binds none of its variables ({{names}}). Pass the item, for example `:item="item"`.'
    }
  },

  create(context) {
    const services = context.sourceCode.parserServices;
    if (!services || !services.defineTemplateBodyVisitor) return {};

    return services.defineTemplateBodyVisitor({
      "VElement[name='slot']"(node) {
        const forAttribute = enclosingFor(node);
        if (!forAttribute) return;
        const names = loopVariables(forAttribute);
        if (names.length === 0) return;
        const bindsLoopVariable = node.startTag.attributes.some(
          attribute =>
            attribute.directive &&
            attribute.value?.references?.some(reference =>
              names.includes(reference.id.name)
            )
        );
        if (!bindsLoopVariable) {
          context.report({
            node: node.startTag,
            messageId: "itemSlotScope",
            data: { names: names.map(name => `\`${name}\``).join(", ") }
          });
        }
      }
    });
  }
};
