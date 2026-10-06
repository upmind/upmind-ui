/**
 * @fileoverview RuleTester spec for `machine-factory`.
 *
 * Discriminators: an exported module-level machine fails; a machine created
 * inside an exported factory passes; a non-exported machine passes; below
 * XState 5 the rule is silent.
 *
 * Run: node --test rules/machine-factory.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./machine-factory.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const v5 = [{ xstateMajor: 5 }];

test("machine-factory", () => {
  ruleTester.run("machine-factory", rule, {
    valid: [
      {
        code: `export const makeMachine = () => createMachine({});`,
        options: v5
      },
      {
        code: `export function makeMachine() { return setup({}).createMachine({}); }`,
        options: v5
      },
      { code: `const machine = createMachine({});`, options: v5 },
      {
        code: `export const machine = createMachine({});`,
        options: [{ xstateMajor: 4 }]
      },
      { code: `export const value = 1;`, options: v5 },
      {
        code: `const m = createMachine({}); const n = 1; export { n };`,
        options: v5
      },
      {
        code: `const m = createMachine({}); export const makeMachine = () => m;`,
        options: v5
      },
      {
        code: `const m = createMachine({}); export { m };`,
        options: [{ xstateMajor: 4 }]
      },
      {
        code: `const m = createMachine({}); export default m;`,
        options: [{ xstateMajor: 4 }]
      }
    ],
    invalid: [
      {
        code: `export const machine = createMachine({});`,
        options: v5,
        errors: [{ messageId: "machineFactory" }]
      },
      {
        code: `export const machine = setup({}).createMachine({});`,
        options: v5,
        errors: [{ messageId: "machineFactory" }]
      },
      {
        code: `export default createMachine({});`,
        options: v5,
        errors: [{ messageId: "machineFactory" }]
      },
      {
        code: `const m = createMachine({}); export { m };`,
        options: v5,
        errors: [{ messageId: "machineFactory" }]
      },
      {
        code: `const m = createMachine({}); export { m as machine };`,
        options: v5,
        errors: [{ messageId: "machineFactory" }]
      },
      {
        code: `const m = setup({}).createMachine({}); export { m };`,
        options: v5,
        errors: [{ messageId: "machineFactory" }]
      },
      {
        code: `const m = createMachine({}); export default m;`,
        options: v5,
        errors: [{ messageId: "machineFactory" }]
      }
    ]
  });
});
