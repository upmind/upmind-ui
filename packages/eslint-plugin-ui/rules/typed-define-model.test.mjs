import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./typed-define-model.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("typed-define-model", () => {
  ruleTester.run("typed-define-model", rule, {
    valid: [
      { code: `const value = defineModel<string>();` },
      { code: `const value = defineModel<string>("name");` },
      { code: `const value = defineModel<number>({ default: 0 });` },
      { code: `const value = defineProps();` },
      { code: `const value = other.defineModel();` }
    ],
    invalid: [
      {
        code: `const value = defineModel();`,
        errors: [{ messageId: "untypedModel" }]
      },
      {
        code: `const value = defineModel("x");`,
        errors: [{ messageId: "untypedModel" }]
      },
      {
        code: `const value = defineModel({ default: 1 });`,
        errors: [{ messageId: "untypedModel" }]
      },
      {
        code: `const a = defineModel(); const b = defineModel<string>("b"); const c = defineModel("c");`,
        errors: [{ messageId: "untypedModel" }, { messageId: "untypedModel" }]
      }
    ]
  });
});
