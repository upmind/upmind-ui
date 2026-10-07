/**
 * @fileoverview RuleTester specs for `code-quality/file-header`.
 *
 * Run: node --test packages/eslint-plugin-code-quality/rules/file-header.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import fileHeader from "./file-header.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const SEP = `// ${"-".repeat(77)}`;
const BLOCK = "/**\n * @module pkg/file\n * @description Does one thing.\n */";

test("file-header", () => {
  ruleTester.run("file-header", fileHeader, {
    valid: [
      { code: `${SEP}\n${BLOCK}\nconst x = 1;` },
      { code: `import a from "a";\n\n${SEP}\n${BLOCK}\nconst x = a;` },
      { code: `/** @internal */\n${SEP}\n${BLOCK}\nconst x = 1;` },
      { code: `${SEP}\n\n${BLOCK}\nconst x = 1;` },
      { code: "" },
      { code: "// only a comment" }
    ],
    invalid: [
      {
        code: `const x = 1;`,
        errors: [{ messageId: "noSeparator" }]
      },
      {
        code: `${BLOCK}\nconst x = 1;`,
        errors: [{ messageId: "noSeparator" }]
      },
      {
        code: `// ${"-".repeat(40)}\n${BLOCK}\nconst x = 1;`,
        errors: [{ messageId: "noSeparator" }]
      },
      {
        code: `${SEP}\nconst x = 1;`,
        errors: [{ messageId: "noBlock" }]
      },
      {
        code: `${SEP}\n/* @module pkg/file @description x */\nconst x = 1;`,
        errors: [{ messageId: "noBlock" }]
      },
      {
        code: `${SEP}\n// note\n${BLOCK}\nconst x = 1;`,
        errors: [{ messageId: "noBlock" }]
      },
      {
        code: `${SEP}\n/**\n * @description Does one thing.\n */\nconst x = 1;`,
        errors: [{ messageId: "noModule" }]
      },
      {
        code: `${SEP}\n/**\n * @module nofile\n * @description Does one thing.\n */\nconst x = 1;`,
        errors: [{ messageId: "noModule" }]
      },
      {
        code: `${SEP}\n/**\n * @module pkg/file\n */\nconst x = 1;`,
        errors: [{ messageId: "noDescription" }]
      },
      {
        code: `${SEP}\n/**\n * Just prose.\n */\nconst x = 1;`,
        errors: [{ messageId: "noModule" }, { messageId: "noDescription" }]
      }
    ]
  });
});
