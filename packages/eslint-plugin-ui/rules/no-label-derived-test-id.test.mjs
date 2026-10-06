import test from "node:test";
import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-label-derived-test-id.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { parser: tsParser }
  }
});

test("no-label-derived-test-id", () => {
  ruleTester.run("no-label-derived-test-id", rule, {
    valid: [
      {
        code: `<script setup lang="ts">const attrs = { "data-test-key": "row-item" };</script>`
      },
      {
        code: `<script setup lang="ts">const attrs = { "data-test-key": kebabCase(item.id) };</script>`
      },
      {
        code: `<script setup lang="ts">const attrs = { "data-test-key": kebabCase(element.i18n) };</script>`
      },
      {
        code: `<script setup lang="ts">const id = kebabCase(props.label);</script>`
      },
      {
        code: `<template><div :class="kebabCase(props.label)"></div></template>`
      },
      { code: `<template><div :data-test-key="'row-' + id"></div></template>` }
    ],
    invalid: [
      {
        code: `<script setup lang="ts">const attrs = { "data-test-key": kebabCase(props.label) };</script>`,
        errors: [{ messageId: "labelDerived" }]
      },
      {
        code: `<script setup lang="ts">const attrs = { testId: kebab(item.title) };</script>`,
        errors: [{ messageId: "labelDerived" }]
      },
      {
        code: `<script setup lang="ts">const attrs = useTestAttrs({ key: kebabCase(field.placeholder) });</script>`,
        errors: [{ messageId: "labelDerived" }]
      },
      {
        code: `<script setup lang="ts">const attrs = useTestAttrs({ value: kebabCase(section.heading) });</script>`,
        errors: [{ messageId: "labelDerived" }]
      },
      {
        code: `<template><div :data-test-key="kebabCase(props.label)"></div></template>`,
        errors: [{ messageId: "labelDerived" }]
      },
      {
        code: `<template><div :data-attrs="kebabCase(item.description)"></div></template>`,
        errors: [{ messageId: "labelDerived" }]
      }
    ]
  });
});
