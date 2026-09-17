/**
 * @fileoverview RuleTester spec for `ui/no-inline-sfc-types` (CC4).
 *
 * Both directions, >=2 invalid discriminators: an inline macro type literal and
 * a relocated top-level interface.
 *
 * Run: node --test packages/eslint-plugin-ui/rules/no-inline-sfc-types.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-inline-sfc-types.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-inline-sfc-types", () => {
  ruleTester.run("no-inline-sfc-types", rule, {
    valid: [
      // Named type from types.ts — the law.
      { code: `const props = defineProps<TabsProps>();` },
      { code: `const emit = defineEmits<TabsEmits>();` },
      { code: `const slots = defineSlots<TabsSlots>();` },
      // A macro with no type argument is out of scope here.
      { code: `const props = defineProps(["items"]);` },
      // An interface with a name that does not belong in types.ts is untouched.
      { code: `interface Item { id: string }` },
      // Props/Emits typed elsewhere are fine when imported by name.
      { code: `import type { Props } from "./types.ts";` }
    ],
    invalid: [
      // Discriminator 1a: inline object literal in defineProps.
      {
        code: `const props = defineProps<{ items: Item[] }>();`,
        errors: [{ messageId: "inlineMacroType" }]
      },
      // Discriminator 1b: inline tuple/object literal in defineEmits.
      {
        code: `const emit = defineEmits<{ change: [v: string] }>();`,
        errors: [{ messageId: "inlineMacroType" }]
      },
      // Discriminator 1c: inline object literal in defineSlots.
      {
        code: `const slots = defineSlots<{ default: () => any }>();`,
        errors: [{ messageId: "inlineMacroType" }]
      },
      // Discriminator 2a: top-level interface Props in the SFC.
      {
        code: `interface Props { x: number }`,
        errors: [{ messageId: "relocatedInterface" }]
      },
      // Discriminator 2b: top-level interface Emits in the SFC.
      {
        code: `interface Emits { (e: "change", v: string): void }`,
        errors: [{ messageId: "relocatedInterface" }]
      }
    ]
  });
});
