/**
 * @fileoverview RuleTester specs for `tests/file-header`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/file-header.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./file-header.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const FILENAME = "/repo/src/query.unit.test.ts";

const FULL_HEADER = `/**
 * @fileoverview query tests
 *
 * ## Job To Be Done
 * Protect the query contract.
 *
 * ## What Breaks If These Fail
 * Lists stop paging.
 */`;

test("file-header", () => {
  ruleTester.run("file-header", rule, {
    valid: [
      { filename: FILENAME, code: `${FULL_HEADER}\nimport { x } from "./x";` },
      {
        filename: FILENAME,
        code: `// ---- divider ----\n${FULL_HEADER}\nconst a = 1;`
      },
      { filename: FILENAME, code: FULL_HEADER }
    ],
    invalid: [
      {
        filename: FILENAME,
        code: `import { x } from "./x";`,
        errors: [{ messageId: "noHeader" }]
      },
      {
        filename: FILENAME,
        code: `const a = 1;`,
        errors: [{ messageId: "noHeader" }]
      },
      {
        filename: FILENAME,
        code: `/* @fileoverview q\n * ## Job To Be Done\n * x\n * ## What Breaks If These Fail\n * y\n */\nconst a = 1;`,
        errors: [{ messageId: "noHeader" }]
      },
      {
        filename: FILENAME,
        code: `const a = 1;\n${FULL_HEADER}`,
        errors: [{ messageId: "noHeader" }]
      },
      {
        filename: FILENAME,
        code: `/**\n * @fileoverview q\n *\n * ## What Breaks If These Fail\n * y\n */\nconst a = 1;`,
        errors: [
          { messageId: "missingPart", data: { part: "## Job To Be Done" } }
        ]
      },
      {
        filename: FILENAME,
        code: `/**\n * @fileoverview q\n *\n * ## Job To Be Done\n * x\n */\nconst a = 1;`,
        errors: [
          {
            messageId: "missingPart",
            data: { part: "## What Breaks If These Fail" }
          }
        ]
      },
      {
        filename: FILENAME,
        code: `/**\n * Some description.\n */\nconst a = 1;`,
        errors: [
          {
            messageId: "missingPart",
            data: {
              part: "@fileoverview`, `## Job To Be Done`, `## What Breaks If These Fail"
            }
          }
        ]
      }
    ]
  });
});
