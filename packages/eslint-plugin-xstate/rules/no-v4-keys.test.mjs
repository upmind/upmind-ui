/**
 * @fileoverview RuleTester spec for `no-v4-keys`.
 *
 * Discriminators: the keys `cond` and `services` fail in a v5 xstate module
 * and name their replacement; `guard` and `actors` pass; a non-xstate file is
 * never checked; below XState 5 the rule is silent.
 *
 * Run: node --test rules/no-v4-keys.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-v4-keys.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const v5 = [{ xstateMajor: 5 }];
const imp = `import { setup } from "xstate";`;

test("no-v4-keys", () => {
  ruleTester.run("no-v4-keys", rule, {
    valid: [
      { code: `${imp} const t = { guard: "isReady" };`, options: v5 },
      { code: `${imp} const o = { actors: {} };`, options: v5 },
      { code: `const t = { cond: "isReady", services: {} };`, options: v5 },
      {
        code: `${imp} const t = { cond: "isReady", services: {} };`,
        options: [{ xstateMajor: 4 }]
      }
    ],
    invalid: [
      {
        code: `${imp} const t = { cond: "isReady" };`,
        options: v5,
        errors: [
          { messageId: "v4Key", data: { key: "cond", replacement: "guard" } }
        ]
      },
      {
        code: `${imp} const o = { services: {} };`,
        options: v5,
        errors: [
          {
            messageId: "v4Key",
            data: { key: "services", replacement: "actors" }
          }
        ]
      },
      {
        code: `${imp} const o = { "cond": "isReady", services: {} };`,
        options: v5,
        errors: [{ messageId: "v4Key" }, { messageId: "v4Key" }]
      }
    ]
  });
});
