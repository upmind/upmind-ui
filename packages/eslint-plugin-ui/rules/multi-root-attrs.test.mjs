import test from "node:test";
import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

import rule from "./multi-root-attrs.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { parser: tsParser }
  }
});

test("multi-root-attrs", () => {
  ruleTester.run("multi-root-attrs", rule, {
    valid: [
      { code: `<template><a></a></template>` },
      { code: `<template><a v-bind="$attrs"></a><b></b></template>` },
      { code: `<template><a></a><b v-bind="$attrs"></b></template>` },
      {
        code: `<script setup lang="ts">defineOptions({ inheritAttrs: false });</script><template><a></a><b></b></template>`
      },
      {
        code: `<script lang="ts">export default { inheritAttrs: false };</script><template><a></a><b></b></template>`
      },
      { code: `<template><a v-if="x"></a><b v-else></b></template>` },
      {
        code: `<template><a v-if="x"></a><b v-else-if="y"></b><c v-else></c></template>`
      },
      { code: `<script setup lang="ts">const a = 1;</script>` }
    ],
    invalid: [
      {
        code: `<template><a></a><b></b></template>`,
        errors: [{ messageId: "multiRoot", data: { count: "2" } }]
      },
      {
        code: `<template><a></a><b></b><c></c></template>`,
        errors: [{ messageId: "multiRoot", data: { count: "3" } }]
      },
      {
        code: `<template><a v-if="x"></a><b v-else></b><c></c></template>`,
        errors: [{ messageId: "multiRoot", data: { count: "2" } }]
      },
      {
        code: `<template><a v-bind="other"></a><b></b></template>`,
        errors: [{ messageId: "multiRoot" }]
      },
      {
        code: `<template><a v-bind:title="$attrs"></a><b></b></template>`,
        errors: [{ messageId: "multiRoot" }]
      }
    ]
  });
});
