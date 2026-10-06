/**
 * @fileoverview RuleTester spec for `guard-prefix`.
 *
 * Discriminators: a guard key reads as a yes/no question (is/has/can + an
 * upper-case/digit/underscore) only inside createMachine options or setup();
 * a bad key fails; a non-xstate file is never checked; custom prefixes swap the set.
 *
 * Run: node --test rules/guard-prefix.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./guard-prefix.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("guard-prefix", () => {
  ruleTester.run("guard-prefix", rule, {
    valid: [
      {
        code: `import { createMachine } from "xstate"; createMachine({}, { guards: { isReady: () => true, hasItems: () => true, canEdit: () => true } });`
      },
      {
        code: `import { setup } from "xstate"; setup({ guards: { isReady: () => true } });`
      },
      {
        code: `createMachine({}, { guards: { continueEditing: () => true } });`
      },
      {
        code: `import { setup } from "xstate"; setup({ guards: { shouldRun: () => true } });`,
        options: [{ prefixes: ["should"] }]
      }
    ],
    invalid: [
      {
        code: `import { createMachine } from "xstate"; createMachine({}, { guards: { continueEditing: () => true } });`,
        errors: [{ messageId: "guardPrefix" }]
      },
      {
        code: `import { setup } from "xstate"; setup({ guards: { readyState: () => true } });`,
        errors: [{ messageId: "guardPrefix" }]
      },
      {
        code: `import { setup } from "xstate"; setup({ guards: { isReady: () => true } });`,
        options: [{ prefixes: ["should"] }],
        errors: [{ messageId: "guardPrefix" }]
      }
    ]
  });
});
