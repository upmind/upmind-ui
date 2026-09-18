/**
 * @fileoverview RuleTester spec for `ui/controlled-boolean-undefined` (CC6).
 *
 * Both directions, >=2 invalid discriminators: an identifier-keyed `false`
 * default and a string-literal-keyed `false` default.
 *
 * Run: node --test packages/eslint-plugin-ui/rules/controlled-boolean-undefined.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./controlled-boolean-undefined.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("controlled-boolean-undefined", () => {
  ruleTester.run("controlled-boolean-undefined", rule, {
    valid: [
      // The law: a controlled boolean falls through as `undefined`.
      { code: `const props = withDefaults(defineProps<P>(), { open: undefined });` },
      // `true` is a real default, not a pinned controlled `false`.
      { code: `const props = withDefaults(defineProps<P>(), { loop: true });` },
      // Non-boolean defaults are out of scope for this rule.
      { code: `const props = withDefaults(defineProps<P>(), { size: "md" });` },
      // A bare defineProps with no withDefaults is untouched.
      { code: `const props = defineProps<P>();` },
      // A `false` outside a withDefaults defaults object is not this rule's concern.
      { code: `const flag = false;` }
    ],
    invalid: [
      // Discriminator 1: identifier-keyed `false` default.
      {
        code: `const props = withDefaults(defineProps<P>(), { open: false });`,
        errors: [{ messageId: "booleanFalseDefault" }]
      },
      // Discriminator 2: string-literal-keyed `false` default.
      {
        code: `const props = withDefaults(defineProps<P>(), { "modelValue": false });`,
        errors: [{ messageId: "booleanFalseDefault" }]
      },
      // Discriminator 3: two `false` defaults report twice.
      {
        code: `const props = withDefaults(defineProps<P>(), { open: false, disabled: false });`,
        errors: [
          { messageId: "booleanFalseDefault" },
          { messageId: "booleanFalseDefault" }
        ]
      }
    ]
  });
});
