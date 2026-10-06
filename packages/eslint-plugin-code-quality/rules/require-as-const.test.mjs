/**
 * @fileoverview RuleTester specs for `code-quality/require-as-const`.
 *
 * Run: node --test packages/eslint-plugin-code-quality/rules/require-as-const.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import requireAsConst from "./require-as-const.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("require-as-const", () => {
  ruleTester.run("require-as-const", requireAsConst, {
    valid: [
      { code: `const A = { a: 1 } as const;` },
      { code: `const A = [1, 2] as const;` },
      { code: `const A = {};` },
      { code: `const A = [];` },
      { code: `const A: Record<string, number> = { a: 1 };` },
      { code: `const A = { a: foo };` },
      { code: `const A = { a: 1 + 1 };` },
      { code: `const A = { ...base };` },
      { code: `const A = { [key]: 1 };` },
      { code: `const A = [1, , 2];` },
      { code: `const A = [1, ...rest];` },
      { code: `const A = { fn() {} };` },
      { code: `const A = make();` },
      { code: `const A = 1;` },
      { code: `let A = { a: 1 };` },
      { code: `function f() { const A = { a: 1 }; return A; }` },
      { code: `const A = { a: 1 };\nA.a = 2;` },
      { code: `const A = { a: 1 };\nA.b++;` },
      { code: `const A = { a: 1 };\ndelete A.a;` },
      { code: `const A = [1];\nA.push(2);` },
      { code: `const A = [3, 1];\nA.sort();` },
      { code: `const A = [1];\nA[0] = 2;` },
      { code: `export const A = { a: 1 };\nA.a = 2;` }
    ],
    invalid: [
      {
        code: `const A = { a: 1 };`,
        errors: [{ messageId: "requireAsConst", data: { name: "A" } }]
      },
      {
        code: `const A = [1, 2];`,
        errors: [{ messageId: "requireAsConst", data: { name: "A" } }]
      },
      {
        code: `const A = ["a", "b"];`,
        errors: [{ messageId: "requireAsConst", data: { name: "A" } }]
      },
      {
        code: `export const A = { a: "x" };`,
        errors: [{ messageId: "requireAsConst", data: { name: "A" } }]
      },
      {
        code: `const A = { a: { b: [1, -2, true, null, "s"] } };`,
        errors: [{ messageId: "requireAsConst", data: { name: "A" } }]
      },
      {
        code: "const A = { a: `plain` };",
        errors: [{ messageId: "requireAsConst", data: { name: "A" } }]
      },
      {
        code: `const A = { a: 1 };\nconst b = A.a;`,
        errors: [{ messageId: "requireAsConst", data: { name: "A" } }]
      },
      {
        code: `const A = [1];\nA.map(x => x);`,
        errors: [{ messageId: "requireAsConst", data: { name: "A" } }]
      },
      {
        code: `const A = { a: 1 };\nconst B = ["x"];`,
        errors: [
          { messageId: "requireAsConst", data: { name: "A" } },
          { messageId: "requireAsConst", data: { name: "B" } }
        ]
      }
    ]
  });
});
