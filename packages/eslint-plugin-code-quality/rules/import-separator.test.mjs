/**
 * @fileoverview RuleTester specs for `code-quality/import-separator`.
 *
 * Run: node --test packages/eslint-plugin-code-quality/rules/import-separator.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import importSeparator from "./import-separator.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const SEP = `// ${"-".repeat(77)}`;

test("import-separator", () => {
  ruleTester.run("import-separator", importSeparator, {
    valid: [
      { code: `import a from "a";\n${SEP}\nconst x = a;` },
      { code: `import a from "a";\n\n\n${SEP}\nconst x = a;` },
      {
        code: `import a from "a";\nimport b from "b";\n${SEP}\nconst x = a + b;`
      },
      { code: `const x = 1;` },
      { code: `` }
    ],
    invalid: [
      {
        code: `import a from "a";\nconst x = a;`,
        output: `import a from "a";\n${SEP}\nconst x = a;`,
        errors: [{ messageId: "missing" }]
      },
      {
        code: `import a from "a";\nimport b from "b";\nconst x = a + b;`,
        output: `import a from "a";\nimport b from "b";\n${SEP}\nconst x = a + b;`,
        errors: [{ messageId: "missing" }]
      },
      {
        code: `import a from "a";`,
        output: `import a from "a";\n${SEP}`,
        errors: [{ messageId: "missing" }]
      },
      {
        code: `import a from "a";\n// ${"-".repeat(40)}\nconst x = a;`,
        output: `import a from "a";\n${SEP}\n// ${"-".repeat(40)}\nconst x = a;`,
        errors: [{ messageId: "missing" }]
      },
      {
        code: `import a from "a";\n${SEP}\nimport b from "b";\nconst x = a + b;`,
        output: `import a from "a";\n${SEP}\nimport b from "b";\n${SEP}\nconst x = a + b;`,
        errors: [{ messageId: "missing" }]
      }
    ]
  });
});
