import test from "node:test";
import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

import rule from "./test-attrs-in-template.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { parser: tsParser }
  }
});

test("test-attrs-in-template", () => {
  ruleTester.run("test-attrs-in-template", rule, {
    valid: [
      {
        code: `<template><span v-bind="useTestAttrs({ key: 'x' })" /></template>`
      },
      { code: `<script setup>const x = 1</script>` }
    ],
    invalid: [
      {
        code: `<script setup>const x = useTestAttrs({ key: 'x' })</script>`,
        errors: [{ messageId: "testAttrsInScript" }]
      },
      {
        code: `<script setup>function f(){ return useTestAttrs({ key: 'x' }) }</script>`,
        errors: [{ messageId: "testAttrsInScript" }]
      }
    ]
  });
});
