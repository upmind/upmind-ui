/**
 * @fileoverview RuleTester spec for `ui/require-empty-state` (CC21, Lint 15).
 *
 * Self-contained: run with `node --test rules/require-empty-state.test.mjs`.
 * Both directions, ≥2 discriminators each.
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./require-empty-state.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("require-empty-state", () => {
  ruleTester.run("require-empty-state", rule, {
    valid: [
      // Collection prop + a `meta.isEmpty` reference.
      {
        code: `defineProps<{ items: Item[] }>();\nconst show = meta.isEmpty ? 0 : 1;`
      },
      // Collection prop + a `defineSlots` `empty` member.
      {
        code: `defineProps<{ options: Option[] }>();\ndefineSlots<{ empty(): VNode[] }>();`
      },
      // Collection prop in a local interface Props + `meta.isEmpty`.
      {
        code: `interface Props { rows: Row[] }\nconst e = meta.isEmpty;`
      },
      // No collection prop: a plural NAME but a non-array type does not count.
      { code: `defineProps<{ status: string }>();` },
      // No array type: a scalar prop is not a collection prop.
      { code: `defineProps<{ items: number }>();` },
      // FALSE-POSITIVE BOUNDARY: a bare named external props type is not
      // inspectable, so the rule does NOT fire.
      { code: `defineProps<TabsProps>();` },
      // `Array<T>` generic form is handled and satisfied by `meta.isEmpty`.
      {
        code: `defineProps<{ items: Array<Item> }>();\nconst e = meta.isEmpty;`
      }
    ],
    invalid: [
      // Inline `items: T[]` with no empty signal.
      {
        code: `defineProps<{ items: Item[] }>();`,
        errors: [{ messageId: "missingEmptyState" }]
      },
      // Inline `Array<T>` collection with no empty signal.
      {
        code: `defineProps<{ options: Array<Option> }>();`,
        errors: [{ messageId: "missingEmptyState" }]
      },
      // Plural-named array prop (`rows`) in a local interface, no signal.
      {
        code: `interface Props { rows: Row[] }`,
        errors: [{ messageId: "missingEmptyState" }]
      }
    ]
  });
});
