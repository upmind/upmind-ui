/**
 * @fileoverview Self-contained RuleTester spec for `ui/class-strings-placement` (CC26).
 *
 * Run: node --test packages/eslint-plugin-ui/rules/class-strings-placement.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./class-strings-placement.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("class-strings-placement", () => {
  ruleTester.run("class-strings-placement", rule, {
    valid: [
      { code: `const label = "Save";` },
      { code: `const url = "https://example.com/some/path";` },
      { code: `const NAMES = { a: "Alice", b: "Bob" };` },
      { code: `let box = "flex items-center";` }
    ],
    invalid: [
      {
        code: `const box = "flex items-center gap-2 p-4";`,
        errors: [{ messageId: "classString" }]
      },
      {
        code: `const wrap = "grid gap-4";`,
        errors: [{ messageId: "classString" }]
      },
      {
        code: `const SIZES = { sm: "p-2 text-sm", lg: "p-4 text-lg" };`,
        errors: [{ messageId: "classRecord" }]
      },
      {
        code: `const TONE = { danger: "bg-red-500 text-white" };`,
        errors: [{ messageId: "classRecord" }]
      }
    ]
  });
});
