/**
 * @fileoverview Self-contained RuleTester spec for `ui/slot-return-vnode` (CC5b).
 *
 * Run: node --test packages/eslint-plugin-ui/rules/slot-return-vnode.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./slot-return-vnode.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("slot-return-vnode", () => {
  ruleTester.run("slot-return-vnode", rule, {
    valid: [
      { code: `defineSlots<{ item(props: { x: number }): VNode[] }>();` },
      { code: `defineSlots<{ header(): VNode[]; footer(): VNode[] }>();` },
      // Named type — this rule does not fire (Lint 4 owns the inline-literal ban).
      { code: `defineSlots<TabsSlots>();` }
    ],
    invalid: [
      {
        code: `defineSlots<{ item(): any }>();`,
        errors: [{ messageId: "weakSlotReturn" }]
      },
      {
        code: `defineSlots<{ item(): unknown }>();`,
        errors: [{ messageId: "weakSlotReturn" }]
      },
      {
        code: `defineSlots<{ item(props: { x: number }) }>();`,
        errors: [{ messageId: "weakSlotReturn" }]
      },
      {
        code: `defineSlots<{ item: () => any }>();`,
        errors: [{ messageId: "weakSlotReturn" }]
      }
    ]
  });
});
