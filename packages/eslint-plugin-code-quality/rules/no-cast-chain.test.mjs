/**
 * @fileoverview RuleTester specs for `code-quality/no-cast-chain`.
 *
 * Run: node --test packages/eslint-plugin-code-quality/rules/no-cast-chain.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import noCastChain from "./no-cast-chain.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-cast-chain", () => {
  ruleTester.run("no-cast-chain", noCastChain, {
    valid: [
      { code: `const x = y as unknown as Foo;` },
      { code: `export const x = y as unknown as Foo;` },
      { code: `function f() { const x = y as unknown as Foo; return x; }` },
      { code: `const x = y as Foo;` },
      { code: `const x = y as unknown;` },
      { code: `foo(y as Foo);` }
    ],
    invalid: [
      {
        code: `foo(y as unknown as Foo);`,
        errors: [{ messageId: "castChain" }]
      },
      {
        code: `let x = y as unknown as Foo;`,
        errors: [{ messageId: "castChain" }]
      },
      {
        code: `var x = y as unknown as Foo;`,
        errors: [{ messageId: "castChain" }]
      },
      {
        code: `const { a } = y as unknown as Foo;`,
        errors: [{ messageId: "castChain" }]
      },
      {
        code: `x = y as unknown as Foo;`,
        errors: [{ messageId: "castChain" }]
      },
      {
        code: `function f() { return y as unknown as Foo; }`,
        errors: [{ messageId: "castChain" }]
      },
      {
        code: `const x = { a: y as unknown as Foo };`,
        errors: [{ messageId: "castChain" }]
      },
      {
        code: `const x = (y as unknown as Foo).bar;`,
        errors: [{ messageId: "castChain" }]
      }
    ]
  });
});
