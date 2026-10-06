/**
 * @fileoverview Self-contained RuleTester spec for `ui/class-strings-placement` (CC26).
 *
 * Run: node --test packages/eslint-plugin-ui/rules/class-strings-placement.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

import rule from "./class-strings-placement.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const vueRuleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { parser: tsParser }
  }
});

test("class-strings-placement", () => {
  ruleTester.run("class-strings-placement", rule, {
    valid: [
      { code: `const label = "Save";` },
      { code: `const url = "https://example.com/some/path";` },
      { code: `const NAMES = { a: "Alice", b: "Bob" };` },
      { code: `let box = "flex items-center";` }
    ],
    invalid: [
      {
        code: `const box = "flex items-center gap-2 p-4";`,
        errors: [{ messageId: "classString" }]
      },
      {
        code: `const wrap = "grid gap-4";`,
        errors: [{ messageId: "classString" }]
      },
      {
        code: `const SIZES = { sm: "p-2 text-sm", lg: "p-4 text-lg" };`,
        errors: [{ messageId: "classRecord" }]
      },
      {
        code: `const TONE = { danger: "bg-red-500 text-white" };`,
        errors: [{ messageId: "classRecord" }]
      }
    ]
  });
});

test("class-strings-placement :class ternary", () => {
  vueRuleTester.run("class-strings-placement", rule, {
    valid: [
      {
        code: `<template><div :class="open ? 'p-4 flex' : cls"></div></template>`
      },
      {
        code: `<template><div :class="open ? cls : 'p-2 grid'"></div></template>`
      },
      {
        code: `<template><div :class="open ? cn('p-4') : cn('p-2')"></div></template>`
      },
      {
        code: `<template><div :title="open ? 'p-4 flex' : 'p-2 grid'"></div></template>`
      },
      { code: `<template><div class="p-4 flex"></div></template>` },
      { code: `<template><div :class="cls"></div></template>` },
      {
        code: `<script setup lang="ts">const label = "Save";</script><template><div></div></template>`
      }
    ],
    invalid: [
      {
        code: `<template><div :class="open ? 'p-4 flex' : 'p-2 grid'"></div></template>`,
        errors: [{ messageId: "classTernary" }]
      },
      {
        code: `<template><div v-bind:class="open ? 'p-4 flex' : 'p-2 grid'"></div></template>`,
        errors: [{ messageId: "classTernary" }]
      },
      {
        code: `<script setup lang="ts">const box = "flex items-center gap-2 p-4";</script><template><div></div></template>`,
        errors: [{ messageId: "classString" }]
      }
    ]
  });
});
