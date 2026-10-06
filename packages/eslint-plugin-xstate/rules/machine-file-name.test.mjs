/**
 * @fileoverview RuleTester spec for `machine-file-name`.
 *
 * Discriminators: a createMachine call is legal only in a *.machine.ts /
 * *.machine.<ctx>.ts file; test files are exempt; a file with no createMachine
 * call is never flagged; a non-machine file that calls createMachine fails.
 *
 * Run: node --test rules/machine-file-name.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./machine-file-name.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("machine-file-name", () => {
  ruleTester.run("machine-file-name", rule, {
    valid: [
      {
        code: `import { createMachine } from "xstate"; createMachine({});`,
        filename: "basket.machine.ts"
      },
      {
        code: `import { createMachine } from "xstate"; createMachine({});`,
        filename: "basket.machine.customer.ts"
      },
      {
        code: `import { createMachine } from "xstate"; createMachine({});`,
        filename: "basket.test.ts"
      },
      {
        code: `import { setup } from "xstate"; setup({});`,
        filename: "basket.helpers.ts"
      }
    ],
    invalid: [
      {
        code: `import { createMachine } from "xstate"; createMachine({});`,
        filename: "basket.helpers.ts",
        errors: [{ messageId: "machineFileName" }]
      },
      {
        code: `import { setup } from "xstate"; setup({}).createMachine({});`,
        filename: "basket.store.ts",
        errors: [{ messageId: "machineFileName" }]
      }
    ]
  });
});
