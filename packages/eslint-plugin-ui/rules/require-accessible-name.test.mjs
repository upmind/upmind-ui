/**
 * @fileoverview RuleTester spec for `ui/require-accessible-name` (CC20, Lint 14).
 *
 * Self-contained: run with `node --test rules/require-accessible-name.test.mjs`.
 * Both directions, ≥2 discriminators each.
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./require-accessible-name.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("require-accessible-name", () => {
  ruleTester.run("require-accessible-name", rule, {
    valid: [
      // `title` present in an inline defineProps type literal.
      { code: `defineProps<{ title?: string }>();` },
      // `ariaLabel` present in a local interface Props.
      { code: `interface Props { ariaLabel: string }` },
      // `label` present alongside a non-naming prop.
      { code: `defineProps<{ items: string[]; label: string }>();` },
      // FALSE-POSITIVE BOUNDARY: a bare named external props type is not
      // inspectable, so the rule does NOT fire even with no naming prop here.
      { code: `defineProps<TabsProps>();` },
      // No inspectable props declaration at all → nothing to check.
      { code: `const x = 1;` },
      // A local interface that is NOT `Props` is not the props source.
      { code: `interface Item { size: string }` }
    ],
    invalid: [
      // Inline type literal with no naming prop.
      {
        code: `defineProps<{ items: Item[] }>();`,
        errors: [{ messageId: "missingAccessibleName" }]
      },
      // Local interface Props with no naming prop.
      {
        code: `interface Props { size: string }`,
        errors: [{ messageId: "missingAccessibleName" }]
      },
      // Multiple non-naming props, still no naming prop → one report.
      {
        code: `defineProps<{ size: string; disabled: boolean }>();`,
        errors: [{ messageId: "missingAccessibleName" }]
      }
    ]
  });
});
