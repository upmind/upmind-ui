/**
 * @fileoverview RuleTester specs for `tests/no-bare-called`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/no-bare-called.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-bare-called.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const FILENAME = "/repo/src/query.unit.test.ts";

test("no-bare-called", () => {
  ruleTester.run("no-bare-called", rule, {
    valid: [
      {
        filename: FILENAME,
        code: `it("a", () => { expect(send).toHaveBeenCalledWith({ type: "SET" }); });`
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(send).toHaveBeenCalledTimes(1); expect(send).toHaveBeenCalledWith({ type: "SET" }); });`
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(send).toHaveBeenCalled(); expect(send).toHaveBeenLastCalledWith(1); });`
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(send).toHaveBeenCalled(); expect(send).toHaveBeenNthCalledWith(1, 2); });`
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(send).not.toHaveBeenCalled(); });`
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(send).toHaveBeenCalledTimes(0); });`
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(send).toHaveBeenCalled(); expect(send.mock.calls[0][0]).toEqual({ type: "SET" }); });`
      }
    ],
    invalid: [
      {
        filename: FILENAME,
        code: `it("a", () => { expect(send).toHaveBeenCalled(); });`,
        errors: [{ messageId: "bareCalled", data: { mock: "send" } }]
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(send).toHaveBeenCalledTimes(2); });`,
        errors: [{ messageId: "bareCalled" }]
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(send).toBeCalled(); });`,
        errors: [{ messageId: "bareCalled" }]
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(a).toHaveBeenCalledWith(1); expect(b).toHaveBeenCalled(); });`,
        errors: [{ messageId: "bareCalled", data: { mock: "b" } }]
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(send).toHaveBeenCalledWith(1); });\nit("b", () => { expect(send).toHaveBeenCalled(); });`,
        errors: [{ messageId: "bareCalled" }]
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(send).toHaveBeenCalled(); expect(other.mock.calls[0][0]).toBe(1); });`,
        errors: [{ messageId: "bareCalled" }]
      }
    ]
  });
});
