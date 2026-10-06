/**
 * @fileoverview `ui/multi-root-attrs` — a multi-root template binds `$attrs`.
 *
 * A template with more than one root element needs `v-bind="$attrs"` on one
 * root, or `inheritAttrs: false`. A `v-if` / `v-else-if` / `v-else` chain
 * counts as one root.
 *
 * Valid:   `<template><a v-bind="$attrs" /><b /></template>`
 * Invalid: `<template><a /><b /></template>`
 *
 * @module packages/eslint-plugin-ui/rules/multi-root-attrs
 */

/** True when an element carries `v-else` or `v-else-if`. */
function continuesChain(element) {
  return element.startTag.attributes.some(
    attribute =>
      attribute.directive &&
      (attribute.key.name.name === "else" ||
        attribute.key.name.name === "else-if")
  );
}

/** True when an element has `v-bind="$attrs"`. */
function bindsAttrs(element, sourceCode) {
  return element.startTag.attributes.some(
    attribute =>
      attribute.directive &&
      attribute.key.name.name === "bind" &&
      !attribute.key.argument &&
      attribute.value?.expression &&
      sourceCode.getText(attribute.value.expression).trim() === "$attrs"
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a multi-root template to bind $attrs or disable attribute inheritance.",
      recommended: true
    },
    schema: [],
    messages: {
      multiRoot:
        'This template has {{count}} root elements. Add `v-bind="$attrs"` to one root, or set `inheritAttrs: false`.'
    }
  },

  create(context) {
    const sourceCode = context.sourceCode;
    const services = sourceCode.parserServices;
    if (!services || !services.defineTemplateBodyVisitor) return {};

    return {
      Program() {
        const fragment = services.getDocumentFragment?.();
        const template = fragment?.children.find(
          child => child.type === "VElement" && child.name === "template"
        );
        if (!template) return;
        const roots = template.children.filter(
          child => child.type === "VElement"
        );
        const rootCount = roots.filter(root => !continuesChain(root)).length;
        if (rootCount < 2) return;
        if (roots.some(root => bindsAttrs(root, sourceCode))) return;
        if (/inheritAttrs\s*:\s*false/.test(sourceCode.text)) return;
        context.report({
          loc: template.startTag.loc,
          messageId: "multiRoot",
          data: { count: String(rootCount) }
        });
      }
    };
  }
};
