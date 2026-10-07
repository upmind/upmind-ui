/**
 * @fileoverview RuleTester spec for `named-guards`.
 *
 * Discriminators: an inline function as a `guard` value fails; a named string
 * guard or a guard combinator passes; a non-xstate file is never checked;
 * below XState 5 the rule is silent.
 *
 * Run: node --test rules/named-guards.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./named-guards.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const v5 = [{ xstateMajor: 5 }];
const imp = `import { setup } from "xstate";`;

test("named-guards", () => {
  ruleTester.run("named-guards", rule, {
    valid: [
      { code: `${imp} const t = { guard: "isReady" };`, options: v5 },
      {
        code: `${imp} const t = { guard: and(["isReady", "hasItems"]) };`,
        options: v5
      },
      { code: `${imp} const t = { guard: { type: "isReady" } };`, options: v5 },
      {
        code: `${imp} setup({ guards: { isReady: ({ context }) => context.ready } });`,
        options: v5
      },
      { code: `const t = { guard: () => true };`, options: v5 },
      {
        code: `${imp} const t = { guard: () => true };`,
        options: [{ xstateMajor: 4 }]
      }
    ],
    invalid: [
      {
        code: `${imp} const t = { guard: ({ context }) => context.ready };`,
        options: v5,
        errors: [{ messageId: "namedGuard" }]
      },
      {
        code: `${imp} const t = { guard: function () { return true; } };`,
        options: v5,
        errors: [{ messageId: "namedGuard" }]
      },
      {
        code: `${imp} const t = { on: { GO: { target: "a", guard: () => true } } };`,
        options: v5,
        errors: [{ messageId: "namedGuard" }]
      }
    ]
  });
});
