/**
 * @fileoverview RuleTester specs for `tests/e2e-no-external-goto`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/e2e-no-external-goto.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./e2e-no-external-goto.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const FILENAME = "/repo/e2e/checkout.spec.ts";

test("e2e-no-external-goto", () => {
  ruleTester.run("e2e-no-external-goto", rule, {
    valid: [
      { filename: FILENAME, code: `await page.goto("/cart");` },
      {
        filename: FILENAME,
        code: `await page.goto("http://qa-automation.local:4000/cart");`
      },
      { filename: FILENAME, code: `await page.goto(target);` },
      { filename: FILENAME, code: `await page.goto(\`/cart/\${id}\`);` },
      {
        filename: FILENAME,
        code: `await page.goto("https://pay.example.com/return");`,
        options: [{ allowedOrigins: ["https://pay.example.com"] }]
      },
      { filename: FILENAME, code: `await other.visit("https://example.com");` }
    ],
    invalid: [
      {
        filename: FILENAME,
        code: `await page.goto("https://checkout.stripe.com/pay");`,
        errors: [{ messageId: "externalGoto" }]
      },
      {
        filename: FILENAME,
        code: `await page.goto("//evil.example.com/x");`,
        errors: [{ messageId: "externalGoto" }]
      },
      {
        filename: FILENAME,
        code: "await page.goto(`https://checkout.stripe.com/pay`);",
        errors: [{ messageId: "externalGoto" }]
      },
      {
        filename: FILENAME,
        code: `await page.goto("http://qa-automation.local:4000/cart");`,
        options: [{ allowedOrigins: ["https://pay.example.com"] }],
        errors: [{ messageId: "externalGoto" }]
      },
      {
        filename: FILENAME,
        code: `await page.goto("https://other.example.com/return");`,
        options: [{ allowedOrigins: ["https://pay.example.com"] }],
        errors: [
          {
            messageId: "externalGoto",
            data: { origin: "https://other.example.com" }
          }
        ]
      }
    ]
  });
});
