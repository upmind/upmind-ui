import test from "node:test";
import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

import rule from "./simple-template-conditions.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { parser: tsParser }
  }
});

test("simple-template-conditions", () => {
  ruleTester.run("simple-template-conditions", rule, {
    valid: [
      { code: `<template><div v-if="meta.open">x</div></template>` },
      { code: `<template><div v-if="a && b">x</div></template>` },
      { code: `<template><div v-show="a || b">x</div></template>` },
      { code: `<template><div v-if="a ?? b ?? c">x</div></template>` }
    ],
    invalid: [
      { code: `<template><div v-if="a && b && c">x</div></template>`, errors: [{ messageId: "tooManyClauses" }] },
      { code: `<template><div v-if="a || b || c">x</div></template>`, errors: [{ messageId: "tooManyClauses" }] },
      { code: `<template><div v-show="a && b && c">x</div></template>`, errors: [{ messageId: "tooManyClauses" }] }
    ]
  });
});
