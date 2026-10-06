/**
 * @fileoverview RuleTester specs for `code-quality/no-literal-error-message`.
 *
 * Run: node --test packages/eslint-plugin-code-quality/rules/no-literal-error-message.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import noLiteralErrorMessage from "./no-literal-error-message.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-literal-error-message", () => {
  ruleTester.run("no-literal-error-message", noLiteralErrorMessage, {
    valid: [
      { code: `throw new Error("errors.not_found");` },
      { code: `throw new Error(key);` },
      { code: `throw new Error();` },
      { code: `throw new Error("Oops");` },
      { code: `throw new Error(t("not found"));` },
      { code: "throw new Error(`errors.${code}`);" },
      { code: "throw new Error(`${message}`);" },
      { code: `throw new Widget("not found here");` },
      { code: `throw "errors.not_found";` },
      { code: `throw err;` },
      { code: `throw new Error(message ?? "something went wrong");` }
    ],
    invalid: [
      {
        code: `throw new Error("Something went wrong");`,
        errors: [{ messageId: "literalMessage" }]
      },
      {
        code: `const e = new Error("not found");`,
        errors: [{ messageId: "literalMessage" }]
      },
      {
        code: `throw new TypeError("bad value");`,
        errors: [{ messageId: "literalMessage" }]
      },
      {
        code: `throw new HttpError("Request failed", 500);`,
        errors: [{ messageId: "literalMessage" }]
      },
      {
        code: "throw new Error(`not found ${id}`);",
        errors: [{ messageId: "literalMessage" }]
      },
      {
        code: "throw new Error(`no space`);",
        errors: [{ messageId: "literalMessage" }]
      },
      {
        code: `throw "bad thing happened";`,
        errors: [{ messageId: "literalMessage" }]
      },
      {
        code: "throw `bad thing happened`;",
        errors: [{ messageId: "literalMessage" }]
      }
    ]
  });
});
