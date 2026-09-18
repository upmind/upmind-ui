/**
 * @fileoverview Self-contained RuleTester spec for `ui/no-cva-in-composed` (CC3a).
 *
 * Run: node --test packages/eslint-plugin-ui/rules/no-cva-in-composed.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-cva-in-composed.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-cva-in-composed", () => {
  ruleTester.run("no-cva-in-composed", rule, {
    valid: [
      { code: `import { computed } from "vue";\nconst x = computed(() => 1);` },
      { code: `import { clsx } from "clsx";` },
      { code: `const y = merge({}, {});` }
    ],
    invalid: [
      {
        code: `import { cva } from "class-variance-authority";`,
        errors: [{ messageId: "cvaImport" }]
      },
      {
        code: `import { cva } from "../../lib/variants";`,
        errors: [{ messageId: "cvaImport" }]
      },
      {
        code: `import { cn } from "../../lib/utils";`,
        errors: [{ messageId: "cnImport" }]
      },
      {
        code: `const classes = cn("x", "y");`,
        errors: [{ messageId: "cnCall" }]
      }
    ]
  });
});
