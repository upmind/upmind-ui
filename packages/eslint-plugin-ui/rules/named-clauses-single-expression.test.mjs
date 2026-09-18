/**
 * @fileoverview RuleTester specs for `ui/named-clauses-single-expression`
 * (CC13a, narrow ternary-in-meta core).
 *
 * Run: node --test packages/eslint-plugin-ui/rules/named-clauses-single-expression.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import namedClausesSingleExpression from "./named-clauses-single-expression.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("named-clauses-single-expression", () => {
  ruleTester.run(
    "named-clauses-single-expression",
    namedClausesSingleExpression,
    {
      valid: [
        // Single-expression derivation, no ternary.
        { code: `const meta = { open: state.isOpen };` },
        // Logical expression is still a single expression, not a ternary.
        { code: `const meta = { hasItems: items.length > 0 };` },
        // A ternary elsewhere (not in a `meta` object) is out of scope.
        { code: `const label = x ? "a" : "b";` },
        // A ternary in some other object is out of scope.
        { code: `const notMeta = { label: x ? "a" : "b" };` }
      ],
      invalid: [
        // Ternary in a meta property.
        {
          code: `const meta = { label: x ? "a" : "b" };`,
          errors: [{ messageId: "ternaryInMeta" }]
        },
        // A second ternary-bearing property, alongside a clean one.
        {
          code: `const meta = { open: state.isOpen, label: x ? "a" : "b" };`,
          errors: [{ messageId: "ternaryInMeta" }]
        }
      ]
    }
  );
});
