/**
 * @fileoverview RuleTester spec for `machine-sibling-names`.
 *
 * A file exporting a machine's `services`, `actions` or `guards` is named
 * `{module}.{kind}.ts` or `{module}.{kind}.<context>.ts`, and the name segment
 * matches what the file exports.
 *
 * Run: node --test rules/machine-sibling-names.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./machine-sibling-names.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("machine-sibling-names", () => {
  ruleTester.run("machine-sibling-names", rule, {
    valid: [
      {
        code: `export const services = {};`,
        filename: "modules/basket/basket.services.ts"
      },
      {
        code: `export const actions = {};`,
        filename: "modules/basket/useBasket.actions.client.ts"
      },
      {
        code: `export const services = {};`,
        filename: "modules/basket/basket.services.client.ts"
      },
      {
        code: `const guards = {}; export { guards };`,
        filename: "modules/basket/basket.guards.ts"
      },
      {
        code: `const services = {}; export default services;`,
        filename: "modules/basket/basket.services.ts"
      },
      {
        code: `export const helpers = {};`,
        filename: "modules/basket/basket.helpers.ts"
      },
      {
        code: `const actions = {};`,
        filename: "modules/basket/basket.helpers.ts"
      }
    ],
    invalid: [
      {
        code: `export const actions = {};`,
        filename: "modules/basket/basket.helpers.ts",
        errors: [{ messageId: "siblingName", data: { kind: "actions" } }]
      },
      {
        code: `export const guards = {};`,
        filename: "modules/basket/basket.actions.ts",
        errors: [{ messageId: "siblingName", data: { kind: "guards" } }]
      },
      {
        code: `export const services = {};`,
        filename: "modules/basket/machine.ts",
        errors: [{ messageId: "siblingName", data: { kind: "services" } }]
      },
      {
        code: `export const services = {};`,
        filename: "modules/basket/services.ts",
        errors: [{ messageId: "siblingName" }]
      },
      {
        code: `const actions = {}; export default actions;`,
        filename: "modules/basket/basket.helpers.ts",
        errors: [{ messageId: "siblingName", data: { kind: "actions" } }]
      },
      {
        code: `const services = {}; export { services };`,
        filename: "modules/basket/basket.utils.ts",
        errors: [{ messageId: "siblingName", data: { kind: "services" } }]
      },
      {
        code: `const x = {}; export { x as guards };`,
        filename: "modules/basket/basket.helpers.ts",
        errors: [{ messageId: "siblingName", data: { kind: "guards" } }]
      },
      {
        code: `export const services = {}; export const actions = {};`,
        filename: "modules/basket/basket.services.ts",
        errors: [{ messageId: "siblingName", data: { kind: "actions" } }]
      }
    ]
  });
});
