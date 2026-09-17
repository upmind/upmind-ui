/**
 * @fileoverview RuleTester specs for `ui/define-options-name` (CC1a).
 *
 * Run: node --test packages/eslint-plugin-ui/rules/define-options-name.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import defineOptionsName from "./define-options-name.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("define-options-name", () => {
  ruleTester.run("define-options-name", defineOptionsName, {
    valid: [
      // String-literal name.
      { code: `defineOptions({ name: "Tabs" });` },
      // String-literal name alongside other options.
      { code: `defineOptions({ name: "Tabs", inheritAttrs: false });` },
      // No defineOptions call at all — out of scope for this rule.
      { code: `const x = 1;` },
      // Not a defineOptions call — irrelevant.
      { code: `otherFn({ inheritAttrs: false });` }
    ],
    invalid: [
      // No name property.
      {
        code: `defineOptions({ inheritAttrs: false });`,
        errors: [{ messageId: "missingName" }]
      },
      // Empty options object.
      {
        code: `defineOptions({});`,
        errors: [{ messageId: "missingName" }]
      },
      // Non-literal (variable) name.
      {
        code: `defineOptions({ name: someVar });`,
        errors: [{ messageId: "nonLiteralName" }]
      },
      // Non-literal (template literal) name.
      {
        code: "defineOptions({ name: `Tab-${suffix}` });",
        errors: [{ messageId: "nonLiteralName" }]
      }
    ]
  });
});
