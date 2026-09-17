/**
 * @fileoverview RuleTester specs for `ui/no-as-child-prop` (CC19).
 *
 * Run: node --test packages/eslint-plugin-ui/rules/no-as-child-prop.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import noAsChildProp from "./no-as-child-prop.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-as-child-prop", () => {
  ruleTester.run("no-as-child-prop", noAsChildProp, {
    valid: [
      // Inline defineProps type without asChild.
      { code: `defineProps<{ title: string; disabled?: boolean }>();` },
      // Named Props interface without asChild.
      { code: `interface Props { title: string; disabled?: boolean }` },
      // withDefaults defaults object without asChild.
      {
        code: `withDefaults(defineProps<Props>(), { disabled: false });`
      },
      // A property merely containing "asChild" as a substring is not asChild.
      { code: `interface Props { asChildish: boolean }` }
    ],
    invalid: [
      // Inline defineProps type.
      {
        code: `defineProps<{ asChild?: boolean }>();`,
        errors: [{ messageId: "asChildProp" }]
      },
      // Named Props interface.
      {
        code: `interface Props { asChild: boolean }`,
        errors: [{ messageId: "asChildProp" }]
      },
      // withDefaults defaults object.
      {
        code: `withDefaults(defineProps<Props>(), { asChild: false });`,
        errors: [{ messageId: "asChildProp" }]
      },
      // String-literal key form in an interface.
      {
        code: `interface Props { "asChild": boolean }`,
        errors: [{ messageId: "asChildProp" }]
      }
    ]
  });
});
