/**
 * @fileoverview RuleTester spec for `event-case`.
 *
 * Discriminators: `on:` keys and send/raise/sendTo/sendParent string types must be
 * SCREAMING_SNAKE_CASE (dotted form legal); the wildcard and xstate./done./error.
 * built-ins are exempt; a non-xstate file is never checked.
 *
 * Run: node --test rules/event-case.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./event-case.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("event-case", () => {
  ruleTester.run("event-case", rule, {
    valid: [
      {
        code: `import { createMachine } from "xstate"; createMachine({ on: { SET_QUANTITY: "x", "SET.QUANTITY": "y" } });`
      },
      {
        code: `import { createMachine } from "xstate"; createMachine({ on: { "*": "a", "xstate.done": "b", "done.invoke.x": "c", "error.platform": "d" } });`
      },
      {
        code: `import { send } from "xstate"; send("SET_QUANTITY"); send({ type: "SET_QUANTITY" });`
      },
      {
        code: `import { sendTo } from "xstate"; sendTo("target", { type: "GO_HOME" });`
      },
      {
        code: `createMachine({ on: { setQuantity: "x" } });`
      }
    ],
    invalid: [
      {
        code: `import { createMachine } from "xstate"; createMachine({ on: { setQuantity: "x" } });`,
        errors: [{ messageId: "eventCase" }]
      },
      {
        code: `import { send } from "xstate"; send("setQuantity");`,
        errors: [{ messageId: "eventCase" }]
      },
      {
        code: `import { send } from "xstate"; send({ type: "setQuantity" });`,
        errors: [{ messageId: "eventCase" }]
      },
      {
        code: `import { raise } from "xstate"; raise({ type: "goNow" });`,
        errors: [{ messageId: "eventCase" }]
      },
      {
        code: `import { sendParent } from "xstate"; sendParent("doThing");`,
        errors: [{ messageId: "eventCase" }]
      },
      {
        code: `import { sendTo } from "xstate"; sendTo("t", "goHome");`,
        errors: [{ messageId: "eventCase" }]
      }
    ]
  });
});
