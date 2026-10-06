/**
 * @fileoverview RuleTester specs for `tests/no-type-shape-assert`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/no-type-shape-assert.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-type-shape-assert.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const FILENAME = "/repo/src/query.unit.test.ts";

test("no-type-shape-assert", () => {
  ruleTester.run("no-type-shape-assert", rule, {
    valid: [
      {
        filename: FILENAME,
        code: `it("a", () => { expect(total).toBe(10); });`
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(result).toBeDefined(); expect(result.total).toBe(10); });`
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(result).not.toBeUndefined(); expect(result.total).toEqual(10); });`
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(result).toBeUndefined(); });`
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(result).not.toBeDefined(); });`
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(typeofValue).toBe("string"); });`
      }
    ],
    invalid: [
      {
        filename: FILENAME,
        code: `it("a", () => { expect(result).toHaveProperty("total"); });`,
        errors: [{ messageId: "shape", data: { what: "toHaveProperty" } }]
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(total).toBeTypeOf("number"); });`,
        errors: [{ messageId: "shape", data: { what: "toBeTypeOf" } }]
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(typeof total).toBe("number"); });`,
        errors: [{ messageId: "shape", data: { what: "expect(typeof ...)" } }]
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(result).toBeDefined(); });`,
        errors: [{ messageId: "loneDefined" }]
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(result).not.toBeUndefined(); });`,
        errors: [{ messageId: "loneDefined" }]
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(a).toBeDefined(); expect(b).toBeDefined(); });`,
        errors: [{ messageId: "loneDefined" }, { messageId: "loneDefined" }]
      },
      {
        filename: FILENAME,
        code: `it("a", () => { expect(a).toBe(1); });\nit("b", () => { expect(b).toBeDefined(); });`,
        errors: [{ messageId: "loneDefined" }]
      }
    ]
  });
});
