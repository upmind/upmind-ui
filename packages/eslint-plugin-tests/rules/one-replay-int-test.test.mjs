/**
 * @fileoverview RuleTester specs for `tests/one-replay-int-test`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/one-replay-int-test.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./one-replay-int-test.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const CODE = `const a = 1;`;
const MODULES = "/repo/packages/headless/src/modules";

test("one-replay-int-test", () => {
  ruleTester.run("one-replay-int-test", rule, {
    valid: [
      {
        filename: `${MODULES}/auth/__tests__/auth.replay.int.test.ts`,
        code: CODE
      },
      {
        filename: `${MODULES}/auth/auth.replay.int.test.ts`,
        code: CODE
      },
      {
        filename: `${MODULES}/auth/__tests__/auth.unit.test.ts`,
        code: CODE
      },
      {
        filename: `${MODULES}/auth/__tests__/auth.client.unit.test.ts`,
        code: CODE
      },
      { filename: `${MODULES}/auth/auth.ts`, code: CODE }
    ],
    invalid: [
      {
        filename: `${MODULES}/auth/__tests__/auth.int.test.ts`,
        code: CODE,
        errors: [
          {
            messageId: "notReplay",
            data: {
              name: "auth.int.test.ts",
              expected: "auth.replay.int.test.ts"
            }
          }
        ]
      },
      {
        filename: `${MODULES}/auth/__tests__/refresh.replay.int.test.ts`,
        code: CODE,
        errors: [{ messageId: "notReplay" }]
      },
      {
        filename: `${MODULES}/auth/__tests__/auth.client.int.test.ts`,
        code: CODE,
        errors: [{ messageId: "notReplay" }]
      },
      {
        filename: `${MODULES}/auth/token.int.test.ts`,
        code: CODE,
        errors: [
          {
            messageId: "notReplay",
            data: {
              name: "token.int.test.ts",
              expected: "auth.replay.int.test.ts"
            }
          }
        ]
      }
    ]
  });
});
