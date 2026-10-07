import test from "node:test";
import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-bound-style.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { parser: tsParser }
  }
});

test("no-bound-style", () => {
  ruleTester.run("no-bound-style", rule, {
    valid: [
      {
        code: "<template><div :style=\"{ '--row-height': `${h}px` }\"></div></template>"
      },
      {
        code: `<template><div :style="{ '--a': a, '--b': b }"></div></template>`
      },
      { code: `<template><div style="width: 10px"></div></template>` },
      { code: `<template><div :class="cls"></div></template>` },
      { code: `<template><div :width="w"></div></template>` }
    ],
    invalid: [
      {
        code: `<template><div :style="{ width: w }"></div></template>`,
        errors: [{ messageId: "boundStyle" }]
      },
      {
        code: `<template><div :style="styles"></div></template>`,
        errors: [{ messageId: "boundStyle" }]
      },
      {
        code: `<template><div :style="{ '--a': a, width: w }"></div></template>`,
        errors: [{ messageId: "boundStyle" }]
      },
      {
        code: `<template><div v-bind:style="{ width: w }"></div></template>`,
        errors: [{ messageId: "boundStyle" }]
      },
      {
        code: `<template><div :style="[base, { '--a': a }]"></div></template>`,
        errors: [{ messageId: "boundStyle" }]
      }
    ]
  });
});
