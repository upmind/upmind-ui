/**
 * @fileoverview `ui/no-direct-slots-access` — composed-component law CC14.
 *
 * A composed main must not reach into `$slots` directly in its `<template>`
 * (`v-if="$slots.footer"`, `v-show="!!$slots.header"`). Presence of a slot is
 * derived once into a named `meta` flag (`meta.hasFooter`) and the template
 * reads the flag, so the slot-presence logic stays in one place.
 *
 * Valid:   `v-if="meta.hasFooter"`
 * Invalid: `v-if="$slots.footer"`, `v-show="!!$slots.header"`
 *
 * A genuine exception is silenced in place with
 * `// eslint-disable-next-line ui/no-direct-slots-access -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/no-direct-slots-access
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow direct `$slots.x` access in a composed component template; derive a `meta` flag (CC14).",
      recommended: true
    },
    schema: [],
    messages: {
      directSlotsAccess:
        "A template must not read `$slots` directly (CC14); derive a named `meta` flag (e.g. `meta.hasFooter`) and read that instead. If this is intentional, silence it with `// eslint-disable-next-line ui/no-direct-slots-access -- <reason>`."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const services = sourceCode.parserServices;
    if (!services || !services.defineTemplateBodyVisitor) return {};

    return services.defineTemplateBodyVisitor({
      // `$slots.footer` and `$slots['footer']` — a member access off `$slots`.
      MemberExpression(node) {
        if (
          node.object?.type === "Identifier" &&
          node.object.name === "$slots"
        ) {
          context.report({ node, messageId: "directSlotsAccess" });
        }
      }
    });
  }
};
