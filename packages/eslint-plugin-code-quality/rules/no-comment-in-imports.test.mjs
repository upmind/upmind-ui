/**
 * @fileoverview RuleTester specs for `code-quality/no-comment-in-imports`.
 *
 * Run: node --test packages/eslint-plugin-code-quality/rules/no-comment-in-imports.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import noCommentInImports from "./no-comment-in-imports.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-comment-in-imports", () => {
  ruleTester.run("no-comment-in-imports", noCommentInImports, {
    valid: [
      { code: `import a from "a";\nimport b from "b";` },
      { code: `// header\nimport a from "a";\nimport b from "b";` },
      {
        code: `import a from "a";\nimport b from "b";\n// after\nconst x = 1;`
      },
      {
        code: `import a from "a";\nimport b from "b";\n\n/* after */\nconst x = 1;`
      },
      { code: `import a from "a";\n// after the only import\nconst x = 1;` },
      { code: `const x = 1;\n// nothing to import` }
    ],
    invalid: [
      {
        code: `import a from "a";\n// note\nimport b from "b";`,
        errors: [{ messageId: "commentInImports" }]
      },
      {
        code: `import a from "a";\n/* note */\nimport b from "b";`,
        errors: [{ messageId: "commentInImports" }]
      },
      {
        code: `import a from "a";\n// --- group\nimport b from "b";`,
        errors: [{ messageId: "commentInImports" }]
      },
      {
        code: `import a from "a"; // trailing\nimport b from "b";`,
        errors: [{ messageId: "commentInImports" }]
      },
      {
        code: `import a from "a";\n// one\nimport b from "b";\n// two\nimport c from "c";`,
        errors: [
          { messageId: "commentInImports", line: 2 },
          { messageId: "commentInImports", line: 4 }
        ]
      },
      {
        code: `import a from "a";\n\n\n// spaced\n\nimport b from "b";`,
        errors: [{ messageId: "commentInImports", line: 4 }]
      }
    ]
  });
});
