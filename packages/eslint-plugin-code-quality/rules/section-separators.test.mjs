/**
 * @fileoverview RuleTester specs for `code-quality/section-separators`.
 *
 * Run: node --test packages/eslint-plugin-code-quality/rules/section-separators.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import sectionSeparators from "./section-separators.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const SEP = `// ${"-".repeat(77)}`;

test("section-separators", () => {
  ruleTester.run("section-separators", sectionSeparators, {
    valid: [
      { code: `// --- name\nconst a = 1;` },
      { code: `${SEP}\nconst a = 1;` },
      { code: `const a = 1;\n// --- next\nconst b = 2;` },
      { code: `function f() {\n  // --- step\n  return 1;\n}` },
      { code: `// plain comment\nconst a = 1;` },
      { code: `// -- not a separator\nconst a = 1;` },
      { code: `// - single dash\nconst a = 1;` },
      { code: `// = one equals\nconst a = 1;` },
      { code: `/* ==== block comments are ignored ==== */\nconst a = 1;` },
      { code: `const a = 1;` }
    ],
    invalid: [
      {
        code: `// === Section\nconst a = 1;`,
        errors: [{ messageId: "equals" }]
      },
      {
        code: `// ==========\nconst a = 1;`,
        errors: [{ messageId: "equals" }]
      },
      {
        code: `// ---\nconst a = 1;`,
        errors: [{ messageId: "length" }]
      },
      {
        code: `// ${"-".repeat(40)}\nconst a = 1;`,
        errors: [{ messageId: "length" }]
      },
      {
        code: `// ${"-".repeat(78)}\nconst a = 1;`,
        errors: [{ messageId: "length" }]
      },
      {
        code: `// --\nconst a = 1;`,
        errors: [{ messageId: "length" }]
      },
      {
        code: `function f() {\n  const a = 1;\n  // --- end\n}`,
        errors: [{ messageId: "closing" }]
      },
      {
        code: `const a = 1;\n// --- tail`,
        errors: [{ messageId: "closing" }]
      },
      {
        code: `const a = 1;\n${SEP}`,
        errors: [{ messageId: "closing" }]
      },
      {
        code: `${SEP}`,
        errors: [{ messageId: "closing" }]
      },
      {
        code: `function f() {\n  return 1;\n  ${SEP}\n}`,
        errors: [{ messageId: "closing" }]
      },
      {
        code: `// === a\n// ---\nconst a = 1;\n// --- tail`,
        errors: [
          { messageId: "equals", line: 1 },
          { messageId: "length", line: 2 },
          { messageId: "closing", line: 4 }
        ]
      }
    ]
  });
});
