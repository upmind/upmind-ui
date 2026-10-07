/**
 * @fileoverview RuleTester spec for `no-promise-wrap`.
 *
 * `new Promise(...)` is an error in a `*.services*.ts` file and inside the
 * `guards` of a `*.machine.ts`. Elsewhere, and in a machine outside `guards`,
 * it stays legal. `Promise.reject(...)` is the sanctioned form.
 *
 * Run: node --test rules/no-promise-wrap.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-promise-wrap.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const services = "modules/foo/foo.services.ts";
const machine = "modules/foo/foo.machine.ts";

test("no-promise-wrap", () => {
  ruleTester.run("no-promise-wrap", rule, {
    valid: [
      {
        code: `export const check = () => Promise.reject(new DetailedError("x"));`,
        filename: services
      },
      {
        code: `export const load = async () => { const m = new Map(); return m; };`,
        filename: services
      },
      {
        code: `export const wait = () => new Promise(r => setTimeout(r, 1));`,
        filename: "modules/foo/foo.utils.ts"
      },
      {
        code: `export const wait = () => new Promise(r => setTimeout(r, 1));`,
        filename: "modules/foo/useFoo.ts"
      },
      {
        code: `setup({ guards: { canGo: async () => { throw new DetailedError("x"); } } });`,
        filename: machine
      },
      {
        code: `setup({ actions: { wait: () => new Promise(r => setTimeout(r, 1)) } });`,
        filename: machine
      },
      {
        code: `const wait = new Promise(r => setTimeout(r, 1));`,
        filename: machine
      }
    ],
    invalid: [
      {
        code: `export const check = () => new Promise((_, reject) => reject(new Error("x")));`,
        filename: services,
        errors: [{ messageId: "promiseWrap" }]
      },
      {
        code: `export const load = async () => { return new Promise(r => r(1)); };`,
        filename: services,
        errors: [{ messageId: "promiseWrap" }]
      },
      {
        code: `const wait = new Promise(r => setTimeout(r, 1));`,
        filename: "modules/foo/foo.services.client.ts",
        errors: [{ messageId: "promiseWrap" }]
      },
      {
        code: `setup({ guards: { canGo: () => new Promise(r => r(true)) } });`,
        filename: machine,
        errors: [{ messageId: "promiseWrap" }]
      },
      {
        code: `createMachine({ guards: { canGo: async () => { await new Promise(r => r(1)); return true; } } });`,
        filename: machine,
        errors: [{ messageId: "promiseWrap" }]
      },
      {
        code: `setup({ guards: { a: () => new Promise(r => r(1)), b: () => new Promise(r => r(2)) } });`,
        filename: machine,
        errors: [{ messageId: "promiseWrap" }, { messageId: "promiseWrap" }]
      }
    ]
  });
});
