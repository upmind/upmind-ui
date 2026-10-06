/**
 * @fileoverview RuleTester specs for `tests/no-fixed-wait`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/no-fixed-wait.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-fixed-wait.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const FILENAME = "/repo/e2e/checkout.spec.ts";

test("no-fixed-wait", () => {
  ruleTester.run("no-fixed-wait", rule, {
    valid: [
      {
        filename: FILENAME,
        code: `await page.waitForResponse("**/api/orders");`
      },
      {
        filename: FILENAME,
        code: `await expect(page.getByTestId("total")).toBeVisible();`
      },
      {
        filename: FILENAME,
        code: `const p = new Promise(resolve => resolve(1));`
      },
      {
        filename: FILENAME,
        code: `const p = new Promise((resolve, reject) => { emitter.once("done", resolve); });`
      },
      { filename: FILENAME, code: `setTimeout(callback, 100);` },
      { filename: FILENAME, code: `const p = new Promise();` },
      { filename: FILENAME, code: `const m = new Map();` }
    ],
    invalid: [
      {
        filename: FILENAME,
        code: `await page.waitForTimeout(500);`,
        errors: [{ messageId: "fixedWait" }]
      },
      {
        filename: FILENAME,
        code: `await this.page.waitForTimeout(1);`,
        errors: [{ messageId: "fixedWait" }]
      },
      {
        filename: FILENAME,
        code: `await new Promise(r => setTimeout(r, 500));`,
        errors: [{ messageId: "fixedWait" }]
      },
      {
        filename: FILENAME,
        code: `await new Promise(resolve => setTimeout(resolve, 100));`,
        errors: [{ messageId: "fixedWait" }]
      },
      {
        filename: FILENAME,
        code: `await new Promise(function (r) { setTimeout(r, 5); });`,
        errors: [{ messageId: "fixedWait" }]
      },
      {
        filename: FILENAME,
        code: `await new Promise(resolve => { setTimeout(() => resolve(), 100); });`,
        errors: [{ messageId: "fixedWait" }]
      }
    ]
  });
});
