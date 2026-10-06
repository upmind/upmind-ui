/**
 * @fileoverview RuleTester specs for `tests/e2e-serial-needs-reason`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/e2e-serial-needs-reason.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./e2e-serial-needs-reason.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const FILENAME = "/repo/e2e/checkout.spec.ts";

test("e2e-serial-needs-reason", () => {
  ruleTester.run("e2e-serial-needs-reason", rule, {
    valid: [
      {
        filename: FILENAME,
        code: `// tests share one basket\ntest.describe.configure({ mode: "serial" });`
      },
      {
        filename: FILENAME,
        code: `// tests share one basket\ntest.describe.serial("flow", () => {});`
      },
      {
        filename: FILENAME,
        code: `test.describe("flow", () => {\n  // order depends on the previous step\n  test.describe.configure({ mode: "serial" });\n});`
      },
      {
        filename: FILENAME,
        code: `test.describe.configure({ timeout: 5000 });`
      },
      { filename: FILENAME, code: `test.describe("flow", () => {});` },
      { filename: FILENAME, code: `test.describe.parallel("flow", () => {});` }
    ],
    invalid: [
      {
        filename: FILENAME,
        code: `test.describe.configure({ mode: "serial" });`,
        errors: [{ messageId: "serialNoReason" }]
      },
      {
        filename: FILENAME,
        code: `test.describe.serial("flow", () => {});`,
        errors: [{ messageId: "serialNoReason" }]
      },
      {
        filename: FILENAME,
        code: `// tests share one basket\n\ntest.describe.configure({ mode: "serial" });`,
        errors: [{ messageId: "serialNoReason" }]
      },
      {
        filename: FILENAME,
        code: `test.describe.configure({ mode: "parallel" });`,
        errors: [{ messageId: "parallelMode" }]
      },
      {
        filename: FILENAME,
        code: `// a comment\ntest.describe.configure({ mode: "parallel" });`,
        errors: [{ messageId: "parallelMode" }]
      }
    ]
  });
});
