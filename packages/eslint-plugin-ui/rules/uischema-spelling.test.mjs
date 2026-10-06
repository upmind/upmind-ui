import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./uischema-spelling.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("uischema-spelling", () => {
  ruleTester.run("uischema-spelling", rule, {
    valid: [
      { code: `const productUischema = {};` },
      { code: `function useProductConfigUischema() {}` },
      { code: `type ProductUischema = {};` },
      {
        code: `import { UISchemaElement } from "x"; const e: UISchemaElement = {};`
      },
      {
        code: `import { UiSchema } from "x"; type A = UiSchema; const s: A = {};`
      },
      { code: `const schema = {};` }
    ],
    invalid: [
      {
        code: `const productUiSchema = {};`,
        errors: [{ messageId: "spelling", data: { name: "productUiSchema" } }]
      },
      {
        code: `type UISchemaElement = {};`,
        errors: [{ messageId: "spelling", data: { name: "UISchemaElement" } }]
      },
      {
        code: `function useUISchema() {}`,
        errors: [{ messageId: "spelling", data: { name: "useUISchema" } }]
      },
      {
        code: `const aUiSchema = bUISchema;`,
        errors: [{ messageId: "spelling" }, { messageId: "spelling" }]
      }
    ]
  });
});
