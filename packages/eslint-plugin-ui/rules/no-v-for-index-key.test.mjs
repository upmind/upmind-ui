import test from "node:test";
import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-v-for-index-key.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { parser: tsParser }
  }
});

test("no-v-for-index-key", () => {
  ruleTester.run("no-v-for-index-key", rule, {
    valid: [
      { code: `<template><li v-for="(item, i) in items" :key="item.id">{{ item }}</li></template>` },
      { code: `<template><li v-for="item in items" :key="item.id">{{ item }}</li></template>` }
    ],
    invalid: [
      { code: `<template><li v-for="(item, i) in items" :key="i">{{ item }}</li></template>`, errors: [{ messageId: "indexKey" }] },
      { code: `<template><li v-for="(item, index) in items" :key="index">{{ item }}</li></template>`, errors: [{ messageId: "indexKey" }] }
    ]
  });
});
