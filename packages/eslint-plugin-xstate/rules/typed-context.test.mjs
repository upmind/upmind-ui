/**
 * @fileoverview RuleTester spec for `typed-context`.
 *
 * Discriminators: a createMachine config with `context` must type it via
 * `{} as T`, schema.context, tsTypes or types; an untyped literal/identifier
 * context fails; a config with no context is never flagged; a non-xstate file
 * is never checked.
 *
 * Run: node --test rules/typed-context.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./typed-context.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("typed-context", () => {
  ruleTester.run("typed-context", rule, {
    valid: [
      {
        code: `import { createMachine } from "xstate"; createMachine({ context: {} as ProductContext });`
      },
      {
        code: `import { createMachine } from "xstate"; createMachine({ context: { count: 0 }, schema: { context: {} } });`
      },
      {
        code: `import { createMachine } from "xstate"; createMachine({ context: { count: 0 }, tsTypes: {} });`
      },
      {
        code: `import { createMachine } from "xstate"; createMachine({ context: { count: 0 }, types: {} });`
      },
      {
        code: `import { createMachine } from "xstate"; createMachine({ id: "product" });`
      },
      {
        code: `createMachine({ context: { count: 0 } });`
      }
    ],
    invalid: [
      {
        code: `import { createMachine } from "xstate"; createMachine({ context: { count: 0 } });`,
        errors: [{ messageId: "untypedContext" }]
      },
      {
        code: `import { createMachine } from "xstate"; createMachine({ context: initialContext });`,
        errors: [{ messageId: "untypedContext" }]
      }
    ]
  });
});
