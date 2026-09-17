/**
 * @fileoverview RuleTester specs for `ui/test-attrs-key` (CC9/CC10).
 *
 * Run: node --test packages/eslint-plugin-ui/rules/test-attrs-key.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import testAttrsKey from "./test-attrs-key.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("test-attrs-key", () => {
  ruleTester.run("test-attrs-key", testAttrsKey, {
    valid: [
      // String-literal key, identity carried in value.
      {
        code: `useTestAttrs({ key: "tab-item", value: [item.value, index] });`
      },
      // Static key form is fine.
      { code: `useTestAttrs({ key: "list-empty" });` },
      // Not a useTestAttrs call — irrelevant.
      { code: `otherFn({ value: x });` },
      // No object argument — nothing to check.
      { code: `useTestAttrs();` }
    ],
    invalid: [
      // No key property at all.
      {
        code: `useTestAttrs({ value: x });`,
        errors: [{ messageId: "missingKey" }]
      },
      // Shorthand property, still no key.
      {
        code: `useTestAttrs({ dataAttrs });`,
        errors: [{ messageId: "missingKey" }]
      },
      // Interpolated (template literal) key.
      {
        code: "useTestAttrs({ key: `tab-${item.value}` });",
        errors: [{ messageId: "nonLiteralKey" }]
      },
      // Expression key.
      {
        code: `useTestAttrs({ key: item.value });`,
        errors: [{ messageId: "nonLiteralKey" }]
      }
    ]
  });
});
