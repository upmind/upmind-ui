/**
 * @fileoverview RuleTester spec for `setup-first`.
 *
 * Discriminators: a bare `createMachine(...)` fails; `setup(...).createMachine(...)`
 * passes; a non-xstate file is never checked; below XState 5 the rule is silent.
 *
 * Run: node --test rules/setup-first.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./setup-first.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const v5 = [{ xstateMajor: 5 }];
const imp = `import { setup, createMachine } from "xstate";`;

test("setup-first", () => {
  ruleTester.run("setup-first", rule, {
    valid: [
      { code: `${imp} setup({ guards }).createMachine({});`, options: v5 },
      { code: `${imp} setup({}).createMachine({});`, options: v5 },
      { code: `createMachine({});`, options: v5 },
      { code: `${imp} createMachine({});`, options: [{ xstateMajor: 4 }] }
    ],
    invalid: [
      {
        code: `${imp} createMachine({});`,
        options: v5,
        errors: [{ messageId: "setupFirst" }]
      },
      {
        code: `${imp} const m = machines.createMachine({});`,
        options: v5,
        errors: [{ messageId: "setupFirst" }]
      },
      {
        code: `${imp} const base = setup({}); base.createMachine({});`,
        options: v5,
        errors: [{ messageId: "setupFirst" }]
      }
    ]
  });
});
