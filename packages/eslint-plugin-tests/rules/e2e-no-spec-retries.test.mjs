/**
 * @fileoverview RuleTester specs for `tests/e2e-no-spec-retries`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/e2e-no-spec-retries.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./e2e-no-spec-retries.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const SPEC = "/repo/e2e/checkout.spec.ts";
const CONFIG = "/repo/e2e/playwright.config.ts";

test("e2e-no-spec-retries", () => {
  ruleTester.run("e2e-no-spec-retries", rule, {
    valid: [
      { filename: SPEC, code: `test.describe.configure({ mode: "serial" });` },
      { filename: SPEC, code: `test.use({ locale: "en-GB" });` },
      {
        filename: SPEC,
        code: `test("a", async ({}, testInfo) => { console.log(testInfo.status); });`
      },
      { filename: SPEC, code: `const retries = 3;` },
      { filename: CONFIG, code: `export default { retries: 1 };` },
      { filename: CONFIG, code: `export default { retries: 0 };` },
      {
        filename: CONFIG,
        code: `export default defineConfig({ retries: process.env.CI ? 2 : 0 });`
      }
    ],
    invalid: [
      {
        filename: SPEC,
        code: `test.describe.configure({ retries: 2 });`,
        errors: [{ messageId: "specRetries" }]
      },
      {
        filename: SPEC,
        code: `test.use({ retries: 0 });`,
        errors: [{ messageId: "specRetries" }]
      },
      {
        filename: SPEC,
        code: `test("a", async ({}, testInfo) => { if (testInfo.retry) await x(); });`,
        errors: [{ messageId: "retryBranch" }]
      },
      {
        filename: SPEC,
        code: `test("a", async () => { if (test.info().retry > 0) await x(); });`,
        errors: [{ messageId: "retryBranch" }]
      },
      {
        filename: CONFIG,
        code: `export default { retries: 2 };`,
        errors: [{ messageId: "configRetries", data: { value: 2, max: 1 } }]
      },
      {
        filename: CONFIG,
        code: `export default defineConfig({ retries: 5 });`,
        errors: [{ messageId: "configRetries" }]
      }
    ]
  });
});
