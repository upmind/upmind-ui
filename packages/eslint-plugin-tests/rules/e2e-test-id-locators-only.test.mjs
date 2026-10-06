/**
 * @fileoverview RuleTester specs for `tests/e2e-test-id-locators-only`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/e2e-test-id-locators-only.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./e2e-test-id-locators-only.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const FILENAME = "/repo/e2e/checkout.spec.ts";

test("e2e-test-id-locators-only", () => {
  ruleTester.run("e2e-test-id-locators-only", rule, {
    valid: [
      { filename: FILENAME, code: `page.getByTestId("pay");` },
      { filename: FILENAME, code: `page.getByRole("button");` },
      {
        filename: FILENAME,
        code: `page.frameLocator("iframe").locator('[name="cardnumber"]');`
      },
      {
        filename: FILENAME,
        code: `page.getByTestId("row").filter({ has: page.getByTestId("cell") });`
      },
      { filename: FILENAME, code: `page.locator("[data-testid=pay]");` },
      { filename: FILENAME, code: `await page.click("#pay");` },
      { filename: FILENAME, code: `await page.fill("input.card", "1");` },
      { filename: FILENAME, code: `items.filter(item => item.ok);` }
    ],
    invalid: [
      {
        filename: FILENAME,
        code: `page.getByText("Pay now");`,
        errors: [{ messageId: "textLocator", data: { what: "getByText" } }]
      },
      {
        filename: FILENAME,
        code: `page.getByLabel("Card number");`,
        errors: [{ messageId: "textLocator" }]
      },
      {
        filename: FILENAME,
        code: `page.getByPlaceholder("Card number");`,
        errors: [{ messageId: "textLocator" }]
      },
      {
        filename: FILENAME,
        code: `page.getByAltText("Logo");`,
        errors: [{ messageId: "textLocator" }]
      },
      {
        filename: FILENAME,
        code: `page.getByTitle("Close");`,
        errors: [{ messageId: "textLocator" }]
      },
      {
        filename: FILENAME,
        code: `page.getByRole("button", { name: "Pay" });`,
        errors: [{ messageId: "roleName" }]
      },
      {
        filename: FILENAME,
        code: `page.getByTestId("row").filter({ hasText: "Total" });`,
        errors: [{ messageId: "hasText" }]
      },
      {
        filename: FILENAME,
        code: `page.getByTestId("row").filter({ hasNotText: "Total" });`,
        errors: [{ messageId: "hasText" }]
      },
      {
        filename: FILENAME,
        code: `page.locator("text=Pay");`,
        errors: [{ messageId: "textSelector" }]
      },
      {
        filename: FILENAME,
        code: `page.locator("button:has-text('Pay')");`,
        errors: [{ messageId: "textSelector" }]
      },
      {
        filename: FILENAME,
        code: `page.locator("form >> text=Pay");`,
        errors: [{ messageId: "textSelector" }]
      },
      {
        filename: FILENAME,
        code: `await page.click("text=Save");`,
        errors: [{ messageId: "textSelector" }]
      }
    ]
  });
});
