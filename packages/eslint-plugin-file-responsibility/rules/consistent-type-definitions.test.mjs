/**
 * @fileoverview RuleTester spec for `consistent-type-definitions` (FE-3249 #7).
 *
 * Both directions:
 *   - a plain interface is flagged and auto-fixed to a `type` alias (valid ↔
 *     invalid with `output`);
 *   - an interface inside `declare global` / `declare module` is EXEMPT, because
 *     declaration merging has no `type` equivalent.
 *
 * Run: node --test rules/consistent-type-definitions.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./consistent-type-definitions.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("consistent-type-definitions", () => {
  ruleTester.run("consistent-type-definitions", rule, {
    valid: [
      // A `type` alias is already correct.
      { code: `type X = { a: number };` },
      // Declaration merging onto a global built-in — `interface` is required.
      {
        code: `declare global {\n  interface Window {\n    dataLayer: unknown[];\n  }\n}`
      },
      // Declaration merging onto a third-party module — likewise exempt.
      {
        code: `declare module "@jsonforms/core" {\n  interface JsonSchema7 {\n    foo?: string;\n  }\n}`
      }
    ],
    invalid: [
      // A plain interface → a `type` alias.
      {
        code: `interface X { a: number }`,
        output: `type X = { a: number }`,
        errors: [{ messageId: "preferType" }]
      },
      // A `declare` interface keeps the `declare`, swaps the keyword.
      {
        code: `declare interface Options { a: number }`,
        output: `declare type Options = { a: number }`,
        errors: [{ messageId: "preferType" }]
      },
      // An exported interface keeps the `export`, swaps the keyword.
      {
        code: `export interface Props { id: string }`,
        output: `export type Props = { id: string }`,
        errors: [{ messageId: "preferType" }]
      },
      // `extends` folds into a leading intersection.
      {
        code: `interface X extends A, B { c: number }`,
        output: `type X = A & B & { c: number }`,
        errors: [{ messageId: "preferType" }]
      },
      // Type parameters are preserved.
      {
        code: `interface Box<T> { value: T }`,
        output: `type Box<T> = { value: T }`,
        errors: [{ messageId: "preferType" }]
      }
    ]
  });
});
