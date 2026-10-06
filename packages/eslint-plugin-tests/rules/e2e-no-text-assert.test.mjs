/**
 * @fileoverview RuleTester specs for `tests/e2e-no-text-assert`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/e2e-no-text-assert.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./e2e-no-text-assert.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const FILENAME = "/repo/e2e/checkout.spec.ts";

test("e2e-no-text-assert", () => {
  ruleTester.run("e2e-no-text-assert", rule, {
    valid: [
      {
        filename: FILENAME,
        code: `await expect(page.getByTestId("total")).toBeVisible();`
      },
      {
        filename: FILENAME,
        code: `await expect(page.getByTestId("total")).toHaveValue("10");`
      },
      {
        filename: FILENAME,
        code: `await expect(page.getByTestId("total")).toHaveAttribute("data-test-value", "10");`
      },
      {
        filename: FILENAME,
        code: `const text = await page.getByTestId("total").textContent();`
      },
      { filename: FILENAME, code: `helper.toHaveText("x");` }
    ],
    invalid: [
      {
        filename: FILENAME,
        code: `await expect(page.getByTestId("total")).toHaveText("Total");`,
        errors: [{ messageId: "textAssert", data: { matcher: "toHaveText" } }]
      },
      {
        filename: FILENAME,
        code: `await expect(page.getByTestId("total")).toContainText("Tot");`,
        errors: [
          { messageId: "textAssert", data: { matcher: "toContainText" } }
        ]
      },
      {
        filename: FILENAME,
        code: `await expect(page.getByTestId("total")).not.toHaveText("Total");`,
        errors: [{ messageId: "textAssert" }]
      },
      {
        filename: FILENAME,
        code: `await expect.soft(page.getByTestId("total")).toContainText("Tot");`,
        errors: [{ messageId: "textAssert" }]
      }
    ]
  });
});
