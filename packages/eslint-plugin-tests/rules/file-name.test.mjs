/**
 * @fileoverview RuleTester specs for `tests/file-name`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/file-name.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./file-name.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const CODE = `const a = 1;`;

test("file-name", () => {
  ruleTester.run("file-name", rule, {
    valid: [
      { filename: "/repo/src/query.unit.test.ts", code: CODE },
      { filename: "/repo/src/query.int.test.ts", code: CODE },
      { filename: "/repo/src/useAuth.client.unit.test.ts", code: CODE },
      { filename: "/repo/src/useAuth.staff.int.test.ts", code: CODE },
      { filename: "/repo/src/useAuth.guest.unit.test.ts", code: CODE },
      { filename: "/repo/src/useAuth.test-id.unit.test.ts", code: CODE },
      { filename: "/repo/src/query.ts", code: CODE },
      { filename: "/repo/src/query.spec.ts", code: CODE }
    ],
    invalid: [
      {
        filename: "/repo/src/query.test.ts",
        code: CODE,
        errors: [
          {
            messageId: "noLayer",
            data: { name: "query.test.ts", example: "query.unit.test.ts" }
          }
        ]
      },
      {
        filename: "/repo/src/query.Unit.test.ts",
        code: CODE,
        errors: [{ messageId: "noLayer" }]
      },
      {
        filename: "/repo/src/q.admin.unit.test.ts",
        code: CODE,
        errors: [{ messageId: "noLayer" }]
      },
      {
        filename: "/repo/src/q.foo.test.ts",
        code: CODE,
        errors: [{ messageId: "noLayer" }]
      },
      {
        filename: "/repo/src/cell-a.unit.test.ts",
        code: CODE,
        errors: [
          {
            messageId: "matrixLabel",
            data: { name: "cell-a.unit.test.ts", label: "cell-a" }
          }
        ]
      },
      {
        filename: "/repo/src/useAuth.cell.unit.test.ts",
        code: CODE,
        errors: [{ messageId: "matrixLabel" }]
      },
      {
        filename: "/repo/src/useAuth.cell-b.int.test.ts",
        code: CODE,
        errors: [{ messageId: "matrixLabel" }]
      }
    ]
  });
});
