/**
 * @fileoverview RuleTester specs for `tests/test-attrs-only-divergence`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/test-attrs-only-divergence.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./test-attrs-only-divergence.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const FILENAME = "/repo/packages/client-vue/src/Basket.ts";

test("test-attrs-only-divergence", () => {
  ruleTester.run("test-attrs-only-divergence", rule, {
    valid: [
      { filename: FILENAME, code: `const attrs = useTestAttrs("pay");` },
      {
        filename: FILENAME,
        code: `const prod = process.env.NODE_ENV === "production";`
      },
      {
        filename: FILENAME,
        code: `const dev = import.meta.env.MODE === "development";`
      },
      {
        filename: FILENAME,
        code: `const url = import.meta.env.VITE_API_URL;`
      },
      { filename: FILENAME, code: `const isTest = 1;` },
      { filename: FILENAME, code: `const config = { isTest: true };` },
      { filename: FILENAME, code: `const agent = navigator.userAgent;` },
      { filename: FILENAME, code: `const x = window.location;` },
      { filename: FILENAME, code: `const mode = process.env.NODE_ENV;` }
    ],
    invalid: [
      {
        filename: FILENAME,
        code: `if (process.env.NODE_ENV === "test") run();`,
        errors: [{ messageId: "testModeBranch" }]
      },
      {
        filename: FILENAME,
        code: `const t = process.env.NODE_ENV !== "testing";`,
        errors: [{ messageId: "testModeBranch" }]
      },
      {
        filename: FILENAME,
        code: `const t = "e2e" == import.meta.env.MODE;`,
        errors: [{ messageId: "testModeBranch" }]
      },
      {
        filename: FILENAME,
        code: `const t = import.meta.env.VITE_E2E_MODE;`,
        errors: [{ messageId: "testModeBranch" }]
      },
      {
        filename: FILENAME,
        code: `const t = import.meta.env.VITE_ENABLE_TEST_HOOKS;`,
        errors: [{ messageId: "testModeBranch" }]
      },
      {
        filename: FILENAME,
        code: `if (isTest) run();`,
        errors: [{ messageId: "testModeBranch", data: { what: "isTest" } }]
      },
      {
        filename: FILENAME,
        code: `const t = isE2E && other;`,
        errors: [{ messageId: "testModeBranch" }]
      },
      {
        filename: FILENAME,
        code: `const t = IS_TEST ? 1 : 2;`,
        errors: [{ messageId: "testModeBranch" }]
      },
      {
        filename: FILENAME,
        code: `if (window.Cypress) run();`,
        errors: [{ messageId: "testModeBranch" }]
      },
      {
        filename: FILENAME,
        code: `if (globalThis.__playwright) run();`,
        errors: [{ messageId: "testModeBranch" }]
      },
      {
        filename: FILENAME,
        code: `if (navigator.webdriver) run();`,
        errors: [{ messageId: "testModeBranch" }]
      }
    ]
  });
});
