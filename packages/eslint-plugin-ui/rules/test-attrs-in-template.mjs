/**
 * @fileoverview `ui/test-attrs-in-template` — composed-component law CC8b.
 *
 * `useTestAttrs(...)` is a template helper: it is CALLED inside the
 * `<template>` (in a `v-bind` or a mustache), never lifted into a
 * `<script setup>` const or wrapped in a helper function. Lifting it breaks the
 * one-call-per-binding test-id contract.
 *
 * vue-eslint-parser visits `<template>` expressions only through the template
 * body visitor; a plain `CallExpression` visitor therefore sees ONLY the
 * `<script>`. Any `useTestAttrs(...)` call this visitor reaches is a
 * script-side call — the violation — whether it is assigned to a const or
 * returned from a wrapper.
 *
 * Valid:   `<template><span v-bind="useTestAttrs({ key: 'x' })" /></template>`
 * Invalid: `<script setup>const x = useTestAttrs({ key: 'x' })</script>`
 * Invalid: `<script setup>function f(){ return useTestAttrs({ key: 'x' }) }</script>`
 *
 * A genuine exception is silenced in place with
 * `// eslint-disable-next-line ui/test-attrs-in-template -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/test-attrs-in-template
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require useTestAttrs() to be called in the template, never in a script const or wrapper (CC8b).",
      recommended: true
    },
    schema: [],
    messages: {
      testAttrsInScript:
        "`useTestAttrs()` must be called inside the `<template>` (in a `v-bind`/mustache), never assigned to a script const or wrapped in a helper (CC8b). If this is intentional, silence it with `// eslint-disable-next-line ui/test-attrs-in-template -- <reason>`."
    }
  },

  create(context) {
    return {
      // A plain CallExpression visitor reaches the <script> only; template
      // calls go through the template body visitor, which this rule omits.
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type === "Identifier" && callee.name === "useTestAttrs") {
          context.report({ node, messageId: "testAttrsInScript" });
        }
      }
    };
  }
};
