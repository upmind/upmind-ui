import test from "node:test";
import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

import rule from "./pascal-case-file-name.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { parser: tsParser }
  }
});

const dir = "/repo/packages/modules-card/src/components";
const template = `<template><div></div></template>`;

test("pascal-case-file-name", () => {
  ruleTester.run("pascal-case-file-name", rule, {
    valid: [
      { code: template, filename: `${dir}/ProductCard.vue` },
      { code: template, filename: `${dir}/Card.vue` },
      { code: template, filename: `${dir}/Card2.vue` },
      { code: `const a = 1;`, filename: `${dir}/product-card.ts` }
    ],
    invalid: [
      {
        code: template,
        filename: `${dir}/product-card.vue`,
        errors: [
          { messageId: "notPascalCase", data: { file: "product-card.vue" } }
        ]
      },
      {
        code: template,
        filename: `${dir}/productCard.vue`,
        errors: [
          { messageId: "notPascalCase", data: { file: "productCard.vue" } }
        ]
      },
      {
        code: template,
        filename: `${dir}/Product_Card.vue`,
        errors: [
          { messageId: "notPascalCase", data: { file: "Product_Card.vue" } }
        ]
      },
      {
        code: template,
        filename: `${dir}/card.vue`,
        errors: [{ messageId: "notPascalCase" }]
      }
    ]
  });
});
