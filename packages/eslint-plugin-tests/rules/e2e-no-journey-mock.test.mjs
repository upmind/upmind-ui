/**
 * @fileoverview RuleTester specs for `tests/e2e-no-journey-mock`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/e2e-no-journey-mock.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./e2e-no-journey-mock.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const FILENAME = "/repo/e2e/checkout.spec.ts";

test("e2e-no-journey-mock", () => {
  ruleTester.run("e2e-no-journey-mock", rule, {
    valid: [
      {
        filename: FILENAME,
        code: `await page.route("**/api/settings", route => route.fulfill({ json: { brand: "x" } }));`
      },
      {
        filename: FILENAME,
        code: `await page.route("**/api/feature-flags", route => route.fulfill({ body: "{}" }));`
      },
      {
        filename: FILENAME,
        code: `await page.route("**/api/orders", route => route.fulfill({ status: 500 }));`
      },
      {
        filename: FILENAME,
        code: `await page.route("**/api/orders", route => route.continue());`
      },
      {
        filename: FILENAME,
        code: `await page.route("**/api/orders", route => route.abort());`
      },
      {
        filename: FILENAME,
        code: `await page.route("**/api/orders", route => route.fulfill({ json: {} }));`,
        options: [{ journeyRoutes: ["invoices"] }]
      },
      {
        filename: FILENAME,
        code: `await page.fulfill({ json: {} });`
      }
    ],
    invalid: [
      {
        filename: FILENAME,
        code: `await page.route("**/api/orders", route => route.fulfill({ json: { id: 1 } }));`,
        errors: [{ messageId: "journeyMock" }]
      },
      {
        filename: FILENAME,
        code: `await page.route("**/api/basket", route => route.fulfill({ body: "{}" }));`,
        errors: [{ messageId: "journeyMock" }]
      },
      {
        filename: FILENAME,
        code: `await page.route("**/api/payments/**", async route => { await route.fulfill({ json: {} }); });`,
        errors: [{ messageId: "journeyMock" }]
      },
      {
        filename: FILENAME,
        code: `await page.route(/\\/orders\\//, function (route) { return route.fulfill({ json: {} }); });`,
        errors: [{ messageId: "journeyMock" }]
      },
      {
        filename: FILENAME,
        code: `await page.route("**/api/invoices", route => route.fulfill({ json: {} }));`,
        options: [{ journeyRoutes: ["invoices"] }],
        errors: [{ messageId: "journeyMock" }]
      }
    ]
  });
});
