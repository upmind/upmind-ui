/**
 * @fileoverview RuleTester specs for `tests/e2e-no-own-http`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/e2e-no-own-http.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./e2e-no-own-http.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const FILENAME = "/repo/e2e/checkout.spec.ts";

test("e2e-no-own-http", () => {
  ruleTester.run("e2e-no-own-http", rule, {
    valid: [
      { filename: FILENAME, code: `await page.goto("/cart");` },
      {
        filename: FILENAME,
        code: `await expect(page.getByTestId("total")).toBeVisible();`
      },
      { filename: FILENAME, code: `const result = cache.get("key");` },
      { filename: FILENAME, code: `const result = store.post("key");` },
      {
        filename: FILENAME,
        code: `const response = await page.waitForResponse("**/api/x");`
      }
    ],
    invalid: [
      {
        filename: FILENAME,
        code: `const res = await fetch("/api/orders");`,
        errors: [{ messageId: "ownHttp" }]
      },
      {
        filename: FILENAME,
        code: `const res = await $fetch("/api/orders");`,
        errors: [{ messageId: "ownHttp" }]
      },
      {
        filename: FILENAME,
        code: `const res = await ofetch("/api/orders");`,
        errors: [{ messageId: "ownHttp" }]
      },
      {
        filename: FILENAME,
        code: `const res = await axios("/api/orders");`,
        errors: [{ messageId: "ownHttp" }]
      },
      {
        filename: FILENAME,
        code: `const res = await axios.get("/api/orders");`,
        errors: [{ messageId: "ownHttp" }]
      },
      {
        filename: FILENAME,
        code: `const xhr = new XMLHttpRequest();`,
        errors: [{ messageId: "ownHttp" }]
      },
      {
        filename: FILENAME,
        code: `const ctx = await request.newContext();`,
        errors: [{ messageId: "ownHttp" }]
      },
      {
        filename: FILENAME,
        code: `const res = await request.post("/api/orders", { data: {} });`,
        errors: [{ messageId: "ownHttp" }]
      },
      {
        filename: FILENAME,
        code: `const res = await page.request.get("/api/orders");`,
        errors: [{ messageId: "ownHttp" }]
      },
      {
        filename: FILENAME,
        code: `const res = await context.request.delete("/api/orders/1");`,
        errors: [{ messageId: "ownHttp" }]
      }
    ]
  });
});
