/**
 * @fileoverview RuleTester specs for `tests/e2e-unroute-cleanup`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/e2e-unroute-cleanup.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./e2e-unroute-cleanup.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const FILENAME = "/repo/e2e/checkout.spec.ts";

const CLEANUP = `test.afterEach(async ({ page }) => {\n  await page.unrouteAll({ behavior: "wait" });\n});`;

test("e2e-unroute-cleanup", () => {
  ruleTester.run("e2e-unroute-cleanup", rule, {
    valid: [
      {
        filename: FILENAME,
        code: `test("a", async ({ page }) => { await page.goto("/"); });`
      },
      {
        filename: FILENAME,
        code: `${CLEANUP}\ntest("a", async ({ page }) => { await page.route("**/api/settings", r => r.continue()); });`
      },
      {
        filename: FILENAME,
        code: `test("a", async ({ page }) => { await page.route("**/api/settings", r => r.continue()); });\n${CLEANUP}`
      },
      {
        filename: FILENAME,
        code: `test.describe("x", () => {\n  test.afterEach(async ({ page }) => {\n    await page.unrouteAll({ behavior: "wait" });\n  });\n  test("a", async ({ page }) => { await page.route("**/s", r => r.continue()); });\n});`
      },
      { filename: FILENAME, code: `${CLEANUP}` }
    ],
    invalid: [
      {
        filename: FILENAME,
        code: `test("a", async ({ page }) => { await page.route("**/api/settings", r => r.continue()); });`,
        errors: [{ messageId: "noUnroute" }]
      },
      {
        filename: FILENAME,
        code: `test.afterEach(async ({ page }) => { await page.unrouteAll(); });\ntest("a", async ({ page }) => { await page.route("**/s", r => r.continue()); });`,
        errors: [{ messageId: "noUnroute" }]
      },
      {
        filename: FILENAME,
        code: `test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: "ignoreErrors" }); });\ntest("a", async ({ page }) => { await page.route("**/s", r => r.continue()); });`,
        errors: [{ messageId: "noUnroute" }]
      },
      {
        filename: FILENAME,
        code: `test("a", async ({ page }) => {\n  await page.route("**/s", r => r.continue());\n  await page.unrouteAll({ behavior: "wait" });\n});`,
        errors: [{ messageId: "noUnroute" }]
      },
      {
        filename: FILENAME,
        code: `test.afterEach(async ({ page }) => { await page.goto("/"); });\ntest("a", async ({ page }) => { await page.route("**/s", r => r.continue()); });`,
        errors: [{ messageId: "noUnroute" }]
      },
      {
        filename: FILENAME,
        code: `test("a", async ({ page }) => {\n  await page.route("**/a", r => r.continue());\n  await page.route("**/b", r => r.continue());\n});`,
        errors: [{ messageId: "noUnroute" }]
      }
    ]
  });
});
