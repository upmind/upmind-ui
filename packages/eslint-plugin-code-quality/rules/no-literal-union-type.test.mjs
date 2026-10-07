/**
 * @fileoverview RuleTester specs for `code-quality/no-literal-union-type`.
 *
 * Run: node --test packages/eslint-plugin-code-quality/rules/no-literal-union-type.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import noLiteralUnionType from "./no-literal-union-type.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-literal-union-type", () => {
  ruleTester.run("no-literal-union-type", noLiteralUnionType, {
    valid: [
      { code: `type A = "a";` },
      { code: `type A = "a" | number;` },
      { code: `type A = 1 | 2;` },
      { code: `type A = string | number;` },
      { code: "type A = `${Kind}`;" },
      { code: 'type A = `${Kind}` | "x";' },
      { code: `type A = "a" & "b";` },
      { code: `function f(x: "a" | "b") {}` },
      { code: `enum Kind { A = "a", B = "b" }` }
    ],
    invalid: [
      {
        code: `type A = "a" | "b";`,
        errors: [{ messageId: "literalUnion", data: { count: "2" } }]
      },
      {
        code: `type A = "a" | "b" | "c";`,
        errors: [{ messageId: "literalUnion", data: { count: "3" } }]
      },
      {
        code: `export type A = "a" | "b";`,
        errors: [{ messageId: "literalUnion", data: { count: "2" } }]
      },
      {
        code: `type A = "a" | "b" | null;`,
        errors: [{ messageId: "literalUnion", data: { count: "2" } }]
      },
      {
        code: `type A = "a" | 1 | "b";`,
        errors: [{ messageId: "literalUnion", data: { count: "2" } }]
      },
      {
        code: "type A = `a` | `b`;",
        errors: [{ messageId: "literalUnion", data: { count: "2" } }]
      },
      {
        code: 'type A = `${Kind}` | "x" | "y";',
        errors: [{ messageId: "literalUnion", data: { count: "2" } }]
      }
    ]
  });
});
