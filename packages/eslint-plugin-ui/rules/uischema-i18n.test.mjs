import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./uischema-i18n.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const file = "modules/foo/foo.schemas.ts";
const actorFile = "modules/foo/foo.schemas.client.ts";

test("uischema-i18n", () => {
  ruleTester.run("uischema-i18n", rule, {
    valid: [
      {
        code: `const e = { type: "Control", scope: "#/properties/name", i18n: "name" };`,
        filename: file
      },
      {
        code: `const e = { type: "Control", scope: "#/properties/name", "i18n": "name" };`,
        filename: actorFile
      },
      {
        code: `const e = { type: "Control", scope: "#/properties/name" };`,
        filename: "modules/foo/foo.utils.ts"
      },
      { code: `const e = { type: "string" };`, filename: file },
      { code: `const e = { type: kind };`, filename: file },
      {
        code: `const e = { type: "Group", elements: [] };`,
        filename: file,
        options: [{ types: ["Control"] }]
      },
      {
        code: `const e = { type: "VerticalLayout", i18n: "a", elements: [{ type: "Control", i18n: "b" }] };`,
        filename: file
      }
    ],
    invalid: [
      {
        code: `const e = { type: "Control", scope: "#/properties/name" };`,
        filename: file,
        errors: [{ messageId: "missingI18n", data: { type: "Control" } }]
      },
      {
        code: `const e = { type: "Control", scope: "#/properties/name" };`,
        filename: actorFile,
        errors: [{ messageId: "missingI18n" }]
      },
      {
        code: `const e = { type: "Group", elements: [] };`,
        filename: file,
        errors: [{ messageId: "missingI18n", data: { type: "Group" } }]
      },
      {
        code: `const e = { type: "Label", text: "x" };`,
        filename: file,
        errors: [{ messageId: "missingI18n", data: { type: "Label" } }]
      },
      {
        code: `const e = { type: "Category", elements: [] };`,
        filename: file,
        errors: [{ messageId: "missingI18n" }]
      },
      {
        code: `const e = { type: "Categorization", elements: [] };`,
        filename: file,
        errors: [{ messageId: "missingI18n" }]
      },
      {
        code: `const e = { type: "HorizontalLayout", elements: [] };`,
        filename: file,
        errors: [{ messageId: "missingI18n" }]
      },
      {
        code: `const e = { type: "VerticalLayout", elements: [{ type: "Control", scope: "x" }] };`,
        filename: file,
        errors: [
          { messageId: "missingI18n", data: { type: "VerticalLayout" } },
          { messageId: "missingI18n", data: { type: "Control" } }
        ]
      },
      {
        code: `const e = { type: "Custom" };`,
        filename: file,
        options: [{ types: ["Custom"] }],
        errors: [{ messageId: "missingI18n", data: { type: "Custom" } }]
      },
      {
        code: `const e = { type: "Control" };`,
        filename: file,
        options: [{ types: ["Control"] }],
        errors: [{ messageId: "missingI18n" }]
      }
    ]
  });
});
