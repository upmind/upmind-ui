import test from "node:test";
import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-direct-slots-access.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { parser: tsParser }
  }
});

test("no-direct-slots-access", () => {
  ruleTester.run("no-direct-slots-access", rule, {
    valid: [
      { code: `<template><div v-if="meta.hasFooter">x</div></template>` },
      { code: `<template><div v-show="hasHeader">x</div></template>` }
    ],
    invalid: [
      { code: `<template><div v-if="$slots.footer">x</div></template>`, errors: [{ messageId: "directSlotsAccess" }] },
      { code: `<template><div v-show="!!$slots.header">x</div></template>`, errors: [{ messageId: "directSlotsAccess" }] }
    ]
  });
});
