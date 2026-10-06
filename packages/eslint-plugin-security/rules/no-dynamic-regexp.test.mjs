import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-dynamic-regexp.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-dynamic-regexp", () => {
  ruleTester.run("no-dynamic-regexp", rule, {
    valid: [
      { code: `new RegExp("^[a-z]+$");` },
      { code: `new RegExp("a", "g");` },
      { code: `RegExp("abc");` },
      { code: "new RegExp(`^abc`);" },
      { code: `const r = /^[a-z]+$/;` },
      { code: `new Other(input);` },
      { code: `other(input);` }
    ],
    invalid: [
      {
        code: `new RegExp(input);`,
        errors: [{ messageId: "dynamicRegexp" }]
      },
      {
        code: `new RegExp(input, "g");`,
        errors: [{ messageId: "dynamicRegexp" }]
      },
      {
        code: `RegExp("^" + name);`,
        errors: [{ messageId: "dynamicRegexp" }]
      },
      {
        code: "new RegExp(`^${name}`);",
        errors: [{ messageId: "dynamicRegexp" }]
      },
      {
        code: `RegExp(String(value));`,
        errors: [{ messageId: "dynamicRegexp" }]
      }
    ]
  });
});
