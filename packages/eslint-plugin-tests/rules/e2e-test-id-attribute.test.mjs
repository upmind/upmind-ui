/**
 * @fileoverview RuleTester specs for `tests/e2e-test-id-attribute`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/e2e-test-id-attribute.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import vueParser from "vue-eslint-parser";

import rule from "./e2e-test-id-attribute.mjs";

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
    parserOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module"
    }
  }
});

const FILENAME = "/nonexistent-dir/checkout.spec.ts";
const VUE_FILENAME = "/nonexistent-dir/Basket.vue";

test("e2e-test-id-attribute (script)", () => {
  ruleTester.run("e2e-test-id-attribute", rule, {
    valid: [
      { filename: FILENAME, code: `const sel = '[data-testid="total"]';` },
      { filename: FILENAME, code: `page.getByTestId("total");` },
      { filename: FILENAME, code: `const sel = "[data-test-value]";` },
      { filename: FILENAME, code: `const sel = "[data-other=x]";` },
      {
        filename: FILENAME,
        code: `const sel = '[data-test-key="total"]';`,
        options: [{ testIdAttribute: "data-test-key" }]
      },
      {
        filename: FILENAME,
        code: 'const sel = `[data-testid="${id}"]`;'
      }
    ],
    invalid: [
      {
        filename: FILENAME,
        code: `const sel = '[data-qa="total"]';`,
        errors: [
          {
            messageId: "wrongAttribute",
            data: { found: "data-qa", configured: "data-testid" }
          }
        ]
      },
      {
        filename: FILENAME,
        code: `const sel = '[data-cy="total"]';`,
        errors: [{ messageId: "wrongAttribute" }]
      },
      {
        filename: FILENAME,
        code: `const sel = '[data-test-id="total"]';`,
        errors: [{ messageId: "wrongAttribute" }]
      },
      {
        filename: FILENAME,
        code: `const sel = '[data-e2e="total"]';`,
        errors: [{ messageId: "wrongAttribute" }]
      },
      {
        filename: FILENAME,
        code: 'const sel = `[data-e2e="${id}"]`;',
        errors: [{ messageId: "wrongAttribute" }]
      },
      {
        filename: FILENAME,
        code: `const sel = '[data-test="total"]';`,
        errors: [{ messageId: "wrongAttribute" }]
      },
      {
        filename: FILENAME,
        code: `const sel = '[data-testid="total"]';`,
        options: [{ testIdAttribute: "data-test-key" }],
        errors: [
          {
            messageId: "wrongAttribute",
            data: { found: "data-testid", configured: "data-test-key" }
          }
        ]
      },
      {
        filename: FILENAME,
        code: `const sel = '[data-qa="a"] [data-cy="b"]';`,
        errors: [
          { messageId: "wrongAttribute" },
          { messageId: "wrongAttribute" }
        ]
      }
    ]
  });
});

test("e2e-test-id-attribute (vue template)", () => {
  vueRuleTester.run("e2e-test-id-attribute", rule, {
    valid: [
      {
        filename: VUE_FILENAME,
        code: `<template><button data-testid="pay" /></template>`
      },
      {
        filename: VUE_FILENAME,
        code: `<template><button :data-testid="id" /></template>`
      },
      {
        filename: VUE_FILENAME,
        code: `<template><button data-test-key="pay" /></template>`,
        options: [{ testIdAttribute: "data-test-key" }]
      }
    ],
    invalid: [
      {
        filename: VUE_FILENAME,
        code: `<template><button data-qa="pay" /></template>`,
        errors: [{ messageId: "wrongAttribute" }]
      },
      {
        filename: VUE_FILENAME,
        code: `<template><button :data-cy="id" /></template>`,
        errors: [{ messageId: "wrongAttribute" }]
      },
      {
        filename: VUE_FILENAME,
        code: `<template><button data-testid="pay" /></template>`,
        options: [{ testIdAttribute: "data-test-key" }],
        errors: [{ messageId: "wrongAttribute" }]
      }
    ]
  });
});
