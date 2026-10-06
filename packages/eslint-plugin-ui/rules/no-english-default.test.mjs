/**
 * @fileoverview RuleTester spec for `ui/no-english-default` (CC22).
 *
 * Both directions, >=2 invalid discriminators: a rendered English string and a
 * variant-token string (also flagged — the rule cannot tell them apart).
 *
 * Run: node --test packages/eslint-plugin-ui/rules/no-english-default.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-english-default.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-english-default", () => {
  ruleTester.run("no-english-default", rule, {
    valid: [
      // The law: rendered copy defaults to `undefined`.
      {
        code: `const props = withDefaults(defineProps<P>(), { label: undefined });`
      },
      // Empty string is explicitly allowed.
      {
        code: `const props = withDefaults(defineProps<P>(), { placeholder: "" });`
      },
      // A non-string default is out of scope.
      { code: `const props = withDefaults(defineProps<P>(), { count: 3 });` },
      // A string literal outside a withDefaults defaults object is untouched.
      { code: `const label = "Announcement";` }
    ],
    invalid: [
      // Discriminator 1: rendered English copy.
      {
        code: `const props = withDefaults(defineProps<P>(), { label: "Announcement" });`,
        errors: [{ messageId: "stringDefault" }]
      },
      // Discriminator 2: a variant token is also flagged (indistinguishable syntactically).
      {
        code: `const props = withDefaults(defineProps<P>(), { size: "md" });`,
        errors: [{ messageId: "stringDefault" }]
      },
      // Discriminator 3: string-literal-keyed default.
      {
        code: `const props = withDefaults(defineProps<P>(), { "title": "Details" });`,
        errors: [{ messageId: "stringDefault" }]
      }
    ]
  });
});
