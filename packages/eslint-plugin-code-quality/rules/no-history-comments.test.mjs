/**
 * @fileoverview RuleTester specs for `code-quality/no-history-comments`.
 *
 * Run: node --test packages/eslint-plugin-code-quality/rules/no-history-comments.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import noHistoryComments from "./no-history-comments.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-history-comments", () => {
  ruleTester.run("no-history-comments", noHistoryComments, {
    valid: [
      { code: `// Returns the active session.\nconst x = 1;` },
      { code: `/* Describes the present state. */\nconst x = 1;` },
      { code: `// abc-123 lowercase is not an id\nconst x = 1;` },
      { code: `// A-1 is too short to be an id\nconst x = 1;` },
      { code: `// @ts-expect-error ABC-123\nconst x: number = "a";` },
      { code: `// prettier-ignore 2026-01-02\nconst x = 1;` },
      {
        code: `// see ABC-123\nconst x = 1;`,
        options: [{ trackerIdPattern: "\\bFE-\\d+\\b" }]
      },
      { code: `const x = "ABC-123 2026-01-02 moved here";` }
    ],
    invalid: [
      {
        code: `// Fixed in ABC-123\nconst x = 1;`,
        errors: [{ messageId: "history", data: { kind: "tracker id" } }]
      },
      {
        code: `/* see FE-3145 */\nconst x = 1;`,
        errors: [{ messageId: "history", data: { kind: "tracker id" } }]
      },
      {
        code: `// updated 2026-01-02\nconst x = 1;`,
        errors: [{ messageId: "history", data: { kind: "date" } }]
      },
      {
        code: `// moved here from the old module\nconst x = 1;`,
        errors: [{ messageId: "history", data: { kind: "history phrase" } }]
      },
      {
        code: `// Previously this returned null\nconst x = 1;`,
        errors: [{ messageId: "history", data: { kind: "history phrase" } }]
      },
      {
        code: `// corrected on review\nconst x = 1;`,
        errors: [{ messageId: "history", data: { kind: "history phrase" } }]
      },
      {
        code: `// this option was withdrawn\nconst x = 1;`,
        errors: [{ messageId: "history", data: { kind: "history phrase" } }]
      },
      {
        code: `// one ABC-1\nconst x = 1;\n// two 2026-01-02\nconst y = 2;`,
        errors: [
          { messageId: "history", line: 1 },
          { messageId: "history", line: 3 }
        ]
      },
      {
        code: `// see FE-12\nconst x = 1;`,
        options: [{ trackerIdPattern: "\\bFE-\\d+\\b" }],
        errors: [{ messageId: "history", data: { kind: "tracker id" } }]
      },
      {
        code: `// see ABC-123 and 2026-01-02\nconst x = 1;`,
        options: [{ trackerIdPattern: "\\bFE-\\d+\\b" }],
        errors: [{ messageId: "history", data: { kind: "date" } }]
      }
    ]
  });
});
