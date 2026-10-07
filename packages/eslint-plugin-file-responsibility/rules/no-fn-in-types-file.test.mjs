/**
 * @fileoverview RuleTester spec for `no-fn-in-types-file`.
 *
 * A `*.types.ts` (or bare `types.ts`) holds vocabulary, never behaviour:
 *   - a function declaration and a function-valued const are errors;
 *   - types, enums, plain constants and function TYPES stay legal;
 *   - a function in any other file is untouched.
 *
 * Run: node --test rules/no-fn-in-types-file.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-fn-in-types-file.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-fn-in-types-file", () => {
  ruleTester.run("no-fn-in-types-file", rule, {
    valid: [
      {
        code: `export type X = string;`,
        filename: "modules/foo/foo.types.ts"
      },
      {
        code: `export type Fn = (a: string) => void;`,
        filename: "modules/foo/foo.types.ts"
      },
      {
        code: `export interface Api { load(id: string): Promise<void>; save: (id: string) => void }`,
        filename: "modules/foo/foo.types.ts"
      },
      {
        code: `export enum Status { On = "on", Off = "off" }`,
        filename: "modules/foo/foo.types.ts"
      },
      {
        code: `export const KEYS = ["a", "b"] as const;`,
        filename: "modules/foo/foo.types.ts"
      },
      {
        code: `export const DEFAULTS = { id: "x" };`,
        filename: "modules/foo/foo.types.ts"
      },
      {
        code: `export function build() { return 1; }`,
        filename: "modules/foo/foo.utils.ts"
      },
      {
        code: `export const build = () => 1;`,
        filename: "modules/foo/foo.mappers.ts"
      },
      {
        code: `export const build = () => 1;`,
        filename: "modules/foo/useFoo.ts"
      }
    ],
    invalid: [
      {
        code: `export function build() { return 1; }`,
        filename: "modules/foo/foo.types.ts",
        errors: [{ messageId: "fnInTypesFile", data: { name: "build" } }]
      },
      {
        code: `function build() { return 1; }`,
        filename: "modules/foo/foo.types.ts",
        errors: [{ messageId: "fnInTypesFile", data: { name: "build" } }]
      },
      {
        code: `export async function load() {}`,
        filename: "modules/foo/foo.types.ts",
        errors: [{ messageId: "fnInTypesFile", data: { name: "load" } }]
      },
      {
        code: `export const build = () => 1;`,
        filename: "modules/foo/foo.types.ts",
        errors: [{ messageId: "fnInTypesFile", data: { name: "build" } }]
      },
      {
        code: `const build = () => 1;`,
        filename: "modules/foo/foo.types.ts",
        errors: [{ messageId: "fnInTypesFile", data: { name: "build" } }]
      },
      {
        code: `export const build = function () { return 1; };`,
        filename: "modules/foo/foo.types.ts",
        errors: [{ messageId: "fnInTypesFile", data: { name: "build" } }]
      },
      {
        code: `export function build() { return 1; }`,
        filename: "modules/foo/types.ts",
        errors: [{ messageId: "fnInTypesFile" }]
      },
      {
        code: `export function build() { return 1; }`,
        filename: "modules/foo/foo.types.customer.ts",
        errors: [{ messageId: "fnInTypesFile" }]
      },
      {
        code: `export type X = string;\nexport const a = () => 1;\nexport function b() {}`,
        filename: "modules/foo/foo.types.ts",
        errors: [
          { messageId: "fnInTypesFile", data: { name: "a" } },
          { messageId: "fnInTypesFile", data: { name: "b" } }
        ]
      }
    ]
  });
});
