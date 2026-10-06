import test from "node:test";
import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

import rule from "./v-html-sanitised.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { parser: tsParser }
  }
});

const custom = [{ sanitisers: ["sanitizeHtml"] }];

test("v-html-sanitised", () => {
  ruleTester.run("v-html-sanitised", rule, {
    valid: [
      {
        code: `<template><div v-html="DOMPurify.sanitize(html)"></div></template>`
      },
      { code: `<template><div>{{ html }}</div></template>` },
      { code: `<template><div :title="html"></div></template>` },
      {
        code: `<template><div v-html="sanitizeHtml(html)"></div></template>`,
        options: custom
      },
      {
        code: `<template><div v-html="DOMPurify.sanitize(html)"></div></template>`,
        options: [{ sanitisers: ["DOMPurify.sanitize", "sanitizeHtml"] }]
      }
    ],
    invalid: [
      {
        code: `<template><div v-html="html"></div></template>`,
        errors: [{ messageId: "unsanitised" }]
      },
      {
        code: `<template><div v-html="clean"></div></template>`,
        errors: [{ messageId: "unsanitised" }]
      },
      {
        code: `<template><div v-html="DOMPurify.sanitize"></div></template>`,
        errors: [{ messageId: "unsanitised" }]
      },
      {
        code: `<template><div v-html="sanitizeHtml(html)"></div></template>`,
        errors: [{ messageId: "unsanitised" }]
      },
      {
        code: `<template><div v-html="DOMPurify.sanitize(html)"></div></template>`,
        options: custom,
        errors: [{ messageId: "unsanitised" }]
      },
      {
        code: `<template><div v-html="html"></div><p v-html="raw"></p></template>`,
        errors: [{ messageId: "unsanitised" }, { messageId: "unsanitised" }]
      }
    ]
  });
});
