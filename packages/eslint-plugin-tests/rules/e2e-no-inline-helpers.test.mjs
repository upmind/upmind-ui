/**
 * @fileoverview RuleTester specs for `tests/e2e-no-inline-helpers`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/e2e-no-inline-helpers.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./e2e-no-inline-helpers.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const FILENAME = "/repo/e2e/checkout.spec.ts";

test("e2e-no-inline-helpers", () => {
  ruleTester.run("e2e-no-inline-helpers", rule, {
    valid: [
      {
        filename: FILENAME,
        code: `test("pays", async ({ page }) => { await page.goto("/"); });`
      },
      {
        filename: FILENAME,
        code: `import { fillCard } from "../support/card";\ntest("pays", async () => { await fillCard(); });`
      },
      {
        filename: FILENAME,
        code: `test.describe("pay", () => {\n  const fill = async () => {};\n  function other() {}\n  test("a", async () => { await fill(); other(); });\n});`
      },
      { filename: FILENAME, code: `const ORDER_ID = "abc";` },
      { filename: FILENAME, code: `const cases = [1, 2, 3];` }
    ],
    invalid: [
      {
        filename: FILENAME,
        code: `function fillCard() {}\ntest("a", async () => { fillCard(); });`,
        errors: [{ messageId: "inlineHelper", data: { name: "fillCard" } }]
      },
      {
        filename: FILENAME,
        code: `async function fillCard() {}`,
        errors: [{ messageId: "inlineHelper" }]
      },
      {
        filename: FILENAME,
        code: `const fillCard = async () => {};`,
        errors: [{ messageId: "inlineHelper", data: { name: "fillCard" } }]
      },
      {
        filename: FILENAME,
        code: `const fillCard = function () {};`,
        errors: [{ messageId: "inlineHelper" }]
      },
      {
        filename: FILENAME,
        code: `export function fillCard() {}`,
        errors: [{ messageId: "inlineHelper" }]
      },
      {
        filename: FILENAME,
        code: `export const fillCard = () => {};`,
        errors: [{ messageId: "inlineHelper" }]
      },
      {
        filename: FILENAME,
        code: `function a() {}\nconst b = () => {};`,
        errors: [{ messageId: "inlineHelper" }, { messageId: "inlineHelper" }]
      }
    ]
  });
});
