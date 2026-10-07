import test from "node:test";
import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

import rule from "./single-object-v-bind.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { parser: tsParser }
  }
});

test("single-object-v-bind", () => {
  ruleTester.run("single-object-v-bind", rule, {
    valid: [
      {
        code: `<template><div v-bind="attrs" :class="cls" :id="id" v-bind:title="t"></div></template>`
      },
      {
        code: `<template><div v-bind="a"></div><span v-bind="b"></span></template>`
      },
      {
        code: `<template><div v-bind="{ ...$attrs, ...useTestAttrs({ key: 'x' }) }"></div></template>`
      },
      {
        code: `<template><div :class="cls" :id="id" v-bind:title="t"></div></template>`
      }
    ],
    invalid: [
      {
        code: `<template><div v-bind="a" v-bind="b"></div></template>`,
        errors: [{ messageId: "doubleBind" }]
      },
      {
        code: `<template><div v-bind="a" v-bind="b" v-bind="c"></div></template>`,
        errors: [{ messageId: "doubleBind" }]
      }
    ]
  });
});
