/**
 * @fileoverview RuleTester specs for `tests/e2e-spec-file-kebab`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/e2e-spec-file-kebab.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./e2e-spec-file-kebab.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const CODE = `const a = 1;`;

test("e2e-spec-file-kebab", () => {
  ruleTester.run("e2e-spec-file-kebab", rule, {
    valid: [
      { filename: "/repo/e2e/partial-payments.spec.ts", code: CODE },
      { filename: "/repo/e2e/checkout.spec.ts", code: CODE },
      { filename: "/repo/e2e/cart2-totals.spec.ts", code: CODE },
      { filename: "/repo/e2e/PartialPayments.ts", code: CODE },
      { filename: "/repo/e2e/PartialPayments.test.ts", code: CODE }
    ],
    invalid: [
      {
        filename: "/repo/e2e/partialPayments.spec.ts",
        code: CODE,
        errors: [
          {
            messageId: "notKebab",
            data: {
              name: "partialPayments.spec.ts",
              suggestion: "partial-payments"
            }
          }
        ]
      },
      {
        filename: "/repo/e2e/partial_payments.spec.ts",
        code: CODE,
        errors: [{ messageId: "notKebab" }]
      },
      {
        filename: "/repo/e2e/Partial-Payments.spec.ts",
        code: CODE,
        errors: [{ messageId: "notKebab" }]
      },
      {
        filename: "/repo/e2e/partial.payments.spec.ts",
        code: CODE,
        errors: [{ messageId: "notKebab" }]
      }
    ]
  });
});
