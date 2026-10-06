/**
 * @fileoverview RuleTester spec for `canonical-state-read`.
 *
 * Discriminators: outside machine/test files, `.matches()` on a state-named
 * object, a `.context` read off a state, and any `.getSnapshot()` fail; the
 * canonical utilities and non-state `.matches` pass; machine files are exempt;
 * the utilities option is honoured.
 *
 * Run: node --test rules/canonical-state-read.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./canonical-state-read.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("canonical-state-read", () => {
  ruleTester.run("canonical-state-read", rule, {
    valid: [
      {
        code: `stateMatches(state, "idle");`,
        filename: "src/useThing.ts"
      },
      {
        code: `const model = contextValue(state, "model");`,
        filename: "src/useThing.ts"
      },
      {
        code: `router.matches("home");`,
        filename: "src/useThing.ts"
      },
      {
        code: `state.matches("idle"); snapshot.context.model; actor.getSnapshot();`,
        filename: "basket.machine.ts"
      }
    ],
    invalid: [
      {
        code: `state.matches("idle");`,
        filename: "src/useThing.ts",
        errors: [{ messageId: "matches" }]
      },
      {
        code: `const model = state.context.model;`,
        filename: "src/useThing.ts",
        errors: [{ messageId: "context" }]
      },
      {
        code: `const snap = actor.getSnapshot();`,
        filename: "src/useThing.ts",
        errors: [{ messageId: "snapshot" }]
      },
      {
        code: `state.matches("idle");`,
        filename: "src/useThing.ts",
        options: [{ utilities: ["readState"] }],
        errors: [{ messageId: "matches" }]
      }
    ]
  });
});
